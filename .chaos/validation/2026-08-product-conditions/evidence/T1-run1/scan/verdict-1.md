---
chaosMetadata:
  schemaVersion: 1
  artifactType: change-artifact
  artifactScope: change
  changeId: filter-tasks-by-priority
  sourceCommand: unknown
  lastWrittenAt: "2026-08-04T14:52:15+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-04T14:52:15+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: demo/dotnet
    reviewRequest: null
    contextSource: session-context
    confidence: HIGH
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: LOW
    bodyHash: "sha256:c9dce7070283aa612bba4ee9bbb54c1a94f69e1e38c32b36c8af472a72fb3b16"
---

# Scan verdict 1 — K1

- fired: none
- stops: none demanded
- dimensions: stops 1 · evidence.targeted 0 · evidence.breadth 0 · review 0 · verify 0 · openspec 0 · adr 0
- confidence: HIGH · scanSeq: 1
- adjudication: DUE — judge .chaos/changes/filter-tasks-by-priority\scan\packet-1.json per tools/chaos-classify/adjudication-prompt.md (raise-only, cites mandatory), then run `python tools/chaos-scan/scan.py merge --change-dir .chaos/changes/filter-tasks-by-priority --raises <file>`
