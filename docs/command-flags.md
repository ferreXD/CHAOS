# CHAOS command flags & modes — quick reference

Every flag and argument each CHAOS command accepts, with a one-line explanation. This is the
companion to the [command support matrix](command-matrix.md) (which covers *behaviour* — modes,
confidence labels, Copilot status, next-command). Here you get the full **flag surface**.

Positional arguments are shown in `<angle brackets>`. Unless noted, a command that takes no mode
flag **infers** one from the change's risk and confirms it with you first.

---

## Modes at a glance

Most commands share the `--light` / `--standard` / `--strict` **rigor triad** — same idea
everywhere, applied to that command's own work:

| Mode | Use for | Effect (general) |
|---|---|---|
| `--light` | docs, tests, small no-behaviour cleanups | Reports/evidence recommended, not required; only high-impact issues prompt action. |
| `--standard` | normal, bounded feature work | Full evidence/traceability required; blockers block; skipped validation needs a rationale. |
| `--strict` | migrations, auth/security, data, API contracts, production-critical work | Prior reports + OpenSpec validation required; no unresolved blocking/major findings; missing tests for behaviour changes **block**. |

The **default** mode differs by command (see the matrix). Three commands don't use the triad:

- **`chaos:init`** — `guided-confirmation` (default) / `--auto` / `--guided`.
- **`chaos:help`** — takes **subcommands**, not modes.
- **`chaos:status`** — accepts `--strict`; its `--light` is only a per-check *severity modifier*,
  not a run mode.

---

## Conventions (flags that mean the same across commands)

| Flag | Convention wherever it appears |
|---|---|
| `--dry-run` | Never writes; produces the plan / report preview only. |
| `--yes` | Skips repeated confirmations for already-resolved safe steps — never bypasses material decisions, blocking verdicts, or maintainer gates. |
| `--no-write` | Keeps the run report-only (prints in chat); writes nothing to disk. |
| `--write` | Applies proposed writes without the confirmation prompt (never bypasses maintainer-sensitive gates). |
| `--since <ref\|date>` | Limits source discovery to changes since a git ref or date. |
| `--scope <…>` | Narrows the run to a path / module / area (the exact values differ per command, below). |
| `--change <id>` | Targets one OpenSpec change / lifecycle. |

---

## Lifecycle

### `chaos:propose` — `"<intent>" [--light|--standard|--strict]`

| Flag / arg | What it does |
|---|---|
| `"<intent>"` | The change-intent string that seeds the proposal *(positional)*. |
| `--light` | Docs-only / isolated low-risk / spike; ≤3 clarifications, minimal OpenSpec, review optional. |
| `--standard` | Normal changes; 2–3 approaches, full OpenSpec artefacts, recommends review. |
| `--strict` | Brownfield / data / auth / architecture; exact source manifest, review mandatory, no "ready" with blocking gaps. |

*No `--dry-run`. Mode is inferred from risk when omitted and shown with its rationale.*

### `chaos:review` — `<change-id-or-intent> [--light|--standard|--strict]`

| Flag / arg | What it does |
|---|---|
| `<change-id-or-intent>` | The OpenSpec change (or intent) to review *(positional)*. |
| `--light` | Low-risk; may skip deep ADR / archaeology review. |
| `--standard` | Normal; adds ADR/rule alignment, evidence matrix, artefact-quality review. |
| `--strict` | High-risk; mandatory OpenSpec validation, blocks on missing ADR/rule alignment. |

*Mode inferred when omitted; `--standard` is the fallback when risk can't be classified.*

### `chaos:apply` — `<change-id> [--light|--standard|--strict] [--dry-run]`

| Flag / arg | What it does |
|---|---|
| `<change-id>` | The approved change to implement *(positional, required)*. |
| `--light` | Low-risk (docs / tests / small refactor); brief plan, review recommended. |
| `--standard` | Bounded feature work; task-by-task execution, review required unless waived. |
| `--strict` | High-risk; detailed plan required, blocks on non-direct blockers and major findings. |
| `--dry-run` | Preflight / classification / plan only, no code changes (result `DRY_RUN_ONLY`). |

*Mode inferred when omitted; you're asked to accept or override.*

### `chaos:verify` — `<change-id> [--light|--standard|--strict] [--dry-run] [--continue]`

