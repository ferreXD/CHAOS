# Command Preflight Protocol

Every runtime-aware CHAOS command performs an interaction-runtime preflight before
doing work, when the runtime is available **and command integration is enabled**.

## Step 0 — Enablement gate (feature flag)

Read `policies.interactionRuntime.commands.enabled` from `.chaos/config.yaml`
(default `true` when absent).

- `enabled: true` → follow this protocol (runtime preflight, runtime decisions,
  Decision Center / `chaos:resume` handoff).
- `enabled: false` → **opt-out**. Do NOT create runtime decisions or require the
  Decision Center. Fall back to the command's classic in-chat interactive decision
  behaviour (`policies.interactionRuntime.commands.fallbackWhenDisabled`, default
  `chat-interactive`): ask the material decision directly in chat, one at a time, and
  STOP after presenting it — the human still decides. This is a genuine opt-out, not a
  silent bypass: you are using the configured fallback, not ignoring a decision.

Diagnostics respect the same flag: when it is `false`, the command-contract probe
reports integration as *disabled by config*, not as a gap.

The rest of this protocol applies only when the gate is `true`.

## Steps

1. **Resolve command identity**
   - `sourceCommand` (e.g. `chaos:apply`)
   - `changeId` if applicable
   - `mode` (`light` / `standard` / `strict`)
   - `adapter: claude`
   - `commandRunId` if provided or resuming

2. **Prefer MCP** — call `chaos_begin_command` when MCP is available.

3. **Interpret the result** (`BeginResult.status`):
   - `READY` → proceed.
   - `RESUME_AVAILABLE` → a ready-to-resume session exists; stop and delegate to
     `chaos:resume` (unless this command *is* `chaos:resume`).
   - `BLOCKED_BY_PENDING_DECISION` → STOP. Direct the user to the Decision Center to
     answer, then `chaos:resume`. Never bypass.
   - `CONFLICTING_COMMAND_ACTIVE` → STOP, unless this command is explicitly read-only
     and compatible under the lock policy (`chaos:status`, `chaos:doctor`,
     `chaos:help`, `chaos:todo --dry-run`, matching-session `chaos:resume`).
   - `RUNTIME_UNAVAILABLE` → follow `fallback-protocol.md`.

4. **Honour `mustStop`** — any runtime result with `mustStop: true` means stop now.

## Read-only compatibility

A read-only command may proceed despite a pending decision only if the lock policy
marks it compatible. Even then it must **report, not fix**, and must not mutate the
blocked change's state.

## Fallback

If MCP is unavailable, read `.chaos/interactions/` directly only if this command's
contract allows fallback; cap confidence to MEDIUM; do not invent missing runtime
context; do not hand-write runtime state (see `fallback-protocol.md`).
