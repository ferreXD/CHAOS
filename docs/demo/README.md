# CHAOS worked example — reading a real record, then testing whether it binds

This repository has already been through a governed change. The point of this walkthrough is
not to watch code get written — it is about a dozen lines of LINQ — but to read what the
change **left behind**, and then find out whether that leftover actually constrains the next
change.

> Everything referenced below is real. The decision record was produced by an actual
> `chaos:run` on this repository on 2026-08-07, not authored as an illustration. The domain
> is fictional; the artifacts are not.

---

## 0. Set up

You need the .NET SDK 8+ and Claude Code with the CHAOS plugin:

```text
/plugin marketplace add ferreXD/CHAOS
/plugin install chaos
```

Confirm the baseline — 56 tests, and every governed change must keep them green:

```bash
dotnet test TaskTracker.sln --nologo
```

`chaos:init` has already been run here, so `AGENTS.md`, the [`.chaos/`](../../.chaos/)
workspace and [`docs/adr/`](../adr/) are in place. (In your own repository, that is step one.)

---

## 1. Read what a governed change leaves behind

Open **[`.chaos/decisions/2026-08-07-add-task-query-filters.md`](../../.chaos/decisions/2026-08-07-add-task-query-filters.md)**.
It is one page, and it is the whole product. Five things in it are worth your attention:

**It records what was asked — and what deliberately was not.** Three questions went to the
human in a single stop: AND or OR when both filters are supplied; comma-separated lists or
exactly one value; what a blank `?status=` does. Below them sits a section titled *"Not asked,
because the repository already answered it"* — and the first entry is the interesting one:

> **What should an invalid filter value do?** — `.chaos/decisions/index.md` carries the
> 2026-07-19 task-filter-validation decision: unrecognized `status`/`priority` → **400** […]
> Followed and cited, not re-asked.

That is the loop closing. A decision recorded **in July** suppressed a question **in August**,
without anyone reminding the agent it existed. Nothing in the prompt mentioned it; it was found
by reading the decision index, which is what a stop is required to do.

**It carries a caveat instead of hiding one.** At the time of that run the July record's *file*
was missing from the workspace (a cold-start `chaos:init` had not restored it), so the run
followed the summary in the index and said so explicitly — including the risk that the index
might have drifted from the original. It also filed the restore as a follow-up. That file is
back now: [`2026-07-19-task-filter-validation.md`](../../.chaos/decisions/2026-07-19-task-filter-validation.md).

**It refuses to resolve a gap quietly.** The spec gate says "≥ 250 LOC owes a spec". The change
added ~300 raw lines but 158 lines of non-comment code, and `.chaos/config.yaml` never says
which one `specGate.loc` means. The record does not pick a side — it states the ambiguity, notes
the gate result either way, and files it as **FU-1** for the repository owner. Silently choosing
the convenient reading is precisely what the loop exists to prevent.

**It records what could not be verified.** Real `dotnet build` and `dotnet test` output is
pasted (34/34 before, 56/56 after). Then four **verification limits** with reasons: the API was
never run as a live process, query-string binding was only exercised through `HttpClient`, no
load or rate-limit interaction testing, and pre-existing lint warnings left alone. None of those
are dressed up as passes.

**It caught two real bugs that would have shipped silently.** `Enum.TryParse` accepts numeric
strings (`?status=7` would have matched nothing and returned `200`), and accepts comma-separated
lists even without `[Flags]` (`"Open,Done"` bitwise-ORs into `Done` and returns the wrong set,
also with `200`). Both are guarded, and both guards are pinned by tests so a later "cleanup"
cannot quietly remove them.

---

## 2. Now test whether the record binds

Reading a record proves nothing. What matters is whether the next change has to reckon with it.
Two exercises, and they should behave **differently** — that difference is the entire claim.

### Exercise A — ask something the record left open

The record's own follow-up **FU-2** says the contract for a repeated parameter
(`?status=A&status=B`) is unspecified: ASP.NET binds the first value, nobody decided it, and the
run refused to assume.

```text
/chaos:run "decide and implement what GET /tasks does when ?status= is supplied twice"
```

A correct stop **asks you**, because nothing has answered this. It should also *not* re-ask the
settled parts — the 400-on-invalid rule, the AND combination, exactly-one-value — and should
say where each came from.

### Exercise B — contradict something the record settled

```text
/chaos:run "let ?status= accept a comma-separated list of values"
```

This directly contradicts answer #2 from the recorded stop ("exactly one value"), and it would
remove the guard the record calls out by name. A correct stop **does not implement it quietly**:
it names the contradiction, points at the record, explains the consequence the guard exists to
prevent, and offers real alternatives — including *don't do this*.

You are free to override it. You are the human; that is the point. But you override *knowingly*,
and the amendment lands in the record for whoever comes next.

**If Exercise B ships without surfacing the contradiction, CHAOS failed** — visibly, in a way
you can file as an issue. A demo that can only succeed is not evidence, so this one is built to
be able to fail.

---

## 3. What the loop costs

On measured runs against a real client codebase, the whole thing costs about **1.1×** an
ungoverned change, and the premium is the stop itself — the phase after approval was *shorter*
than the ungoverned run. The numbers, the catches, and the caveats that bound them (n=3, one
operator, one codebase) are on one page:
[evidence](https://github.com/ferreXD/CHAOS/blob/main/docs/evidence.md), which also ships the
strongest rival hypothesis as a kit you can run against CHAOS yourself.

---

## If something goes wrong

| Symptom | What it means |
|---|---|
| The run stops and nothing appears in VS Code | The Decision Center is not installed — answer in chat instead, or install it (publisher `ferreXD`) |
| `chaos:doctor` reports the runtime unavailable | Node.js < 20.19 or missing; the stop falls back to chat and still writes the record |
| The session was interrupted | `/chaos:resume` — it continues from the capsule and your answered decision, never from chat memory |
| You want to start over | `git checkout .` — the app is disposable; the artifacts under `.chaos/decisions/` are the part worth keeping |
