# Decision Events — task-count

Append-only ledger for the `task-count` change (`chaos:run`, one continuous command).

## RUN-DEC-001 — Approve the framed change (intent, classification and contract) and proceed to implementation?

- status: RESOLVED-IN-ARM (maintainer-style resolution, 2026-08-04) · run: RUN-2026-08-04-chaos-run-task-count
- approves-change: true
- options: A approve as framed and implement the six contract statements · B approve only the endpoint shape (C-001) and defer the three count invariants to a later change · C stop / defer the change
- recommendation: A — the invariants are what make the endpoint trustworthy and cost nothing extra to test against the existing baseline.
- answer: A — approve as framed. Maintainer rationale: the contract of record is the six statements in `records/contract.json`; K1 fired zero triggers (scan + adjudication, scanSeq 2) so the vector owes nothing beyond this one approval stop and no OpenSpec artifact (depth 0); the work is an additive read-only route confined to `src/TaskTracker.Api/Endpoints` plus tests, explicitly disclaiming both posture non-goals it could brush against (auth, persistence model); splitting the invariants out (option B) would ship an aggregate endpoint whose agreement with `GET /tasks` is unproven, which is the only real risk here. Tagged resolved-in-arm (no live human; lever-run mechanized run).
- why-material: it is the run's one unconditional stop (C-11) — it approves intent, the classification vector, and the contract that every later coverage row is judged against.
- folds: 1 — frame approval (K1 fired no triggers, so no further questions attach to this stop)
- sync-action: NONE
- knowledge: FACT · confidence: HIGH

## TRG-001 — trigger fired: M3 contract-surface

- status: RECORDED (2026-08-04) · run: RUN-2026-08-04-chaos-run-task-count
- trigger: M3 · by: scan · surface: contract-dependency
- cite: route delta: added ['GET /count'] (additive)
- dimensions-after: stops 1 · evidence.targeted 0 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 1
