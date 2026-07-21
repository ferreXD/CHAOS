# Hidden intents — the experimenter's pre-registered guesses (NOT the final ground truth)

These three files are the intents I (the experimenter) sealed **before** the run, guessing what the
maintainer would want. They were the planned mechanized ground truth.

**What actually happened:** the CHAOS arms surfaced the decisions into the **live Decision Center**, and
the **real maintainer answered them** — so the **ground truth for scoring is the maintainer's real
answers**, not these guesses. Per the maintainer's instruction, results are reported against the real
answers, with these pre-registered guesses shown side-by-side.

| Task | Pre-registered guess (here) | Maintainer's REAL answer | Match? |
|---|---|---|---|
| A | reads-public / writes-protected | reads-public / writes-protected | ✅ |
| B | soft / recoverable | `opt-soft-trash` (soft, recoverable) | ✅ |
| C | **never block; retain both** | **`opt-optimistic` (reject stale)** | ❌ **guess was wrong** |

The Task C miss is the experiment's key methodology finding: scoring against the (wrong) pre-registered
guess would have produced a **false, inverted catch**. Only the real human answer corrected it. See
[`../../results.md`](../../results.md) and [`../../task-C-concurrency/`](../../task-C-concurrency/).
