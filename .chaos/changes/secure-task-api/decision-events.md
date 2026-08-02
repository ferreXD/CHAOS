---
chaosMetadata:
  schemaVersion: 1
  artifactType: decision-events
  artifactScope: change
  changeId: secure-task-api
  sourceCommand: "chaos:propose"
---

# Decision Events — secure-task-api

Append-only. Entry shape: `chaos-shared/reference/change-template.md` §2.

## ESC-001 — auto-escalated: intent crosses the auth/authorization architecture non-goal

- status: RECORDED (2026-08-01)
- from: light · to: standard
- trigger: posture-crossing
- kept-work: the scoped evidence scan, classification, provisional §Contract and §Review in `change.md`, and this ledger all seed the standard path; nothing is re-derived.
- evidence: `.chaos/architecture.md` §Non-goals — "Authentication / authorization / multi-tenant concerns"; §Authentication/authorization posture — "Any auth is out of scope and would be strict, decision-bearing work". Secondary trigger: 3 material decisions surfaced against `policies.lightMode.maxMaterialDecisions: 2`.
- knowledge: FACT · confidence: HIGH

## PROP-DEC-001 — What does "secure the API" cover in this change?

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- runtime-decision: DEC-2026-08-01-secure-task-api-scope-what-does-secure-t-b66e
- options: A authn-only — every `/tasks` route requires a credential; nothing else changes · B authn-plus-edge — A, plus rate limiting, CORS policy, security headers and request size limits · C edge-hardening-only — no credentials; abuse controls only · D authn-plus-authz — A, plus per-caller roles/scopes over the CRUD verbs
- recommendation: B — "before we expose it" reads as exposure readiness, and an unauthenticated-but-open surface is not exposure-ready
- answer: B authn-plus-edge — rationale: "Easier for PoC"
- impact: §Contract now carries 4 authentication and 4 edge-hardening statements. Per-caller authorization is an explicit non-goal, leaving RK-4 (no owner field on `TaskItem`, so authenticated ≠ authorized for a given task) as a recorded known gap.
- sync-action: AMEND_OPENSPEC_SPEC
- why-material: sets the OpenSpec spec deltas, the §Contract statements, the risk class, and whether an ADR is required
- knowledge: INFERENCE · confidence: MEDIUM

## PROP-DEC-002 — Who will be able to reach the API once exposed?

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- runtime-decision: DEC-2026-08-01-secure-task-api-exposure-target-who-will-fc03
- options: A internal-network · B public-internet · C partner-service-to-service · D not-decided-yet
- recommendation: none — the repository records no deployment target, so no evidence supports one
- answer: B public-internet
- impact: risk class raised to CRITICAL; rate limiting becomes mandatory rather than optional; expiring credentials are now a requirement of the approach-alignment options; TLS termination becomes material (PROP-DEC-005). Resolves the `[UNKNOWN]` in `.chaos/context.md` §Environments for this change only — the repository still records no CD target.
- sync-action: CREATE_ADR (hosting/exposure posture is now decision-bearing)
- why-material: drives the credential mechanism, whether rate limiting is mandatory, and whether risk is HIGH or CRITICAL
- knowledge: UNKNOWN · confidence: LOW

## PROP-DEC-003 — Escalate governance rigor from --standard to --strict?

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- runtime-decision: DEC-2026-08-01-secure-task-api-governance-rigor-escalat-9cd5
- options: A strict — exact source manifest, mandatory `chaos:review`, ADR for the new auth posture, blocking evidence gaps stop the proposal · B standard-with-recorded-rationale — normal depth, rationale recorded, confidence capped · C stop
- recommendation: A — auth/security is a HIGH/CRITICAL risk trigger and the architecture calls auth "strict, decision-bearing work"
- answer: A strict — rationale: "The most reasonable answer here"
- escalates: standard → strict
- impact: `mode: strict`, `escalatedFrom: standard`. Adds the exact source manifest, the risk table and the traceability section to `change.md`; makes `chaos:review` mandatory before implementation; makes the auth-posture ADR a contract statement rather than a deferred follow-up; makes the missing archaeology a blocking gap requiring a waiver (PROP-DEC-006).
- sync-action: NONE
- why-material: sets evidence depth, whether `chaos:review` is mandatory, and whether an ADR blocks readiness
- knowledge: FACT · confidence: HIGH

