---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-17T22:05:00+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-17T22:05:00+02:00"
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
  id: TODO-2026-07-17-create-public-readme
  title: "Create canonical public README and positioning"
  status: done
  priority: BLOCKER
  target: public-alpha
  type: documentation
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/roadmap/oss-readiness-audit-2026-07-01.md
    - .chaos/roadmap/roadmap.md
  sourceIds:
    - RM-001
    - F-01
  relatedChanges:
    - create-public-readme
  relatedRoadmapItems:
    - RM-001
  relatedFindings:
    - F-01
  nextStep: "Draft a humble, standalone public README (what CHAOS is, who it is for / not for, relationship to OpenSpec, current maturity and limitations)."
  recommendedCommand: none
  closureCriteria:
    - "Public README exists at repo root."
    - "Avoids universal-framework claims; keeps \"experimental / human-led / brownfield-friendly\" framing."
    - "Includes an explicit fit / non-fit section."
    - "Links to the installation and demo docs."
  knowledgeType: FACT
  confidence: HIGH
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-17T22:05:00+02:00"
  closedAt: "2026-07-17T22:05:00+02:00"
---

# TODO — Create canonical public README and positioning

## Why this exists

The OSS readiness audit found CHAOS has no public-facing positioning document; .chaos/README.md is project-scoped generated docs, not a newcomer pitch.

## Source Evidence

- F-01 — No public-facing positioning document exists
- RM-001 — Create canonical public README and positioning

## Next Action

Draft a humble, standalone public README (what CHAOS is, who it is for / not for, relationship to OpenSpec, current maturity and limitations).

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Public README exists at repo root.
- Avoids universal-framework claims; keeps "experimental / human-led / brownfield-friendly" framing.
- Includes an explicit fit / non-fit section.
- Links to the installation and demo docs.

## History

- 2026-07-17 — Closed as **done**. Delivered via the CHAOS change `create-public-readme`
  (propose → review → apply → verify → archive; ARCHIVED_WITH_DEBT). Closure criteria met:
  README.md exists at repo root; framing is humble and explicitly not a universal framework
  (kept experimental / human-led / brownfield-friendly, plus owner-directed greenfield support);
  explicit fit / non-fit section present; install (`docs/installation.md`) and demo
  (`docs/demo/`) links present, marked *planned* pending RM-003/RM-004. Maintainer-confirmed via
  runtime decision `DEC-2026-07-17-chaos-todo-close-repository-level-t-b109` (vscode-user,
  Decision Center). Residual debt tracked on the change, not here: greenfield-vs-audit
  reconciliation (APP-DEC-003 → chaos:sync).
