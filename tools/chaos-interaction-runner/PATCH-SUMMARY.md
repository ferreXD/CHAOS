# PATCH SUMMARY — CHAOS Interaction Runtime, Iteration 5 (live auto-resume runner)

**Scope:** A local live auto-resume runner that executes a CHAOS command through a
configured agent adapter, pauses on material decisions, and auto-resumes the same
live session while a runner lease is alive — falling back to Iteration 4's
`chaos:resume` for any dead/closed/unknown session.
**Date:** 2026-07-07

> Iteration 5's primary deliverable is the new package `tools/chaos-interaction-runner`.
> It also makes one small additive runtime API addition and adds a runtime contract +
> schema. See "Files modified outside runner" below. No root `PATCH-SUMMARY.md` created.

## Confirmation: no production code modified

No production application source, production tests, migrations, OpenSpec changes, ADR
content, `.github/prompts`, or existing CHAOS command contracts were changed. All
changes are confined to the interaction-runtime tooling (`tools/`), the additive
runtime contract/schema + README pointer under `.chaos/interactions/`, and a minimal
Decision Center doc note.

## Files added (runner package)

```
tools/chaos-interaction-runner/
  package.json, tsconfig.json, tsconfig.build.json, README.md, PATCH-SUMMARY.md
  examples/runner.example.json
  src/index.ts
  src/runtime.ts                      # bridge to the Iteration 1 runtime (source import)
  src/logger.ts
  src/cli/chaos-interaction-runner.ts # run + run-mock
  src/config/runnerConfig.ts
  src/protocol/runnerResult.ts        # runner states, outcomes, stop reasons, result
  src/protocol/errors.ts
  src/runtime/runtimeClient.ts        # read-mostly wrapper over InteractionRuntime
  src/runtime/mcpClient.ts            # agent MCP env prep (runner does NOT call MCP itself)
  src/runtime/sessionLease.ts         # lease register/heartbeat/release + stop flag
  src/runtime/decisionWatcher.ts      # observe() + fs.watch latency helper
  src/runtime/resumeCoordinator.ts    # chaos:resume fallback (ensure capsule + instruction)
  src/runner/commandProcess.ts        # AgentSessionAdapter + Mock + Process adapters
  src/runner/autoResumePolicy.ts      # pure auto-resume decision
  src/runner/stopConditions.ts        # pure stop predicates + response validation
  src/runner/runnerState.ts           # runner state machine guard
  src/runner/runnerLoop.ts            # the tick-driven control loop
  src/runner/chaosRunner.ts           # high-level wiring + async run()
  src/runner/transcriptAdapter.ts     # compact resume message (references capsule path)
  src/audit/runnerAudit.ts            # runners/<id>.audit.jsonl
  test/helpers.ts
  test/runnerLoop.test.ts
  test/autoResumePolicy.test.ts
  test/decisionWatcher.test.ts
  test/sessionLease.test.ts
  test/stopConditions.test.ts
  test/runnerArtifacts.test.ts
```

## Files modified outside runner

- `tools/chaos-interaction-runtime/src/services/interactionRuntime.ts` — added
  `resumeCommand(commandRunId)` (`ready-to-resume → resumed → running`). This is the
  **smallest compatible** runtime addition the runner needs; see "API gap" below.
- `tools/chaos-interaction-runtime/test/resumeCommand.test.ts` — new tests for it.
- `.chaos/interactions/schema/runner-lease.schema.json` — new (requested by the brief).
- `.chaos/interactions/contracts/runner-lease-contract.md` — new (requested by the brief).
- `.chaos/interactions/README.md` — additive contract-table row + Iteration 4/5 pointers.
- `extensions/chaos-decision-center/README.md` — minimal note on live auto-resume vs
  the Ready-to-Resume fallback (no UI redesign).

## Runner states

`created → starting → running → waiting-for-decision → auto-resuming → running …`,
terminating in `completed | cancelled | failed | abandoned | ready-for-manual-resume`.

## Lease model

`.chaos/interactions/runners/<runnerId>.json` (schema-validated). Heartbeat-based
liveness: refreshed every tick; `leaseExpiresAt = lastHeartbeatAt + sessionLeaseTtlMs`.
Only a live lease permits auto-resume. Process id is advisory. An expired/released
lease keeps its file (for audit) but never deletes runtime state. Manual stop flag:
`.chaos/interactions/runners/<runnerId>.stop`.

## Auto-resume policy

Auto-resume only when: auto-resume enabled, runner alive, adapter supports resume,
response valid, rationale satisfied, and `cyclesUsed < maxAutoResumeCycles`. Otherwise
`READY_FOR_MANUAL_RESUME`. The runner advances the session
`ready-to-resume → resumed → running` (via `resumeCommand`) before forwarding a compact
resume message that **references the capsule path** — never inlined bodies.

## Adapter approach

`AgentSessionAdapter` = `supportsResume/start/send/stop/isAlive/outcome`. `send()`
returns an `AgentAck`; the runner marks a decision consumed **only** on an explicit
`acknowledgedDecisionId`. `MockAgentSessionAdapter` acknowledges (tests + `run-mock`);
`ProcessAgentSessionAdapter` spawns a configured command and, only with
`--allow-process-resume`, writes the resume message to stdin — but returns **no** ack,
so it never auto-consumes and prefers `READY_FOR_MANUAL_RESUME`. A Claude-Code session
adapter is a documented follow-up (needs a safe, acknowledged control channel).

## Safety stop conditions

