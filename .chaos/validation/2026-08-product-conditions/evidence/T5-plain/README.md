# T5 plain — the stop case, run 1, archived 2026-08-04

| | |
|---|---|
| Session | `c23d0757-5d6b-4751-a081-14e03738fa61` |
| Model / effort / speed | opus-5 · high · standard ✅ |
| Stopwatch machine (raw) | 8.9 min (532 s) — **overstated, see §3** |
| **True machine** | **6.1 min** (364.4 s) |
| API messages / tools / output tokens | 29 / 33 / 27,385 |
| Base | `c16f000` ("T4") |
| Suite | 96/96 (22 new) — **verified independently on the reconstruction** |
| **Questions asked** | **0** |
| Provenance | **reconstructed** from 18 Edit/Write calls, all anchors matched |

The plain+ask counterpart is **void** — it ran on a tree still holding this arm's untracked test
file. See [`../T5-plain-ask/README.md`](../T5-plain-ask/README.md).

## 1. The frozen prediction holds — it did not ask

[`../../plain-workspace.md` §6](../../plain-workspace.md): *"T5's plain arm completes without asking
anything. If it does ask, the prompt is less ambiguous than designed and T5's governed stop is not
evidence of governance value."*

**It asked nothing.** T5 remains a valid stop-case instrument, and the governed arm's stop — when
it runs — is measuring something real.

## 2. What it silently decided

Per [`../../plain-workspace.md` §5.6](../../plain-workspace.md), the interpretation is as much the
result as the minutes. Ten unilateral calls, each argued in the closing summary:

| # | Decision | Notes |
|---|---|---|
| 1 | Nullable `ArchivedAt` timestamp, **not** a bool + date | *"'archived with no date' is unrepresentable"* |
| 2 | **Not** a fourth `TaskState` | *"merging them would … silently redefine `Done` for existing callers"* |
| 3 | `POST /tasks/{id}/archive` + `/unarchive`, no body, 200, 404 | route shape invented whole |
| 4 | Idempotent; re-archiving keeps the **original** timestamp | *"records when the task was filed away, not when the button was last pressed"* |
| 5 | **`GET /tasks` now excludes archived tasks** | **a breaking change to the default listing, made unprompted** |
| 6 | `?archived=true\|false\|all`, case-insensitive, else 400 | mirrors the `?priority=` convention from T1 |
| 7 | `GET /tasks/{id}` still returns archived tasks | *"archiving hides a task from the list, not from a caller holding its id"* |
| 8 | PUT never changes archive state, and it is not on the body | *"a client replaying a body written before the field existed would un-archive every task it edited"* — pinned by a test |
| 9 | `DELETE` untouched | *"archiving is the reversible option, not a replacement"* |
| 10 | **One seed ships archived** | changed existing sample data so *"a fresh checkout shows both sides"* |

**#5 is the one a maintainer would most likely have wanted to decide**: an under-specified request
produced a silent breaking change to the most-used endpoint's default response. The arm did
document it and provided `?archived=all` as the way back — but nobody was asked.

#8 is the strongest piece of unprompted engineering judgement in the whole series: it identified a
replay hazard that would have made archiving as easy to undo by accident as `DELETE`, and pinned it
with a test.

## 3. Instrument finding #2 — trailing `queue-operation` records inflate the previous turn

The run's last real record is the closing summary at **20:38:27.4**. The operator then pasted the
next prompt at **20:41:15**, and the runtime wrote `queue-operation` records at 20:41:15.258 —
*before* the user record in file order. `stopwatch`'s turn-close rule ("last record before the next
prompt") therefore charged **2.8 min of idle time** to this run's `machine`.

**True machine = 20:32:23.0 → 20:38:27.4 = 364.4 s = 6.1 min.**

**Checked across all twelve sessions in this workspace: T5 plain is the only one affected** — every
other run's last timestamped record *is* its final assistant message (tail = 0.0 s). No earlier
figure needs revising.

This is the second `stopwatch` blind spot this program has found, after tool-mediated questions
landing in `machine` ([`../T1-plain-ask/`](../T1-plain-ask/README.md) §3). Both are turn-boundary
problems: the instrument assumes a turn ends where the next prompt begins, and both `AskUserQuestion`
and `queue-operation` violate that.

## 4. Frozen-prediction check

- **Predicted 5–8 min, no stop** → **6.1 min, no stop**. **Both halves correct** — and the first
  plain-family cost prediction to land inside its band on the raw reading as well as the corrected
  one. (Against the uncorrected 8.9 it would have read as a miss high.)
- Running tally of plain-family duration predictions: **T3 and T5 inside band, T1/T2/T4 high.**
- **Governed T5 has not run.** Predicted 12–20 min machine plus human wait; against 6.1 that is
  **2.0–3.3×**.
