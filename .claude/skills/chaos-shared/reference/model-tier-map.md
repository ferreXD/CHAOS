# Model tier map (L1)

Design of record: `docs/design/2026-08-03-l1-model-tiering.md` (L1-D1..D11; §7 ceiling
amendment). Changing a tier assignment is a **registered design change** (cost-bar doc §5e),
never silent drift.

**The ladder (L1-D3):** *deterministic tool > cheaper model > stronger model.* Work moves as
far down as it can; model tiers exist only for what no tool covers.

## Tiers are relative — the ceiling rule (L1-D9/D10)

**The session model IS the orchestrator and the tier ceiling.** The user's model choice is a
cost-consent boundary: **never spawn a subagent on a stronger model than the session** — a
strict change on a low ceiling runs at that ceiling and records a `confidenceLimiter` naming
it; it never blocks and never silently upgrades. Tiers resolve downward:

| Session (ceiling) | ceiling | mid | floor |
|---|---|---|---|
| Opus-class | opus | sonnet | haiku |
| Sonnet | sonnet | sonnet | haiku |
| Haiku | haiku | haiku | haiku |

A Haiku-only run must still work — that is the robustness policy, not an edge case. The
floor is pinned in the `chaos-mechanical-executor` agent (`model: haiku` — Haiku 4.5, the
**weakest supported model**); the implementation specialist inherits the session (= ceiling);
mid is passed explicitly at spawn time.

## Assignments

**Floor (delegate to the mechanical executor; it never decides):**

- `TRG-*` event transcription from a classifier verdict
- Render repair loop (fix record **facts** per `render.py --check` errors)
- Mechanical audit repairs (missing record re-emission, stale render — never stops)
- Harness telemetry assembly (measurement arms only)

**Ceiling — the grader invariant (never below ceiling, never modulated):**

- Classifier + audit invocation and verdict reading · adjudication pass
- Every stop; ledger `RUN-DEC-*` presentation and answers; audit failures naming a stop
- Judgement prose in records (`assessment`, `whyNotTest`, `verdictRationale`, deviations)
- OpenSpec artifact authoring · self-review verdict (K4) · in-loop verify

The steps that measure difficulty are never downgraded by the difficulty they measure.

**Implementation — ceiling by default; mid while the easy gate is open (L1-D11):**

- **Easy gate open** = zero triggers fired so far AND no preset floor. While open,
  implementation units MAY be delegated at **mid**.
- The gate **closes for the rest of the run** on: any trigger firing (materiality or
  mechanical), an X2 self-review fail, or two failed test cycles. Closed = ceiling; a
  mid-tier unit that hits a failure signal is **redone at ceiling**.
- A mid-tier implementer keeps the full specialist stop-conditions contract — discordance
  (S3) is surfaced to the orchestrator, which owns every decision at ceiling.

**Tool (no model; L3/L4 surfaces):** scan prep, diff scoping, payload assembly, classifier +
audit invocation mechanics, record facts derivation, build/test execution.

## Rules

- **Overhead guard (L1-D7).** Delegate only steps that are (a) validator-gated and (b)
  self-contained as paths + short instructions. If assembling the delegation prompt costs
  more than the step, do it inline — a delegation that inflates total tokens is a map
  defect, not a saving.
- **Escalation (L1-D6, within the ceiling).** Floor: two executor attempts, then the
  orchestrator finishes inline. Mid: a failure signal redoes the unit at ceiling. Never a
  stop, never a governance event; note every escalation in the run's final response. A step
  that escalates persistently across changes is a todo candidate to become a tool.
- **Fidelity is invariant.** Tiering moves *who performs* steps, never what fires, what
  stops, or what is owed. Any fidelity movement is a defect that stops the analysis; an
  oracle regression on a mid-tier arm closes L1-D11 rather than tuning it (L1-D8/§7).
