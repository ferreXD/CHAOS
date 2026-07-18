# 03 — Core problem and value proposition

Part of the CHAOS public-alpha external assessment · assessed commit `6421feb` · 2026-07-18 · [Index](README.md)
Labels: Observed / Reported (author) / Inferred / Hypothesis / Recommendation / Unknown

## 3.1 Problem-by-problem analysis

Severity judged for the target user (people accountable for agent-driven change), not the average developer.

| Problem | Real? | Who feels it | Severity | Existing solutions | CHAOS's answer | Verdict |
|---|---|---|---|---|---|---|
| Human approvals evaporate in chat | Yes | anyone governing agent work | High, growing | Nothing mainstream for CLI agents; LangGraph Agent Inbox (platform-bound); plan-approval UIs (ephemeral) | Decisions as durable, git-adjacent state + audit chain | **Solves it better** — the crown jewel (Observed working) |
| Long agent tasks can't safely pause/resume | Yes | complex-change drivers | Med-High | Claude Code file checkpoints; framework checkpointers | Semantic capsules + lock-held pauses + three resume paths | **Solves it differently** (semantic re-instruction vs state rehydration); validated at small scale |
| AI changes lack evidence/traceability | Yes | leads, regulated teams, auditors | Rising fast (EU AI Act Aug 2026) | AI code review (output-side); enterprise platforms | Per-change ledger: decisions, waivers, confidence, reports | **Better in design**; validated privately (Reported), publicly unproven until EA-V1 ships |
| Architecture decisions not respected | Yes | brownfield teams | High | AGENTS.md/rules files; ADR-check tools (Mneme-style) | ADR/rule-aware propose/review + sync promotion of decisions to ADRs | **Differently, expensively**; enforcement is textual |
| Brownfield hidden coupling | Yes | modernization teams | High | Spec Kit "converge", Driver.ai, Unblocked | Archaeology with confidence-rated findings feeding gates | **Differently**; rare integration; light validation |
| AI workflows aren't repeatable processes | Yes | teams scaling AI use | Medium | Spec Kit / BMAD / Kiro | Full lifecycle + retro loop | **More expensively** than Spec Kit; no public adoption proof |
| AI workflows are non-deterministic | Partly | everyone | Medium | Deterministic tooling, tests | Deterministic *state* around non-deterministic work; prompts remain prompts | Partial answer, honest about it |
| Agents forget context | Yes | everyone | Medium | Memory features everywhere | Only indirectly (capsules, artifacts) | Not its fight |

## 3.2 The value proposition

CHAOS is for people who need to *answer for* agent-driven change, not just receive it. It converts the two most fragile moments of AI-assisted development — "a human said yes" and "the task was interrupted" — from chat ephemera into durable, auditable, resumable state, and wraps change in an evidence-and-confidence discipline.

Compared with chat-based approval, the runtime buys four things chat cannot (Observed in real data):

1. **Survivability** — an answer outlives the conversation (the captured 11-minute pause proves it).
2. **Integrity ordering** — *incorporate → consume → complete* is enforced server-side; an agent cannot retire an answer it never acted on.
3. **Auditability** — per-decision `audit.jsonl` chains with actor and latency.
4. **Composability** — the same state serves the panel, the Stop hook, the headless runner, and `chaos:resume`.

## 3.3 Positioning

- **Strongest one-sentence positioning:** "CHAOS makes every material human decision in AI-assisted development durable runtime state — agents must stop for it, honor it, and can resume from it, and the audit trail writes itself."
- **Realistic one-paragraph positioning:** "CHAOS is an experimental, opinionated governance overlay for Claude Code (Copilot adapter experimental) on top of OpenSpec. Agents do the mechanical work; when they hit a decision only a human should make, they stop, the decision lands in a VS Code Decision Center backed by file-based runtime state, and the answered decision — with rationale — becomes part of a per-change audit trail. Paused commands resume from semantic capsules, never from chat memory. It's built for high-stakes changes in codebases you must answer for, and it's honest that governance has a cost."
- **Most credible public-alpha positioning:** "A working human-decision runtime for Claude Code, plus an experimental governed lifecycle around OpenSpec — try it on one risky change and read the trail it leaves." (After EA-V1: "…read the trail it left" — link the showcase.)
- **Avoid (overclaims):** "AI-SDLC platform"; "runnable demo" (until the showcase ships); "full Copilot mirror"; "works with any agent"; "production-grade governance"; anything implying mechanical enforcement where compliance is textual.
