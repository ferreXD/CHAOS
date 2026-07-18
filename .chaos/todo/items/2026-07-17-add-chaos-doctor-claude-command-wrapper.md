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
  id: TODO-2026-07-17-add-chaos-doctor-claude-command-wrapper
  title: "Add chaos:doctor Claude command wrapper"
  status: done
  priority: MEDIUM
  target: v1
  type: implementation
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/roadmap/oss-readiness-audit-2026-07-01.md
    - .chaos/roadmap/roadmap.md
  sourceIds:
    - RM-011
    - F-13
  relatedChanges: []
  relatedRoadmapItems:
    - RM-011
  relatedFindings:
    - F-13
  nextStep: "Add .claude/commands/chaos-doctor.md wrapper with parity to the other command wrappers."
  recommendedCommand: none
  closureCriteria:
    - ".claude/commands/chaos-doctor.md exists."
    - "Invokes the doctor skill/orchestrator consistently with other wrappers."
  knowledgeType: FACT
  confidence: HIGH
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-18T12:31:39+02:00"
  closedAt: "2026-07-18T12:31:39+02:00"
---

# TODO — Add chaos:doctor Claude command wrapper

## Why this exists

chaos:doctor has a skill/orchestrator but no .claude/commands/chaos-doctor.md wrapper, unlike other commands. This is the wrapper sub-scope of F-13 (distinct from the Copilot mirror).

## Source Evidence

- F-13 — chaos:doctor has no Claude command wrapper
- RM-011 — complete chaos:doctor (Claude command wrapper)

## Next Action

Add .claude/commands/chaos-doctor.md wrapper with parity to the other command wrappers.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- .claude/commands/chaos-doctor.md exists.
- Invokes the doctor skill/orchestrator consistently with other wrappers.

## History

- 2026-07-18 — Closed as **done** via `chaos:todo --close`. Closure criteria verified met:
  `.claude/commands/chaos-doctor.md` exists and delegates to the `chaos-doctor-orchestrator`
  subagent, referencing `.claude/skills/chaos-doctor/` (SKILL.md + doctor-contract.md +
  check-catalog.md) with the same wrapper structure as the other `.claude/commands/*` files
  (intent, procedure, supported invocations, references, interaction-runtime obligations).
  Maintainer-confirmed via native selection UI (repository owner). Wrapper sub-scope of F-13 /
  RM-011 satisfied.

