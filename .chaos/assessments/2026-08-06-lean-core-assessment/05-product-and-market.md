# 05 — Product and market

## What CHAOS is now, in market terms

A **human-authority gate for agentic coding, with receipts**: one forced pre-code decision
held in durable state, honest verification, and a per-change decision record that future
gates check against. Claude Code-first, VS Code-first, repo-local, MIT.

## The uncomfortable market fact

The generic version of the core mechanism is being commoditized (Observed in the ecosystem,
HIGH). Claude Code ships plan mode; Cursor, Copilot Workspace, and every serious agent
vendor now put a "review the plan before code" affordance in the box. "The agent stops and
asks first" is not a product in 2026; it is a checkbox. If CHAOS's pitch is "a pre-code
stop", it loses to a feature its own dependency ships for free.

## Where the actual differentiation is (Inferred, HIGH)

Ranked by defensibility:

1. **The record→future-stop loop.** Plan modes are amnesiac: approval evaporates when the
   session ends. CHAOS writes what was decided (record, amended ADR, amended architecture)
   and the next stop reads it — B2 demonstrated the catch mechanically (a payload change
   contradicting an owner-confirmed posture, surfaced before code with alternatives). No
   mainstream agent tool maintains adversarial institutional memory against its own future
   changes. This is the moat, and it compounds with use.
2. **Durable, resumable decision state.** Answers live outside the chat thread; a killed
   session resumes from a capsule + answered decisions, never from chat memory. Ephemeral
   plan-approval cannot do audit, hand-off, or "answer it tomorrow".
3. **Stop design as a craft.** The measured "ladder beats ratification" result (02.4) is
   product knowledge competitors don't have and can't cite.
4. **The falsification record.** An OSS project that measured its own product, published
   the numbers that killed 90% of it, and kept the residue is a credibility asset no
   marketing buys. "We deleted the parts that didn't survive measurement, here's the data"
   is a launch story (Inferred, MEDIUM on whether the market cares; HIGH on uniqueness).

What is *not* differentiating: OpenSpec integration (OpenSpec's own community does this),
the C# specialist agent, hooks observability, the headless runner (dormant), and the
generic stop itself.

## Who it is for

- **Now (honest):** solo/small-team maintainers running Claude Code on codebases whose
  architecture decisions outlive sessions, who will pay ~1.1× and one decision per change
  for control and a written trail. The client-arena profile — a years-old client codebase
  with recorded postures — is exactly the sweet spot the data comes from.
- **Not for:** prototypers (the README already says so, correctly); teams needing
  multi-user review flows (no story); non-Claude shops (hard dependency); anyone allergic
  to a VS Code panel.

## Competitive frame

| Category | Examples | CHAOS vs them |
|---|---|---|
| Vendor plan modes | Claude Code plan mode, Cursor | They win on zero-install; CHAOS wins on durability, records, crossings |
| Spec-driven kits | OpenSpec, spec-kit, Kiro-style flows | Complementary — CHAOS *gates* spec work rather than replacing it; the size-gated integration is a sane default they lack |
| Agent guardrails/policy | permission prompts, hooks, CI policy bots | Enforce *actions*; CHAOS governs *decisions*. Different layer, coexists |
| Memory tools | CLAUDE.md conventions, memory features | Passive context vs adversarial check-at-the-stop; CHAOS's records are load-bearing, not advisory |

Realistic assessment: no incumbent occupies "decision memory that argues back", and no
incumbent will find it hard to build a shallow version once articulated (Inferred, MEDIUM).
Speed of packaging matters more than further mechanism work.

## Positioning sentence (proposed)

> **CHAOS makes an AI agent stop once before it writes code — and remembers what you
> decided, so it can catch the change that contradicts you six weeks later. Measured on a
> real client codebase at ~1.1× the cost of not asking.**

Every clause of that sentence is currently true and citable (02), which is rarer than it
sounds. The third clause requires the n=3/one-operator caveat within one click of wherever
it is published — the project's credibility asset dies the first time a number outruns its
evidence (06).
