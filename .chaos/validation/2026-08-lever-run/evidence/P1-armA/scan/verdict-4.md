# Scan verdict 4 — K3

- fired: none
- echo (already fired, re-detected): M2
- stops: none demanded
- dimensions: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 1 · openspec 1 · adr 2
- confidence: HIGH · scanSeq: 4
- new surface paths: src/TaskTracker.Api/Auth/ApiKeyEndpointFilter.cs, src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/TaskEndpointsTests.cs
- adjudication: DUE — judge .chaos/changes/require-api-key-auth\scan\packet-4.json per tools/chaos-classify/adjudication-prompt.md (raise-only, cites mandatory), then run `python tools/chaos-scan/scan.py merge --change-dir .chaos/changes/require-api-key-auth --raises <file>`
