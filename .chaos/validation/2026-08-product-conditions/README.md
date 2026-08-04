# Product-conditions run — the first `chaos:run` ever timed as a user experiences it

> **Toolkit meta-work: this measurement runs WITHOUT CHAOS governance.** CHAOS runs only
> *inside* the tests.
>
> **Pre-registration.** §3 and §4 are frozen **before any test runs** and are **never edited to
> match results**. Seven cost hypotheses have died in this program. A negative result is a valid
> outcome and gets written up as one.

## 1. Why this run exists

Every wall-clock figure in the program — all 12 rows, re-measured on the independent clock
([rebase doc §6](../../../docs/design/2026-08-04-metric-rebase.md)) — comes from an **arm running
as a workflow subagent**. Metric M2 gates on wall clock *under product conditions*: a real
`chaos:run` invoked from chat or CLI. **That case has never been measured.** It is the only thing
standing between the program and a bar it can actually enforce.

**The single question this run answers:** does a real `chaos:run` behave like the 15.0-minute
band-A arm, or does the harness account for a material part of that? If product conditions are
much faster, every figure in the program overstates the product. If they are not, the ≤5 min bar
is failing by 3× in the case that actually matters.

## 2. Setup (already done — do not repeat)

Workspace: **`D:/Proyectos/CHAOS/demo-light`** on `demo/dotnet` (`2bca328`).

- Toolkit aligned with main; **`chaos-run` did not exist on this branch before** — nor did
  chaos-classify / chaos-scan / chaos-record / chaos-digest / chaos-stopwatch.
- **`.chaos/path-class-map.json` added.** It decides M2. Without it M2 can never fire and every
  test would land in band A at HIGH confidence, making the whole run worthless. `scan.py` now
  refuses to start without it (`51c95e5`).
- Baseline green: `dotnet test` **34/34**, digest `--check` exit 0, six tool suites pass.
- Scan pre-flight confirms the map classifies as intended: `Endpoints/` fires nothing,
  `Domain/` fires M2 data-store, `Program.cs` fires M2 auth.

## 3. The tests (frozen, in order)

Run in the order given: it front-loads one test per band, so stopping after **T3** still yields
full band coverage. Each prompt is pasted **verbatim** — its wording is the bookmark the
stopwatch windows on (`--from-match`), including text inside `<command-args>` when the runtime
renders a slash invocation. No tagging is required of the operator.

**No preset flag** on any test: that is what every measured row in the series used
("no preset flag" in the RUNKIT titles), so the classifier decides rigour unaided and these
numbers stay comparable.

**Between every test:** `git add -A && git commit -m "Tn"` in the demo workspace — a scan
classifies from the working-tree diff, so an uncommitted previous test would be read as part of
the next one. After the last test, one short message closes the final window.

| # | Test | Targets | Bar |
|---|---|---|---|
| **T1** | priority filter, endpoint-only | **band A** — zero-trigger | **≤ 5 min** |
| **T2** | due date on the task record | **band B** — M2 persistence, one surface | ≤ 15 min |
| **T3** | per-owner task scoping | **band C** — breaking + 2 surfaces, **never measured** | ≤ 30 min |
| **T4** | title max length | **band A** again, for n=2 on the headline bar | **≤ 5 min** |
| **T5** | "archive old tasks" | **a stop** — the human-in-the-loop case | ≤ 15 min machine |

Each block below is one chat message, pasted whole.

### T1 — band A

```text
/chaos-run "Add an optional ?priority= query filter to GET /tasks, accepting Low, Medium or High. Omitting the parameter keeps today's behaviour of returning everything. An unrecognised value is a 400. Keep the filtering in the endpoint layer over the existing store.All() result - do not change TaskStore."
```

### T2 — band B

```text
/chaos-run "Give every task an optional DueDate. It is nullable, settable on create and update, and returned on every task. Absent means no due date, and tasks already in the store keep working without one."
```

### T3 — band C (never measured in this program)

```text
/chaos-run "Scope tasks to their owner. Record the owning user on each task, taking the identity from the authenticated caller's JWT subject claim. GET /tasks must return only the caller's own tasks, and reading, updating or deleting someone else's task must be a 404. This is a deliberate breaking change to the published contract: GET /tasks currently returns every task to any authenticated caller."
```

### T4 — band A, second sample

```text
/chaos-run "Reject task titles longer than 200 characters on create and update, with a 400 and a clear message. A title of exactly 200 characters is accepted."
```

### T5 — the stop case

Deliberately under-specified. **Do not add detail when pasting it** — the ambiguity is the
instrument. Answer CHAOS's questions however you genuinely would; your thinking time is measured
separately and is never counted against the bar.

```text
/chaos-run "Tasks are piling up. Add whatever is needed so users can get old tasks out of the way instead of deleting them."
```

### Closing message

After T5 finishes, send this one short message so the last window has an end boundary:

```text
runs finished
```

## 4. Frozen predictions