## PROP-DEC-004 — Approach alignment: which credential mechanism secures the public-internet surface?

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- runtime-decision: DEC-2026-08-01-secure-task-api-approach-alignment-which-d097
- options: A api-key-header — shared secret in `X-Api-Key`; no expiry, no rotation, no revocation · B jwt-bearer-self-issued — `Microsoft.AspNetCore.Authentication.JwtBearer`, signing key from configuration, tokens expire · C oidc-external-idp — delegate to an external IdP; none exists in this repo · D mtls — client certificates
- recommendation: B — the only option giving expiring credentials without depending on infrastructure that does not exist, and the cheapest one that survives a strict review of a public-internet surface
- answer: B jwt-bearer-self-issued — rationale: "Easier for PoC"
- impact: this is the **Approach Alignment Checkpoint** outcome and unblocks the OpenSpec invocation gate. Adds `Microsoft.AspNetCore.Authentication.JwtBearer`; `AddAuthentication`/`AddAuthorization` in `Program.cs`; `RequireAuthorization()` on the `/tasks` group; signing key + issuer/audience from configuration with fail-fast on absence. **Token issuance is explicitly out of scope** — nothing in this repository will mint tokens (recorded as a non-goal, not an omission).
- why-material: selects the implementation approach; sets the OpenSpec spec deltas and `design.md`
- knowledge: INFERENCE · confidence: MEDIUM
- sync-action: CREATE_ADR

## PROP-DEC-005 — Transport: who terminates TLS in front of the public-internet surface?

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- runtime-decision: DEC-2026-08-01-secure-task-api-transport-who-terminates-04da
- options: A app-terminates-tls — Kestrel serves HTTPS; `UseForwardedHeaders` not registered · B reverse-proxy-terminates — forwarded headers registered with a configured trusted set · C cdn-or-gateway-terminates · D not-decided-yet
- recommendation: A — the only option satisfying R-008 without proxy addresses that do not exist yet; R-008 itself names "do not register the middleware" as the safe default
- answer: A app-terminates-tls
- impact: **R-008 is satisfied by construction** — `UseForwardedHeaders` is not registered at all, so no trusted-proxy set can be left empty. Enables `UseHttpsRedirection` + `UseHsts`; the rate limiter partitions on the real remote IP.
- why-material: decides HSTS/HTTPS-redirection, whether forwarded-headers middleware is registered under blocker rule R-008, and the rate limiter's caller identity
- knowledge: INFERENCE · confidence: MEDIUM
- sync-action: AMEND_OPENSPEC_SPEC

## PROP-DEC-006 — Evidence: waive the archaeology requirement for this strict change?

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- runtime-decision: DEC-2026-08-01-secure-task-api-evidence-waive-the-archa-0de0
- type: EVIDENCE_WAIVER
- options: A waive-with-recorded-rationale · B run-archaeology-first · C stop
- recommendation: A — the subject is ~150 lines across six files, all read directly and listed in the source manifest; the auth surface is greenfield; the 5 integration tests document current endpoint behaviour precisely
- answer: A waive-with-recorded-rationale — rationale: "Not needed"
- impact: strict's brownfield archaeology requirement is waived. Per `risk-classification.md` a waiver must lower confidence **unless equivalent evidence exists** — the `change.md` source manifest plus the green test baseline are claimed as that equivalent evidence, so confidence is **not** further reduced. `chaos:review` re-tests this claim.
- why-material: strict blocks a brownfield change without archaeology or an explicit waiver
- knowledge: INFERENCE · confidence: MEDIUM
- sync-action: RECORD_ACCEPTED_RISK

## Runtime note — session re-issued mid-resume

Not a decision entry; recorded so the audit trail is legible.

