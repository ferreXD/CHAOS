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
  id: TODO-2026-07-17-add-templated-example-config
  title: "Add templated example config (GitHub-default)"
  status: open
  priority: MEDIUM
  target: v1
  type: mcp
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/roadmap/oss-readiness-audit-2026-07-01.md
    - .chaos/roadmap/roadmap.md
  sourceIds:
    - RM-013
    - F-12
    - F-18
  relatedChanges: []
  relatedRoadmapItems:
    - RM-013
  relatedFindings:
    - F-12
    - F-18
  nextStep: "Ship .chaos/config.yaml.example with GitHub enabled by default and Azure DevOps shown as opt-in placeholders; no instance-specific identifiers."
  recommendedCommand: none
  closureCriteria:
    - "config.yaml.example exists."
    - "GitHub enabled by default; Azure DevOps as opt-in placeholders."
    - "No instance-specific identifiers in the template."
  knowledgeType: FACT
  confidence: HIGH
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-17T20:30:00+02:00"
  closedAt: null
---

# TODO — Add templated example config (GitHub-default)

## Why this exists

The committed config has github.enabled:false / azureDevOps.enabled:true with instance-specific values — correct for this instance, wrong as a public starter. A sanitized template is needed.

## Source Evidence

- F-12 — MCP default provider posture
- F-18 — Consolidated sanitization requirement (templating)
- RM-013 — templated example config

## Next Action

Ship .chaos/config.yaml.example with GitHub enabled by default and Azure DevOps shown as opt-in placeholders; no instance-specific identifiers.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- config.yaml.example exists.
- GitHub enabled by default; Azure DevOps as opt-in placeholders.
- No instance-specific identifiers in the template.

