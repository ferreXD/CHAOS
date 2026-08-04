## TRG-001 — trigger fired: M2 sensitive-surface

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-run-require-api-key-auth
- trigger: M2 · by: scan · surface: auth
- cite: auth class: predicted scope includes src/TaskTracker.Api/Auth/ApiKeyEndpointFilter.cs
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0

## TRG-002 — trigger fired: M1 posture-crossing

- status: RECORDED (2026-08-03)
- trigger: M1 · by: adjudication · surface: auth
- cite: intent 'Add API-key authentication to the /tasks endpoints ... must present a valid API key in the X-Api-Key request header' x posture Non-goals 'Authentication / authorization / multi-tenant concerns' and posture section 'Authentication / authorization posture: None. The API is open. [FACT]. Any auth is out of scope and would be strict, decision-bearing work.'
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2

## RUN-DEC-001 — Approve requiring an API key on `/tasks`, crossing the recorded "no authentication" non-goal?

- status: RESOLVED-IN-ARM (2026-08-03) · run: RUN-2026-08-03-chaos-run-require-api-key-auth
- approves-change: true
- options: A approve the change as specified and amend the auth posture via the authored ADR · B approve the enforcement but reject the committed `test-secret-key` default (fail closed when `ApiKey` is unset) · C reject: keep the API open and close the change · D stop / defer pending a maintainer decision on the wider auth story
- recommendation: A — the contract is fully specified and the posture crossing is the point of the change, not an accident; the ADR makes the amendment auditable
- answer: A
- why-material: the intent contradicts an explicit, unhedged architecture non-goal ("Authentication / authorization / multi-tenant concerns") and introduces credential enforcement plus a committed default key — constitution §6 requires an explicit human-approved posture change, not a silent one
- folds: 3 — approve-change-intent-and-scope · M1/TRG-002 posture-crossing + ADR amendment (surface auth) · M2/TRG-001 auth mechanism, enforcement placement and the committed `test-secret-key` default (surface auth)
- sync-action: CREATE_ADR + RECORD_ACCEPTED_RISK — carry `.chaos/changes/require-api-key-auth/adr/2026-08-03-api-key-authentication-on-task-endpoints.md` into `.chaos/architecture.md` §"Authentication / authorization posture", narrow the §Non-goals entry to authorization / multi-tenancy, and record the committed demo default as accepted risk
- knowledge: FACT · confidence: HIGH
- resolution-rationale: resolved-in-arm (no live human; lever-run mechanized run). Maintainer-style rationale for A over the alternatives. **Against C (reject):** the request is the repository owner's stated intent and the non-goal it crosses is a demo-scoping statement, not a safety invariant; rejecting would be substituting the agent's reading of an init-generated posture doc for the human's expressed goal. **Against B (fail closed when unset):** attractive on security grounds, and it is what a hosted service should do — but the task contract states the default verbatim ("defaulting to `test-secret-key` when that configuration value is not set"), so B would deliver something other than what was asked. The right home for that concern is a recorded todo plus the ADR's explicit statement that the default must be removed before any real hosting, not a unilateral contract change. **Against D (defer):** nothing is unknown; the contract pins header name, config key, default, status code, and check ordering. Deferring would buy no information. **For A:** the crossing is narrow — a single shared key on one route group, with authorization and multi-tenancy left standing as non-goals — and it is recorded, not silent.

## TRG-003 — trigger fired: M4 decision-density

- status: RECORDED (2026-08-03)
- trigger: M4 · by: scan · surface: process
- cite: ledger scan rule: 3 material question(s) across 1 entry >= threshold 2
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 1 · openspec 1 · adr 2

## RUN-DEC-002 — The accepted ADR places enforcement in an endpoint filter, but a filter cannot run before model binding. Where does enforcement go?

- status: RESOLVED-IN-ARM (2026-08-03) · run: RUN-2026-08-03-chaos-run-require-api-key-auth
- options: A routing-aware middleware gated on endpoint metadata carried by the `/tasks` group — amend the ADR's placement clause · B keep the endpoint filter and accept that an absent/unbindable request body yields 400 before the 401 · C path-matching global middleware on the `/tasks` prefix · D stop / defer
- recommendation: A — it is the only option that satisfies the contract's ordering clause without reintroducing path-matching as the definition of "protected"
- answer: A
- why-material: the change contradicts an ADR accepted under `RUN-DEC-001` (constitution §6 requires an explicit decision to move an accepted posture, not a silent redesign), and the evidence is a concrete contract failure — four tests show `POST /tasks` and `PUT /tasks/{id}` returning 400 Bad Request with no API key, violating C-007 ("the authentication check runs before payload validation")
- folds: 2 — enforcement placement vs the accepted ADR (surface auth) · scope amendment: the auth file's path changes from the predicted `Auth/ApiKeyEndpointFilter.cs` to `Auth/ApiKeyAuthentication.cs`, since the type is no longer a filter
- sync-action: CREATE_ADR — amend the existing ADR's Decision clause 1 in place (same ADR, same change) to record middleware-after-routing as the mechanism of record and why the filter was rejected
- knowledge: FACT · confidence: HIGH
- resolution-rationale: resolved-in-arm (no live human; lever-run mechanized run). The evidence is mechanical, not a matter of taste: in ASP.NET Core minimal APIs the generated request delegate binds parameters *before* invoking the endpoint-filter pipeline, because `EndpointFilterInvocationContext.Arguments` must already hold the bound arguments. A request with no body therefore fails binding and returns 400 without the filter ever running. **Against B:** it leaves an unauthenticated caller able to elicit a 400 from a protected route, which is precisely the ordering property the contract calls out and the one the ADR named as "the security-meaningful ordering property". Accepting B would mean shipping a contract statement (C-007) that the tests show to be false. **Against C:** path matching makes "protected" a string comparison — the exact brittleness RK-1 was mitigated against, and it would silently miss or over-match future routes. **For A:** the `/tasks` group carries a metadata marker and middleware placed after `UseRouting()` reads it from the selected endpoint. Group membership still confers protection (RK-1's mitigation survives intact), and enforcement now happens after endpoint selection but before the endpoint's delegate binds anything, satisfying C-006, C-007 and C-008 together. The ADR's *intent* — protection derived from group membership rather than from a path string — is preserved; only its mechanism clause changes, and it is amended in place with the reason recorded.

## TRG-004 — trigger fired: X2 self-review-fail

- status: RECORDED (2026-08-04)
- trigger: X2 · by: scan · surface: none
- cite: self-review verdict 'pass' != clean
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 2 · verify 1 · openspec 1 · adr 2
