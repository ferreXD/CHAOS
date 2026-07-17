# PATCH SUMMARY — CHAOS Interaction Runtime, Iteration 7 (health / doctor / status / advisory enforcement)

**Scope:** A read-only diagnostics layer that makes the Interaction Runtime
observable and safely governable: runtime health checks, `chaos:doctor` /
`chaos:status` integration, stale decision/session/lock/runner detection,
resumable-session reporting, Todo Candidate emission, and an advisory
runtime-contract hook guard. No destructive repair.
**Date:** 2026-07-07

> Primary deliverable: the new package `tools/chaos-interaction-diagnostics/`. Also
> additive doc/config integration for `chaos:doctor` / `chaos:status`. No root
> `PATCH-SUMMARY.md` created.

## Confirmation: no production code modified

No production application source, production tests, migrations, OpenSpec changes,
ADR content, Decision Center/MCP redesign, or command-contract rewrites. Changes are
confined to the new diagnostics package (`tools/`), additive `.chaos/config.yaml`
policy, additive `.chaos/interactions/README.md` pointer, and additive
`## Interaction Runtime` sections in the `chaos:doctor` / `chaos:status` skills. The
runtime package was **not** modified in Iteration 7.

## Files added (diagnostics package)

```
tools/chaos-interaction-diagnostics/
  package.json, tsconfig.json, tsconfig.build.json, .gitignore, README.md, PATCH-SUMMARY.md
  src/index.ts
  src/runtime.ts                       # bridge to Iteration 1 runtime (source import)
  src/cli/chaos-interaction-diagnostics.ts   # doctor | status | json
  src/config/diagnosticsConfig.ts
  src/model/{severity,healthFinding,healthReport,todoCandidate}.ts
  src/probes/probeContext.ts, todoHelpers.ts, registry.ts
  src/probes/{runtimeRoot,schema,artifactValidation,decision,session,lock,capsule,
              runnerLease,mcp,decisionCenter,hooks,commandContract}Probe.ts
  src/reporters/{markdownReporter,jsonReporter,statusSummaryReporter,doctorReporter}.ts
  src/repair/{repairRecommendation,repairPlanner}.ts
  src/hooks/{runtimeContractGuard,hookViolationWriter}.ts
  test/helpers.ts
  test/diagnosticsProbes.test.ts
  test/healthReport.test.ts
  test/markdownReporter.test.ts
  test/statusSummaryReporter.test.ts
  test/hookGuard.test.ts
  test/diagnosticsArtifacts.test.ts
```

## Files modified (additive only)

- `.chaos/config.yaml` — added `policies.interactionRuntime.diagnostics` +
  `.enforcement` (advisory default). Reuses the existing
  `hooks.runtimeObservability` stream; no new config sections removed/changed.
- `.chaos/interactions/README.md` — Iteration 7 implementation-status pointer.
- `.claude/skills/chaos-doctor/SKILL.md` — `## Interaction Runtime health` section
  (read-only, no auto-repair, Todo Candidates).
- `.claude/skills/chaos-status/SKILL.md` — compact `## Interaction Runtime summary`.
- `tools/chaos-interaction-runner/README.md` — note that diagnostics reports lease health.

## Probes implemented (12)

`runtime-root`, `schema`, `artifact-validation`, `decision`, `session`, `lock`,
`capsule`, `runner`, `mcp`, `decision-center`, `hook`, `command-contract`. A probe
that throws is contained as an ERROR finding — the run never crashes.

## Reporter outputs

- **Markdown doctor section** (`renderDoctorSection`) — status, summary counts,
  findings by severity, canonical Todo Candidates table. Standalone `renderDoctorReport`
  wraps it with a header + "no state was modified" banner.
- **Status summary** (`renderStatusSummary`) — compact block + single next action.
- **JSON** (`renderJson`) — full `InteractionRuntimeHealthReport`.

## Doctor / status integration

`chaos:doctor` embeds `... doctor --section`; `chaos:status` embeds `... status`.
Both remain read-only. Runtime findings surface as Todo Candidates via the existing
shared `## Todo Candidates` section (contract-aligned; promotable by `chaos:todo`).

