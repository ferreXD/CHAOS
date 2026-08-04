# Decision Events — filter-tasks-by-status

> Append-only ledger. Entries are appended, never rewritten; a state change edits the
> `status:` line only. `TRG-*` trigger events are appended mechanically by `chaos-scan`.

## RUN-DEC-001 — Approve the intent, the zero-trigger classification (openspec 0 / verify 0 / adr 0) and the C-001..C-007 contract for status filtering on GET /tasks?

- status: RESOLVED-IN-ARM · resolved-in-arm (no live human; lever-run mechanized run) · 2026-08-04
- approves-change: true
- options: A approve intent + classification + contract as framed, settling OQ-002 at HTTP 400 inside the change contract · B approve the intent but demand an OpenSpec delta spec and/or an ADR above the classified depth before implementation · C stop and re-frame (reject the contract, e.g. prefer 200-with-empty-list or silently-ignore for an unrecognised status)
- recommendation: A — the classification fired nothing on either the deterministic scan or the adjudication pass, the change moves with recorded posture rather than against it, and the whole contract is testable against the existing green baseline; raising artifacts the vector does not owe would be ceremony, not control
- answer: A
- why-material: it is the run's one unconditional approval gate — it fixes the behavioural contract (including the 400-on-unrecognised-value answer to the architecture's deferred OQ-002) and accepts a governance depth that authors no spec artifact and owes no ADR
- folds: 2 — approve intent + K1 classification + contract C-001..C-007 · accept settling architecture OQ-002 (unrecognised `?status=` value → HTTP 400) inside the change contract, with no ADR and no architecture-doc amendment
- sync-action: NONE
- knowledge: FACT · confidence: HIGH

**Resolution rationale (maintainer-style, recorded in lieu of a live human).** Option A.
The two folded questions resolve together and in the same direction:

1. *Intent, classification and contract.* The intent is a read-only, additive query parameter
   on one existing route. The architecture document names `GET /tasks` `?status=` filtering as
   **the known extension point** (§API strategy), so this is posture-following work, not
   posture-crossing work. Both non-goals that would have raised the stakes here — authentication
   and persistence — are explicitly disclaimed by the intent and untouched by the plan. The
   classifier fired zero triggers across the deterministic scan and the adjudication pass at
   HIGH confidence, so the owed vector is the floor: no OpenSpec artifact, no ADR, no verify
   pass. Contract statements C-001..C-007 are each directly testable against the existing
   in-memory integration suite, which is the release-safety mechanism this repository actually
   relies on (§Testing / release posture).
2. *OQ-002.* The architecture explicitly **deferred** invalid-filter-value behaviour to the
   first change that touches filtering; this is that change. Answering it with `400 Bad Request`
   is the choice consistent with the endpoint's existing validation convention — a blank `Title`
   on create/update already returns `400` rather than degrading silently — so this settles the
   open question by extending an established local convention, not by inventing posture. That
   makes it a contract statement (C-004), not an architectural reversal, which is why no ADR is
   owed and `sync-action: NONE` is correct. A future `chaos:sync` may fold the answer back into
   `.chaos/architecture.md`; nothing in this change requires it.

Option B was declined because the classified depth is the whole point of the mechanism — the
vector, not a mode word, sets the rigor, and manufacturing an OpenSpec delta the classification
does not owe would corrupt the very signal being relied on. Option C was declined because the
alternatives to `400` (returning `200` with an empty list, or ignoring the parameter) both hide
client error, and the intent specifies `400` explicitly.

## TRG-001 — trigger fired: M4 decision-density

- status: RECORDED (2026-08-04)
- trigger: M4 · by: scan · surface: process
- cite: ledger scan rule: 2 material question(s) across 1 entry >= threshold 2
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 0 · openspec 1 · adr 0

## RUN-DEC-002 — The main spec `task-api` already requires status+priority filtering combined with AND, but this change's approved contract covers status only: deliver the subset, or widen to spec parity?

