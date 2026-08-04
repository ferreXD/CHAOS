# Decision Events — enforce-title-max-length

> Append-only ledger. Decision entries are hand-authored; `TRG-*` trigger events are appended
> mechanically by `chaos-scan`. A state change edits the `status:` line only.

## RUN-DEC-001 — Approve the framed change: enforce a 200-character maximum task title as endpoint request validation?

- status: RESOLVED-IN-ARM (resolved-in-arm (no live human; lever-run mechanized run), 2026-08-04) · run: RUN-2026-08-04-chaos-run-enforce-title-max-length
- approves-change: true
- options: A approve as framed — endpoint-level 200-char bound on POST /tasks and PUT /tasks/{id}, 400 on violation, blank-title behaviour preserved, contract C-001..C-006 · B approve but move enforcement into the domain (TaskItem/TaskStore) so every write path is bounded · C stop / defer — the bound needs a product owner before any code is written
- recommendation: A — the task contract fixes the bound (200) and the rejection code (400), the K1 classification fired zero triggers, and endpoint-level validation is exactly where the recorded posture puts request validation ("Validation today is minimal: `Title` required on create/update → `400`") and where the boundary model keeps new behaviour ("new behaviour belongs at the endpoint/query boundary, not in the store's public shape").
- answer: A
- why-material: It is the run's unconditional frame approval (C-11): it approves the intent, the zero-trigger classification vector (stops 1 · evidence.targeted 0 · evidence.breadth 0 · review 0 · verify 0 · openspec 0 · adr 0), the contract of record in `change.md` §Contract, and the declared scope. Option B would be an architecture-posture move (domain gains a validation responsibility) and would need its own ADR-bearing decision.
- folds: 1 — frame approval (intent + zero-trigger classification + contract C-001..C-006 + declared scope)
- sync-action: NONE
- knowledge: FACT · confidence: HIGH

Resolution rationale (maintainer-style, recorded because no live human is available in this
measurement run): approve as framed. The bound (200) and the status code (400) are given by the
requesting contract, not chosen here, so nothing about them is open. Enforcement belongs at the
endpoint because R-004 forbids the domain depending on the HTTP layer and the architecture's
boundary posture explicitly keeps new behaviour out of the store's public shape absent a
decision; option B would therefore require an architecture decision and an ADR, which this
request-validation convenience does not warrant. Option C is refused: the request is
unambiguous and the repository already answers every question it raises.
