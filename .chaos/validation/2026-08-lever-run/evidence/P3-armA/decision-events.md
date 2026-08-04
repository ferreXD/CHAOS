## TRG-001 — trigger fired: M2 sensitive-surface

- status: RECORDED (2026-08-04) · run: RUN-2026-08-04-occ-a1
- trigger: M2 · by: scan · surface: data-store
- cite: persistence class: predicted scope includes src/TaskTracker.Api/Domain/TaskItem.cs
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 0 · adr 0

## TRG-002 — trigger fired: M1 posture-crossing

- status: RECORDED (2026-08-04)
- trigger: M1 · by: adjudication · surface: data-store
- cite: intent 'Add an integer version to the task ... Every successful PUT /tasks/{id} increments the task's version by 1 ... the update must be rejected with HTTP 409 Conflict and the task must be left unchanged' x posture 'Module / boundary model' -> 'Keep that direction - new behaviour (e.g. filtering) belongs at the endpoint/query boundary, not in the store's public shape, unless a decision says otherwise'
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 2

## RUN-DEC-001 — Approve the framed change, its classification, and the store-shape posture crossing it requires?

- status: RESOLVED-IN-ARM
- approves-change: true
- options: A approve the change as framed, authorizing the version state and the compare-and-swap to live in the domain store per the ADR · B approve the intent but require an endpoint-boundary implementation that leaves TaskStore's public shape untouched · C defer — do not approve; the posture crossing needs a wider architecture discussion first
- recommendation: A — an endpoint-side check-then-write cannot be made atomic against the shared singleton store, so option B would ship the lost-update race the change exists to remove.
- answer: A
- why-material: The change alters the persisted domain record's public shape and the semantics of an existing mutating endpoint, crossing an explicit (if hedged) boundary-posture line; approving it is what authorizes the crossing and fixes the owed artifact depth.
- folds: 4 — approve intent + contract C-001..C-013 as framed · authorize the M1 posture crossing: `version` state and the atomic compare-and-swap live in `TaskStore`/`TaskItem` rather than at the endpoint boundary (ADR 2026-08-04-optimistic-concurrency-in-the-store) · accept the M2 data-store change to update semantics: a stale `expectedVersion` yields 409 and the store leaves the task entirely unmutated, while an omitted `expectedVersion` keeps today's unconditional last-writer-wins behaviour · accept the classified OpenSpec depth 1 (delta spec only; no proposal/design/tasks, so `openspec status` reads isComplete: false by design)
- sync-action: CREATE_ADR — the ADR is authored at the firing under `.chaos/changes/optimistic-concurrency-updates/adr/`; promote to `docs/adr/` via `chaos:sync` if this posture change is adopted repo-wide.
- knowledge: FACT · confidence: HIGH
- resolution-rationale: resolved-in-arm (no live human; lever-run mechanized run). Maintainer-style rationale for A: (1) Correctness dominates the posture preference here. The boundary line is explicitly hedged — `[INFERENCE · MEDIUM]` and "unless a decision says otherwise" — and it was written with presentation concerns like filtering in mind, where keeping the store dumb genuinely is the better design. Optimistic concurrency is not a presentation concern: the compare-and-swap must be atomic with the write, and the only layer that can guarantee that against the singleton `ConcurrentDictionary` is the store itself. Option B honours the letter of the posture and breaks the feature. (2) The crossing is bounded and reversible: one component on `TaskItem`, one optional parameter plus a richer outcome on `TaskStore.Update`, no new dependency, no durability, no auth. The persistence non-goal is untouched — the counter is in-memory process-lifetime state like everything else in the store. (3) R-004 is preserved, which is the rule that actually protects the boundary: the domain gains no ASP.NET reference, and the HTTP status mapping stays in the endpoint. R-005 is untouched. (4) Option C buys nothing: the discussion it defers to is exactly the argument recorded in the ADR, and the alternatives (ETag/`If-Match`, a concurrency-token value object) are documented there for a future change rather than lost. (5) Depth 1 is the right OpenSpec obligation for a change of this blast radius — the delta spec pins the observable contract, which is what a reviewer needs; a proposal and task list would be ceremony over a contract the task already specifies exactly.

## TRG-003 — trigger fired: M4 decision-density

- status: RECORDED (2026-08-04)
- trigger: M4 · by: scan · surface: process
- cite: ledger scan rule: 4 material question(s) across 1 entry >= threshold 2
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 1 · openspec 1 · adr 2

## TRG-004 — trigger fired: X2 self-review-fail

- status: RECORDED (2026-08-04) · run: RUN-2026-08-04-occ-a1
- trigger: X2 · by: scan · surface: none
- cite: self-review verdict 'PASS — scope confined to the 5 declared subject files with no unrelated CRUD behaviour touched; R-003 green (14/14 tests, build 0 warnings/0 errors), R-004 verified (Domain has no Microsoft.AspNetCore/IResult/Results/HttpContext reference), R-005 verified (no TaskStatus reintroduction), R-006 verified (no protected file in the diff); contract statements C-001..C-013 all mapped to test or code evidence, including a 10-writer contention test for the atomicity statement C-010; RUN-DEC-001 resolved, ADR and OpenSpec delta authored at the firing and strictly validated.' != clean
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 2 · verify 1 · openspec 1 · adr 2
