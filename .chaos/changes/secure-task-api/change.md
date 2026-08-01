---
chaosMetadata:
  schemaVersion: 1
  artifactType: change
  artifactScope: change
  changeId: secure-task-api
  mode: strict
  escalatedFrom: standard
  sourceCommand: "chaos:propose"
  repositoryContext:
    provider: github
    branch: demo/dotnet
    reviewRequest: null
    contextSource: session-context
    confidence: MEDIUM
  lifecycle:
    status: Archived
    phases:
      frame:   { status: complete, at: "2026-08-01T15:30:00Z", run: "RUN-2026-08-01-chaos-propose-secure-task-api-e2858e", mode: strict, verdict: READY_FOR_REVIEW }
      review:  { status: complete, at: "2026-08-01T15:45:00Z", run: "RUN-2026-08-01-chaos-review-secure-task-api-dffba6", mode: strict, verdict: READY_WITH_CONDITIONS }
      deliver: { status: complete, at: "2026-08-01T16:05:00Z", run: "RUN-2026-08-01-chaos-apply-secure-task-api-70104b", mode: strict, verdict: APPLIED }
      verify:  { status: complete, at: "2026-08-01T16:20:00Z", run: "RUN-2026-08-01-chaos-verify-secure-task-api-4efeab", mode: strict, verdict: READY_WITH_DEBT }
      sync:    { status: complete, at: "2026-08-01T16:35:00Z", run: "RUN-2026-08-01-chaos-sync-secure-task-api-417916", mode: strict, verdict: PARTIALLY_RECONCILED }
      archive: { status: complete, at: "2026-08-01T19:05:00Z", run: "RUN-2026-08-01-chaos-archive-secure-task-api-7ef4f8", mode: strict, verdict: ARCHIVED_WITH_DEBT }
    current:
      tests: "34/34"
      contract: "17/17"
      decisions: 15
      traceability: "8/5/0"
      syncState: PARTIALLY_RECONCILED
      archiveReadiness: ARCHIVED_WITH_DEBT
---

# secure-task-api — Authenticate and harden the Task Tracker API before public-internet exposure

> ⚠ **escalated: light → standard** — intent crosses the architecture non-goal "Authentication / authorization / multi-tenant concerns" and surfaced 3 material decisions against `maxMaterialDecisions: 2` · 2026-08-01 · see ESC-001
> ⚠ **escalated: standard → strict** — human decision, confirm-based · 2026-08-01 · see PROP-DEC-003

## Intent

Close the "API is open to every caller" gap before the Task Tracker API is exposed to the **public internet** (PROP-DEC-002).
Today there is no authentication, no authorization and no edge hardening on any route `[FACT]`.
Scope is **authentication plus edge hardening** (PROP-DEC-001) using **JWT bearer** credentials (PROP-DEC-004), with the **application terminating TLS** (PROP-DEC-005). Token issuance and per-caller authorization are explicit non-goals.

## Contract

**Authentication**

- [x] Every `/tasks` route (`GET`, `GET /{id}`, `POST`, `PUT`, `DELETE`) returns `401` to a request with no `Authorization` header
- [x] A token with an invalid signature, an expired token, or a token with an unexpected issuer/audience each return `401`
- [x] A request with a valid token reaches the existing handler and returns the same status/body it returns today
- [x] `GET /` returns `200` unauthenticated as a liveness signal
- [x] Signing key, issuer and audience come from configuration outside the repository; the app fails to start if any is missing, and no secret material is committed
- [x] The dev-only issuance endpoint is registered **only** when the environment is Development **and** `Auth:EnableDevTokenEndpoint` is enabled; failing either gate it returns `404` because the route is never mapped, and the flag defaults to disabled (REV-DEC-003)

**Edge hardening** (public-internet exposure, PROP-DEC-002)

