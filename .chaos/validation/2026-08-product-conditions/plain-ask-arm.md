# The plain+ask arm — separating *asking the question* from *recording the answer*

> Toolkit meta-work (no CHAOS governance). Written 2026-08-04, **after** the three plain T1 runs
> and **before** any plain+ask run. §2–§6 are frozen: the prompt, the answering protocol, the
> predictions and the three named outcomes are never edited to match what happens.

## 1. The gap this arm closes

T1 now has two measured arms and neither isolates the thing under dispute:

| Arm | T1 machine time | Surfaced the `?priority=` matching question? |
|---|---:|---|
| Governed (`chaos:run`, demo-light) | **23.7 min** | **Yes** — [`RUN-DEC-001`](evidence/T1-run1/decision-events.md), pinned as C-004/C-005 |
| Plain (demo-plain, opus-5 high, n=2) | **1.5 min** | **No** — and the two runs silently disagreed on it |

The plain runs proved the question is *real*: run 1 rejected a present-but-empty `?priority=`
with a 400, run 3 treated it as omitted and returned everything — **option A versus option C of
RUN-DEC-001, chosen silently, by the same model at the same effort on the same prompt.**

But the 15.8× gap between the arms is not the price of that question. The governed
implementation phase alone — *after* the decision was answered — is 7.7 min, 5.1× the entire
plain run ([`results-T1.md` §3](results-T1.md)). So the gap decomposes into at least two parts
that no measurement currently separates:

- **asking** — locating a material ambiguity and stopping for a human, and
- **recording** — the contract, the ledger entry, the classification machinery, the artifacts.

**This arm prices the first one.** It is the plain workspace, the verbatim T1 task, and one added
standing instruction to raise material decisions before writing code — no artifacts, no
classification, no ledger. Whatever it costs above the 1.5-minute plain baseline is what asking
costs. Everything above *that*, in the governed arm, is what recording costs.

**It is a third arm, not a plain run.** It never replaces the plain denominator and is never
averaged into it.

## 2. The prompt (frozen — paste verbatim, both paragraphs, as one message)

```text
Before writing any code: if this request leaves a decision that is genuinely mine rather than yours - something you would otherwise settle silently, and that a maintainer might have wanted to settle themselves - ask me about it and wait for my answer. If there is nothing like that, say so and implement it directly.

Add an optional ?priority= query filter to GET /tasks, accepting Low, Medium or High. Omitting the parameter keeps today's behaviour of returning everything. An unrecognised value is a 400. Keep the filtering in the endpoint layer over the existing store.All() result - do not change TaskStore.
```

**The second paragraph is the T1 prompt, byte-identical** to the governed and plain arms — it is
also the stopwatch bookmark (`--from-match "optional \?priority="`). Do not reword it.

### What the instruction deliberately does *not* say, and why

Each of these would have rigged the test:

| Not said | Why |
|---|---|
| Anything about case, empty values, numeric strings, or the query parameter's shape | That is the axis under test. Naming it makes the arm measure compliance, not detection. |
| "Ask me at least one question" | A run that finds nothing material must be free to say so. Forcing a question guarantees a question and destroys the result. |
| Any request for a proposal, contract, report, options table or artifact | This arm prices asking, not recording. Artifacts here would re-import the cost it exists to exclude. |
| Where to look (the endpoint, the enum, the JSON converter) | Locating the ambiguity unaided *is* the capability being priced. |

**One known deviation, on the record:** in the governed arm this instruction is ambient — it
lives in the skill and `AGENTS.md`, not in the user's message. Here it is in the prompt, because
[`plain-workspace.md` §2](plain-workspace.md) forbids putting governance wiring in the plain
tree, and a `CLAUDE.md` would be exactly that. The in-prompt form is if anything *more* helpful
than ambient wiring (it is fresh, adjacent and unmissable), so it biases toward the arm
succeeding — which is the safe direction for a test whose interesting outcome is failure.

## 3. Operator procedure

1. **Fresh session per run, in `D:/Proyectos/CHAOS/demo-plain`**, baseline tree
   (`git status` clean at `02ff26e`) before each.
2. **opus-5 · effort `high` · speed `standard`** — verify all three afterwards in the
   transcript's `effort` and `usage.speed` fields. A run missing the `effort` field is void as a
   sample (this is what disqualified plain run 2 as a denominator).
3. **n = 3.** The plain arm diverged 1-in-3 on exactly this axis; n=1 here would be unable to
   see that.
