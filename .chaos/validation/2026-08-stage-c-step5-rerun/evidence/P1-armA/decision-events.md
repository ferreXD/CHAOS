# Decision events — require-api-key-auth

Append-only ledger (`chaos-shared/reference/change-template.md` §2). `TRG-*` headings are
trigger events, not decision entries.

## TRG-001 — trigger fired: M2 sensitive-surface

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-propose-require-api-key-auth-8953c4
- trigger: M2 · by: scan · surface: auth
- cite: auth class: predicted scope includes src/TaskTracker.Api/Security/ApiKeyEndpointFilter.cs
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0

## TRG-002 — trigger fired: M1 posture-crossing

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-propose-require-api-key-auth-8953c4
- trigger: M1 · by: adjudication · surface: auth
- cite: intent 'every request to GET /tasks, GET /tasks/{id}, POST /tasks, PUT /tasks/{id} and DELETE /tasks/{id} must present a valid API key in the X-Api-Key request header' x posture Non-goals 'Authentication / authorization / multi-tenant concerns' (and 'Authentication / authorization posture: None. The API is open. Any auth is out of scope')
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2

## PROP-DEC-001 — Approve requiring X-Api-Key on /tasks, accepting the architecture non-goal crossing?

- status: RESOLVED-IN-ARM · resolved-in-arm (no live human; Stage-C step-5 mechanized run) (2026-08-03)
- approves-change: true
- options: A approve as framed — enforce X-Api-Key on the /tasks group only, key from config `ApiKey` (default `test-secret-key`), 401 before any store read/mutation, `GET /` stays public, and record an ADR that supersedes the "auth is a non-goal" posture · B approve but enforce globally (including `GET /`) · C reject — keep the API open and close the change
- recommendation: A — it is exactly the stated contract, keeps the health probe usable, and the ADR discharges the M1 crossing rather than hiding it
- answer: A
- why-material: the change crosses two recorded posture statements — `.chaos/architecture.md` Non-goals "Authentication / authorization / multi-tenant concerns" and "Authentication / authorization posture: None. The API is open. Any auth is out of scope" (M1@K1) — and lands on the auth sensitive surface (M2@K1); folded questions carried by this stop: (1) accept the non-goal crossing? (2) enforcement boundary — `/tasks` group only vs global? (3) key source and fallback — config `ApiKey` with the `test-secret-key` default?
- sync-action: CREATE_ADR — `adr 2` is owed by the M1 firing; ADR-001 records the superseded posture
- knowledge: FACT · confidence: HIGH
