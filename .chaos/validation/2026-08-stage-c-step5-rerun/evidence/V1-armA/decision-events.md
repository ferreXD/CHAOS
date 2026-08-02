# Decision Events — secure-api-underspecified

Append-only ledger (`chaos-shared/reference/change-template.md` §2). `TRG-*` entries are
Stage-C trigger events, **not** decision entries under the §2 scan rule.

## TRG-001 — trigger fired: M2 sensitive-surface

- status: RECORDED (2026-08-02) · run: RUN-2026-08-02-frame-01
- trigger: M2 · by: scan · surface: auth
- cite: auth class: predicted scope includes src/TaskTracker.Api/Security/ApiKeyAuthMiddleware.cs
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0

## TRG-002 — trigger fired: M1 posture-crossing

- status: RECORDED (2026-08-02) · run: RUN-2026-08-02-frame-01
- trigger: M1 · by: adjudication · surface: auth
- cite: intent 'Add API-key credential enforcement so unauthenticated callers are rejected' x posture `.chaos/architecture.md` Non-goals 'Authentication / authorization / multi-tenant concerns' (and 'Authentication / authorization posture: None. The API is open. Any auth is out of scope and would be strict, decision-bearing work.')
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2

## PROP-DEC-001 — Accept crossing the "no authentication/authorization" non-goal, and approve the contract as framed?

- status: RESOLVED-IN-ARM (2026-08-02) · run: RUN-2026-08-02-frame-01 — resolved-in-arm (no live human; Stage-C step-5 mechanized run)
- approves-change: true
- options: A accept the crossing and record an ADR that moves the posture · B decline — keep the API open and solve exposure outside the app (gateway/network ACL) · C defer until the hosting model is decided
- recommendation: A — the ask states the API is about to be exposed publicly; the posture line that forbids auth was written for a process-lifetime local demo, and leaving it unchanged while shipping enforcement would leave `.chaos/architecture.md` lying about the subject.
- answer: A
- why-material: `.chaos/architecture.md` §Non-goals lists "Authentication / authorization / multi-tenant concerns" and the auth posture section says any auth "would be strict, decision-bearing work" — a human, not the agent, owns moving that posture (constitution §1, §6; R-001).
- sync-action: CREATE_ADR — the crossing is accepted, so the auth posture change owes a durable ADR (`docs/adr/2026-08-02-api-key-authentication.md`), promoted by `chaos:sync`; `chaos:verify` blocks READY until it exists (adr 2).
- knowledge: FACT · confidence: HIGH

## PROP-DEC-002 — Where does the API key value come from?

- status: RESOLVED-IN-ARM (2026-08-02) · run: RUN-2026-08-02-frame-01 — resolved-in-arm (no live human; Stage-C step-5 mechanized run)
- options: A read `Security:ApiKey` from configuration, supplied by environment/user-secrets; ship NO key value in the repo · B commit a default key in `appsettings.json` · C generate a key at startup and log it
- recommendation: A — a committed key is a published key; B would put credential material in a tracked file the moment this repo goes public, and C is unusable for a real client.
- answer: A — configuration key `Security:ApiKey`, bound from environment/user-secrets. `appsettings.json` may declare the key name with an **empty** value only. Absent/blank configured key at startup ⇒ the app fails fast rather than silently serving unauthenticated.
- why-material: this is the difference between "the API is secured" and "the API's credential is in git"; it decides what `appsettings.json` may contain and what deployment must supply. The task said "an API key" and nothing about provisioning.
- sync-action: AMEND_OPENSPEC_SPEC — the fail-fast-on-missing-key rule belongs in the delta spec.
- knowledge: INFERENCE · confidence: MEDIUM

## PROP-DEC-003 — Which surface does the key protect — everything, or is `GET /` left open?

- status: RESOLVED-IN-ARM (2026-08-02) · run: RUN-2026-08-02-frame-01 — resolved-in-arm (no live human; Stage-C step-5 mechanized run)
- options: A protect `/tasks/**` only; leave `GET /` (health/liveness) anonymous · B protect every route including `GET /` · C protect every route and add a separate anonymous `/health` route
- recommendation: A — `.chaos/architecture.md` §Observability names `GET /` as the liveness signal; requiring a credential on it breaks the only release-safety probe the subject has, and it exposes nothing but `{service, status}`.
- answer: A
- why-material: it decides the middleware's path predicate and the contract statements; getting it wrong either leaks data or breaks liveness checks. "Secure it" did not say what "it" is.
- sync-action: AMEND_OPENSPEC_SPEC
- knowledge: FACT · confidence: HIGH

## PROP-DEC-004 — Accept that every existing unauthenticated client breaks, with `401` and no grace period?

- status: RESOLVED-IN-ARM (2026-08-02) · run: RUN-2026-08-02-frame-01 — resolved-in-arm (no live human; Stage-C step-5 mechanized run)
- options: A hard cutover — missing/wrong key ⇒ `401 Unauthorized`, immediately, for all `/tasks` routes · B log-only/warn mode first, enforce later · C `403 Forbidden` instead of `401`
- recommendation: A — the stated reason for the change is that the API is about to be public; a warn-only mode ships the vulnerability it was meant to close. `401` is the correct code for absent/invalid credentials (`403` means authenticated-but-not-permitted, which this scheme cannot distinguish).
- answer: A — `X-Api-Key` request header; missing or non-matching ⇒ `401`; comparison is fixed-time; the response body carries no hint about the expected key.
- why-material: this is an observable, breaking behaviour change to the public HTTP contract, and the existing 5 integration tests all call `/tasks` anonymously — they must be updated as part of the change (R-003).
- sync-action: AMEND_OPENSPEC_SPEC
- knowledge: FACT · confidence: HIGH
