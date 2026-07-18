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
  id: TODO-2026-07-17-repo-context-mcp-integration-docs
  title: "Complete repository-context and MCP integration docs"
  status: open
  priority: MEDIUM
  target: v1
  type: documentation
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/roadmap/oss-readiness-audit-2026-07-01.md
    - .chaos/roadmap/roadmap.md
  sourceIds:
    - RM-013
    - F-12
  relatedChanges: []
  relatedRoadmapItems:
    - RM-013
  relatedFindings:
    - F-12
  nextStep: "Document the public-default posture (GitHub enabled by default), provider-neutral resolution, and MCP optionality with git fallback."
  recommendedCommand: none
  closureCriteria:
    - "Repo-context / MCP docs describe the public-default posture and provider-neutral fallback clearly."
  knowledgeType: FACT
  confidence: MEDIUM
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-17T20:30:00+02:00"
  closedAt: null
---

# TODO — Complete repository-context and MCP integration docs

## Why this exists

The provider-neutral contract exists, but the public-default posture (GitHub default) and MCP optionality are not clearly documented for adopters.

## Source Evidence

- F-12 — MCP default provider posture is internal-tool-shaped
- RM-013 — Complete repository-context and MCP integration docs

## Next Action

Document the public-default posture (GitHub enabled by default), provider-neutral resolution, and MCP optionality with git fallback.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Repo-context / MCP docs describe the public-default posture and provider-neutral fallback clearly.

