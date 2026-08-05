---
chaosMetadata:
  schemaVersion: 1
  artifactType: change-artifact
  artifactScope: change
  changeId: add-priority-filter
  sourceCommand: unknown
  lastWrittenAt: "2026-08-04T23:42:42+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-04T23:42:42+02:00"
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
    bodyHash: "sha256:4efd6f997dd968955977e02751a27a8a7b8b308d7ec0473c7944e4fff1ab8485"
---

# Scan verdict 4 — K3

- fired: none
- stops: none demanded
- dimensions: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 0 · openspec 1 · adr 0
- confidence: HIGH · scanSeq: 4
- new surface paths: src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/TaskEndpointsTests.cs
- adjudication: DUE — judge .chaos/changes/add-priority-filter\scan\packet-4.json per tools/chaos-classify/adjudication-prompt.md (raise-only, cites mandatory), then run `python tools/chaos-scan/scan.py merge --change-dir .chaos/changes/add-priority-filter --raises <file>`
