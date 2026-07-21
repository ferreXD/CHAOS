# Task B — "let people get rid of tasks" → **no catch** (model guessed intent)

Under-specified ask: [`../tasks/taskB-delete.md`](../tasks/taskB-delete.md). Material ambiguity:
**permanent (hard) or recoverable (soft) delete?** Your real intent — answered live in the Decision
Center — was **`opt-soft-trash`** (soft, recoverable): [`runtime-decision.json`](runtime-decision.json),
[`runtime-response.json`](runtime-response.json).

| | Surfacing | Choice | vs intent |
|---|---|---|---|
| **Plain** | silently-decided (no flag at all) | soft delete + `/restore` + trash view | **match** |
| **CHAOS** | asked-and-stopped (`MD-001`) → you answered → resumed | soft delete to Trash + `/restore`, hard-delete kept but unwired | **match** |

**Catch = NO.** The capable model, unaided, correctly inferred that "make delete solid for our users"
means *recoverable* — matching what you actually chose. Governance still surfaced the decision and
gave you the choice + a traceable record, but it **prevented no error** here. This is the honest
counter-case: under-specification does not *guarantee* governance a catch; the model often guesses the
product-right answer.

Evidence: [`plain.diff`](plain.diff), [`chaos-final.diff`](chaos-final.diff),
[`chaos-decision-events.md`](chaos-decision-events.md), [`answer-given.txt`](answer-given.txt).
Pre-registered guess (soft) **matched** your real answer here.
