# 08 — Performance & token-efficiency analysis

Part of the CHAOS improvement-landscape assessment · commit `6421feb` · 2026-07-18 · [Index](README.md)
Topic inventory: [03 §PF](03-topics-runtime-performance.md). Baseline measurements: [first assessment §06](../2026-07-18-public-alpha-assessment/06-token-economics.md) (13.3k–29.6k tokens/command; ≈196k/standard lifecycle; ≈307k total instruction mass; ~15k/resume).

## 8.1 Where the cost actually is (measured → ranked)

1. **Duplication of contracts** (≈6 copies of core rules per command × 2 surfaces) — mass problem.
2. **Mandatory reference fan-out** ("read all before acting": apply 14 files, todo 16) — per-run problem.
3. **Evidence re-reads** (verify/archive/retro ×3; decision-events × 6 consumers) — lifecycle problem.
4. **Prompt-encoded deterministic work** (status catalog 18.7 KB, lifecycle bookkeeping, todo dedupe) — wrong-tool problem.
5. **Resume chain reload** (~15k/interruption × 11–14 stops) — interruption tax.
6. **Repeated repo scans** (structure/entry-points re-derived per command) — recurring scan tax.
7. Latency (not tokens): 2 Python hook processes per Edit/Write/Bash; 30-min Stop-hook holds.

## 8.2 Proposal economics (relative estimates — Hypothesis until IL-PF10 measures; no invented absolutes)

| Proposal | Impl. cost | Token saving (relative) | Latency effect | Correctness risk | Invalidation strategy |
|---|---|---|---|---|---|
| IL-PF1 single-sourcing | High | ~40–50% of instruction *mass*; per-run ↓ via smaller cores | neutral | Low (same rules, one place) | n/a — generation is the guard |
| IL-PF2 lazy references | Medium | 30–60% per command run | faster starts | Medium — agent may skip a needed ref → per-phase mandatory triggers in the core | refs still on disk; nothing to invalidate |
| IL-PF3 evidence index + hashes | Medium | eliminates most 2nd/3rd reads (verify/archive/retro) | ↓ | Low-Medium — stale summary risk | per-artifact content hash; mismatch → targeted re-read; summaries regenerate on hash change only |
| IL-PF4 deterministic validators | Medium | replaces the two heaviest prompt bodies (status, bookkeeping) | ↓↓ (code vs reasoning) | **Low — improves correctness** (anti EA-R8) | checks versioned with schema; prose docs generated from check registry |
| IL-PF5 compact resume | Medium | ~⅔ of resume overhead (≈15k → ≈5k/interruption) | ↓ | Medium — under-context → capsule quality gate (IL-RT3) guards | capsule hash + workspace fingerprint |
| IL-PF6 archaeology snapshots | Medium | large on repeat scans (2nd scan ≈ index cost) | ↓↓ on repeats | Medium — stale finding trusted → confidence downgrade on staleness | per-file content hash + git-ref distance cap |
| IL-PF7 repo manifest | Medium | removes recurring structure scans across all commands | ↓ | Medium — wrong manifest misleads → confidence labels, strict-mode spot-verify | watched-path hash set; doctor freshness probe |
| IL-PF8 model routing | Low-Med | modest (mechanical stages only) | ↓ | Medium — quality dip → verifiable stages only, diff-tested | n/a |
| IL-PF9 report budgets | Low | moderate write+re-read savings; big readability gain | neutral | Low — appendices preserve detail | n/a |
| IL-PF10 token accounting in CI | Low | none directly — makes all others provable and regression-proof | n/a | none | n/a |

**Sequencing (Recommendation):** IL-PF10 first (measurement before optimization), then PF2+PF9 (cheap, immediate), PF3+PF4 (structural, pairs with IL-WF1's consolidated report), PF7, PF6, PF5, and PF1 last-but-largest once profiles stabilize. Combined with the compact profile (IL-WF1), the first-assessment estimate stands: standard change ≈196k → **~60–80k**, compact small change → **~25–35k** (Hypothesis, Confidence: MEDIUM — publish actuals via IL-PF10/EA-X3, never the estimate).

## 8.3 Reuse of prior verified evidence

A distinct principle worth naming: **evidence, once verified, is an asset with a hash.** Apply's validation runs, archaeology findings, review verdicts — each gets recorded with content hashes of what it examined (IL-PF3/PF6/TR1). Downstream commands *reuse* the record when hashes match instead of re-deriving, and say so ("validated in apply-run R-…, unchanged since"). This converts the lifecycle's greatest weakness (re-analysis) into its audit trail's greatest strength (chained evidence) — the token fix and the traceability fix are the same fix (Recommendation).

## 8.4 Latency notes (non-token)

- Hook process spawns: batch the two PostToolUse scripts into one interpreter invocation; measure before further work (likely tens of ms each on Windows, but ×2 per tool call ×every tool call).
- Stop-hook holds: the 30-minute wait is a UX problem (IL-DX4 wait-state), not a throughput one.
- Runtime file I/O is milliseconds and self-healing; no action needed beyond IL-RT1's mutex (which adds negligible contention at single-user scale).

## 8.5 Benchmarks to institutionalize

1. **Chain-size accounting** (IL-PF10): bytes→tokens per command chain, in CI, published.
2. **Lifecycle cost benchmark:** the showcase change re-run per profile (EA-X3) — sessions, stops, instruction tokens, wall time.
3. **Resume overhead benchmark:** tokens from answer→productive work, before/after IL-PF5.
4. **Scan benchmark:** archaeology second-run cost with/without snapshots (IL-PF6).
Publish all four under `docs/evidence/` (IL-PA5).
