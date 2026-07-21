# Task C — "stop concurrent edits losing data" → **qualified catch** + the key methodology finding

Under-specified ask: [`../tasks/taskC-concurrent.md`](../tasks/taskC-concurrent.md). Material ambiguity:
**how to prevent lost updates — block conflicting writes, or not?** Your real intent — answered live —
was **`opt-optimistic`** (reject stale writes): [`runtime-decision.json`](runtime-decision.json),
[`runtime-response.json`](runtime-response.json).

| | Surfacing | Choice | vs intent |
|---|---|---|---|
| **Plain** | silently-decided (noted in comments, no human gate) | optimistic via `If-Match`, **mandatory** (missing → `428`, breaking), stale → `412` | **conflict** (on sub-decision) |
| **CHAOS** | asked-and-stopped (`PROP-DEC-001`) → you answered → resumed | optimistic via **optional** `expectedVersion`, stale → `409`, version-less path preserved | **match** |

**Catch = QUALIFIED.** Plain picked the **right strategy** (optimistic) — the axis you actually chose —
and conflicts only on a **sub-decision** it buried silently: making the precondition mandatory (a
breaking change) and using `412` vs `409`. Those sub-requirements ("keep the version-less path", "409")
came from the experimenter's *phrasing* of your answer, not your raw `opt-optimistic` selection — so
this is a real catch on a *silently-shipped breaking change*, not on the headline strategy.

## Why this task is the experiment's most important result

My **pre-registered** hidden intent for C was **"never block writes / retain both"** — which is
**wrong**: you actually wanted optimistic (which *does* block). Had I scored against my guess:
- plain (optimistic = blocks) would be flagged **conflict → a catch** — but for the **wrong reason**
  (wrong direction).
Your **real** answer inverted that: plain's strategy was right; the genuine catch is only the breaking
sub-decision. **A mechanized stand-in intent produced a false, inverted finding that only the real
human corrected** — concrete evidence for §15.1 (the creator can't self-run an unbiased trial) and for
why the value question needs real humans.

Evidence: [`plain.diff`](plain.diff), [`chaos-final.diff`](chaos-final.diff),
[`chaos-decision-events.md`](chaos-decision-events.md), [`answer-given.txt`](answer-given.txt).
