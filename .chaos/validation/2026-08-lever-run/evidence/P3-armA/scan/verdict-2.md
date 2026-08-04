# Scan verdict 2 — K1

- FIRED M1 (by adjudication, surface data-store) [TRG-002] — cite: intent 'Add an integer version to the task ... Every successful PUT /tasks/{id} increments the task's version by 1 ... the update must be rejected with HTTP 409 Conflict and the task must be left unchanged' x posture 'Module / boundary model' -> 'Keep that direction - new behaviour (e.g. filtering) belongs at the endpoint/query boundary, not in the store's public shape, unless a decision says otherwise'
- stops: none demanded
- dimensions: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2
- confidence: MEDIUM · scanSeq: 2
- adjudication: not due