4. **Archive after every run, before touching the tree** — `git diff > evidence/T1-plain-ask/runN.diff`
   plus the transcript path. Plain runs 1 and 2 were reverted before archiving and had to be
   rebuilt from transcripts; run 3 was rolled back mid-analysis. Do not repeat that.
5. **Close each session with `runs finished`** so the last window has an end boundary.
6. Measure with the instrument outside the workspace:
   `python tools/chaos-stopwatch/stopwatch.py session <transcript.jsonl> --from-match "optional \?priority="`

**The instrument works better here than it did on the governed arm.** A question asked in chat
ends the model's turn and the operator's answer opens the next one, so the thinking time lands
in `humanWait` and never in `machine` — the exact case [`results-T1.md` §8](results-T1.md) flags
as invisible when decisions are answered in the Decision Center instead.

## 4. Answering protocol (frozen)

- **Where the question maps onto RUN-DEC-001, answer the same way the governed run did: option A**
  — case-insensitive matching; a present-but-empty `?priority=` is a 400. This keeps the
  delivered code comparable across arms. Answer in one short sentence; do not add reasoning the
  governed arm's answer did not contain.
- **Where the run asks something else,** answer genuinely and briefly, and record the question
  verbatim. An unanticipated material question is a finding, not noise.
- **Never volunteer the axis.** If a run asks nothing and starts implementing, let it.
- **Contamination, acknowledged:** the operator already knows RUN-DEC-001's answer. That
  contaminates the *answering*, which is fine — the arm measures whether the model **asks**, and
  the answer is held constant on purpose. It does not contaminate the asking, provided the rule
  above is kept.

## 5. Frozen predictions

**Detection — the sharp one:**

- **≥ 2 of 3 runs raise case sensitivity.** It is a visible convention question with a precedent
  in the repo (`JsonStringEnumConverter` already accepts `"high"` on POST).
- **≤ 1 of 3 raises the present-but-empty value.** It is the obscure half, and it is the half the
  plain runs actually split on.
- **No run raises both halves as one bounded decision, the way RUN-DEC-001 did.** *This is the
  prediction I most expect to be wrong about and the one worth the most if it holds.*

**Cost:** **2.5–4 min machine** (1.5 min plain baseline + one question turn + resumption),
`humanWait` excluded and never gated. That is **6–9×** below the governed 23.7 and **4–8×** below
the 16–21 min re-run prediction.

**Selectivity:** plain+ask asks **more** questions than CHAOS did and a **smaller share** of them
are material. CHAOS asked one decision folding two items. Score every question raised as material
(changes what a caller sees, or the repo cannot answer it) or not, and report the ratio.

**Correctness:** C-003 holds 3/3 — both opus plain runs already got the unrecognised-value 400
right unaided, and this arm adds nothing that would break it. C-005 matches the given answer in
every run that asked. **A run that asks the question and then implements the other branch anyway
is the single most damaging outcome available to this arm**, and must be reported first if it
occurs.

## 6. The three outcomes, named before the run

| If | Then |
|---|---|
| **~3 min and the axis is raised** | Decision-surfacing is a **~2× feature**, and the remaining ~13× of the governed gap is the artifact/classification model. The lever plan's target is confirmed and should be widened past the CLI ballet. |
| **The axis is *not* reliably raised (0–1 of 3)** | **Asking is itself the governance value**, not merely recording it. A prompt cannot buy what the framework's materiality machinery produces, and the ≤5 min band-A bar has to be argued against a genuine capability rather than pure overhead. |
| **The axis is raised, but buried in 4+ questions, most immaterial** | The value is **selectivity**, not asking. That reframes the whole program: what CHAOS sells is knowing which questions are worth a human's time, and the metric that matters is question precision, not wall clock. |

All three are publishable. Seven cost hypotheses have died in this program; an eighth is not a
failure.

## 7. Scoring

Reuse the evaluator-written oracle at [`oracles/T1ContractOracleTests.cs`](oracles/T1ContractOracleTests.cs)
— it is independent of every arm and encodes only the prompt's own sentences (three named
priorities accepted, omission returns everything, unrecognised is a 400, including `0`, `99` and
`Low,High`). Drop it into `tests/TaskTracker.Tests/` on a copy of the delivered tree and run
`dotnet test`. It is what caught plain run 2's shipped defect, and it is the same defect class
the governed arm's ceiling tier caught at review.

Per run, record: machine time, `humanWait`, questions asked (verbatim) and their materiality,
whether C-004/C-005 were raised, oracle pass/fail, tests added, and whether the suite was run at
all.

## 8. Status log

- 2026-08-04 — arm defined; prompt, answering protocol, predictions and outcomes frozen.
  **No plain+ask run has happened.**
