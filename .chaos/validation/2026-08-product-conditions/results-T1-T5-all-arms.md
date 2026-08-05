# T1–T5, all arms — the full product-conditions series

> Toolkit meta-work. Written 2026-08-05 after governed T2–T5 completed. Every time is the
> independent clock (`tools/chaos-stopwatch`, human gates and turn-boundary bookkeeping
> excluded — see §6); every delivery is scored against the same evaluator-written oracles in
> [`oracles/`](oracles/), which encode only each prompt's own sentences and were written by no
> arm. Governed artifacts live in demo-light commits `1e1084d`/`2365af9`/`e115b50`/`c9fe302`;
> plain-family evidence under [`evidence/`](evidence/).

## 1. The headline table

Machine minutes, human wait excluded. Every valid delivery is oracle-clean, so this table is
cost at *equal measured quality*.

| T | Task | Plain | Plain+ask | **Governed** | Gov prediction (§4/§9) | Gov bar | **× vs plain** |
|---|---|---:|---:|---:|---|---|---:|
| T1 | priority filter | 1.5 | 2.1 (1 q) | **23.7** run 1 · **16.1** run 3 | 8–16 ✗ · 16–21 ✓ | ≤15 (B) | **15.8 / 10.7** |
| T2 | due date | 2.3 | 2.6 (1 q) | **28.2** | 14–22 ✗ high | ≤15 (B) | **12.3** |
| T3 | owner scoping | 8.7 | 4.9 (2 q) | **35.3** | 25–40 **✓** | ≤30 (C) | **4.1** |
| T4 | title length | 1.8 | 1.7 (0 q, declined) | **15.4** | 8–16 **✓** | ≤15 | **8.6** |
| T5 | archive (ambiguous) | 6.1 | **VOID** (contaminated; never re-run) | **26.9** | 12–20 ✗ high | ≤15 machine | **4.4** |

- **Governed suites**: T2 69/69 · T3 91/91 · T4 108/108 · T5 139/139 — all including the
  dropped-in evaluator oracles (T2–T4). Plain-family: all valid arms oracle-clean.
- **Bands**: no task in the whole series classified band A. Even T4 fired M3+M4. Run 1's
  suspicion is now n=5: **band A is unreachable for any change carrying a real question**, so
  its ≤5-minute bar has never actually been exercised.
- **Prediction scorecard (governed)**: 2 of 5 inside the frozen band (T3, T4 — and T1's re-run
  band from §9). The misses are all high. Plain-family predictions: 2 of 5 inside band
  (T3, T5), misses all high. The compress-the-gap bias documented at T2 held to the end.
- **Multiplier curve**: 15.8 → 12.3 → 4.1 → 8.6 → 4.4. The §6 direction test — *the multiplier
  falls as the band rises* — **holds at the ends and inverts in the middle**: the two heaviest
  tasks (T3, T5) are the two cheapest multipliers (~4×), the two trivial ones the dearest
  (8.6–15.8×). Governance's fixed entry cost is real: **the governed floor is ~15 minutes for
  any change at all** (T4: 15.4 governed vs 1.7 plain for a five-line validator).
- Output tokens (deduped): governed 57.8k–135.4k vs plain 6.9k–32.4k → **3.8–9.5×**, tracking
  the wall-clock multipliers.

## 2. The one behavioural divergence in five tasks — and it is the stop working

Across T1–T3 and T5, every axis a stop or a question surfaced, the plain arm had silently
settled **the same way**: `DateTimeOffset?`, PUT-clears-dueDate, `dev-user` seeds, hidden
`ownerId`, and even T5's entire archive design (`ArchivedAt` + archive/unarchive routes +
default-hidden + `?archived=true`) — the governed human picked option A and the plain arm had
already built exactly A unprompted. Five tasks of convergence.

**T4 is the exception, and it is the cleanest evidence this program has produced.**

> options: A approve · count UTF-16 code units (.NET `string.Length`) · B approve · count
> user-perceived characters (grapheme clusters) · C stop / defer
> **answer: B — the recommendation was not taken; the limit is what the caller counts by hand,
> not what UTF-16 happens to encode.**