- [x] Exceeding the configured fixed-window rate limit on `/tasks` returns `429` and performs no mutation
- [x] An **unauthenticated** caller exceeding the limit receives `429`, not `401` — rejected requests consume permits, and `UseRateLimiter()` precedes authentication in the pipeline (REV-DEC-002)
- [x] `GET /` carries its own looser rate limit and returns `429` when exceeded
- [x] CORS is an explicit configured allow-list; no wildcard origin is combined with credentials
- [x] `X-Content-Type-Options: nosniff` and a restrictive `Referrer-Policy` are present on every response, including `401`/`429`/`413`
- [x] A request body over the configured maximum returns `413` and creates/modifies no task

**Governance / regression**

- [x] R-008 holds: `UseForwardedHeaders` is not registered at all, so no trusted-proxy set exists that could be left empty, and a caller-supplied `X-Forwarded-For` cannot influence the rate limiter's partition key
- [x] R-003 holds: `dotnet build` and `dotnet test` are green, with the 5 baseline integration tests updated to authenticate rather than deleted
- [x] R-004 holds: no auth or `Microsoft.AspNetCore.*` reference leaks into `Domain/**`
- [x] R-005 holds: `TaskState` naming unchanged
- [x] `docs/adr/2026-08-01-api-authentication-posture.md` records the auth posture, the rejected alternatives, and the upgrade path to an external IdP

OpenSpec: `openspec/changes/archive/2026-08-01-secure-task-api/` (archived 2026-08-01; base specs at `openspec/specs/api-authentication/`, `openspec/specs/api-edge-hardening/`) · decisions: see `decision-events.md`

### OpenSpec Invocation

Status: **INVOKED**

Configured OpenSpec command: `openspec` CLI 1.6.0 (`.chaos/config.yaml` → `project.specEngine: openspec`, `toolchain.openspec`)

Actual invocation: acceptable path 3 — drove the `openspec` CLI directly (`openspec new change` → `openspec status --json` → `openspec instructions <artifact> --json` per ready artifact → write to each `resolvedOutputPath`).

Generated OpenSpec artifacts:

- `openspec/changes/secure-task-api/proposal.md`
- `openspec/changes/secure-task-api/design.md`
- `openspec/changes/secure-task-api/specs/api-authentication/spec.md`
- `openspec/changes/secure-task-api/specs/api-edge-hardening/spec.md`
- `openspec/changes/secure-task-api/tasks.md`

`openspec status --change secure-task-api --json` reports `isComplete: true`; all four artifacts `done`.

Validation command: `openspec validate secure-task-api --strict`

Validation result: **PASS** — "Change 'secure-task-api' is valid"

Confidence impact: none from OpenSpec (gate ran cleanly, no degraded mode).

## Source manifest (strict — exact, inspected)

| Path | Role | Knowledge |
|---|---|---|
| `src/TaskTracker.Api/Program.cs` | Host/composition. Registers `TaskStore`, JSON enum options, `GET /`, `MapTaskEndpoints()`. **No auth middleware.** | FACT |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | 5 CRUD routes under `/tasks`. **No auth metadata on any route.** | FACT |
| `src/TaskTracker.Api/Contracts/TaskRequests.cs` | `CreateTaskRequest` / `UpdateTaskRequest` | FACT |
| `src/TaskTracker.Api/Domain/TaskItem.cs` | `TaskItem` record + `TaskState`/`TaskPriority`. **No user/tenant/owner field.** | FACT |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | In-memory `ConcurrentDictionary`, singleton | FACT |
| `src/TaskTracker.Api/TaskTracker.Api.csproj` | `net8.0`, nullable, implicit usings | FACT |
| `src/TaskTracker.Api/appsettings.json` | Configuration surface for credential/edge settings | FACT |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | 5 integration tests via `WebApplicationFactory<Program>` — the baseline every new test extends | FACT |
| `.chaos/architecture.md` | Non-goals (auth), boundary model, test posture | FACT |
| `.chaos/context.md` | Environments = local dev only; no CD target | FACT |
| `.chaos/rules/index.md` | R-001…R-008 | FACT |
| `.chaos/gates/index.md` | G-01…G-05 | FACT |
| `docs/adr/` | **Absent** — created by this change (task 5.1) | FACT |
| `.chaos/archaeology/` | **Absent** — requirement waived, PROP-DEC-006 | FACT |

