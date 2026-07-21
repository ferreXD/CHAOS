---
chaosMetadata:
  schemaVersion: 1
  artifactType: decision-events
  artifactScope: change
  changeId: prevent-concurrent-edit-loss
  sourceCommand: "chaos:propose"
  lastWrittenAt: "2026-07-21T22:34:30+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-21T22:34:30+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "prevent-concurrent-edit-loss (worktree tC-chaos)"
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:pending-metadata-hook"
---

# Decision Events — prevent-concurrent-edit-loss

> Both decisions below are **material** (R-001). They were recorded BLOCKING / mustStop / OPEN in
> pass 1 and the agent stopped without resolving them. **As of 2026-07-21 the human (repo
> maintainer) has ANSWERED them in the Decision Center.** PROP-DEC-001 is now **RESOLVED
> (human-answered): `opt-optimistic`**; the maintainer's answer also settled the dependent
> PROP-DEC-002 axes (body `version` token, `409 Conflict`, back-compat grandfather). This resume
> step (chaos:resume → apply → verify) **incorporates the authoritative human answer** — the answer
> governs even where it differs from the agent's advisory recommendation (here it matched).

## Resolution banner (resume — pass 2)

| Decision | Pass-1 status | Pass-2 status | Answered by | Selected | Source |
|---|---|---|---|---|---|
| PROP-DEC-001 | OPEN / mustStop | **RESOLVED (human-answered)** | vscode-user (maintainer) | `opt-optimistic` | vscode-decision-center |
| PROP-DEC-002 | OPEN (dependent) | **RESOLVED (subsumed by PROP-DEC-001 answer)** | vscode-user (maintainer) | body `version` + `409` + grandfather | vscode-decision-center |

**Verbatim human answer (authoritative):** Selected option `opt-optimistic` — OPTIMISTIC
concurrency, reject stale writes. Add a version token to tasks (starts at 1, increments on each
successful update). A PUT that carries a stale/expected version that no longer matches the current
version must be rejected with **409 Conflict** and leave the task unchanged, so a client working
from an out-of-date copy cannot silently clobber a newer edit; it must refetch and retry. Keep the
existing version-less update path working for backward compatibility, and keep the build and tests
green.

- Knowledge type: **DECISION** (human-owned product/contract choice); the underlying problem is
  FACT (evidenced lost-update path). Confidence: **HIGH** (answer is explicit and authoritative).
- Evidence coverage: COMPLETE · Assumption load: LOW.

---

### PROP-DEC-001 — Concurrency-control strategy for task updates

- Command: chaos:propose
- Change ID: prevent-concurrent-edit-loss
- Command run: RUN-2026-07-21-chaos-propose-prevent-concurrent-edit-loss-89b9ee
- Runtime decision ID: `DEC-2026-07-21-prevent-concurrent-edit-loss-concurrency-control-stra-5b6c`
- Mode: strict
- Type: DESIGN_DECISION (material / product + contract)
- **Status: RESOLVED (human-answered) — selected `opt-optimistic`**
- Resolved at: 2026-07-21T20:35:47Z · Answered by: vscode-user (maintainer) · Source: vscode-decision-center · Rationale: "Best option here"
- Consumed by: chaos:resume (this pass) — incorporated into apply
- **Blocking: CLEARED** (was YES / mustStop; the human answer lifts the block)
- Interaction type: single-choice-decision
- Knowledge type: DECISION (human-owned resolution) / problem is FACT
- Confidence: HIGH (answer is explicit and authoritative)
- Evidence coverage: COMPLETE
- Assumption load: LOW

**Question**
How should `PUT /tasks/{id}` prevent one person's save from silently overwriting changes another
person made but the first person never saw? (The lost-update problem.)

**Why this is material (not agent-decidable)**
It changes the **product's behaviour** and the **public API contract** — new status codes, possibly
a new required header or body field, and a new client retry/UX flow — and it embeds a product UX
call (does a conflicting saver get an error and redo work, or does the system merge for them?). It
is **not derivable from the code**: the codebase has no version/ETag field and no precedent to
imply an answer. Per constitution §1 and R-001 this is human-owned; the agent must surface and stop.

**Options presented (with consequences)**

1. **`opt-optimistic` — Optimistic concurrency, reject stale writes  _(RECOMMENDED)_**
   - Each task carries a version/token the client reads; the client sends the version it saw on
     update; if it no longer matches, the server rejects with a conflict status and the client
     re-fetches and retries.
   - Consequence: new conflict status on PUT; clients round-trip the token and handle
     "someone else changed this, retry". Smallest blast radius; no lock lifecycle. Transport and
     missing-token posture become dependent decision PROP-DEC-002.
   - Risk: LOW–MEDIUM (existing token-less clients need a defined posture).
2. **`opt-pessimistic` — Pessimistic locking, lock a task while editing**
   - Server grants an exclusive edit lock on open; a second editor can't save until release/expiry.
   - Consequence: new lock acquire/release/lease endpoints + server-side lock state + break-lock
     UX + stale-lock handling. Leans toward the **persistence NON-GOAL** (durable lock state) and
     needs an identity model the app doesn't have (auth NON-GOAL). Largest behaviour change.
   - Risk: MEDIUM–HIGH.
3. **`opt-merge` — Keep last-write-wins but detect and merge/surface conflicts**
   - Three-way merge: auto-merge non-overlapping field edits; surface only truly conflicting fields.
   - Consequence: best UX (fewest rejected saves), most complex; needs a merge engine, per-field
     base tracking, and a conflict-resolution contract/UI.
   - Risk: MEDIUM–HIGH.
