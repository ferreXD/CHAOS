---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T00:55:00+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T00:55:00+02:00"
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
  id: TODO-2026-07-17-create-installation-onboarding-guide
  title: "Create minimal installation and onboarding guide"
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
    - RM-003
    - F-03
  relatedChanges: []
  relatedRoadmapItems:
    - RM-003
  relatedFindings:
    - F-03
  nextStep: "Write an install/onboarding guide: copy .claude/ and .github/, initialize .chaos/config.yaml, verify setup, run the first command — distinct from chaos:init."
  recommendedCommand: none
  closureCriteria:
    - "Installation/onboarding guide exists."
    - "Covers copy-tooling + init-config + verify + first-command."
    - "Explicitly distinguished from chaos:init bootstrap-governance role."
  knowledgeType: FACT
  confidence: HIGH
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-18T00:55:00+02:00"
  closedAt: "2026-07-18T00:55:00+02:00"
---

# TODO — Create minimal installation and onboarding guide

## Why this exists

chaos:init bootstraps governance for a project that already has ADRs/decisions; nothing tells a brand-new adopter how to install the tooling into a blank repo.

## Source Evidence

- F-03 — No install path into a blank/new repository
- RM-003 — Create minimal installation and onboarding guide

## Next Action

Write an install/onboarding guide: copy .claude/ and .github/, initialize .chaos/config.yaml, verify setup, run the first command — distinct from chaos:init.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Installation/onboarding guide exists.
- Covers copy-tooling + init-config + verify + first-command.
- Explicitly distinguished from chaos:init bootstrap-governance role.

## History

- 2026-07-18 — Closed as `done` (chaos:todo --close). Verified: `docs/installation.md` exists and
  covers copy-tooling + init-config + verify (`chaos:doctor`) + first-command, and is explicitly
  distinguished from `chaos:init`'s bootstrap-governance role. Maintainer confirmation recorded via
  runtime decision `DEC-2026-07-17-chaos-todo-repository-level-todo-up-6304` (vscode-user, Decision
  Center), command run `RUN-2026-07-17-chaos-todo-568645`.
