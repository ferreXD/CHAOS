# Decision events — soft-delete-tasks

Append-only ledger (`chaos-shared/reference/change-template.md` §2). `TRG-*` entries are
Stage-C trigger events, deliberately **not** decision entries under the §2 scan rule.

## TRG-001 — trigger fired: M2 sensitive-surface

- status: RECORDED (2026-08-02) · run: RUN-2026-08-02-chaos-propose-soft-delete-tasks-e9a761
- trigger: M2 · by: scan · surface: data-store
- cite: persistence class: predicted scope includes src/TaskTracker.Api/Domain/TaskItem.cs
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0

## TRG-002 — trigger fired: M1 posture-crossing

- status: RECORDED (2026-08-02) · run: RUN-2026-08-02-chaos-propose-soft-delete-tasks-e9a761
- trigger: M1 · by: adjudication · surface: data-store
- cite: intent 'add a nullable deletedAt timestamp to the task model ... set it on DELETE and return 204 instead of removing the row' x posture .chaos/architecture.md Module/boundary model 'new behaviour (e.g. filtering) belongs at the endpoint/query boundary, not in the store's public shape, unless a decision says otherwise'
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2

## PROP-DEC-001 — Approve soft-delete as framed: accept the store-shape crossing, and settle deleted-row visibility?

- status: RESOLVED-IN-ARM (mechanized maintainer, 2026-08-02) · run: RUN-2026-08-02-chaos-propose-soft-delete-tasks-e9a761 · resolved-in-arm (no live human; Stage-C step-5 mechanized run)
- approves-change: true
- options: Q1 store-shape crossing — A endpoint-side visibility filter + minimal store mutator (`Remove` → `SoftDelete`), `All()`/`Get()` shapes untouched · B store filters internally (`All(bool includeDeleted)`, `Get` hides deleted) · C reject the crossing, keep hard delete (fails the contract) — Q2 re-delete of an already soft-deleted task — A 404 (consistent with `GET /tasks/{id}` hiding it) · B 204 again (idempotent) — Q3 retention of soft-deleted rows — A retain for process lifetime, no purge · B add a purge/TTL mechanism
- recommendation: Q1 A · Q2 A · Q3 A — smallest crossing of the endpoint/query-boundary posture that still satisfies the pinned contract; keeps the deleted-row policy consistent and adds no unrequested machinery
- answer: Q1 A · Q2 A · Q3 A
- why-material: M1 fired on the `.chaos/architecture.md` boundary posture ("new behaviour belongs at the endpoint/query boundary, not in the store's public shape, unless a decision says otherwise") and M2 on the persistence class; the pinned contract is silent on re-delete and on retention, so both are agent-guessable choices that change observable behaviour.
- sync-action: CREATE_ADR — the accepted crossing is durable posture (adr dimension 2)
- knowledge: FACT · confidence: HIGH

Rationale (maintainer-style, mechanized): the contract itself mandates `deletedAt` on the task
model, so *some* store-shape movement is unavoidable; Q1-A confines it to replacing the `Remove`
mutator with `SoftDelete` and leaves `All()`/`Get()` returning what they always returned, so the
visibility rule stays where the posture wants it — at the endpoint/query boundary. Q2-A keeps one
rule for "soft-deleted rows are invisible to id lookups" instead of two. Q3-A matches the
process-lifetime, non-durable store posture; a purge mechanism is unrequested scope.

Documented deviation: no live human was available in this measurement run. Each decision was
recorded and then resolved with an explicit maintainer-style rationale and tagged
`resolved-in-arm`. Answering this entry IS the approval.
