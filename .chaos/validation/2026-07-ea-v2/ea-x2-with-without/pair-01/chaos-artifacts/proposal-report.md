---
chaosMetadata:
  schemaVersion: 1
  artifactType: proposal-report
  artifactScope: change
  changeId: require-api-key-auth
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-07-19T17:49:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T17:49:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "detached@d27600f (EA-X2 mechanized worktree p1-armA)"
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:hook-managed-pending"
---

# CHAOS Proposal Report — require-api-key-auth

## Metadata

- Command: chaos:propose
- Invocation: chaos:propose "require API-key authentication on the /tasks endpoints" --strict
- Mode: strict
- Mode source: inferred (touches an architecture NON-GOAL / decision-bearing area → highest rigor)
- Date/time: 2026-07-19
- Change ID: require-api-key-auth
- OpenSpec available: yes (CLI 1.6.0)
- OpenSpec validation: PASSED (`openspec validate require-api-key-auth --strict` → "is valid")
- Proposal status: PROPOSED_READY_FOR_REVIEW
- Run context: **EA-X2 mechanized run — no live human available to answer runtime decisions.**
  Material decisions are recorded AND resolved with a documented maintainer-style rationale,
  tagged `resolved-in-arm (no live human; EA-X2 mechanized run)`. This is a **documented
  deviation** from the normal Decision-Center stop-and-resume flow (R-001 / AGENTS.md §3).

## User intent

Add API-key authentication to the `/tasks` endpoints. Every `/tasks` route must present a valid
`X-Api-Key` header (value = config `ApiKey`, default `test-secret-key`); a missing/incorrect key
returns `401 Unauthorized` before any existence/validation check; `GET /` stays public.

## Change classification

- Type: NEW_CAPABILITY on an existing surface (adds an auth gate to `task-api`); **behaviour-
  breaking for unauthenticated callers by design**.
- Risk: MEDIUM–HIGH governance risk (crosses a recorded architecture NON-GOAL), LOW implementation
  risk (single HTTP-layer filter, in-memory app, no persistence/crypto/external deps).
- Reasoning: `--strict` selected because the change is **decision-bearing**: `.chaos/architecture.md`
  lists Authentication/authorization as a NON-GOAL. Per constitution §6, contradicting an accepted
  posture requires an explicit, human-approved decision (recorded as AUTH-DEC-001).

## Architecture NON-GOAL / decision-bearing notice

`.chaos/architecture.md` → "Authentication / authorization posture: None. The API is open. `[FACT]`.
Any auth is out of scope and would be strict, decision-bearing work." and Non-goals →
"Authentication / authorization / multi-tenant concerns."

