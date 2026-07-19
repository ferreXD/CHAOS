# EA-X1 — Recruitment & run protocol (real 3-developer cold-start trial)

> **Status of this document:** *Recommendation / protocol.* This is the kit for the **human**
> trial that the [instrumented machine probe](probe-results.md) explicitly does **not**
> perform. Nothing here has been executed — it is a runnable recipe for a maintainer (or an
> impartial facilitator) to run later. The probe validated the *mechanical* path and the
> *0-silent-failures* sub-threshold; only this trial can measure human **time-to-first-value**.

## Why this trial exists (and why an agent can't stand in for it)

Per `15-validation-experiments.md` §15.1 point 1, *"the creator cannot un-know the workflow."*
An agent (or the maintainer) has already internalised the CHAOS lifecycle, so it cannot
experience a stranger's confusion, hesitation, or misread of a doc. The **≤60-min
time-to-first-value threshold is a human-only measurement.** This protocol recruits people who
genuinely do not know CHAOS and measures what actually happens.

## The claim under test

| Field | Value |
|---|---|
| Hypothesis | A stranger reaches first value **unaided**. |
| Population | **3 developers** with **no prior CHAOS exposure**. |
| Success threshold | **≤ 60 min** time-to-first-value **now**; ≤ 15 min post-plugin (EA-B4); **0 silent failures**. |
| Failure interpretation | *Fix onboarding before any promotion.* A miss is a valid, publishable result. |

## Who to recruit (3 participants)

Recruit **3 developers** who each satisfy **all** of:

- **No CHAOS exposure.** Never used CHAOS, never read its internal docs, not a contributor.
  (Having heard the name in passing is fine; having run a command is not.)
- **Comfortable with a terminal and git.** Can clone a repo, run `npm`/`dotnet`, read a README.
  This trial tests *CHAOS onboarding*, not general developer literacy.
- **Uses (or can use) Claude Code.** CHAOS's reference command surface is Claude Code. A
  participant on the experimental Copilot adapter is a separate (and weaker) data point — note
  it, don't mix it into the core 3.
- **No stake in the result.** Not the maintainer, not someone the maintainer manages. Ideally
  recruited from outside the immediate team to avoid demand characteristics.

Aim for a spread of OS (at least one Windows, one macOS/Linux) because the sharpest known
first-run defect (the hook interpreter, see the probe) is **OS/launcher-specific**.

## Starting machine state (each participant, before the clock starts)

Start from a **genuinely clean** state — this is the whole point:

- A machine (or fresh container / VM) with **no CHAOS runtime state** anywhere: none of
  `.chaos/interactions/{sessions,decisions,capsules}`, `active.json`, `index.json`,
  `locks.json`, `audit.jsonl`, and **no `.claude/settings.local.json`** of their own.
  (A fresh `git clone` of `main` is the reference starting point — see the probe's note that
  `.claude/settings.local.json` is currently *committed* to the repo; strip any machine-local
  overrides before the run.)
- Prerequisites from [`docs/installation.md`](../../../../docs/installation.md) **not**
  pre-installed by the facilitator. Whether the participant can get Node ≥ 22.6, OpenSpec, and
  the .NET SDK onto their machine *from the docs alone* is part of the measurement.
- Claude Code installed and working (this is the client, not the artifact under test).
- Screen + audio recording enabled (see consent note).

## The task (read this to the participant verbatim)

> "Using only the project's own documentation — start at `README.md` — get CHAOS installed and
> working on your machine, confirm your environment is healthy, and then walk the demo change
> far enough to see CHAOS do the thing it's for. Think aloud. I can't help you or answer
> questions about CHAOS; if you get stuck, keep trying what the docs suggest, and tell me when
> you'd give up in real life. There is no time pressure and nothing you do is 'wrong' — every
> confusion you hit is exactly what we're trying to find."

Mechanically, the documented path is:

1. **Install** — follow `docs/installation.md` **Path A** (evaluate in this repo): prerequisites →
   `openspec init` → `npm install` in `tools/chaos-interaction-mcp` → build the Decision Center.
