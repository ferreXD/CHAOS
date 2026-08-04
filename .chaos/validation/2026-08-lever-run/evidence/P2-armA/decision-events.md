## TRG-001 — trigger fired: M2 sensitive-surface

- status: RECORDED (2026-08-04) · run: RUN-2026-08-04-chaos-run-soft-delete-tasks
- trigger: M2 · by: scan · surface: data-store
- cite: persistence class: predicted scope includes src/TaskTracker.Api/Domain/TaskItem.cs
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0

## TRG-002 — trigger fired: M1 posture-crossing

- status: RECORDED (2026-08-04)
- trigger: M1 · by: adjudication · surface: data-store
- cite: intent 'Add a nullable deletedAt timestamp to the task model ... GET /tasks returns only active (not soft-deleted) tasks by default' x posture (Module / boundary model) 'Keep that direction - new behaviour (e.g. filtering) belongs at the endpoint/query boundary, not in the store public shape, unless a decision says otherwise'
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2

## RUN-DEC-001 — Approve soft-delete as framed: deletion becomes retention, and the deleted-state lives in the domain model against the boundary posture?

- status: RESOLVED-IN-ARM
- approves-change: true
- options: A approve as framed — `DeletedAt` on `TaskItem`, `TaskStore` reads active-by-default, `Remove` superseded by `SoftDelete`, ADR records the posture crossing · B approve the behaviour but keep the domain clean — hold deleted ids at the endpoint layer and project `deletedAt` there, leaving `TaskItem`/`TaskStore` untouched · C approve the model change but keep hard delete reachable — add `SoftDelete` alongside `Remove` · D stop / defer — the posture crossing needs a human before any code is written
- recommendation: A — the contract requires `deletedAt` on every task JSON, which is unsatisfiable without the field on the model, and the posture line names exactly this escape ("unless a decision says otherwise")
- answer: A
- why-material: it changes persistence semantics (deleted stops meaning gone) and crosses a recorded architecture posture line about what may enter the store's public shape
- folds: 5 — approve intent + classified vector (stops 1 · ev.t 1 · ev.b 0 · review 0 · verify 1 · openspec 1 · adr 2) · M1: accept the boundary-posture crossing, deleted-state in the domain model · M2: accept the persistence-semantics change (retention, monotonic growth, no purge path) · accept the openspec depth-1 delta spec as the contract of record (active-by-default reads + `includeDeleted`) · supersede `TaskStore.Remove` rather than keeping hard delete reachable
- sync-action: CREATE_ADR + UPDATE_CHAOS_RULES — `.chaos/changes/soft-delete-tasks/adr/2026-08-04-soft-delete-in-the-domain-model.md` is authored here; `chaos:sync` must fold it into `.chaos/architecture.md` §"Module / boundary model" and §"Data access posture" so the next change classifies against the amended posture
- knowledge: INFERENCE · confidence: HIGH
- resolution-rationale: resolved-in-arm (no live human; lever-run mechanized run). Maintainer-style rationale for A over B/C/D: (1) B is refused because the task contract makes `"deletedAt": null` part of every task's JSON — an endpoint-layer side table splits one entity's state across two owners, turns serialization into a projection concern, and leaves the store able to hand a deleted task to any future caller that forgets to consult the side table; it honours the letter of the posture line while making the invariant less enforceable. (2) The posture line is explicitly escapable and its purpose is to keep *query* concerns out of the store; soft deletion is a *lifecycle property of the entity*, not a query concern, so the crossing is the intended use of the escape rather than an erosion of it. R-004 is untouched either way — `Domain/**` still references no ASP.NET type; what moves is what the domain knows, not what it depends on. (3) C is refused because nothing would call the hard path: two deletion semantics on one entity with one live caller is a foot-gun for the next change; if purge is ever wanted it should arrive as its own change with a retention policy. (4) D is the honest default when a human is available; it is unavailable in this arm, so the crossing is instead recorded in full — trigger, cite, ADR, and this rationale — for out-of-band review. Accepted consequence: storage grows monotonically for the process lifetime, which is acceptable for a single-instance, process-lifetime in-memory demo store.

## TRG-003 — trigger fired: M4 decision-density

- status: RECORDED (2026-08-04)
- trigger: M4 · by: scan · surface: process
- cite: ledger scan rule: 5 material question(s) across 1 entry >= threshold 2
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 1 · openspec 1 · adr 2

## RUN-DEC-002 — What do DELETE and PUT return for an id that is soft-deleted — the contract does not say?

- status: RESOLVED-IN-ARM
- approves-change: false
- options: A both `404` — a soft-deleted id behaves toward every endpoint exactly as a removed id did before this change · B `DELETE` returns `204` (idempotent no-op) and `PUT` returns `404` · C both keep working on soft-deleted rows — `DELETE` re-stamps `deletedAt` and returns `204`, `PUT` edits the hidden row and returns `200` · D stop / defer for a human
- recommendation: A — it is the only option under which no externally observable status code regresses relative to the pre-change API
- answer: A
- why-material: these are public HTTP status codes on two existing endpoints; nothing in the task contract, the OpenSpec delta, or the repo specifies them, and option C lets a client mutate a task it cannot read
- folds: 2 — `DELETE /tasks/{id}` on an already soft-deleted task: 404 or idempotent 204? · `PUT /tasks/{id}` on a soft-deleted task: 404, or keep the current behaviour of editing the row and returning 200?
- sync-action: AMEND_OPENSPEC_SPEC — the answer is folded into the change's delta spec (`Delete Task Is A Soft Delete`, and a new `Update Task Hides Soft-Deleted Tasks` requirement) so the resolved behaviour is specified, not merely coded
- knowledge: INFERENCE · confidence: HIGH
- resolution-rationale: resolved-in-arm (no live human; lever-run mechanized run). This is genuine discordance rather than a question the repository already answers: the task contract enumerates `204` and `404` for DELETE but is silent on the repeat case, and it says "do not change unrelated behaviour of the other CRUD endpoints" while PUT's behaviour toward a deleted id is not unrelated — it is a direct consequence of introducing soft delete. The decisive argument for A is non-regression, not aesthetics. BEFORE this change a deleted row was evicted from the dictionary, so a second `DELETE` returned `404` and a `PUT` against that id returned `404`. Option A reproduces both of those observable outcomes exactly; options B and C each change a status code that used to be `404`, which is precisely the "unrelated behaviour" the task told us not to disturb. A also keeps the API self-consistent: `GET /tasks/{id}` is specified to return `404` for a soft-deleted task, and an API where `GET` says an id does not exist while `DELETE` says `204` or `PUT` says `200` for that same id is incoherent. Note that A does not break DELETE idempotency in the HTTP sense — idempotency constrains the *effect* of a repeated request, not its status code, and returning `404` on a repeat delete is a conventional, permitted outcome. Accepted consequence: there is no HTTP path to un-delete or to re-stamp `deletedAt`; restore would be its own change.

## TRG-004 — trigger fired: X2 self-review-fail

- status: RECORDED (2026-08-04)
- trigger: X2 · by: scan · surface: none
- cite: self-review verdict 'PASS' != clean
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 2 · verify 1 · openspec 1 · adr 2
