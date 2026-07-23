# Artifact-model refactor roadmap — A → B → C

> Toolkit meta-work (no CHAOS governance). Outcome of the 2026-07-22/24 design review in which the
> assistant was asked to drop the sugarcoating and stress-test the light-mode design. The three
> stages are a **sequence, not rivals**: each stage's outputs are the next stage's inputs. Companion
> docs: [`2026-07-22-light-mode-workflow.md`](2026-07-22-light-mode-workflow.md) ·
> [`2026-07-22-light-mode-per-command.md`](2026-07-22-light-mode-per-command.md) · evidence:
> [`../perf/2026-07-22-ea-v2-cost-attribution.md`](../perf/2026-07-22-ea-v2-cost-attribution.md).

## Decisions register (who decided what, so future sessions don't relitigate)

| Decision | Call | By |
|---|---|---|
| Two-phase collapse (FRAME → DELIVER) | adopted | both |
| `change.md` = universal per-change narrative; modes scale depth, not files | adopted | creator idea, assistant endorsed |
| **OpenSpec artifacts kept in ALL modes, including light** | **kept, "at least for the moment"** — revisit at Stage B (the conditional-delta question and the cognitive-load tension are recorded, not resolved) | **creator overrule** (assistant argued conditional delta) |
| `lifecycle.md` | state moves to `change.md` **frontmatter** (machine-readable phase block); `lifecycle.md` survives as a **generated view** (rendered, never hand-maintained; hand-written 10-line stub only until the Stage-B renderer exists) | agreed 07-24 (creator conceded the drift point) |
| Entry points | `chaos:propose --light` = FRAME only (never writes production code); **`chaos:apply` = DELIVER entry under its own command identity**, mode **inferred from `change.md`** (explicit `--light` optional); `chaos:resume` = its normal mid-flight job only, **not** a deliver-router | creator correction, assistant endorsed — dissolves the "propose that implements" naming smell and keeps today's session model (two linked runs on one changeId) |
| Escalation-valve fidelity must be measured, not assumed | adopted — seeds in the measurement plan (below) | assistant push, accepted |

## Stage A — Collapsed two-phase lifecycle (ship now)

What the two 07-22 docs describe, hardened by the review:

- `chaos:propose --light`: FRAME — scoped scan, OpenSpec set, `change.md` (intent + contract +
  review line), lean decisions (`approves-change` marker), capsule `nextStep: deliver` → **stop**.
- Human answers in the Decision Center (answering = approval).
- `chaos:apply` (vanilla; mode inferred from `change.md` frontmatter): begins its own run, validates
  the decisions are answered (else points at the Decision Center and stops), administratively closes
  the answered propose run, executes DELIVER — implement to contract, validate, dashboard,
  terminalize. The propose→apply link is the changeId + contract hash, exactly like standard mode.
- Escalation valve one-way to standard; warn on dashboard; `escalatedFrom` recorded.

**Definition of done for A:** measured against the frozen EA-X2 harness
(`.chaos/validation/2026-07-ea-v2/ea-x2-with-without/harness/`, baseline 3.94×/4.75×) **plus the
valve-fidelity seeds**:

- cost: ≤2× time, artifact-prose ≤15% of governed output, oracle 19/19, zero decision loss;
- **valve fidelity (new):** a known-should-escalate seed (posture-crossing change, e.g. EA-X2b's
  auth task) must escalate; a known-should-stay-light seed (small non-posture change) must not.
  Under-detection = governance bypass; over-detection = light is a lie. Both directions tested.

**A's structural obligation to B:** every `change.md` section and record (contract statements,
decision entries, delivery facts, escalation events) is defined as a **strict structured format** —
so Stage B is a renderer away, not a redesign.

## Stage B — Decision-ledger-first: artifacts as projections (the destination)

**The inversion:** agents stop *writing* narrative artifacts. Agents emit only **structured
records**; every human-readable artifact is **rendered mechanically** from the sources of truth.

### What agents write (tiny, data-not-prose)

| Record | Content | Where it lives |
|---|---|---|
| decision entries | question/options/recommendation/answer/status/confidence (+`approves-change`) | runtime + ledger (as today) |
| contract | testable statements (checklist data) | `change.md` §Contract seed / frontmatter |
| delivery-facts | files changed, tests run/passed, checks (R-003/4/5), deviations — as data | appended structured block |
| escalation events | trigger, from→to, timestamp | ledger |

### What the renderer produces (deterministic tool, no LLM)

`chaos:render <changeId>` (and auto-render at phase transitions): projects **`change.md`** (the
story), **`lifecycle.md`** (the state view), and index/dashboard views from: runtime session +
decision state + the ledger + git diff stats + delivery-facts. Idempotent; stamps `chaosMetadata`
mechanically (metadata-hook integration); regenerable at any commit.

### Why B is worth the build (and its honest costs)

- **Prose cost → structurally ~0** — not "smaller", *gone*. The 45.5% cost center is eliminated,
  not compressed; A only gets ~4×→~2×, B is the only path toward ~1×.
- **Prose cannot drift from truth** — it *is* a projection of the runtime + ledger. This is
  "the runtime is the source of truth" taken to its logical end, and the same
  mechanical-assembly philosophy as the step-context capsules (perf doc §capsules) — one design
  language for both.
- **Cognitive load:** humans read one generated file; nobody maintains it. PR review = one diff.
- **Costs, honestly:** renderer + record-schema build and tests (real tooling investment, in
  `tools/chaos-interaction-*` territory); generated prose is drier than authored prose; the
  renderer becomes a correctness-critical component (needs its own test suite); OpenSpec question
  resurfaces here (creator kept it — at B, evaluate whether spec deltas also become
  records+projection or stay authored).

### Migration A→B

A's skills write `change.md` per the strict formats → B swaps the *writer*: skills emit the records,
the renderer writes the file. Skill prompts shrink (no artifact-authoring instructions at all).
`lifecycle.md` flips from hand-stub to rendered view (already the agreed end-state). No layout
change for readers — sync/verify/todo parse the same file they parsed in A.

## Stage C — Progressive rigor: modes become presets (the eventual UX)

Kill modes as a user-facing concept. Every change starts at the light base (contract + decisions +
implement); **rigor accumulates automatically** as triggers fire (blast radius, decision count,
posture crossing, scope spill). `--light/--standard/--strict` become **threshold presets** over the
same single flow, not three paths. The user learns one sentence: *"start small; the system demands
more when the change is bigger."*

- Direct descendant of the repo's own **2026-07-18 two-axis-classification assessment** (adaptive
  gates) — this was already the direction of travel.
- **Gate to enter C:** the escalation valve must have **measured** fidelity from A/B runs (both
  directions). The trigger classifier is load-bearing for everything in C; it is not trustworthy by
  assertion.

## Sequencing summary

```
A (now)      ship collapsed light path; strict structured formats; measure cost + valve fidelity
   │             A's formats ARE B's schemas
   ▼
B (next)     build the renderer; skills emit records; prose becomes projection; ~1x in sight
   │             valve fidelity measured across A+B runs
   ▼
C (later)    threshold presets replace modes; one flow, auto-scaling rigor
```

Open items deliberately carried, not resolved: OpenSpec-on-light (creator kept; revisit at B),
exact `maxMaterialDecisions` default (tune from A's measurement), whether C keeps explicit preset
flags at all.
