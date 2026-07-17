# chaos:status Config Audit

`chaos:status` must audit `.chaos/config.yaml` when present and must report when it is missing, partial, stale, conflicting, or unsupported.

## Purpose of `.chaos/config.yaml`

The config file centralizes repository conventions used by CHAOS commands. It is not an architecture decision record and must not compete with ADRs, rules, gates, OpenSpec, or command reports.

It may describe:

- project metadata and primary technology hints;
- repository paths;
- toolchain commands;
- validation commands;
- agent locations;
- protected-file policies;
- confidence and decision-event policy toggles.

It must not contain:

- secrets, credentials, tokens, connection strings, or environment-specific sensitive values;
- architectural decisions that belong in ADRs or decision logs;
- giant rule/gate/prompt bodies;
- hidden approval or bypass switches;
- command-specific implementation instructions that should live in command/skill contracts.

## Config health statuses

Use these statuses in the status report:

- `CONFIG_OK` — config exists, has the expected shape, and no material conflicts were found.
- `CONFIG_MISSING` — config is missing.
- `CONFIG_PARTIAL` — config exists but required sections or material keys are missing.
- `CONFIG_STALE` — config exists but appears older than installed command conventions or references outdated paths/commands.
- `CONFIG_CONFLICT` — config conflicts with repository facts, `AGENTS.md`, command indexes, or discovered files.
- `CONFIG_UNSUPPORTED_VERSION` — config version is newer/older than this status command can safely understand.

## Expected v0 shape

The canonical v0 config shape is:

```yaml
version: 0.1

project:
  name: ""
  type: dotnet
  primaryLanguage: csharp
  specEngine: openspec

paths:
  chaos: .chaos
  openspec: openspec
  adrs: docs/adr
  decisionLogs: docs/decision-log
  rules: .chaos/rules
  gates: .chaos/gates
  commands: .chaos/commands
  archaeology: .chaos/archaeology
  changes: .chaos/changes            # v0: change-scoped artifacts live under .chaos/changes/<change-id>/
  todo: .chaos/todo                  # chaos:todo durable backlog root
  todoItems: .chaos/todo/items       # durable Markdown todo item files (source of truth)
  todoViews: .chaos/todo/views       # generated static, self-contained HTML digest views
  syncReports: .chaos/sync-reports   # global; chaos:sync --all -> repo-sync-YYYY-MM-DD.md
  legacy:                            # READ-only for compatibility; not the preferred output location
    reviews: .chaos/reviews
    proposals: .chaos/proposals
    approvals: .chaos/approvals
    applyReports: .chaos/apply-reports
    verification: .chaos/verification
    archiveReports: .chaos/archive-reports
    retros: .chaos/retros

agents:
  copilot:
    csharpExpert: .github/agents/CSharpExpert.agent.md
  claude:
    csharpSpecialist: chaos-csharp-implementation-specialist

toolchain:
  git:
    required: true
    command: git --version
  node:
    required: true
    minimumVersion: "20.19.0"
    command: node --version
  npm:
    required: true
    command: npm --version
  openspec:
    required: true
    command: openspec --version
    installCommand: npm install -g @fission-ai/openspec@latest

validation:
  build:
    defaultCommand: dotnet build
    allowPrompt: true
  test:
    defaultCommand: dotnet test
    allowPrompt: true
  openspec:
    validateCommand: openspec validate
    strictFlag: --strict

policies:
  generatedReadme:
    defaultTarget: .chaos/README.md
    protectRootReadme: true
    writeRequiresConfirmation: true
    skipIfUpToDate: true
  protectedFiles:
    agentsMd:
      path: AGENTS.md
      allowStatusToEdit: false
      allowSyncToEdit: false
      requirePatchPreview: true
    rootReadme:
      path: README.md
      allowStatusToEdit: false
      allowSyncToEdit: false
      requirePatchPreview: true
  commandExecution:
    inferModeWhenMissing: true
    defaultMode: standard
    allowStrictDowngradeWithRationale: true
  decisions:
    requireDecisionEvents: true
    requireSyncAction: true
  confidence:
    requireKnowledgeType: true
    requireConfidence: true
    requireEvidenceCoverage: true
  changeArtifacts:
    layout: ".chaos/changes/<change-id>"
    writePerChangeReportsUnderChangeFolder: true
    readLegacyReportFolders: true
    migrateLegacyReportsAutomatically: false
    lifecycleManifest: lifecycle.md
  sync:
    changeScopedAllowedForContributors: true
    repoWideSyncRequiresMaintainerConfirmation: true
    repoWideSyncCommand: "chaos:sync --all"
    repoWideSyncReport: ".chaos/sync-reports/repo-sync-YYYY-MM-DD.md"
    mainlineSyncRecommended: true
    mainlineBranch: main
  artifactNaming:
    physicalFilenamesUseDatePrefix: true
    sequentialIdsAssignedInIndexesOnly: true
    dateFormat: "YYYY-MM-DD"
    requireSlug: true
  todo:                              # chaos:todo backlog curation; durable items are Markdown, digests are static HTML
    defaultWriteMode: confirm
    requireSourceEvidence: true
    dedupeBeforeWrite: true
    allowGlobalTodoWritesForContributors: false
    maintainerConfirmationRequiredForAllWrite: true
    scanCodeMarkers: false
    htmlViews:
      enabled: true
      selfContained: true
      externalAssetsAllowed: false
      regenerateOnlyWhenSourcesChange: true
```

