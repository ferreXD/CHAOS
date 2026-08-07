# 01 — What it has become (implementation inventory)

All counts Observed (HIGH) from the tracked tree at `580998a`, suites run 2026-08-06.

## The product surface

**Five commands** (`chaos:init`, `chaos:run`, `chaos:resume`, `chaos:doctor`, `chaos:help`),
13 skills (6 CHAOS + chaos-shared + code-reviewer + 5 OpenSpec wrappers), 5 agents, 7 hook
scripts — **11,552 lines under `.claude/`** total. The centerpiece, the entire behavioural
definition of the product, is **134 lines** (`chaos-run/SKILL.md`) plus a 112-line runtime
protocol. Everything else is scaffolding for those 246 lines.

The `chaos:run` loop: targeted read (incl. crossing sources `AGENTS.md`, `architecture.md`,
`docs/adr/`) → **one folded pre-code stop** through the interaction runtime, mandatory even
when clean → deterministic spec gate (≥5 files / ≥250 LOC / any crossing → OpenSpec owed)
→ build → honest verify (delegated work independently checked; limits labeled, never
ticked) → decision record in `.chaos/decisions/` → complete. No length ceiling anywhere
(operator decision 2026-08-06); the budget is minutes and ceremony, not words.

## The machine under it

| Component | src LOC | test LOC | Tests | Role |
|---|---|---|---|---|
| interaction-runtime | 3,552 | 2,752 | 65 | file-backed decision/session/lock/capsule state machine |
| interaction-mcp | 1,738 | 916 | 40 | 14 MCP tools exposing the runtime to the agent |
| decision-center (VS Code) | 2,612 | 952 | 49 | the human surface: pending decisions, answer + rationale |
| interaction-runner | 3,258 | 1,315 | 69 | headless auto-resume loop (adapter-driven, opt-in) |
| interaction-diagnostics | 2,665 | 984 | 57 | read-only health probes for `chaos:doctor` |
| chaos-stopwatch | 508 | 439 | 29 | the independent wall-clock instrument (gates on `machine`) |
| **Total** | **14,333** | **7,358** | **309** + 30 hook tests | |

All green today (Observed). The runtime is the most battle-hardened part of the codebase:
abuse-suite validated at 100%/zero-corruption after EA-V3 (write lock, reconcile, capsule
hashes, temp GC), atomic validate-before-persist on decision creation, answered-twin
idempotency with a running-session exception (a deadlock found and fixed **today** — 03),
and schema validation against nine JSON schemas whose authored-content caps were removed
yesterday while identifier hygiene caps stay.

## The evidence estate

**854 tracked files, 18,359 lines under `.chaos/validation/`** — the measurement record is
~60% larger than the entire `.claude/` product surface (Inferred: this repo's most valuable
IP is the record, not the code; MEDIUM). It spans EA-X1..X4, Stages A–D, four lever runs,
the T-series, the hostile-terrain program with its pre-registration and verdict, and the
lean-core series with three evaluated rows and a review. `docs/design/` + `docs/perf/`
(19 dated documents) record why each piece was built or killed.

## What is deliberately absent

- **No lifecycle.** propose/review/apply/verify/archive/sync/retro/status/todo/archaeology:
  deleted, with their 267-file Copilot mirror and their five guides. One tag holds it all.
- **No classifier.** M1–M5, adjudication, scan/record/render/loop/digest tools: deleted.
  Crossing detection is now model judgment over recorded postures — measured 3/3 on the
  arena, with one known regression (placement surfacing, 02/06).
- **No modes.** `--light|--standard|--strict` is gone; the spec gate is the only rigor dial.
- **No prose budgets.** The one mechanical content cap (6,000-char decision context) was
  removed with the rest; records ran 94–109 lines against a former 40-line target.

## Current hygiene (Observed, HIGH)

Working tree clean; no live reference to any retired command or artifact path outside the
dated archives; the three benchmark workspaces carry byte-identical machinery
(`93b149eda`/`0c4c4a3`/`5862a31`). Known deliberate debt: the client arena's
`AGENTS.md` and decisions index remain apparatus-shaped for series comparability — the
correction is owed before any new benchmark series. Known undone: `docs/` has no user
guides at all since the purge; README + `chaos:help` are the only onboarding surface.
