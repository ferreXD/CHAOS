## TRG-001 — trigger fired: M2 sensitive-surface

- status: RECORDED (2026-08-04) · run: RUN-2026-08-04-task-count-b1a
- trigger: M2 · by: scan · surface: data-store
- cite: persistence class: predicted scope includes src/TaskTracker.Api/Domain/TaskStore.cs
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0

## RUN-DEC-001 — Approve the framed change: intent, K1 classification, and the contract of record?

- status: RESOLVED-IN-ARM (2026-08-04) · run: RUN-2026-08-04-task-count-b1a · resolved-in-arm (no live human; lever-run mechanized run)
- approves-change: true
- options: A approve as framed — count derived at the endpoint boundary from the existing `TaskStore.All()` projection, contract of record in `change.md` §Contract at openspec depth 0 · B approve the intent but require the count to be exposed from `TaskStore`'s public shape (a new `Count` member on the domain type) · C approve the intent but demand an OpenSpec delta spec above the classified depth 0 · D stop / defer
- recommendation: A — it is the only option that satisfies the contract without moving against the recorded boundary posture, and depth 0 is what the classifier actually owes.
- answer: A
- why-material: this is the C-11 unconditional frame stop; it fixes the contract of record, the classified rigor, and the mechanism the M2 data-store firing put in question.
- folds: 3 — approve intent + the five contract statements C-001..C-005 · approve the K1 vector (M2 data-store fired; stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0) including the openspec depth-0 skip · resolve the M2 question: endpoint-boundary derivation vs. a change to the store's public shape
- sync-action: NONE
- knowledge: FACT · confidence: HIGH

Resolution rationale (maintainer-style, recorded because no live human is available in this
measurement run): option A. Fold 1 — the five statements restate the task contract exactly and
each is testable against the existing `WebApplicationFactory<Program>` harness, so there is
nothing to negotiate. Fold 2 — the vector is the classifier's own output and is carried, not
lowered; `openspec 0` means the contract of record is `change.md` §Contract and authoring a
delta spec anyway (option C) would manufacture an obligation the classification does not owe,
which is precisely the behaviour the zero-floor design forbids. Fold 3 is the substantive one:
`.chaos/architecture.md` states, under the boundary model, that new behaviour "belongs at the
endpoint/query boundary, not in the store's public shape, unless a decision says otherwise".
Option B would take that exemption without needing it — the count is `store.All().Count`, a
projection the endpoint layer can compute today with no domain change — and it would also weaken
C-002, since a separately maintained counter can drift from what `GET /tasks` returns. Option A
keeps `Domain/**` untouched, so R-004 (domain must not depend on the HTTP layer) and R-005
(`TaskState` naming) are trivially preserved, and the M2 data-store firing resolves as a
scope-prediction artefact rather than a persistence-model change. Approving this entry is the
approval of the change.

## TRG-002 — trigger fired: M4 decision-density

- status: RECORDED (2026-08-04)
- trigger: M4 · by: scan · surface: process
- cite: ledger scan rule: 3 material question(s) across 1 entry >= threshold 2
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 1 · openspec 1 · adr 0

## TRG-003 — trigger fired: M3 contract-surface

- status: RECORDED (2026-08-04)
- trigger: M3 · by: scan · surface: contract-dependency
- cite: route delta: added ['GET /count'] (additive)
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 1 · openspec 2 · adr 1

## TRG-004 — trigger fired: X2 self-review-fail

- status: RECORDED (2026-08-04) · run: RUN-2026-08-04-task-count-b1a
- trigger: X2 · by: scan · surface: none
- cite: self-review verdict 'PASS' != clean
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 2 · verify 1 · openspec 2 · adr 1