4. **`opt-patch` — Switch full-object PUT to field-level PATCH (merge-patch)**
   - Save writes only changed fields; non-overlapping edits both survive.
   - Consequence: **does NOT fully close the hole** — two people editing the *same* field still
     silently lose one. Changes the update verb/semantics.
   - Risk: MEDIUM (partial fix; risk of false assurance).

**Agent recommendation (advisory — NOT a resolution):** `opt-optimistic`.
Smallest blast radius, REST-idiomatic, no lock/identity machinery (respects persistence + auth
NON-GOALs), and it directly converts the silent overwrite into a visible, recoverable conflict.

**Evidence**
- `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs:38-46` — unconditional PUT overwrite.
- `src/TaskTracker.Api/Domain/TaskStore.cs:34-42` — blind `record with {…}` replace.
- `src/TaskTracker.Api/Domain/TaskItem.cs:24-29` — no version/ETag field exists.
- `.chaos/architecture.md` — persistence + auth are NON-GOALs (bounds the options).

**Impact if answered**
Selects the spec delta shape, the endpoint/store change, whether a new domain field is added, and
whether PROP-DEC-002 (transport/status/back-compat) needs to be surfaced next.

**Sync action (on resolution):** CREATE_DECISION_LOG — the concurrency-control contract is an
API-wide convention that should outlive this change.

**Follow-up owner:** human (Decision Center) / then team

---

### PROP-DEC-002 — Concurrency-token transport, failure contract, and missing-token posture

- Command: chaos:propose
- Change ID: prevent-concurrent-edit-loss
- Runtime decision ID: (not separately created — **subsumed** by the maintainer's PROP-DEC-001 answer)
- Mode: strict
- Type: DESIGN_DECISION (material / public contract)
- **Status: RESOLVED (subsumed by PROP-DEC-001 answer)**
- **Blocking: CLEARED**
- Resolution (from the verbatim human answer): transport = **body `version` token** on the task
  (starts at 1, increments per successful update) with `expectedVersion` carried in the PUT body;
  failure contract = **`409 Conflict`**, task left unchanged; missing-token posture =
  **`grandfather`** (a version-less PUT keeps the pre-existing last-write-wins behaviour). This is
  the `opt-body-version` + `grandfather` branch of the options below — chosen explicitly by the
  maintainer, not the agent's advisory ETag/`If-Match` lean.
- Knowledge type: DECISION (human-owned resolution) / options are FACT
- Confidence: HIGH (explicit in the human answer)
- Evidence coverage: COMPLETE
- Assumption load: LOW

**Question (only if optimistic concurrency is chosen)**
How is the concurrency token carried and enforced, and what happens when a client omits it?

**Why this is material**
It fixes the public wire contract every write client must follow and decides whether the fix is
*enforced* or *opt-in* for existing token-less clients — which determines whether the incident can
still occur for un-migrated callers.

**Options presented**

1. **`opt-http-etag` — HTTP-native `ETag` + `If-Match`  _(recommendation leans here)_**
   - `GET`/`PUT` return an `ETag`; clients send `If-Match: <etag>`; stale → **`412 Precondition
     Failed`**; missing → optionally **`428 Precondition Required`**.
   - Consequence: standards-compliant, cache-friendly, no body-schema change. Requires ETag
     plumbing.
2. **`opt-body-version` — `version`/`rowVersion` field in the JSON body**
   - `TaskItem` exposes an integer/GUID `version`; `UpdateTaskRequest` carries `expectedVersion`;
     stale → **`409 Conflict`**.
   - Consequence: simplest to implement in-process (matches the inert `ExpectedVersion` scaffold);
     less HTTP-idiomatic; version is now part of the domain/DTO shape.
3. **Missing-token posture (orthogonal sub-choice, also material)**
   - **`strict-reject`** — a PUT without a token is rejected (`428`/`400`). Fully closes the hole
     but is a **breaking change** for existing clients.
   - **`grandfather`** — a PUT without a token falls back to last-write-wins. Backward-compatible
     but **leaves the incident possible** for un-migrated callers (a transition-only posture).

**Agent recommendation (advisory — NOT a resolution):** `opt-http-etag` with a time-boxed
`grandfather` → `strict-reject` migration. Recorded for the human; not applied.

**Evidence**
- `src/TaskTracker.Api/Contracts/TaskRequests.cs` — no token today; inert `ExpectedVersion`
  scaffold added (TODO-gated, unread).
- `src/TaskTracker.Api/Program.cs` / endpoints — JSON-over-HTTP; enums serialized as names.

**Sync action (on resolution):** CREATE_DECISION_LOG (part of the same convention as PROP-DEC-001).

**Follow-up owner:** human (Decision Center) / then team

---

## Summary

| Decision | Material? | Status | Blocking | Resolved by |
|---|---|---|---|---|
| PROP-DEC-001 — concurrency-control strategy | YES | **RESOLVED (human-answered)** — `opt-optimistic` | CLEARED | **human (maintainer)** |
| PROP-DEC-002 — token transport + failure contract + back-compat | YES | **RESOLVED (subsumed)** — body `version` / `409` / grandfather | CLEARED | **human (maintainer)** |

Pass 1: per R-001 the agent surfaced both material decisions and stopped without deciding.
Pass 2 (this resume): the human answered PROP-DEC-001 (and, in the same answer, the PROP-DEC-002
axes). The agent has now **implemented the human's answer exactly** — see `apply-report.md` and
`verification.md`. The resolution stays human-owned; the agent only executed it.
