# AGENTS.md — Task Tracker API

Instructions for any AI agent working in this repository. Read this before your first edit.

This repository is governed by **CHAOS** — Controlled Human-led Agent-Orchestrated SDLC.
The machinery is not vendored here; it installs as a Claude Code plugin. What lives in this
repo is the app, the postures it must respect, and the record of what was decided.

## What this repository is

A small, runnable ASP.NET Core Minimal API (`net8.0`) tracking tasks in an in-memory store.
It is a real, buildable subject for governed change — not a toy to be rewritten freely.
`dotnet test TaskTracker.sln --nologo` is the baseline, and it is expected to stay green.

## Where the truth lives

| Read this | For |
|---|---|
| [`.chaos/context.md`](.chaos/context.md) | project reality: domain, actors, constraints, what is in and out of scope |
| [`.chaos/architecture.md`](.chaos/architecture.md) | owner-confirmed technical posture and non-goals |
| [`docs/adr/`](docs/adr/) | accepted architecture decisions, with their consequences and accepted risks |
| [`.chaos/decisions/index.md`](.chaos/decisions/index.md) | one line per recorded change decision, newest first |
| [`.chaos/bootstrap-report.md`](.chaos/bootstrap-report.md) | how this workspace was generated, and what is still assumed or unknown |
| [`.chaos/config.yaml`](.chaos/config.yaml) | repository conventions: paths, toolchain, validation commands, protected files |

**`.chaos/architecture.md` and `docs/adr/` are the crossing sources.** Contradicting either
one is not a coding decision — it is a decision that must be surfaced to a human before code
is written, and the crossed record must be amended in the same change.

## Before you edit anything

1. **Read the terrain, targeted.** The files the change actually touches, plus the crossing
   sources above and the decision index. Not the whole repository; not nothing.
2. **Check whether the repository already decided it.** If a recorded decision or ADR answers
   an open question, follow it and cite it — do not re-ask a question the repo has answered,
   and do not quietly ship a different answer.
3. **Ask hard.** Surface uncertainty at the stop rather than resolving it silently. A question
   you cannot settle from the codebase — a semantic choice, a trade-off, an authority gap — is
   the human's, and guessing it is the failure this repository exists to make visible.

## How material change flows

Material change goes through **`chaos:run`**, which is one loop:

- **Stop once, before code.** Every open question and every crossing folded into a single
  decision, with the plan, the size estimate, and the spec-gate result. One stop — not a
  drip of confirmations, and not zero.
- **Build** exactly what was approved. Scope drift that changes capability earns a new
  decision; helper work finishing the approved change does not.
- **Verify honestly.** Run the real `dotnet build` / `dotnet test` and paste the real output.
  Anything you could not verify is recorded as a **limit with a reason**, never as a pass.
- **Record.** Write `.chaos/decisions/<date>-<slug>.md` and add a line to the index: verbatim
  intent, estimate versus actuals, questions asked and answered, what was *not* asked and
  why, what shipped, real check results, deviations.

`chaos:resume` continues an interrupted run from its capsule and the answered decision —
never from chat memory. `chaos:doctor` checks local readiness. `chaos:init` is one-time.

The **spec gate** (thresholds in `.chaos/config.yaml`) decides when a change owes an OpenSpec
change under [`openspec/`](openspec/): at or above 5 files or 250 LOC, or on any architecture
or contract crossing regardless of size.

## Protected files

`AGENTS.md` and root `README.md` are protected: propose a patch and get explicit confirmation.
Never edit them silently.

Never commit credentials. `Auth:SigningKey`, `Auth:Issuer`, and `Auth:Audience` are supplied
from outside the repository, and the app is designed to refuse to start without them — keep it
that way.

## Confidence and knowledge classification doctrine

Every judgement, recommendation, verification, or review finding must separate what is known
from what is inferred. Label every material finding as exactly one of:

- **`FACT`** — directly supported by inspected evidence, tool output, or explicit human confirmation.
- **`INFERENCE`** — reasoned from available evidence, but not directly proven.
- **`ASSUMPTION`** — accepted temporarily because evidence is incomplete.
- **`UNKNOWN`** — material information is missing or could not be inspected.
- **`CONFLICT`** — two or more sources disagree or imply incompatible positions.

Every material finding and every final verdict carries a confidence level — **`HIGH`**,
**`MEDIUM`**, or **`LOW`** — and every final verdict additionally carries `evidence_coverage`
(`COMPLETE` / `PARTIAL` / `WEAK`) and `assumption_load` (`LOW` / `MEDIUM` / `HIGH`).

Hard rules, no exceptions:

- No confidence-less verdicts.
- No unlabeled assumptions.
- No inference disguised as fact.
- No silent resolution of conflicts.
- Missing evidence must reduce confidence or block the relevant gate.
- A low-confidence positive verdict is conditional, not clean approval.

"The tests pass" is a claim about output you actually ran. If you did not run it, say so.
