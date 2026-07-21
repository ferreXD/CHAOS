---
chaosMetadata:
  schemaVersion: 1
  artifactType: proposal-report
  artifactScope: change
  changeId: secure-api-public-exposure
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-07-21T00:00:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-21T00:00:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: chaos/dotnet/demo
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: null
---

# CHAOS Proposal Report — secure-api-public-exposure

## Metadata

- Command: chaos:propose
- Invocation: chaos:propose "secure the Task Tracker API with an API key before public exposure" --strict
- Mode: strict
- Mode source: inferred (public-internet exposure of a currently-open API is a security-bearing,
  decision-heavy change; architecture lists auth as a `--strict`, decision-bearing non-goal)
- Date/time: 2026-07-21
- Change ID: secure-api-public-exposure
- OpenSpec available: yes
- OpenSpec invocation: **NOT INVOKED** (deliberately deferred — see "OpenSpec Invocation" below)
- Proposal status: **BLOCKED_ON_DECISION** (material decisions OPEN; not ready for review sign-off
  or apply until a human answers SEC-DEC-001 and SEC-DEC-002)

## User intent

Put the Task Tracker API on the public internet, which today is completely open (no
authentication). Gate access with an **API key** so "it's not just anyone hitting it." Keep
`dotnet build` / `dotnet test` green.

## Change classification

- Type: NEW_CAPABILITY (adds an authentication boundary that does not exist today) with
  BREAKING-contract impact (every currently-anonymous caller will need a credential).
- Risk: **HIGH** inherent. This is the exact posture the architecture calls out as a
  `--strict`, decision-bearing change: *"Any auth is out of scope and would be strict,
  decision-bearing work"* (`.chaos/architecture.md` §Authentication/authorization; §Non-goals).
  The change also alters what an anonymous internet client can observe/do — a product- and
  risk-trade-off surface, not a mechanical edit.
- Reasoning: the request is **materially under-specified** on at least two axes that only a
  human may own (constitution §1). Per R-001 the proposal SURFACES those decisions and STOPS;
  it does not choose them.

## Source manifest

| Source | Status | Role | Notes |
|---|---|---|---|
| `src/TaskTracker.Api/Program.cs` | verified | composition root | No auth/authorization middleware registered; pipeline is `MapGet("/")` + `MapTaskEndpoints()`. `[FACT]` |
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | verified | HTTP surface | 6 routes under `/tasks` (GET all, GET by id, POST, PUT, DELETE); none require a credential. `[FACT]` |
| `src/TaskTracker.Api/appsettings.json` | verified | config | No secrets/keys; `AllowedHosts: "*"`. No API-key config section exists. `[FACT]` |
| `src/TaskTracker.Api/Domain/TaskStore.cs` | verified | data | In-memory singleton; no user/tenant/consumer identity model. `[FACT]` |
| `tests/TaskTracker.Tests/TaskEndpointsTests.cs` | verified | test baseline | 5 integration tests, all green; all issue **unauthenticated** requests today. `[FACT]` |
| `.chaos/architecture.md` | verified | posture | Auth = explicit non-goal / strict decision-bearing; health `GET /` is a liveness signal. `[FACT]` |
| `.chaos/rules/index.md` | verified | rules | R-001, R-003, R-004, R-005, R-006 apply. `[FACT]` |
| `docs/adr/**`, `docs/decision-log/**` | missing | governance | No prior auth decision — greenfield security posture. `[FACT]` |

## Evidence assessment

### Evidence found (FACT, direct source read)
- The API has **no authentication of any kind** today; all six `/tasks` routes and the `GET /`
  health/root endpoint are anonymous. `[FACT]`
- There is **no notion of a caller/consumer identity** anywhere in the domain or config. `[FACT]`
- There is **no secret store, key config, or environment-variable convention** in the repo. `[FACT]`
- The test baseline exercises only unauthenticated calls (5/5 green). `[FACT]`

### Evidence missing (drives the STOP)
- **Which endpoints the key must gate** — not stated in the request and not derivable from code.
  In particular, whether the `GET /` liveness/health endpoint and read-only `GET /tasks*` stay
  public is a product/ops/risk choice. `[UNKNOWN → SEC-DEC-001]`
