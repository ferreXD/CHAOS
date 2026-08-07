# Context — Task Tracker API

Project reality: what this is, who it serves, what constrains it, and what is deliberately
out of scope. Technical posture lives in [`architecture.md`](architecture.md); accepted
decisions live in [`docs/adr/`](../docs/adr/) and [`decisions/index.md`](decisions/index.md).

Every material statement below is labelled with its knowledge type and confidence, per the
doctrine in [`AGENTS.md`](../AGENTS.md).

## Project summary

`[FACT / HIGH]` **TaskTracker** is a single ASP.NET Core Minimal API targeting `net8.0`,
built as one solution (`TaskTracker.sln`) with two projects: `src/TaskTracker.Api` and
`tests/TaskTracker.Tests`. Ten C# files in total. It exposes CRUD over a task list held in
an in-process, in-memory store.

`[FACT / HIGH]` Its purpose is to be a **realistic subject for governed change**. Per
[`README.md`](../README.md), the app is deliberately small so that the interesting artifact
is the decision trail, not the code. The domain is fictional and contains no private data.

`[FACT / HIGH]` The CHAOS machinery is **not vendored** in this repository. It installs as a
Claude Code plugin (`/plugin install chaos`). This repository holds the app, its `.chaos/`
workspace, and its recorded decisions.

## Domain

`[FACT / HIGH]` One entity, `TaskItem`: `Id` (Guid), `Title` (string), `Status`, `Priority`,
`CreatedAt` (DateTimeOffset). It is an immutable `record`; updates replace it via `with`.

`[FACT / HIGH]` Two closed enumerations:

- `TaskState` — `Open`, `InProgress`, `Done`. Named `TaskState` rather than `TaskStatus`
  deliberately, to avoid collision with `System.Threading.Tasks.TaskStatus` under .NET's
  implicit global usings. **Keep that name.**
- `TaskPriority` — `Low`, `Medium`, `High`.

`[FACT / HIGH]` Both serialize as names (`"Open"`, `"High"`) rather than numbers, in both
directions, via `JsonStringEnumConverter`.

## Actors

| Actor | Interaction | Status |
|---|---|---|
| API client | Calls `/tasks` with a JWT bearer token | `[FACT / HIGH]` every `/tasks` route requires authentication |
| Anonymous caller | Calls `GET /` as a liveness probe | `[FACT / HIGH]` deliberately anonymous, separately rate-limited |
| Local developer | Builds and tests the solution; may mint a token via `POST /dev/token` | `[FACT / HIGH]` that route exists only behind two independent gates |
| Agent working under CHAOS | Proposes and implements changes through `chaos:run` | `[FACT / HIGH]` governed by [`AGENTS.md`](../AGENTS.md) |

`[UNKNOWN / HIGH]` There is no human end-user interface of any kind — no UI, no client
application in this repository.

## Important flows

`[FACT / HIGH]` Request pipeline order, established in `Program.cs` and load-bearing:

```text
security headers -> body-size guard (413) -> HSTS (non-dev) -> HTTPS redirection
  -> CORS -> rate limiter -> authentication -> authorization -> endpoints
```

Rate limiting **precedes** authentication on purpose: on a public surface the untrusted
population is the unauthenticated one, so a rejected request must consume a permit. Reordering
this is a crossing, not a refactor.

`[FACT / HIGH]` Routes:

| Route | Auth | Notes |
|---|---|---|
| `GET /` | anonymous | liveness; own looser rate-limit policy |
| `GET /tasks` | required | optional `?status=` / `?priority=` filters; unfiltered when neither is supplied |
| `GET /tasks/{id:guid}` | required | 404 when absent |
| `POST /tasks` | required | 400 when `Title` is blank |
| `PUT /tasks/{id:guid}` | required | 400 when `Title` is blank, 404 when absent |
| `DELETE /tasks/{id:guid}` | required | 204 / 404 |
| `POST /dev/token` | anonymous | **only registered** when `IsDevelopment()` *and* an opt-in flag defaulting to `false` |

`[FACT / HIGH]` `GET /tasks` accepts optional `?status=` and `?priority=` filters as of
2026-08-07 ([record](decisions/2026-08-07-add-task-query-filters.md)). They combine with **AND**,
each takes **exactly one** value, values parse **case-insensitively**, and an unrecognized value
— unknown name, numeric out-of-range, comma-separated list, or blank — returns **400**. Sending
neither parameter returns everything, exactly as before, so the change is backward compatible.

`[FACT / HIGH]` This closed the gap that [`docs/demo/README.md`](../docs/demo/README.md) uses as
its worked example. That walkthrough still describes the filters as unimplemented; it was
outside this change's approved scope and is listed as a follow-up in the decision record.

`[FACT / HIGH]` The store seeds four tasks at construction with fixed timestamps, so creation
order is stable across runs, and `All()` returns them ordered by `CreatedAt`.

## Constraints

- `[FACT / HIGH]` **Credentials come from outside the repository.** `AuthOptions.Load` throws
  when `Auth:Issuer`, `Auth:Audience`, or `Auth:SigningKey` is missing, so the app cannot start
  half-secured. Local development and CI must supply them. Never commit them.
