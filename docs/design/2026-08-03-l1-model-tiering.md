# L1 — Model tiering (design of record)

> Toolkit meta-work (no CHAOS governance), per [[chaos-develop-toolkit-without-governance]].
> Written 2026-08-03, **before any L1 code**. Execution brief:
> [`2026-08-03-performance-levers-handoff.md`](2026-08-03-performance-levers-handoff.md) §3/L1.
> Sibling design: [`2026-08-03-l2-corpus-amortization.md`](2026-08-03-l2-corpus-amortization.md)
> (built, `7d05572`). Creator decisions of 2026-08-03 are marked **(creator)**; decisions are
> registered in §5e of
> [`2026-08-03-cost-bar-and-run-collapse.md`](2026-08-03-cost-bar-and-run-collapse.md).

## 0. What L1 attacks, and the composition constraint

L1 attacks **price**: run mechanical work on a cheap model, keep the strong model for the
three things the creator reserved to it — **the adjudication pass, the implementation, and
noticing an S3 discordance**. It is the only lever that cuts cost **without cutting tokens**,
so it is invisible to the output-token bar (measured as a diagnostic, like L2).

**The composition constraint this design is built on:** the handoff's mechanical-candidate
list (scan prep, payload assembly, record authoring — ~50–60% of the work) overlaps almost
entirely with what **L3 (`chaos-scan`) and L4 (`chaos-record`) turn into deterministic
tools**. A tool is strictly better than a cheap model: free, deterministic, validator-exact.
Tiering those steps now would price a shape that stops existing within this same build batch.

- **L1-D3 (creator).** The tier map is defined against the **post-L3/L4 composed loop**,
  under the **deterministic-first ladder**: *tool > cheap model > strong model* — work moves
  down-ladder as far as it can go, and L1 covers only the **model-shaped residue**.
  Consequence, stated honestly: the handoff's "~50% blended cost" was a pre-composition
  estimate; L1's own surface is smaller (§4 prediction).

## 1. Architecture (creator decisions)

- **L1-D1 (creator).** **Strong loop, cheap subagents.** The `chaos:run` orchestrator stays
  on the session model. Mechanical steps delegate **down** to a generic mechanical-executor
  subagent on the cheap tier. This fits the only mechanism Claude Code actually has (model
  varies per subagent, never mid-session) and the existing delegation architecture
  (specialists execute, the orchestrator owns decisions — same boundary, lower tier). The
  considered-and-not-chosen alternative (cheap orchestrator delegating *up* for judgement)
  saves more in theory but inverts the architecture and puts stop presentation on the weak
  model; it stays on the shelf unless the measured savings disappoint.
- **L1-D2 (creator).** The mechanical tier is **Haiku 4.5** (`model: haiku` in the agent
  definition, resolving to the current small model, today `claude-haiku-4-5`). This also
  **pins "weakest supported model"** in `model-robustness-policy.md` to a concrete model —
  until now the policy named no model at all.

## 2. The tier map (L1-D4)

Owner column says who performs the step in the composed loop; **tier applies only where the
owner is a model**.

| Loop step | Owner (post-L3/L4) | Tier |
|---|---|---|
| Scan prep, diff scoping, payload assembly | `chaos-scan` (L3) | — tool |
| Classifier + obligation-audit invocation | tools (invoked by orchestrator) | strong (invocation only) |
| Verdict-digest reading | orchestrator | strong (tiny) |
| **Adjudication pass** | orchestrator | **strong (reserved)** |
| **Implementation** (+ S3 discordance noticing) | C# specialist / orchestrator | **strong (reserved)** |
| Record **facts** | `chaos-record` (L4) | — tool |
| Record **judgement prose** (`assessment`, `whyNotTest`, `verdictRationale`, deviations rationale) | orchestrator | strong (small, judgement) |
| Ledger `RUN-DEC-*` presentation + answers | orchestrator | strong (governance) |
| **`TRG-*` event transcription** from the verdict | mechanical executor | **cheap** |
| **Render invocation + repair loop** (fix record fields per `render.py --check` errors) | mechanical executor | **cheap** |
| **Audit repair loop — mechanical failures** (record emission re-run, re-render, missing-file class) | mechanical executor | **cheap** |
| Audit repair — unanswered/unsurfaced stop | orchestrator | strong (governance) |
| OpenSpec delta authoring | orchestrator | strong (it governs implementation) |
| Self-review verdict (K4) | orchestrator | strong (small, judgement) |
| In-loop verify (findings, attribution) | orchestrator | strong (it is a safeguard) |
| Build/test execution | Bash (orchestrator) | — no model work beyond invocation |
| **Harness telemetry assembly** (measurement arms only) | mechanical executor | **cheap** |

