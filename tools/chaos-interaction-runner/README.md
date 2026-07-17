# CHAOS Interaction Runner (Iteration 5)

A **local live auto-resume runner** for the CHAOS Interaction Runtime. It executes
a CHAOS command through a configured agent adapter, pauses when the command needs a
material human decision, waits for the answer (via the Decision Center / MCP), and
**auto-resumes the same live session** while the runner is still alive.

```text
The chat thread is not the source of truth. The interaction runtime is.
Auto-resume is allowed only for live, runner-controlled sessions.
Dead, closed, timed-out, or unknown sessions fall back to chaos:resume.
```

This iteration complements — it does **not** replace — Iteration 4's `chaos:resume`.

## What it does

1. Starts a CHAOS command through the runtime (`beginCommand`) and registers a live
   **lease** (`.chaos/interactions/runners/<runnerId>.json`).
2. Launches the command through an **agent adapter** (mock or generic process).
3. When the command reaches a material decision, the runtime records it and returns
   `WAITING_FOR_USER_DECISION` / `mustStop`; the runner pauses and watches for the
   response (file watch + polling fallback — never a busy loop).
4. When the human answers in the Decision Center, the runner validates the response
   and — **only if it is safe and the runner is still alive** — advances the session
   (`ready-to-resume → resumed → running`) and forwards a compact resume message into
   the live agent.
5. If another decision appears, the loop repeats up to `maxAutoResumeCycles`.
6. On any stop condition, the runner leaves the session `ready-to-resume` and prints
   `chaos:resume --run <commandRunId>`.

## What it explicitly does NOT do

- It does not control arbitrary existing Claude/Copilot chat windows. It controls
  only executions it launched through an adapter.
- It does not auto-resume dead/expired/unknown sessions — those fall back to
  `chaos:resume`.
- No cloud runner, no multi-user remote approval, no GitHub/Azure sync, no
  `chaos:delete`, no MCP/Decision-Center redesign, no production application changes.

## Liveness = a fresh lease heartbeat (not a pid)

A crashed runner cannot refresh its lease, so its lease expires and the session is no
longer auto-resumable. An expired lease **never** deletes runtime state. See
[`.chaos/interactions/contracts/runner-lease-contract.md`](../../.chaos/interactions/contracts/runner-lease-contract.md).

Lease health is surfaced (read-only) by `tools/chaos-interaction-diagnostics` (Iteration 7):
`chaos:doctor` reports expired runner leases and points to `chaos:resume --run <id>`; diagnostics
never deletes lease files or mutates runtime state.

## Auto-resume safety

Auto-resume stops (and hands off to `chaos:resume`) on any of:

- `maxAutoResumeCycles` reached
- invalid response / missing required rationale
- decision cancelled / expired / superseded
- a new material decision (when `stopOnNewMaterialDecision`)
- malformed runtime state
- runner lease expired
- agent process no longer alive
- adapter cannot inject a resume message
- same-change lock conflict
- manual stop flag (`.chaos/interactions/runners/<runnerId>.stop`)

## Decision consumption (conservative)

The runner marks a decision **consumed only after** the agent adapter returns an
explicit acknowledgement that it received the resume message. The generic process
adapter provides **no** acknowledgement, so on that path the decision is left
answered for `chaos:resume` / the command contract. The runner never falsely consumes
a decision.

## Adapters

| Adapter | Resume support | Use |
|---|---|---|
| `MockAgentSessionAdapter` | yes (acknowledges) | tests + `run-mock` |
| `ProcessAgentSessionAdapter` | off by default | spawn a configured command; forwards a resume message to stdin only when `--allow-process-resume` is set. Without an acknowledgement channel it prefers `READY_FOR_MANUAL_RESUME`. |
| `ClaudeCodeSessionAdapter` | yes (acknowledges) | drive a **headless live Claude Code session** (`--session-adapter claude-code`). Keeps one session across cycles via `claude -p --input-format stream-json --output-format stream-json`; the streamed turn-completion event is the real acknowledgement. Gated by the `autoResume` feature flag. |

### Claude Code adapter

The `claude-code` adapter launches a real headless Claude Code session that executes
the command, pauses on material decisions, and continues the **same live session**
after the human answers in the Decision Center. It refuses to start unless
`.chaos/config.yaml` opts in:

```yaml
policies:
  interactionRuntime:
    autoResume:
      enabled: true
      adapter: claude-code
```

The launched agent adopts the runner's `commandRunId` (the runtime supports re-entry),
stops on each material decision, and does not consume decisions itself — **the runner
owns consumption** (only on an acknowledged turn-completion). The wire format lives
behind one seam (`src/runner/streamJson.ts`).

> **Full autonomy:** once the flag is on, the headless agent runs with a broad
> permission posture (`--permission-mode acceptEdits` by default, overridable via
> `--claude-permission-mode`) and can edit code between decisions with no per-step gate.
> This is deliberate and gated **only** by the feature flag. `--force-adapter` bypasses
> the gate for local dev.

## CLI

```bash
# Live auto-resume via a headless Claude Code session (requires the autoResume flag):
node src/cli/chaos-interaction-runner.ts run --session-adapter claude-code \
  --command "chaos:propose request-context-middleware" --change request-context-middleware

# Run a configured generic agent command under runner control:
node src/cli/chaos-interaction-runner.ts run \
  --command "chaos:apply request-context-middleware" --change request-context-middleware

# Self-contained mock demo (auto-answers decisions like the Decision Center would):
node src/cli/chaos-interaction-runner.ts run-mock --scenario pending-decision-then-answer
```

`claude-code` flags: `--claude-model <m>`, `--claude-permission-mode <mode>`
(default `acceptEdits`), `--agent-ack-timeout-ms <n>`, `--force-adapter` (bypass the
feature gate for local dev). Extra `--agent-args` are appended to the `claude` CLI.

PowerShell (same flags):

```powershell
node src/cli/chaos-interaction-runner.ts run-mock --scenario pending-decision-then-answer
```

## Configuration

Precedence: CLI args > env vars > `--config <file>` > defaults. See
[`examples/runner.example.json`](examples/runner.example.json) and
`src/config/runnerConfig.ts`. Key env vars: `CHAOS_INTERACTIONS_ROOT`,
`CHAOS_RUNNER_AGENT_COMMAND`, `CHAOS_RUNNER_AGENT_ARGS`,
`CHAOS_RUNNER_MAX_AUTO_RESUME_CYCLES`, `CHAOS_RUNNER_DECISION_POLL_MS`,
`CHAOS_RUNNER_LEASE_TTL_MS`, `CHAOS_RUNNER_LOG_LEVEL`. Never hardcode a Claude
absolute path — use `agentCommand` + `PATH`.

## Runner states

```text
created → starting → running → waiting-for-decision → auto-resuming → running …
                                     ↘ completed | cancelled | failed | ready-for-manual-resume | abandoned
```

## Scripts

```bash
npm test        # node --test (zero-dependency, type-stripped)
npm run typecheck
npm run build
```

## Relationship to the other iterations

- Iteration 1 runtime — the source of truth (consumed from source via `src/runtime.ts`).
- Iteration 2 MCP — the agent's tool surface (the runner and MCP share the same files;
  the runner reads the runtime directly, the launched agent uses MCP).
- Iteration 3 Decision Center — where the human answers.
- Iteration 4 `chaos:resume` — the fallback whenever live auto-resume cannot proceed.