The status command may accept compatible supersets, but it must report unknown or unsupported top-level sections as informational unless they weaken governance or hide bypasses.

## v0 collaboration-model config checks

- `policies.changeArtifacts`, `policies.sync`, and `policies.artifactNaming`, plus
  `paths.changes`, are expected for config-aware v0 workspaces. If they are missing, report
  `CONFIG_PARTIAL` and route to the `CS-CHG-*` checks in `check-catalog.md`.
- If `policies.changeArtifacts.migrateLegacyReportsAutomatically` is `true`, report a
  `CONFIG_CONFLICT` — automatic migration is out of scope for v0 (legacy artifacts are
  read-compatible, not auto-migrated).
- If `policies.sync.repoWideSyncRequiresMaintainerConfirmation` is `false`, report a MAJOR
  governance finding (the `chaos:sync --all` maintainer gate must not be bypassable).

## Required audit checks

### CS-CONFIG-001 — Config presence

- If `.chaos/config.yaml` exists: audit its contents.
- If missing and the workspace was bootstrapped with a config-aware `chaos:init`: report `CONFIG_MISSING`.
- If missing in default mode: `MAJOR` unless the workspace is pre-config and explicitly defers config adoption.
- If missing in `--strict`: `BLOCKER`.

### CS-CONFIG-002 — Version supported

`version` must exist and be compatible with this command. v0 expects `0.1`.

Unsupported versions must not be silently interpreted. Report `CONFIG_UNSUPPORTED_VERSION`.

### CS-CONFIG-003 — Required top-level sections

Expected sections:

- `version`
- `project`
- `paths`
- `agents`
- `toolchain`
- `validation`
- `policies`

Missing material sections produce `CONFIG_PARTIAL`.

### CS-CONFIG-004 — Path coherence

Config paths must be internally coherent and should match discovered repository files.

Examples:

- `paths.chaos` should point to `.chaos` unless explicitly customized.
- `paths.openspec` should point to the OpenSpec workspace if `project.specEngine` is `openspec`.
- `paths.adrs` and `paths.decisionLogs` may be missing physically in early projects, but must be reported as `missing`, not assumed.

### CS-CONFIG-005 — Toolchain coherence

Toolchain checks should use commands from config when present. If config is missing, use default CHAOS/OpenSpec checks.

Do not mark a tool as `PASS` unless command output or a verified path supports it.

### CS-CONFIG-006 — Validation command honesty

Validation commands in config must not be invented as proven working. If `dotnet build` or `dotnet test` is configured but not executed, mark as configured but unverified.

### CS-CONFIG-007 — Protected file policy

Config must define, or status must infer, protected-file handling for:

- `AGENTS.md`
- root `README.md`

Status may propose changes to these files but must not edit them unless explicitly confirmed and allowed by policy.

### CS-CONFIG-008 — No secret or architecture leakage

If config appears to contain secrets, credentials, connection strings, or architecture decisions that belong in ADRs, report a `MAJOR` finding. In `--strict`, secrets or hidden approval bypasses are `BLOCKER`.

### CS-CONFIG-009 — Policy coherence

The config should not contain hidden bypass policies that weaken CHAOS governance, such as silent approval, silent protected-file edits, or force-apply defaults.

### CS-CONFIG-010 — Bootstrap provenance

If `.chaos/bootstrap-report.md` exists, verify whether it records config creation, preservation, conflict handling, or deferral.

## Report requirements

The status report must include a `Config Health` section or subsection with:

| Check | Status | Severity | Knowledge type | Confidence | Evidence | Impact | Remediation |
|---|---|---|---|---|---|---|---|

Also include:

- detected config version;
- config path;
- required sections found/missing;
- toolchain source: `config`, `defaults`, or `mixed`;
- validation command source: `config`, `defaults`, or `unknown`;
- protected-file policy summary;
- conflicts between config and repository facts.

## Remediation choices

If config is missing, partial, stale, or conflicting, ask the user whether to:

1. `Fix now` — create or patch `.chaos/config.yaml` from detected conventions.
2. `Create remediation plan` — record the required config work in `.chaos/status-report.md`.
3. `Defer with rationale` — record why config adoption is deferred.
4. `Mark accepted risk` — record that the human owner accepts config drift.
5. `Do nothing` — leave files unchanged.

Never create or patch `.chaos/config.yaml` without explicit user confirmation.

## Protected docs are not immutable

Config protected-file policy for `AGENTS.md` / `AGENT.md` and root `README.md` must distinguish protection from immutability.

Valid policy shape may express:

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

If existing config says status/sync cannot edit protected docs at all, classify this as `CONFIG_STALE` or `CONFIG_CONFLICT` when protected documentation drift exists. The command should recommend updating the policy or using a one-time protected-doc override with rationale.

Hard rule: protected documentation may never be edited silently, but it may be edited or rewritten after explicit confirmation and patch preview.