## Hook / advisory enforcement

`RuntimeContractGuard` detects `continued-after-must-stop` (BLOCKER),
`write-while-decision-pending` (ERROR), and `decision-not-consumed` (WARN). Modes:
`advisory` (default, report-only), `strict` (blocks BLOCKER when `strictBlocksOnBlocker`),
`off`. Violations are written to the **existing** `.chaos/runtime/hook-violations.jsonl`
stream as an additive superset (base fields preserved: `schemaVersion, timestamp,
severity, hook, command, changeId, code, message, path, confidence`; added: `id,
violationType, commandRunId, sourceCommand, evidence, recommendedAction`). No new
duplicate stream.

## Todo Candidate support

Emitted for stale locks, malformed artifacts, missing capsules, expired leases,
long-pending decisions, and missing command integration — aligned to
`.claude/skills/chaos-todo/reference/todo-candidate-contract.md` (fields:
`title, sourceArtifactPath, sourceKind, recommendedPriority, target, type, scope,
nextAction, recommendedCommand, closureCriteria, knowledgeType, confidence`).
Diagnostics never writes durable `.chaos/todo/items/` files.

## Tests added / validation performed

- Diagnostics `node --test` → **34 pass**: probes (13 + read-only), health model (3),
  markdown/json reporters (3), status reporter (2), hook guard (7), static artifacts (6).
- `tsc --noEmit` (typecheck) and `tsc` (build) clean.
- CLI smoke against the real repo (read-only): `status` renders a healthy summary with
  a real ready-to-resume session and a `chaos:resume --run …` next action.
- Re-ran the other suites after this iteration: runtime 38, MCP 33, runner 48,
  extension 31 — all still pass (Iteration 7 does not modify those packages).

## Manual smoke status

Documented (README + this summary): create a pending decision → `chaos:status` shows it
→ answer in the Decision Center → `chaos:status` shows ready-to-resume → simulate a stale
lock / expired runner lease → `chaos:doctor` reports each with a recommendation and Todo
Candidate → confirm no repair is performed. The programmatic equivalents are covered by
the automated tests; the interactive Decision-Center-in-the-loop path needs a VS Code
session (not executed here).

## Known limitations

- Command-contract integration detection is keyword-based (advisory); it does not
  rewrite command contracts.
- Runner leases are read as plain JSON (the runner package is not imported).
- `mcp` / `decision-center` probes check presence only; they never start the server or
  the VS Code host.
- The hook guard is a library the caller invokes; wiring it into committed hook settings
  is optional and out of scope here.

## Explicit non-goals (not implemented, by design)

`chaos:delete`/discard; destructive auto-repair; cloud/remote approval; GitHub/Azure
issue sync; Decision Center / MCP redesign; broad command rewrites; arbitrary
chat-thread control; Copilot migration; any production application change.

## Self-audit

- **Production code changed:** no.
- **Destructive repair absent by default:** yes — there is no executor at all;
  `planRepairs()` returns advisory recommendations with `destructive: false`. Test 22
  asserts a diagnostics run does not modify existing artifacts.
- **Doctor/status outputs actionable:** yes — doctor gives severity + evidence +
  recommended action + Todo Candidates; status gives a single next action.
- **Runtime/MCP/runner/Decision Center API gap:** none required. Diagnostics consumes
  existing read APIs (`store.*.list()`, `listLocks()` with stale analysis,
  `getResumeCapsule`, `getActiveDecision`, `getSession/getDecision`) and reads runner
  leases as JSON. No new runtime API was needed (unlike Iteration 5's `resumeCommand`).
- **Command contract gap:** write commands' runtime integration is *reported* (Iteration 6
  concern), not rewritten here. `chaos:doctor`/`chaos:status` skills gained additive
  sections only.
- **Follow-up before future hardening:** optional confirmed non-destructive repair flows
  behind an explicit `--fix`; a committed advisory-hook `settings.json` example that calls
  the guard; deeper command-contract checks once Iteration 6 fully lands.
