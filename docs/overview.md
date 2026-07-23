# CHAOS in five minutes

**CHAOS** = *Controlled, Human-led, Agent-Orchestrated Software delivery.* It's an opinionated
workflow where **humans make the decisions and agents do the orchestrated work** — and every
material decision is written down, traceable, and reviewable.

This page is the whole model on one screen: the lifecycle, the commands, the modes, and where
everything gets written. If you've never seen CHAOS before, start here.

> **The one idea.** An agent moves fast on the mechanical work. Whenever it hits a choice only a
> human should make — a contract, an architecture call, a risk trade-off — it **stops**, surfaces
> the decision to you, records your answer with its rationale, and carries that answer through the
> rest of the change. The audit trail is the product; the code is just what it governs.

CHAOS wraps **OpenSpec** (the spec engine that owns each change's proposal, design, specs, and
tasks). CHAOS is the **governance overlay** on top: it
decides when work may proceed, prompts for decisions, records the trail, and routes review and
verification. CHAOS *uses* OpenSpec — it doesn't replace it.

---

## The lifecycle

A change flows through governed commands. The core golden path:

```text
chaos:propose → chaos:review → chaos:apply → chaos:verify → chaos:archive → chaos:sync
```

| # | Command | You do | CHAOS produces |
|---|---|---|---|
| 1 | **`chaos:propose`** | State the intent | An OpenSpec change (proposal, spec delta, tasks) + the first material decisions |
| 2 | **`chaos:review`** | Ask for a pre-build review | `proposal-review.md` (+ `approval.md`) — findings, evidence coverage, approval gate |
| 3 | **`chaos:apply`** | Approve, then implement | Code + tests (one OpenSpec task at a time), `apply-report.md`, scope-drift assessment |
| 4 | **`chaos:verify`** | Check before archive | `verification.md` — a spec-traceability matrix (every requirement → code → test) |
| 5 | **`chaos:archive`** | Close the change | Moves the OpenSpec change to `archive/`, promotes deltas to base specs, audits decisions |
| 6 | **`chaos:sync`** | Reconcile governance | Promotes decisions to durable logs/ADRs so they outlive the change |

Not every change needs all six commands. **Pick the path that fits the risk** — the golden path
above is the middle tier; a tiny change runs a shorter one, brownfield/risky work runs a longer one.

### Three paths

| Path | Use it for | The commands, in order | Typical mode |
|---|---|---|---|
| **Tiny** | docs, tests, a small no-behaviour tweak | `propose → (answer decisions) → apply` | `--light` |
| **Normal** | a bounded feature or bug fix | `propose → review → apply → code-review → verify → archive` | `--standard` |
| **Brownfield** | risky, legacy, architectural, data, or auth work | `archaeology → propose → review → apply → code-review → verify → archive → sync → retro` | `--strict` |

Same commands, different amount of ceremony:

- **Tiny** is the **collapsed light lifecycle**: `chaos:propose --light` frames the change (one
  `change.md` with the contract, full OpenSpec, your decisions surfaced — then it stops for
  you); `chaos:apply` delivers against your answers and writes a compact dashboard. No review /
  verify / archive runs, one file to read, and it auto-escalates to `--standard` the moment
  real risk appears.
- **Normal** is the everyday path: a pre-build **`chaos:review`** gate, a post-build
  **`chaos:code-review`**, and a clean **`chaos:archive`** — the golden path above, with the
  code-review gate added.
- **Brownfield** front-loads **`chaos:archaeology`** to reconstruct how unfamiliar code actually
  behaves *before* proposing, then runs the full chain and closes the loop with **`chaos:sync`**
  (promote decisions to durable governance/ADRs) and **`chaos:retro`** (turn the change's evidence
  into process improvements).

