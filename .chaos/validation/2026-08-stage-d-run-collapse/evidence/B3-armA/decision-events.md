# Decision Events — enforce-title-max-length

Append-only ledger (`change-template.md` §2). `TRG-*` headings are trigger events, not decision
entries, and never count toward the decision total.

## PROP-DEC-001 — Approve the frame: bound task titles at 200 characters in endpoint validation, on a zero-trigger classification?

- status: ANSWERED (resolved-in-arm — no live human; Stage-D mechanized run, 2026-08-03) · RESOLVED-IN-ARM
- approves-change: true
- options: A approve as classified — contract of record in `change.md`, no OpenSpec, no ADR, no verify pass · B approve but demand extra rigor (delta spec / ADR / verify) above the fired vector · C reject the frame
- recommendation: A — K1 fired zero triggers at HIGH confidence; the contract is fully pinned by the intent and the surface is one endpoint validation block
- answer: A — approved as classified. Maintainer rationale (resolved-in-arm): the bound is a request-validation convenience on an endpoint that already validates `Title`; it touches no non-goal (no persistence, no auth, no scale-out), adds no dependency, registers and removes no route, and leaves `TaskStore`/`TaskItem` untouched, so R-004/R-005 are not in play. Every contract statement is directly testable through the existing `WebApplicationFactory` integration suite, which is the cheapest possible evidence; buying a delta spec, an ADR or a verify pass here would price ceremony the classifier deliberately did not demand (Stage-C C-10/C-11, §9). 200 is taken verbatim from the intent, not chosen by the agent.
- why-material: it is the frame approval — the human sees intent, contract and rigor vector before the agent writes code (C-11 floor stop).
- folds: 1 — frame approval (intent + contract + zero-trigger classification vector)
- sync-action: NONE
- knowledge: FACT · confidence: HIGH
