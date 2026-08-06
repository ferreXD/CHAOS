# 08 — Scorecard

Scale /10. "Jul" = the 2026-07-18 public-alpha assessment's implied position (tag
`apparatus-final`); "Aug" = today. Confidence on the Aug score.

| Dimension | Jul | Aug | Conf | One-line justification |
|---|---:|---:|---|---|
| Conceptual coherence | 8 | **9** | HIGH | One mechanism, three artifacts, one loop; the product finally fits in a sentence — because everything that didn't was measured and cut |
| Evidence honesty | 7 | **10** | HIGH | Pre-registered, instrumented, self-falsifying, published its own product's death; the reference standard for this genre |
| External validity of claims | 3 | **4** | HIGH | Deeper but no wider: n=3, one operator-adjudicator, one codebase; plain+ask unrun |
| Core engineering quality | 7 | **8** | HIGH | Runtime abuse-tested + atomic + live-validated; 309 green tests; docked for the prose-enforced discipline layer and today's cross-package deadlock lesson |
| Measured cost efficiency | 2 | **9** | HIGH | 4–16× era → 1.05–1.15× on-clause with the premium ≈ the stop itself; one off-clause row pending |
| Catch value delivered | 4 | **8** | MED | Five real catches incl. two design-attributable overrides; docked for self-adjudication and one silent regression (placement) |
| Developer experience (author) | 5 | **8** | MED | Minutes-scale loop, readable artifacts, invisible machinery when green |
| Developer experience (anyone else) | 3 | **2** | HIGH | 90-minute guide-less copy-install; the guides were deleted and not yet replaced; zero external users ever |
| Packaging & distribution | 2 | **1** | HIGH | No package, no versioning, no upgrade path; alignment-by-Python-script; the worst dimension and the gating one |
| Documentation | 5 | **3** | HIGH | Skill + README are excellent and authoritative; everything else is gone; evidence record superb but reader-hostile |
| Market differentiation | 4 | **6** | MED | Generic stop commoditized; record→future-stop loop + measurement record are real, unoccupied, and thinly defensible |
| Strategic focus | 3 | **8** | HIGH | From ~15 commands and three modes to one loop and one open question; docked 2 for the dormant 4.6k-LOC runner |
| Sustainability / bus factor | 2 | **2** | HIGH | Unchanged and now the binding constraint on everything above |
| **Overall** | **4** | **6.5** | MED | A measured, honest, well-built core that nobody else can currently install |

## Delta narrative

Every dimension that a research program can move, moved — most of them dramatically.
The three that stayed at the bottom (packaging, external DX, bus factor) share one cause:
CHAOS has spent its entire life being *built and judged* and has never once been *given to
someone*. The scorecard's ceiling is no longer set by product quality or evidence quality;
it is set by distribution. That is a better problem than July's — and it is the only
problem left that the current working style (measure, falsify, strip) cannot solve alone.

## Standing falsifiable predictions (this assessment's own necks on the line)

1. If the plain+ask arm runs on the arena, it catches **at most one** of the two lean-era
   override-class divergences (the runtime's durability does the rest of the work) — MED.
2. Without a mechanical check, mean decision-record length exceeds 150 lines within five
   more governed changes — MED.
3. A packaged one-command install (Future A, item 4) reduces time-to-first-stop below
   15 minutes and is the single largest adoption variable — HIGH.
4. No mainstream vendor ships a *durable, record-checking* stop (as opposed to ephemeral
   plan approval) within 6 months — MED.
