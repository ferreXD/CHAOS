# Decision events — soft-delete-tasks

Append-only ledger (`change-template.md` §2). `TRG-` headings are trigger events, not decision
entries, and never count toward the decision total.

## TRG-001 — trigger fired: M2 sensitive-surface

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-run-soft-delete-tasks-6985f2
- trigger: M2 · by: scan · surface: data-store
- cite: persistence class: predicted scope includes src/TaskTracker.Api/Domain/TaskItem.cs
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0

## TRG-002 — trigger fired: M1 posture-crossing

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-run-soft-delete-tasks-6985f2
- trigger: M1 · by: adjudication · surface: data-store
- cite: intent "Add a nullable deletedAt timestamp to the task model" + "DELETE /tasks/{id} must soft-delete … it must not permanently remove the task" × posture (Module / boundary model) "new behaviour (e.g. filtering) belongs at the endpoint/query boundary, not in the store's public shape, unless a decision says otherwise"
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2

## TRG-003 — trigger fired: M4 decision-density

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-run-soft-delete-tasks-6985f2
- trigger: M4 · by: scan · surface: process
- cite: ledger scan rule: 3 material question(s) across 1 entry >= threshold 2 (PROP-DEC-001 `folds: 3`)
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 1 · openspec 1 · adr 2

## PROP-DEC-001 — Approve the soft-delete frame: intent, contract, classified rigor, and the recorded posture crossing?

- status: ANSWERED (maintainer, 2026-08-03) · RESOLVED-IN-ARM · resolved-in-arm (no live human; Stage-D mechanized run) · run: RUN-2026-08-03-chaos-run-soft-delete-tasks-6985f2
- approves-change: true
- options: A approve as framed — soft-delete state in the domain model and the store, ADR-001 records the posture crossing, delta spec at openspec 1, no purge path · B approve the behaviour but keep the store's public shape untouched — filter soft-deleted rows at the endpoint only · C reject and re-frame as a strict, persistence-bearing change
- recommendation: A — the contract itself puts `deletedAt` on the serialized task and requires retention, which B cannot enforce while `TaskStore.Remove` still evicts
- answer: A
- why-material: it accepts a stated architecture posture crossing (store shape) and redefines the deletion semantics of the single source of truth, so it must be recorded, not assumed
- folds: 3 — frame approval: intent + the 9-statement contract + the classified vector (stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2) · M1 posture crossing (TRG-002): soft-delete state in the domain model/store instead of the endpoint/query boundary · M2 sensitive surface (TRG-001): deletion becomes a retention state in the in-memory store — is a purge/retention policy owed inside this change?
- sync-action: CREATE_ADR — ADR-001 (soft-delete lives in the store) qualifies the architecture boundary line for the data-store surface
- knowledge: INFERENCE · confidence: HIGH
- rationale (resolved-in-arm): (1) Frame approved as scoped — the contract is fully testable through the existing WebApplicationFactory harness and stays inside the two subject projects. (2) Crossing accepted: retention is a property of the store, not of a view; filtering at the endpoint would leave `Remove` free to evict and make "must not permanently remove the task" unenforceable, and `deletedAt` is part of the serialized shape by contract anyway. R-004 and R-005 are unaffected — no ASP.NET reference enters `Domain/**` and `TaskState` is untouched. (3) No purge/retention policy is owed here: the task text scopes the change to hiding-by-default with an explicit `includeDeleted` opt-in, so purging is deliberately left unimplemented and recorded as a consequence in ADR-001 rather than smuggled in.

## APPLY-DEC-001 — What do id-addressed writes do to an ALREADY soft-deleted task?

- status: ANSWERED (maintainer, 2026-08-03) · RESOLVED-IN-ARM · resolved-in-arm (no live human; Stage-D mechanized run) · run: RUN-2026-08-03-chaos-run-soft-delete-tasks-6985f2
- options: A treat a soft-deleted task as absent for every id-addressed operation — repeat DELETE 404s, PUT 404s · B make DELETE idempotent (204 on an already-deleted task) and leave PUT able to edit a soft-deleted task · C add an explicit undelete/restore path
- recommendation: A — the contract already pins `GET /tasks/{id}` to 404 for a soft-deleted task, so hiding it from one id-addressed verb and not the others would be self-inconsistent
- answer: A
- why-material: it fixes observable HTTP status codes for two verbs on a case the task contract leaves open, and it decides whether the store keeps a write path onto hidden rows
- folds: 2 — repeat DELETE on an already soft-deleted task: 404 (hidden) or 204 (idempotent)? · PUT /tasks/{id} against a soft-deleted task: 404, or does it still edit the hidden row (which would silently resurrect editing on deleted data)?
- sync-action: AMEND_OPENSPEC_SPEC — the delta spec states the hidden-for-all-id-addressed-verbs rule
- knowledge: INFERENCE · confidence: MEDIUM
- rationale (resolved-in-arm): One visibility rule for the whole id-addressed surface is the only story a client can hold in its head: a soft-deleted task is *not there* unless you explicitly ask with `includeDeleted`. Option B buys DELETE idempotency at the cost of PUT quietly mutating rows the API otherwise claims do not exist — a worse failure than a 404 on a repeat delete, and the task contract's "deleting an unknown id still returns 404" reads naturally as covering the hidden case. Option C (restore) is new surface area nobody asked for and is left out of scope. Bounded risk, hence MEDIUM confidence: a client that retries a failed DELETE now sees 404 instead of 204; that is the documented behaviour, not a defect.
