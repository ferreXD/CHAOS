---
chaosMetadata:
  schemaVersion: 1
  artifactType: decision-events
  artifactScope: change
  changeId: add-priority-filter
  sourceCommand: "chaos:run"
---

# Decision Events — add-priority-filter

Append-only. Entry shape: `chaos-shared/reference/change-template.md` §2.

## RUN-DEC-001 — Approve the ?priority= filter frame, and settle case sensitivity + the empty value

- status: ANSWERED (vscode-user, 2026-08-04) · CONSUMED
- approves-change: true
- options: A case-insensitive values · empty ?priority= is 400 · B exact-case values only · empty is 400 · C case-insensitive values · empty ?priority= returns everything · D stop / defer
- recommendation: A — the request-body path already deserializes these same enums case-insensitively (`Program.cs` registers a default `JsonStringEnumConverter`), and rejecting the empty value needs no special case ahead of the validation rule.
- answer: A — frame approved as presented; `?priority=` values are matched case-insensitively, and an empty `?priority=` is a 400. Adds C-006 and C-007 to the contract.
- why-material: fixes the accepted-input surface of a public route — what returns 200 versus 400 — for this filter and for the `?status=` filter that follows it.
- folds: 3 — frame approval (intent + zero-trigger classification + the 5-statement contract) · case sensitivity of the accepted values · meaning of an empty `?priority=`
- sync-action: UPDATE_CHAOS_RULES — the answer closes context OQ-002 ("invalid filter value: 400 vs ignore") in favour of 400; `.chaos/context.md` OQ-002 and the `.chaos/architecture.md` API-strategy section are updated at close.
- knowledge: FACT · confidence: HIGH
- runtime-decision: DEC-2026-08-04-add-priority-filter-approve-the-priority-fil-06cf

## TRG-001 — trigger fired: M4 decision-density

- status: RECORDED (2026-08-04) · run: RUN-2026-08-04-chaos-run-20b9a2
- trigger: M4 · by: scan · surface: process
- cite: ledger scan rule: 3 material question(s) across 1 entry >= threshold 2
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 0 · openspec 1 · adr 0

## TRG-002 — trigger fired: M3 contract-surface

- status: RECORDED (2026-08-04) · run: RUN-2026-08-04-chaos-run-20b9a2
- trigger: M3 · by: adjudication · surface: contract-dependency
- cite: patch 'src/TaskTracker.Api/Endpoints/TaskEndpoints.cs: -group.MapGet("/", (TaskStore store) => Results.Ok(store.All())); +group.MapGet("/", (string? priority, TaskStore store) => { ... return Results.BadRequest(new { error = ... }); }' x scope 'the GET /tasks handler gains an optional priority query parameter' — the public contract of an existing route changed: it accepts a new query parameter and can now answer 400 where it previously always answered 200. The deterministic route-delta scan cannot see this because the route template MapGet("/") is byte-identical; only the handler's parameter list and status set changed.
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 1 · openspec 1 · adr 1