- **Where the valid key comes from and how many keys exist** — a committed config value vs an
  environment/secret-store value, and single-shared vs per-consumer. `[UNKNOWN → SEC-DEC-002]`
- The client-facing contract shape (header name; `401` vs `403`) has a strong conventional
  default but still touches the public contract. `[UNKNOWN → SEC-DEC-003, recommendation given]`

### Impact on proposal confidence
- Current-state evidence is COMPLETE and HIGH. But the target behaviour cannot be specified
  without SEC-DEC-001/002, so overall proposal readiness is **BLOCKED**; evidence coverage on the
  *target* design is WEAK until the human answers.

## Material ambiguities (the reason this proposal STOPS)

Per constitution §1/§3 and R-001, the following are **material** (they change the product's
observable behaviour and/or its security posture, and are not derivable from the code). They are
recorded as BLOCKING / status=OPEN in
[`decision-events.md`](./decision-events.md) and must be answered by a human before review
sign-off or apply.

1. **SEC-DEC-001 — Enforcement scope: which endpoints require the API key?** (PRIMARY)
   Does the key gate *everything* (incl. `GET /` health), *all `/tasks`* (reads + writes) while
   health stays public, or *only mutations* (POST/PUT/DELETE) while reads stay public? This
   directly determines whether an anonymous internet client can still read all task data or probe
   health. **Recommendation: gate all `/tasks` (reads + writes); keep `GET /` health public.**

2. **SEC-DEC-002 — Key provisioning & model: source of the secret and how many keys.**
   Single shared secret from an environment variable / secret store (not committed) vs a committed
   `appsettings.json` value vs multiple per-consumer keys. This is a real security-posture and
   operational trade-off. **Recommendation: single shared secret from a non-committed environment
   variable / configuration provider.**

3. **SEC-DEC-003 — Contract shape: rejection header + status code.** (lower severity, strong
   default) `X-Api-Key` request header and `401 Unauthorized` on missing/invalid key. Material to
   clients but conventionally defaulted. **Recommendation: `X-Api-Key` + `401`; human to confirm
   or accept the default.**

## Runtime decision log

| Decision ID | Type | Question | Status | Confidence impact |
|---|---|---|---|---|
| SEC-DEC-001 | ARCHITECTURE_DECISION | Which endpoints require the API key? | **OPEN (awaiting human)** | BLOCKING — caps readiness until answered |
| SEC-DEC-002 | ARCHITECTURE_DECISION | Where does the valid key come from; single vs per-consumer? | **OPEN (awaiting human)** | BLOCKING — caps readiness until answered |
| SEC-DEC-003 | CONTRACT_DECISION | Rejection header + status code | **OPEN (awaiting human; default recommended)** | MINOR — safe default exists |

See [`decision-events.md`](./decision-events.md) for full options, recommendations, and rationale.

## Runtime handling note (transparent, not a silent bypass)

- The interaction runtime was inspected (read-only): `chaos_list_sessions` → NO_SESSIONS for this
  change; `chaos_list_locks` → all existing locks `released`. No conflicting/pending state. `[FACT]`
- Per the material-decision protocol these decisions belong in the runtime / Decision Center.
  **They are recorded here as BLOCKING / OPEN and NOT resolved.** A live runtime *pending* decision
  was intentionally **not armed in this batch context**: `autoResume.enabled: true` +
  `inSessionResume: true` with `CHAOS_COMMAND_RUN_ID` unset means the `chaos-auto-resume` Stop hook
  would poll up to 1800s for a Decision Center answer that no human can supply here — a dead wait,
  not a legitimate "awaiting human" state. The decisions are fully surfaced (options +
  recommendation + why-material) for a human to own via the Decision Center in an interactive
  session. `[ASSUMPTION · MEDIUM]` — this is a genuine surface-and-stop, not a decision made in chat.

## OpenSpec Invocation

Status: **NOT INVOKED (deferred by design)**

Rationale: the OpenSpec spec delta for this change must encode *which endpoints require the key*
(SEC-DEC-001) and the key model (SEC-DEC-002) as normative `SHALL` scenarios. Authoring those
scenarios now would bake in the very decision R-001 reserves for the human. OpenSpec `new change`
+ spec/design/tasks authoring is therefore deferred to `chaos:resume` after SEC-DEC-001/002 are
answered. `[INFERENCE · HIGH]`

