---
chaosMetadata:
  schemaVersion: 1
  artifactType: change-artifact
  artifactScope: change
  changeId: add-priority-filter
  sourceCommand: unknown
  lastWrittenAt: "2026-08-04T23:11:54+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-04T23:11:54+02:00"
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
    bodyHash: "sha256:88424d1a2b813090e30a7142297d7acd9729f80a0b6c681cbf5b647128410cb8"
---

# Scan verdict 1 — K1

- fired: none
- stops: none demanded
- dimensions: stops 1 · evidence.targeted 0 · evidence.breadth 0 · review 0 · verify 0 · openspec 0 · adr 0
- confidence: HIGH · scanSeq: 1
- adjudication: DUE — judge .chaos/changes/add-priority-filter\scan\packet-1.json per tools/chaos-classify/adjudication-prompt.md (raise-only, cites mandatory), then run `python tools/chaos-scan/scan.py merge --change-dir .chaos/changes/add-priority-filter --raises <file>`
