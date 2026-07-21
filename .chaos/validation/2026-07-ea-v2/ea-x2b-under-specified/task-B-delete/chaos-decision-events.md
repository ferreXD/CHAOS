---
chaosMetadata:
  schemaVersion: 1
  artifactType: decision-events
  artifactScope: change
  changeId: delete-tasks-product
  sourceCommand: "chaos:resume"
  lastWrittenAt: "2026-07-21T22:42:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-21T22:42:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "detached@d27600f9 (worktree tB-chaos)"
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: LOW
    bodyHash: "sha256:22d76b1f99836ffb5aae219c27760c7c4e19f236cd88c6eb51cb344d4834bb7b"
---

# Decision Events — delete-tasks-product

> Human decision record. Per **R-001** the material decisions below are **NOT** resolved by the
> agent — they are surfaced through the interaction runtime (Decision Center) and this command
> **stopped** on them. Recommendations are advisory and do **not** pre-answer anything.

Command run: `RUN-2026-07-21-chaos-propose-delete-tasks-product-740f43`
Resumed by: `chaos:resume` · State: `resumed → apply → verify` · change lock: held (release at completion).

> **RESUME UPDATE (2026-07-21):** the human answered MD-001 in the Decision Center. This resume
> step incorporates that authoritative answer, marks MD-001 **RESOLVED (human-answered)**, and
> implements it (soft-delete + restore) in `chaos:apply`. The agent did not choose the semantics —
> the human did; the agent implements the human's selection (R-001 intact).

---

### MD-001 — Delete semantics: what does "get rid of a task" mean? (BLOCKING)

- Command: chaos:propose
- Change ID: delete-tasks-product
- Mode: standard
- Type: PRODUCT_ARCHITECTURE_DECISION
- **Status: RESOLVED (human-answered)** — answered by the maintainer in the Decision Center; incorporated on resume.
- **Disposition: BLOCKING · mustStop = true** (the stop was honoured; resolution came from a human, not the agent)
- Runtime decision ID: `DEC-2026-07-21-delete-tasks-product-delete-semantics-what-do-715d`
- Interaction type: single-choice-decision · requiresRationale: true
- **Answer: `opt-soft-trash`** — SOFT delete to a recoverable Trash (retained, hidden from the
  normal list, restorable); nothing is permanently destroyed by the user-facing delete; existing
  seeded tasks remain active.
- Answer knowledge type: **DECISION (human-authored product intent)** · Answer confidence: **HIGH**
  (authoritative maintainer selection, not an inference)
- Pre-answer agent knowledge type: UNKNOWN (product intent is not in the codebase)
- Confidence (that this was material and required a human): HIGH
- Evidence coverage: COMPLETE (now that intent is supplied) · Assumption load: LOW
- Resolved-by-agent? **No** (R-001 honoured) · Implemented-by-agent? **Yes** (per the human answer, in apply)

**Question:**
Today `DELETE /tasks/{id}` is a **permanent hard delete** (`TaskStore.Remove` → `TryRemove`),
returning 204, or 404 if unknown. The request asks to make the "get rid of it" experience "solid"
and says "do what you think is right" — but *what deletion should mean* (permanent vs. recoverable)
is a product/architecture choice that changes observable behaviour. It is **not** derivable from the
code and, per R-001, must be owned by a human.

**Why it is material:**
- Changes observable product behaviour: recoverability / undo; whether `GET /tasks` hides deleted
  tasks; whether restore / list-trash endpoints exist.
- Changes the domain model: a `DeletedAt`/`IsDeleted` marker, or a new lifecycle state (which would
  touch **R-005** `TaskState` naming) — vs. no model change at all.
- Touches the **domain→HTTP boundary (R-004)**: recoverable variants push "hide deleted" into the
  domain `TaskStore` query surface, not the endpoint.
- Recoverable variants retain task data → retention/expiry questions that brush the **persistence
  NON-GOAL** in `.chaos/architecture.md`.
- The four realistic options below are materially *different products*, not implementation details.

**Options (realistic):**

