# Performance levers handoff — build L1–L4, then re-measure (for fresh threads)

> **Audience:** the sessions that will implement the four approved performance levers. Everything
> you need to start is in this file plus the four links in §1. Do not re-derive the measurements —
> they are done, committed, and cited below.
>
> **Authority (creator, 2026-08-03):** levers **L1, L2, L3, L4 are approved for build**. **L5 is
> deferred.** **No harness run happens until all four have landed** — the next measurement prices
> them together, not one at a time.
>
> **This is toolkit meta-work: build it WITHOUT CHAOS governance.** No `chaos:propose`, no
> decision runtime, no governance artifacts for the levers themselves. CHAOS runs only inside
> measured arms. Per [[chaos-develop-toolkit-without-governance]].

## 0. Mission

Five stages (A, B, C, C.1, D) attacked the artifact model and the phase march. Both are now
**measured to be minor cost centers**. The Stage-D transcript decomposition (`9a3d08a`) located
the real ones. These four levers attack them on **four different axes** — price, input, reasoning,
output — so they compose rather than compete. Build all four, then re-measure once.

## 1. Reading order (before touching anything)

1. [`2026-08-03-cost-bar-and-run-collapse.md`](2026-08-03-cost-bar-and-run-collapse.md) — §5b
   (the measured outcome + the landing decision), §5c (the Stage-E hypothesis = L3). §1–§2 hold
   the denominator lock and the graduated bar. **Read §5b first; it corrects the diagnosis every
   earlier doc was built on.**
2. [`.chaos/validation/2026-08-stage-d-run-collapse/results.md`](../../.chaos/validation/2026-08-stage-d-run-collapse/results.md)
   — the full Stage-D scorecard, incl. §5, the open defect.
3. [`2026-07-24-artifact-model-roadmap.md`](2026-07-24-artifact-model-roadmap.md) — the A→E arc in
   one page.
4. [`tools/chaos-classify/README.md`](../../tools/chaos-classify/README.md) — the classifier
   contract and its continuous-mode section. **Pinned surface: do not paraphrase it, read it.**

## 2. The measured facts these levers rest on (do not re-derive)

From Stage D, 12 arms, Opus 5, `b31bb10` / `9a3d08a`. Reproduce any of it with
`.chaos/validation/2026-08-stage-d-run-collapse/harness/decompose-output.py <transcript-dir> --sensitivity`.

**Output-token structure of a governed arm:**

| | Governed | Plain | ratio |
|---|---:|---:|---:|
| output tokens (6 arms each) | 273,539 | 51,396 | 5.32× |
| visible (text + tool inputs) | ~39% | ~46% | 4.54× |
| **reasoning** (redacted thinking, billed) | **~61%** | ~54% | **5.98×** |

Robust across 3.0–4.5 chars/token: reasoning stays 54–70% and its ratio stays above the total.

**Deliberation (207 bursts) by what it was for:** classification **machinery 48.3%** (scan prep
22.7 + run classifier 18.4 + payload authoring 7.2) · reading **17.4%** · renderer 8.7% · **all
governance artifacts 12.1%** · audit 2.9% · build/test + code 7.7%.

**Visible output:** authoring 60.2% (of which **records 29.6% of total visible**, implementation
13.5%, ledger 6.0%, classifier payloads 5.4%, OpenSpec 3.0%, ADR 2.7%), Bash 19.0%, harness
telemetry 15.8%, narration 2.8%.

**Input:** **93.4% of everything a governed arm reads is the identical fixed corpus** —
~147,600 chars (~42k tokens) per change. Only 6.6% concerns the change itself. Largest single
read: `phase-facts.schema.json` at ~48k chars per arm.

**Cost baseline to beat:** band A **4.81×**, band B **5.51×** (output tokens, within-session plain
arm). Bars: ≤2.0× / ≤3.0×. Governed absolute vs Stage C: frozen-3 +19.7%.

## 3. The four levers

Build order is a recommendation, not a constraint; L1 and L2 are cheapest and largest.

### L1 — Model tiering (attacks **price**)

**What.** Run the mechanical half of the loop on a cheap tier; keep the strong model for the three
things that need judgement: **the adjudication pass, the implementation, and noticing a
discordance worth stopping for (S3)**.

**Mechanical (cheap tier candidates):** payload assembly, record authoring, render invocation,
scan orchestration, git scan prep, telemetry return, obligation-audit repair loops.

**Why it is the biggest lever.** ~50–60% of the work is mechanical, and this is the only lever
that reduces **cost without reducing tokens** — invisible to every number this program has
produced. Blended cost could fall ~50% with token count unchanged.

