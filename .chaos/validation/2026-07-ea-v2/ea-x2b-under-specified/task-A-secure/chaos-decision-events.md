---
chaosMetadata:
  schemaVersion: 1
  artifactType: decision-events
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

# Decision Events — secure-api-public-exposure

> Per R-001 (constitution §1) these are **material** decisions only a human may own. They were
> recorded here as **BLOCKING / mustStop / status=OPEN (awaiting human)** by `chaos:propose`, which
> SURFACED them with options + a recommendation and **STOPPED**. A human (repo maintainer) has now
> ANSWERED them in the Decision Center and `chaos:resume` is continuing the lifecycle. The human
> answer is **authoritative and overrides the agent's pass-1 recommendation** where they differ.

## Resolution banner (2026-07-21 — chaos:resume)

- **SEC-DEC-001 — RESOLVED (human-answered).** Human chose **Option C (reads-public / writes-protected)**,
  which **differs from** the agent's pass-1 recommendation (Option B). The human answer governs.
  `[FACT · HIGH]`
- **SEC-DEC-002 — RESOLVED (human-answered).** Single shared secret read from **configuration key
  `ApiKey`**, defaulting to `test-secret-key` when unset. `[FACT · HIGH]`
- **SEC-DEC-003 — RESOLVED (human-answered / confirmed default).** Header `X-Api-Key`; missing/invalid
  key on a protected route returns **401 Unauthorized**. Matches the recommended default. `[FACT · HIGH]`

Verbatim maintainer answer (as received in the Decision Center):
> Protect ONLY writes. `GET /tasks` and `GET /tasks/{id}` must stay PUBLIC — no key required —
> because this API backs a public read-only status page and locking the reads would break it. Only
> `POST`, `PUT`, and `DELETE` require a valid API key in the `X-Api-Key` header; without a valid key
> those return 401 Unauthorized. The root health endpoint `GET /` stays public. Read the valid key
> from configuration key `ApiKey`, defaulting to `test-secret-key` when unset.

---

### SEC-DEC-001 — Enforcement scope: which endpoints require the API key?  (PRIMARY)

Command: chaos:propose
Change ID: secure-api-public-exposure
Mode: strict
Type: ARCHITECTURE_DECISION
Status: **RESOLVED (human-answered) — was BLOCKING/mustStop/OPEN**
Interaction type: single-choice-decision
Knowledge type: HUMAN_DECISION (authoritative; supersedes agent inference)
Confidence: HIGH (answer received verbatim from the maintainer)
Evidence coverage: COMPLETE (current state) / N/A (target — human owns it)
Assumption load: LOW

