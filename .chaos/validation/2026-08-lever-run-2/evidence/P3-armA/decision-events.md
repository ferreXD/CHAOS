## TRG-001 — trigger fired: M2 sensitive-surface

- status: RECORDED (2026-08-04) · run: RUN-2026-08-04-chaos-run-optimistic-concurrency-updates-p3arma
- trigger: M2 · by: scan · surface: data-store
- cite: persistence class: predicted scope includes src/TaskTracker.Api/Domain/TaskItem.cs
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0

## TRG-002 — trigger fired: M1 posture-crossing

- status: RECORDED (2026-08-04)
- trigger: M1 · by: adjudication · surface: data-store
- cite: intent 'Add an integer version to the task, serialized as version. New and seeded tasks start at version 1. Every successful PUT /tasks/{id} increments the task's version by 1' x posture '## Module / boundary model' boundary line 'new behaviour (e.g. filtering) belongs at the endpoint/query boundary, not in the store's public shape, unless a decision says otherwise' (reinforced by '## Data access posture': 'Update replaces via record with { ... }') - the intent commits to changing the domain record's shape and the store's update semantics rather than staying at the endpoint/query boundary
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2

## RUN-DEC-001 — Approve optimistic-concurrency framing: classification, the store-side placement that crosses the boundary posture, and the contract of record?

- status: RESOLVED-IN-ARM (2026-08-04) · run: RUN-2026-08-04-chaos-run-optimistic-concurrency-updates-p3arma · resolved-in-arm (no live human; lever-run mechanized run)
- approves-change: true
- options: A Approve as framed — store-side compare-and-set in `TaskStore.Update`, `Version` on `TaskItem`, ADR authorizing the posture crossing, OpenSpec delta at depth 1 · B Approve the intent but keep the store's public shape untouched — endpoint-side read-compare-write, no ADR · C Approve the intent but narrow it — expose `version` only on `PUT`/`POST` responses, not on the list/get shape · D Stop / defer — the boundary posture should be amended by a separate change before any code lands
- recommendation: A — the concurrency control is a write-atomicity invariant of the store, and only a store-side compare-and-set is actually atomic against the shared singleton.
- answer: A
- why-material: The change moves against an explicit architecture posture line and changes the write semantics of the only stateful component in the subject; both the placement and the contract widening are choices the repository does not answer.
- folds: 4 — approve intent + the K1 classification vector (M2 data-store, M1 posture-crossing; stops 1 · ev.t 1 · ev.b 0 · review 0 · verify 1 · openspec 1 · adr 2) · TRG-002 M1: store-side compare-and-set vs endpoint-side check-then-write, i.e. whether to cross the 'not in the store's public shape' posture line · TRG-001 M2: accepting a change to the persistence/write semantics of the process-wide singleton store · contract widening: exposing `version` on every task-returning endpoint rather than only on the write responses
- sync-action: CREATE_ADR + AMEND_OPENSPEC_SPEC — ADR `.chaos/changes/optimistic-concurrency-updates/adr/2026-08-04-optimistic-concurrency-in-the-task-store.md`; delta spec `openspec/changes/optimistic-concurrency-updates/specs/task-api/spec.md`; `.chaos/architecture.md` §"Module / boundary model" to be amended at sync so write-atomicity invariants are a recorded exception to the store-shape line
- knowledge: INFERENCE · confidence: HIGH

**Resolution rationale (maintainer-style, resolved in-arm — no live human was available in this measurement run).**
Option **A**. The posture line this change crosses exists to keep *query and presentation*
concerns out of the store — its own worked example is filtering. Optimistic concurrency is
not that: it is a write-atomicity invariant of the store itself. Option **B** is the one that
looks posture-compliant and is actually wrong — reading the version at the endpoint, comparing
it, then calling `Update` is a check-then-write against a `ConcurrentDictionary` singleton
shared by every request, so it reintroduces the exact lost-update race the change exists to
close. Shipping a racy concurrency control to preserve a hedged `[INFERENCE · MEDIUM]` boundary
line would be trading a real correctness property for a documentation property. The posture
line's own escape clause ("unless a decision says otherwise") anticipates precisely this, and
the ADR pays the price of the crossing explicitly and narrowly: store-side placement is
authorized for concurrency/atomicity invariants only, and query/filtering concerns stay at the
endpoint boundary. R-004 is untouched — `TaskStore` returns an outcome, the endpoint owns the
HTTP status codes, and `Domain/**` still references no ASP.NET type.
Option **C** is rejected because a client cannot practically use `expectedVersion` if it cannot
read the current `version` from a `GET`; withholding the field from the read shape would make
the feature unusable for its stated purpose. Option **D** is rejected because deferring behind
an architecture-amendment change buys nothing here: the ADR is the recorded authorization the
posture line asks for, and the amendment is already routed to sync.

## TRG-003 — trigger fired: M4 decision-density

- status: RECORDED (2026-08-04)
- trigger: M4 · by: scan · surface: process
- cite: ledger scan rule: 4 material question(s) across 1 entry >= threshold 2
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 1 · openspec 1 · adr 2
