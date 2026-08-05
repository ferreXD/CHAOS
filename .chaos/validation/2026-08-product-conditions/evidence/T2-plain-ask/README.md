# T2 plain+ask — run 1, archived 2026-08-04, and the T2 cross-arm comparison

| | Plain ([`../T2-plain/`](../T2-plain/README.md)) | **Plain+ask** |
|---|---:|---:|
| Session | `ccfb4ab5` | `4136015c` |
| Model / effort / speed | opus-5 · high · standard ✅ | opus-5 · high · standard ✅ |
| Stopwatch machine | 2.3 min (136 s) | 2.7 min (164 s) |
| Tool-mediated human answering | — | **10.4 s**, charged to `machine` |
| **True machine** | **2.3 min** | **2.6 min** |
| API messages / tools / output tokens | 12 / 20 / **10,204** | 14 / 20 / **11,007** |
| Suite run by the arm | 49/49 (6 new) | 48/48 (5 new) |
| **Evaluator oracle** | **6/6** | **6/6** |
| Questions asked / material | 0 / — | **1 / 1** |
| Provenance | reconstructed from transcript | committed as `3b6f397` |

Base for both: `5f3ef0f`. **Asking cost +0.3 min (+13%)** on T2, against +0.6 min (+40%) on T1.

## The question it asked

> **What should DueDate's type and JSON shape be?**
> **`DateTimeOffset?` (instant)** — matches `CreatedAt`, which is already `DateTimeOffset`.
> Carries time-of-day and offset, so "due end of day" is expressible and callers in different
> zones agree on the instant. Costs a noisier JSON contract.
> **`DateOnly?` (calendar day)** — matches the name: a task is due on a day, not an instant.
> Clean `"2026-08-14"` wire format, no timezone ambiguity. Costs consistency with `CreatedAt`,
> and time-of-day deadlines become unrepresentable without a later breaking change.

Both options carried a rendered JSON preview of the resulting wire contract. Answered
**`DateTimeOffset?`**; the human gap was **10.4 s**.

**The plain arm chose `DateTimeOffset?` too — silently, and correctly.** On T2 the stop bought
**disclosure, not a different outcome**: zero behavioural delta between the arms on the asked axis.

## The second decision — settled, then disclosed

> **One I settled by the codebase's own convention, worth flagging:** PUT is a whole-resource
> replace here, so a PUT body that omits `dueDate` **clears** it. That's how the other fields
> already behave (an omitted `status` resets the task to `Open`), and there's no PATCH on this
> API to mean "leave it alone". If you'd rather absent-on-PUT preserve the existing value, that
> needs a way to distinguish absent from explicit `null` — say the word and I'll add it.

**Verified: both arms implement identical PUT semantics** — `request.DueDate` is passed straight
to `store.Update`, so an omitted `dueDate` clears an existing one in *both*. The code is the same;
only one arm said so. This is the same shape as T1 (one axis asked, one disclosed after the fact),
and it is now the arm's consistent signature across two tasks.

The plain arm was not wholly silent either — it flagged *"no new validation: any date is accepted,
since none was specified."* A different choice, disclosed unprompted. The difference between the
arms is narrower than "discloses vs doesn't": it is **which** choice gets surfaced and whether it
is surfaced before or after the code exists.

## Implementation delta

Both: `DateTimeOffset? DueDate` on the record, on both request contracts, threaded through
`TaskStore.Add`/`Update` and the POST/PUT handlers; `.http` and `README.md` updated; seeded tasks
untouched and null.

One real difference: the plain arm gave `dueDate` a `= null` **default** on `Add`/`Update`, the
plain+ask arm made it a **required parameter** and updated the four seed call sites explicitly.
The plain+ask form is stricter — a future call site cannot silently omit a due date — at the cost
of a larger diff.

## Frozen-prediction check

- **Plain T2 predicted 4–6 min** ([`../../plain-workspace.md` §6](../../plain-workspace.md)) →
  **2.3 min**. Over-predicted, the third plain-family duration prediction in a row to miss high.
- **No frozen plain+ask prediction exists for T2** — [`../../plain-ask-arm.md` §5](../../plain-ask-arm.md)
  froze cost for T1 only. The 2.6 min figure is measured, not scored.
- **Governed T2 has not run.** Its frozen prediction is 14–22 min; against this denominator that
  would be a **6.1–9.6× multiplier**, down from T1's 15.8×. The §6 direction test — *the
  multiplier falls as the band rises* — is live and currently unfalsified, even though every
  absolute level it predicted is wrong.
