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

**Floor / T0 (delegate to the mechanical executor; it never decides):**

- Render repair loop (fix record **facts** per `render.py --check` errors)
- Mechanical audit repairs (re-run the `chaos-record` emitter, re-render — never stops)
- **Mechanical implementation units** — see the band below (L1-D16)

(`TRG-*` transcription moved down-ladder to `chaos-scan` itself — L3-D6, tool beats cheap
model. Harness telemetry is **not** delegable: the arm's schema-validated return value must
come from the arm. Both supersede parts of the original L1-D4 floor assignment; registered
in §5e.)

## The unit band — T0 / T1 / T2 (L1 §8; ask the tool, do not judge it yourself)

**L1-D11's "easy gate" is superseded** — it was change-scoped and latched on the first firing,
so it measured **inert** (0 delegations on 6/6 arms). The band applies **per work unit** and
is recomputed every unit:

```bash
python tools/chaos-scan/scan.py tier --change-dir <dir> \
    --unit-path <file> [--unit-path <file>...] \
    [--covers C-001,C-002] [--acceptance-check "<cmd that must already FAIL>"]
```

It returns `T0` | `T1` | `T2` with the **deciding gate** and a citation. **T2 (ceiling) is the
default and the fallback** — a unit reaches a cheaper tier only by passing every gate.

| Band | Runs at | Reached when |
|---|---|---|
| **T2** | ceiling (you) | anything else — and every judgement step, always |
| **T1** | mid | no fired-trigger surface · no sensitive class at all · no evidence for a statement coupled to a fired surface · budget intact |
| **T0** | floor | all of T1, **plus** file-level paths, under 8 declared files, **plus** Route **A** (an acceptance check exists and currently FAILS — turn it green) or Route **B** (maps 1:1 onto pinned contract statements) |

**After every cheap-tier unit, verify:** full test suite green, build clean, the actual diff
inside the declared files, and the rescan attributes no new firing. On any failure:

```bash
python tools/chaos-scan/scan.py tier --change-dir <dir> --escalate T0|T1
```

which climbs **one rung** (T0→T1→T2), spends one of the budget of **2**, and latches
implementation to ceiling once spent. Escalation is never a stop and never a governance event
— note it in the final response.

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
