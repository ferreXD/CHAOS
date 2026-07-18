---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-17T20:30:00+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-17T20:30:00+02:00"
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
  id: TODO-2026-07-17-add-protected-file-guard-profile
  title: "Add report-only protected-file guard hook profile"
  status: open
  priority: MEDIUM
  target: v1
  type: hook
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/roadmap/oss-readiness-audit-2026-07-01.md
    - .chaos/roadmap/roadmap.md
  sourceIds:
    - RM-012
    - F-11
  relatedChanges: []
  relatedRoadmapItems:
    - RM-012
  relatedFindings:
    - F-11
  nextStep: "Implement a report-only PreToolUse protected-file guard profile under .claude/hooks/scripts/ plus an example settings profile."
  recommendedCommand: none
  closureCriteria:
    - "A report-only protected-file guard script + example profile exist."
    - "Documented and opt-in (not wired by default)."
  knowledgeType: FACT
  confidence: HIGH
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-17T20:30:00+02:00"
  closedAt: null
---

# TODO — Add report-only protected-file guard hook profile

## Why this exists

The protected-file guard is spec-only; no script exists. Runtime-observability and artifact-metadata hooks are implemented, but the guard profile is not.

## Source Evidence

- F-11 — Protected-file guard hook is spec-only, not implemented
- RM-012 — Stabilize hooks installation and profiles (report-only protected-file guard)

## Next Action

Implement a report-only PreToolUse protected-file guard profile under .claude/hooks/scripts/ plus an example settings profile.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- A report-only protected-file guard script + example profile exist.
- Documented and opt-in (not wired by default).