2. **Doctor** — run `chaos:doctor`; reach `READY` or `READY_WITH_WARNINGS`.
3. **Demo change** — follow `docs/demo/README.md` starting from
   `examples/task-tracker/dotnet/`, and drive the `add-task-query-filters` change through the
   CHAOS lifecycle at least as far as **first value** (below).

## Definition of "first value" (pick the primary; record all reached)

Record the timestamp for **each** tier the participant reaches:

| Tier | "First value" event | Why it counts |
|---|---|---|
| **T0 — Baseline** | `dotnet run` + `curl /tasks` returns the seeded task list. | Proof the environment actually works. Necessary, not sufficient. |
| **T1 — Governed first value (PRIMARY)** | Participant runs `chaos:propose "…"`, it **stops on the material decision** (invalid filter → 400), they **answer it in the Decision Center**, and the command **resumes and records** it. | This is the single moment that demonstrates *what CHAOS is for*: a human decision surfaced, answered, and written to the audit trail — not guessed in chat. |
| **T2 — Lifecycle complete (stretch)** | The change reaches `chaos:archive`/`chaos:sync` with the decision promoted to a decision-log entry. | Full payoff; optional for the 60-min bar. |

**The ≤ 60-min threshold is measured to T1** (governed first value). T0 and T2 are recorded for
context. If a participant reaches T0 but abandons before T1, that is a **fail against the
threshold** — record the abandonment point.

## Rules (facilitator MUST enforce)

- **Think-aloud, continuously.** Prompt "what are you looking at / expecting?" only to sustain
  narration — never to hint.
- **No help with CHAOS.** The facilitator does not answer CHAOS questions, does not point at
  the right doc, does not fix the environment. General "your wifi is down" logistics are fine.
- **The docs are the only teacher.** If the participant asks "is this right?", reply "what do
  the docs say?"
- **Capture, don't correct.** When they hit a wall, let them work it (or abandon). The wall is
  the data.
- **One participant at a time**, no cross-talk between participants.

## Stop conditions (end the session when ANY holds)

- **Success:** participant reaches **T1** (governed first value).
- **Abandonment:** participant says they would give up in real life, OR is stuck on one blocker
  with no new idea for **> 15 min**.
- **Hard cap:** **90 min** wall-clock elapsed (gives headroom past the 60-min threshold to
  capture *where* the overflow happens).
- **Blocker requiring maintainer intervention:** a defect that no participant could reasonably
  self-resolve (e.g. a hard crash). Log it, stop, and treat it as a first-run defect.

## What to capture per participant

- **`timing-sheet.csv`** — one row per step (see the file; it has a filled example row).
- **`blocker-log-template.md`** — one entry per blocker.
- Screen + audio recording; the participant's OS/Node/dotnet versions.
- The `chaos:doctor` verdict they got, and **whether they noticed / acted on any WARN**
  (especially the `py -3` hook WARN — see probe finding F1).
- A one-line self-report: "Did you feel you reached "first value"? When?"

## Provenance & analysis

- **Provenance-tag every number** (§ cross-experiment invariant): each timing row is
  `Observed (participant, facilitator-recorded)`.
- Report time-to-first-value as **three data points, not an average of three** — with n=3 the
  spread and the *failure modes* matter more than a mean.
- Cross-link any first-run defect to **EA-S2** (first-run integrity) and feed hardening items
  to **EA-V3**.
- A failing result (any participant > 60 min, or any silent failure they hit unaided) means:
  **fix onboarding before any promotion.** Do not retouch numbers.

## Pre-flight checklist for the facilitator

- [ ] 3 eligible participants scheduled, consent signed (see consent note).
- [ ] Each start machine verified clean (no runtime state, no `settings.local.json`).
- [ ] Recording tested.
- [ ] `timing-sheet.csv` and `blocker-log-template.md` copied per participant.
- [ ] Facilitator has read the probe results so they know the *expected* friction points
      (hook interpreter, `openspec init` side-effects) — **to observe, not to warn about**.
