# 07 — State-of-the-art / ecosystem comparison

Part of the CHAOS public-alpha external assessment · assessed commit `6421feb` · researched 2026-07-18 · [Index](README.md)
Labels: Observed (fetched that day) / Inferred / Prior knowledge, unverified. GitHub metrics fetched 2026-07-18 unless noted.

## 7.1 Landscape summary

**Spec-driven development tooling.** GitHub **Spec Kit** ([github.com/github/spec-kit](https://github.com/github/spec-kit)) — 122k★, v0.13.0 (2026-07-17); seven-phase workflow incl. a new brownfield **converge** phase; generates assets for 30+ agents from one template pipeline; critics report spec overhead exceeding payoff on multi-module brownfield. **OpenSpec** ([github.com/Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)) — CHAOS's substrate; 61.5k★, v1.6.0 (2026-07-10); **rebuilt around the "OPSX" artifact-guided workflow** ("fluid not rigid") — a live substrate-drift risk for CHAOS's hard gate, and simultaneously its distribution tailwind. **BMAD-METHOD** — ~49k★; the closest *popular* methodology (structured lifecycle + HITL doctrine), but its HITL is prompt-choreographed conversation, not runtime state. **AWS Kiro** — GA March 2026; specs + event-driven agent hooks; polished IDE, no durable decision runtime. **Tessl** — pivoted 2026-01-29 to a skills registry; signal that pure spec-as-source struggles even heavily funded.

**Human-in-the-loop / approval infrastructure.** **HumanLayer** — the original approval SDK repo (11.1k★) is **deprecated**; the company pivoted to an IDE/cloud platform orchestrating coding agents with human checkpoints — the closest commercial trajectory to CHAOS's thesis and external validation of the category. **LangGraph interrupts + Agent Inbox** (~1k★) — durable typed interrupts, checkpointer persistence (resume days later), inbox UX with accept/edit/respond/ignore — **the strongest existing analog** to CHAOS's runtime + Decision Center, but platform-bound; CHAOS attaches the same idea to off-the-shelf CLI coding agents via files + MCP, versioned in the repo. Approval-layer capability is now **commodity in agent frameworks** (OpenAI Agents SDK pause/serialize/approve/resume; Cloudflare Agents; Google ADK) — but **not** in mainstream coding-agent CLIs. Governance pull is documented: 48% of production agents run ungoverned; 71% of leaders name HITL approvals their top 2026 governance priority (Gravitee, Apr 2026).

**Coding agent platforms.** **Claude Code** — hooks, plugins, subagents, checkpoints/rewind (file-state, not decision-state — complementary), sandboxing, managed settings. **GitHub Copilot / Agent HQ** — AGENTS.md custom agents; CLI GA with plan mode/hooks; code review reads AGENTS.md (2026-06-18); **mission control** is a cross-surface session inbox — the platform most likely to absorb CHAOS-like UX natively, but it is a session inbox, **not a decision ledger**. **OpenAI Codex** — async cloud tasks, AGENTS.md hierarchy. **Cursor** — plan-as-artifact (editable Markdown plans), rules, BugBot (2M+ PRs/mo after acquiring Graphite Dec 2025). **Devin** — Knowledge/Playbooks as governance memory; enterprise-closed, opposite of repo-local transparency. **Cline** remains the default OSS VS Code agent; **Roo Code shut down 2026-05-15** (Modes/Orchestrator live on in Kilo Code); OpenHands, Aider persist. **Amp**, **Factory.ai**, **Augment** — context/automation-first, not decision governance.

**AI code governance/review.** CodeRabbit ($60M B), Greptile ($25M A), Qodo — all review *outputs* (PRs); CHAOS governs the *process* upstream. Regulatory tailwind: NIST Cyber AI Profile (Feb 2026), **EU AI Act high-risk provisions August 2026**, auditors requesting AI-code provenance chains ("request → context → commands → validation → review") — which matches what a CHAOS change folder is designed to contain.

**ADR tooling.** adr-tools/log4brains stagnant; 2026 revival of ADRs as agent guardrails ("an agent that can't see why something was built will refactor the reason away"); Mneme HQ turns ADRs into deterministic pre-generation checks. CHAOS's ADR-aware propose/review is ahead of most agents but no longer alone.

**Closest conceptual competitor.** **ai-sdlc-framework/ai-sdlc** — 59★, v1alpha1 (2026-06-10): declarative Pipeline/Decision/QualityGate/AutonomyPolicy resources, DoR gates with operator sign-off, DSSE attestations, operator TUI, EU-AI-Act/NIST posture. Compliance-attestation-oriented rather than interactive-runtime-oriented; tiny; validates the design space.

## 7.2 Feature matrix

| Dimension | CHAOS | Spec Kit | OpenSpec | BMAD | Kiro | Claude Code | Copilot/Agent HQ | LangGraph+Inbox | ai-sdlc |
|---|---|---|---|---|---|---|---|---|---|
| Spec-driven lifecycle | ✅ (via OpenSpec) | ✅✅ | ✅✅ | ✅ | ✅ | — | partial | — | ✅ |
| Brownfield archaeology | ✅ confidence-rated | converge (new) | — | partial | — | — | — | — | — |
| Durable human decision state | ✅✅ repo-local | — | — | — | — | — (ephemeral) | — (session inbox) | ✅ (platform DB) | ✅ (declarative) |
| Pause/resume of governed work | ✅ semantic capsules | — | — | — | — | file checkpoints | — | ✅ checkpointers | partial |
| Live auto-resume | ✅ (gated) | — | — | — | hooks (other sense) | — | — | ✅ | — |
| Evidence + confidence ratings | ✅ unique doctrine | — | — | — | — | — | — | — | DSSE attest. |
| ADR/rules/gates integration | ✅ | constitution | — | personas | — | CLAUDE.md | AGENTS.md | — | ✅ |
| Per-change audit trail | ✅ designed; privately validated | — | — | — | — | — | — | run traces | ✅ |
| Retro → self-improvement | ✅ | — | — | partial | — | — | repo memory | — | — |
| Provider/agent reach | 2 (1 proven) | 30+ | many | many | 1 | 1 | native | n/a | several |
| Maturity/adoption | pre-adoption | very high | very high | high | GA | platform | platform | high | 59★ |
| Setup effort | high | low | low | low | app install | none | none | platform | medium |

## 7.3 Learn / don't copy

- **Spec Kit:** learn the one-source→many-agents generation pipeline (the antidote to twin trees) and frictionless onboarding; don't copy ceremony-without-audit.
- **OpenSpec/OPSX:** pin supported versions, abstract the spec-engine seam; position explicitly as "the governance layer OpenSpec doesn't have."
- **BMAD:** learn packaging/distribution; don't copy persona sprawl.
- **Agent HQ:** its mission control validates the inbox UX; CHAOS's moat is the durable, git-versioned **ledger** — race to own the format, not the panel.
- **LangGraph Agent Inbox:** learn accept/edit/respond/ignore verb ergonomics; don't copy platform dependency.
- **ai-sdlc:** adopt DSSE-style attestation at v1; don't copy compliance-first framing at alpha.
- **HumanLayer's pivot:** treat as market validation and as a competitor-forming signal.

## 7.4 Direct answer: is CHAOS state-of-the-art?

- **State-of-the-art in concept** — decisions-as-durable-runtime-state for coding agents + confidence-rated evidence: no mainstream tool assembles this (Observed absence across the researched set; Confidence: MEDIUM-HIGH — exhaustive absence is unprovable).
- **State-of-the-art in a specific capability** — the repo-local decision runtime + semantic resume for CLI coding agents.
- **Competitive** in spec-driven mechanics (inherited via OpenSpec); **behind** in adoption, packaging, agent coverage, and demonstrated outcomes.
- Overall: **promising but immature; a unique combination of known ideas whose combination does real work** (resumability and auditability are emergent properties of the assembly). Uniqueness is not proof of value — that burden falls on the experiments ([15-validation-experiments.md](15-validation-experiments.md)).

Main threats: platform absorption (Agent HQ, Claude Code enterprise), substrate drift (OPSX), and the adoption gulf vs 122k★/61.5k★/49k★ incumbents. Main tailwinds: regulatory audit-trail demand and the documented HITL-governance gap.