## ADR/rule alignment

| Constraint | Source | Alignment | Confidence |
|---|---|---|---|
| R-001 Human owns material decisions | `.chaos/rules/index.md` | ALIGNED — SEC-DEC-001/002/003 surfaced as OPEN; none decided in chat | HIGH |
| R-002 Label knowledge & confidence | constitution | ALIGNED — findings/verdict carry knowledge type + confidence | HIGH |
| R-003 Preserve green test baseline | `.chaos/rules/index.md` | ALIGNED — no behavioural change applied; build/test remain 5/5 green | HIGH |
| R-004 Respect domain→HTTP boundary | `.chaos/rules/index.md` | ALIGNED (planned) — auth is an HTTP-pipeline concern; domain must stay HTTP-free when implemented | HIGH |
| R-005 Keep `TaskState` naming | `.chaos/rules/index.md` | NOT AFFECTED — no domain/enum changes | HIGH |
| R-006 Protected files: previewed edits only | `.chaos/rules/index.md` | ALIGNED — `AGENTS.md` / root `README.md` untouched | HIGH |
| Architecture non-goal: auth is strict/decision-bearing | `.chaos/architecture.md` | ALIGNED — treated as strict; escalated to human decision | HIGH |

## Findings

### PRP-001 — The material axis (enforcement scope) is not derivable from code
Type: FACT · Confidence: HIGH · Severity: BLOCKER
Source: `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, `Program.cs`, request text.
Finding: "Secure it with an API key" does not say whether the `GET /` health endpoint and read-only
`GET /tasks*` remain public. The code cannot answer this — the health endpoint's intended
public/private status and whether task reads are sensitive are product/ops decisions.
Impact: Blocks a target spec; wrong in either direction causes harm (lock health → break
monitoring; leave reads open → data still world-readable).
Required action: Human answers SEC-DEC-001 in the Decision Center.

### PRP-002 — Secret provenance is a security-posture decision with no repo precedent
Type: FACT · Confidence: HIGH · Severity: BLOCKER
Source: `appsettings.json` (no key/secret), absence of any env/secret convention.
Finding: There is no existing convention for where a secret lives. A committed key and an
environment/secret-store key are very different security postures for a public service.
Impact: Blocks safe implementation; a committed secret would be a security anti-pattern.
Required action: Human answers SEC-DEC-002.

### PRP-003 — Contract shape has a safe default but still touches the public contract
Type: INFERENCE · Confidence: HIGH · Severity: MINOR
Source: HTTP conventions; `TaskEndpoints.cs`.
Finding: Header name and 401-vs-403 are conventionally defaulted (`X-Api-Key`, `401`) but are part
of the client contract.
Impact: Low; a recommended default is provided.
Required action: Human confirms or accepts default (SEC-DEC-003).

## Assumption register

| ID | Assumption | Why it matters | Confidence | Required validation |
|---|---|---|---|---|
| A-1 | "an API key" means a shared-secret / API-key scheme (not OAuth/JWT/mTLS) | Bounds the solution space | HIGH | Request wording; confirm not contradicted at resume |
| A-2 | The in-memory, no-persistence posture stays (no key store/DB added now) | Keeps blast radius bounded | MEDIUM | Confirm via SEC-DEC-002 (single-shared vs per-consumer) |
| A-3 | Not arming a live runtime pending decision in this human-absent batch is acceptable surfacing | Avoids a dead 1800s auto-resume wait | MEDIUM | A human creates/answers the decision in an interactive Decision Center session |

## Deferred / remaining open questions

- SEC-DEC-001, SEC-DEC-002 (BLOCKING) and SEC-DEC-003 (default-recommended) — all OPEN, awaiting a
  human. OpenSpec authoring and any `src/**` enforcement are deferred until they are answered.

## Confidence summary

- Overall verdict: **BLOCKED_ON_DECISION**
- Overall confidence: HIGH (in the blocking assessment itself — the ambiguity is real and material)
- Evidence coverage (current state): COMPLETE; (target design): WEAK until decisions answered
- Assumption load: MEDIUM

## Next command

```text
# A human answers SEC-DEC-001 and SEC-DEC-002 (and confirms SEC-DEC-003) in the Decision Center, then:
chaos:resume --change secure-api-public-exposure
```
