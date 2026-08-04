# Scan verdict 2 — K1

- FIRED M1 (by adjudication, surface data-store) [TRG-002] — cite: intent 'Add an integer version to the task, serialized as version. New and seeded tasks start at version 1. Every successful PUT /tasks/{id} increments the task's version by 1' x posture '## Module / boundary model' boundary line 'new behaviour (e.g. filtering) belongs at the endpoint/query boundary, not in the store's public shape, unless a decision says otherwise' (reinforced by '## Data access posture': 'Update replaces via record with { ... }') - the intent commits to changing the domain record's shape and the store's update semantics rather than staying at the endpoint/query boundary
- stops: none demanded
- dimensions: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2
- confidence: MEDIUM · scanSeq: 2
- adjudication: not due
