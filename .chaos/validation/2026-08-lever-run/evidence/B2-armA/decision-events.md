# Decision Events — filter-tasks-by-status

> Append-only ledger. Entries are never rewritten; a state change edits the `status:` line only.
> `TRG-*` events are appended mechanically by `chaos-scan` and are NOT decision entries.

## APP-DEC-001 — Approve the framing of `filter-tasks-by-status`: intent, the zero-trigger classification (openspec 0, no ADR owed), and the six-statement contract of record?

- status: RESOLVED-IN-ARM · resolved-in-arm (no live human; lever-run mechanized run) · 2026-08-04 · run: RUN-2026-08-04-chaos-run-filter-tasks-by-status-b2a
- approves-change: true
- options: A approve as framed — proceed with contract C-001..C-006, openspec depth 0, unrecognised `status` → 400 with an error body · B approve the intent but demand an OpenSpec delta spec for the query contract before implementation · C approve the intent but change the invalid-value semantics to 200 with an empty list · D stop / defer
- recommendation: A — the K1 scan and the adjudication pass both fired zero triggers; the architecture already names `GET /tasks` query filtering as the known extension point at the endpoint/query boundary, and the intent explicitly excludes auth and any persistence-model change, so nothing here is owed more rigor than the classified floor.
- answer: A
- maintainer-rationale: Approved as framed. (1) Framing — the change is additive, read-only query shaping on a single existing route; the classifier's zero-trigger verdict matches the evidence, so raising rigor by hand would be an unrecorded floor and is refused. (2) OpenSpec depth 0 — the contract of record is `change.md` §Contract, carrying stable ids C-001..C-006; authoring a delta spec for a three-value query parameter would duplicate that contract without adding a checkable obligation, and depth is the classifier's call, not a preference. Option B is therefore declined. (3) Invalid-value semantics — this closes architecture open question OQ-002, which was explicitly "deferred to the first `chaos:propose`". An unrecognised `?status=` value is a client error, not an empty result set: returning 200 with `[]` (option C) would make a typo indistinguishable from a genuinely empty bucket, which is the failure mode the 400 exists to prevent. The API's existing validation posture already answers a bad `Title` with 400 + an error object, so 400 + an error object is the consistent shape. Declined C. (4) Implementation constraint carried with the approval: the filter must live at the endpoint/query boundary; `TaskStore`'s public shape and `Domain/**` stay untouched (R-004, R-005), and the existing five tests stay green (R-003).
- why-material: This is the run's unconditional frame-approval stop (C-11): it fixes the contract of record, the governance depth the change owes, and a public API error-semantics question the architecture had left open.
- folds: 3 — approve intent + zero-trigger classification vector · accept openspec depth 0 with `change.md` §Contract as the contract of record · resolve OQ-002 invalid-filter-value semantics as 400 + error body
- sync-action: NONE
- knowledge: FACT · confidence: HIGH

## APP-DEC-002 — The spec of record already requires `status` AND `priority` filtering (unimplemented in code); the approved contract covers only `status`. Deliver the `status` half only, or widen to satisfy the whole requirement?

- status: RESOLVED-IN-ARM · resolved-in-arm (no live human; lever-run mechanized run) · 2026-08-04 · run: RUN-2026-08-04-chaos-run-filter-tasks-by-status-b2a
- options: A deliver `status` only as contracted; record the unimplemented `priority`/AND half as accepted debt against the existing requirement · B widen this change to also implement `priority` and AND-combination, fully satisfying the requirement · C narrow the spec by removing the `priority` clauses from the requirement, then deliver `status` only · D stop / defer
- recommendation: A — the approved boundary (APP-DEC-001, statements C-001..C-006) is `status` only, and neither widening the code nor narrowing the spec is authorized by it.
- answer: A
- maintainer-rationale: Deliver the `status` half only. (1) Option B is SPEC_DRIFT against the approved contract: `priority` filtering and AND-combination are neither in C-001..C-006 nor in the intent approved at S1, and the intent's own constraint is "do not change unrelated behaviour of the other CRUD endpoints" — an agent widening its own scope because a spec elsewhere is broader is precisely the drift the scope policy exists to stop. Declined. (2) Option C is ARCHITECTURE_DRIFT dressed as tidying: `openspec/specs/task-api/spec.md` records `status`+`priority`+AND as a settled requirement backed by `docs/decision-log/2026-07-19-task-filter-validation.md`; deleting spec content to make the code look complete destroys the audit trail of a decision this change never revisited. Declined. (3) The pre-existing gap is real but is NOT created by this change — the requirement was already unimplemented before it started, so this run neither causes nor is blocked by it. It is recorded as accepted debt and left visible for a follow-up change. (4) Confirmed alignment, not conflict: the same spec fixes an unrecognised filter value at 400 Bad Request, which matches the semantics resolved in APP-DEC-001 fold 3 — so OQ-002's answer here agrees with the recorded decision-log entry rather than overriding it. (5) The delta spec authored for this change therefore restates the requirement without removing the `priority` clauses, and adds only what this change genuinely settles: explicit case-insensitive matching of the `status` value.
- why-material: It sets the boundary between the approved contract and a broader recorded requirement, and decides whether a spec of record may be edited to match a narrower implementation.
- folds: 2 — deliver `status` only vs. widen to `priority`/AND · how the residual unimplemented requirement half is recorded (accepted debt vs. spec narrowing)
- sync-action: RECORD_ACCEPTED_RISK — the `priority` and AND-combination clauses of requirement "List Tasks" remain unimplemented after this change; follow-up change owed.
- knowledge: FACT · confidence: HIGH

## TRG-001 — trigger fired: M4 decision-density

- status: RECORDED (2026-08-04) · run: RUN-2026-08-04-chaos-run-filter-tasks-by-status-b2a
- trigger: M4 · by: scan · surface: process
- cite: ledger scan rule: 3 material question(s) across 1 entry >= threshold 2
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 0 · openspec 1 · adr 0

## TRG-002 — trigger fired: X2 self-review-fail

- status: RECORDED (2026-08-04) · run: RUN-2026-08-04-chaos-run-filter-tasks-by-status-b2a
- trigger: X2 · by: scan · surface: none
- cite: self-review verdict 'pass' != clean
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 2 · verify 1 · openspec 1 · adr 0
