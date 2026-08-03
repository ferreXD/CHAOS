# Decision events — filter-tasks-by-status

Append-only ledger (`change-template.md` §2). `TRG-*` entries are trigger events, not decisions.

## PROP-DEC-001 — Approve the `GET /tasks?status=` filter contract as framed (case-insensitive match, 400 on unrecognised value)?

- status: RESOLVED-IN-ARM (resolved-in-arm (no live human; Stage-C step-5 mechanized run), 2026-08-03)
- approves-change: true
- options: A approve as framed — case-insensitive `?status=` over the three `TaskState` names, no parameter = all tasks, unrecognised value = 400 with no list · B approve but answer `.chaos/context.md` OQ-002 differently — ignore an unrecognised value and return all tasks · C reject / re-frame
- recommendation: A — the requested contract is explicit, matches the architecture's named extension point (`GET /tasks` query filtering) and gives an unrecognised value a loud, testable failure instead of a silent full list
- answer: A
- why-material: this single approval carries the change's only open contract questions — the architecture's OQ-002 (invalid-filter-value behaviour, deferred to the first `chaos:propose`) and the case-sensitivity of the match. Both shape the public HTTP contract and both are answered here: 400 Bad Request, case-insensitive.
- sync-action: NONE
- knowledge: FACT · confidence: HIGH

<!-- Documented deviation: no live human was available in this measurement run. The entry was
     recorded and resolved with a maintainer-style rationale per the Stage-C step-5 mechanized-run
     protocol; answering this entry IS the approval (C-11 floor stop). -->
