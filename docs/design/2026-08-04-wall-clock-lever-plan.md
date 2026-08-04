# Wall-clock lever plan — four options, grounded in the measured loop

> Toolkit meta-work (no CHAOS governance). Written 2026-08-04, after the round-trips-vs-tokens
> question was resolved from archived transcripts: **model_time ≈ ~2 s fixed/call +
> ~0.0109 s/token (~92 tok/s), R² 0.87–0.94 across every opus-5 run** — token-proportional
> generation is 75–82% of model time ≈ 60–65% of wall clock; fixed round-trips ~12–16%; tool
> execution ~20–25%. Generated **volume** is the clock. Fast mode is excluded as a lever by
> creator decision (recurring 2× spend; speeds the plain arm equally) and retained only as a
> one-off falsification experiment.

## 0. The shape of the waste, from T1's actual transcript

The 23.7-minute product run issued **22 governance-CLI invocations**. The frame alone
(0.1 → 4.8 min) was eight: `digest --check` → `scan k1 --help` → `scan k1` → `scan merge` →
`record frame --help` → `record frame` → `render --check` → `render --write`. The close
(20.6 → 23.1 min) was seven more, plus `audit.py`. Three of the 22 were **`--help` calls** —
the model re-discovers the CLI surface every run. Each arrow between invocations is a
deliberation burst: 43–48% of deliberation bursts precede classification machinery
(decompose-output, lever run 1), and the API calls issuing governance CLIs carry 15–19% of
governed output tokens. Workflow arms show the same shape at 16–39 CLI invocations per arm,
growing run over run.

The loop's **genuine model-judgement points** are few: intent/scope/subjects (arguments),
adjudication raises (judgement, cites mandatory), record judgement fields and contract
statements (prose), the self-review verdict (constrained `clean|fail`), and coverage rows on
the deliver record. Everything else the model does between CLI calls is choreography.

---

## Option 1 — Consolidate the ballet: `frame` / `close` composites

