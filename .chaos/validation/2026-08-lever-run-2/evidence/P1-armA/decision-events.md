## TRG-001 — trigger fired: M2 sensitive-surface

- status: RECORDED (2026-08-04) · run: chaos-run-20260804-p1arma
- trigger: M2 · by: scan · surface: auth
- cite: auth class: predicted scope includes src/TaskTracker.Api/Security/ApiKeyEndpointFilter.cs
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0

## TRG-002 — trigger fired: M1 posture-crossing

- status: RECORDED (2026-08-04)
- trigger: M1 · by: adjudication · surface: auth
- cite: intent 'Add API-key authentication to the /tasks endpoints' x posture '## Non-goals' bullet 'Authentication / authorization / multi-tenant concerns.' (unhedged non-goal; the [UNKNOWN] marker in the auth-posture section attaches only to 'for future intent', while that same section states 'Any auth is out of scope and would be strict, decision-bearing work.')
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 2 · adr 2

## TRG-003 — trigger fired: M3 contract-surface

- status: RECORDED (2026-08-04)
- trigger: M3 · by: adjudication · surface: contract-dependency
- cite: intent 'Every request to any /tasks route (GET /tasks, GET /tasks/{id}, POST /tasks, PUT /tasks/{id}, DELETE /tasks/{id}) must present a valid API key in the X-Api-Key request header ... must be rejected with HTTP 401 Unauthorized' x posture '## API strategy' 'REST-ish CRUD over JSON. ... Validation today is minimal: Title required on create/update -> 400.' — a new mandatory request precondition on five ALREADY-PUBLIC routes: the route set itself is unchanged so the K3 route-delta scan structurally cannot see it, yet every currently-valid caller request now returns 401.
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 2 · adr 2

## RUN-DEC-001 — Approve requiring an API key on /tasks: the posture crossing, the shared-key mechanism, and the breaking contract change?

- status: RESOLVED-IN-ARM (resolved-in-arm (no live human; lever-run mechanized run), 2026-08-04)
- approves-change: true
- options: A approve as framed — endpoint filter on the /tasks group, key from config `ApiKey` defaulting to `test-secret-key`, 401 before existence/validation, `GET /` public, crossing recorded in an ADR · B approve auth but change the mechanism or key posture (require `ApiKey` configured and fail startup when unset, or adopt a full ASP.NET authentication scheme) · C reject — keep the API open and leave the architecture Non-goals intact · D stop / defer until a maintainer weighs the accepted risks
- recommendation: A — every parameter that would otherwise be debated (header name, config key, default value, status code, ordering, public carve-out) is already pinned by the incoming contract; the residual risks are bounded, recorded and reversible in one line.
- answer: A
- why-material: The change crosses an explicit recorded non-goal, introduces credential enforcement, and breaks the request contract of five already-public routes — three materiality triggers (M1/M2/M3) at intent, none of which the repository answers on its own.
- folds: 4 — frame approval (intent + K1 classification + the 10-statement contract + the OpenSpec depth-2 artifacts) · M1 posture-crossing: amend the architecture's auth Non-goal for the /tasks surface via ADR 2026-08-04-api-key-authentication · M2 sensitive-surface: accept a single shared key read from configuration with the committed default `test-secret-key` (accepted risks AR-1/AR-2) rather than a secret store · M3 contract-surface: accept an immediately breaking change for every existing /tasks caller, with no grace period and no dual-mode opt-out (accepted risk AR-3)
- resolution: Approved as framed (A). Maintainer-style rationale: (1) the posture crossing is the point of the request, not a side effect — the architecture text already anticipated auth arriving as "strict, decision-bearing work", and this is that decision, recorded in an ADR whose sync action amends the posture so the docs stop contradicting the code; (2) the shared-key mechanism and its committed default are pinned by the approved contract, so option B would be the agent overriding the requester on a demo-scoped credential — the honest move is to accept it and make the deployment obligation visible as AR-1 rather than quietly harden it; (3) the break is accepted deliberately: this repository's only /tasks callers are its own integration tests, which are updated in the same change, so a grace period or a disable-auth switch would buy nothing and leave a standing hole; (4) option C is not available — refusing would ignore the explicit instruction, and D would defer a decision that has no missing evidence. Enforcement must sit on the /tasks group (never app-wide) so `GET /` stays public.
- sync-action: CREATE_ADR + RECORD_ACCEPTED_RISK — promote `.chaos/changes/require-api-key-auth/adr/2026-08-04-api-key-authentication.md` to `docs/adr/`, amend the architecture auth posture + Non-goals, and carry AR-1..AR-5 forward
- knowledge: FACT · confidence: HIGH

## TRG-004 — trigger fired: M4 decision-density

- status: RECORDED (2026-08-04)
- trigger: M4 · by: scan · surface: process
- cite: ledger scan rule: 4 material question(s) across 1 entry >= threshold 2
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 1 · openspec 2 · adr 2
