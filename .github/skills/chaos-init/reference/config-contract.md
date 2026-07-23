# CHAOS config contract

`chaos:init` must generate `.chaos/config.yaml` as a lightweight repository-conventions file.

## Purpose

`.chaos/config.yaml` centralises stable repository conventions used by CHAOS commands so each command does not rediscover the same paths, tools, agents, validation commands, and protected-file policies.

The config answers **where/how** questions. It must not become a second architecture source of truth.

## Required principles

- Config centralises repository conventions.
- Reports capture what happened.
- ADRs, decision logs, rules, gates, and OpenSpec define what must be true.
- Do not encode architectural decisions in config when those decisions belong in ADRs, rules, gates, or OpenSpec.
- Do not store secrets, credentials, connection strings, tokens, or environment-specific private data.
- Do not store hidden approval switches or force-apply policies.
- Do not use config to weaken CHAOS governance silently.

## Required location

```text
.chaos/config.yaml
```

## Required v0 schema

Generate this file with the following sections. Values may be inferred from repository evidence, user answers, or conservative defaults, but inference status must be recorded in `.chaos/bootstrap-report.md`.

```yaml
version: 0.1

project:
  name: "<repository-or-project-name>"
  type: "dotnet"
  primaryLanguage: "csharp"
  specEngine: "openspec"

paths:
  chaos: ".chaos"
  openspec: "openspec"
  adrs: "docs/adr"
  decisionLogs: "docs/decision-log"
  rules: ".chaos/rules"
  gates: ".chaos/gates"
  commands: ".chaos/commands"
  archaeology: ".chaos/archaeology"
  changes: ".chaos/changes"            # v0: change-scoped artifacts live under .chaos/changes/<change-id>/
  todo: ".chaos/todo"                  # chaos:todo durable backlog root
  todoItems: ".chaos/todo/items"       # durable Markdown todo item files (source of truth)
  todoViews: ".chaos/todo/views"       # generated static, self-contained HTML digest views
  syncReports: ".chaos/sync-reports"   # global; chaos:sync --all -> repo-sync-YYYY-MM-DD.md
  legacy:                              # READ-only for compatibility; not the preferred output location
    reviews: ".chaos/reviews"
    proposals: ".chaos/proposals"
    approvals: ".chaos/approvals"
    applyReports: ".chaos/apply-reports"
    verification: ".chaos/verification"
    archiveReports: ".chaos/archive-reports"
    retros: ".chaos/retros"

agents:
  copilot:
    csharpExpert: ".github/agents/CSharpExpert.agent.md"
  claude:
    csharpSpecialist: "chaos-csharp-implementation-specialist"

toolchain:
  git:
    required: true
    command: "git --version"
  node:
    required: true
    minimumVersion: "20.19.0"
    command: "node --version"
  npm:
    required: true
    command: "npm --version"
  openspec:
    required: true
    command: "openspec --version"
    installCommand: "npm install -g @fission-ai/openspec@latest"

validation:
  build:
    defaultCommand: "dotnet build"
    allowPrompt: true
  test:
    defaultCommand: "dotnet test"
    allowPrompt: true
  openspec:
    validateCommand: "openspec validate"
    strictFlag: "--strict"

policies:
  generatedReadme:
    defaultTarget: ".chaos/README.md"
    protectRootReadme: true
    writeRequiresConfirmation: true
    skipIfUpToDate: true
  protectedFiles:
    agentsMd:
      path: "AGENTS.md"
      allowStatusToEdit: false
      allowSyncToEdit: false
      requirePatchPreview: true
    rootReadme:
      path: "README.md"
      allowStatusToEdit: false
      allowSyncToEdit: false
      requirePatchPreview: true
  commandExecution:
    inferModeWhenMissing: true
    defaultMode: "standard"
    allowStrictDowngradeWithRationale: true
  lightMode:                           # collapsed light lifecycle (FRAME -> DELIVER)
    collapsedWorkflow: true
    maxMaterialDecisions: 2            # exceeding this auto-escalates light -> standard
    autoEscalate: true                 # never ask; always announce + record (escalatedFrom, ESC-*)
    allowStandaloneApplyEntry: true
  decisions:
    requireDecisionEvents: true
    requireSyncAction: true
  confidence:
    requireKnowledgeType: true
    requireConfidence: true
    requireEvidenceCoverage: true
  changeArtifacts:                     # v0 team-safe collaboration model; canonical: .chaos/changes/README.md
    layout: ".chaos/changes/<change-id>"
    writePerChangeReportsUnderChangeFolder: true
    readLegacyReportFolders: true
    migrateLegacyReportsAutomatically: false
    lifecycleManifest: "lifecycle.md"
  sync:
    changeScopedAllowedForContributors: true
    repoWideSyncRequiresMaintainerConfirmation: true
    repoWideSyncCommand: "chaos:sync --all"
    repoWideSyncReport: ".chaos/sync-reports/repo-sync-YYYY-MM-DD.md"
    mainlineSyncRecommended: true
    mainlineBranch: "main"
  artifactNaming:
    physicalFilenamesUseDatePrefix: true
    sequentialIdsAssignedInIndexesOnly: true
    dateFormat: "YYYY-MM-DD"
    requireSlug: true
  todo:                                # chaos:todo backlog curation; durable items are Markdown, digests are static HTML
    defaultWriteMode: "confirm"
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

## Inference and questions

`chaos:init` should infer config values from repository evidence when possible:

- `.sln`, `.csproj`, `Directory.Build.props`, or `global.json` imply `project.type: dotnet` and `primaryLanguage: csharp`.
- `openspec/` implies `specEngine: openspec` and `paths.openspec: openspec`.
- `docs/adr`, `doc/adr`, `docs/decisions`, or similar folders may infer ADR/decision-log paths.
- `.github/agents/CSharpExpert.agent.md` may infer the Copilot C# expert path.
- `.github/agents/chaos-csharp-implementation-specialist.agent.md` may infer the Copilot C# specialist identity.

Ask only when values materially affect command behaviour and cannot be inferred safely.

## Bootstrap report requirements

`.chaos/bootstrap-report.md` must include a config section with:

- whether `.chaos/config.yaml` was created, updated, preserved, or skipped;
- which config values were verified, inferred, defaulted, or user-provided;
- conflicts between existing config and detected repository evidence;
- user decisions for any config conflict or missing high-impact value;
- whether generated config contains only conventions and no architecture decisions/secrets.

## Existing config handling

If `.chaos/config.yaml` already exists:

1. Read it before generating new files.
2. Preserve existing values unless they conflict with verified repository evidence or user instruction.
3. Ask before replacing or semantically changing existing config.
4. Record any conflict, preservation, or amendment in `.chaos/bootstrap-report.md`.

## Validation

Before completing init, perform a lightweight config sanity check:

- required top-level sections exist;
- configured paths are syntactically valid relative paths;
- no obvious secret-like keys are present;
- toolchain commands match the toolchain preflight contract;
- protected-file policy does not allow silent edits of `AGENTS.md` or root `README.md`.