| Flag / arg | What it does |
|---|---|
| `<change-id>` | The change to verify *(positional, required)*. |
| `--light` | Docs / tests; apply + review reports recommended, not required. |
| `--standard` | Bounded work; OpenSpec change + task traceability required. |
| `--strict` | High-risk; review + apply reports and OpenSpec validation required, scope drift blocks. |
| `--dry-run` | Inspect and draft a report; runs no validation commands, amends nothing. |
| `--continue` | Re-reads the prior verification report and reclassifies issues (RESOLVED / STILL_OPEN / NEWLY_INTRODUCED / NO_LONGER_RELEVANT). |

### `chaos:archive` — `<change-id> [--light|--standard|--strict] [--dry-run] [--yes] [--sync-first] [--archive-with-debt] [--no-retro] [--force-waiver]`

| Flag / arg | What it does |
|---|---|
| `<change-id>` | The verified change to close *(positional, required)*. |
| `--light` | Permissive closure; archive with limited evidence / minor classified debt (confidence downgraded). |
| `--standard` | Requires verification report, readiness check, task closure, decision-event classification. |
| `--strict` | High-integrity closure; clean/waived verification, OpenSpec validation, all decisions classified, no unresolved major debt. |
| `--dry-run` | Readiness report + execution plan only, no mutations. |
| `--yes` | Skips repeated confirmations on resolved non-risky steps. |
| `--sync-first` | Runs / prompts a source-of-truth sync before archiving when specs or indexes may be stale. |
| `--archive-with-debt` | Allows closure with classified unresolved debt (each item needs reason, impact, route, follow-up). |
| `--no-retro` | Suppresses the retro recommendation — only when no major learning signal exists. |
| `--force-waiver` | High-friction governance override; can't yield a plain `ARCHIVED` verdict (only `ARCHIVED_WITH_DEBT` / `…_UNDER_GOVERNANCE_OVERRIDE` / `…_BUT_UNCONFIRMED`). |

### `chaos:sync` — `[--change <id> | --all | <scope flag>] [--light|--standard|--strict] [--since <ref>] [--dry-run] [--yes]`

| Flag / arg | What it does |
|---|---|
| `--light` | Small sync; only high-impact questions, safe index updates. |
| `--standard` | **Default**; full drift detection, reconcile decision events, confirm governance updates. |
| `--strict` | Blocks on unclassified decisions; requires traceability + exact patch preview, no vague deferrals. |
| `--change <id>` | Contributor-safe; sync one change lifecycle → `.chaos/changes/<id>/sync-report.md`. |
| `--all` | Repo-owner-only full repo-wide reconciliation (maintainer confirmation gate) → `repo-sync-YYYY-MM-DD.md`. |
| `--adrs` | ADR-focused sync. |
| `--openspec` | OpenSpec-focused sync. |
| `--decisions` | Decision-event promotion only. |
| `--rules` | Rule-consistency sync only. |
| `--gates` | Gate-consistency sync only. |
| `--agents` | `AGENTS.md` / command-parity sync. |
| `--since <ref\|date>` | Limit source discovery to changes since a ref/date. |
| `--dry-run` | Planned actions only, no writes. |
| `--yes` | Apply already-selected safe non-semantic actions without repeated confirmation (never bypasses the `--all` gate). |

---

## Investigate

### `chaos:archaeology` — `<topic> [--light|--standard|--strict] [investigation flags]`

| Flag / arg | What it does |
|---|---|
| `<topic>` | The subject of the bounded investigation *(positional)*. |
| `--light` | Quick orientation (~10–15 files, depth 1, ≤2 questions). |
| `--standard` | **Default baseline**; normal brownfield / proposal prep (~25–40 files, depth 2, ≤5 questions). |
| `--strict` | High-risk (up to ~60 files, depth 3, tests required). |
| `--dry-run` | Show plan / findings; write no report or index. |
| `--scope <path\|module>` | Bound the investigation to a path or module. |
| `--entrypoint <file\|symbol>` | Start from a known entry point. |
| `--from-change <change-id>` | Associate the investigation with an OpenSpec change. |
| `--since <ref\|date>` | Prefer files changed since a ref/date. |
| `--focus <area>` | Narrow the lens: `api\|contracts\|data\|side-effects\|auth\|tests\|observability\|dependencies\|failure-modes`. |
| `--max-files <n>` | Override the file budget. |
| `--max-depth <n>` | Override traversal depth. |
| `--include-tests` | Require a test-evidence scan. |
| `--include-db` | Require a DB / persistence scan. |
| `--include-side-effects` | Require a side-effect scan. |
| `--include-callers` | Include callers of the entry point. |
| `--include-callees` | Include callees of the entry point. |
| `--include-config` | Include runtime / config files. |
| `--include-docs` | Include docs / ADRs / decision logs. |
| `--no-code` | Docs/config archaeology only — skip code. |