The mode column is a default, not a rule — CHAOS infers the mode from the change's blast radius and
asks you to confirm (see [Modes](#modes-rigor-scales-with-risk) and the
[command support matrix](command-matrix.md)).

---

## All the commands

**Lifecycle** (drive a change from intent to closed):

| Command | Purpose |
|---|---|
| `chaos:propose` | Turn intent into a governed OpenSpec change, surfacing material decisions up front. |
| `chaos:review` | Pre-implementation review against governance, ADRs, rules, and evidence. |
| `chaos:apply` | Implement the approved change one task at a time, delegating code to a language specialist, holding scope. |
| `chaos:verify` | Independent post-implementation check via the spec-traceability matrix. |
| `chaos:archive` | Close the change: archive the OpenSpec change, promote deltas to base specs, audit every decision. |
| `chaos:sync` | Reconcile decisions/specs with durable governance; promote decisions to logs/ADRs. |

**Investigate** (understand before you change):

| Command | Purpose |
|---|---|
| `chaos:archaeology` | Read-only reconstruction of how unfamiliar / brownfield code actually behaves. |
| `chaos:code-review` | Post-implementation code review (architecture, conventions, correctness) — read-only except its report. |
| `chaos:retro` | Turn completed lifecycle evidence into process/rule/gate/prompt improvements. |

**Set up & operate** (the workspace itself):

| Command | Purpose |
|---|---|
| `chaos:init` | Bootstrap governance content for a repo (constitution, config, decision/rule/command indexes). |
| `chaos:doctor` | Local execution-readiness diagnostic — tooling, MCP, hooks, provider context. |
| `chaos:status` | Governance/workspace health audit → `.chaos/status-report.md`. |
| `chaos:todo` | Extract and curate a traceable todo backlog from CHAOS evidence. |
| `chaos:resume` | Continue a command that paused on a decision, after you've answered it. |
| `chaos:help` | Command help and orientation. |

> **Two surfaces.** The **Claude Code** command set (`.claude/`) is the reference implementation.
> A **GitHub Copilot** adapter (`.github/`) mirrors it but is **experimental** and not yet at parity.

For the stable per-command reference — the modes each command accepts, whether it emits confidence
labels, its Copilot adapter status, and the command it hands off to — see the
[command support matrix](command-matrix.md).

---

## Modes: rigor scales with risk

Most commands accept `--light`, `--standard`, or `--strict`. Same command, different amount of
ceremony — matched to how risky the change is. If you don't pass a mode, CHAOS **infers** one and
asks you to confirm.

| Mode | Use for | What it demands |
|---|---|---|
| **`--light`** | docs, tests, small no-behaviour cleanups | **Collapsed lifecycle, not relaxed validation**: one `change.md` (contract + review line + delivery dashboard) instead of the report set; full OpenSpec; every material decision still stops for you; tests still required; auto-escalates to `--standard` on risk. |
| **`--standard`** | normal feature work, bounded API/logic changes | OpenSpec change required; review/apply evidence and task traceability required; blockers block; skipped validation needs a rationale. |
| **`--strict`** | migrations, auth/security, data & schema, API contracts, cross-module or production-critical work | Review + apply reports required; OpenSpec validation required; no unresolved blocking/major findings; material decisions required; missing tests for behavioural change **block** unless you explicitly downgrade. |

`standard` is the default. Inference leans on the blast radius: no behaviour change → light;
bounded feature → standard; anything touching security, persistence, contracts, or multiple
modules → strict.

---

## Where everything gets written

CHAOS keeps **two parallel trees** and never copies between them — it links.

```text
openspec/changes/<change-id>/          # OWNER: OpenSpec — the source of truth
  proposal.md · design.md              #   what & why
  specs/<capability>/spec.md           #   the spec delta
  tasks.md                             #   the steps (checked off as apply completes them)

.chaos/changes/<change-id>/            # OWNER: CHAOS — the governance & audit trail
  proposal-report.md   proposal-review.md   approval.md    # per-command reports (standard/strict)
  apply-report.md      verification.md
  archive-report.md    sync-report.md
  decision-events.md                   #   PROP-DEC-*/REV-DEC-*/APP-DEC-* — the human record
  lifecycle.md                         #   status + links tying it all together
  waivers.md                           #   accepted risk / debt
  change.md                            #   --light: replaces the report set with one story file
                                       #   (intent + contract + review line + delivery dashboard)

.chaos/interactions/decisions/<DEC-…>/ # the machine-level decision record
  decision.json · response.json · audit.jsonl
```

Repository-wide (not tied to one change): `.chaos/status-report.md` (status),
`.chaos/doctor/` (doctor reports), `.chaos/archaeology/` (investigations),
`.chaos/sync-reports/` (repo-wide sync), and promoted decisions in `docs/decision-log/` / `docs/adr/`.

---

## How a decision is recorded

This is the mechanism the whole workflow exists to protect. When a command hits a material
decision, it does **not** guess and does **not** ask in chat:

1. It creates a **runtime decision** (via the `chaos-interaction` MCP server) and **stops**,
   holding a lock on the change.
2. You answer in the **Decision Center** (a VS Code panel) — pick an option, add a rationale.
3. The command **resumes**, incorporates your answer, marks the decision consumed, and continues.

Every decision leaves two linked records: a machine-level JSON trail under
`.chaos/interactions/decisions/`, and a human-readable **decision event** (`PROP-DEC-001`, …) in
the change's `decision-events.md`. Decisions worth keeping are later **promoted** by `chaos:sync`
into a durable `docs/decision-log/` entry or an ADR — so a choice made once becomes a discoverable
convention with an unbroken trail back to who decided it and why.

---

## Confidence & knowledge labels

CHAOS refuses to launder guesses as facts. Material findings and verdicts carry explicit labels:

| Dimension | Values |
|---|---|
| **Knowledge type** | `FACT` · `INFERENCE` · `ASSUMPTION` · `UNKNOWN` · `CONFLICT` |
| **Confidence** | `HIGH` · `MEDIUM` · `LOW` |
| **On verdicts also** | evidence coverage (`COMPLETE` / `PARTIAL` / …) and assumption load |

So a proposal can honestly read "`MEDIUM` confidence, `PARTIAL` coverage — the design is sound but
no test exercises it yet," and you can watch that confidence climb to `HIGH` once verification adds
passing tests. No confidence-less verdicts, no unlabeled assumptions.

---

## Next

- **Look up a command:** the [command support matrix](command-matrix.md) — modes, confidence
  labels, Copilot status, and next-command for every command — and the
  [command flags quick reference](command-flags.md) for every flag each command accepts.
- **See it work end-to-end:** the runnable [demo walkthrough](demo/README.md) — one small change
  through the full lifecycle.
- **Install it:** [installation & onboarding guide](installation.md).
- **What it is and who it's for:** the [README](../README.md).
- **Where it's going:** the [project roadmap](../.chaos/roadmap/roadmap.md).
