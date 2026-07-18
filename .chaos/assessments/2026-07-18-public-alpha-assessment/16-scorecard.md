# 16 — Scorecard

Part of the CHAOS public-alpha external assessment · assessed commit `6421feb` · 2026-07-18 · [Index](README.md)
Scores 1–10, deliberately not smoothed. Confidence: HIGH/MEDIUM/LOW. "+2 requires" = what would raise the score by two points.
Amendment note: the author's clarification (private validation of the full lifecycle — Reported) is annotated where it bears on evidence; scores measure what is publicly verifiable, so most numbers are unchanged — the cheap path to raising several of them at once is EA-V1 (showcase trail).

| Dimension | Score | Justification (evidence) | Conf. | +2 requires |
|---|---:|---|---|---|
| Problem relevance | **8** | HITL-governance gap documented externally (48% ungoverned agents; 71% priority); EU AI Act Aug 2026; HumanLayer pivot validates the category | HIGH | Paying-user evidence that *this* form factor is the answer |
| Conceptual coherence | **8** | One idea threads everything (decisions as durable state); `docs/overview.md` proves it fits on a page | HIGH | risk × profile decoupling + runtime-centered identity |
| Technical architecture | **7** | Runtime: atomic writes, enforced state machines, safety stack (Observed); dragged by no cross-process mutex, contract triplication, sibling source imports | HIGH | EA-V3 + EA-B3 executed |
| Implementation quality | **8** | 264/266 tests pass (ran); 3 `any`/13.6k LOC; zero TODOs; deterministic tests | HIGH | CI green incl. fixtures; hooks robustness |
| Novelty | **6** | Niche-novel decision runtime + capsule doctrine; ingredients individually known (researched) | MEDIUM | Ledger format adopted outside CHAOS |
| Differentiation | **5** | Open space today; platform-absorption risk; identity split across two products | MEDIUM | EA-A1 extraction shipped before platforms move |
| Usability | **4** | Manual builds, silent failures, Claude-gated (Observed); good docs partially offset | HIGH | EA-B4 plugin + EA-X1 ≤15 min |
| Developer experience | **4** | ~11–14 stops, 9 sessions, 17–19 artifacts per standard change (measured); real aha moments exist | MEDIUM (no external users) | EA-B1 compact profile validated by EA-X3/X5 |
| Token efficiency | **3** | 13–30k/command; ~196k/lifecycle; 3× evidence re-reads — all measured | HIGH | EA-B2 hitting ≤80k standard / ≤35k compact |
| Reliability | **6** | Runtime robust single-user (observed real cycles; self-healing indexes); races, silent hook no-ops, fixture failures | MEDIUM | EA-V3 + EA-X4 ≥95% |
| Security | **6** | Excellent panel CSP + spawn hygiene; MCP read traversal, agent answer bridge, `acceptEdits` default, no SECURITY.md | HIGH | EA-V3 boundary fixes + disclosure policy |
| Extensibility | **5** | Everything forkable text + clean runtime lib; triplication makes change expensive; no plugin API | MEDIUM | EA-B3 single-sourcing + extension points |
| Provider portability | **4** | Copilot surface exists, honest, structurally checked, never executed (Observed); CLI writer path plausible | MEDIUM | One captured Copilot lifecycle + generated surface |
| Onboarding | **3** | No installer; missing openspec step; VSIX build; silent traps | HIGH | EA-S2 + EA-B4 |
| Public-alpha readiness | **6** | Honest label, good docs, real example (ran); sanitization/security-policy/first-run holes | HIGH | EA-S1–S4 (days of work) |
| Beta readiness | **3** | No CI tests, no public proof artifact, no external users; private validation Reported but unverifiable | HIGH | H0–H1 complete + EA-X1/X2/X4 passed |
| v1 readiness | **2** | No versioning/migrations/publication/mechanical enforcement | HIGH | Beta evidence + Horizon-4 items |
| Solo-developer value | **6** | Strong on strict-risk brownfield slice — supported by author-reported real-project results (Reported); negative on everyday work at current cost | MEDIUM | EA-B1/B2 making everyday use rational |
| Team value | **3** | Structurally single-user; good artifact conventions as seeds | HIGH | Identity + PR ledger + concurrent-safe state |
| Enterprise potential | **6** | Audit-trail thesis aligns with 2026 regulation; everything else missing | MEDIUM | Attestation + policy enforcement + a compliance pilot |
| OSS adoption potential | **4** | Niche, Claude-gated, heavy, no public proof yet; category tailwinds real | MEDIUM | EA-V1 showcase + EA-B4 plugin + EA-A4 references |

**Mean ≈ 5.1** — reported for completeness only; the distribution is the message: engineering quality (7–8s) far ahead of adoption surface (3–4s), which is the correct shape for this stage *if* the Horizon 0–1 items close the gap.