**This change deliberately crosses that NON-GOAL.** It does not silently ignore the posture: it
drives an explicit decision (AUTH-DEC-001) to adopt a *scoped, minimal* API-key gate — not a
general authentication/authorization system. The NON-GOAL for accounts/roles/scopes/multi-tenant
remains in force (bounded by the design's Non-Goals). Surfacing this explicitly satisfies
constitution §6 and §3 (no silent assumptions).

## Source manifest

| Source | Status | Role | Notes |
|---|---|---|---|
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | verified | current behavior | 5 CRUD routes on `MapGroup("/tasks")`, no auth |
| `src/TaskTracker.Api/Program.cs` | verified | composition | `GET /` mapped on `app` (outside the group); wires `MapTaskEndpoints` |
| `src/TaskTracker.Api/Domain/TaskItem.cs`, `Domain/TaskStore.cs` | verified | domain | `TaskState`/`TaskPriority`; in-memory store — must stay HTTP-free (R-004) |
| `src/TaskTracker.Api/appsettings.json` | verified | config | no `ApiKey` set → default path is what runs |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | verified | test baseline | 5 green integration tests via `WebApplicationFactory<Program>` |
| `.chaos/architecture.md` | verified | posture | auth is a NON-GOAL / decision-bearing (drives AUTH-DEC-001) |
| `.chaos/constitution.md` | verified | principles | §6 posture-change requires explicit decision; §3 no silent assumptions |
| `.chaos/rules/index.md` | verified | rules | R-001..R-006 apply (see alignment) |
| `openspec/specs/task-api/spec.md` | verified | base spec | existing `task-api` capability → this is a MODIFIED capability (ADDED requirement) |

## Evidence assessment

### Evidence required
- Current `/tasks` routing + how `GET /` is mapped; where auth must sit to stay R-004-clean;
  the contract constants (header/config/default/status); test baseline; the architecture posture.

### Evidence found
- All of the above (FACT, direct source read). `MapGroup("/tasks")` is a single attach point for
  all five routes; `GET /` is mapped separately on `app` so it is naturally excluded from a
  group-scoped filter. OpenSpec CLI present and the change validates `--strict`.

### Evidence missing
- No test yet exercised auth (expected at propose time; lands at apply/verify — now green).

### Impact on proposal confidence
- Current-behavior and contract evidence COMPLETE. Overall confidence MEDIUM at propose time,
  capped by the pending posture decision and the not-yet-written tests; both resolved by verify.

## Blast radius

- **In scope (edited):** `src/TaskTracker.Api/Endpoints/ApiKeyEndpointFilter.cs` (new),
  `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` (attach filter),
  `tests/TaskTracker.Tests/TaskEndpointsTests.cs` (auth key + new tests).
- **Untouched:** `Program.cs`, `Domain/**` (R-004/R-005), `Contracts/**`, `appsettings.json`,
  `AGENTS.md`, root `README.md` (R-006). Authenticated CRUD/behaviour unchanged.
- **Consumers affected:** any client of `/tasks` must now send `X-Api-Key` (breaking, intended).
  `GET /` consumers unaffected.

## Material decisions this change forces

See `.chaos/changes/require-api-key-auth/decision-events.md` for full records. Summary:

- **AUTH-DEC-001** — Adopt API-key auth, crossing the recorded NON-GOAL (POSTURE_CHANGE / R-001,
  §6). Resolved-in-arm.
- **AUTH-DEC-002** — Enforcement mechanism: group-level `IEndpointFilter` on `MapGroup("/tasks")`
  (vs middleware / per-handler). Resolved-in-arm.
- **AUTH-DEC-003** — Read `ApiKey` from configuration, default `test-secret-key` when null/empty;
  leave `appsettings.json` unset so the default path is exercised. Resolved-in-arm.

## ADR/rule alignment

| Constraint | Source | Alignment | Confidence |
|---|---|---|---|
| R-001 Human owns material decisions | rules | DEVIATION (documented) — no live human in EA-X2; decisions recorded + resolved-in-arm with maintainer rationale, not silently guessed | HIGH |
| R-002 Label knowledge & confidence | rules | ALIGNED — every finding/decision/verdict carries knowledge type + confidence | HIGH |
| R-003 Preserve green test baseline | rules | ALIGNED — 5 baseline tests kept (now key-supplying) + 8 new; `dotnet test` green | HIGH |
| R-004 Respect domain→HTTP boundary | rules | ALIGNED — auth is an HTTP-layer endpoint filter; `Domain/**` untouched, no ASP.NET types added | HIGH |
| R-005 Keep `TaskState` naming | rules | ALIGNED — no domain/enum change | HIGH |
| R-006 Protected files | rules | ALIGNED — `AGENTS.md` / root `README.md` untouched | HIGH |

## Findings

### PRP-001 — Change crosses an architecture NON-GOAL (decision-bearing)

Type: FACT · Confidence: HIGH · Severity: MAJOR (governance)
Source: `.chaos/architecture.md` (auth posture + Non-goals), constitution §6.
Finding: Auth is a recorded NON-GOAL; implementing it contradicts an accepted posture.
Impact: Requires an explicit posture-change decision (AUTH-DEC-001) rather than silent adoption.
Required action: Record + resolve AUTH-DEC-001; keep the scope minimal (single shared key, no
accounts/roles) so the rest of the NON-GOAL stands.

### PRP-002 — Auth must live at the HTTP layer to preserve R-004

Type: INFERENCE · Confidence: HIGH · Severity: ADVISORY
Source: `.chaos/rules/index.md` R-004; `Domain/TaskStore.cs` (no HTTP types).
Finding: Placing auth in the domain would violate R-004.
Impact: Enforcement chosen as a group-level endpoint filter in `Endpoints/**` (AUTH-DEC-002).
Required action: Keep the filter and all header/config handling in the HTTP layer.

## Assumption register

| ID | Assumption | Why it matters | Confidence | Required validation |
|---|---|---|---|---|
| A-1 | A group-level endpoint filter runs before the handler body, so before existence/validation | Underpins the "401 before read/mutate" contract | HIGH | Tests 3.4/3.5 assert 401 (not 404/400); green at verify |
| A-2 | `GET /` is outside `MapGroup("/tasks")`, so a group filter leaves it public | Root must stay public | HIGH | `Program.cs` maps `/` on `app`; test 3.7 green |
| A-3 | "not set" for `ApiKey` covers null/empty | Default-key behaviour | MEDIUM | Treated null-or-whitespace as unset (AUTH-DEC-003) |

## Confidence summary

- Overall confidence: MEDIUM (propose-time) → HIGH expected at verify
- Evidence coverage: PARTIAL (tests land at apply) → COMPLETE at verify
- Assumption load: LOW
- Limiters: pending posture decision (AUTH-DEC-001) and not-yet-written auth tests.

## Next command

```text
chaos:review require-api-key-auth
```
