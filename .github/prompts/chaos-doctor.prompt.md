---
agent: chaos-doctor-orchestrator
description: "Run the chaos:doctor workflow through GitHub Copilot."
tools: ['search/codebase', 'search', 'edit', 'vscode/runCommand', 'execute/runInTerminal']
---

# Copilot prompt: `chaos-doctor.prompt.md`

You are executing the CHAOS/OpenSpec workflow through GitHub Copilot Agent mode.

## Copilot-native execution contract

- Treat this prompt file as the command wrapper for `chaos-doctor`.
- Load `.github/skills/chaos-doctor/SKILL.md` when present.
- Use the custom agent `.github/agents/chaos-doctor-orchestrator.agent.md` when available or when the user selects/delegates to it.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md` and `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Read `.chaos/config.yaml` if present and resolve paths before defaults.
- For material decisions, ask one decision at a time, show numbered options, and STOP until the user answers. Use native GitHub Copilot/IDE choice UI if available; otherwise present numbered options and stop.
- Use `.chaos/changes/<change-id>/` for change-scoped artifacts. Legacy scattered folders are read-only compatibility inputs unless a policy says otherwise.
- Use date-prefixed physical filenames for generated governance artifacts; sequential IDs belong in indexes/display references only.

## Source command content converted to Copilot

# chaos-doctor.prompt.md

Run the CHAOS Doctor.

`chaos:doctor` is the **local runtime / tooling / repository readiness** diagnostic. It
complements `chaos:status` (governance/workspace health) by covering **execution readiness**:
tooling, hooks, MCP, and repository/provider context.

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones). Full rules:
`.github/skills/chaos-shared/reference/model-robustness-policy.md` and
`.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Read `.chaos/config.yaml` if present; resolve paths, validation commands, and
  `integrations.repository` / `mcp` policy from config before defaults.
- **Read-only by default.** Diagnose; do not mutate. `--fix-plan` only *proposes*; `--fix`
  may apply **only safe local setup fixes** after explicit per-item confirmation. Never apply
  broad auto-fixes.
- **Provider-neutral.** Resolve context through the repository context contract; never
  hard-code GitHub-only or Azure-only assumptions. Internally prefer "review request" over "PR".
- **MCP optional.** Missing MCP is a warning, never a universal failure, unless the active mode
  (`--strict` / `--mcp`) requires a provider-backed fact. Local git fallback always works.
- **No secrets.** Never read secrets into the report; redact sensitive MCP/CLI output.
- Ask one material decision at a time (e.g. before applying a `--fix`). **After presenting a
  decision, STOP.** Attempt native GitHub Copilot selection UI when exposed; otherwise use the
  numbered decision block fallback and stop after presenting the options.
- Write `.chaos/doctor/doctor-report-YYYY-MM-DD.md` unless `--dry-run`.

## Hooks note (Copilot runtime)

Hook checks (`CD-HOOK-*`) are Claude-runtime-specific. On the Copilot surface, treat them as
**advisory/reference**: inspect Claude hook presence and configuration for cross-runtime parity,
but never let their absence block a `READY` verdict, since GitHub Copilot does not execute
Claude hooks natively. Still report the underlying runtime file contracts.

## Command intent

Diagnose whether the local environment, tooling, MCP, and repository/provider context are ready
to run CHAOS, and produce a doctor report.

## Supported invocations

```text
chaos:doctor                # default (standard)
chaos:doctor --light
chaos:doctor --standard
chaos:doctor --strict
chaos:doctor --mcp          # focus MCP readiness
chaos:doctor --github       # focus GitHub provider readiness
chaos:doctor --azure-devops # focus Azure DevOps provider readiness
chaos:doctor --hooks        # focus hooks readiness (advisory)
chaos:doctor --fix-plan     # propose safe local setup fixes (no apply)
chaos:doctor --fix          # apply only safe local setup fixes after confirmation
chaos:doctor --dry-run      # never write; report only
```

## Procedure

1. Delegate the diagnosis to the `chaos-doctor-orchestrator` custom agent.
2. Read `.chaos/config.yaml`; resolve paths, validation commands, and
   `integrations.repository` / `mcp` policy.
3. Detect provider and resolve repository context (MCP → gh/az CLI → local git → manual),
   capping authority confidence to LOW when only local git is available. Use the `doctor` tool
   profile (least privilege, read-only).
4. Run the check catalog one by one; classify each `PASS|WARN|FAIL|UNKNOWN` with confidence.
5. Compute the verdict (`READY|READY_WITH_WARNINGS|NOT_READY|BLOCKED|UNKNOWN`).
6. `--fix-plan`: list safe local setup fixes as commands with rationale; do not apply.
   `--fix`: present each safe fix as one decision, STOP, apply only confirmed items.
7. Write `.chaos/doctor/doctor-report-YYYY-MM-DD.md` (unless `--dry-run`).
8. Recommend the next command. Route command-index registration to `chaos:sync`.

## Required references

Use the report contract, checks, and shared policies from:

```text
.github/skills/chaos-doctor/reference/doctor-contract.md
.github/skills/chaos-doctor/reference/check-catalog.md
.github/skills/chaos-shared/reference/repository-context-contract.md
.github/skills/chaos-shared/reference/repository-context-resolution-policy.md
.github/skills/chaos-shared/reference/mcp-security-policy.md
.github/skills/chaos-shared/reference/mcp-tool-profiles.md
```

## Verdicts

`READY` · `READY_WITH_WARNINGS` · `NOT_READY` · `BLOCKED` · `UNKNOWN`
(semantics in `.github/skills/chaos-doctor/reference/doctor-contract.md`).

## Todo Candidates (optional)

`chaos:doctor` MAY end its report with an optional `## Todo Candidates` section listing material
local tooling/repository-readiness gaps, using the shared fields in
`.github/skills/chaos-todo/reference/todo-candidate-contract.md`. `chaos:doctor` does not create
durable todo items — only `chaos:todo` curates `.chaos/todo/items/`.

## Important

Do not silently fix issues. This command is read-only by default and applies only safe local
setup fixes after explicit per-item confirmation. Never edit production code, governance
indexes, ADRs, or rules, and never write secrets to any file or report. Route command-index
registration to `chaos:sync`.

## Interaction Runtime Obligations

Follow the shared **CHAOS Interaction Runtime command protocol** (`.github/skills/chaos-interaction-runtime/SKILL.md`).

For this command:

- sourceCommand: `chaos:doctor`
- **Read-only + lock-compatible**: may run alongside a pending decision, but must report,
  not fix, and must not mutate blocked-change state (except confirmed `--fix` safe local
  setup edits, which never touch `.chaos` change state).
- Preserve the Iteration 7 **detailed** `## Interaction Runtime` health section (runtime
  root/schemas, pending decisions, ready-to-resume sessions, stale locks, expired runner
  leases, malformed artifacts, MCP/Decision Center package presence, hook-violation
  activity, command-contract integration). This is the detailed counterpart to
  `chaos:status`'s compact summary.
- Never continue past `mustStop`; surface it. Never perform destructive auto-repair.
