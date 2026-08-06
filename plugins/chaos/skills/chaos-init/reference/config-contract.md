# CHAOS config contract

`chaos:init` must generate `.chaos/config.yaml` as a lightweight repository-conventions file.

## Purpose

`.chaos/config.yaml` centralises stable repository conventions used by CHAOS commands so each
command does not rediscover the same paths, tools, validation commands, and protected-file
policies.

The config answers **where/how** questions. It must not become a second architecture source of
truth — postures live in `.chaos/architecture.md`, `docs/adr/`, and the decision records.

## Required principles

- Config centralises repository conventions.
- Decision records capture what happened; ADRs and `architecture.md` define what must be true.
- Do not encode architectural decisions in config when they belong in ADRs or `architecture.md`.
- Do not store secrets, credentials, connection strings, tokens, or environment-specific
  private data.
- Do not store hidden approval switches or force-apply policies.
- Do not use config to weaken the stop, the verify, or the record silently.

## Required location

```text
.chaos/config.yaml
```

## Required v0 schema (lean core)

Generate this file with the following sections. Values may be inferred from repository
evidence, user answers, or conservative defaults, but inference status must be recorded in
`.chaos/bootstrap-report.md`.

```yaml
version: 0.1

project:
  name: "<repository-or-project-name>"
  type: "dotnet"                       # or node, python, ...
  primaryLanguage: "csharp"
  specEngine: "openspec"

paths:
  chaos: ".chaos"
  openspec: "openspec"
  adrs: "docs/adr"
  decisions: ".chaos/decisions"        # one decision record per chaos:run change (+ index.md)

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
    defaultCommand: "dotnet build"     # match the repository's real build
    allowPrompt: true
  test:
    defaultCommand: "dotnet test"      # match the repository's real test runner
    allowPrompt: true
  openspec:
    validateCommand: "openspec validate"
    strictFlag: "--strict"

# When chaos:run owes an OpenSpec change (evaluated and shown at the pre-code stop).
# Standing demotion rule (operator, 2026-08-05): if the spec path visibly balloons wall
# time, demote OpenSpec to optional-everywhere and record the observation.
specGate:
  files: 5                             # estimated files touched >= this -> spec owed
  loc: 250                             # estimated LOC >= this -> spec owed
  crossingsAlwaysOwe: true             # any architecture/contract crossing -> spec owed

policies:
  protectedFiles:
    agentsMd:
      path: "AGENTS.md"
      requirePatchPreview: true
      writeRequiresConfirmation: true
    rootReadme:
      path: "README.md"
      requirePatchPreview: true
      writeRequiresConfirmation: true
```

The interaction-runtime policy block (`policies.interactionRuntime` — command integration,
auto-resume, diagnostics, enforcement) and the hook policy blocks (`policies.artifactMetadata`,
`policies.artifactMetadataManagedFiles`, `policies.hooks.runtimeObservability`) are ported with
the toolkit when those capabilities are installed; the shipped CHAOS repository's own
`.chaos/config.yaml` is the reference for their shape.

## Inference and questions

`chaos:init` should infer config values from repository evidence when possible:

- `.sln`, `.csproj`, `Directory.Build.props`, or `global.json` imply `project.type: dotnet`
  and `primaryLanguage: csharp`; `package.json` implies `node`.
- `openspec/` implies `specEngine: openspec` and `paths.openspec: openspec`.
- `docs/adr`, `doc/adr`, `docs/decisions`, or similar folders may infer the ADR path.
- `${CLAUDE_PLUGIN_ROOT}/agents/chaos-csharp-implementation-specialist.md` may infer the Claude C#
  specialist identity (`agents.claude.csharpSpecialist`).

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
2. Preserve existing values unless they conflict with verified repository evidence or user
   instruction.
3. Ask before replacing or semantically changing existing config.
4. Record any conflict, preservation, or amendment in `.chaos/bootstrap-report.md`.

## Validation

Before completing init, perform a lightweight config sanity check:

- required top-level sections exist (`project`, `paths`, `toolchain`, `validation`,
  `specGate`, `policies`);
- configured paths are syntactically valid relative paths;
- no obvious secret-like keys are present;
- toolchain commands match the toolchain preflight contract;
- protected-file policy does not allow silent edits of `AGENTS.md` or root `README.md`.
