# T1 plain+ask — run 1 of 3, archived 2026-08-04

Arm defined and frozen at [`../../plain-ask-arm.md`](../../plain-ask-arm.md) **before** this run.
Diff against the plain baseline `02ff26e`; tree captured before any rollback this time.

| | |
|---|---|
| Session | `5e3842a0-63d1-4ed2-bee3-aaa59ec6d3ad` |
| Model / effort / speed | opus-5 · high · standard ✅ (clause satisfied) |
| **Stopwatch machine** | **2.9 min** (177 s) — **overstated, see §3** |
| **True machine** | **≈ 2.1 min** (125.9 s) |
| Human answering | **51.1 s**, charged to `machine` by the instrument |
| API messages / tool calls / output tokens | 11 / 15 / **7,952** |
| Suite run by the arm | yes — 43/43 (9 new; the run's own summary says "11 new" — miscount) |
| **Evaluator oracle** | **8/8 pass** |

## 1. It asked — one question, the material one

At 16:03:46, after seven reads and before any edit, via `AskUserQuestion`:

> **Should the `?priority=` value be matched case-sensitively?**
> **Case-insensitive** — `?priority=high`, `HIGH` and `High` all work. Consistent with the
> request-body enum handling, which `JsonStringEnumConverter` already parses case-insensitively.
> **Case-sensitive** — only `Low`, `Medium`, `High`; `?priority=high` is a 400. Stricter and
> matches your wording literally, but diverges from how the same enum is parsed in POST/PUT bodies.

Answered **case-insensitive**, per the frozen answering protocol (RUN-DEC-001 option A).

The justification it offered for the recommended branch — *`JsonStringEnumConverter` already
accepts the same enum case-insensitively on POST, so the same string should not mean two things
on two routes* — is **the same reasoning RUN-DEC-001's recommendation gives**, arrived at
independently.

## 2. It did not ask about the empty value — it decided and disclosed it

The other half of RUN-DEC-001 (`?priority=` present but empty) was never raised as a question.
It was settled in code as a 400 and then **disclosed in the closing message**:

> **Two smaller calls I settled myself,** since they follow from your spec rather than departing
> from it — say the word if you want either flipped:
> - **Numeric text is a 400.** `Enum.TryParse` would happily accept `?priority=0` and even
>   `?priority=42` …
> - **`?priority=` (present but empty) is a 400,** not treated as omitted — an empty value is a
>   supplied value, and failing loudly beats silently ignoring a filter the caller thought they set.

So the frozen prediction *"no run folds both halves into one bounded decision the way
RUN-DEC-001 did"* **holds for n=1** — but the failure mode is not the plain arm's silence. The
maintainer still gets the choice; they get it **after** the code exists, in prose, with no record.
CHAOS pinned it **before** the code as C-005. That is the difference this arm exists to price.

## 3. Instrument finding — `humanWait` cannot see tool-mediated questions

[`../../plain-ask-arm.md` §3](../../plain-ask-arm.md) predicted the instrument would work better
here than on the governed arm, because a chat-turn question splits human thinking into
`humanWait`. **That was wrong.** The run used `AskUserQuestion`, a *tool call* — the exchange
stays inside one assistant turn, so `stopwatch` reports `turns 1, humanWait 0` and charges the
operator's **51.1 s** to `machine`.

This is the same blind spot [`../../results-T1.md` §8](../../results-T1.md) flags for Decision
Center answers, which the pre-registration wrongly assumed was avoided here. The general rule:
**`humanWait` sees chat-turn questions only.** Any tool-mediated question — `AskUserQuestion`,
the Decision Center — lands inside `machine`.

Corrected here by subtracting the measured `tool_use` → `tool_result` gap:
**177 − 51.1 = 125.9 s = 2.1 min.**

**This under-corrects the governed arm too.** The 23.7 min figure contains however long the two
Decision Center answers took, and nobody has subtracted them. Worth measuring before 23.7 is
quoted again.

## 4. Delivered code

Contract-equivalent to the governed delivery on every pinned statement:

| | |
|---|---|
| C-003 unrecognised → 400 | ✅ explicit name matching over `Enum.GetValues<TaskPriority>()`, with a doc comment naming why `Enum.TryParse` was rejected (`"0"`, `"42"`) |
| C-004 case-insensitive | ✅ as answered |
| C-005 present-but-empty → 400 | ✅ decided unilaterally, disclosed after the fact |
| C-006 endpoint layer, store untouched | ✅ `TaskStore.cs` / `TaskItem.cs` byte-unchanged |
| C-007 baseline green | ✅ 34 baseline + 9 new, all pass |

Own tests cover case variants, unfiltered superset, and rejection of `Urgent` / `0` / `42` / `""`.
It also updated `TaskTracker.Api.http` with both a success and a 400 example.