**Bands** (the classifier decides; these are predictions, not instructions):

- T1, T4 → **band A**, no triggers. T2 → **M2 data-store**, single surface. T3 → **M3 breaking**
  plus M2 on two surfaces ⇒ `openspec 2`. T5 → **≥1 stop**, band unpredictable by design.
- **T3 is the one I expect to be wrong about.** No arm in the program's history has ever reached
  band C, so its ≤30 min bar is an extrapolation and its trigger set is untested. If T3 lands in
  band B, that is a real finding about C-13 detection, not a failed test.

**Times** (machine time — human thinking excluded):

| | Prediction | Measured band-A/B equivalent (workflow arms) |
|---|---|---|
| T1, T4 (band A) | **8–16 min** — misses ≤5 min | 15.0 min |
| T2 (band B) | 14–22 min — marginal against ≤15 min | 18.8 min |
| T3 (band C) | 25–40 min | never measured |
| T5 (stop) | 12–20 min machine, plus human wait | never measured |

**The direction test:** product conditions should be **no slower** than the workflow arms. If T1
comes in materially under ~10 min, the harness was inflating the whole series and every figure in
the program needs re-reading. If T1 lands near 15 min, the band-A bar is genuinely failing by 3×
and §6.3(b) — the flat cost curve — is the right target.

**Quality is a stop-the-analysis gate**, as in every kit: `dotnet test` must stay green at the end
of each test. A test that leaves the suite red is reported as a failure, not tuned away.

## 5. What is measured automatically, and what is not

**Automatic — nothing to start, stop, or remember:**

- **The clock.** The runtime stamps every transcript record; `tools/chaos-stopwatch` reads them
  afterwards. There is no wrapper and no `date +%s`. This is what makes it independent.
- **Human wait.** Time spent answering a CHAOS stop is split out and **never gated**.
- **Subagent time.** Nested agents run inside the parent's elapsed time, so it is already counted.
- **Price.** Derivable from the same transcripts if wanted, though the ceiling has 4–8× headroom.

**Manual — three things, and each exists for a concrete reason:**

1. **Paste each prompt verbatim.** The stopwatch finds a test in the transcript by searching for
   a distinctive phrase from its own prompt (`--from-match`). The wording *is* the bookmark; a
   reworded prompt cannot be located, so that test's timing is lost.
2. **`git add -A && git commit` after each test.** A scan classifies from the working-tree diff.
   If T1's edits are still uncommitted when T2 starts, T2's scan sees T1's files as part of T2 —
   wrong surfaces, wrong band, invalid measurement.
3. **One short closing message** (`runs finished`). Every test's window ends where the next
   test's prompt begins; the last test has no successor, so without a closing message its window
   would run to the end of the transcript and swallow any later conversation.

## 6. Procedure log

Filled in as the run proceeds; never back-dated.

- 2026-08-04 — kit authored; §3/§4 frozen **before** any test ran. Workspace aligned
  (`2bca328`), path-class map added and pre-flighted, baseline 34/34 green.
- 2026-08-04 — **plain (denominator) arm defined**: `D:/Proyectos/CHAOS/demo-plain` created
  from `demo-light` @ `15de0a9` with all governance wiring removed; definition, content
  edits, measurement procedure and frozen plain-arm predictions in
  [`plain-workspace.md`](plain-workspace.md). 34/34 green, zero CHAOS references. No plain
  arm has run.

## 9. Toolkit changes between T1 run 1 and the re-run

Run 1 exposed two defects that were repaired before the re-run. Both change what the re-run
measures, so both are recorded here rather than folded silently into the result.

| Change | Commit | Effect on the measurement |
|---|---|---|
| **Scope parser splits on whitespace**, not commas only | `805b5c9` | Removes the false-positive M5 that cost run 1 an unowed stop, an unowed decision and the re-scope tail |
| **Route B closed** — T0 now reachable only by route A | `ca7ce7d` | Removes the floor-tier delegation that cost run 1 ~4 net minutes and shipped a contract violation |

**The re-run is therefore not a repeat — it is a different toolkit**, which is why run 1's
evidence is kept intact at `evidence/T1-run1/` rather than overwritten. The delta between the two
is the measurement: it isolates what the two defects cost, which run 1 could not separate.

**Predictions for the re-run, frozen before it runs:**

- **M5 must not fire.** If it does, the parser fix did not take. This is the sharpest test here.
- **No T0 delegation.** The implementation unit should band **T1**, with `t0Blocked` citing the
  route B closure. `modelInvocations` should show no floor-tier call.
- **M4 will probably still fire**, because it counts material questions and the case ambiguity is
  real. So the re-run is still unlikely to reach band A — which is itself the finding about
  whether band A is reachable for any change carrying a genuine question.
- **Machine time 16–21 min.** Below run 1's 23.7 (the two defects cost roughly 4–7 min between
  them) but still above the ≤15 min band-B bar. **Predicting another miss, and saying so first.**
