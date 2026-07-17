# Config Awareness — chaos:apply

`chaos:apply` must read `.chaos/config.yaml` when present before resolving paths, tools, validation commands, or implementation-specialist delegation.

## Purpose

The config file centralises repository conventions. It does **not** replace ADRs, rules, gates, OpenSpec artifacts, or lifecycle reports.

## Read order

1. Attempt to read `.chaos/config.yaml`.
2. If present, use it to resolve repository paths and command conventions.
3. If missing or partial, infer defaults and record `CONFIG_MISSING` or `CONFIG_PARTIAL` in the apply report.
4. In `--light` and `--standard`, continue with inferred defaults unless a missing config value creates a direct blocker.
5. In `--strict`, require either a valid config or an explicit user waiver before mutating code.

## Config values used by apply

- `paths.openspec` for OpenSpec change location.
- `paths.reviews` for proposal review report location.
- `paths.applyReports` for apply report output.
- `paths.rules`, `paths.gates`, `paths.decisionLogs`, `paths.adrs` for governance loading.
- `agents.copilot.csharpExpert` for Copilot C# specialist delegation; read `agents.copilot.csharpExpert` only as legacy/informational metadata if present.
- `validation.build.defaultCommand`, `validation.test.defaultCommand`, and `validation.openspec.validateCommand` for validation prompts.
- `policies.commandExecution.*` for mode inference / downgrade behaviour.
- `policies.decisions.*` for Decision Event requirements.
- `policies.confidence.*` for confidence metadata requirements.
- `policies.protectedFiles.*` for protected-file handling.

## Conflict handling

If config conflicts with observed repository reality, do not silently choose one. Produce a `CONFIG_CONFLICT` finding and ask the user one focused question:

1. Use config value for this run.
2. Use observed repository value for this run.
3. Defer and continue with reduced confidence.
4. Stop and fix config.

Record the choice as an `APP-DEC-*` Decision Event when it affects implementation, validation, or specialist delegation.

## Direct blocker guidance

Configuration issues are direct blockers only when they prevent safe execution, for example:

- configured OpenSpec path cannot be resolved and no fallback change can be found;
- configured C# specialist is required by mode but unavailable and no waiver is accepted;
- configured validation command is required by strict mode but cannot be resolved;
- protected-file policy prevents a required mutation.

## Report requirements

The apply report must include a `Config Context` section with:

- config status: `CONFIG_OK | CONFIG_MISSING | CONFIG_PARTIAL | CONFIG_CONFLICT | CONFIG_UNSUPPORTED_VERSION`;
- config path used;
- material config values applied;
- inferred defaults used;
- config-related decisions/waivers;
- confidence impact.
