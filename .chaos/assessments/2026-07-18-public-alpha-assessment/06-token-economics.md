---
chaosMetadata:
  schemaVersion: 1
  artifactType: unknown
  artifactScope: unknown
  changeId: null
  sourceCommand: unknown
  lastWrittenAt: "2026-07-19T11:02:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T11:02:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: chaos/dotnet/demo
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: LOW
    bodyHash: "sha256:8f1e0f1d726e6022664b3e776cf631ccc832fc521b3888b26f4517894f3ee1da"
---

# 06 — Token and performance economics

Part of the CHAOS public-alpha external assessment · assessed commit `6421feb` · 2026-07-18 · [Index](README.md)
Labels: Observed / Reported (author) / Inferred / Hypothesis / Recommendation / Unknown

## 6.1 Measured instruction-side cost (Observed; bytes measured, tokens ≈ bytes × 0.25)

Per-command load = command file + full skill directory (skills mandate "read the reference files before acting") + shared policies (model-robustness + interactive-decision, 11,782 B) + interaction-runtime protocol slice (SKILL + 6 reference contracts, 20,526 B) + delegated agent definition(s) + cross-referenced contracts.

| Command | cmd B | skill B | agent B | shared B | Total B | ~Tokens |
|---|---:|---:|---:|---:|---:|---:|
| status | 5,846 | 68,336 | 10,665 | 36,579 | 121,426 | **29.6k** |
| todo | 8,860 | 56,549 | 7,898 | 34,122 | 107,429 | **26.2k** |
| propose | 6,280 | 51,122 | 10,582 | 36,579 | 104,563 | **25.5k** |
| apply | 5,509 | 38,721 | 23,519* | 36,579 | 104,328 | **25.5k** |
| review | 4,179 | 47,416 | 8,730 | 36,579 | 96,904 | 23.7k |
| sync | 6,720 | 38,750 | 9,773 | 32,308 | 87,551 | 21.4k |
| init | 4,825 | 42,415 | 6,173 | 32,308 | 85,721 | 20.9k |
| code-review | 6,045 | 24,738 | 5,004 | 47,898** | 83,685 | 20.4k |
| archive | 4,072 | 31,527 | 5,317 | 36,579 | 77,495 | 18.9k |
| verify | 3,892 | 26,405 | 10,279 | 36,579 | 77,155 | 18.8k |
| archaeology | 3,037 | 23,904 | 3,862 | 36,579 | 67,382 | 16.5k |
| retro | 3,705 | 19,417 | 5,502 | 36,579 | 65,203 | 15.9k |
| help | 2,566 | 23,950 | 2,973 | 32,308 | 61,797 | 15.1k |
| resume | 4,408 | 20,558 | 4,462 | 32,308 | 61,736 | 15.1k |
| doctor | 5,287 | 13,954 | 3,089 | 32,308 | 54,638 | 13.3k |

\* apply-orchestrator + C# specialist. \*\* includes the code-reviewer skill directory.

Aggregates (Observed):

- Sum of all 15 chains: **≈1,257 KB ≈ 307k tokens** of instruction text.
- **Full standard lifecycle** (propose→review→apply→code-review→verify→archive→sync→retro→todo): **≈788 KB ≈ 196k instruction tokens across 9 sessions** — before reading a single line of the user's code or evidence.
- Every runtime interruption adds a **~60 KB ≈ 15k-token** resume chain reload.
- Tree sizes: `.claude/skills` 1.2 MB / 204 files; `.github/skills` 1.1 MB / 202. Largest single files: status check-catalog 18.7 KB, status contract 13.3 KB, openspec-explore SKILL 11.1 KB, status config-audit 10.5 KB, todo SKILL 10.3 KB.

## 6.2 Structural waste (Observed)

1. **Mandatory reference fan-out** — apply requires 14 reference files, todo 16, before acting. The single largest cost driver.
2. **Contract triplication ×2 surfaces** — ≈6 reworded copies of core rules per command (command + skill + agent, × Claude/Copilot).
3. **Evidence re-reads** — verify/archive/retro re-read the same artifact set up to 3×; `decision-events.md` has six consumers.
4. **Prompt-encoded deterministic checks** — status's `CS-*` catalog and much of the lifecycle bookkeeping are linters written in prose, re-interpreted by a model every run, despite a tested diagnostics package existing.
5. **Resume chain reload** — full protocol re-read instead of capsule + delta.

Runtime performance is a non-issue (file I/O, milliseconds). Real latency costs: 2 Python processes spawned per Edit/Write/Bash by hooks; human interruption latency (~12 stops/change).

## 6.3 Token-efficiency architecture (Recommendation; savings are Hypothesis pending EA-X3)

| Move | Mechanism | Est. saving | Feeds |
|---|---|---|---|
| Single-source contracts | one canonical file per command; skills/agents become thin pointers; generate the Copilot surface | ~40–50% of total instruction mass | EA-B3 |
| Lazy reference loading | SKILL.md core ≤3 KB + fetch-on-need references (drop "read everything first") | 30–60% per command run | EA-I13 |
| Change evidence index | `.chaos/changes/<id>/index.json`: artifact hashes + 5-line summaries; verify/archive/retro read index + deltas | eliminates most re-reads | EA-I13 |
| Deterministic validators | move status checks, lifecycle-row/decision-event consistency, naming/frontmatter linting into `chaos-interaction-diagnostics`; model consumes its JSON report | replaces the two heaviest prompt bodies | EA-I14 |
| Consolidated compact profile | one session, one report for micro/compact changes | ~60–70% of whole-lifecycle cost for small changes | EA-B1 |
| Compact resume | capsule + answered-decision delta only | ~10k/interruption | EA-I15 |
| Archaeology snapshots | content-hashed cache + `--since` delta re-scans | large on repeat brownfield work | EA-I16 |
| Model routing | small models for todo scans/report formatting (HTML digest already deterministic) | modest, easy | EA-I17 |

**Combined estimate (Hypothesis, Confidence: MEDIUM):** standard change ~196k → **~60–80k** instruction tokens; compact small change → **~25–35k**. Validate with experiment EA-X3 before claiming publicly.

## 6.4 Principle

Token cost is a first-class product concern for CHAOS in a way it isn't for lighter tools: the pitch is "governance is worth its cost," so the cost must be *known, published, and shrinking*. Recommendation: publish a per-command token table in the docs (the numbers above are reproducible by `wc -c` over the chains) and treat regressions like performance regressions.
