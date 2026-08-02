# Decision Events — optimistic-concurrency-updates

Append-only ledger (`change-template.md` §2). `TRG-*` entries are trigger events, not decisions.

## TRG-001 — trigger fired: M2 sensitive-surface

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-propose-optimistic-concurrency-updates-c73bd0
- trigger: M2 · by: scan · surface: data-store
- cite: persistence class: predicted scope includes src/TaskTracker.Api/Domain/TaskItem.cs
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0

## TRG-002 — trigger fired: M1 posture-crossing

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-propose-optimistic-concurrency-updates-c73bd0
- trigger: M1 · by: adjudication · surface: data-store
- cite: intent "Add an integer version field to the task (serialized as version), starting at 1 … incremented by 1 on every successful PUT" x posture (.chaos/architecture.md, Module / boundary model) "Keep that direction — new behaviour (e.g. filtering) belongs at the endpoint/query boundary, not in the store's public shape, unless a decision says otherwise"
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2

## PROP-DEC-001 — Approve the optimistic-concurrency contract, including the store-shape crossing it requires?

- status: RESOLVED-IN-ARM (mechanized-maintainer, 2026-08-03) · run: RUN-2026-08-03-chaos-propose-optimistic-concurrency-updates-c73bd0
- approves-change: true
- runtime-decision: resolved-in-arm (no live human; Stage-C step-5 mechanized run)
- folded-questions: (1) M1/data-store — the version counter lands in the store's public shape (`TaskItem` gains `Version`; `TaskStore.Update` performs the compare-and-swap), which moves against the architecture boundary posture "new behaviour belongs at the endpoint/query boundary, not in the store's public shape, unless a decision says otherwise"; this decision is that "otherwise". (2) M2/data-store — update becomes a conditional persistence operation, so the read-compare-write must be atomic inside the `ConcurrentDictionary`, not a check-then-act in the endpoint.
- options: A Accept the crossing — `Version` on `TaskItem`, atomic compare-and-swap inside `TaskStore.Update`, endpoint maps the mismatch to 409 · B Keep the store shape untouched — endpoint reads the task, compares versions, then calls the existing `Update` · C Do not add concurrency control
- recommendation: A — only an atomic store-level compare-and-swap actually removes the lost-update race; B re-creates it as a check-then-act window
- answer: A — rationale: "The change exists to close a lost-update race; option B's endpoint-level check-then-act leaves exactly the window we are closing, and option C declines the task. The boundary posture is explicitly conditional ('unless a decision says otherwise') and this entry is that decision. The crossing is bounded: the store gains one integer and one conditional-update overload, the HTTP mapping (409) stays at the endpoint, and the domain keeps zero ASP.NET references (R-004)."
- why-material: it decides where concurrency semantics live (domain store vs HTTP endpoint) and knowingly accepts a recorded architecture-posture crossing
- sync-action: CREATE_ADR — the M1 crossing raised `adr` to 2; the ADR is blocking before a READY verdict
- knowledge: INFERENCE · confidence: MEDIUM