Both plain arms implemented UTF-16 `string.Length` and *disclosed* it ("if you meant grapheme
clusters, say so and I'll switch"). Nobody said the word — disclosure after the fact got no
answer. The governed stop asked **before the code existed**, and the human chose the branch no
model default had picked; delivered code uses `StringInfo.GetTextElementEnumerator`
([TaskEndpoints.cs:175 in `e115b50`]). **An emoji-bearing title now behaves differently in the
governed tree than in every plain-family tree.**

This is EA-X2b's finding reproduced under product conditions: model defaults converge, and the
only divergence in the series came from a real human answering a real question — against the
recommendation. It also sharpens what the stop buys over the plain+ask instruction: plain+ask
T4 *declined* to ask (defensibly — the spec looked pinned), and plain T4 disclosed the axis
post-hoc to no effect. Only the arm that forced a pre-code decision got the human's actual
intent.

Scoreboard for the whole series: **stops changed the delivered behaviour on 1 of 5 tasks
(~20%), cost table §1.** Whether one caught real divergence per ~5 changes is worth a 4–16×
premium is the product question this program now has numbers for.

## 3. What the governed runs actually spent (beyond §1)

- **T2 parked overnight**: S1 stop at 22:46, answered 07:12 via `chaos:resume` — 8.4 h of
  `humanWait`. Never gated, but real: **a governed change can block on a stop for a working
  day**; no plain-family run ever waits. Latency-to-merge is a cost dimension wall clock does
  not carry.
- **M5 fired 4× in the series (T2, T3, T5 + T1 run 1). Zero were real drift.** T2's was a
  *new* parser artefact — a trailing full stop glued to the last path by `parse_scope`
  (the whitespace fix didn't cover punctuation); T3's and T5's second stops were confirmations
  of in-scope work. M5's product-conditions precision is now **0/4**, and each false fire
  costs a human stop plus an `update-scope` tail.
- **Composite failures persist on the new toolkit**: failed governance-CLI calls T2 10 · T3 13
  · T4 3 · T5 6. The `ticked` repair held (zero recurrences). New classes, all the same
  derived-scaffold shape: `verify record: rule R-00x scaffolded but not filled` (all 4 runs),
  the `scopeDrift` derived-overwrite dance whenever M5 fired (T2, T3, T5), a schema-enum
  failure on `checks.scopeDrift.status: ''`, and one outright crash — `chaos-loop error:
  'status'` (KeyError), T3, three calls burned. The intent-echo guard fired 4/4 runs because
  the model **paraphrases** the intent rather than echoing it byte-identically.

## 4. Which cost hypotheses survived the series

- **Fixed entry cost: confirmed.** Governed minimum ≈ 15–16 min regardless of task size; the
  multiplier is a hyperbola in task size, not a constant. The lever target is the floor, not
  the slope.
- **The 16–21 min §9 re-run band: confirmed** (16.1), with all four §9 mechanism predictions
  correct. The two levers' own gates still failed (§`results-T1-all-arms.md` §5) — the win
  came from defect removal.
- **Quality delta: none measurable, again.** Nine oracle-clean deliveries across three arms;
  the only correctness failure anywhere remains the haiku probe. The governed premium buys the
  record and (once in five tasks) a different, human-chosen behaviour — never a more-correct
  implementation on this app.
- **Plain+ask remains the sharp comparator**: 4 material questions, 0 spurious, cost −44% to
  +40% vs plain — and on T4 it shows the boundary of prompt-level governance: an instruction
  can ask, but it cannot make asking *mandatory before code*, and it declined exactly where
  the human turned out to disagree.

## 5. Open items

1. **T5 plain+ask was never re-run** — still void from the contamination; no new session
   exists in demo-plain. The stop-case column for plain+ask stays empty until a `git clean
   -fd`-verified re-run happens.
2. The §3 defect list (scopeDrift dance, rules scaffold, `'status'` crash, paraphrase-echo)
   is the next toolkit repair batch; all are pre-close friction on every M5/verify-owed run.
3. `chaos:sync` follow-ups recorded by T4/T5 answers (architecture + context updates) are
   owed in demo-light and unrun.

## 6. Instrument note (third and final blind spot)

Governed T2 initially read **533 minutes**: `queue-operation` records stamped at the *human's*
morning `chaos:resume` closed the previous evening's turn, dragging 8.4 h of sleep into
`machine`. Same class as the T5-plain tail. Fix (2026-08-05, in `tools/chaos-stopwatch`): human-
action bookkeeping never reaches the timeline, and a turn closes only at a conversation record.
Verified against all 16 transcripts: 10 plain-family and both T1 governed runs unchanged (±6 s,
turn-close now at the last assistant message), T5-plain reads its true 6.1 min directly, T2
governed 28.2 min. All three blind spots shared one root cause: **the instrument assumed a turn
ends where the next prompt begins, and every runtime mechanism that lets a human act without
taking a chat turn broke it** — AskUserQuestion, the Decision Center, queued prompts.