Two rules the map lives under:

- **L1-D5 — the mechanical executor never decides.** It executes exactly one named step with
  explicit inputs (file paths + short instructions), runs the **named validator**
  (`render.py --check`, `audit.py`, `digest.py --check`), and returns a structured result.
  It never answers decisions, never authors judgement prose, never touches the ledger's
  answer lines, never widens scope. Same boundary as the C# specialist, one tier down.
- **L1-D7 — the overhead guard.** Delegate only when the step is (a) validator-gated and
  (b) self-contained enough that the delegation prompt is genuinely shorter than doing the
  work. If assembling the handoff costs more than the step, the orchestrator does it inline —
  a delegation that inflates total tokens to save price is scored as a defect in the map,
  not a win.

## 3. Failure handling (L1-D6)

A cheap-tier validator failure is **data, not a defect**: the executor retries **once**
(2 attempts total); on the second failure the orchestrator performs the step itself on the
strong model and continues — never a stop, never a governance event. The escalation is noted
in the run's final response (and telemetry, in measured arms). A step that escalates
persistently across changes is a todo candidate to move it down-ladder into a tool instead.

## 4. Measurement (L1-D8 — same posture as L2-D4)

**The output-token bar stays unchanged.** L1 is priced as named diagnostics next to every
ratio:

- per-arm **tier split**: output tokens on cheap vs strong (per-agent model + usage from the
  transcripts; the workflow driver already supports per-agent model overrides);
- **blended cost**: Σ tokens × published per-model price, reported per arm beside the ratio;
- pre-registered predictions (frozen here, scored in the all-levers run):
  - cheap-tier share of governed output tokens: **10–25%** (the post-composition residue —
    deliberately far below the handoff's pre-composition ~50–60%);
  - blended cost per governed arm: **−10% to −25%** beyond whatever L3/L4 deliver;
  - total output tokens: **unchanged to slightly up** (delegation adds handoff overhead —
    the overhead guard bounds it; more than +5% total tokens means the guard failed);
  - **fidelity unchanged** — same triggers, vector, stops, artifacts; the executor touches
    only validator-gated mechanical surfaces. Any fidelity movement stops the analysis.

## 5. Risks

| Risk | Mitigation |
|---|---|
| Cheap model corrupts a record/artifact silently | Every delegated step is validator-gated (`render.py --check`, `audit.py`); un-gated steps are not delegable (L1-D7a) |
| Delegation overhead eats the savings | Overhead guard (L1-D7); +5% token ceiling in §4; small map by design |
| Executor drifts into judgement (answers a decision, edits prose) | L1-D5 contract + restricted step inputs; judgement fields live in steps that are never delegated |
| Escalation loops (cheap fails forever) | Hard 2-attempt cap, then strong finishes inline (L1-D6) |
| Tier map goes stale as L3/L4 land | The map is a digest-carried reference (§6 step 3); changing entries is a registered design change, not silent drift |
| Haiku alias moves to a future model | `model: haiku` resolves at run time by design; the policy pins the *tier*, the alias tracks the current small model |

## 6. Build plan (order within L1)

1. `.claude/agents/chaos-mechanical-executor.md` — agent definition, `model: haiku`,
   restricted tools (Read, Grep, Glob, Bash, Write, Edit), the L1-D5 contract + L1-D6 retry
   rule in its body.
2. `chaos-shared/reference/model-tier-map.md` — the §2 map + ladder + overhead guard +
   escalation rule, written compactly enough to embed.
3. Digest: add the tier map as a **verbatim** section (tier assignments must not be
   paraphrased) — a section addition is a registered design change per the maintenance
   rules; restamp.
4. `model-robustness-policy.md`: pin "weakest supported model = Haiku 4.5 (the mechanical
   tier, L1-D2)" — source edit ⇒ digest restamp of its compiled section.