- status: RESOLVED-IN-ARM · resolved-in-arm (no live human; lever-run mechanized run) · 2026-08-04
- options: A deliver status-only per the approved C-001..C-007 contract, and author the owed delta as a MODIFIED requirement that records `priority` + AND-combination as still unimplemented · B widen this change to full spec parity now (add `priority` and AND-combination), exceeding the approved contract · C narrow the main spec instead — amend `task-api` to drop `priority`/AND until a future change asks for it
- recommendation: A — the approved contract is status-only and explicitly forbids changing unrelated endpoint behaviour; the honest move is to deliver the subset and make the remaining gap visible in the spec delta rather than silently leaving a `SHALL` unmet
- answer: A
- why-material: it decides whether the delivered code intentionally under-implements a `SHALL` in an existing source-of-truth spec, and it determines the shape of the OpenSpec delta this classification owes (`openspec 1`) — the artifact cannot be authored before it is answered
- folds: 2 — deliver status-only vs widen to `priority`/AND parity · shape of the owed delta spec: MODIFIED against the existing `task-api` "List Tasks" requirement recording partial fulfilment, vs a new narrowed requirement
- sync-action: NONE
- knowledge: FACT · confidence: HIGH

**Resolution rationale (maintainer-style, recorded in lieu of a live human).** Option A.

The relevant repository state, established by direct inspection rather than assumption: the
main spec `openspec/specs/task-api/spec.md` carries a requirement "List Tasks" whose SHALL
covers optional `status` **and** `priority` filters combined with logical AND, plus rejection of
unrecognized values with `400`. The implementation carries **none** of it — `GET /tasks` today
returns `store.All()` unfiltered. The spec is therefore running ahead of the code, and this
change closes part of that gap, not all of it.

Widening to parity (option B) was declined because it exceeds the contract approved at
RUN-DEC-001 and the intent's explicit constraint not to change unrelated behaviour; a change
that quietly grows past its approved contract is the drift this governance exists to prevent,
and `priority` filtering carries its own test and validation surface that nobody has approved
here. Narrowing the main spec (option C) was declined because the `priority`/AND requirement is
an accepted, human-decided posture with its own provenance trail; deleting a `SHALL` to make a
partial delivery look complete would be governance theatre in the worst direction — losing real
recorded intent to flatter this change's completion status.

Option A keeps both truths visible: the code gains exactly the approved behaviour, and the delta
spec states in writing that `priority` and AND-combination remain unimplemented after this
change. The gap stays discoverable for the change that eventually closes it.

**Bearing on RUN-DEC-001 (recorded, not a re-opening).** Fold 2 of RUN-DEC-001 treated the
architecture document's OQ-002 ("invalid-filter-value behaviour ... deferred to the first
`chaos:propose`") as an open question and settled it at `400` by extending the endpoint's local
validation convention. That answer is correct but the framing was under-informed: the question
was **already answered** by an accepted decision —
`docs/decision-log/2026-07-19-task-filter-validation.md`, status Accepted, which mandates `400`
on unrecognized values, case-insensitive parsing, and an `Enum.IsDefined` guard so that
numeric-out-of-range input (`?status=99`) cannot bypass validation. `.chaos/architecture.md` is
simply stale on this point. The consequences are recorded rather than silently absorbed:
(i) the answer direction is unchanged and is now FACT-backed instead of convention-inferred;
(ii) that decision log records "Requires ADR: No", independently confirming `adr 0`;
(iii) the `Enum.IsDefined` guard is a **mandated** implementation constraint, not merely the
mitigation for RK-2 that the frame record inferred, and C-004's coverage must evidence it;
(iv) RUN-DEC-001 need only have folded one question, and that avoidable second fold is what
tripped M4 decision-density and raised `openspec` from 0 to 1 — recorded here as a measured
cost of asking a question the repository had already answered outside the scoped read set.
