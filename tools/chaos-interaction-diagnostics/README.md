# CHAOS Interaction Diagnostics (Iteration 7)

Read-only **health, doctor/status diagnostics, stale-state detection, and advisory
hook enforcement** for the CHAOS Interaction Runtime. It turns the runtime from a
set of working capabilities into an observable, diagnosable, safely governable
subsystem.

```text
The chat thread is not the source of truth. The interaction runtime is.
Runtime health must be visible before commands proceed.
Enforcement starts advisory/report-first, never destructive by default.
```

## What it does

- Generates an `InteractionRuntimeHealthReport` from 12 read-only probes.
- Renders a detailed `## Interaction Runtime` **doctor** section, a compact
  **status** block, and a full **JSON** report.
- Detects pending decisions, ready-to-resume sessions, stale locks, expired runner
  leases, malformed artifacts, capsule gaps, and command-contract integration gaps.
- Emits **Todo Candidates** (aligned to `chaos-todo`'s candidate contract) for
  material, actionable runtime issues.
- Provides an **advisory runtime-contract guard** that records violations to the
  existing `.chaos/runtime/hook-violations.jsonl` stream (report-first; strict mode
  can block BLOCKER findings only when configured).

## What it does NOT do

- No destructive repair. It never deletes locks, cancels sessions, mutates
  decisions, rewrites artifacts, marks decisions consumed, or completes commands.
- No `chaos:delete`/discard, no cloud/remote approval, no GitHub/Azure sync, no
  Decision Center / MCP redesign, no production application changes, no arbitrary
  chat-thread control.

State mutation stays explicit and command-driven. Diagnostics only reports,
classifies severity, recommends action, and optionally emits a Todo Candidate.

## Relationship to the other iterations

| Iteration | Package | Diagnostics reads it for |
|---|---|---|
| 1 | `tools/chaos-interaction-runtime` | sessions, decisions, responses, locks, capsules, schemas |
| 2 | `tools/chaos-interaction-mcp` | package/CLI/README presence (never starts the server) |
| 3 | `extensions/chaos-decision-center` | extension package/README/smoke-doc presence |
| 4 | `.claude/commands/chaos-resume.md` | command-contract presence/integration |
| 5 | `tools/chaos-interaction-runner` | `runners/<id>.json` lease liveness |

## Severity model

| Severity | Meaning |
|---|---|
| `OK` | Healthy/proven. |
| `INFO` | Useful information, no action. |
| `WARN` | Should be reviewed; not blocking by default. |
| `ERROR` | Likely broken; avoid relying on the affected feature. |
| `BLOCKER` | Command should stop unless explicitly overridden. |

Overall status rolls up: any `BLOCKER` → `blocked`; any `WARN`/`ERROR` → `degraded`;
only `OK`/`INFO` → `healthy`; nothing probed → `unknown`.

## Probes

`runtime-root`, `schema`, `artifact-validation`, `decision`, `session`, `lock`,
`capsule`, `runner`, `mcp`, `decision-center`, `hook`, `command-contract`.
A probe that throws is contained as an `ERROR` finding — diagnostics never crashes
the caller.

## Advisory hook enforcement

The `RuntimeContractGuard` detects:

- `continued-after-must-stop` (BLOCKER) — a command continued while a decision is pending.
- `write-while-decision-pending` (ERROR) — production files written while a decision blocks the change.
- `decision-not-consumed` (WARN) — an answered decision was never consumed before completion.

Violations are written to the **existing** `.chaos/runtime/hook-violations.jsonl`
stream as an additive superset (base fields preserved; interaction fields added).
Modes:

- `advisory` (default) — record only, never block.
- `strict` — block on BLOCKER when `strictBlocksOnBlocker` is set.
- `off` — no checks, no writes, no blocking.

## Todo Candidates

Emitted for stale locks, malformed artifacts, missing capsules, expired leases,
long-pending decisions, and missing command integration. Candidates match
`.claude/skills/chaos-todo/reference/todo-candidate-contract.md` so `chaos:todo`
can promote them. Diagnostics never writes durable `.chaos/todo/items/` files.

## CLI

```bash
node tools/chaos-interaction-diagnostics/src/cli/chaos-interaction-diagnostics.ts doctor
node tools/chaos-interaction-diagnostics/src/cli/chaos-interaction-diagnostics.ts doctor --section   # embeddable
node tools/chaos-interaction-diagnostics/src/cli/chaos-interaction-diagnostics.ts status
node tools/chaos-interaction-diagnostics/src/cli/chaos-interaction-diagnostics.ts json
```

PowerShell uses the same flags. `chaos:doctor` embeds the `--section` output;
`chaos:status` embeds the `status` output.

## Configuration

Precedence: CLI args > env > `--config <file>` > defaults. Defaults mirror the
additive `policies.interactionRuntime` block in `.chaos/config.yaml`. Key knobs:
`staleDecisionAgeHours` (24), `staleLockAgeHours` (24),
`expiredRunnerLeaseGraceMs` (30000), `enforcementMode` (`advisory`),
`strictBlocksOnBlocker` (true), `writeHookViolations` (true),
`includeTodoCandidates` (true), `validateArtifacts` (true).

## Repair policy

No destructive repair by default (or at all in Iteration 7). `planRepairs()` returns
advisory recommendations with `destructive: false` and a suggested CHAOS command —
never an executor. Future repair flags can be designed later.

## Scripts

```bash
npm test         # node --test (zero-dependency, type-stripped)
npm run typecheck
npm run build
```

## Known limitations

- Command-contract integration detection is keyword-based (advisory); it does not
  rewrite command contracts.
- Runner lease liveness is read from `runners/<id>.json`; the runner package is not
  imported (leases are read as plain JSON).
- `mcp`/`decision-center` probes check presence only; they never start the server or
  the VS Code host.
- The hook guard is a library the caller invokes; wiring it into committed hook
  settings is optional and out of scope for Iteration 7.

## Next iteration / future hardening

- Optional confirmed, non-destructive repair flows (e.g. capsule recreation) behind
  an explicit `--fix` with per-item confirmation.
- A wired advisory hook (Claude `settings.json`) example that calls the guard.
- Deeper command-contract integration checks once Iteration 6 lands fully.
