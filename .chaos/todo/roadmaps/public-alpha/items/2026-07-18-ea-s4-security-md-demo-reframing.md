---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-19T13:35:48+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-19T13:35:48+02:00"
  lastAuditedBy: vscode-user
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
  id: TODO-2026-07-18-ea-s4-security-md-demo-reframing
  title: "EA-S4 — SECURITY.md + honest demo reframing"
  status: done
  priority: BLOCKER
  target: h0-stabilization
  type: documentation
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-S4
  relatedChanges:
  relatedRoadmapItems:
    - EA-S4
  relatedFindings:
  nextStep: "Publish SECURITY.md with a disclosure path and reframe the demo as illustrative pending the EA-V1 showcase trail."
  recommendedCommand: none
  closureCriteria:
    - "SECURITY.md policy published."
    - "Demo labeled illustrative pending EA-V1."
  knowledgeType: RECOMMENDATION
  confidence: HIGH
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-19T13:35:48+02:00"
  closedAt: "2026-07-19T13:35:48+02:00"
---

# TODO — EA-S4 — SECURITY.md + honest demo reframing

## Why this exists

There is no vulnerability disclosure path, and the demo runnable claim overstates what is verified. Both are cheap credibility fixes.

## Source Evidence

- EA-S4 — Horizon 0, P0, complexity S, no dependencies (14-roadmap.md §14.2).

## Next Action

Publish SECURITY.md with a disclosure path and reframe the demo as illustrative pending the EA-V1 showcase trail.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- SECURITY.md policy published.
- Demo labeled illustrative pending EA-V1.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
- 2026-07-19 — Closed as **done** on direct maintainer instruction. Both closure criteria met on `main`:
  1. **SECURITY.md policy published** — [`SECURITY.md`](../../../../../SECURITY.md) at repo root: supported-versions table (alpha = `main` only), private disclosure via GitHub private vulnerability reporting (`/security/advisories/new` — no personal email exposed, chosen over public issues), what-to-include + best-effort response expectations, and an explicit in-scope/out-of-scope split (tooling in scope; the illustrative example project and third-party deps out).
  2. **Demo labeled illustrative pending EA-V1** — [`docs/demo/README.md`](../../../../../docs/demo/README.md) now opens with a callout distinguishing the *illustrative* walkthrough (real runnable starting code, but hand-authored artifact excerpts) from the **real captured trail**. Since EA-V1 is already done, the label points to the verifiable golden trail on the [`demo/dotnet` branch](https://github.com/ferreXD/CHAOS/tree/demo/dotnet) rather than "coming later." The same pointer was added to the root [`README.md`](../../../../../README.md) worked-example bullet and the [example project README](../../../../../examples/task-tracker/dotnet/README.md). Roadmap file (`14-roadmap.md`) is not mutated — this closure is the record of completion (per todo↔roadmap bridge).
