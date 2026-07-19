---
chaosMetadata:
  schemaVersion: 1
  artifactType: unknown
  artifactScope: unknown
  changeId: null
  sourceCommand: "chaos:sync"
  lastWrittenAt: "2026-07-19T15:14:39+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T15:14:39+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "{'name': 'main', 'isDefaultBranch': True, 'upstream': 'origin/main', 'mergeBase': '8b751b7880b42286a882f2ecfd68428e72bb55f7', 'confidence': 'MEDIUM'}"
    reviewRequest: "{'providerType': 'unknown', 'id': '', 'url': '', 'title': '', 'author': '', 'sourceBranch': '', 'targetBranch': '', 'status': 'unknown', 'confidence': 'LOW'}"
    contextSource: session-context
    confidence: HIGH
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:6af79aa62fad5ad316242dd8c413fe3fcd66bff3bf5c4a53714e82de9dfbeac4"
---

# EA-X1 — Cold-start usability (instrumented probe + recruitment kit)

> This is an **instrumented machine probe**, not the EA-X1 human trial. It validates the
> mechanical onboarding path and the *0-silent-failures* sub-threshold. The **≤60-min
> time-to-first-value threshold is NOT claimed here** — it requires the 3-developer trial,
> for which a recruitment kit is provided (pending).

## What EA-X1 tests

**Hypothesis:** a stranger reaches first value **unaided**. Spec:
`15-validation-experiments.md` §15.2 — 3 devs unfamiliar with CHAOS, fresh machines:
install → doctor → demo change. Success: **≤ 60 min** time-to-first-value now (≤ 15 min
post-plugin), **0 silent failures**. Failure interpretation: *fix onboarding before any
promotion.* EA-X1 **gates EA-X2**.

## The agent-vs-human split (why there are two halves here)

An agent can honestly produce the **mechanical path-integrity + `0 silent failures`**
sub-threshold, by running the documented first-run path in a clean environment and catching
every swallowed error, missing artifact, and hang. An agent **cannot** produce the human
**time-to-first-value** — "the creator cannot un-know the workflow" (§15.1). So this folder
ships both: the machine evidence (done) and the kit to run the humans (pending).

## Contents

| File | What it is | Status |
|---|---|---|
| [`probe-results.md`](probe-results.md) | The machine probe: environment, per-step instrumentation table, **silent-failure count vs 0**, abandonment point, findings, and Inferred human-friction. Every line labelled Observed/Inferred/Unknown. | **Done (Observed)** |
| [`recruitment-protocol.md`](recruitment-protocol.md) | Who to recruit (3 devs, no CHAOS exposure), start state, the verbatim task, the tiered definition of "first value," think-aloud rules, and stop conditions. | Kit (pending run) |
| [`timing-sheet.csv`](timing-sheet.csv) | Per-step timing capture; columns participant/step/start/end/elapsed/exit/blocker/silent-failure/notes — with a filled EXAMPLE row. | Kit (pending run) |
| [`blocker-log-template.md`](blocker-log-template.md) | One entry per blocker: step, symptom, what they tried, recovered?, time lost, maps-to-finding. | Kit (pending run) |
| [`consent-and-scope-note.md`](consent-and-scope-note.md) | Lightweight participant consent + scope boundaries. | Kit (pending run) |

## Result at a glance (Observed, 2026-07-19 — baseline + post-fix re-validation)

Two runs, same day: a **baseline** run on `main` @ `8b751b7`, then a **re-validation** on the
fixed `main` @ `88954b8` after two fixes were applied.

- **Mechanical onboarding path: completed end-to-end in both runs**, 0 abandonment. Doctor verdict
  `READY_WITH_WARNINGS`; demo API returns the seeded task list; 5/5 baseline tests pass.
- **Silent failures vs 0: baseline `1` → post-fix `0` ✅.** The baseline shipped `py -3` hooks that
  silently no-op (F1, doctor-detectable, 0 undetected). Fixed on `main` (`88954b8`,
  `py -3`→`python`); the re-run's real `chaos:doctor` reports **CD-HOOK-05 = PASS** and the hooks
  now execute. The `0-silent-failures` sub-threshold is met clean on the fixed `main`.
- **Fixes applied (commit `88954b8`):** F1 `py -3`→`python` interpreter; F3 untrack
  `.claude/settings.local.json` (already gitignored). Both confirmed resolved by the re-run.
- **Still open (not silent failures):** F2 `openspec init` dirties 20 tracked files (→ EA-S2 doc
  gap); F4 declared-but-unwired protected-file guard; **F5** — a side-effect of the F1 fix: the
  artifact-metadata hook (which never ran under `py -3`) now mass-stamps ~40 managed markdown files
  repo-wide (→ EA-V3 hardening). All out of scope of the two requested fixes.
- **First-run defects cross-linked to EA-S2** (first-run integrity); hardening to **EA-V3**.
- **Human time-to-first-value: NOT measured, PENDING** the 3-dev trial (kit above).

See [`probe-results.md`](probe-results.md) for the full two-run evidence and the one-line
report-back for `results-summary.md`.