- `[FACT / HIGH]` **Token lifetime validation has zero clock skew.** An expired token is
  expired; the .NET default 5-minute leeway is deliberately removed.
- `[FACT / HIGH]` **State does not survive the process.** The store is a singleton
  `ConcurrentDictionary`; rate-limit state is in-memory and per-instance. Neither survives
  restart, and neither is correct across scale-out.
- `[FACT / HIGH]` **The baseline must stay green.** `dotnet test TaskTracker.sln --nologo`
  is what CI runs ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) and what every
  governed change must keep passing.
- `[FACT / HIGH]` **`net8.0` is the target framework** for both projects; CI pins `8.0.x`.
- `[UNKNOWN / HIGH]` **No deployment target, hosting model, or environment inventory is
  recorded anywhere in this repository.** The 2026-08-01 ADR states this explicitly. Anything
  requiring knowledge of where this runs is unanswerable from the repo today.

## Environments

| Environment | Status | Evidence |
|---|---|---|
| Local development | `[FACT / HIGH]` supported | `launchSettings.json`, `TaskTracker.http`, `POST /dev/token` gate |
| CI | `[FACT / HIGH]` GitHub Actions, `ubuntu-latest`, .NET `8.0.x`, build + test | `.github/workflows/ci.yml` |
| Any deployed environment | `[UNKNOWN / HIGH]` none defined | no infrastructure, container, or deployment manifest exists in the repository |

`[FACT / HIGH]` The 2026-08-01 ADR records the decision to expose the API to the **public
internet**, and that decision is what forced the authentication posture — but no artifact in
the repository says *where* that exposure happens.

## Glossary

- **Crossing** — a change that contradicts a recorded posture in `.chaos/architecture.md` or
  `docs/adr/`. Must be surfaced at the pre-code stop and, if approved, amended in the same change.
- **Spec gate** — the size/crossing threshold in `.chaos/config.yaml` that decides whether a
  change owes an OpenSpec change before implementation.
- **Decision record** — the one-page artifact `chaos:run` writes per change under
  `.chaos/decisions/`, indexed in `decisions/index.md`.
- **Stop** — the single pre-code pause where every open question and crossing is folded into
  one human decision.
- **Liveness signal** — `GET /`, kept anonymous so an uncredentialed probe can confirm the
  process is up.

## Scope decisions

| Track | Status | Confirmation |
|---|---|---|
| API / backend (`src/`, `tests/`) | **active scope** | inferred from repository structure; it is the only code track |
| ADR corpus (`docs/adr/`) | **active scope — crossing source** | `[FACT]` one Accepted ADR present |
| Demo walkthrough (`docs/demo/`) | **context only** | narrative documentation about using CHAOS, not a posture |
| OpenSpec (`openspec/`) | **active scope**, gate-driven | project initialized by this `chaos:init` run |
| Deployment / infrastructure | **not present** | `[UNKNOWN]` no such track exists to include or exclude |
| Persistence / data | **out of scope** | `[FACT]` in-memory by design; see `architecture.md` non-goals |

No major available documentation track was excluded. The only tracks that exist are included
as active scope or context, so the exclusion-confirmation gate was not triggered.

## Known facts vs assumptions

`[ASSUMPTION / MEDIUM]` The postures recorded in `architecture.md` are **accepted working
posture**, not draft. Basis: [`README.md`](../README.md) describes `docs/adr/` as "the postures
a future stop checks against", and the demo walkthrough depends on crossings being detectable.
If they were draft, a stop could not meaningfully catch a contradiction. Review owner: repository owner.

`[ASSUMPTION / MEDIUM]` The project is best treated as **brownfield with an open, documented
gap** rather than greenfield: working code, a green test suite, one Accepted ADR, and a
deliberately unimplemented filter feature. Review owner: repository owner.

`[INFERENCE / HIGH]` The working-tree deletion of the previous `.chaos/`, `AGENTS.md`, and
`openspec/` was a deliberate cold-start rehearsal, not data loss — a sibling branch named
`validation/ea-x1-cold-start` exists, and every deleted file remains intact in `HEAD`.

## Open questions

| ID | Question | Impact |
|---|---|---|
| OQ-001 | Where does this API actually deploy, and who terminates TLS in that environment? | The ADR chose app-terminated TLS and deliberately did not register forwarded-headers middleware. Putting a proxy in front is a new decision, not configuration. |
| OQ-002 | Who issues tokens in a real deployment? | `POST /dev/token` is development-only by design; production has no issuer. Tracked as RK-5 in the ADR. |
| OQ-003 | Is per-caller authorization ever coming? | `TaskItem` has no owner field, so any valid token can read and mutate any task (RK-4). Currently an explicit non-goal. |
| ~~OQ-004~~ | ~~Should the 2026-07-19 task-filter-validation decision record be restored?~~ | **Closed 2026-08-07** — restored from `HEAD` (FU-4 in the filter change's record). It is again the source for the 400-on-invalid rule that the 2026-08-07 change followed, and its content matches the index summary that change relied on. |
