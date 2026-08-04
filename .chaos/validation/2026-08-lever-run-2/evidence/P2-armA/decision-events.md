## TRG-001 — trigger fired: M2 sensitive-surface

- status: RECORDED (2026-08-04) · run: RUN-2026-08-04-chaos-run-soft-delete-tasks-01
- trigger: M2 · by: scan · surface: data-store
- cite: persistence class: predicted scope includes src/TaskTracker.Api/Domain/TaskItem.cs
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0

## TRG-002 — trigger fired: M1 posture-crossing

- status: RECORDED (2026-08-04)
- trigger: M1 · by: adjudication · surface: data-store
- cite: intent 'Add a nullable deletedAt timestamp to the task model ... GET /tasks returns only active (not soft-deleted) tasks by default' x posture '## Module / boundary model' line 'new behaviour (e.g. filtering) belongs at the endpoint/query boundary, not in the store's public shape, unless a decision says otherwise' (and '## Data access posture': 'All() returns tasks in creation order')
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2

## RUN-DEC-001 — Approve soft-delete for tasks: the framing, the store-shape posture crossing, and what an id-addressed endpoint does with a soft-deleted task

- status: RESOLVED-IN-ARM · resolved-in-arm (no live human; lever-run mechanized run) · 2026-08-04
- approves-change: true
- options: A approve as framed — soft-delete is domain state (nullable `DeletedAt` on `TaskItem`, `TaskStore` owns the transition and the default active-only visibility), the boundary-posture crossing is authorized and recorded as an ADR, and a soft-deleted task is treated as ABSENT by every id-addressed endpoint (`GET /tasks/{id}` 404, `DELETE` again 404, `PUT` 404) · B approve the behaviour but keep the store's public shape untouched — `TaskStore` keeps returning every task and each caller re-applies the active-only predicate at the endpoint layer, leaving the architecture's boundary line uncrossed · C approve the behaviour and the store shape, but keep a soft-deleted task ADDRESSABLE by id — re-`DELETE` is idempotent 204 and `PUT` still edits a deleted task (only `GET /tasks/{id}` and the default list hide it) · D stop / defer — do not proceed until a maintainer rules on the posture crossing
- recommendation: A — it is the only option that satisfies the whole contract without leaving a default that every future caller must remember to re-apply
- answer: A
- why-material: it authorizes a recorded architecture-posture crossing (M1, surface data-store), changes the public shape of the domain store, redefines the semantics of an existing endpoint (`DELETE` stops removing), and settles two observable API behaviours the intent leaves unspecified
- folds: 4 — approve intent + classification vector + contract C-001..C-010 + the OpenSpec delta at depth 1 · authorize the M1 store-shape posture crossing and its ADR · `DELETE /tasks/{id}` on an already-soft-deleted task · `PUT /tasks/{id}` on a soft-deleted task
- sync-action: CREATE_ADR — `.chaos/changes/soft-delete-tasks/adr/2026-08-04-soft-delete-lives-in-the-store-shape.md`; `chaos:sync` should reconcile the boundary paragraph of `.chaos/architecture.md` with it
- knowledge: INFERENCE · confidence: HIGH

**Resolution rationale (maintainer-style, resolved-in-arm).** Option A, on three grounds.

*The posture crossing (fold 2).* The architecture line prefers new behaviour at the
endpoint/query boundary "unless a decision says otherwise" — it is hedged precisely so a
decision like this one can cross it, and the pinned adjudication contract treats a hedged line
as still crossable, which is why M1 fired rather than being waived. The line's own example is
*filtering*, a per-request concern. Deletion is not a per-request concern: it is lifecycle
state that outlives the request and belongs to the entity. Option B would push a
correctness-critical default out to every call site, so any future reader that forgets it
leaks deleted rows — the exact failure the "single source of truth" posture exists to
prevent — and it would leave `Get(id)` returning deleted tasks by default, contradicting the
contract. The crossing is narrow: query filtering stays at the endpoint, only lifecycle state
moves into the store, and the ADR records that qualification.

*Re-deleting a soft-deleted task (fold 3).* 404, not idempotent 204. The contract already
requires `GET /tasks/{id}` to answer 404 for a soft-deleted task, i.e. it makes the task
indistinguishable from an absent one on the id route. Answering 204 on a second `DELETE`
would make `DELETE` the one id-addressed endpoint that can still see the task, and it would
either silently overwrite the original `deletedAt` — destroying the very audit value
soft-delete exists to provide — or return success for an operation that did nothing. 404 keeps
one rule across the whole id surface and preserves the first deletion timestamp.

*Updating a soft-deleted task (fold 4).* 404, for the same one-rule reason. The counter-argument
is the constraint "do not change unrelated behaviour of the other CRUD endpoints", but `PUT`'s
behaviour toward *deleted* tasks is not unrelated behaviour — it is behaviour that could not
exist before this change, since deleted tasks did not exist. `PUT` against active tasks is
untouched, which is what that constraint protects. Option C is rejected: allowing edits to a
deleted task creates a resurrect-by-side-effect path nobody specified.

*Scope note.* No undeletion/restore endpoint is in scope — the intent does not ask for one and
adding it would be spec drift. Retained rows are reachable via `GET /tasks?includeDeleted=true`
only.

## TRG-003 — trigger fired: M4 decision-density

- status: RECORDED (2026-08-04)
- trigger: M4 · by: scan · surface: process
- cite: ledger scan rule: 4 material question(s) across 1 entry >= threshold 2
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 1 · openspec 1 · adr 2
