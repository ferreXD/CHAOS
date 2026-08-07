# add-task-query-filters — optional `?status=` / `?priority=` filters on `GET /tasks`

- **Date:** 2026-08-07
- **Command:** `chaos:run` (paused at the stop, continued via `chaos:resume --latest`)
- **Run:** `RUN-2026-08-07-chaos-run-add-task-query-filters-9c102c`
- **Change:** `add-task-query-filters`

## Intent (verbatim)

> "add optional ?status= and ?priority= filters to GET /tasks"

## Size

| | Files | LOC |
|---|---:|---:|
| Estimated at the stop | 3 | ~130 |
| Actual — raw lines added | 3 | **~300** |
| Actual — non-comment, non-blank | 3 | **158** |

Breakdown: `TaskEndpoints.cs` +77/−5 (28 non-comment), `TaskFilterTests.cs` +213 new
(130 non-comment), `.chaos/context.md` ~10 amended.

**Spec gate: OPTIONAL at the stop — and the actuals are genuinely ambiguous.** The gate is
`files ≥ 5` or `loc ≥ 250` or any crossing. Files stayed at 3 and there were no crossings, so
the file and crossing arms are clear. The LOC arm is not:

- counting **raw added lines (~300)** → the gate **would have flipped to OWED**;
- counting **non-comment code (158)** → the gate **stays OPTIONAL**.

`.chaos/config.yaml` does not define which reading `specGate.loc` means. **This is a real gap in
the gate definition, recorded rather than resolved** — picking a reading here would be exactly
the silent resolution the loop exists to prevent. The estimate was low regardless: the driver
was documentation density (the test file is ~40% XML-doc and explanatory comments, and the
`TryParseFilter` remark block is long because two non-obvious `Enum` behaviours needed
justifying), not extra capability. Nothing shipped beyond the approved plan.

Follow-up **FU-1** below proposes settling the LOC definition.

## Stop

**Decision:** `DEC-2026-08-07-add-task-query-filters-add-status-priority-filt-5cf3` — one
decision, **folds: 3**. Answered `approve-as-planned` by `vscode-user` via the VS Code Decision
Center at 2026-08-07T13:55:53Z, no rationale text supplied.

### Questions asked, and the answers chosen

| # | Question | Answer |
|---|---|---|
| 1 | Both filters supplied — combine with AND or OR? | **AND** |
| 2 | Comma-separated lists, or exactly one value per filter? | **Exactly one value** |
| 3 | Blank value (`?status=`) — 400, or treat as absent? | **400** |

### Not asked, because the repository already answered it

- **What should an invalid filter value do?** — `.chaos/decisions/index.md` carries the
  2026-07-19 task-filter-validation decision: unrecognized `status`/`priority` → **400**, for
  unknown names *and* numeric out-of-range, with case-insensitive parsing. Followed and cited,
  not re-asked.
  **Caveat carried openly into the stop:** the record *file*
  (`.chaos/decisions/2026-07-19-task-filter-validation.md`) is absent from this workspace — the
  cold-start `chaos:init` earlier the same day did not restore it (OQ-004). The decision text
  survives in the index, and the index is what this run followed. If the index has drifted from
  the original record, this change inherits that drift.
- **Where does the filtering live?** — endpoint layer, over `store.All()`, `TaskStore` untouched
  (`.chaos/architecture.md`, module and boundary model).
- **Error body shape?** — `{ error = "..." }`, the convention already used by `POST`/`PUT`.
- **Does the route need auth / rate limiting wired?** — no; it stays inside `MapGroup("/tasks")`
  and inherits both. Registering a `/tasks` route outside that group would itself be a crossing.

### Crossings

**None.** `.chaos/architecture.md` prescribes this exact shape, the route never left its group,
and the enum-names-on-the-wire contract is unchanged. Adding *optional* parameters is backward
compatible: a caller sending neither sees precisely what it saw before, which
`No_filters_returns_everything_unchanged` pins down.

No ADR was crossed, so no ADR was amended. `.chaos/context.md` was amended — not because it was
crossed, but because shipping made two of its statements false (see below).

## Shipped

| File | Action |
|---|---|
| `src/TaskTracker.Api/Endpoints/TaskEndpoints.cs` | modified — `?status=` / `?priority=` filtering, `TryParseFilter<T>`, `InvalidFilterMessage<T>` |
| `tests/TaskTracker.Tests/TaskFilterTests.cs` | new — 22 cases across 15 facts/theories |
| `.chaos/context.md` | amended — route-table row and the "known open gap" paragraph, both made false by this change |
| `.chaos/decisions/index.md` | one line added |

### Behaviour delivered

