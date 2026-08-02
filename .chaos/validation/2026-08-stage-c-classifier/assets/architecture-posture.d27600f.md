# Frozen posture — Task Tracker API @ `demo/dotnet` `d27600f`

> Verbatim excerpts of `.chaos/architecture.md` as of the frozen kit base commit `d27600f`.
> This is the posture ALL demo-band seeds classify against. Do NOT update it to the branch tip:
> the tip (post `secure-task-api`, 2026-08-01) removed authentication from the non-goals, which
> would silently invalidate every M1 auth-crossing expectation. Extracted 2026-08-02 via
> `git show d27600f:.chaos/architecture.md`.

## Module / boundary model (excerpt)

Boundary posture `[INFERENCE · MEDIUM]`: endpoints depend on domain (`TaskStore`) and
contracts; domain has no dependency on the HTTP layer. Keep that direction — new
behaviour (e.g. filtering) belongs at the endpoint/query boundary, not in the store's
public shape, unless a decision says otherwise.

## Runtime / deployment model (excerpt)

Process-lifetime, single-instance. In-memory `ConcurrentDictionary<Guid, TaskItem>`
registered as a **singleton**, seeded at construction. State is **not durable** across
restarts. `[FACT]`. No production hosting defined. `[UNKNOWN]`.

## Data access posture (excerpt)

No database. The store is the single source of truth in memory. `All()` returns tasks in
creation order; `Update` replaces via `record with { … }`. Thread-safe for the demo via
`ConcurrentDictionary`. `[FACT]`. Introducing persistence would be a **`--strict`**,
decision-bearing change (not in current scope).

## API strategy (excerpt)

REST-ish CRUD over JSON. Enums serialized as names via `JsonStringEnumConverter`.
Validation today is minimal: `Title` required on create/update → `400`. `[FACT]`.
The known extension point is `GET /tasks` query filtering (`?status=`, `?priority=`,
combined with AND). `[FACT]` — endpoint remark + demo README.

## Authentication / authorization posture (excerpt)

None. The API is open. `[FACT]`. Any auth is out of scope and would be strict,
decision-bearing work. `[UNKNOWN]` for future intent.

## Side-effect / integration strategy (excerpt)

No external integrations. All effects are in-process against the in-memory store. `[FACT]`.

## Non-goals (verbatim, complete)

- Persistence / durability across restarts.
- Authentication / authorization / multi-tenant concerns.
- Horizontal scale-out (singleton in-memory store is single-instance by design).
