# Decision Events — task-count

Append-only ledger for the `task-count` change (`chaos:run`, Stage D).
Entry shape: `chaos-shared/reference/change-template.md` §2. `TRG-*` headings are trigger
events, **not** decision entries under the §2 scan rule.

Prefix note: `chaos-run/SKILL.md` names Stage-D decision entries `RUN-DEC-*`, but `RUN` is not
in change-template §2's known-prefix list, and neither `tools/chaos-render` nor the record
`decisionRef` schema recognizes it — an entry written as `RUN-DEC-001` renders as **zero**
decisions and leaves `lifecycle.current.decisions` empty. This entry therefore uses `PROP-DEC-`,
the prefix of the stop it actually is (the FRAME approval stop, C-11 floor), which the whole
toolchain parses. Reported as a toolkit finding, not a silent choice.

## PROP-DEC-001 — Approve the framing of `task-count`: intent, K1 classification, and the contract as stated?

- status: ANSWERED (maintainer-proxy, 2026-08-03) · RESOLVED-IN-ARM — resolved-in-arm (no live human; Stage-D mechanized run)
- approves-change: true
- options: A approve the frame as classified (contract C-001..C-005, vector all-zero + the C-11 floor stop, no OpenSpec artifact owed) · B approve but demand an OpenSpec delta spec anyway · C reject / re-frame
- recommendation: A — the K1 scan and the adjudication pass both fired zero triggers; the contract is fully testable against the existing green baseline.
- answer: A
- why-material: This is the C-11 floor stop — the human sees the contract and the classified rigor before the agent writes any code.
- folds: 1 — frame approval (intent + K1 classification + contract). K1 fired no trigger, so no materiality question folded into this stop.
- sync-action: NONE
- knowledge: FACT · confidence: HIGH

**Resolution rationale (maintainer-style, recorded in-arm):** The intent is an additive,
read-only aggregate over the existing in-memory store. It crosses none of the architecture's
non-goals — it adds no persistence, no auth, and no scale-out assumption — and it respects the
boundary posture by reading the count at the endpoint/query boundary rather than widening
`TaskStore`'s public shape. The five contract statements are each directly testable through the
existing `WebApplicationFactory<Program>` integration harness. Under Stage-C C-10 a zero-trigger
change owes no OpenSpec artifact, so option B would buy paperwork with no contract surface to
describe that `change.md` §Contract does not already carry. Approve as classified (A).

## TRG-001 — trigger fired: M3 contract-surface

- status: RECORDED (2026-08-03) · run: RUN-2026-08-03-chaos-run-task-count-8b90fa
- trigger: M3 · by: scan · surface: contract-dependency
- cite: route delta: added ['GET /count'] (additive) — `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs`, K3 scan 1 (scanSeq 4)
- dimensions-after: stops 1 · evidence.targeted 0 · evidence.breadth 0 · review 0 · verify 1 · openspec 1 · adr 1