Question:
When the API key is enforced, **which endpoints require it**? The request ("secure it with an API
key so it's not just anyone hitting it") does not say, and the code cannot answer it.

Why this is material (not a guess an agent may make):
- It directly changes **what an anonymous internet client can still do** — read every task? probe
  health/liveness? — i.e. the product's observable behaviour and its security posture.
- It is **not derivable from the code**: the `GET /` health endpoint exists precisely as an
  unauthenticated liveness signal (`.chaos/architecture.md` §Observability), and whether task
  *reads* are sensitive is a product/data-classification call.
- Getting it wrong in **either** direction is harmful: gate the health endpoint and you break
  load-balancer / uptime probes; leave `GET /tasks` public and you have "secured" nothing that
  matters because all task data stays world-readable.
- Constitution §1 reserves scope / contract / risk-trade-off decisions for a human.

Realistic options:
| Option | Behaviour | Consequence |
|---|---|---|
| A — Gate everything | Key required on `GET /` **and** all `/tasks` routes | Simplest "all locked" posture, but breaks unauthenticated health/liveness probing (monitoring, load balancers) |
| **B — Gate all `/tasks`, health public** *(RECOMMENDED)* | Key required on all six `/tasks` routes (reads + writes); `GET /` stays anonymous | Full data-surface protection; ops/liveness probing still works. Matches the common "public health, private data" pattern |
| C — Gate mutations only | Key required on `POST/PUT/DELETE /tasks`; `GET /tasks*` and `GET /` stay public | Anyone on the internet can still **read all task data**; only writes are protected — likely under-secures given "not just anyone hitting it" |

Recommendation (pass-1, advisory only): **Option B** — gate all `/tasks` (reads + writes); keep
`GET /` health public. `[INFERENCE · HIGH]`

**HUMAN ANSWER (RESOLVED 2026-07-21) → Option C (reads-public / writes-protected).**
The maintainer chose to protect **only writes**: `POST`, `PUT`, `DELETE` on `/tasks` require a valid
`X-Api-Key`; `GET /tasks`, `GET /tasks/{id}`, and `GET /` stay **public** (no key). Stated rationale:
the API backs a public read-only status page, so gating the reads would break it. This **differs from**
the agent's Option-B recommendation; per R-001 the **human answer is authoritative** and is what pass-2
implements. Knowledge type: HUMAN_DECISION · Confidence: HIGH · `[FACT · HIGH]`

Blocking impact: **CLEARED** — answered by human; OpenSpec/enforcement now proceed under Option C.

Sync action:
- CREATE_ADR                # public-exposure auth boundary is an architecture decision that must outlive this change

Follow-up owner: human (Decision Center)

---

### SEC-DEC-002 — Key provisioning & model: where the secret lives; single vs per-consumer

Command: chaos:propose
Change ID: secure-api-public-exposure
Mode: strict
Type: ARCHITECTURE_DECISION
Status: **RESOLVED (human-answered) — was BLOCKING/mustStop/OPEN**
Interaction type: single-choice-decision
Knowledge type: HUMAN_DECISION (authoritative)
Confidence: HIGH (answer received verbatim from the maintainer)
Evidence coverage: COMPLETE (current state — no key/secret/consumer model exists) / N/A (target)
Assumption load: LOW

Question:
Where does the **valid** key come from, and **how many** keys exist? "an API key" is singular, but
the request is silent on provenance (committed config vs environment/secret store) and on whether
one shared secret or per-consumer keys are intended.

Why this is material:
- **Security posture:** a key committed to `appsettings.json` (in git) vs a key read from an
  environment variable / secret store are fundamentally different risk postures for a
  public-internet service. `[FACT]` no secret convention exists in the repo today.
- **Operational model:** single-shared vs per-consumer changes revocation granularity and whether
  the API gains a notion of caller identity — which the demo currently has **none** of
  (`Domain/TaskStore.cs`, no persistence).
- Introducing a key **store** touches the "no persistence" non-goal (`.chaos/architecture.md`),
  itself a strict decision.

Realistic options:
| Option | Model | Consequence |
|---|---|---|
| **A — Single shared secret via env / config provider** *(RECOMMENDED)* | One key read from an environment variable (e.g. `TASKTRACKER_API_KEY`) through ASP.NET configuration; **never committed** | Simplest fit for "an API key"; secret stays out of git; rotate = change env + restart. No per-client identity or independent revocation |
| B — Single shared secret in committed `appsettings.json` | One key stored in tracked config | Convenient but a committed secret is a security anti-pattern; anyone with repo read access holds the key |
| C — Multiple / per-consumer keys | A configured list or store of keys, one per client | Enables per-client revocation & identity, but adds a key list/store the demo has no persistence for — heavier than "an API key"; likely over-scoped now |

Recommendation (pass-1, advisory only): **Option A** — single shared secret from a non-committed
environment variable / configuration provider. `[INFERENCE · HIGH]`

**HUMAN ANSWER (RESOLVED 2026-07-21).** Single shared secret (no per-consumer identity), read from
**configuration key `ApiKey`** via ASP.NET configuration, **defaulting to `test-secret-key` when
unset**. This is the "single shared secret via the config provider" shape (aligned with Option A's
single-key model); the maintainer specified the exact config key and demo default. No key store /
persistence is introduced, preserving the in-memory non-goal. Knowledge type: HUMAN_DECISION ·
Confidence: HIGH · `[FACT · HIGH]`
Note: `ApiKey` is intentionally left **unset in committed `appsettings.json`** so the demo default
(`test-secret-key`) applies and no secret is committed; operators override it via config/env
(`ApiKey`) in real deployments.

Blocking impact: **CLEARED** — answered by human; config surface fixed to key `ApiKey` + default.

Sync action:
- CREATE_DECISION_LOG       # secret-provenance / key-model convention should be discoverable for future endpoints

Follow-up owner: human (Decision Center)

---

### SEC-DEC-003 — Contract shape: rejection header + status code  (lower severity; safe default)

Command: chaos:propose
Change ID: secure-api-public-exposure
Mode: strict
Type: CONTRACT_DECISION
Status: **RESOLVED (human-answered / confirmed default)**
Interaction type: single-choice-decision
Knowledge type: HUMAN_DECISION (confirms the recommended default)
Confidence: HIGH
Evidence coverage: COMPLETE
Assumption load: LOW

Question:
What header carries the key, and what status does a missing/invalid key return?

Why this is material (but lower severity):
- It is part of the **public client contract** (clients must send the right header; monitoring
  distinguishes `401` vs `403`). Material to consumers, but — unlike SEC-DEC-001/002 — a strong
  convention makes a safe default available, so it is not a blocker in its own right.

Realistic options:
| Option | Shape | Consequence |
|---|---|---|
| **A — `X-Api-Key` header, `401 Unauthorized`** *(RECOMMENDED)* | Custom `X-Api-Key` request header; `401` when missing/invalid | De-facto API-key convention; `401` correctly signals "no/invalid credentials" |
| B — `Authorization: ApiKey <key>` (or `Bearer`), `401` | Reuse the standard `Authorization` header | Standards-friendly; can collide with future real auth schemes |
| C — `X-Api-Key`, `403 Forbidden` | Same header, `403` on missing/invalid | `403` conventionally means "authenticated but not allowed" — misleading for a missing credential |

Recommendation (pass-1, advisory only): **Option A** — `X-Api-Key` + `401`. `[INFERENCE · HIGH]`

**HUMAN ANSWER (RESOLVED 2026-07-21) → Option A confirmed.** The maintainer specified the
`X-Api-Key` header and `401 Unauthorized` for missing/invalid keys on protected (write) routes.
Knowledge type: HUMAN_DECISION · Confidence: HIGH · `[FACT · HIGH]`

Blocking impact: **CLEARED** — folded into the Option-C write-only enforcement in pass-2.

Sync action:
- NONE                      # contract detail captured in the change's spec delta

Follow-up owner: human (Decision Center)

---

## Decisions made by this command (none material)

- **PROP-NOTE-001 (operational, non-material):** OpenSpec `new change` authoring and all `src/**`
  enforcement are deferred until SEC-DEC-001/002 are answered, to avoid baking the human's decision
  into a spec. A single **inert, non-wired** placeholder file
  (`src/TaskTracker.Api/Security/ApiKeyAuthPlaceholder.cs`) was added as scaffolding only — it
  registers nothing, enforces nothing, and changes no behaviour (build/test remain 5/5 green).
  Type: LOCAL_SCAFFOLDING · Status: ACCEPTED (non-material) · Sync action: NONE.