max-cycles-reached, invalid-response, missing-rationale, decision-cancelled/expired/
superseded, new-material-decision (opt-in), malformed-state, lease-expired,
process-dead, adapter-cannot-resume, auto-resume-disabled, run-mismatch, lock-conflict,
pending-decision-exists, session-missing, manual-stop-flag. Every terminal path writes
runner audit and, when resumable, ensures a capsule and surfaces `chaos:resume --run`.

## Tests added / validation performed

- Runner `node --test` → **42 pass**: loop (15 brief scenarios + adapter-cannot-resume),
  auto-resume policy (8), decision watcher (8), session lease (5), stop conditions (7),
  static artifacts.
- Runtime `node --test` → **38 pass** (added 5 `resumeCommand` tests to the prior 33).
- MCP `node --test` and Decision Center `node --test` — unchanged (no code changes);
  re-run to confirm the runtime addition did not regress them.
- `tsc --noEmit` (typecheck) and `tsc` (build) clean for runner + runtime.

## Manual smoke status

Documented (see README + Decision Center MANUAL-SMOKE-TEST): start Decision Center →
launch runner (`run-mock` or `run`) → answer a decision → observe auto-resume → confirm
no manual `chaos:resume` needed; then repeat with the runner killed before the answer
and confirm the session stays `ready-to-resume` for `chaos:resume`. The `run-mock`
scenario is self-contained and exercised by the automated loop tests; the full
Decision-Center-in-the-loop smoke needs an interactive VS Code session (not executed
here).

## Known limitations

- The generic process adapter cannot prove a live agent consumed the resume message
  (no ack channel), so its auto-resume path is conservative: it prefers
  `READY_FOR_MANUAL_RESUME` and never auto-consumes. Real Claude-Code live continuation
  needs a dedicated, acknowledged session adapter (follow-up).
- Mid-run detection of an externally-changed lock is limited; lock conflicts are caught
  at `beginCommand`. A concurrent conflicting lock acquired after start is not actively
  polled (documented, low-risk for a single local runner).
- `fs.watch` recursive mode is a latency optimisation only; correctness relies on the
  poll loop.

## Explicit non-goals (not implemented, by design)

Arbitrary chat-thread control; automatic opening/manipulation of Claude/Copilot chat
windows; cloud runner; multi-user remote approval; GitHub/Azure issue sync;
`chaos:delete`/discard; broad command/MCP/Decision-Center rewrites; any production
application change.

## API gap recorded (and resolved minimally)

The Iteration 1 runtime had no operation to move a session
`ready-to-resume → running`, which the live runner needs so an answered session can
accept the next step. Rather than silently redesign, Iteration 5 added the smallest
compatible operation `InteractionRuntime.resumeCommand()` (idempotent when running,
refuses non-resumable states, audits via the existing `auto-resume-started` event, no
schema change). No other runtime/MCP API gap was found for Iteration 5.

## Addendum (2026-07-07) — Claude Code session adapter implemented

The Iteration 5 follow-up ("a Claude-Code session adapter with a real acknowledgement
channel") is now built. It completes live auto-resume for real Claude Code sessions.

- **New:** `src/runner/claudeCodeAdapter.ts` (`ClaudeCodeSessionAdapter` + launch-prompt /
  arg builders), `src/runner/streamJson.ts` (pure stream-json parser — the single seam for
  the CLI wire format), `src/config/featureGate.ts` (reads `autoResume.enabled`/`adapter`
  from `.chaos/config.yaml`).
- **Modified:** `src/config/runnerConfig.ts` (`sessionAdapter`, `claudeModel`,
  `claudePermissionMode`, `agentAckTimeoutMs`, `forceAdapter`), `src/cli/…` (`--session-adapter`
  selection + feature gate + always stops the adapter), `src/runner/runnerLoop.ts`
  (idempotent consume — never double-consumes if the live agent consumed the decision itself).
- **Mechanism:** one long-lived `claude -p --input-format stream-json --output-format
  stream-json --verbose` process. The launched agent re-enters the runner's `commandRunId`
  (runtime re-entry — no command-contract change), stops on decisions, and does not
  self-consume. `send()` returns an ack only when the resumed turn completes (`result`
  event); the runner consumes on that ack. On no-ack/timeout it leaves the session for
  `chaos:resume`.
- **Feature-flagged:** refuses to run unless `autoResume.enabled: true` and
  `adapter: claude-code` (or `--force-adapter`). **Full autonomy** once enabled
  (`--permission-mode acceptEdits` default) — a deliberate product choice.
- **Tests:** runner `node --test` → **69 pass** (added stream-json parser, adapter-via-fake-
  claude-stub incl. ack-timeout + outcome, feature gate, and loop idempotent-consume). Runtime
  `node --test` → **38 pass** (unchanged). `tsc` typecheck + build clean.
- **No** production code, command-contract, MCP, Decision Center, or diagnostics changes.

## Self-audit

- **Production code changed:** no.
- **Auto-resume only for runner-controlled sessions:** yes — gated on a live lease and a
  live, resume-capable adapter; dead/expired/unknown → `chaos:resume`.
- **Dead-session fallback to `chaos:resume`:** yes — verified by tests 7–10 and the
  adapter-cannot-resume test (each leaves `READY_FOR_MANUAL_RESUME` + a `chaos:resume`
  instruction and does not consume decisions).
- **Runtime/MCP API gap remaining:** none beyond the `resumeCommand` addition above.
- **Follow-up before command-contract integration:** a Claude-Code session adapter with
  a real acknowledgement channel; optional MCP runner-lease tools if lease management
  ever needs to move out of the runner process (kept in-runner for Iteration 5).
