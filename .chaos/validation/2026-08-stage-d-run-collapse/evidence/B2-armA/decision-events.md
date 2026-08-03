# Decision events — filter-tasks-by-status

Append-only ledger (`change-template.md` §2). `TRG-*` entries are trigger events, not decisions.

## RUN-DEC-001 — Approve the frame: intent, K1 classification and the contract as stated?

- status: ANSWERED (resolved-in-arm, 2026-08-03) · RESOLVED-IN-ARM
- approves-change: true
- options: A Approve as framed · B Approve with a changed contract · C Reject / re-frame
- recommendation: A — the intent is the extension point `.chaos/architecture.md` §API strategy already names, the classification fired zero triggers, and all six contract statements are testable against the existing integration harness.
- answer: A Approve as framed — rationale: "The change sits exactly on the sanctioned extension point and at the sanctioned layer: filtering at the endpoint/query boundary, the store's public shape untouched. 400-on-unrecognised-status is the right resolution of OQ-002 — a mistyped filter must not silently look like an empty result set. No preset floor is warranted; the zero-trigger vector is the correct rigor for a query-shaping convenience with no auth, persistence or dependency surface." resolved-in-arm (no live human; Stage-D mechanized run)
- why-material: One stop, one approval — it covers the intent, the rigor vector the run will execute under (stops 1 · evidence.targeted 0 · evidence.breadth 0 · review 0 · verify 0 · openspec 0 · adr 0), and the API contract of record, including the 400-on-unrecognised-status behaviour that `.chaos/architecture.md` leaves open as OQ-002.
- folds: 1 — frame approval (intent + K1 vector + contract C-001..C-006, incl. the OQ-002 invalid-filter-value ratification)
- sync-action: NONE
- knowledge: FACT · confidence: HIGH