| Option ID | Label | What it means | Consequence | Risk |
|---|---|---|---|---|
| `opt-hard-harden` | Keep permanent hard delete; harden UX only | Deletion stays irreversible; only tighten robustness (clear/idempotent responses). No domain change. | No undo; a wrong delete is permanent. Matches today but may not meet the "solid/regret" bar. | LOW effort / HIGH product risk if recoverability was expected. |
| `opt-soft-trash` **(recommended, advisory)** | Soft-delete to recoverable Trash (with restore) | DELETE marks task deleted + hides it from `GET /tasks`; add restore (undo); data retained in-memory. | Users can undo accidental deletes — best fit for "users keep asking to get rid of tasks" + "solid". Requires `GET /tasks` filtering, restore endpoint(s), a domain marker. | MEDIUM effort; changes `GET /tasks` contract + domain model (R-004/R-005). |
| `opt-archive-state` | Archive as a first-class lifecycle state | Add an `Archived` concept; "get rid of" = archive, never destroy; archived tasks remain reportable/filterable. | Cleaner if archived work must stay reportable; but a new state touches R-005 and may over-model if users want true deletion. | MEDIUM effort; enum/state change (R-005). |
| `opt-two-tier` | Two-tier: soft-delete Trash + explicit permanent purge (+retention) | Undo *and* real removal: soft-delete + purge endpoint and/or retention auto-expiry. | Most complete UX but largest surface; retention/expiry brushes the persistence NON-GOAL. | HIGH effort/scope; likely needs phasing after `opt-soft-trash`. |

**Recommendation (advisory only — does NOT resolve MD-001):** `opt-soft-trash`.
Rationale (INFERENCE · MEDIUM): recoverable deletion with restore is the interpretation most
consistent with the evidence of user intent ("keep asking to get rid of tasks") and the "solid"
bar, while staying inside the in-memory demo and the existing boundary model. The human may
legitimately choose any option; the decision and its recorded rationale are theirs.

**Agent position:** IMPLEMENTED THE HUMAN'S ANSWER. The propose step created the decision and
stopped (`mustStop: true`); the human selected `opt-soft-trash`; this resume step implements exactly
that. The agent selected no option of its own.

**Resolution path (executed):** Human answered in the Decision Center →
`chaos:resume` → answer incorporated (this record) → soft-delete + restore implemented in
`chaos:apply` (see `apply-report.md`) → validated in `chaos:verify` (see `verification.md`).

> **RESOLUTION (human answer received and now incorporated):**
> - **Answer: `opt-soft-trash`** (soft-delete to a recoverable Trash, with restore).
> - Rationale (human): *"Easier as a first implementation and we can extend later on if needed
>   with options 3 or 4."*
> - Selected by: `vscode-user` · source: `vscode-decision-center` · at: `2026-07-21T20:18:10Z`.
> - Runtime: decision **ANSWERED → consumed** at resume; incorporated into apply.
> - **Agent action: IMPLEMENT (not decide).** Soft-delete semantics (marker `TaskItem.DeletedAt`,
>   `TaskStore.SoftDelete`/`Restore`/`Active`/`Trashed`, `GET /tasks` active-only, `GET /tasks/trash`,
>   `POST /tasks/{id}/restore`) were implemented in this resume's apply step. R-001 intact: the human
>   chose; the agent implemented the choice.

---

### MD-002 — DELETE not-found response contract: 404 vs 204 idempotent (BLOCKING · deferred)