### `chaos:code-review` — `[<change-id> | --pr <n> | --since <ref> | --scope <path> | --staged | --working] [--light|--standard|--strict] [--dry-run] [--no-write]`

| Flag / arg | What it does |
|---|---|
| `<change-id>` | Review a change's implementation *(positional)*. |
| `--light` | Small diffs / quick sanity checks. |
| `--standard` | **Default**; normal change / PR / feature reviews. |
| `--strict` | Security / persistence / auth / high-risk; HIGH findings → BLOCKING, no silent downgrade. |
| `--pr <number>` | Review a PR diff (read-only gh/git discovery). |
| `--since <ref\|date>` | Review commits / diff since a ref/date. |
| `--scope <path\|module>` | Review a path or module. |
| `--staged` | Review staged changes. |
| `--working` | Review working-tree changes. |
| `--dry-run` | Review and report in chat, write nothing. |
| `--no-write` | Keep the review report-only (no file); never edits code. |

### `chaos:retro` — `[<change-id> | --period <range> | --since <ref> | --all] [--light|--standard|--strict] [--dry-run] [--yes]`

| Flag / arg | What it does |
|---|---|
| `<change-id>` | Change-scoped retro → `.chaos/changes/<id>/retro.md` *(positional)*. |
| `--light` | Quick capture; top-3 signals, only high-impact decisions. |
| `--standard` | **Default**; full lifecycle analysis, decisions one by one. |
| `--strict` | High-risk / debt-heavy / failed; stronger evidence, a disposition for every major signal. |
| `--dry-run` | No durable writes (optional preview of dashboard / signals / actions / sync-handoff). |
| `--yes` | Skip repeated confirmations for already-selected safe actions (never silently creates governance artifacts). |
| `--period <date-range>` | Run a periodic retro across multiple changes / reports. |
| `--since <ref\|date>` | Analyze lifecycle evidence changed since a ref/date. |
| `--all` | Analyze the full available CHAOS history. |

---

## Set up & operate

### `chaos:init` — `[--auto | --guided]`

| Flag | What it does |
|---|---|
| *(default)* `guided-confirmation` | Discover repo evidence, ask only high-impact questions, confirm before excluding major tracks or treating Proposed ADRs as accepted, then generate files. |
| `--auto` | Generate all files from available evidence without stopping (unless a mandatory gate has no safe fallback); mark uncertain content as assumptions. |
| `--guided` | Section-by-section wizard (context → architecture → constitution → decisions → rules → commands → gates → AGENTS.md → README → bootstrap report), confirming each section. |

### `chaos:doctor` — `[--light|--standard|--strict] [--mcp|--github|--azure-devops|--hooks] [--fix-plan|--fix] [--dry-run]`

| Flag | What it does |
|---|---|
| `--light` | Lighter-ceremony readiness diagnostic. |
| `--standard` | **Default**; standard readiness diagnostic. |
| `--strict` | May require provider-backed facts (missing MCP escalates from warning to failure). |
| `--mcp` | Focus MCP readiness. |
| `--github` | Focus GitHub provider readiness. |
| `--azure-devops` | Focus Azure DevOps provider readiness. |
| `--hooks` | Focus Claude hooks readiness (advisory on the Copilot surface). |
| `--fix-plan` | Propose safe local setup fixes only — do not apply. |
| `--fix` | Apply only safe local setup fixes, one confirmation per item. |
| `--dry-run` | Never write the report; report only. |

### `chaos:status` — `[--strict] [--no-write] [--json] [--scope <area>] [--no-interactive]`

| Flag | What it does |
|---|---|
| *(default)* | Standard audit; writes `.chaos/status-report.md`, asks nothing unless a missing answer would change a blocking verdict. |
| `--strict` | Treats missing provenance, missing source status, undocumented scope exclusions, and ambiguous ADR handling as blockers. |
| `--no-write` | Print the report in chat; don't create/update the status report. |
| `--json` | Emit a machine-readable summary alongside the Markdown report. |
| `--scope <area>` | Audit one dimension + its dependencies. Areas: `architecture\|rules\|commands\|gates\|sources\|config\|toolchain`. |
| `--no-interactive` | Report-only; no remediation prompts. |

