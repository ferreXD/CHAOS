# Decision Events — enforce-title-max-length

> Append-only ledger. Decision entries are hand-appended; `TRG-*` trigger events are appended
> mechanically by `chaos-scan`. A state change edits the `status:` line only.

## RUN-DEC-001 — Approve the framed change: enforce a 200-character maximum task title at the endpoint boundary, at the classified rigor (openspec 0, no ADR, verify 0)?

- status: RESOLVED-IN-ARM
- approves-change: true
- options: A Approve the frame as classified — implement the 200-character bound in `Endpoints/TaskEndpoints.cs` for POST and PUT, contract of record in `change.md` §Contract, no OpenSpec artifact · B Approve the intent but raise rigor — author an OpenSpec delta spec for the validation contract before implementing · C Approve the intent but relocate the bound into the domain layer (`Domain/TaskItem.cs` / `TaskStore`) rather than the endpoint · D Stop / defer — do not proceed
- recommendation: A — the K1 scan and my adjudication pass both fired zero triggers, and `.chaos/architecture.md` §Module/boundary model already assigns "validation of `Title`" to `Endpoints/TaskEndpoints.cs`, so the classified depth matches the recorded posture.
- answer: A
- why-material: This is the one unconditional frame-approval stop (C-11): it approves the intent, the classification vector and the contract artifact together, and it fixes where the bound lives — endpoint versus domain — which is a boundary question R-004 and the architecture posture both speak to.
- folds: 1 — approve intent + classification vector + contract of record (`change.md` §Contract at openspec 0)
- sync-action: NONE
- knowledge: FACT · confidence: HIGH
- resolution-note: resolved-in-arm (no live human; lever-run mechanized run). Maintainer-style rationale for A: the change is a rejection-only bound on a single already-validated request field. Option B buys nothing the rendered §Contract does not already pin — the classifier owes `openspec 0` and the five contract statements are individually testable. Option C is actively wrong here: `.chaos/architecture.md` records "Endpoints | `Endpoints/TaskEndpoints.cs` | HTTP surface: CRUD under `/tasks`; validation of `Title`" as `[FACT]`, and pushing a request-shape constraint into `Domain/**` would put HTTP request-validation semantics into the layer R-004 keeps free of the HTTP layer, for no benefit while the store has no other writer. Option D has no basis — the contract is unambiguous and the baseline is green.

## TRG-001 — trigger fired: X2 self-review-fail

- status: RECORDED (2026-08-04)
- trigger: X2 · by: scan · surface: none
- cite: self-review verdict 'PASS' != clean
- dimensions-after: stops 1 · evidence.targeted 0 · evidence.breadth 0 · review 2 · verify 1 · openspec 0 · adr 0
