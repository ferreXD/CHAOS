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
    bodyHash: "sha256:d52c1931ca99b56feb2774d7786257614492619c279eb8ba02e23e8495fd3c68"
---

# 02 — What CHAOS is, and what is actually implemented

Part of the CHAOS public-alpha external assessment · assessed commit `6421feb` · 2026-07-18 · [Index](README.md)
Labels: Observed / Reported (author) / Inferred / Hypothesis / Recommendation / Unknown

## 2.1 Category and identity

CHAOS is a combination of four things (Observed):

1. A **prompt/command framework** — 17 command definitions + 204 skill files + 16 agent definitions for Claude Code, mirrored for Copilot (~70% of the repo by file volume: 576 of 831 tracked files are markdown).
2. An **interaction runtime** — real software: file-backed state store + MCP server + auto-resume runner + diagnostics + VS Code Decision Center (~172 TypeScript files, ~13.6k LOC src).
3. An **SDLC governance methodology** — OpenSpec-wrapped lifecycle, risk modes, confidence doctrine, decision events, ADR/rule/gate conventions.
4. A **developer-experience surface** — Decision Center panel, doctor, status, self-contained HTML todo digest.

It is *not* an agent runtime (Claude Code/Copilot are the runtimes) and not an orchestration engine (delegation is prompt-choreographed, not scheduled).

**Coherent or fragmented?** Conceptually coherent — everything serves one idea: *material decisions are durable runtime state, and evidence must carry its confidence*. Implementationally top-heavy: the methodology's mass (1.2 MB × 2 surfaces of prose contracts, triplicated per command) dwarfs the mechanical enforcement it gets (Inferred, Confidence: HIGH).

## 2.2 Core abstractions

`commandRunId` (command session) · `changeId` (unit of governance and lock granularity) · **decision** (`created → waiting → answered → consumed`; terminals `cancelled/expired/superseded`) · **session** (`created → running → waiting-for-decision → ready-to-resume → resumed → running`; terminals `completed/cancelled/expired/failed`; two documented administrative edges `ready-to-resume → completed/cancelled`) · **lock** (per-change, acquired at first decision, held until command completion) · **resume capsule** (semantic summary — intent, approved scope, constraints, next step — never a transcript) · **decision event** (`PROP-DEC-001`-style human ledger entry) · **confidence labels** (FACT/INFERENCE/ASSUMPTION/UNKNOWN × HIGH/MEDIUM/LOW × evidence coverage). All Observed in code and schemas.

## 2.3 Conceptual model

```text
intent
→ evidence            chaos:archaeology → confidence-rated findings
→ proposal            chaos:propose → OpenSpec change + first decisions   [runtime stops]
→ human decision      Decision Center; lock held; capsule written         [runtime core]
→ gate                chaos:review → approval
→ governed execution  chaos:apply, task-by-task                           [runtime stops; resume]
→ review+verification chaos:code-review, chaos:verify
→ archive             OpenSpec deltas promoted; decisions audited
→ sync                decisions → durable decision-log / ADRs
→ retrospective       chaos:retro → rule/gate/prompt improvements
→ backlog             chaos:todo — evidence → curated items
   ⟲ chaos:resume / runner / Stop hook re-enter wherever a decision paused things
   ⟲ chaos:doctor / chaos:status / diagnostics watch the machinery itself
```

Minimal experience (config-supported, Observed): runtime disabled (`interactionRuntime.commands.enabled: false` → classic in-chat decisions), tiny path `propose → apply → verify` in `--light`. Full experience: brownfield path, all 9+ stages, runtime on, Decision Center, auto-resume, hooks. Small/normal/high-risk differentiation exists via three named paths and three modes — but risk and ceremony are coupled on a single axis (see [05-workflow-commands.md](05-workflow-commands.md)).

## 2.4 Implementation status classification