**What.** Two composite commands (new thin composer, e.g. `tools/chaos-loop/loop.py`,
importing the existing tools' functions directly — never shelling out):

- `loop frame --intent … --scope … --subject … [--mode …]` → runs digest-check + k1
  internally, returns **one consolidated frame packet** (verdict digest, adjudication-due
  packet if any, record scaffold, contract template).
- Model does **one** deliberation: authors a single input file — adjudication raises (with
  cites) + contract statements + frame-record judgement fields.
- `loop frame-commit --input <file>` → merge + record frame + render `--write` (check folded
  in) + prints the S1 stop presentation. Fails closed on any cite-less raise, exactly as
  `merge` does today.
- `loop close --self-review clean|fail --build-log … --test-log …` → rescan + k4 + deliver
  scaffold, returns **one close packet**. If the rescan fires anything new, close **aborts**
  and reports — back to the work loop, fail closed.
- Model fills coverage rows + judgement in one step; `loop close-commit --input <file>` →
  deliver finalize + `audit.py` + render `--write`.

Frame: 8 invocations → 2. Close: 7–8 → 2. Model-visible governance steps per change: ~15–22
→ ~4–5. The `--help` problem disappears with the surface.

**What does NOT change — the fidelity contract.** Every internal step still persists its own
`scan/verdict-<seq>.md` and packet; TRG-* events are appended identically; the artifact set is
byte-identical. This is testable: **the parity gate is that old path and new path on the same
fixture produce identical `.chaos/` artifacts** (timestamps excluded). The composite changes
the *call surface*, never the record. L3's lesson is honored by construction: fewer
model-visible steps, zero removed verdicts.

**Expected effect.** Removes ~13–17 round-trips (~2 s each) plus their inter-step deliberation.
If half the machinery deliberation collapses: ~8–12% of wall clock, plus RT/exec trims →
**2–3 min/change** (I'm narrowing my earlier 2–4 estimate; the top end assumed more
deliberation is step-adjacent than the burst attribution strictly proves).

**Falsification (pre-register before any arm runs).** Frozen-3 trio, governed + plain, same
toolkit otherwise. Gates: oracle 19/19; artifact parity vs a baseline arm; governance-CLI
invocations ≤ 5/arm. Direction tests: output tokens −15% or better on governed arms; wall
clock −2 min or better per change. If tokens don't fall, narration volume is a style constant,
not per-step — the option dies and the finding matters.

**Build cost & sequencing.** The main build of this phase. Skill edit replaces §1/§5 command
blocks with the two composites; the granular commands remain for the phase commands
(`chaos:propose` etc.), untouched.

---

## Option 2 — Zero-trigger short-circuit (proportional frame)

**What.** When the k1 verdict is `fired: none`, every dimension at floor, `openspec 0`, and
no preset floors, the frame packet marks `shortCircuit: eligible` — **the tool decides
eligibility, never the model** (constrained choice; requesting it on a fired verdict is an
error — fails closed, the fifth silent-loss trap pre-empted). When eligible:

- **S1 still stops.** C-11's unconditional frame-approval stop is the product's core loop and
  is not touched. What changes is what is *authored before* the stop: instead of
  contract.json + frame record + two renders, the stop presents intent + verdict + a short
  contract **inline in the decision text**, and the artifact writes are deferred to close,
  where the close composite emits them from state (safe because L4 made records derived:
  facts from `classification-state.json`, judgement = the approved contract statements).
- If **any** trigger fires at any later scan, the existing rule already governs: artifacts are
  authored at the firing, before the surface is implemented further. The audit gains one
  assertion: a short-circuited change must have its deferred artifacts present at close, and
  must have authored them at-the-firing if anything fired. The audit asserts; it never authors.

**What it owes the creator.** This amends the S1 authoring rule ("author contract.json +
frame record, render, then stop") for the zero-trigger case only. **That is a creator
decision, not mine to make** — the four silent-loss traps all came from changing what
governance is owed without a constrained choice. The design above is the proposal; it ships
only with sign-off.

**Expected effect.** T1's frame was 9.3 min with 39% before any code; the zero-trigger frame
drops to k1 + one inline stop ≈ 1.5–2 min, with ~1 min of deferred writes reappearing at
close inside the close composite. **Net ~2–3 min on band A** — I'm revising my earlier 3–4
down; the honest number depends on how much frame deliberation migrates to close, which is
exactly what C-10's ~1.4% token result warns about. The difference this time: C-10 was
measured on tokens with a shallower cut; this defers the *authoring work itself* and is
measured on the clock.

**Falsification.** Band-A arms only (B2/B3 + product T1/T4). Gates: audit passes; artifact
set at close byte-equivalent to the non-short-circuit path; any fired-trigger run must show
authoring at the firing. Direction test: band-A mean falls by ≥ 2 min *and* the band-A/band-B
gap widens — this is the one lever aimed at the flat curve, so the curve is the metric.

**Sequencing.** After option 1 lands — it rides on the composites (the inline stop is a
`frame` output mode; the deferred writes are a `close-commit` flag).

---

## Option 3 — Effort trial: high → medium

**What.** No build. One workflow run: frozen-3, governed + plain, `opts.effort: 'medium'`,
toolkit tip otherwise identical to the option-1 baseline. Thinking is ~52% of governed output
(estimated — thinking blocks are redacted; subtraction method), and plain arms reason at ~56%
too, so this is model style, not governance need. Effort is the direct dial on it.

**Gates (pre-registered):** oracle 19/19; **classifier-verdict equality** — the deterministic
verdicts must be identical, and the model-judgement surfaces (adjudication raises, stop count,
folds, contract statements) are diffed against the baseline arm and any divergence is reported
as a finding, not tuned away; renders validate. A verdict flip or oracle miss closes the route
(L1-D11 precedent).

**Expected effect.** Unknown by design — that's why it's a trial. If medium halves thinking:
~25% of output ≈ ~15% of wall ≈ 2–3 min on band A. The run-1↔run-2 comparison (high vs xhigh,
≈ no delta) suggests saturation at the top; downward is untested. Wide error bars are the
point.

**Cost.** ~2 hours of workflow time, zero build. **Record the effort level in the kit** — the
unrecorded xhigh on lever run 2 is the cautionary tale.

---

## Option 4 — Batching and tool-exec trims

**What.** Three small pieces, all bounded now that the fixed round-trip cost is known to be
~2 s (not ~12 s):

1. **Batch independent tool calls** — skill guidance to issue independent reads/writes as
   parallel tool calls in one API call. Ceiling = fixed-RT share ≈ 2.2–2.8 min/change;
   realistic capture ~1–1.5 min. Note: option 1 removes most governance-call batching
   opportunities; what remains is implementation-phase reads and artifact writes.
2. **Test-run consolidation** — full suite once per unit verify + once at close unless red
   (T1 ran 5–6 invocations; arms run 3.5–6.3). The close audit still gates on a green run, so
   quality holds by construction. ~0.5–1 min.
3. **Interaction-runtime cold starts** — the 3 `npx tsx` invocations each pay a node+tsx
   compile start. Measure before building; a precompiled entry point is the likely fix if it
   matters.

**Sequencing.** Re-measure after option 1 lands, then build only what is still visible. Much
of option 4's surface lives inside option 1.

---

## Order of work

| # | Item | Cost | Depends on | Expected |
|---|---|---|---|---|
| 1 | **Plain T1–T5 product sweep** (denominator; kit `plain-workspace.md`) | ~30 min run | its own session, nothing heavy concurrent | the missing baseline |
| 2 | **Option 3 effort trial** | ~2 h run, no build | not concurrent with #1 (CPU + rate-limit contention) | ±, gates decide |
| 3 | **Option 1 composites** | the main build | — | −2–3 min/change |
| 4 | **Option 2 short-circuit** | small build | #3 + creator sign-off on the S1 authoring amendment | −2–3 min band A |
| 5 | **Option 4 residue** | small | re-measure after #3 | ≤ −1–1.5 min |

Concurrency note for #1/#2: serving speed does not degrade at this scale (the archived runs
generated on ~10 concurrent agents at a stable ~92 tok/s), but org rate-limit throttling shows
up in a transcript as a silent gap the stopwatch reads as machine time, and local
`dotnet build/test` contention inflates plain arms specifically — in the flattering-to-CHAOS
direction. Run measured arms alone; light interactive work elsewhere is fine.

Combined, honestly stated: options 1+2+4 target **roughly 4–6 min off a band-A change**
(15.0 → ~9–11 min), before whatever option 3 adds. That does not reach the ≤5 bar by itself;
it re-opens the question with the Stage-A existence proof (~20k tokens/change fully governs
the frozen tasks) as the volume target. Every number above is a pre-registered prediction to
be shot at, on a program that is 0-for-7 on plausible levers.
