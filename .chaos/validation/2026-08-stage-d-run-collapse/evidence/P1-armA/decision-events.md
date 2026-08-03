# Decision events — require-api-key-auth

Append-only ledger (`change-template.md` §2). `TRG-*` headings are trigger events, **not**
decision entries, and never count toward `lifecycle.current.decisions` or M4.

## TRG-001 — trigger fired: M2 sensitive-surface

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-run-require-api-key-auth-2b53b7
- trigger: M2 · by: scan · surface: auth
- cite: auth class: predicted scope includes src/TaskTracker.Api/Security/ApiKeyEndpointFilter.cs
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0

## TRG-002 — trigger fired: M1 posture-crossing

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-run-require-api-key-auth-2b53b7
- trigger: M1 · by: adjudication · surface: auth
- cite: intent "Add API-key authentication to the /tasks endpoints … must present a valid API key in the X-Api-Key request header" × posture `.chaos/architecture.md` Non-goals "Authentication / authorization / multi-tenant concerns." (and "Authentication / authorization posture: None. The API is open. `[FACT]`. Any auth is out of scope and would be strict, decision-bearing work.")
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2

## PROP-DEC-001 — Approve the frame: close a deliberately-open API with an API-key gate on `/tasks`?

- status: ANSWERED (agent-maintainer, 2026-08-03) · RESOLVED-IN-ARM · resolved-in-arm (no live human; Stage-D mechanized run)
- approves-change: true
- options: A Approve as framed — endpoint-filter gate on the `/tasks` group, key from config `ApiKey` defaulting to `test-secret-key`, `GET /` public, ADR-001 records the accepted crossing, delta spec at depth 1 · B Approve but drop the committed default — require `ApiKey` to be configured or the app refuses to serve `/tasks` · C Reject / defer — keep the recorded non-goal and do not add authentication
- recommendation: A — the change contract pins the default key and the 401 semantics exactly; B contradicts the contract under test and C rejects the requested change outright
- answer: A
- why-material: three material questions fold here — accepting a posture crossing against a recorded non-goal, committing a default credential into the repository, and approving the classified rigor (openspec 1 + adr 2 + verify 1) that follows from them
- folds: 3 — accept the auth posture crossing (M1/TRG-002) · accept credential enforcement plus a committed default key on the `auth` surface (M2/TRG-001) · approve intent + contract + classified artifact depth (frame approval, C-11 floor)
- sync-action: CREATE_ADR + AMEND_OPENSPEC_SPEC — ADR-001 authored at the firing; `.chaos/architecture.md` auth posture/Non-goals reconciliation is `chaos:sync`'s job at archive, not this run's
- knowledge: FACT · confidence: HIGH

## TRG-003 — trigger fired: M4 decision-density

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-run-require-api-key-auth-2b53b7
- trigger: M4 · by: scan · surface: process
- cite: ledger scan rule: 3 material question(s) across 1 entry >= threshold 2 (PROP-DEC-001 declares `folds: 3`)
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 1 · openspec 1 · adr 2
