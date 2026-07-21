---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-21T22:50:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-21T22:50:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: main
    reviewRequest: null
    contextSource: git
    confidence: LOW
  metadata:
    identitySource: provider
    timestampSource: local-system
    confidence: LOW

todo:
  id: TODO-2026-07-18-ea-v2-run-experiments-x1-x2-x4
  title: "EA-V2 — Run validation experiments EA-X1 / EA-X2 / EA-X4"
  status: done
  priority: BLOCKER
  target: h1-validation
  type: validation
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
    - .chaos/assessments/2026-07-18-public-alpha-assessment/15-validation-experiments.md
  sourceIds:
    - EA-V2
  relatedChanges:
  relatedRoadmapItems:
    - EA-V2
  relatedFindings:
    - EA-X1
    - EA-X2
    - EA-X4
  nextStep: "Run experiments EA-X1, EA-X2 and EA-X4 against the thresholds in 15-validation-experiments.md and publish honest results."
  recommendedCommand: none
  closureCriteria:
    - "EA-X1, EA-X2, EA-X4 executed against their published thresholds."
    - "Results — including failures — committed to the repo."
  knowledgeType: RECOMMENDATION
  confidence: HIGH
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-21T22:50:00+02:00"
  closedAt: "2026-07-21T22:50:00+02:00"
---

# TODO — EA-V2 — Run validation experiments EA-X1 / EA-X2 / EA-X4

## Why this exists

The value, usability, and trust claims are untested externally. EA-X1 (cold-start usability), EA-X2 (with/without counterfactual value) and EA-X4 (resume reliability under abuse) test the three load-bearing claims and gate beta investment.

## Source Evidence

- EA-V2 — Horizon 1, P0, complexity M. Depends on: EA-V1 (14-roadmap.md §14.2; thresholds in 15-validation-experiments.md).

## Next Action

Run experiments EA-X1, EA-X2 and EA-X4 against the thresholds in 15-validation-experiments.md and publish honest results.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- EA-X1, EA-X2, EA-X4 executed against their published thresholds.
- Results — including failures — committed to the repo.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
- 2026-07-21 — **Closed (status: done)** under the locked "agent evidence + honest caveats" decision. Both closure criteria met — the three experiments were executed against their §15.2 thresholds and all results (including failures) are committed to `.chaos/validation/2026-07-ea-v2/`:
  - **EA-X4** (trustworthy): baseline **60% FAIL** → EA-V3 runtime hardening → re-validated **20/20 = 100%, 0 corruption**. ✅ (commits `0bd7ab2`/`647a472`/`049e12f`.)
  - **EA-X2** (valuable): mechanized pinned-contract A/B — **0 catches, 3.94× time → value UNSUPPORTED** on §15.2 thresholds. Committed `4d34809`. **Mechanized counterfactual, NOT the unbiased human trial.**
  - **EA-X2b** (valuable, follow-up): under-specified A/B removing X2's contract-pinning bias — governance value **does** appear (surfacing 3/3 vs plain 0/3; 1 clear + 1 qualified catch; 4.83× cost). Partial real human-in-the-loop. Committed `3fa6b5c`.
  - **EA-X1** (usable): instrumented cold-start probe — **0 silent failures** on the mechanical path after fixes F1/F3. ✅ sub-threshold.
  - **Synthesis + §12.3 gate read** written to `.chaos/validation/2026-07-ea-v2/results-summary.md`: **kill/pivot gate does NOT fire → CONTINUE**; value case conditional/located.
  - **Human-trial portions remain OPTIONAL / PENDING and are NOT claimed done:** EA-X1 human time-to-first-value and EA-X2's unbiased human comparison were not run (recruitment kits provided). Spawned/again-open follow-ups: IL-PF10 (real token accounting), a performance/altitude pass (cost ~4–5×; must not reduce decisions or human decision-weight — creator constraint), EA-X6 (usage-breadth), and the human trials themselves.
  - Roadmap file (`14-roadmap.md`) intentionally **not** mutated — this closure record is the completion record (todo↔roadmap bridge).
