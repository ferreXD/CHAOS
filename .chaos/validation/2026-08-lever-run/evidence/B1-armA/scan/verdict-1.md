# Scan verdict 1 — K1

- FIRED M2 (by scan, surface data-store) [TRG-001] — cite: persistence class: predicted scope includes src/TaskTracker.Api/Domain/TaskStore.cs
- stops: none demanded
- dimensions: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0
- confidence: HIGH · scanSeq: 1
- adjudication: DUE — judge .chaos/changes/task-count\scan\packet-1.json per tools/chaos-classify/adjudication-prompt.md (raise-only, cites mandatory), then run `python tools/chaos-scan/scan.py merge --change-dir .chaos/changes/task-count --raises <file>`
