---
chaosMetadata:
  schemaVersion: 1
  artifactType: unknown
  artifactScope: unknown
  changeId: null
  sourceCommand: unknown
  lastWrittenAt: "2026-07-19T11:01:59+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T11:01:59+02:00"
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
    bodyHash: "sha256:b2c94528ad0ba90ea5d51f635b570c4a8e10a1a34e41939ae91f7101b6a66651"
---

# 03 — Improvement topics: Runtime reliability & security (RT) · Performance & tokens (PF)

Part of the CHAOS improvement-landscape assessment · commit `6421feb` · 2026-07-18 · [Index](README.md)
Format per topic: category · complexity · impact · **recommendation** · timing. `(= EA-…)` = carried over. Detailed cost/saving/invalidation analysis for PF items: [08-performance-token-analysis.md](08-performance-token-analysis.md).

## RT — Runtime reliability, recovery & security

### IL-RT1 · Advisory cross-process lockfile `(= EA-I08)`
runtime · **M** · high · **must do** · alpha-beta
- **Problem:** zero cross-process mutual exclusion (grep-verified); MCP server, runner, and panel do multi-file read-modify-write on the same directory; `locks.json` is last-writer-wins; `beginCommand` can race. **Change:** one per-root advisory lockfile (acquire → mutate → release, with timeout + stale detection by PID/heartbeat) wrapped around every mutating runtime operation in the shared library — all three writers inherit it. **Users/value:** the realistic two-writer case (human answers while runner ticks) becomes safe. **Evidence:** first assessment §4.3. **Deps:** none. **Risks/downsides:** lock contention latency (ms-scale, acceptable); stale advisory lock needs its own recovery — timeout + doctor. **Validation:** IL-RT9 abuse suite green. · core.

### IL-RT2 · MCP boundary hardening `(= EA-I08)`
runtime · **L-M** · high · **must do** · alpha-beta
- **Problem:** read paths accept unsanitized IDs (path-traversal probing); zod shapes are loose; `--no-validate` disables write guards; `chaos_answer_decision` lets the agent write a human decision guarded by prose. **Change:** ID regex in zod on every tool (reads included); length caps; demote the answer bridge behind `CHAOS_ALLOW_AGENT_ANSWER=1`; deprecate `--no-validate` outside tests. **Users/value:** the governance boundary means what it says. **Evidence:** first assessment §4.6/§4.10. **Deps:** none. **Risks:** breaking dev/test flows — env-gate preserves them. **Validation:** traversal + forged-answer tests fail closed. · core.

### IL-RT3 · Capsule integrity + quality gate `(= EA-I09)`
runtime · **M** · high · **should do** · beta
- **Problem:** `validatesAgainstDecisionHash` designed but always `null`; nothing detects workspace drift since pause; all 7 real capsules have empty scope/constraint arrays — resume quality rides on agent discipline. **Change:** write and verify the decision hash; add workspace fingerprint (git head + dirty-file hash) checked at resume with a drift warning decision; resume-time quality gate warns on skeletal capsules and prompts the pausing agent for scope/constraints at pause time. **Users/value:** trustworthy resumes (anti EA-R9). **Deps:** none. **Risks:** over-blocking resumes — warn-first posture. **Validation:** EA-X4 ≥95% correct continuation incl. drifted-workspace cases. · core.

### IL-RT4 · Stale-state janitor with consent
runtime · **L-M** · medium · **should do** · beta
- **Problem:** abandoned sessions/locks require manual `cancelCommand` archaeology; diagnostics only reports. **Change:** `chaos:doctor --fix` gains guided cleanup: list stale (per existing derivation + age), propose release/cancel/expire actions, execute only on per-item confirmation; same actions exposed as Decision Center buttons (IL-DX4). **Users/value:** recovery stops being expert work. **Evidence:** "report, never repair" stance (Observed) is safe but janitorial. **Deps:** IL-RT1 (safe mutation). **Risks:** wrong cleanup — everything confirm-gated, audit-logged. **Validation:** seeded orphan cleanup walkthrough. · core.

### IL-RT5 · Schema migration framework
architecture · **M** · high · **should do** · beta (before any schemaVersion 2)
- **Problem:** `schemaVersion: 1` everywhere, zero migration code; the first schema change (IL-DQ1 needs one) would strand state. **Change:** migrate-on-read with pre-migration backup (`.chaos/interactions/backup/<ts>/`), per-entity migration table, doctor probe reporting mixed-version stores; writes always latest. **Users/value:** evolution without corruption. **Evidence:** grep "migrat" = 0 hits (Observed). **Deps:** none; blocks IL-DQ1. **Risks:** partial migration crash — backup + idempotent re-run. **Validation:** round-trip fixture suite v1→v2. · core.