5. `chaos-run/SKILL.md`: mark the three delegation points (TRG transcription · render repair
   · mechanical audit repair) + the escalation rule; nothing else in the loop moves.
6. Harness prep note in the eventual kit: per-agent model overrides for executor calls,
   telemetry gains at most a `tierSplit` field — **measure the serialized schema size**
   (Stage-D trap: 6.3 KB died, ≤4 KB works).
7. Register rows in the cost-bar doc §5e.

Acceptance: all suites green · digest `--check` exit 0 after restamps · zero classifier/
corpus changes · the executor agent exists and is referenced only from the three delegation
points · `.github/skills` mirror untouched.

## 7. Amendment — the ceiling model (creator, 2026-08-03, same day, after the first build)

§1–§2 as originally registered used absolute tiers (strong/cheap). The creator amended the
architecture the same day; §1–§6 stay unedited above, this section supersedes where they
conflict.

- **L1-D9 (creator) — the ceiling rule.** The session model **is** the orchestrator and the
  **tier ceiling**: the user's model choice is a cost-consent boundary, and no subagent is
  ever spawned on a stronger model than the session. Never scale up — a strict change on a
  Sonnet session runs strict *on Sonnet* and records a `confidenceLimiter` naming the
  ceiling; it never blocks and never silently upgrades.
- **L1-D10 (creator) — relative tiers.** Map entries resolve against the ceiling and
  collapse downward: Opus-class ceiling → ceiling/mid/floor = opus/sonnet/haiku · Sonnet
  ceiling → sonnet/sonnet/haiku · Haiku ceiling → haiku/haiku/haiku. A Haiku-only run must
  still work — that is the robustness policy, not an edge case. The floor stays pinned in
  the executor agent; the specialist inherits the session (= ceiling); mid is passed at
  spawn time.
- **L1-D11 (creator) — verdict-gated implementation tier.** Amends the §1 reservation
  "implementation = strong" into "implementation = **ceiling by default**". The **easy
  gate**: while zero triggers have fired and no preset floor is set, implementation MAY be
  delegated at **mid**. The gate **closes for the rest of the run** on any trigger firing
  (materiality or mechanical), an X2, or two failed test cycles — closed means ceiling, and
  a mid-tier unit that hits a failure signal is redone at ceiling. **The grader invariant is
  absolute:** classifier/audit invocation, verdict reading, adjudication, stop presentation,
  and ledger answers are never below ceiling — the steps that measure difficulty are never
  downgraded by the difficulty they measure. S3 residual risk, registered: a mid-tier
  implementer notices discordance via the explicit specialist stop-conditions checklist
  (weak-model-safe by policy) with the ceiling orchestrator reviewing every result; if
  measurement shows S3 misses on mid-tier arms, L1-D11 reverts to ceiling-always rather
  than being tuned.
- **Amended prediction (frozen, adds to §4):** band-A governed arms with the easy gate open
  move implementation tokens to mid ⇒ **blended band-A cost −25% to −45%** vs
  ceiling-only; total tokens still ≤ +5%. **Quality gate:** the oracle stays a
  stop-the-analysis gate on mid-tier arms specifically — an oracle regression there closes
  L1-D11, it does not get tuned.
