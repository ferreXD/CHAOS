# CHAOS Sync Skill

Use this skill whenever the user invokes `chaos:sync`, `chaos-sync.prompt.md`, or asks to reconcile CHAOS with OpenSpec, ADRs, decisions, rules, gates, reports, or agent instructions.

## Intent

`chaos:sync` is the governance reconciliation command. It detects drift, classifies decisions, promotes lived decisions into durable governance, creates lightweight ADRs/decision logs/rules/gates when selected, updates indexes, reconciles protected documentation (`AGENTS.md` / `AGENT.md` and `README.md`), reconciles Copilot command-suite hardening drift, and writes a sync report.

## Model robustness (non-negotiable)

Execute reliably on the weakest supported Copilot model. Obey
`.github/skills/chaos-shared/reference/model-robustness-policy.md` and
`.github/skills/chaos-shared/reference/interactive-decision-protocol.md`. The `--all`
maintainer confirmation gate, one-decision-at-a-time reconciliation, and
stop-after-decision are mandatory and non-inferable.

## Copilot hardening-drift reconciliation

When `chaos:status` reports `CS-HARDEN-*` drift (missing command execution contracts,
missing OpenSpec gate, missing decision-protocol references, missing sync authority prompt,
missing change-scoped artifact references, missing artifact-naming-policy references),
`chaos:sync` can reconcile it **one item at a time, with patch preview and confirmation**.
Never bulk-rewrite command wrappers silently. These edits touch `.github/` contracts only.

## Repository context (vNext)

`chaos:sync` resolves the provider-neutral repository context contract
(`.github/skills/chaos-shared/reference/repository-context-contract.md`) via the resolution
policy (`repository-context-resolution-policy.md`): MCP → gh/az CLI → local git → manual. MCP
is **optional**; local git fallback always works and caps authority confidence to LOW.

- `chaos:sync --change <change-id>` — resolve context if possible and use review-request
  (PR), branch, and changed-files context to improve the change sync report. **Do not** require
  provider context unless `--strict` and the sync needs provider-backed facts.
- `chaos:sync --all` — resolve repository context **before** any write. This is repository-wide
  governance reconciliation, so authority gating applies (`integrations.repository` +
  `policies.repositoryContext`):
  - **strict** — block if provider context is unavailable and authority is `unknown`; an
    `unknown`/`contributor` user cannot approve repo-wide sync.
  - **standard** — proceed only with explicit maintainer confirmation (a **runtime decision**
    via the Decision Center when command integration is enabled — see workflow step 7); record
    the resolved LOW/MEDIUM authority confidence (confirmation does not upgrade it).
  - **light** — recommend `--dry-run` when provider context is missing.
  - Prefer running on the default branch / mainline; warn (standard) or block (strict) on a
    feature branch.

Include the shared **Repository Context** proof section in the `--all` repo-sync report
(provider, context source, branch, default branch, review request, user, authority confidence,
repo-wide sync posture `ALLOWED|REQUIRES_CONFIRMATION|BLOCKED`, missing capabilities). Tool
profile: `syncChange` / `syncAll` (least privilege, read-only; remote writes require explicit
confirmation per `mcp-security-policy.md`).

## Required workflow

1. Parse invocation and flags.
2. Determine scope, mode, and **role level** (see `change-scope-and-roles.md`):
   - `--change <change-id>` is contributor-safe and reconciles only that change folder.
   - `--since/--adrs/--rules/--gates/--agents` are maintainer-level.
   - `--all` is repo-owner-only and requires the maintainer confirmation gate.
3. Inspect sources.
4. Detect drift.
5. Build chat-first dashboard.
6. Print dashboard before any decision loop, including AGENTS/README drift.
7. For `--all`, ask the maintainer confirmation question before any reconciliation
   (skip only in `--dry-run`; `--strict` blocks without confirmation).
8. Reconcile each decision one by one.
9. For `--all`, detect and reconcile duplicate sequential index IDs one by one.
10. Reconcile protected documentation drift one file/issue at a time.
11. Show planned patch preview, including protected-doc patches or rewrites.
12. Apply confirmed updates.
13. Run post-sync consistency checks.
14. Write the sync report to the scope-appropriate location:
    - `--change <change-id>` → `.chaos/changes/<change-id>/sync-report.md`
    - `--all` → `.chaos/sync-reports/repo-sync-YYYY-MM-DD.md`
    - other scopes → `.chaos/sync-reports/<scope-or-date>-sync-report.md`
15. Produce closure summary.

## Never do

- Do not dump all questions at once.
- Do not silently apply semantic governance updates.
- Do not convert every decision into an ADR.
- Do not create vague rules or gates.
- Do not edit production code.
- Do not hide sync debt.

## Reference files

Read the reference files in this folder before executing:

- `sync-contract.md`
- `change-scope-and-roles.md`
- `config-awareness.md`
- `modes-and-flags.md`
- `dashboard-ux.md`
- `decision-reconciliation-loop.md`
- `promotion-model.md`
- `rule-gate-generation.md`
- `templates.md`
- `protected-doc-reconciliation.md`
- `report-template.md`

## Config awareness

Read `.chaos/config.yaml` before source discovery. Use it to resolve paths, protected-file policies, toolchain/validation conventions, generated README policy, and agent locations. Follow `reference/config-awareness.md`.

Unlike most commands, `chaos:sync` may propose updates to `.chaos/config.yaml` when config drift is detected, but only after one-by-one user reconciliation and patch preview.

## Protected documentation reconciliation

`chaos:sync` may update or rewrite `AGENTS.md` / `AGENT.md` and root `README.md` after explicit confirmation and patch preview.

These files are protected, not immutable. If config blocks edits, offer a protected-doc override or config policy update. Record all protected documentation changes in the sync report.

## Todo Candidates (optional)

`chaos:sync` MAY end its report with an optional `## Todo Candidates` section when governance
reconciliation is deferred (e.g. a drift item the maintainer chose not to fix now), using the
shared fields in `.github/skills/chaos-todo/reference/todo-candidate-contract.md`. This does
not replace `chaos:sync`'s own reconciliation, and `chaos:sync` does not create durable todo
items itself unless it explicitly delegates to `chaos:todo`.