Run `RUN-…-d6b050` was cancelled and the command continued under `RUN-…-e2858e`. Cause: PROP-DEC-004/005/006 were written to disk while the session was still `ready-to-resume`, a state from which the runtime rejects the `waiting-for-decision` transition, leaving the three decisions unregistered on the session and lock. Left as-is, the session could never have reached `ready-to-resume` again and `chaos:resume` would have found no candidate. No decision or response artifact was deleted; all six decisions and their responses are intact. Follow-up: `chaos:doctor` should confirm no orphaned lock remains.

## REV-DEC-001 — REV-001 (BLOCKING): the architecture posture still declares auth a non-goal

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- runtime-decision: DEC-2026-08-01-secure-task-api-rev-001-blocking-the-arc-77a8
- answer: A amend-tasks-and-record-obligation — rationale: "Needed for demo purposes"
- severity: BLOCKING · type: FACT · confidence: HIGH · fixability: FIXABLE_NOW + NEEDS_ADR_OR_DECISION_LOG
- evidence: `.chaos/architecture.md` §Non-goals line 100 "Authentication / authorization / multi-tenant concerns"; §Authentication/authorization posture "None. The API is open."; `.chaos/context.md` "[UNKNOWN] Persistence, auth, and multi-user concerns are out of scope for the demo". Both become false once this ships. `modes.md` --strict: "Missing ADR/rule alignment is blocking."
- options: A amend-tasks-and-record-obligation · B block-until-architecture-updated · C accept-risk-and-defer · D keep-blocking
- recommendation: A — records the governance obligation as a decision event (so `chaos:sync` must reconcile) rather than papering over an ADR conflict with a tasks.md edit
- impact: `tasks.md` gains 5.1a (the ADR must explicitly supersede the architecture non-goal) and 5.1b (the reconciliation obligation). Finding status RESOLVED_DURING_REVIEW.
- sync-action: CREATE_ADR + UPDATE_CHAOS_RULES — `chaos:sync` must reconcile `.chaos/architecture.md` §Non-goals and §Authentication/authorization posture, and `.chaos/context.md`, after archive
- why-material: strict cannot reach READY_FOR_APPROVAL while committed governance contradicts the change
- knowledge: FACT · confidence: HIGH

## REV-DEC-002 — REV-002 (MAJOR): rate limiting may not cover unauthenticated callers

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- runtime-decision: DEC-2026-08-01-secure-task-api-rev-002-major-does-rate-cf49
- answer: A amend-spec-and-tasks — rationale: "Needed for demo purposes"
- severity: MAJOR · type: INFERENCE · confidence: MEDIUM · fixability: FIXABLE_NOW
- evidence: `specs/api-edge-hardening/spec.md` never distinguishes authenticated from unauthenticated callers; `design.md` D5 partitions on "the authenticated caller where available"; `tasks.md` 2.3 and 3.1 apply `RequireAuthorization()` and the limiter to the same group with no stated middleware order. If `UseAuthorization()` precedes `UseRateLimiter()`, 401s consume no permit and the auth path floods for free. `GET /` is anonymous and outside the group, so unthrottled.
- options: A amend-spec-and-tasks · B limit-authenticated-only · C defer-to-hosting · D keep-open
- recommendation: A — on a `public-internet` surface the untrusted population is the unauthenticated one; throttling only authenticated traffic is the wrong threat model
- impact: `specs/api-edge-hardening` gains two requirements ("Rate limiting applies to unauthenticated traffic", "The liveness endpoint is rate limited") with five scenarios; `design.md` D5 now pins `UseRateLimiter()` before authentication as part of the decision; `tasks.md` gains 3.1a, 3.1b, 4.7a, 4.7b. Finding status RESOLVED_DURING_REVIEW.
- sync-action: AMEND_OPENSPEC_SPEC
- why-material: determines whether edge hardening actually protects the exposed surface
- knowledge: INFERENCE · confidence: MEDIUM