*`--light` is a per-check severity modifier (makes some checks advisory), not a run mode.*

### `chaos:todo` — `[--scan|--next|--from-*] [--light|--standard|--strict] [filter flags] [--write|--dry-run] [--close/--reopen/--update <id>]`

| Flag / arg | What it does |
|---|---|
| `--light` | Read existing index / status / doctor only; no deep scan, no writes unless confirmed / `--write`. |
| `--standard` | **Default**; scan normal evidence, dedupe, propose create / update / close. |
| `--strict` | Scan all sources, validate each open item's evidence, detect stale / duplicate / orphan (maintainer confirmation for repo-wide writes). |
| `--scan` | Run the evidence-source scan pass to extract candidates. |
| `--next` | Read-only; show "Recommended next" from the existing index (no full re-scan). |
| `--from-roadmap` | Import candidates from `.chaos/roadmap/*.md` (runs the import decision, then stops). |
| `--from-audit <path>` | Scan an additional single evidence artifact at `<path>`. |
| `--from-change <change-id>` | Scan only that change's `.chaos/changes/<id>/*.md` (contributor-safe). |
| `--target <target>` | Filter to a target: `public-alpha \| v1 \| vNext \| later`. |
| `--priority <priority>` | Filter to a priority: `BLOCKER \| HIGH \| MEDIUM \| LOW`. |
| `--status <status>` | Filter to a status: `open \| in-progress \| closed`. |
| `--type <type>` | Filter to an item type. |
| `--write` | Apply proposed updates, skipping the write-decision prompt (not maintainer-sensitive prompts). |
| `--dry-run` | Never writes, even with `--write`; read-only. |
| `--dedupe` | Re-run dedup across all existing open items. |
| `--refresh` | Regenerate the HTML views from current items / index (no rescan). |
| `--close <todo-id>` | Close a todo (repo-level close is maintainer-sensitive). |
| `--reopen <todo-id>` | Reopen a closed item (clears `closedAt`, status → open). |
| `--update <todo-id>` | Update a todo (e.g. mark in-progress). |

*There is no `--all` for `chaos:todo` — a repo-wide write without a narrowing scope is an anti-pattern.*

### `chaos:resume` — `[--run <id> | --change <id> | --latest] [--light|--standard|--strict] [--write-report]`

| Flag | What it does |
|---|---|
| *(no args)* | Auto-resolve the resume candidate from runtime state. |
| `--run <commandRunId>` | Resume an exact command run by its run ID. |
| `--change <change-id>` | Resume the candidate associated with a change. |
| `--latest` | Resume the latest ready-to-resume session. |
| `--light` | Latest ready session, compact summary, minimal artifact loading, ask before continuing on any ambiguity. |
| `--standard` | **Default**; validate capsule + answered decisions, continue from `nextStep`, write a resume report. |
| `--strict` | Additionally validate session / lock / response / artifact existence; confirm on LOW-confidence capsule or missing artifacts; always write a detailed report. |
| `--write-report` | Force writing a resume report (implicit in standard / strict). |

### `chaos:help` — `[workflow|commands|modes|artifacts|next|<command>] [--readme [--dry-run|--write|--target <path>]]`

| Flag / subcommand | What it does |
|---|---|
| *(no subcommand)* | General help / workflow overview. |
| `workflow` | Explain the CHAOS workflow. |
| `commands` | Explain the available commands. |
| `modes` | Explain command modes. |
| `artifacts` | Explain CHAOS artifacts. |
| `next` | Inspect the workspace and recommend the next command. |
| `<command>` | Show help for a specific named command. |
| `--readme` | Render a candidate workflow README and compare to target; preview by default, writes only after confirmation / `--write`. |
| `--readme --dry-run` | Render / compare only; never write. |
| `--readme --write` | Write the README without interactive confirmation. |
| `--readme --target <path>` | Render / compare against a specific README target path. |

*`demo` is not a supported subcommand.*

---

## See also

- [Command support matrix](command-matrix.md) — modes, confidence labels, Copilot status, and
  next-command per command.
- [Five-minute overview](overview.md) — the lifecycle, artifact layout, and how a decision is
  recorded.

---

*Derived from the current `.claude/commands/` wrappers and `.claude/skills/*/reference/`
mode-and-flag contracts. Aliases (`chaos:archeology`, `chaos:proposal`) inherit their canonical
command's flags. Last updated 2026-07-18.*
