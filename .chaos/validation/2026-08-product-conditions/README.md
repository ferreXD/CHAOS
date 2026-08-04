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
full band coverage. Each prompt is pasted **verbatim, including the `[M2-Tn]` tag** — that tag is
the only manual step, and it is what lets the stopwatch window each run exactly.

**Between every test:** `git add -A && git commit -m "Tn"` in the demo workspace, so the next
run's diff is clean. After the last test, send the single message `[M2-END]` to close the window.

| # | Test | Targets | Bar |
|---|---|---|---|
| **T1** | priority filter, endpoint-only | **band A** — zero-trigger | **≤ 5 min** |
| **T2** | due date on the task record | **band B** — M2 persistence, one surface | ≤ 15 min |
| **T3** | per-owner task scoping | **band C** — breaking + 2 surfaces, **never measured** | ≤ 30 min |
| **T4** | title max length | **band A** again, for n=2 on the headline bar | **≤ 5 min** |
| **T5** | "archive old tasks" | **a stop** — the human-in-the-loop case | ≤ 15 min machine |

### T1 — band A

```text
[M2-T1] chaos:run Add an optional ?priority= query filter to GET /tasks, accepting Low,
Medium or High. Omitting it keeps today's behaviour of returning everything. An unrecognised
value is a 400. Keep the filtering in the endpoint layer over the existing store.All() — do not
change TaskStore.
```

### T2 — band B

```text
[M2-T2] chaos:run Give every task an optional DueDate. It is nullable, set on create and
update, returned on every task, and absent means no due date. Existing stored tasks keep working
with no due date.
```

### T3 — band C (never measured in this program)

```text
[M2-T3] chaos:run Scope tasks to their owner. Record the owning user on each task, taking the
identity from the authenticated caller's JWT subject claim. GET /tasks must return only the
caller's own tasks, and reading, updating or deleting someone else's task is a 404. This is a
deliberate breaking change to the published contract: GET /tasks currently returns every task to
any authenticated caller.
```

### T4 — band A, second sample

```text
[M2-T4] chaos:run Reject task titles longer than 200 characters on create and update with a
400 and a clear message. Titles of exactly 200 characters are accepted.
```

### T5 — the stop case

Deliberately under-specified. **Do not add detail when pasting it** — the ambiguity is the
instrument. Answer CHAOS's questions however you genuinely would; your thinking time is measured
separately and is never counted against the bar.

```text
[M2-T5] chaos:run Tasks are piling up. Add whatever's needed so users can get old tasks out of
the way instead of deleting them.
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

**Manual — three things, all on the operator:**

1. The **`[M2-Tn]` tag** at the start of each prompt (window boundaries).
2. **`[M2-END]`** as a final message (closes the last window).
3. **`git commit` between tests** (keeps each diff clean).

## 6. Procedure log

Filled in as the run proceeds; never back-dated.

- 2026-08-04 — kit authored; §3/§4 frozen **before** any test ran. Workspace aligned
  (`2bca328`), path-class map added and pre-flighted, baseline 34/34 green.
