# Decision events — task-count

Append-only ledger (`chaos-shared/reference/change-template.md` §2). Stage-C progressive rigor:
`TRG-*` entries are trigger events, not decision entries, and never count as decisions.

## PROP-DEC-001 — Approve the /tasks/count change: compute the aggregate at the endpoint boundary, or extend the store's public shape?

- status: RESOLVED-IN-ARM (2026-08-03) · resolved-in-arm (no live human; Stage-C step-5 mechanized run)
- approves-change: true
- options: A Compute at the endpoint boundary from the existing `TaskStore.All()` read API, leaving `TaskStore`'s public shape untouched · B Add a `Count` member to `TaskStore` and have the endpoint project it · C Do not add the endpoint; let the dashboard count the `GET /tasks` payload client-side
- recommendation: A — architecture.md pins new behaviour at the endpoint/query boundary "not in the store's public shape, unless a decision says otherwise", and A satisfies the contract without invoking that exception
- answer: A — approved; add `GET /tasks/count` returning `{ "count": <int> }` computed from `TaskStore.All()` at the endpoint, no `TaskStore` API change, no auth, no persistence-model change, existing `/` and `/tasks` CRUD untouched
- why-material: the architecture posture explicitly reserves store-shape changes for a recorded decision, so choosing A vs B is a boundary-posture call a human owns, and approving the endpoint at all is the change's authorization
- sync-action: NONE
- knowledge: FACT · confidence: HIGH

<!-- Mechanized-stop deviation: no live human was available in this measurement run. The entry was
     recorded and then resolved with the documented maintainer-style rationale above, per the
     Stage-C step-5 harness protocol. Answering this entry IS the approval (C-11 floor stop). -->

## TRG-001 — trigger fired: M3 contract-surface

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-apply-task-count-b41d07
- trigger: M3 · by: scan · surface: contract-dependency
- cite: route delta: added ['GET /count'] (additive) — `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` gains `group.MapGet("/count", …)`; K3 verdict `breaking: false`
- dimensions-after: stops 1 · evidence.targeted 0 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 1