| Status | What | Evidence |
|---|---|---|
| **Implemented and validated** | Interaction runtime core (sessions, decisions, locks, capsules, audit); MCP server (13 tools); Decision Center answering flow; manual resume; parity checker + its CI; example app | 264/266 tests pass (ran); 8 real decision cycles incl. 11-min pause/resume with human rationale in `.chaos/interactions/`; `dotnet build` 0 warnings + 5/5 tests (ran); `PARITY OK` (ran) |
| **Implemented; validated privately, unverifiable publicly** *(amended per author clarification)* | The full governance lifecycle (propose → review → apply → code-review → verify → archive → sync → retro) — Reported exercised on CHAOS itself, the demo, and one real company brownfield project with good results. Public repo shows runtime sessions for only 3 of 17 commands (todo ×5, apply ×1, archive ×1, ~16h window) and zero committed artifact trails | Reported (author, 2026-07-18); corroborated by the 2026-07-01 OSS audit's "presentational/packaging, not workflow" framing; **addressed by EA-V1 showcase decision** |
| **Implemented but lightly validated** | Auto-resume runner (69/69 tests incl. `fake-claude` process double; config here runs `adapter: none`); in-session Stop-hook resume (live in this repo's config; no captured runs); diagnostics (65/65 tests; no dogfood reports on disk); Copilot adapter (structural parity ✓, honest limitation notes, zero execution evidence) | package tests (ran); `.claude/settings.json`; `.chaos/config.yaml` |
| **Documented but not implemented** | Protected-file guard ("spec-only; no script exists" — its own todo); capsule integrity hash (`validatesAgainstDecisionHash` always `null`); schema migration (version field, zero migration code); the demo walkthrough's artifacts (self-disclosed "representative excerpts") | `tools/chaos-interaction-runtime` source; `docs/demo/README.md`; `.chaos/todo/` |
| **Designed for a future iteration** | Repository-context/MCP authority policy, per-command MCP least-privilege profiles, Azure DevOps provider, sync roles model — richly specified in `config.yaml` + contracts, enforcement textual | `.chaos/config.yaml:186-372` |
| **Aspirational** | Team/multi-developer operation; provider neutrality beyond Copilot; `chaos:gate` (fate explicitly undecided in backlog) | `.chaos/todo/index.md` |
| **Unknown** | Behavior under real concurrent writers (agent + runner + panel); Copilot adapter in anger; resume quality when capsules stay skeletal (all 7 public-repo capsules have empty scope/constraint arrays) | — |

## 2.5 Public-repo dogfood evidence (raw numbers, Observed)

- `.chaos/` totals 509 KB / 87 files (45 tracked, 42 gitignored runtime state).
- Runtime state: **7 sessions** (all `completed`), **8 decisions** (all `consumed`), **7 capsules**, **2 locks** (both `released`), **57 audit events** spanning 2026-07-17T18:05 → 2026-07-18T10:08.
- One real decision, quoted: *"Apply protected-file rewrite of root README.md?"* — 3 options with consequence text, 1,900-char context; answered `apply-rewrite` with substantive human rationale, `selectedBy: "vscode-user"`, `source: "vscode-decision-center"`.
- One real pause/resume cycle from the per-decision audit chain: lock-acquired 19:30:56 → decision-created 19:30:57 → decision-answered 19:33:40 → decision-consumed 19:42:03 → lock-released 19:42:10 (~2m43s human latency, ~11 minutes total).
- Todo backlog: 21 items (6 open, 15 done) with provenance IDs and closure criteria; 74 KB generated HTML digest.
- Absent (verified against full git history): `openspec/`, `.chaos/changes/`, `docs/adr/`, `docs/decision-log/`, `.chaos/archaeology/`, `.chaos/status-report.md`, `.chaos/interactions/examples/` (the test fixture).

## 2.6 Where documentation and implementation disagree (all Observed, all verified)

1. Hooks README and `config.yaml` comments state "no hook is wired into committed settings.json by default" — `.claude/settings.json` wires all of them, including `--stamp` file-writes during turns and a 30-minute blocking Stop hook (`chaos-auto-resume.py --max-wait-seconds 1800`).
2. `docs/command-matrix.md:116` claims a "full GitHub Copilot mirror"; the surface is hand-maintained, 79/204 skill files intentionally diverge, and parity checking is structural-only.
3. README/installation call the demo "runnable"; its artifacts are authored illustrations (self-disclosed in `docs/demo/README.md`).
4. Roadmap marks "Repository sanitization" completed; `.claude/hooks/README.md:207-215` still carries private-client traces (`customer-inventory-api`, `ferrexd`, `azure-devops`) and `.claude/settings.local.json` (tracked) leaks an `ado-remote-mcp` server name; `config.yaml` still declares `project.type: dotnet` / `primaryLanguage: csharp` for a TypeScript+Markdown repo and a `mainlineBranch: chaos/main` that does not exist.
5. `copilot-instructions.md` says "no automated parity check" — one now runs in CI.
6. `.mcp.json` points at `tools/chaos-interaction-mcp/dist/…` which is untracked and absent on fresh clone until `npm run build`.