## REV-DEC-003 — REV-003 (MAJOR): no token issuer exists in the repository

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- runtime-decision: DEC-2026-08-01-secure-task-api-rev-003-major-nothing-ca-a3a7
- severity: MAJOR · type: FACT · confidence: HIGH · fixability: NEEDS_USER_DECISION
- evidence: issuance is scoped out consistently in `proposal.md` non-goals, `design.md` D1, and `specs/api-authentication` "Requirement: Token issuance is out of scope". Tests mint tokens with a test key (task 4.1), so the suite goes green while the deployed API stays uncallable. Already recorded as RK-5.
- options: A ship-as-scoped · B add-issuance-to-scope · C add-dev-only-issuance · D block
- recommendation: A ship-as-scoped
- answer: **C add-dev-only-issuance** — rationale: "Needed for demo purposes and easier to PoC". **This went against the recommendation**, which is recorded rather than silently normalised: the review flagged that a dev-only auth bypass on a service heading for public exposure is the kind of thing that survives to production.
- impact: scope widened. `proposal.md` non-goal changed from "token issuance" to "production token issuance"; `specs/api-authentication` replaces the out-of-scope requirement with a gated issuance requirement (4 scenarios) plus a narrowed out-of-scope requirement; `design.md` gains D7; `tasks.md` gains group 3b (4 tasks) and 4.7c/4.7d. The endpoint is gated on **two independent conditions** — `IsDevelopment()` **and** an opt-in flag defaulting off — and is registration-time, so the route is absent rather than guarded. Recorded as RK-8, the highest residual risk in the change. Finding status RESOLVED_DURING_REVIEW (accepted risk, mitigated).
- sync-action: RECORD_ACCEPTED_RISK
- why-material: decides whether the change delivers a usable system or a correct-but-uncallable one
- knowledge: FACT · confidence: HIGH

## REV-DEC-004 — Approval handoff: approve secure-task-api for implementation (conditions attached)?

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- approves-change: true
- runtime-decision: DEC-2026-08-01-secure-task-api-approval-handoff-approve-e123
- options: A approve-with-conditions · B approve-after-advisories · C request-revision · D reject
- recommendation: A — all three material findings are remediated and OpenSpec re-validates strict; the two conditions are carried by `chaos:verify` and `chaos:sync`, not by further proposal work
- answer: A approve-with-conditions — rationale: "Risk accepted"
- impact: **this entry is the approval.** `lifecycle.status` → `Approved`; `phases.review` complete with verdict `READY_WITH_CONDITIONS`. `chaos:apply secure-task-api` is unblocked. The two conditions are not discharged by this approval — they bind `chaos:verify` and `chaos:sync`. RK-8 (dev issuance endpoint reaching a deployed environment) is explicitly accepted by the human.
- sync-action: RECORD_ACCEPTED_RISK
- conditions: (1) `chaos:verify` confirms the dev issuance gate is registration-time and tests assert `404` outside Development; (2) `chaos:sync` reconciles `.chaos/architecture.md` and `.chaos/context.md` after archive
- why-material: this is the approval gate; answering A sets `approves-change: true` and unlocks `chaos:apply`
- knowledge: FACT · confidence: MEDIUM

## Runtime note — second session re-issue

Not a decision entry.

`RUN-…-dffba6` hit the same `ready-to-resume → waiting-for-decision` fault recorded above, this time when creating the approval decision; the review continued under `RUN-…-252c7b`. The orphaned decision `DEC-…-approval-handoff-approve-792e` was **cancelled** (state preserved, not deleted) and re-created cleanly as `…-e123`. Root cause is the same runtime ordering defect: `createDecision` writes the decision artifact before validating the session transition, so a rejected transition leaves an unregistered `waiting` decision. Any command creating a decision on a `ready-to-resume` session must call `resumeCommand` first.

## APPLY-DEC-001 — Options types placed in `Program.cs` rather than a new `Security/` folder

- status: RECORDED (2026-08-01) · run: RUN-2026-08-01-chaos-apply-secure-task-api-70104b
- type: DESIGN_DECISION
- decision: `AuthOptions` and `ApiLimits` live at the bottom of `Program.cs`.
- rationale: task 1.3 did not name a location; creating `src/TaskTracker.Api/Security/*.cs` would have added a file outside the approved scope list, and strict forbids drift without a formal amendment. No behavioural difference.
- knowledge: FACT · confidence: HIGH
- sync-action: NONE

