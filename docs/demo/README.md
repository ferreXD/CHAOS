# CHAOS worked example — adding query filters to the Task Tracker API

A guided walkthrough of one governed change against **real, runnable code**: adding optional
`?status=` and `?priority=` filters to `GET /tasks`, which today returns everything.

The change itself is about a dozen lines of LINQ. **The demo is the governance, not the
code.** What's worth watching is that the repository already contains a recorded human
decision about invalid filter values — and whether the agent *notices*.

> Fictional domain, no private data. The API is a toy; the discipline is not.

---

## 0. Before you start

You need the .NET SDK 8+ and Claude Code with the CHAOS plugin:

```text
/plugin marketplace add ferreXD/CHAOS
/plugin install chaos
```

Confirm the baseline is green — every governed change has to keep it that way:

```bash
dotnet test TaskTracker.sln --nologo
```

Everything CHAOS needs is already in this repo: [`AGENTS.md`](../../AGENTS.md), the
[`.chaos/`](../../.chaos/) workspace (context, architecture posture, decision records), and
[`docs/adr/`](../adr/). You do **not** need to run `chaos:init` — it has already been run
here. (In your own repository, that's step one.)

---

## 1. The one command

```text
/chaos:run "add optional ?status= and ?priority= filters to GET /tasks"
```

That is the entire surface. What happens next is four phases, and only one of them wants you.

---

## 2. Read (seconds to a couple of minutes)

The agent reads what the change touches — `Endpoints/TaskEndpoints.cs`, `Domain/TaskItem.cs`,
the test suite — plus the **crossing sources**: `AGENTS.md`, `.chaos/architecture.md`,
`docs/adr/`, and `.chaos/decisions/index.md`.

That last one is the interesting read. It contains
[a decision from 2026-07-19](../../.chaos/decisions/2026-07-19-task-filter-validation.md):

> An unrecognized `status`/`priority` filter value returns **400 Bad Request** — unknown
> names *and* numeric out-of-range — and filter values parse case-insensitively.

The code does not implement that yet (the tree was reset so this exercise stays available).
So the question *"what should an invalid filter value do?"* is **already answered on
disk** — and a correct run must not ask you again.

---

## 3. Stop — the only part that needs you

Before writing any code, the run stops **once**, with everything folded into a single
decision: the plan, the size estimate and spec-gate result, every open question, and every
crossing it found. If the interaction runtime is available (the plugin launches it via
`npx`), the decision is durable and appears in the **Decision Center** panel; if not, it
happens in chat. Either way, the answer is recorded.

A good stop on this task looks roughly like:

```text
Decision: Add ?status= / ?priority= filters to GET /tasks (folds: 2)

Plan: filter in the endpoint layer over store.All(); parse both values
case-insensitively; unknown or out-of-range -> 400 with an error body;
add tests for each branch.  Estimated 2 files / ~40 LOC.
Spec gate: OPTIONAL (below 5 files / 250 LOC, no crossing) — flip it if you want a spec.

Not asked, because the repo answers it:
  - invalid value -> 400, case-insensitive parse
    (.chaos/decisions/2026-07-19-task-filter-validation.md) — following it, not re-asking
  - filtering stays in the endpoint layer, TaskStore untouched
    (.chaos/architecture.md: domain -> HTTP boundary)

Questions for you:
  1. Combining both filters: AND (default, recommended) or OR?
  2. Should ?status= accept a comma-separated list, or exactly one value (recommended)?

Options: [approve-as-planned] [approve-with-OR] [require-spec-first] [stop-defer]
```

**This is the whole product.** Two things to notice:

1. The invalid-value question — the one that *feels* like the interesting question — is
   **not asked**, because the repository already decided it. It appears under
   "not asked, because", with the record cited. That is the record→future-stop loop:
   last month's answer suppressing this month's question.
2. What *is* asked is genuinely yours: AND vs OR is a semantic choice no amount of
   codebase-reading can settle. That's an **authority** gap, not a capability gap.

Answer it (click an option in the Decision Center, or reply in chat). If you want to see
the mechanism bite, pick something *other* than the recommendation and watch the plan and
the record follow you rather than the model.

---

## 4. Build → verify → record

After your answer, the run continues without further interruption:

- **Build** — implements exactly what was approved. Scope drift that changes capability
  earns a new decision; helper files finishing approved work do not.
- **Verify** — runs `dotnet build` and `dotnet test` and pastes the **real** output.
  Anything it cannot verify is recorded as a *limit with a reason*, never as a pass.
- **Record** — writes `.chaos/decisions/<date>-add-task-query-filters.md` and adds a line
  to [the index](../../.chaos/decisions/index.md), carrying: the verbatim intent, the size
  estimate versus actuals, the questions asked and answered, the "not asked, because"
  items, what shipped, real check results, and any deviations.

If the change had crossed a recorded posture and you approved the crossing, the crossed
record (an ADR or `.chaos/architecture.md`) is amended **in the same change** — so the
documentation cannot quietly drift out of agreement with the code.

---

## 5. The payoff: run a second change

The record only proves itself against the future. Try:

```text
/chaos:run "make invalid filter values fall back to returning everything instead of 400"
```

This directly contradicts the decision from step 2 — and now also the record your own run
just wrote. A correct stop does **not** implement it quietly: it names the contradiction,
points at the record, and offers real alternatives (including *don't do this*). You are
free to override — you're the human — but you override *knowingly*, and the amendment
lands in the record for whoever comes next.

That is the entire claim of CHAOS, in two commands: **one stop before code, and a memory
that argues back.** On measured runs the whole thing costs about 1.1× an ungoverned change
([evidence and caveats](https://github.com/ferreXD/CHAOS/blob/main/docs/evidence.md)).

---

## If something goes wrong

| Symptom | What it means |
|---|---|
| The run stops and nothing appears in VS Code | The Decision Center isn't installed — answer in chat instead, or install it (publisher `ferreXD`) |
| `chaos:doctor` reports the runtime unavailable | Node.js < 20.19 or missing; the stop falls back to chat and still writes the record |
| The session was interrupted | `/chaos:resume` — it continues from the capsule and your answered decision, never from chat memory |
| You want to start over | `git checkout .` — the app is disposable; the interesting artifacts are under `.chaos/decisions/` |
