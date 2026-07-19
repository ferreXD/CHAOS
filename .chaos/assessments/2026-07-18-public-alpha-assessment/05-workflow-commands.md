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
    bodyHash: "sha256:605306ba489163177bdb8789cbf6b93975a6548050fd939392816e7b387d12df"
---

# 05 — Workflow, commands, hooks, and the risk/profile model

Part of the CHAOS public-alpha external assessment · assessed commit `6421feb` · 2026-07-18 · [Index](README.md)
Labels: Observed / Reported (author) / Inferred / Hypothesis / Recommendation / Unknown

## 5.1 Command inventory and disposition

17 chaos commands + 5 vendored `opsx/*` OpenSpec commands (Observed). Token figures = full instruction chain a model loads (command file + skill dir + shared protocol/policies + delegated agent defs); see [06-token-economics.md](06-token-economics.md) for the measurement method.

| Command | ~Tokens | Assessment | Disposition (Recommendation) |
|---|---:|---|---|
| `chaos:propose` | 25.5k | Core; the hard OpenSpec invocation gate (detect → invoke → confirm artifacts on disk → `openspec validate --strict` → proof section) is a genuinely good anti-hallucination pattern | **Keep** (core spine) |
| `chaos:review` | 23.7k | Real pre-build gate with question bank | **Keep**; optional below strict risk |
| `chaos:apply` | 25.5k | Core; task-by-task discipline, scope-drift assessment, specialist delegation | **Keep** (core spine) |
| `chaos:verify` | 18.8k | Spec-traceability matrix is valuable; re-reads nearly everything apply/review produced | **Keep**; merge with code-review at compact profile |
| `chaos:code-review` | 20.4k | Overlaps verify (both post-implementation gates) | **Merge into verify** at compact; separate only at full |
| `chaos:archive` | 18.9k | Necessary closure; re-audits what verify audited | **Keep, slim**; absorb change-scoped sync |
| `chaos:sync` | 21.4k | Decision→ADR/decision-log promotion is the durable payoff; repo-wide mode is maintainer-gated | **Split**: change-scoped → archive; repo-wide stays |
| `chaos:archaeology` | 16.5k | The brownfield differentiator; rich flag surface (`--scope/--focus/--max-files/…`) | **Keep**, optional; cache/snapshot results |
| `chaos:retro` | 15.9k | Good idea; third full re-read of the lifecycle's evidence | **Periodic-only** by default |
| `chaos:todo` | 26.2k | Useful; heaviest non-core command (16 mandatory reference files); 5 of 8 public dogfood runs | **Keep, slim**: commands emit candidates; curation on demand |
| `chaos:status` | 29.6k | Heaviest command; its 18.7 KB `CS-*` check catalog is a linter written in prose | **Merge with doctor**; move checks into the diagnostics package (deterministic code) |
| `chaos:doctor` | 13.3k | Cheapest and among the most useful; real diagnostics package behind it | **Keep** (absorb status) |
| `chaos:resume` | 15.1k | Core to the thesis; never resumes from chat memory | **Keep** |
| `chaos:init` | 20.9k | Necessary bootstrap | **Keep** |
| `chaos:help` | 15.1k | Fine; includes `--readme` renderer | Keep |
| `chaos:archeology`, `chaos:proposal` | ~0.4k | Self-documenting alias shims | Keep (harmless) |
| `opsx/*` (5) | per upstream | Vendored upstream OpenSpec experimental flow | Keep; watch OPSX drift (risk EA-R5) |

## 5.2 Lifecycle artifact/data flow (Observed from skill texts)

