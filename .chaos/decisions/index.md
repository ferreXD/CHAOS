# Decisions — Task Tracker API

One line per recorded decision, newest first. Each entry points at the record; the record
carries the full context, the options, what was chosen, and what shipped. A `chaos:run`
stop reads this index to catch a change that would contradict something already decided.

| Date | Decision | Record |
|---|---|---|
| 2026-08-01 | `/tasks` requires a JWT bearer token; TLS terminated by the app, no forwarded headers; dev-only token issuance behind two independent gates | [ADR — API authentication posture](../../docs/adr/2026-08-01-api-authentication-posture.md) |
| 2026-07-19 | An unrecognized `status`/`priority` filter value returns **400** — unknown names *and* numeric out-of-range; values parse case-insensitively | [task filter validation](2026-07-19-task-filter-validation.md) |

## Reading these

- **Accepted postures live in two places.** Broad, long-lived ones become ADRs under
  [`docs/adr/`](../../docs/adr/); change-scoped ones stay here as decision records. Both are
  crossing sources: contradicting either one has to be surfaced at a stop, not decided
  quietly in code.
- **The 2026-07-19 entry predates the lean core.** It was produced by the retired
  multi-command lifecycle (its "provenance trail" names commands that no longer exist) and
  was moved here from `docs/decision-log/` when the demo was aligned to the plugin era.
- **That entry is recorded but not yet implemented.** `GET /tasks` still returns
  everything: the demo tree was reset to before the filter work so the exercise stays
  available. The decision stands — which is the point of the walkthrough. When you run
  `chaos:run "add filters"`, a correct stop should *cite* this record instead of re-asking
  what an invalid value does. A stop that re-asks it, or that quietly ships a different
  answer, is the failure this repository exists to make visible.