- `?status=` / `?priority=` each accept **exactly one** value, parsed **case-insensitively**.
- Both supplied → **AND**.
- Neither supplied → unfiltered, identical to previous behaviour.
- **400** for: unknown name, numeric out-of-range, comma-separated list, blank/whitespace value.
- A filter matching nothing → **200** with an empty list, not 404.
- Anonymous callers still get **401** — the filters did not escape the authorized group.

### Two implementation details worth keeping

Both are `Enum` behaviours that would have shipped a silent bug if taken at face value:

1. **`Enum.TryParse` accepts numeric strings.** `?status=7` parses into an undefined `TaskState`
   and would have matched nothing while returning `200`. `Enum.IsDefined` is what turns it into
   the 400 the 2026-07-19 decision requires. **Corollary, asserted deliberately:** an *in-range*
   numeric like `?status=1` is **accepted**, because that decision scopes rejection to
   out-of-range values. `In_range_numeric_value_is_accepted` pins this so it stays intentional.
2. **`Enum.TryParse` accepts comma-separated lists even without `[Flags]`.** `"Open,Done"` would
   bitwise-OR into `Done` (`0 | 2`) and return the wrong set with a `200`. Since the approved
   contract is exactly one value, a comma is rejected outright rather than reinterpreted. Without
   this guard, answer #2 would have been silently violated while appearing to work.

## Checks

Real output, run in this session on the final tree:

```text
dotnet build TaskTracker.sln --nologo
  Compilación correcta.
      0 Advertencia(s)
      0 Errores
```

```text
dotnet test TaskTracker.sln --nologo
  Correctas! - Con error: 0, Superado: 56, Omitido: 0, Total: 56, Duración: 480 ms
```

Baseline was **34/34** before this change; it is **56/56** after. The 22 added cases are the
delta, and no pre-existing test changed or regressed.

### Verification limits

Recorded as limits, not as passes:

- **The API was never run as a live process.** Verification is integration tests through
  `WebApplicationFactory`, which boots the real middleware pipeline in-memory. Real-socket
  behaviour — TLS redirection, HSTS, proxy interaction — was not exercised. Reason: no deployment
  target exists in this repository (OQ-001), so there is nothing to run it against.
- **Query-string binding was verified only through `HttpClient`.** How another client encodes
  edge cases (a repeated `?status=A&status=B`, or `?status` with no `=` at all) was not tested.
  Reason: not part of the approved scope. Repeated parameters currently bind to the first value
  by ASP.NET default and are not explicitly specified — see **FU-2**.
- **No load, concurrency, or rate-limit interaction testing** for the filtered path. Reason: out
  of scope; the test factory raises the permit limit to 1000 precisely so limiting does not
  interfere.
- **`.chaos/context.md` carries pre-existing MD060 markdownlint warnings** on its table separator
  rows. They predate this change, were not introduced by it, and were left alone.

## Delegated

**None.** The whole change was implemented in the current session; no subagent was involved, so
there is no delegated work requiring an independent second-context check.

## Deviations and follow-ups

**Deviations from the approved plan: none in capability.** Everything approved shipped, and
nothing beyond it did. The only deviation is volume — the estimate of ~130 LOC was low against
~300 raw lines added, discussed under **Size**.

| ID | Follow-up | Why it is not in this change |
|---|---|---|
| **FU-1** | Define what `specGate.loc` counts — raw added lines or non-comment code — in `.chaos/config.yaml` | This change surfaced the ambiguity; resolving it is a config decision for the repository owner, not something to settle mid-run |
| **FU-2** | Decide the contract for a repeated parameter (`?status=A&status=B`) | Currently unspecified; ASP.NET binds the first value. Arguably it should be a 400 under the "exactly one value" answer, but that was not asked and will not be assumed |
| **FU-3** | Update `docs/demo/README.md`, which still describes these filters as unimplemented and points at the absent 2026-07-19 record | Outside this change's approved scope; it is narrative documentation, and how to rewrite the walkthrough now that the exercise is done is the owner's call |
| **FU-4** | Restore the 2026-07-19 decision record (OQ-004) | `git checkout -- .chaos/decisions/2026-07-19-task-filter-validation.md`; carried over from the cold-start init, not created here |

## Confidence

`verdict: shipped as approved` · `confidence: HIGH` · `evidence_coverage: COMPLETE` for
in-process behaviour and `WEAK` for live-process behaviour (see verification limits) ·
`assumption_load: LOW`.

The one assumption of consequence is that `.chaos/decisions/index.md` faithfully reproduces the
absent 2026-07-19 record. `[ASSUMPTION / MEDIUM]` — it is the only surviving statement of that
decision in the workspace, and this change is built on it.
