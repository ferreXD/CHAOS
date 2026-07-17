---
agent: chaos-sync-orchestrator
description: "Run the chaos:sync workflow through GitHub Copilot."
tools: ['search/codebase', 'search', 'edit', 'vscode/runCommand', 'execute/runInTerminal']
---

# Copilot prompt: `chaos-sync.prompt.md`

You are executing the CHAOS/OpenSpec workflow through GitHub Copilot Agent mode.

## Copilot-native execution contract

- Treat this prompt file as the command wrapper for `chaos-sync`.
- Load `.github/skills/chaos-sync/SKILL.md` when present.
- Use the custom agent `.github/agents/chaos-sync-orchestrator.agent.md` when available or when the user selects/delegates to it.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md` and `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Read `.chaos/config.yaml` if present and resolve paths before defaults.
- For material decisions, ask one decision at a time, show numbered options, and STOP until the user answers.
- Use `.chaos/changes/<change-id>/` for change-scoped artifacts. Legacy scattered folders are read-only compatibility inputs unless a policy says otherwise.
- Use date-prefixed physical filenames for generated governance artifacts; sequential IDs belong in indexes/display references only.

## Source command content converted to Copilot

# `chaos-sync.prompt.md`

Run the CHAOS sync workflow.

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`.github/skills/chaos-shared/reference/model-robustness-policy.md` and
`.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Read `.chaos/config.yaml` before discovering sources or planning patches; use configured paths and protected-file policies.
- Resolve scope and **role level**: `--change <id>` is contributor-safe; `--since/--adrs/--rules/--gates/--agents` are maintainer-level; `--all` is repo-owner-only.
- `--all` requires the **maintainer confirmation gate** before any edit (skip only in `--dry-run`; `--strict` blocks without it; `--yes` must not bypass it). Use the exact prompt below.
- Print a chat-first sync dashboard before any decision loop.
- Reconcile one decision at a time (duplicate IDs, governance promotions, protected-file updates, conflict resolution). **After presenting a decision, STOP. Do not continue until the user selects an option.**
- Attempt to use native interactive selection UI when the GitHub Copilot runtime exposes it. If no explicit UI affordance is available, use the numbered decision block fallback. The fallback is compliant only if the command stops after presenting the options.
- Show a patch preview before writing; never silently rewrite ADRs, rules, gates, architecture, context, `AGENTS.md`, or `README.md`.
- Physical filenames stay date-prefixed/slug-based; assign sequential **display** IDs only when updating indexes.
- Write change-scoped reports under `.chaos/changes/<change-id>/sync-report.md`; repo-wide under `.chaos/sync-reports/repo-sync-YYYY-MM-DD.md`.

### Repository-wide sync authority gate (`--all`)

```text
Decision required: Repository-wide sync authority

Context:
chaos:sync --all is a repository-wide governance reconciliation command.
It may update shared CHAOS governance artifacts such as decisions, rules, gates,
AGENTS.md, README.md, ADR drafts, and decision logs.

Recommended option:
1. Continue only if you are the repository owner or designated CHAOS maintainer.

Options:
1. Yes, continue and record maintainer confirmation.
2. No, switch to chaos:sync --change <change-id>.
3. Dry-run only.
4. Stop.

Select one option to continue.
```

After presenting this decision, **STOP. Do not continue until the user selects an
option.**

### Copilot hardening-drift reconciliation

`chaos:sync` can reconcile missing Copilot command hardening surfaced by `chaos:status`
(`CS-HARDEN-*`): missing command execution contracts, missing OpenSpec gate, missing
decision-protocol references, missing sync authority prompt, missing change-scoped
artifact references, missing artifact-naming-policy references. Reconcile **one item at a
time, with patch preview and confirmation**; never bulk-rewrite command wrappers silently.

### Sonnet-safe execution checklist

- [ ] Config read; scope + role level resolved?
- [ ] Contributor-safe (`--change`) or maintainer/repo-owner (`--all`)?
- [ ] `--all` maintainer confirmation required and obtained (unless `--dry-run`)?
- [ ] Dashboard shown before decisions?
- [ ] One reconciliation decision at a time, stopping after each?
- [ ] Patch preview prepared before writes?
- [ ] Hardening-drift items reconciled with preview (if requested)?
- [ ] Sync report written to the scope-correct path?

Canonical user-facing aliases:

```text
chaos-sync.prompt.md
chaos:sync
```

Supported flags:

```text
--light
--standard
--strict
--dry-run
--yes
--change <change-id>
--all
--adrs
--openspec
--decisions
--rules
--gates
--agents
--since <git-ref-or-date>
```

Delegate the work to the `chaos-sync-orchestrator` agent and the `chaos-sync` skill.

## Required behaviour

1. Inspect the requested scope.
2. Print a compact sync dashboard in chat before asking decision questions.
3. Reconcile decisions one by one.
4. Recommend a promotion/action for each decision, but let the user choose.
5. Show a planned patch preview before writing files.
6. Update files only after explicit confirmation, except safe updates already selected by the user and allowed by `--yes`.
7. Write the sync report to the scope-correct location:
   - `--change <change-id>` → `.chaos/changes/<change-id>/sync-report.md` (contributor-safe)
   - `--all` → `.chaos/sync-reports/repo-sync-YYYY-MM-DD.md`
   - other maintainer scopes → `.chaos/sync-reports/<scope-or-date>-sync-report.md`

Never silently rewrite ADRs, rules, gates, architecture, context, or AGENTS.md.

Config requirement:

- Read `.chaos/config.yaml` before discovering sources or planning patches.
- Include config health in the chat-first sync dashboard.
- Use configured paths for ADRs, decision logs, OpenSpec, rules, gates, reports, archaeology, and agents.
- Respect configured protected-file policies for `AGENTS.md` and `README.md`.
- Reconcile config drift one issue at a time.
- Update `.chaos/config.yaml` only after explicit confirmation and patch preview.

## Protected documentation edits

`chaos:sync` can reconcile `AGENTS.md` / `AGENT.md` and root `README.md` drift.

These files are protected-but-editable:

- show chat-first dashboard with protected-doc drift;
- reconcile each protected-doc issue one by one;
- show patch or rewrite preview;
- ask explicit confirmation;
- record the decision in the sync report;
- run post-sync consistency checks.

If config blocks edits, offer one-time protected-doc override or config-policy update. Do not let `--yes` bypass this decision.

## Interaction Runtime Obligations

Follow the shared **CHAOS Interaction Runtime command protocol** (`.github/skills/chaos-interaction-runtime/SKILL.md`).

For this command:

- sourceCommand: `chaos:sync`
- changeId: optional (`--change`), or repo-wide (`--all`)
- Preflight: `chaos_begin_command`; honour `mustStop: true`. Respect pending decisions
  and existing locks — `chaos:sync --all` must NOT bypass locks held by active changes.
- Material decisions (via `chaos_create_decision`, then STOP): governance drift needing
  a user choice; reconciliation that changes source-of-truth in a materially ambiguous way.
- Preserve the existing maintainer-confirmation / authority posture; a pending decision
  in the interaction runtime is an additional stop, not a replacement for it.
- Completion: release any lock this run acquired; leave diagnostics clean.
