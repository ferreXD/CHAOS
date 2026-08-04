---
chaosMetadata:
  schemaVersion: 1
  artifactType: decision-events
  artifactScope: change
  changeId: filter-tasks-by-priority
  sourceCommand: unknown
  lastWrittenAt: "2026-08-04T14:48:50+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-04T14:48:50+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: demo/dotnet
    reviewRequest: null
    contextSource: session-context
    confidence: HIGH
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: LOW
    bodyHash: "sha256:203a3e2cabf41e7ed392b87f4add6f724d81e5f302bff45ac9d2249b10ff06b0"
---

# Decision Events — filter-tasks-by-priority

> Append-only ledger. Entries are never rewritten; a state change edits the `status:` line only.

## RUN-DEC-001 — Approve the frame, and settle how a `?priority=` value is matched (case + empty)

- status: ANSWERED (vscode-user, 2026-08-04) · CONSUMED
- approves-change: true
- options: A case-insensitive match; a present-but-empty `?priority=` is a 400 · B exact case-sensitive match (`High` only, `high` is a 400); empty is a 400 · C case-insensitive match; a present-but-empty `?priority=` is treated as omitted and returns everything
- recommendation: A — it matches the precedent already in the app (`JsonStringEnumConverter` accepts `{"priority": "high"}` on POST today), so the same string does not mean two different things on two routes; and an empty value is a caller mistake, which the intent's own rule ("an unrecognised value is a 400") already covers.
- answer: A — case-insensitive match; a present-but-empty `?priority=` is a 400. (Frame approved: intent, K1 verdict and the seven-statement contract stand as authored.)
- why-material: It is the accept/reject boundary of a public API contract — it decides whether real callers get 200 or 400 — and the repository does not answer it. Context OQ-002 flags invalid-filter-value behaviour as architecture-relevant; the intent settled the `400`-vs-ignore half, this settles the remainder.
- folds: 2 — frame approval (verbatim intent + K1 classification verdict + the seven-statement contract) · `?priority=` value-matching boundary (case sensitivity and the present-but-empty value)
- sync-action: NONE — the answer pins C-004/C-005 in this change's contract; it promotes no rule and amends no ADR. If a later `?status=` filter lands, `chaos:sync` may lift the matching convention into a rule then.
- knowledge: INFERENCE · confidence: HIGH

## TRG-001 — trigger fired: M4 decision-density

- status: RECORDED (2026-08-04)
- trigger: M4 · by: scan · surface: process
- cite: ledger scan rule: 2 material question(s) across 1 entry >= threshold 2
- dimensions-after: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 0 · openspec 1 · adr 0

## TRG-002 — trigger fired: M5 scope-spill

- status: RECORDED (2026-08-04)
- trigger: M5 · by: scan · surface: none
- cite: diff touches src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/TaskEndpointsTests.cs, not in the approved scope
- dimensions-after: stops 2 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 0 · openspec 1 · adr 0

## RUN-DEC-002 — M5 scope-spill fired on the delivered diff: confirm the scope, or re-scope

- status: ANSWERED (vscode-user, 2026-08-04) · CONSUMED
- options: A confirm — the scope is unchanged; M5 is a false fire from the K1 scope string's prose form, re-baseline it · B the scope really did change — stop and re-frame before going further
- recommendation: A — the diff is exactly the two files framed at S1 (`src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` 35+/5-, `tests/TaskTracker.Tests/TaskEndpointsTests.cs` 109+/0-). No third file is touched; `Domain/TaskStore.cs` and `Domain/TaskItem.cs` are byte-unchanged, as C-006 requires. The K1 scope was supplied as a prose sentence with parenthetical annotations, which the scan's path matcher does not read as a path list — the skill flags this exact false-fire shape.
- answer: A — confirmed: the delivered diff is exactly the scope approved at S1. Scope string re-baselined to a plain path list via `scan.py update-scope --decision RUN-DEC-002`.
- why-material: M5 is the guard against a change quietly growing past what was approved. Re-baselining a scope-spill firing without a human confirming it would defeat the guard, even when the cause looks clerical. The trigger stays fired either way — the classifier is monotone; this decision records whether the delivered diff is the approved one.
- folds: 1 — M5 scope-spill confirmation on the work-unit-1 diff
- sync-action: NONE — on answer A nothing is promoted; the scope baseline is corrected via `scan.py update-scope --decision RUN-DEC-002`. Worth a todo candidate that the K1 scope argument should be given as a plain path list to avoid re-firing this.
- knowledge: FACT · confidence: HIGH
