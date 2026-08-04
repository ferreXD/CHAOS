# Scan verdict 5 — K3

- fired: none
- stops: none demanded
- dimensions: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 1 · openspec 2 · adr 2
- confidence: HIGH · scanSeq: 5
- new surface paths: tests/TaskTracker.Tests/ApiKeyAuthTests.cs, tests/TaskTracker.Tests/TaskEndpointsTests.cs
- adjudication: DUE — judge .chaos/changes/require-api-key-auth\scan\packet-5.json per tools/chaos-classify/adjudication-prompt.md (raise-only, cites mandatory), then run `python tools/chaos-scan/scan.py merge --change-dir .chaos/changes/require-api-key-auth --raises <file>`