**Why the risk is unusually contained.** Every mechanical step already has a deterministic
validator: `render.py --check`, `tools/chaos-classify/audit.py`, and the JSON schemas
(`additionalProperties: false`). A weak model's errors are *caught*, not silently absorbed. The
skills also already carry a model-robustness policy requiring the weakest supported model to be
able to execute them (`chaos-shared/reference/model-robustness-policy.md`).

**Acceptance.** No governance semantics change. Fidelity unchanged (same triggers, same vector).
Audit exit 0. Render `--check` clean. Oracles unregressed.

**Open design question for the builder.** How the tiers are expressed — subagent delegation per
step, or a documented per-step model hint the runner honors. Decide it, write it down, do not
leave it implicit.

### L2 — Amortize the fixed governance corpus (attacks **input**; the only lever that improves with N)

**What.** Two stacked moves against the 93.4%:

1. **Prompt-cache the corpus.** It is stable between governance edits. Cache hits cut that input
   ~90%.
2. **Compile it.** Generate a compact **governance digest** — the rules that actually fire, the
   schema fields actually used, the protocol as a checklist — regenerated by `chaos:sync` when
   sources change, **hash-keyed so staleness is detectable**. This cuts input *and* the 17.4% of
   deliberation spent reading and re-deriving.

**Specific target.** `phase-facts.schema.json` at ~48k chars/arm is the largest single read. A
schema consumed in full on every change is a design smell — replace it with a **generated example
record + the validator**, so the agent pattern-matches instead of parsing a spec.

**Why it matters at scale.** Converts a per-change cost into a per-repo-change cost: savings
approach (N−1)/N over N changes. Every other lever is a fixed percentage; this one compounds.

**Risk + mitigation.** Staleness ⇒ governance drift. Hash-key the digest to its sources, fail
closed when the hash mismatches, and regenerate via `chaos:sync` (which already exists). **Never
let the digest become the source of truth** — it is a projection, like `change.md`.

### L3 — Protocol mechanization (Stage E; attacks **reasoning**)

**What.** One deterministic `chaos-scan` wrapper owning what the agent currently reasons through
by hand: `git add -N` + the C-15-scoped diff, payload JSON assembly from `change.md` + state, the
scan → `adjudicationDue?` → merge sequence, and a **verdict digest** the agent reads instead of
raw JSON. What remains for the agent is the one thing only a model can do — the adjudication
judgement, when the tool says it is due.

**Already pre-registered** in §5c of the design doc, including its prediction. Do not re-open the
prediction; it is frozen.

**Risk + mitigation.** The wrapper could hide the evidence the adjudication needs. The verdict
digest **must carry the citations and the candidate/demoted surface** — raise-only adjudication
with mandatory cites (C-6/C-12) is non-negotiable.

**Hard constraint.** L3 moves *who performs mechanical steps*, never *what is decided*. Same
triggers, same dimensions, same stops, same audit.

### L4 — Derive records instead of authoring them (attacks **output**)

**What.** Records are 49% of all authoring bytes and ~29.6% of visible output — the largest
visible cost center. Most of it is mechanically derivable: build/test results from the tool
output, `files`/`coverage` from `git diff`, `rules` from the classifier verdict. The agent is
currently hand-transcribing tool output into JSON.

Build a `chaos-record` emitter that produces the **facts**, leaving the agent only the
**judgement prose**: `assessment`, `whyNotTest`, `verdictRationale`, `deviations` rationale.

**Complementarity.** L3 attacks the thinking; L4 attacks the writing. They touch the same loop
steps and should be designed together even if landed separately.

**Risk + mitigation.** Losing the honesty fields. `whyNotTest` and the coverage-honesty table
exist to make weak evidence visible — **derive the facts, never the judgement.** If the emitter
cannot derive a field, it must leave it empty for the agent, not guess.

## 4. Deferred / not in scope

- **L5 incremental scan cadence** — deferred by the creator. It recovers Stage D's +19.7%
  (3 diff scans vs 1) by scanning the delta and rescanning on meaningful surface growth rather
  than per work unit. When it is taken up, the fidelity risk to watch is **late M5 spill and M1
  re-check detection**.
- **The `--standard`/`--strict` preset floor vectors** and **X1's numeric thresholds** (MR-5:
  8 files / 400 LOC) remain uncalibrated. Still PROPOSED, NOT APPROVED.
- **Band C** (multi-surface / breaking) has never been reached; its ≤4× target is extrapolation.

## 5. Open defect to fix first (small, blocks a validation)

