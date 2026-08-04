# Scan verdict 4 — K3

- fired: none
- echo (already fired, re-detected): M2
- stops: none demanded
- dimensions: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 1 · openspec 1 · adr 2
- confidence: HIGH · scanSeq: 4
- new surface paths: src/TaskTracker.Api/Domain/TaskItem.cs, src/TaskTracker.Api/Domain/TaskStore.cs
- adjudication: DUE — judge .chaos/changes/soft-delete-tasks\scan\packet-4.json per tools/chaos-classify/adjudication-prompt.md (raise-only, cites mandatory), then run `python tools/chaos-scan/scan.py merge --change-dir .chaos/changes/soft-delete-tasks --raises <file>`
