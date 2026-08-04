# Scan verdict 2 — K1

- FIRED M1 (by adjudication, surface auth) [TRG-002] — cite: intent 'Add API-key authentication to the /tasks endpoints' x posture '## Non-goals' bullet 'Authentication / authorization / multi-tenant concerns.' (unhedged non-goal; the [UNKNOWN] marker in the auth-posture section attaches only to 'for future intent', while that same section states 'Any auth is out of scope and would be strict, decision-bearing work.')
- FIRED M3 (by adjudication, surface contract-dependency) [TRG-003] — cite: intent 'Every request to any /tasks route (GET /tasks, GET /tasks/{id}, POST /tasks, PUT /tasks/{id}, DELETE /tasks/{id}) must present a valid API key in the X-Api-Key request header ... must be rejected with HTTP 401 Unauthorized' x posture '## API strategy' 'REST-ish CRUD over JSON. ... Validation today is minimal: Title required on create/update -> 400.' — a new mandatory request precondition on five ALREADY-PUBLIC routes: the route set itself is unchanged so the K3 route-delta scan structurally cannot see it, yet every currently-valid caller request now returns 401.
- stops: none demanded
- dimensions: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 2 · adr 2
- confidence: MEDIUM · scanSeq: 2
- adjudication: not due