## Risk (strict)

Risk class: **CRITICAL** — auth/identity is a HIGH/CRITICAL trigger, and PROP-DEC-002 = `public-internet` puts an untrusted caller population in front of it.

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RK-1 | JWT chosen partly for PoC speed proves inadequate for untrusted callers | Medium | High | `AddAuthentication` seam repoints at an external IdP by configuration (design D1); ADR records the upgrade path |
| RK-2 | R-008 violated later by registering `UseForwardedHeaders` with an empty trusted set | Medium | High | Satisfied **by construction** — middleware not registered (PROP-DEC-005/design D2); contract statement + spec scenario assert its absence |
| RK-3 | Secret or signing key committed | Low | Critical | Fail-fast startup validation; contract + spec require non-secret `appsettings.json`; task 5.2 checks tracked files |
| RK-4 | Authenticated ≠ authorized — any valid token can mutate any task (`TaskItem` has no owner) | High | Medium | Explicit non-goal of this change; recorded as a known gap, not an oversight |
| RK-5 | Production still has no token issuer; the dev endpoint does not close this | High | Medium | Scoped out deliberately (REV-DEC-003); follow-up issuance change recorded |
| RK-8 | **The dev-only issuance endpoint reaches a deployed environment and mints tokens for anyone** — a complete bypass of this entire change | Low | Critical | **Highest residual risk.** Two independent gates (design D7): `IsDevelopment()` **and** an opt-in flag defaulting off; route unmapped rather than guarded; tests 4.7c/4.7d assert absence outside Development. Requires two independent mistakes to expose. |
| RK-6 | Rate-limit state is in-memory and per-instance | High | Low | Accepted; architecture already declares scale-out a non-goal |
| RK-7 | The 5 existing integration tests all call `/tasks` unauthenticated and will break | High | Low | Expected; tasks 4.1–4.2 update them to authenticate, R-003 keeps the suite green |

## Traceability (strict)

Requirement → code → test rows are completed by `chaos:verify` once implementation lands. Framing coverage:

| Spec capability | Requirements | Contract statements | Tasks |
|---|---|---|---|
| `api-authentication` | 5 | Authentication block (5) | 1.1–1.3, 2.1–2.4, 4.1–4.6, 4.9 |
| `api-edge-hardening` | 5 | Edge hardening block (4) + R-008 statement | 3.1–3.6, 4.7–4.8, 4.10 |
| — (governance) | — | R-003/R-004/R-005/ADR statements (4) | 4.11, 5.1–5.3 |

## Review

verdict: READY_WITH_CONDITIONS · confidence: MEDIUM · evidence_coverage: COMPLETE · assumption_load: MEDIUM
scope: `src/TaskTracker.Api/**`, `tests/TaskTracker.Tests/**`, `docs/adr/**` · rules in play: R-001, R-002, R-003, R-004, R-005, R-008
openspec_validation: PASSED (re-run after remediation) · approval_eligible: Conditional
reviewed: 2026-08-01 · run: RUN-2026-08-01-chaos-review-secure-task-api-252c7b
approved: 2026-08-01 by vscode-user — "Risk accepted" · see REV-DEC-004 (`approves-change: true`)

findings:

- REV-001 BLOCKING — `.chaos/architecture.md` still lists auth under §Non-goals and states "the API is open"; nothing reconciled it · RESOLVED_DURING_REVIEW (REV-DEC-001)
- REV-002 MAJOR — rate limiting did not demonstrably cover unauthenticated callers; middleware order unpinned and `GET /` unthrottled · RESOLVED_DURING_REVIEW (REV-DEC-002)
- REV-003 MAJOR — no token issuer existed, so the delivered API would be uncallable · RESOLVED_DURING_REVIEW as **accepted risk with mitigation** (REV-DEC-003) — resolution chose dev-only issuance **against the review recommendation**, adding RK-8
- REV-004 ADVISORY — the CORS "no wildcard with credentials" wording is imprecise for bearer-token auth, where CORS credentials mean cookies · OPEN, cosmetic
- REV-005 ADVISORY — task 4.8 asserts `413`, but an oversized JSON body can surface as `400` via `BadHttpRequestException` depending on how the limit is enforced; the test pins the intended behaviour, so the risk is a failing test rather than a silent gap · OPEN