| Stage | Writes | Reads from prior stages |
|---|---|---|
| archaeology | archaeology report + index | code, git |
| propose | `openspec/changes/<id>/*` (via CLI) + `.chaos/changes/<id>/{lifecycle,proposal-report,decision-events}.md` | archaeology, ADRs, rules, config |
| review | `proposal-review.md` (+ `approval.md`), decision-events, lifecycle row | proposal + the same ADRs/rules/archaeology again |
| apply | code + `apply-report.md`, decision-events, lifecycle row | proposal/tasks, review report |
| code-review | `code-review.md` | diff + change folder + OpenSpec change |
| verify | `verification.md` | **full re-read**: proposal/design/spec/tasks + review + apply reports + code + tests + decision-events + waivers |
| archive | `archive-report.md`, lifecycle `Archived` | re-audits tasks, decision events, waivers, debt |
| sync | `sync-report.md` (or repo-wide) ; promotes decisions to ADR/rules/gates | decision-events again + all governance indexes |
| retro | `retro.md` | "completed lifecycle evidence" — everything again |
| todo | items + index + HTML views | re-scans all reports' "Todo Candidates" sections |

Duplicated re-analysis: `decision-events.md` has **six consumers** (apply, verify, archive, sync, retro, todo); verify/archive/retro re-read essentially the same evidence set up to three times. → feeds EA-I13 (evidence index).

## 5.3 Ceremony accounting (standard mode, Observed from skill texts)