**`RESOLVED-IN-ARM` is invisible to the classifier.** It is first-class in
[`render.py:225`](../../tools/chaos-render/render.py#L225), in
`tools/chaos-render/schema/decision-entry.schema.json`, and in `change-template.md:169` — but
[`classify.py:176`](../../tools/chaos-classify/classify.py#L176) computes `answered` as
`re.search(r"-\s*status:\s*ANSWERED", block)`. So `RESOLVED-IN-ARM` (and `RECORDED`) read as
**unanswered** in the obligation audit's stop gate, MR-3 stop satisfaction, and Stage-D
pending-stop absorption.

All six Stage-D arms hit it and independently invented the same dual-status workaround, which is
why the absorption 0/6 result is marked **UNVALIDATED** — the mechanism never met its real
trigger.

**Fix:** widen the predicate + regression test. **0 of 29 corpus seeds use either status, so no
expectation moves** — but confirm that yourself before touching code (§6).

## 6. Non-negotiables (standing, inherited — these have all bitten before)

- **Corpus discipline.** If a change moves any pre-registered expectation in
  `.chaos/validation/2026-08-stage-c-classifier/`, the **expectation change is committed FIRST**,
  with a dated changelog entry stating the cause, **before** the code that motivates it. Never
  edit an expectation to make an implementation pass.
- **Pre-registration.** Before the eventual harness run: per-task classification expectations and
  cost predictions are frozen and committed **before any arm launches**, and never edited to match
  results. **Do not carry a prior stage's verdicts forward blindly — that error cost Stage D three
  of six fidelity rows** (§3 of the Stage-D kit registered M4's pre-C-16 behaviour after C-16 had
  already shipped).
- **Report results as found.** Five cost hypotheses have died in this program. A negative result
  is a valid outcome and gets written up as one.
- **Base every measurement worktree on `d27600f`.** Never the `demo/dotnet` tip (`df26104` ships
  JWT auth + 34 tests and invalidates task 1 and every oracle), never `main`.
- **Plain-arm prompts stay byte-identical.** Lift them programmatically with
  `.chaos/validation/2026-08-stage-d-run-collapse/harness/build-workflow.py` (it prints sha256
  fingerprints); never retype them. Plain worktrees get **no staging**.
- **RUNKIT is append-only.** New dated row in
  `.chaos/validation/2026-07-ea-v2/ea-x2-with-without/harness/RUNKIT.md`; never overwrite a row.
- **Quality is a stop-the-analysis gate.** Oracles must stay clean (19/19 frozen-3, 16/16
  light-3, both arms). A cheaper governed arm that breaks the oracle is a defect, not a result.

## 7. The metric question — settle it before the next run

Every number in this program is **output tokens**. The goal ("~3× baseline") was never
operationalized as money or wall time. **L1 and L2 are largely invisible to the token metric** —
tiering changes price per token, caching changes input, and the existing bar counts neither.

**Recommendation for the creator:** re-base the bar on **blended cost + wall time**, keeping
output tokens as a secondary diagnostic. Optimizing tokens has now aimed this program at the wrong
target twice. This is a decision, not an assumption — do not silently change the metric; get it
agreed and record it in §1/§2 of the cost-bar doc.

## 8. What the eventual run looks like (not yet — after all four land)

Reuse the Stage-D kit wholesale: same 6 tasks, same bands, same oracles, same 12-arm shape,
`harness/setup-stage-d-worktrees.sh` + `build-workflow.py` + `score-arm.sh` +
`archive-evidence.sh` + `attribute-arm.py` + `decompose-output.py`. New kit folder, new
pre-registration, new dated RUNKIT row.

**Two traps from the last run:**

1. **The telemetry schema has a hard size ceiling.** Stage D's first launch was rejected outright
   — all 12 arms failed in 37 ms with *"output schema too large to classify safely"* at 6.3 KB
   serialized. Step-5's working schema was 4.0 KB; the fixed one was 3.6 KB. **Measure the
   serialized JSON, not the source** — factoring the schema into shared `const`s shrinks the
   source and changes the serialized size not at all.
2. **Plain-arm variance between sessions is large** (P2: 10,630 → 16,176 tokens for identical
   work). That is why the denominator is locked to the **within-session** plain arm and why the
   **governed absolute** is reported next to every ratio.

## 9. Where to record what

- Per-lever design decisions → a register table in
  [`2026-08-03-cost-bar-and-run-collapse.md`](2026-08-03-cost-bar-and-run-collapse.md), in the
  style of the §5b landing table.
- Classifier/audit behaviour changes → `tools/chaos-classify/README.md` + unit tests
  (`test_chaos_classify.py`, `test_chaos_audit.py`) + the corpus if any expectation moves.
- Loop changes → `.claude/skills/chaos-run/SKILL.md`. Note the `.github/skills` mirror is one
  stage behind (last synced at Stage-B) and `chaos-run` was intentionally not mirrored; decide
  deliberately whether to sync it, do not do it by accident.
- Anything measured → its own kit under `.chaos/validation/`, plus the RUNKIT row.