**Approval conditions** (why CONDITIONS rather than a clean approval):

1. `chaos:verify` must confirm task 3b.2 was implemented as a **registration-time** condition — the dev issuance route absent from the routing table, not present-and-refusing — and that tests 4.7c/4.7d actually assert `404` outside Development. This is the mitigation RK-8 depends on; if it degrades into a runtime `if`, the mitigation is gone.
2. `chaos:sync` must reconcile `.chaos/architecture.md` §Non-goals and §Authentication/authorization posture, and `.chaos/context.md`, after archive (REV-DEC-001, `sync-action: CREATE_ADR + UPDATE_CHAOS_RULES`). Until then, committed governance still misdescribes the system.

### Findings and risk (strict)

The proposal is internally coherent and OpenSpec-valid: `openspec validate secure-task-api --strict` passes, all four artifacts are `done`, the 10 spec requirements map onto the 14 contract statements, and the tasks are ordered and actionable. Three findings block or qualify approval.

**REV-001 is the blocker.** `modes.md` (--strict) makes missing ADR/rule alignment blocking, and this change contradicts committed governance that nothing updates: `.chaos/architecture.md` §Non-goals line 100 lists "Authentication / authorization / multi-tenant concerns", and its §Authentication/authorization posture reads "None. The API is open." Task 5.1 creates an ADR that would contradict both, with no recorded obligation to reconcile them — so `chaos:sync` gets no signal and the architecture document would keep misdescribing the system after archive. The strict guardrail in `guided-amendment-policy.md` ("ADR conflicts require governance decision/ADR handling; do not paper over them with tasks.md edits") is why the recommended remedy records a governance obligation rather than only editing tasks.

**REV-002 is a threat-model gap, not a formatting one.** Framing fixed exposure at `public-internet`, where the untrusted population is by definition the unauthenticated one — yet the edge-hardening spec never distinguishes authenticated from unauthenticated callers, `design.md` D5 partitions on "the authenticated caller where available", and tasks 2.3/3.1 put `RequireAuthorization()` and the limiter on the same group without pinning middleware order. If authorization runs first, 401s consume no permit and the JWT signature-verification path can be flooded for free. `GET /` sits outside the group and is unthrottled entirely.

**REV-003 is the honesty check on the whole change.** Issuance was scoped out consistently and deliberately (RK-5), so this was not a defect — but the consequence was that tests go green while the deployed API is uncallable. The human resolved it with **dev-only issuance, against the review recommendation of shipping as scoped**. That is their call and it is implemented, but the review's objection stands on the record: a development-gated token minter on a service heading for public-internet exposure is exactly the kind of thing that survives to production. The mitigation is therefore deliberately paranoid — two independent gates, flag default-off, route unmapped rather than guarded (design D7) — and the residual is tracked as RK-8 with Critical impact. Approval condition 1 exists to stop that mitigation eroding during implementation.

Two framing-time observations survive review unchanged: the `[CONFLICT · LOW]` between the "Easier for PoC" rationale and a `public-internet`/`strict` posture is real but the resulting choices are still defensible, and the PROP-DEC-006 archaeology waiver holds — the source manifest plus the 5-test baseline are adequate equivalent evidence for ~150 lines across six files.

Confidence limiters:

- `[FACT]` The `chaos-interaction` MCP tools were unavailable; the runtime CLI fallback was used, capping effective confidence at MEDIUM.
- `[FACT]` This review examined artifacts authored earlier in the same session. Independent re-review before implementation would raise confidence.
- `[INFERENCE · MEDIUM]` REV-002's severity depends on ASP.NET Core middleware-ordering behaviour that is not yet written as code; it is a specification gap inferred from the design, not an observed defect.

## Framing record

verdict: READY_FOR_REVIEW · confidence: MEDIUM · evidence_coverage: COMPLETE · assumption_load: MEDIUM

FRAME is complete. Six material decisions were surfaced through the interaction runtime and answered by the human (PROP-DEC-001…006); none was decided by the command. The hard OpenSpec invocation gate ran and `openspec validate --strict` passed. No blocking evidence gap remains: archaeology was explicitly waived (PROP-DEC-006), and the missing ADR is a contract statement and task rather than an open question.

Under strict, `chaos:review` is **mandatory** before implementation.

Confidence limiters (why MEDIUM, not HIGH):

- `[CONFLICT · LOW]` PROP-DEC-001 and PROP-DEC-004 were both answered with the rationale "Easier for PoC", against a `public-internet` exposure target and `strict` rigor. The choices are individually defensible — JWT is the strongest option not blocked on absent infrastructure — but the stated driver is convenience rather than threat model. `chaos:review` should re-test this.
- `[FACT]` RK-5: nothing in this repository issues tokens, so the API is not independently usable after this change. Recorded as a non-goal in every artifact rather than resolved.
- `[INFERENCE · MEDIUM]` PROP-DEC-006 waives archaeology on the claim that the source manifest plus the green test baseline are equivalent evidence. Reasonable for ~150 lines across six files, but it is a claim, not a proof.
- `[FACT]` The `chaos-interaction` MCP tools were unavailable in this session; the documented runtime CLI fallback was used, which caps effective confidence at MEDIUM.
- `[FACT]` Run `RUN-…-d6b050` was cancelled mid-resume and the command continued under `RUN-…-e2858e` after a session-state fault; see the runtime note in `decision-events.md`. No decision or response artifact was lost.

## Delivery

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md), not here. -->

### Delivery — pass 1

| check | result |
|---|---|
| build | 0 warn / 0 err (`dotnet build TaskTracker.sln`) |
| tests | 34/34 (5 baseline updated + 29 new) |
| contract | 17/17 statements covered |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-008 ✅ |