### IL-RT6 · Write-ahead intent journal
runtime · **H** · medium · **explore** · v1
- **Problem:** multi-file transitions (decision→locks→session→audit→index) are not atomic as a *sequence*; a crash mid-sequence leaves partial state (indexes self-heal, primaries may not). **Change:** append an intent record before each multi-file mutation; recovery scan completes or rolls back incomplete intents at next startup. **Users/value:** crash consistency without a database. **Evidence:** first assessment §4.3. **Deps:** IL-RT1 (ordering), IL-RT5. **Risks/downsides:** complexity for a rare failure — hence explore; measure real incidence first (IL-RT9). **Validation:** kill-mid-sequence fuzzing. · optional.

### IL-RT7 · Hook runtime hardening `(= EA-I03/EA-I10)`
runtime · **L** · high · **must do** · alpha
- **Problem:** `py -3` hardcoded (observed silently no-op'ing on a broken launcher); README/settings posture contradiction; `--stamp` writes during turns undisclosed. **Change:** interpreter discovery with fallback; a hook self-check surfaced by doctor *and* the Decision Center status bar ("hooks: healthy/degraded"); reconcile docs with committed settings; move `--stamp` to Stop-only by default. **Users/value:** silent-failure class eliminated; honest posture. **Evidence:** first assessment §5.6. **Deps:** none. **Validation:** doctor detects a deliberately broken interpreter. · core.

### IL-RT8 · Runner permission posture per risk level
governance · **L** · medium · **should do** · beta
- **Problem:** the headless runner spawns Claude with `acceptEdits` regardless of change risk; a strict-risk auto-resume gets the same write freedom as a docs fix. **Change:** map permission mode to the change's risk (light→acceptEdits, standard→acceptEdits+protected-paths deny, strict→plan/ask for non-mechanical steps or require manual resume); document the exposure. **Users/value:** auto-resume trustworthy on risky work. **Evidence:** `runnerConfig` default (Observed). **Deps:** IL-WF1 risk labels. **Risks:** strict auto-resume becomes less "auto" — correct trade. **Validation:** runner E2E per risk level. · core.

### IL-RT9 · Concurrent-writer abuse suite
experiment · **M** · high · **should do** · alpha-beta
- **Problem:** the failure modes that matter (interleaved writers, kill-mid-sequence, clock skew, giant queues) are exactly what normal use avoids; no test exercises them. **Change:** a dedicated suite driving MCP + panel-library + runner writers concurrently against one root with fault injection; runs in CI nightly. **Users/value:** evidence for every RT claim; gate for IL-RT1/RT6 design choices. **Deps:** EA-S3 CI. **Validation:** suite exists and catches a seeded race. · core infra.

## PF — Performance & token efficiency

### IL-PF1 · Contract single-sourcing `(= EA-B3/EA-I20)`
architecture · **H** · **transformative** · **should do** · beta→v1
- **Problem:** ≈6 reworded copies of core rules per command across command/skill/agent × two surfaces; ~40–50% of the 307k-token instruction mass is duplication. **Change:** one canonical contract per command; skills/agents become thin pointers; Copilot surface generated (IL-EX1); content-aware parity. **Value:** halves instruction mass; makes portability real; kills drift class EA-R4. **Deps:** IL-WF1 settled first (don't single-source a moving target). **Risks:** big-bang refactor — do per-command incrementally. **Validation:** token accounting (IL-PF10) before/after; parity content-diff clean. **Token:** ↓↓↓.

### IL-PF2 · Lazy reference loading `(= EA-I13)`
performance · **M** · high · **should do** · beta
- **Problem:** "read all reference files before acting" (apply: 14 files/38.7 KB; todo: 16) is the biggest per-run cost driver. **Change:** skill cores ≤3 KB stating *when* to pull each reference; references fetched on need. **Value:** 30–60% per command run. **Deps:** none. **Risks:** agent skips a needed reference — core lists mandatory-per-phase triggers. **Validation:** IL-PF10 per-command measurements; behavior spot-checks. **Token:** ↓↓.

### IL-PF3 · Change evidence index + artifact hashes `(= EA-I13)`
performance · **M** · high · **should do** · beta
- **Problem:** verify/archive/retro re-read the full artifact set (up to 3×); `decision-events.md` has six consumers. **Change:** `.chaos/changes/<id>/index.json`: per-artifact hash + 5-line summary + claims register; consumers read index, then only hash-changed files. **Invalidation:** hash mismatch → targeted re-read. **Value:** eliminates most re-reads; enables IL-TR6/TR7. **Deps:** none. **Risks:** stale summaries — summaries regenerated on hash change only. **Validation:** verify token cost before/after on showcase. **Token:** ↓↓.

### IL-PF4 · Deterministic validators `(= EA-I14)`
performance/governance · **M** · high · **should do** · beta
- **Problem:** status's 18.7 KB `CS-*` catalog, lifecycle-row consistency, naming/frontmatter rules are linters written in prose, re-interpreted per run. **Change:** implement in `chaos-interaction-diagnostics` (structure exists: 12 probes); model consumes the JSON report and writes only narrative; later exposed as a CI action. **Value:** cheaper *and* mechanically trustworthy (anti EA-R8); the checks stop drifting from their own definition. **Deps:** none. **Risks:** prose/code rule drift — the prose catalog becomes generated docs from the check registry. **Validation:** status token cost ↓ ≥50%; identical findings on seeded violations. **Token:** ↓↓ · **Correctness risk:** low (code > prose).

### IL-PF5 · Compact resume protocol `(= EA-I15)`
performance · **M** · medium · **explore** · beta
- **Problem:** every interruption reloads a ~15k-token resume chain. **Change:** resume loads capsule + answered-decision delta + the *phase-specific* contract slice only. **Value:** ~⅔ of resume overhead. **Deps:** IL-PF1 structure helps. **Risks:** under-context on resume — capsule quality gate (IL-RT3) is the guard. **Validation:** resumed-run correctness (EA-X4) at reduced load.

### IL-PF6 · Archaeology snapshot cache `(= EA-I16)`
performance · **M** · medium · **should do** · beta
- **Problem:** repeat brownfield work re-excavates unchanged code. **Change:** findings keyed by content hash + git ref; `--since` delta re-scans; index marks stale findings instead of discarding. **Invalidation:** per-file content hash; ref distance cap. **Value:** large on repeat engagements (consulting persona). **Deps:** IL-TR9 (IDs make caching meaningful). **Risks:** stale finding trusted — staleness surfaced with confidence downgrade. **Validation:** second scan of unchanged tree ≈ index-read cost.

### IL-PF7 · Repository context manifest
performance · **M** · high · **should do** · beta
- **Problem:** every command re-derives repo structure (modules, entry points, test commands) by scanning. **Change:** a generated `.chaos/context/manifest.json` (module map, dependency edges, path classes, build/test commands) refreshed when watched-file hashes change; commands and the blast-radius estimator (IL-WF4) read it. **Invalidation:** hash-based; doctor verifies freshness. **Value:** removes repeated scans; grounds impact previews (IL-DQ4). **Deps:** none. **Risks:** wrong manifest misleads — generated with confidence labels, spot-verified by strict commands. **Validation:** command trace shows scan calls replaced by manifest reads. **Token:** ↓↓ (recurring).

### IL-PF8 · Model routing for mechanical stages `(= EA-I17)`
performance · **L-M** · medium · **explore** · beta
- **Problem:** frontier-model reasoning is spent on todo scans, dedupe, report formatting. **Change:** per-stage model hints in agent frontmatter (small model for mechanical passes); HTML digest already deterministic. **Value:** modest cost cut, easy. **Risks:** quality dips — restrict to verifiable stages. **Validation:** output-diff on the todo pipeline between tiers.

### IL-PF9 · Report budgets & summary-first templates
performance/UX · **L** · medium · **should do** · alpha-beta
- **Problem:** reports are unbounded; verbosity is a cost *and* a readability failure (nobody reads the 6th report). **Change:** per-report soft caps (e.g. apply-report core ≤300 lines) with "detail appendix" convention; every template leads with a 5-line summary block that the evidence index (IL-PF3) can lift verbatim. **Value:** cheaper to write, cheaper to re-read, likelier to be read. **Deps:** none. **Risks:** lost detail — appendices, not deletion. **Validation:** report length distribution before/after; reader rating. **Token:** ↓.

### IL-PF10 · Token accounting in CI + per-command budgets
performance/governance · **L** · high · **must do** · alpha
- **Problem:** token cost is a first-class concern with no measurement loop; regressions are invisible (the 307k figure was hand-measured in this assessment). **Change:** a deterministic script (bytes-per-chain, as measured here) run in CI; per-command budgets declared in command frontmatter; CI warns on breach; docs publish the table. **Value:** makes every other PF item provable; honest marketing. **Deps:** EA-S3. **Risks:** none material. **Validation:** CI fails on a seeded 20% chain growth. **Token:** enables all ↓.
