# Scan verdict 1 — K1

- FIRED M2 (by scan, surface auth) [TRG-001] — cite: auth class: predicted scope includes src/TaskTracker.Api/Security/ApiKeyEndpointFilter.cs
- stops: none demanded
- dimensions: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0
- confidence: HIGH · scanSeq: 1
- adjudication: DUE — judge .chaos/changes/require-api-key-auth\scan\packet-1.json per tools/chaos-classify/adjudication-prompt.md (raise-only, cites mandatory), then run `python tools/chaos-scan/scan.py merge --change-dir .chaos/changes/require-api-key-auth --raises <file>`
