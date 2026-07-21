# EA-X2b results — under-specified counterfactual

> **Caveats (carried from EA-X2 + new).** Same model both arms; tasks maintainer-authored. **New:**
> the "human" answering the governed decisions is the **real repo maintainer** answering in the
> **live Decision Center** — so this is a *partial real human-in-the-loop*, stronger than a
> mechanized stand-in, but n=3 and the maintainer is the creator (§15.1 self-trial bias remains).
> The CHAOS arms engaged the **live** interaction runtime; those runs were resumed out-of-band in
> isolated worktrees for scoring and the live runs were then **cancelled** (locks released, decision
> artifacts preserved). Scoring for delete/concurrency is **judge-assessed** (arm-chosen interfaces);
> only auth is oracle-objective.

## Headline

**Where the pinned-contract [EA-X2](../ea-x2-with-without/) found 0 catches, the under-specified
EA-X2b found governance's value *does* appear once the task is ambiguous — but it is bounded, and
it cost ~4.8×.**

- **Surfacing (governance's core R-001 claim): CHAOS 3/3, plain 0/3.** Every CHAOS arm refused to
  guess the material decision and **stopped for the human**; no plain arm did (2 buried the choice
  as a "noted assumption" in code comments, 1 fully silent — the judge classified all 3 as
  *silently-decided*: a choice shipped with no human gate).
- **Catches attributable to CHAOS: 1 clear (Task A) + 1 qualified (Task C) of 3.** On Task B the
  capable model guessed the maintainer's intent correctly, so governance added surfacing/traceability
  but **prevented no error**.
- **Cost: 4.83× wall-time, 4.33× output tokens** (CHAOS runs two passes: surface → human answer →
  resume).

## Scorecard (ground truth = the maintainer's REAL Decision-Center answers)

| Task | Plain surfacing | Plain choice vs intent | CHAOS surfacing | CHAOS choice vs intent | **Catch?** |
|---|---|---|---|---|---|
| **A — secure** | silently-decided | **conflict** (locked reads) | asked-and-stopped | match (reads-public) | **YES** |
| **B — delete** | silently-decided | match (soft) | asked-and-stopped | match (soft-trash) | no |
| **C — concurrency** | silently-decided | **conflict** (breaking, 412) | asked-and-stopped | match (back-compat, 409) | **YES\*** |

\* **Qualified.** Plain picked the right *strategy* (optimistic concurrency) — the material axis the
maintainer actually chose — and only *conflicts* on a **sub-decision**: it made the version
precondition **mandatory** (missing → `428`, a breaking change removing the version-less path) and
used `412` not `409`. Those sub-requirements ("keep the version-less path", "409") came from the
experimenter's **phrasing** of the answer, not the maintainer's raw selection (`opt-optimistic`). So
C is a real catch *on a silently-buried breaking sub-decision*, but not on the headline strategy.

### Objective anchor (Task A auth-scope oracle, interface-independent)

| | reads public? | writes protected? | oracle |
|---|---|---|---|
| **plain** | ❌ 401 on `GET /tasks` (locked) | ✅ | **4/6** |
| **CHAOS** (post human-answer) | ✅ 200 on `GET /tasks` | ✅ | **6/6** |

The governance loop turned a wrong silent decision (reads locked, breaks the status page) into the
intent-aligned outcome — **oracle-verified**, not just judged.

## Cost (time self-reported; tokens = `budget.spent()` output-proxy)

| Task | CHAOS time (p1+p2) | plain time | ratio | CHAOS out-tok | plain out-tok | ratio |
|---|---:|---:|---:|---:|---:|---:|
| A | 1104 s (687+417) | 225 s | 4.91× | 114,533 | 19,164 | 5.98× |
| B | 1337 s (780+557) | 243 s | 5.50× | 103,491 | 19,799 | 5.23× |
| C | 950 s (558+392) | 234 s | 4.06× | 96,706 | 33,802 | 2.86× |
| **Σ** | **3,391 s** | **702 s** | **4.83×** | **314,730** | **72,765** | **4.33×** |

## The methodology payoff: real answers vs the experimenter's pre-registered guesses

You chose "report both." Here is where my sealed hidden intents (the mechanized stand-in) matched or
missed your **real** Decision-Center answers:

| Task | My pre-registered guess | Your real answer | Match? | Effect on the finding |
|---|---|---|---|---|
| A | reads-public | reads-public | ✅ | catch stands either way |
| B | soft-delete | soft-trash | ✅ | no catch either way |
| C | **never-block / retain** | **optimistic / reject-stale** | ❌ | **my guess was wrong** |

**This is the single most important result of the experiment.** Had I scored Task C against my
pre-registered intent ("never block writes"), the plain arm — which *blocks* (optimistic) — would
have been flagged a **catch for the wrong reason** (wrong *direction*). Your real answer revealed
that (a) the plain arm actually got the *strategy* right, and (b) the genuine catch is only the
silently-buried *breaking-change* sub-decision. A mechanized stand-in intent produced a
**false, inverted** finding that only the real human corrected — direct evidence for §15.1's claim
that the creator cannot run an unbiased with/without on themself, and that the value question needs
**real humans**, not agent-invented intents.

## What this means for the value claim (vs EA-X2's null)

- **EA-X2 (pinned contracts): 0 catches** — with the decision pre-made, the capable model shipped
  correct code and governance had nothing to catch.
- **EA-X2b (under-specified): governance surfaced the material decision every time (3/3) that the
  plain arm silently guessed (0/3), and 1–2 of those silent guesses conflicted with real intent.**
  So the pinned-contract design *did* structurally hide governance's value — confirmed.
- **But the value is bounded, not a blanket win:**
  1. On Task B the unaided model guessed intent correctly → governance bought traceability, not
     error-prevention.
  2. The clear catch (A) is a *scope* error; the second (C) is a *qualified* sub-decision catch.
  3. It cost **~4.8× time / ~4.3× tokens**.
  4. Governance's job here is **surfacing for a human**, not being *right*: on Task A the CHAOS arm's
     own *recommendation* was the wrong (lock-reads) option — its value was **stopping so the human
     could choose**, which is exactly R-001.

**Net:** governance's marginal value is real and shows up precisely where EA-X2 was blind — on
**under-specified, decision-bearing** work — as reliable *decision-surfacing* that catches silent
wrong guesses, at a material time/token cost, and only when the human actually holds a different
intent than the model's guess. This strengthens the case for CHAOS on genuinely ambiguous strict-risk
work and **still routes the "is it worth the cost" question to a real, multi-subject human trial**
(EA-X2 proper / EA-D3), since n=3 with the creator-as-maintainer cannot settle it.

## Report-back line (for `results-summary.md`)

> **EA-X2b (under-specified, n=3, partial real human-in-the-loop):** surfacing CHAOS 3/3 vs plain
> 0/3; catches attributable to CHAOS = **1 clear (auth scope, oracle-verified 4/6→6/6) + 1 qualified
> (concurrency breaking sub-decision)** of 3; Task B no catch (model guessed intent). Cost **4.83×
> time / 4.33× tokens**. **Governance's value appears under ambiguity where pinned-contract EA-X2 was
> blind — as reliable decision-surfacing — but is bounded and costly.** Key methodology finding: the
> experimenter's pre-registered intent for Task C was *wrong* and would have produced a false inverted
> catch; only the real maintainer's answer corrected it → value question still needs a real human
> trial (EA-D3).
