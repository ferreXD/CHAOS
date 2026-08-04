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
    bodyHash: "sha256:18b347df9cd139896dee9ae2a8df4c50c8e49117a19e4a2e57ee9cd3da3356ad"
---

# Scan verdict 4 — K3

- FIRED M5 (by scan, surface none) [TRG-002] — cite: diff touches src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/TaskEndpointsTests.cs, not in the approved scope
- stops: +1 placed — surface ONE runtime decision folding every question from this scan (`folds: <n>` on the entry), write the resume capsule, STOP
- dimensions: stops 2 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 0 · openspec 1 · adr 0
- confidence: HIGH · scanSeq: 4
- new surface paths: src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/TaskEndpointsTests.cs
- adjudication: DUE — judge .chaos/changes/filter-tasks-by-priority\scan\packet-4.json per tools/chaos-classify/adjudication-prompt.md (raise-only, cites mandatory), then run `python tools/chaos-scan/scan.py merge --change-dir .chaos/changes/filter-tasks-by-priority --raises <file>`
