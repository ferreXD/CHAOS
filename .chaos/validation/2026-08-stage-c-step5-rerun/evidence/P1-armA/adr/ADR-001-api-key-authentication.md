# ADR-001 — API-key authentication on the task endpoints

Status: Accepted
Date: 2026-08-03
Source: PROP-DEC-001 (change `require-api-key-auth`)
Trigger: TRG-002 (M1 posture-crossing, adjudication, surface `auth`) — `adr 2` obligation
Supersedes (in part): `.chaos/architecture.md` — "Authentication / authorization posture: None.
The API is open." and the Non-goal "Authentication / authorization / multi-tenant concerns"

## Context

`.chaos/architecture.md` records two explicit posture statements that this change moves against:
the auth posture ("None. The API is open. Any auth is out of scope") and the Non-goals entry
"Authentication / authorization / multi-tenant concerns". The Stage-C classifier fired M1
(posture-crossing) at K1 on exactly that pair, which raises `adr` to 2: the crossing may be
accepted, but only on the record.

## Decision

The Task Tracker API enforces **API-key authentication on the `/tasks` route group**:

- Every `/tasks` request must carry the header `X-Api-Key`.
- The valid key is the string value of configuration key `ApiKey`, defaulting to
  `test-secret-key` when that configuration value is not set.
- A missing or incorrect key is rejected with `401 Unauthorized` **before** any existence or
  payload-validation check, so no task is read or mutated.
- The root health endpoint `GET /` remains public.

Enforcement lives at the HTTP boundary (an endpoint filter on the `/tasks` group), not in the
domain — the boundary posture and R-004 are unchanged: `Domain/**` gains no ASP.NET reference.

## Rationale

Auth was a non-goal because the demo subject had no notion of callers. The approved change
(PROP-DEC-001, option A) introduces one, so the non-goal no longer holds for the task resource.
Scoping enforcement to the `/tasks` group keeps the liveness probe usable and confines the
crossing to the surface the decision actually covers. A single shared key read from
configuration is the smallest mechanism that satisfies the contract; it is deliberately **not**
an identity system — no users, roles, tenants, or rotation.

## Consequences

- The API is no longer open: existing clients of `/tasks` must send `X-Api-Key`. This is a
  behavioural change to a public surface, not a route removal.
- The `test-secret-key` fallback is a **development default**. Any real deployment must set
  `ApiKey` in configuration; leaving it unset ships a publicly known key.
- Authorization (roles/scopes), multi-tenancy, key rotation, and key storage remain non-goals.
- `.chaos/architecture.md` now has a decision that overrides its auth posture; a future
  `chaos:sync` should reconcile the posture section and the Non-goals list against this ADR.

## Provenance trail

- TRG-001 (M2 sensitive-surface, scan, `auth`) — raised `verify` and `evidence.targeted`.
- TRG-002 (M1 posture-crossing, adjudication, `auth`) — raised `openspec` to 1 and `adr` to 2.
- PROP-DEC-001 (propose, `approves-change`) — accepted the crossing, option A.