- **Artifacts per change:** ~4 OpenSpec files + 10 `.chaos/changes/<id>/` reports (+2 conditional) + ≥3 todo files + interaction JSONs + 5 `.chaos/runtime/` hook files ≈ **17–19 durable Markdown artifacts, 22+ files total.**
- **Human decision stops:** propose ≥2 · review ≥1 · apply ≥1–2 · code-review 1 · verify 1 · archive ≥2 · sync ≥1 · retro 1 · todo 1 ≈ **11–14 stops minimum**; with the runtime enabled, each material stop is a full create → STOP → Decision Center → resume cycle (~15k-token resume chain, or a Stop hook holding the session up to 30 minutes).
- **Five heaviest ceremony sources:** (1) "read all reference files before acting" preambles (apply: 14 files / 38.7 KB; todo: 16); (2) the per-decision stop/resume choreography; (3) double bookkeeping (`lifecycle.md` rows + `decision-events.md`, later reconciled by sync); (4) the todo pipeline (8+ commands emit candidates; todo re-scans everything and regenerates HTML); (5) per-command question banks/templates/proof sections (status's 18.7 KB check catalog is the extreme).

## 5.4 Mode system — genuinely behavioral (Observed, quoted)

- Propose light: "Ask at most three clarification questions… chaos:review is recommended but optional." Standard: "Produce 2–3 approaches. Require Approach Alignment Checkpoint." Strict: "Exact source manifest required… Brownfield work requires archaeology unless explicitly waived… chaos:review is mandatory."
- Apply: continuation with non-direct blockers "Light Yes / Standard Yes, with explicit decisions / Strict No"; apply plan "Brief / Yes / Mandatory detailed"; validation "Suggested / Strongly expected / Required or explicit blocker/waiver."
- OpenSpec degraded mode: "`--strict`: block. `--standard`: ask whether to continue in degraded mode, STOP…, cap confidence."
- Mode escalation is itself a decision stop ("Proceed as strict? [yes/no/waive]").

→ **Strong foundation** as an assurance dial. But the axis conflates **assurance** with **process weight**: modes tighten requirements more than they reduce sessions/artifacts, so a small strict-risk change pays nearly full ceremony.

## 5.5 The central workflow recommendation: risk × execution profile

```text
risk:    light | standard | strict     → which gates and evidence are REQUIRED
profile: micro | compact | full        → how many sessions/artifacts/stops deliver them
```

- **`strict × compact`** — one/two consolidated sessions running propose→apply→verify as phases; **one consolidated change report** with sections instead of 8 report files; decisions **batched** (the runtime already supports `decisionBatching: batch-independent` — currently underexploited); all strict gates intact. This solves the small-but-cross-cutting change (e.g. a 20-line auth tweak: strict assurance without 9 sessions / 19 artifacts). No runtime changes required — it is a prompt-layer restructuring (Recommendation, Confidence: HIGH). → EA-B1.
- **`micro`** — single session, single report; in-chat decisions allowed except strict-gated ones.
- Defaults stay inferable (blast radius → risk; change size → profile), confirmed with **one** decision instead of several.

## 5.6 Hooks (Observed)

7 Python scripts (~118 KB) + 12 reference docs. Committed `.claude/settings.json` wires: SessionStart/UserPromptSubmit (session-context, active-command observability), PostToolUse on Edit|Write|MultiEdit|Bash (`--stamp` provenance frontmatter **during turns** + touched-files), and Stop (stamp, context, stop-summary, plus **`chaos-auto-resume.py --max-wait-seconds 1800`** — polls `.chaos/interactions/` every 1.5s for up to 30 minutes and returns `{"decision":"block"}` to continue the same session after a Decision Center answer). `.chaos/config.yaml` opts in (`autoResume.enabled: true`, `inSessionResume: true`, `adapter: none`).

Findings:

1. **Docs/settings contradiction** — README and config comments say "no hook is wired by default / examples never `--stamp`"; the committed settings wire everything with `--stamp`. A real posture change misdescribed. → Needs attention before beta (EA-I10).
2. **Interpreter fragility** — every hook hardcodes `py -3`; on the audit machine the launcher pointed at a non-existent Python and hooks **silently no-opped**. → Needs attention before beta (EA-I03).
3. **30-minute blocking Stop hook** — defensively written (pure stdlib, degrades to "allow stop" on error, no-ops under the headless runner), but the UX reads as a hung session to a newcomer. → surface a visible wait-state (EA-I12).
4. Per-tool-call cost: every Edit/Write/Bash spawns 2 Python processes (30s+15s timeouts) — a latency tax, especially on Windows.
5. Positive: **no PreToolUse enforcement exists and none is pretended** — protected-file guarding is explicitly documented as spec-only. Honest scoping.

## 5.7 Agents and contract triplication (Observed)

16 agent definitions (118 KB): one orchestrator per command + C# specialist + code-reviewer. They add tool allowlists and persona/workflow framing — but restate the hard gates, stop rules, and mode logic that already live in **both** the command file and the skill. With the Copilot mirror, core rules exist in ≈6 hand-synced copies per command, as *reworded* (not verbatim) variants — the worst case for maintenance. Several agents omit `tools:` frontmatter entirely (→ "All tools"), contradicting e.g. verify's "no production-code edits" hard rule — enforcement is purely textual. → **Needs redesign before v1**: one canonical contract per command; agents/skills as thin pointers; generate the Copilot surface (EA-B3).

## 5.8 Claude↔Copilot parity (Observed)

`tools/chaos-parity-check` verifies **structural surface only** (name sets, file lists, prompt→agent links) with a declared-exceptions manifest; wired into the sole CI workflow; currently `PARITY OK`. Content: **79 of ~204 skill pairs differ** — sampled diffs are deliberate adapter templating (invocation paths, a CLI-with-`--adapter copilot` write path instead of MCP, "resume is manual in Copilot" notes). `copilot-instructions.md` carries honest limitation notes but still claims "no automated parity check" (stale). Semantic drift within same-named files is undetectable by tooling; expect divergence to grow linearly with edits. → **Good public-alpha compromise** shading into **Needs redesign before v1** (generation from one source).

## 5.9 Drift and staleness (Observed)

- **No broken references**: a scripted check of every `reference/*.md` and cross-link in all SKILL/command files resolved 100% — genuinely impressive hygiene for 204 files.
- Stale docs: hooks README vs settings (§5.6); copilot-instructions vs parity CI.
- Development leftovers shipped as skill payload: `chaos-interaction-runtime/PATCH-SUMMARY.md` (9.4 KB) and `chaos-resume/PATCH-SUMMARY.md` (8.4 KB) — iteration changelogs a model may read as instructions. → delete (EA-I06).
- Legacy path era (`.chaos/{reviews,archive-reports,retros}` READ-for-compatibility notes) — documented transitional debt, acceptable.
