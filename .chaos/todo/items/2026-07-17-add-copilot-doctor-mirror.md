---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T12:31:39+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T12:31:39+02:00"
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
  id: TODO-2026-07-17-add-copilot-doctor-mirror
  title: "Add chaos:doctor Copilot adapter mirror"
  status: done
  priority: HIGH
  target: v1
  type: adapter
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/roadmap/oss-readiness-audit-2026-07-01.md
    - .chaos/roadmap/roadmap.md
  sourceIds:
    - RM-010
    - RM-011
    - F-08
    - F-13
  relatedChanges: []
  relatedRoadmapItems:
    - RM-010
    - RM-011
  relatedFindings:
    - F-08
    - F-13
  nextStep: "Add .github/prompts/chaos-doctor.prompt.md + agent + instructions, OR visibly label Copilot chaos:doctor \"not yet available\" in the command matrix (no silent omission)."
  recommendedCommand: "chaos:sync"
  closureCriteria:
    - "Copilot has a chaos:doctor mirror, OR the matrix explicitly labels it unavailable."
    - "No silent omission of the Copilot doctor surface."
  knowledgeType: FACT
  confidence: HIGH
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-18T12:31:39+02:00"
  closedAt: "2026-07-18T12:31:39+02:00"
---

# TODO — Add chaos:doctor Copilot adapter mirror

## Why this exists

Dedup-merged gap: the Copilot surface has no chaos:doctor prompt/agent/instructions. F-08, F-13 (mirror sub-scope), and the RM-010/RM-011 mirror scopes describe one underlying gap.

> Deduplication: Merged from F-08 + F-13 (mirror) + RM-010/RM-011 mirror scope per the deduplication policy worked example.

## Source Evidence

- F-08 — Copilot adapter missing chaos:doctor entirely
- F-13 — chaos:doctor has no Copilot mirror
- RM-010 — harden Copilot adapter (add chaos:doctor mirror)
- RM-011 — complete chaos:doctor (Copilot mirror)

## Next Action

Add .github/prompts/chaos-doctor.prompt.md + agent + instructions, OR visibly label Copilot chaos:doctor "not yet available" in the command matrix (no silent omission).

## Recommended Command

`chaos:sync`

## Closure Criteria

- Copilot has a chaos:doctor mirror, OR the matrix explicitly labels it unavailable.
- No silent omission of the Copilot doctor surface.

## History

- 2026-07-18 — Closed as **done** via `chaos:todo --close`. Closure criteria verified met: the
  Copilot surface now has a full chaos:doctor mirror — `.github/prompts/chaos-doctor.prompt.md`,
  the `.github/agents/chaos-doctor-orchestrator.agent.md` custom agent, and the
  `.github/skills/chaos-doctor/` skill (SKILL.md + doctor-contract.md + check-catalog.md), and it
  is referenced in `.github/copilot-instructions.md`. No silent omission. Maintainer-confirmed via
  native selection UI (repository owner). Sub-scopes F-08, F-13 (mirror), RM-010/RM-011 (mirror)
  all satisfied.