files: `src/TaskTracker.Api/Program.cs`, `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `src/TaskTracker.Api/appsettings.json`, `src/TaskTracker.Api/TaskTracker.Api.csproj`, `tests/TaskTracker.Tests/TaskEndpointsTests.cs`, `tests/TaskTracker.Tests/TestApiFactory.cs` (new), `tests/TaskTracker.Tests/AuthenticationTests.cs` (new), `tests/TaskTracker.Tests/EdgeHardeningTests.cs` (new), `tests/TaskTracker.Tests/DevTokenEndpointTests.cs` (new), `docs/adr/2026-08-01-api-authentication-posture.md` (new)

branch: `demo/dotnet` · provider: github · scope drift: **NO_DRIFT** — every changed file is inside the approved scope list

status: Delivered · 2026-08-01 · run: RUN-2026-08-01-chaos-apply-secure-task-api-70104b
result: APPLIED · execution confidence: MEDIUM · validation evidence: COMPLETE · scope drift risk: LOW · assumption load: LOW

### Rule evidence

| Rule | Evidence |
|---|---|
| R-003 | `dotnet build` 0/0; `dotnet test` 34/34. The 5 baseline tests were **updated to authenticate, not deleted** — each still asserts its original status and body. |
| R-004 | `grep` over `Domain/**` and `Contracts/**` returns no `Microsoft.AspNetCore.*`, no auth type. Auth lives entirely in `Program.cs` and the endpoint group. |
| R-005 | `TaskState` unchanged; the only `TaskStatus` occurrences are the pre-existing explanatory comment in `Domain/TaskItem.cs`. |
| R-008 | `UseForwardedHeaders` is **not registered** — verified by grep over `src/`, by the inline note at `Program.cs:116`, and behaviourally by `EdgeHardeningTests.Forwarded_headers_cannot_shift_the_rate_limit_partition`, which proves a caller-supplied `X-Forwarded-For` cannot mint a fresh rate-limit bucket. |

### Coverage honesty — how each contract statement was evidenced

15 of 17 statements are covered by a passing test. Two are **code-evidenced only**, and are called out rather than quietly ticked:

| Statement | Evidence | Why not test-covered |
|---|---|---|
| CORS is an explicit configured allow-list; no wildcard with credentials | Code: `Program.cs` builds the policy from `Cors:AllowedOrigins` via `WithOrigins(...)`; `AllowAnyOrigin()` and `AllowCredentials()` are absent | CORS is enforced by the browser, not the server; an in-memory `TestServer` cannot exercise a real preflight meaningfully |
| HSTS portion of the security-headers statement | Code: `UseHsts()` registered when not Development, `UseHttpsRedirection()` always | `UseHsts` only emits over HTTPS, and the in-memory test server has no HTTPS endpoint. The `nosniff` + `Referrer-Policy` portion **is** test-covered on `2xx`, `401`, `429` and `413` |

### Deviations

1. **Options types live in `Program.cs`, not a new `Security/` folder.** Task 1.3 asked for "a strongly-typed options record plus a startup validation helper" without naming a location. Creating `src/TaskTracker.Api/Security/*.cs` would have added a file outside the approved scope list, which strict forbids without an amendment. `AuthOptions` and `ApiLimits` therefore sit at the bottom of `Program.cs`. No behavioural difference; worth revisiting if the file grows.
2. **The rate-limiter's "authenticated caller" partition branch is unreachable as designed.** The spec requires the partition key to be "the authenticated caller when one is available and the remote IP address otherwise", while REV-DEC-002 requires the limiter to run *before* authentication. Both were implemented literally, so `context.User` is never populated when the key is computed and every request partitions by remote IP. This is faithful to both requirements, not a shortcut — but it means the first branch never executes today. Flagged for `chaos:verify`; resolving it properly (e.g. partitioning on a hash of the presented bearer token) would be a spec amendment, not an apply-time decision.

### Approval conditions — status at delivery

1. **Dev issuance gate is registration-time** ✅ — `Program.cs:129` guards `app.MapPost("/dev/token", …)` with `app.Environment.IsDevelopment() && auth.EnableDevTokenEndpoint`; the route is never mapped when either gate fails. Five tests in `DevTokenEndpointTests` assert `404` for Production+flag-on, Staging+flag-on, Development+flag-off, and flag-absent. `chaos:verify` still owns confirming this independently.
2. **Architecture reconciliation** ⏳ — not discharged by apply, by design. The ADR states what it supersedes; `chaos:sync` must edit `.chaos/architecture.md` and `.chaos/context.md` (patch-previewed under R-006).

## Todo Candidates

- **Production token issuer** (RK-5) — the dev-only endpoint does not make a deployed API usable.
- **Per-caller authorization** (RK-4) — `TaskItem` has no owner; any valid token can mutate any task.
- **Unreachable partition branch** — see Deviation 2; needs a spec decision, not a code tweak.
- **CORS and HSTS test coverage** — both are code-evidenced only; closing them needs a real HTTP host in the test setup.
- **REV-004 / REV-005** — advisory review findings, still open.

## Verification

<!-- Per-pass snapshot, tagged by run id — appended, never back-edited. Current cumulative state
     lives in the frontmatter `lifecycle.current` block (rendered in lifecycle.md). -->

### Verification — pass 1

verdict: READY_WITH_DEBT · confidence: MEDIUM · evidence_coverage: COMPLETE · assumption_load: LOW · archive_readiness: READY_WITH_DEBT
verified: 2026-08-01 · run: RUN-2026-08-01-chaos-verify-secure-task-api-4efeab · mode: strict

| check | result |
|---|---|
| build | 0 warn / 0 err — re-run independently |
| tests | 34/34 — re-run independently |
| contract | 17/17 ticked; 2 rest on code inspection rather than a test (below) |
| openspec | `validate --strict` PASS · `isComplete: true` · 0 unticked tasks of 39 |
| traceability | 8 SATISFIED / 5 PARTIAL / 0 MISSING |
| scope drift | **NO_DRIFT** — every changed file is inside the approved scope list |
| rules | R-003 ✅ · R-004 ✅ · R-005 ✅ · R-008 ✅ |

### Approval condition 1 — CONFIRMED

The review made this verify's job. **The dev issuance gate is registration-time.**
`app.MapPost("/dev/token", …)` at `Program.cs:143` sits inside
`if (app.Environment.IsDevelopment() && auth.EnableDevTokenEndpoint)` at `Program.cs:142`; a grep
over `src/` confirms it is the **only** registration of that path. Five tests in
`DevTokenEndpointTests` assert `404` for Production+flag-on, Staging+flag-on,
Development+flag-off, and flag-absent-entirely. `[FACT · HIGH]`

One honest limit: a `404` on its own cannot distinguish "route absent" from "route present and
refusing". What settles it is the code inspection above, not the status code. The RK-8 mitigation
holds as designed.

### Approval condition 2 — NOT DISCHARGED (correctly)

`.chaos/architecture.md` still lists auth under §Non-goals and still says "None. The API is
open." That is `chaos:sync`'s edit to make under R-006 patch preview, not apply's or verify's.
The ADR states what it supersedes, and REV-DEC-001 carries the sync obligation. Until sync runs,
committed governance misdescribes the system — part of why this is READY_WITH_DEBT, not READY.

### Traceability (strict)

| Requirement | Source | Implementation | Test | Status | Confidence |
|---|---|---|---|---|---|
| Task routes require an authenticated caller | api-authentication | `TaskEndpoints.cs` group `.RequireAuthorization()` | `Every_task_route_rejects…` (5 cases) + 2 more | SATISFIED | HIGH |
| Invalid and expired credentials are rejected | api-authentication | `Program.cs` `TokenValidationParameters` | 4 tests (signature, expiry, issuer, audience) | SATISFIED | HIGH |
| The liveness endpoint stays anonymous | api-authentication | `MapGet("/")` outside the group | `Liveness_endpoint_stays_anonymous` | SATISFIED | HIGH |
| Credential config is external and validated at startup | api-authentication | `AuthOptions.Load` fail-fast | `Startup_fails_when_the_signing_key_is_missing` | **PARTIAL** | MEDIUM |
| Dev-only issuance behind two independent gates | api-authentication | `Program.cs:142-143` | 5 `DevTokenEndpointTests` | SATISFIED | HIGH |
| Production token issuance is out of scope | api-authentication | no refresh/revoke route exists | grep + `DevTokenEndpointTests` | SATISFIED | HIGH |
| Rate limiting applies to unauthenticated traffic | api-edge-hardening | `UseRateLimiter()` at `:126` before `UseAuthentication()` at `:128` | `Unauthenticated_flood_is_throttled` + 1 more | SATISFIED | HIGH |
| The liveness endpoint is rate limited | api-edge-hardening | `RequireRateLimiting(LivenessRateLimit)` | `Liveness_endpoint_is_rate_limited` + 1 more | SATISFIED | HIGH |
| Task routes are rate limited per caller | api-edge-hardening | `Policies.TaskRateLimit` fixed window | `Authenticated_caller_exceeding_the_limit_gets_429` | **PARTIAL** | MEDIUM |
| Cross-origin access is an explicit allow-list | api-edge-hardening | `WithOrigins(config)`, no `AllowAnyOrigin`/`AllowCredentials` | none | **PARTIAL** | MEDIUM |
| Security headers on every response | api-edge-hardening | first middleware at `:89` | 3 tests across `2xx`/`401`/`429`/`413` | SATISFIED | HIGH |
| Transport is secured by the application | api-edge-hardening | `UseHsts`/`UseHttpsRedirection`; no `UseForwardedHeaders` | `Forwarded_headers_cannot_shift_the_rate_limit_partition` | **PARTIAL** | MEDIUM |
| Oversized request bodies are rejected | api-edge-hardening | `Content-Length` guard at `:98` | `Oversized_body_is_rejected_with_413…` | **PARTIAL** | MEDIUM |

### Findings

**VFY-001 — MINOR · FACT · HIGH · the "no credential value in any tracked file" scenario is not satisfied.**
`tests/TaskTracker.Tests/TestApiFactory.cs:19` declares
`public const string SigningKey = "test-signing-key-that-is-long-enough-for-hmac-sha256"`. The
api-authentication scenario says "no signing key, token or credential value is present in any
tracked file". This is **not a security defect** — the value is test-only, is never referenced by
production configuration, and `appsettings.json` remains clean — but the scenario as written is
false once that file is committed. Fix by narrowing the scenario to *production* credential
material, or by generating the test key at runtime. Not archive-blocking.

**VFY-002 — MINOR · INFERENCE · MEDIUM · the 413 guard only fires when `Content-Length` is present.**
The middleware tests `context.Request.ContentLength > limits.MaxRequestBodyBytes`; a chunked
request (`Transfer-Encoding: chunked`, no `Content-Length`) yields `null`, the lifted comparison is
false, and the request falls through to Kestrel's `MaxRequestBodySize` — which is exactly the
`400`-instead-of-`413` path REV-005 predicted. No test covers the chunked case, and it was not
executed during verification, hence INFERENCE rather than FACT. Recommend a chunked-body test.

**VFY-003 — ADVISORY · FACT · HIGH · `ClockSkew = TimeSpan.Zero` has no spec or decision backing.**
A deliberate tightening (an expired token is expired, instead of the 5-minute default grace),
documented in the ADR's Consequences — but present in no spec requirement and no decision event,
so nothing would catch its removal. Recommend a spec scenario.

**VFY-004 — ADVISORY · FACT · HIGH · `413` responses bypass rate limiting.**
The body-size middleware sits at `:98`, before `UseRateLimiter()` at `:126`, so oversized requests
are answered without consuming a permit. This does **not** violate the spec, which requires only
that the limiter precede *authentication*, and the check is cheap (a header comparison, no body
read). Recorded so the ordering is a decision rather than an accident.

**VFY-005 — ADVISORY · FACT · HIGH · confirms APPLY-DEC-002.**
The rate limiter's authenticated-caller partition branch is genuinely unreachable: `UseRateLimiter`
precedes `UseAuthentication`, so `context.User` is never populated when the key is computed. Both
requirements are implemented literally; resolving the tension needs a spec amendment.

**Carried from review, still open:** REV-004 (CORS credentials wording) and REV-005 (413 vs 400 —
now given concrete substance by VFY-002).

### Decision-event audit

13 entries, all terminal: 1 `ESC`, 6 `PROP-DEC` (ANSWERED · CONSUMED), 4 `REV-DEC` (ANSWERED ·
CONSUMED, one carrying `approves-change: true`), 2 `APPLY-DEC` (RECORDED). No OPEN entry. Sync
actions declared and syncable: `CREATE_ADR`, `UPDATE_CHAOS_RULES`, `AMEND_OPENSPEC_SPEC`,
`RECORD_ACCEPTED_RISK`. Every `*-DEC-*` id cross-referenced in this document resolves to an
existing entry. `[FACT · HIGH]`

### Why READY_WITH_DEBT and not READY

Nothing here blocks archive. Confidence is MEDIUM rather than HIGH because five requirements are
PARTIAL, two contract statements rest on code inspection instead of a test, VFY-002 is inferred
rather than executed, and approval condition 2 is still outstanding. Per the archive-readiness
rubric that is precisely READY_WITH_DEBT: archive may proceed, but as `ARCHIVED_WITH_DEBT`.