## APPLY-DEC-002 — The rate limiter's "authenticated caller" partition branch is unreachable as specified

- status: RECORDED (2026-08-01) · run: RUN-2026-08-01-chaos-apply-secure-task-api-70104b
- type: DEFERRED_DECISION
- decision: implement both requirements literally and flag the tension rather than resolve it during apply.
- detail: `specs/api-edge-hardening` requires the partition key to be "the authenticated caller when one is available and the remote IP address otherwise", while REV-DEC-002 requires `UseRateLimiter()` to precede authentication. Since `context.User` is unpopulated at that point, every request partitions by remote IP and the authenticated branch never executes.
- rationale: changing the partition strategy (e.g. hashing the presented bearer token) would be a SPEC_DRIFT decision, which strict forbids at apply time. Both requirements are honoured as written; the dead branch is reported rather than silently removed.
- knowledge: FACT · confidence: HIGH
- sync-action: AMEND_OPENSPEC_SPEC
- follow-up owner: `chaos:verify` / `chaos:sync`

## ARC-DEC-001 — Archive secure-task-api with debt, leaving the architecture posture unreconciled?

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- runtime-decision: DEC-2026-08-01-secure-task-api-archive-secure-task-api-e1fe
- options: A archive-with-debt · B sync-first-then-archive · C stop
- recommendation: B — one extra maintainer round discharges D-1…D-4 and lets the change close nearer to clean; archiving now permanently closes it with `.chaos/architecture.md` stating the API has no authentication
- answer: B sync-first-then-archive — rationale: "Better for demo purposes"
- impact: **no archive was executed.** `openspec archive` was not run, the delta specs were not promoted, and `lifecycle.status` stays `Delivered` with `phases.archive` pending. D-1…D-4 are routed to a maintainer sync (`chaos:sync --adrs`, `chaos:sync --rules`) before `chaos:archive` is re-run. No `archive-report.md` was written — nothing was archived, and writing one would imply a closure that did not happen.
- sync-action: NONE (the routing itself is the outcome)
- audit: 13 decision entries enumerated (§2 scan rule) / 13 classified / 0 UNCLASSIFIED — balanced
- debt load: MEDIUM (9 items; D-1 architecture posture is the material one and is review approval condition 2)
- why-material: archive-with-debt approval is a material decision; the verdict cannot be a clean `ARCHIVED`
- knowledge: FACT · confidence: HIGH

## ARC-DEC-002 — Confirm archive as ARCHIVED_WITH_DEBT (governance debt now clear)

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- runtime-decision: DEC-2026-08-01-secure-task-api-confirm-archive-secure-t-a81a
- interaction-type: confirmation
- options: confirm-archive-with-debt · deny-stop
- recommendation: confirm — the condition that caused the ARC-DEC-001 deferral is discharged
- answer: confirm-archive-with-debt — rationale: "demo purposes"
- impact: `openspec archive secure-task-api` executed. 13 requirements promoted to base specs (`api-authentication` 6, `api-edge-hardening` 7); change moved to `openspec/changes/archive/2026-08-01-secure-task-api/`; `openspec list` reports no active changes. `lifecycle.status: Archived`, `archiveReadiness: ARCHIVED_WITH_DEBT`. Source-of-truth confirmation: **CONFIRMED**.
- sync-action: NONE (governance already reconciled by the 2026-08-01 `--adrs` and `--rules` runs)
- audit: 14 enumerated (§2 scan rule) / 14 classified / 0 UNCLASSIFIED — balanced
- discharged since ARC-DEC-001: D-1 architecture posture, D-2 context posture, D-3/D-4 ADR-0001 indexing, SYNC-005 rules R-009 + R-010
- debt remaining: RK-8, RK-5, VFY-001, VFY-002, APPLY-DEC-002 (+ SYNC-006 advisory) — all implementation-side, no governance contradiction. Debt load MEDIUM.
- why-material: terminal, not cleanly reversible; the verdict cannot be a clean `ARCHIVED`
- knowledge: FACT · confidence: HIGH
