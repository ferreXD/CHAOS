# Decision events — optimistic-concurrency-updates

Append-only ledger (change-template §2). `TRG-*` entries are trigger events, not decision
entries, and are excluded from the §2 decision scan rule.

## TRG-001 — trigger fired: M2 sensitive-surface

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-run-optimistic-concurrency-updates-b26153
- trigger: M2 · by: scan · surface: data-store
- cite: persistence class: predicted scope includes src/TaskTracker.Api/Domain/TaskItem.cs
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0

## TRG-002 — trigger fired: M1 posture-crossing

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-run-optimistic-concurrency-updates-b26153
- trigger: M1 · by: adjudication · surface: data-store
- cite: intent "Add an integer version to the task ... rejected with HTTP 409 Conflict and the task is left unchanged" x architecture.md "Boundary posture [INFERENCE · MEDIUM]: new behaviour belongs at the endpoint/query boundary, not in the store's public shape, unless a decision says otherwise"
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2

## TRG-003 — trigger fired: M4 decision-density

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-run-optimistic-concurrency-updates-b26153
- trigger: M4 · by: scan · surface: process
- cite: ledger scan rule: 3 material question(s) across 1 entry >= threshold 2 (K2, scanSeq 3)
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 1 · openspec 1 · adr 2

## PROP-DEC-001 — S1 frame approval: approve optimistic concurrency as framed, and authorize the store-shape crossing it requires?

- status: ANSWERED (resolved-in-arm, 2026-08-03) · RESOLVED-IN-ARM — resolved-in-arm (no live human; Stage-D mechanized run)
- approves-change: true
- options: A approve as framed — version + compare-and-set live in TaskStore, endpoint translates the conflict to 409 · B approve but keep the store untouched — endpoint reads, compares and writes back · C reject / re-frame
- recommendation: A — the store is the only place that can make read-compare-write atomic against a ConcurrentDictionary; option B leaves the very lost-update race the change exists to close
- answer: A
- why-material: adds a field to the persisted task shape and moves compare-and-set behaviour into the store's public API, which architecture.md reserves for an explicit decision
- folds: 3 — S1 approve-as-framed (intent + classification vector + contract) · M1 authorize the store-public-shape crossing (TaskItem.Version, TaskStore compare-and-set) · M2 confirm the version-bump policy on the data-store surface (seeded = 1, bump on every success, no bump on 409)
- sync-action: CREATE_ADR — adr 2 is owed by the M1 firing; the ADR records this authorization
- knowledge: INFERENCE · confidence: MEDIUM

### Maintainer rationale (resolved-in-arm)

Answered A. Rationale recorded as the maintainer would: (1) the change is approved as framed —
the intent is a real correctness defect (lost update), the contract is testable end-to-end
through the HTTP surface, and the classified vector (stops 1 · ev.t 1 · ev.b 0 · review 0 ·
verify 1 · openspec 1 · adr 2) matches the blast radius. (2) The M1 crossing is authorized: the
boundary-posture line reserves store-public-shape behaviour "unless a decision says otherwise" —
this entry is that decision. Optimistic concurrency is a property of the stored record, not of a
query, so the endpoint/query boundary cannot own it; only the store can make read-compare-write
atomic. The domain→HTTP direction is unaffected (R-004 holds: the store returns an outcome, the
endpoint maps it to 409). (3) Version-bump policy confirmed: seeded and created tasks start at 1,
every successful update bumps by exactly 1, a rejected (409) update bumps nothing and mutates
nothing. Durability is explicitly NOT in scope — the store stays in-memory, so this is not the
persistence non-goal.