- Command: chaos:propose
- Change ID: delete-tasks-product
- Type: API_CONTRACT_DECISION
- **Status: OPEN — AWAITING HUMAN (deferred; dependent on MD-001)**
- **Disposition: BLOCKING · mustStop (when created)**
- Runtime decision ID: not yet created (dependent decision — held to the next round per the
  `batch-independent` batching policy; creating it now would presume MD-001's answer).
- Knowledge type: FACT (current behaviour) + UNKNOWN (desired behaviour)
- Confidence (that it is material): HIGH · Evidence coverage: COMPLETE (current side) · Assumption load: LOW

**Question:**
Today deleting an unknown (or already-deleted) id returns **404 Not Found** — DELETE is
**non-idempotent**. Should that stay, or should DELETE be **idempotent** (return **204** whether or
not the task existed), which many "solid delete" UXs expect (a repeated/duplicate delete shouldn't
error)?

**Why it is material:** it changes the public API contract and directly shapes the "solid" delete
experience (retry/duplicate handling). It is genuinely a human/product call, not a mechanical one.

**Why deferred (not created in the runtime yet):** its correct framing depends on MD-001 —
under hard delete it means "delete a non-existent id"; under soft-delete/trash it means "delete an
already-trashed id" (which also interacts with restore). Creating it before MD-001 is answered would
smuggle in an assumption about semantics. Recorded here as OPEN; to be created in the runtime on resume.

**Options (realistic, indicative):**

| Option ID | Label | Consequence |
|---|---|---|
| `opt-keep-404` | Keep 404 on unknown/deleted id (non-idempotent) | Preserves today's contract; existing test `Delete_removes_a_task` (204→404) stays valid unchanged. |
| `opt-idempotent-204` | Make DELETE idempotent (204 regardless) | Friendlier for retries/duplicate deletes; changes the contract and the 404 half of the delete test. |

**Recommendation (advisory only):** resolve **together with MD-001**; if `opt-soft-trash`/`opt-two-tier`
is chosen, `opt-idempotent-204` tends to pair naturally, but this is the human's call.

**Agent position:** NOT DECIDED. **Still OPEN after this resume.** The human answer covered MD-001
only (delete semantics); it did **not** address idempotency. To avoid resolving a material contract
question the human did not answer (R-001), this apply **preserves the existing non-idempotent 404
contract** (unknown / already-trashed id → 404). No default was silently flipped; `opt-idempotent-204`
remains a future human decision if desired.

---

### APP-DEC-001 — Model soft-delete as a `DeletedAt` marker, not a new `TaskState` value

- Command: chaos:apply (this resume)
- Type: LOCAL_DESIGN_DECISION · Status: ACCEPTED_DURING_APPLY
- Knowledge type: INFERENCE · Confidence: HIGH · Sync action: NONE
- Decision: represent the soft-deleted/Trash state with a nullable `TaskItem.DeletedAt` marker
  (`IsDeleted => DeletedAt is not null`) rather than adding a `Deleted`/`Trashed` value to the
  `TaskState` enum.
- Rationale: (1) preserves the work-item status (Open/InProgress/Done) across delete→restore — a
  status enum value would destroy it; (2) keeps `TaskState` naming untouched → **R-005 fully
  satisfied, zero risk** (no `TaskStatus` reintroduced, no enum churn); (3) marking + active/trashed
  partitioning live in the domain `TaskStore` → **R-004 satisfied** (no HTTP dependency in domain).
- Not material (implementation detail, not product behaviour) → recorded, not surfaced to a human.

---

## Summary

| Decision | Disposition | Status | Agent resolved it? | Agent implemented it? |
|---|---|---|---|---|
| MD-001 delete semantics | BLOCKING · mustStop | **RESOLVED — human-answered (`opt-soft-trash`)**, incorporated + implemented on resume | **No** (human decided) | **Yes** (per the answer) |
| MD-002 DELETE idempotency | BLOCKING · deferred (dependent) | **OPEN** — not covered by the human answer; existing 404 contract preserved (not flipped) | **No** | n/a (unchanged) |
| APP-DEC-001 marker vs enum value | LOCAL_DESIGN_DECISION | ACCEPTED_DURING_APPLY (INFERENCE · HIGH) | n/a (non-material) | Yes |

R-001 honoured end-to-end: the sole material product decision (MD-001) was resolved by a **human**
(`vscode-user`, `opt-soft-trash`), not the agent. This resume step **incorporated** that answer and
**implemented** it (soft-delete + recoverable Trash + restore). MD-002 remains an open, deferred
human decision — deliberately **not** resolved by the agent; the existing non-idempotent 404 contract
is preserved unchanged. One non-material apply decision (APP-DEC-001) is recorded.
