# Config Awareness — chaos:review

`chaos:review` must read `.chaos/config.yaml` when present before resolving OpenSpec, ADR, archaeology, decision-log, report, and validation paths.

## Purpose

Config improves discoverability and consistency. It must not override accepted ADRs, CHAOS rules, gates, or OpenSpec source-of-truth artifacts.

## Read order

1. Read `.chaos/config.yaml` if present.
2. Resolve configured paths for OpenSpec, ADRs, decision logs, archaeology, rules, gates, and review report output.
3. If config is missing, infer default paths and record `CONFIG_MISSING`.
4. If config is partial, infer missing values and record `CONFIG_PARTIAL`.
5. If config conflicts with discovered files, emit `CONFIG_CONFLICT` and ask the user how to proceed.

## Config values used by review

- `paths.openspec` for active change resolution.
- `paths.reviews` for review report output.
- `paths.archaeology` for optional/brownfield evidence.
- `paths.adrs` and `paths.decisionLogs` for governance evidence.
- `paths.rules` and `paths.gates` for compliance checks.
- `validation.openspec.validateCommand` and `validation.openspec.strictFlag` for OpenSpec validation prompts.
- `policies.commandExecution.inferModeWhenMissing` for mode inference.
- `policies.decisions.requireDecisionEvents` for `REV-DEC-*` recording.
- `policies.confidence.*` for confidence and knowledge-type requirements.
- `policies.protectedFiles.*` to avoid patching protected files during review.

## UX requirements

Config uncertainty must be handled at runtime, one decision at a time. Do not dump config questions into open questions by default.

If review needs context from a missing config value, ask:

1. Use inferred default.
2. Provide value for this run.
3. Defer with rationale and lower confidence.
4. Stop and fix config.

Material user choices must be recorded as `REV-DEC-*` Decision Events when they affect proposal quality, review scope, evidence coverage, or amendment policy.

## Mutation boundary

`chaos:review` may not edit `.chaos/config.yaml`. If config is stale or incorrect, report it and route to `chaos:status` or `chaos:sync`.

## Report requirements

The proposal review report must include a `Config Context` section with:

- config status;
- path resolution decisions;
- inferred defaults;
- config conflicts;
- confidence impact;
- recommended sync/status follow-up when needed.
