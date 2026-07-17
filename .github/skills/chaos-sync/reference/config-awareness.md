# Config Awareness and Reconciliation — chaos:sync

`chaos:sync` must read `.chaos/config.yaml` before reconciling governance. Unlike most commands, sync may also propose config updates when config drift is part of the reconciliation problem.

## Purpose

Config centralises repository conventions: paths, toolchain commands, validation commands, agent locations, protected-file policies, and confidence/decision-event toggles. It must not contain architecture decisions, secrets, credentials, connection strings, or hidden approval switches.

## Read order

1. Read `.chaos/config.yaml` if present.
2. Use configured paths to discover ADRs, decision logs, OpenSpec, rules, gates, commands, reports, retros, and archaeology artifacts.
3. If config is missing, emit `CONFIG_MISSING` and recommend creating it through `chaos:init` or a confirmed sync action.
4. If config is partial, emit `CONFIG_PARTIAL` and propose filling only repository-convention gaps.
5. If config conflicts with observed repository reality, emit `CONFIG_CONFLICT` and reconcile one conflict at a time.

## Config reconciliation actions

For each config issue, ask the user one by one:

1. Update config to match observed repository reality.
2. Keep config and treat observed files as drift.
3. Add a temporary sync debt item.
4. Defer with rationale.
5. Stop sync.

Semantic config updates require explicit confirmation and patch preview, even with `--yes`.

## Config values used by sync

- `paths.*` for source and target discovery.
- `policies.protectedFiles.agentsMd` and `policies.protectedFiles.rootReadme` for AGENTS.md / README.md mutation policy.
- `policies.generatedReadme.*` for generated README handling.
- `policies.decisions.*` for Decision Event classification requirements.
- `policies.confidence.*` for finding/verdict metadata.
- `toolchain.*` for toolchain drift classification.
- `validation.*` for validation command consistency.
- `agents.*` for Copilot specialist path checks.

## Protected file policy

When config says a protected file cannot be edited by sync:

- show the proposed patch anyway;
- mark the action as `BLOCKED_BY_PROTECTED_FILE_POLICY`;
- ask whether to defer, override with rationale, or update config policy;
- never silently bypass the policy.

When config allows sync to edit a protected file, still show the patch preview and ask for confirmation unless the exact semantic action was already selected during the decision loop.

## Rule and gate generation

Create rules and gates under configured paths. Always update the configured rule/gate indexes. If config paths are missing, use `.chaos/rules` and `.chaos/gates` as inferred defaults and record `CONFIG_PARTIAL`.

## Report requirements

The sync report must include:

- `Config Health`;
- `Config Drift Findings`;
- `Config Reconciliation Decisions`;
- config values used for path/tool/policy resolution;
- config updates applied or deferred;
- sync debt caused by config issues;
- post-sync consistency results including config/index agreement.

## Protected documentation override policy

Protected files are not immutable. If `policies.protectedFiles.*` disallows edits to `AGENTS.md`, `AGENT.md`, or root `README.md`, sync must still show the proposed patch and offer:

1. Apply once with protected-doc override and rationale.
2. Update config policy to allow confirmed status/sync edits.
3. Defer with rationale.
4. Mark accepted drift.
5. Stop sync.

A protected-doc override is a semantic governance decision. It must be recorded in the sync report and must not be triggered by `--yes`.

Recommended policy shape:

```yaml
policies:
  protectedFiles:
    agentsMd:
      path: AGENTS.md
      allowStatusPatch: true
      allowSyncPatch: true
      requirePatchPreview: true
      requireExplicitConfirmation: true
      allowRewriteWithConfirmation: true
    rootReadme:
      path: README.md
      allowStatusPatch: true
      allowSyncPatch: true
      requirePatchPreview: true
      requireExplicitConfirmation: true
      allowRewriteWithConfirmation: true
```
