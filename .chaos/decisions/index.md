# Decisions — Task Tracker API

One line per recorded decision, newest first. Each entry points at the record; the record
carries the full context, the options weighed, what was chosen, and what shipped. A
`chaos:run` pre-code stop reads this index to catch a change that would contradict something
already decided — that is what makes the record worth writing.

This index does **not** duplicate the records. Read the source for detail.

| Date | Decision area | Posture | Source | Source status |
|---|---|---|---|---|
| 2026-08-07 | `GET /tasks` filters: `?status=`/`?priority=` combine with **AND**, exactly one value each, blank → **400** | **accepted** | [add-task-query-filters](2026-08-07-add-task-query-filters.md) | verified |
| 2026-08-07 | CHAOS workspace bootstrap (cold-start regeneration) | **accepted** | [bootstrap report](../bootstrap-report.md) | verified |
| 2026-08-01 | API authentication, transport, and edge hardening | **accepted** | [ADR — API authentication posture](../../docs/adr/2026-08-01-api-authentication-posture.md) | verified |
| 2026-07-19 | An unrecognized `status`/`priority` filter value returns **400**; values parse case-insensitively | **accepted** | [task filter validation](2026-07-19-task-filter-validation.md) | verified — restored 2026-08-07 |

## 2026-08-01 — API authentication posture

**Source status:** `Accepted` (verified — the file was read during `chaos:init` on 2026-08-07).

**Selected posture.** JWT bearer with a self-issued signing key on every `/tasks` route;
`GET /` anonymous. App-terminated TLS with forwarded-headers middleware deliberately
unregistered. Edge hardening — rate limiting, CORS allow-list, response headers, body-size cap
— shipped with authentication rather than after it. Rate limiting registered **before**
authentication. Development-only token issuance behind two independent registration-time gates.

**Operational consequences.**

- Every `/tasks` call needs a bearer token; this was a deliberate **BREAKING** change.
- The app **cannot start** without `Auth:Issuer`, `Auth:Audience`, and `Auth:SigningKey`.
  Local development and CI must supply them, from outside the repository.
- Rate-limit state is in-memory and per-instance — it does not survive restart or scale-out.
- Expired means expired: `ClockSkew` is zero.
- Repointing at an external IdP is a configuration change at the `AddJwtBearer` seam, not an
  endpoint rewrite.

**Accepted risks** (carried by the ADR, not re-litigated here): RK-8, the gated dev-token
endpoint, accepted by the human against the review's recommendation; RK-4, any valid token may
act on any task; RK-5, production has no token issuer.

**Open questions.** OQ-001 deployment target and who terminates TLS in a real environment;
OQ-002 the production token issuer; OQ-003 whether per-caller authorization is coming.

**Conflicts.** This ADR superseded statements in `.chaos/architecture.md` and `.chaos/context.md`
that described the pre-change, open API. Both documents were regenerated against the ADR during
`chaos:init` on 2026-08-07, so the reconciliation the ADR asked for is complete.
`[CONFLICT / resolved / HIGH]`

## 2026-08-07 — CHAOS workspace bootstrap

**Source status:** verified — [`bootstrap-report.md`](../bootstrap-report.md).

**Selected posture.** The workspace was regenerated cold from repository evidence rather than
restored from `HEAD`, at the repository owner's explicit direction. Consequence worth knowing
before the next change: this index starts from the ADR only — see below.

## 2026-08-07 — `GET /tasks` query filters

**Source status:** verified — [add-task-query-filters](2026-08-07-add-task-query-filters.md).

**Selected posture.** `?status=` and `?priority=` are optional, parse case-insensitively, take
**exactly one value each**, and combine with **AND**. Unrecognized values return **400** —
unknown name, numeric out-of-range, comma-separated list, or blank. Sending neither parameter
returns everything, so the change is backward compatible. Filtering lives in the endpoint layer;
`TaskStore` was not touched.

**Operational consequences.** An *in-range* numeric (`?status=1`) is **accepted**, because the
2026-07-19 rule scopes rejection to out-of-range values — asserted by a test so it stays
deliberate. Two `Enum.TryParse` behaviours are guarded against explicitly (numeric strings, and
comma-lists on non-`[Flags]` enums); removing either guard reintroduces a silent wrong-result bug
rather than a visible failure.

**Open questions.** The contract for a repeated parameter (`?status=A&status=B`) is unspecified
(FU-2), and `specGate.loc` does not define whether it counts raw lines or non-comment code (FU-1).

## 2026-07-19 — invalid filter values return 400

**Source status:** `Accepted` — [task filter validation](2026-07-19-task-filter-validation.md).

**Selected posture.** An unrecognized `status`/`priority` filter value returns **400 Bad
Request** — unknown names (`?status=banana`) *and* numeric out-of-range (`?status=99`) — and
filter values parse **case-insensitively**. Not a silent ignore, which returns unexpectedly
broad results, and not an empty list, which is indistinguishable from a filter that legitimately
matched nothing.

**Provenance, stated plainly.** This record predates the lean core: it was produced by the
retired multi-command lifecycle, so its "provenance trail" names commands (`chaos:propose`,
`chaos:sync`, …) that no longer exist. The decision it carries is unaffected.

**Restored 2026-08-07** (closing **OQ-004** / **FU-4**). The file had been dropped from the
working tree by that day's cold-start `chaos:init`; the 2026-08-07 filter change ran while it was
absent, following the summary in this index and
[recording that dependency openly](2026-08-07-add-task-query-filters.md#confidence). With the
original restored, that record's one assumption of consequence can now be checked directly — and
the two agree.

## Reading these

- **Accepted postures live in two places.** Broad, long-lived ones become ADRs under
  [`docs/adr/`](../../docs/adr/); change-scoped ones stay here as decision records. Both are
  crossing sources — contradicting either must be surfaced at a stop, not decided quietly in code.
- **`chaos:run` appends here.** Each governed change writes
  `.chaos/decisions/<date>-<slug>.md` and adds one row to the table above.
- **An entry being recorded does not mean it is implemented.** Where the two diverge, the
  record says so explicitly. A decision that is recorded but unimplemented still binds: it is
  the answer, and a later change must follow it or knowingly override it.
