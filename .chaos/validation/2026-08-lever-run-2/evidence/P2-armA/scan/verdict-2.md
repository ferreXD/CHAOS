# Scan verdict 2 — K1

- FIRED M1 (by adjudication, surface data-store) [TRG-002] — cite: intent 'Add a nullable deletedAt timestamp to the task model ... GET /tasks returns only active (not soft-deleted) tasks by default' x posture '## Module / boundary model' line 'new behaviour (e.g. filtering) belongs at the endpoint/query boundary, not in the store's public shape, unless a decision says otherwise' (and '## Data access posture': 'All() returns tasks in creation order')
- stops: none demanded
- dimensions: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2
- confidence: MEDIUM · scanSeq: 2
- adjudication: not due
