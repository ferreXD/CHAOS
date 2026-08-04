# CHAOS Sync Skill

Use this skill whenever the user invokes `chaos:sync`, `/chaos-sync`, or asks to reconcile CHAOS with OpenSpec, ADRs, decisions, rules, gates, reports, or agent instructions.

## Intent

`chaos:sync` is the governance reconciliation command. It detects drift, classifies decisions, promotes lived decisions into durable governance, creates lightweight ADRs/decision logs/rules/gates when selected, updates indexes, reconciles protected documentation (`AGENTS.md` / `AGENT.md` and `README.md`), reconciles Claude command-suite hardening drift, and writes a sync report.

## Stage-C: classified OpenSpec depth is not drift

When a change's `.chaos/changes/<change-id>/classification-state.json` exists (design
`docs/design/2026-08-02-stage-c-progressive-rigor.md`, C-10/C-13), its `openspec` dimension is
the reconciliation baseline: a change classified `openspec 0` (no OpenSpec artifacts —
contract lives in `change.md`) or `openspec 1` (delta only) is **conforming, not drifted**.
Drift is a MISMATCH between the classified obligation and what exists, in either direction
(an owed delta missing; a full set demanded by a later firing but absent; or spec artifacts
present that no dimension or floor demanded — flag, don't delete). Legacy changes without
classification state keep the old full-set expectation.

## Model robustness (non-negotiable)

Execute reliably on the weakest supported Claude model. Obey
`.claude/skills/chaos-shared/reference/model-robustness-policy.md` and
`.claude/skills/chaos-shared/reference/interactive-decision-protocol.md`. The `--all`
maintainer confirmation gate, one-decision-at-a-time reconciliation, and
stop-after-decision are mandatory and non-inferable.

## Claude hardening-drift reconciliation

When `chaos:status` reports `CS-HARDEN-*` drift (missing command execution contracts,
missing OpenSpec gate, missing decision-protocol references, missing sync authority prompt,
missing change-scoped artifact references, missing artifact-naming-policy references),
`chaos:sync` can reconcile it **one item at a time, with patch preview and confirmation**.
Never bulk-rewrite command wrappers silently. These edits touch `.claude/` contracts only.

## Repository context (vNext)

`chaos:sync` resolves the provider-neutral repository context contract
(`.claude/skills/chaos-shared/reference/repository-context-contract.md`) via the resolution
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

## Governance-digest maintenance (L2)

`chaos:sync` is the sole maintainer of the governance digest
(`chaos-shared/reference/governance-digest.md`) — the hash-keyed projection `chaos:run`
reads instead of the full governance sources. On every run (and always after any
governance-source edit): `python tools/chaos-digest/digest.py --check`; on staleness,
re-author only the stale **compiled** sections, `--stamp`, re-check to exit 0, and show the
compiled diffs in the sync report. Full procedure:
`reference/governance-digest-maintenance.md`.

## Required workflow

1. Parse invocation and flags.
2. Determine scope, mode, and **role level** (see `change-scope-and-roles.md`):
   - `--change <change-id>` is contributor-safe and reconciles only that change folder.
   - `--since/--adrs/--rules/--gates/--agents` are maintainer-level.
   - `--all` is repo-owner-only and requires the maintainer confirmation gate.
3. Inspect sources. For `--all`, resolve repository context and evaluate authority posture
   before any reconciliation write.
4. Detect drift.
5. Build chat-first dashboard.
6. Print dashboard before any decision loop, including AGENTS/README drift.
7. For `--all`, the maintainer / repo-owner confirmation is a **material decision**. When
   `policies.interactionRuntime.commands.enabled` is true and the runtime is available, create
   it **through the runtime** (`chaos_create_decision`) with `interactionType: confirmation`
   (a yes/no gate — two options, e.g. `confirm-repo-owner` / `not-owner-stop`), receive
   `mustStop: true`, and **STOP**. It is answered in the Decision
   Center; `chaos:resume` then continues the sync. Do **not** ask it as an ordinary chat
   question in this mode. Only when command integration is disabled or the runtime is
   unavailable, fall back to the in-chat maintainer confirmation
   (`interactive-decision-protocol.md`). Skip in `--dry-run`; `--strict` blocks without
   confirmation. Contract: `.claude/skills/chaos-interaction-runtime/reference/material-decision-protocol.md`.
8. Reconcile each decision one by one.
9. For `--all`, detect and reconcile duplicate sequential index IDs one by one.
10. Reconcile protected documentation drift one file/issue at a time.
11. Show planned patch preview, including protected-doc patches or rewrites.
12. Apply confirmed updates.
13. Run post-sync consistency checks.
14. Record the sync outcome:
    - `--change <change-id>` → emit `.chaos/changes/<change-id>/records/sync.pass-NN.facts.json`
      per `chaos-shared/reference/record-emission.md` (envelope `verdict`:
      `RECONCILED | PARTIALLY_RECONCILED | NOT_RECONCILED`; `facts`: invocation/role level,
      source manifest, drift findings `SYNC-###` with APPLY/RECOMMEND/DEFER actions, the
      decision reconciliation matrix — **one row per ledger entry as of sync, per the §2 scan
      rule** — applied actions + not-modified assertion, rule/gate candidates, debt, consistency
      checks, rollup; closure prose in `commentary`), then render
      `python tools/chaos-render/render.py <change-id> --write` — the renderer writes
      `sync-report.md` and the lifecycle Sync row; never hand-write them.
    - `--all` → `.chaos/sync-reports/repo-sync-YYYY-MM-DD.md` (repo-scoped, hand-written as today)
    - other scopes → `.chaos/sync-reports/<scope-or-date>-sync-report.md` (hand-written as today)
15. Produce closure summary.

## Never do

- Do not dump all questions at once.
- Do not silently apply semantic governance updates.
- Do not convert every decision into an ADR.
- Do not create vague rules or gates.
- Do not regenerate retired narrative reports for `change.md`-based changes: on such changes
  (e.g. the collapsed light path — `chaos-shared/reference/change-template.md`) sync keys on
  `decision-events.md` (anatomy unchanged) plus the `change.md` status/verdict fields, and
  updates indexes only. The lifecycle Sync row, `lifecycle.current.syncState` and
  `sync-report.md` come from the sync phase record via the renderer (step 14) — emitting the
  record + rendering is a change-scoped state write, not a shared-governance edit; never
  hand-edit the rendered files.
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
- `governance-digest-maintenance.md`
- `report-template.md`
- `.claude/skills/chaos-shared/reference/repository-context-contract.md`
- `.claude/skills/chaos-shared/reference/repository-context-resolution-policy.md`
- `.claude/skills/chaos-shared/reference/mcp-security-policy.md`

## Config awareness

Read `.chaos/config.yaml` before source discovery. Use it to resolve paths, protected-file policies, toolchain/validation conventions, generated README policy, and agent locations. Follow `reference/config-awareness.md`.

Unlike most commands, `chaos:sync` may propose updates to `.chaos/config.yaml` when config drift is detected, but only after one-by-one user reconciliation and patch preview.

## Todo Candidates (optional)

`chaos:sync` MAY end its report with an optional `## Todo Candidates` section when governance
reconciliation is deferred (e.g. a drift item the maintainer chose not to fix now), using the
shared fields in `.claude/skills/chaos-todo/reference/todo-candidate-contract.md`. This does
not replace `chaos:sync`'s own reconciliation, and `chaos:sync` does not create durable todo
items itself unless it explicitly delegates to `chaos:todo`.

## Protected documentation reconciliation

`chaos:sync` may update or rewrite `AGENTS.md` / `AGENT.md` and root `README.md` after explicit confirmation and patch preview.

These files are protected, not immutable. If config blocks edits, offer a protected-doc override or config policy update. Record all protected documentation changes in the sync report.
