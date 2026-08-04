# Scan verdict 4 — K3

- FIRED M3 (by scan, surface contract-dependency) [TRG-001] — cite: route delta: added ['GET /count'] (additive)
- stops: none demanded
- dimensions: stops 1 · evidence.targeted 0 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 1
- confidence: HIGH · scanSeq: 4
- new surface paths: src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/TaskCountEndpointTests.cs
- adjudication: DUE — judge .chaos/changes/task-count\scan\packet-4.json per tools/chaos-classify/adjudication-prompt.md (raise-only, cites mandatory), then run `python tools/chaos-scan/scan.py merge --change-dir .chaos/changes/task-count --raises <file>`
