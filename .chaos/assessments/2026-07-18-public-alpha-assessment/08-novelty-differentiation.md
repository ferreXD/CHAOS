# 08 — Novelty and defensibility

Part of the CHAOS public-alpha external assessment · assessed commit `6421feb` · 2026-07-18 · [Index](README.md)
Labels: Observed / Reported (author) / Inferred / Hypothesis / Recommendation / Unknown

## 8.1 Capability classification (as of mid-2026 research)

| Capability | Classification |
|---|---|
| Spec-driven lifecycle, plan approval, AGENTS.md-style instruction files | **Commodity** |
| Pause/approve/resume as infrastructure | **Well-known pattern** (LangGraph, OpenAI SDK, Temporal) — CHAOS's repo-local, MCP-served instantiation for CLI agents is **Rare** |
| File-backed human decision runtime + Decision Center for CLI coding agents | **Potentially novel in its niche; strong-differentiator candidate.** Moderately **hard to reproduce well** (the incorporate→consume→complete ordering, lock discipline, and capsule doctrine are subtle) but **easy for platforms to absorb at 80% quality** |
| Semantic resume capsules ("never resume from chat memory") | **Rare**; a distinct design point vs checkpointer-style state rehydration; defensible as doctrine |
| Confidence-rated evidence wired into gates (FACT/INFERENCE/… × HIGH/MED/LOW × coverage) | **Rare**; no researched tool attaches epistemic confidence to findings and wires it into approval doctrine; cheap to copy superficially, hard to copy culturally |
| Archaeology-first brownfield workflow | **Good integration of existing patterns** — the category is now named by others (Driver.ai "The Archaeology Problem", Spec Kit converge); CHAOS's confidence-rating twist is the uncommon part |
| Explicit rules/gates + decision→ADR promotion via sync | **Well-known pattern**, good integration |
| Command lifecycle + per-change audit ledger | **Good integration**; regulation-timed (EU AI Act Aug 2026) |
| Retro-driven workflow evolution | **Well-known pattern** (2026 self-improving-agent wave); CHAOS's evidence-driven instance is disciplined, not new |
| Strict-risk compact execution (risk × profile) | **Potentially novel as an explicit model** — mostly unbuilt anywhere; cheap to build; worth claiming early (EA-B1) |
| Todo evidence-to-backlog flow | **Good integration**; commodity-adjacent |
| Twin Claude/Copilot prompt trees | **Liability, not novelty** — peers generate per-agent assets from one canonical source |

## 8.2 Defensible identity

No single feature is defensible — platforms will absorb inboxes and approvals. The defensible identity is the assembly:

> **"The governed decision loop for coding agents, recorded in your repo."**

Runtime + semantic capsules + confidence doctrine + per-change audit ledger as one coherent, provider-portable, **git-native artifact standard**. That position (open, local-first, auditable, vendor-neutral) is one platforms are structurally unlikely to occupy — their equivalent lives in their cloud (Inferred, Confidence: MEDIUM). Consequence: the ledger/capsule **formats** matter more than the UI; owning the format is the moat (see direction EA-D3 in [14-roadmap.md](14-roadmap.md)).
