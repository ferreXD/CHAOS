---
name: chaos-doctor
description: Diagnose local runtime, tooling, hooks, MCP, and repository/provider readiness for CHAOS, and produce a doctor report. Read-only by default; --fix-plan proposes fixes, --fix applies only safe local setup fixes after confirmation.
---

# CHAOS Doctor Skill

Use this skill when the user invokes `chaos:doctor` (or `/chaos-doctor`) or asks whether the
local environment, tooling, MCP, and repository/provider context are ready to run CHAOS.

`chaos:doctor` is the **local runtime / tooling / repository readiness** diagnostic. It is
distinct from `chaos:status`:

- `chaos:status` = governance/workspace health (are the `.chaos` artifacts coherent?).
- `chaos:doctor` = local execution readiness (tooling, hooks, MCP, repo/provider context).

## Non-negotiable execution contract (model robustness)

Executable by the weakest supported Claude model. Obey
`.claude/skills/chaos-shared/reference/model-robustness-policy.md` and
`interactive-decision-protocol.md`.

1. **Read-only by default.** Diagnose; do not mutate. `--fix-plan` only *proposes*; `--fix`
   may apply **only safe local setup fixes** after explicit per-item confirmation. Never apply
   broad auto-fixes.
2. **Provider-neutral.** Consume the repository context contract; never hard-code GitHub-only
   or Azure-only assumptions. Internally prefer "review request" over "PR".
3. **MCP optional.** Missing MCP is a **warning**, not a failure, unless the requested mode
   (`--strict` / `--mcp`) requires a provider-backed fact. Local git fallback always works.
4. **No secrets.** Never read secrets into the report; redact sensitive MCP/CLI output.
5. **Stop after material decisions** (e.g. before applying a `--fix`).

## Supported invocations

```text
chaos:doctor                # default (standard)
chaos:doctor --light
chaos:doctor --standard
chaos:doctor --strict
chaos:doctor --mcp          # focus MCP readiness
chaos:doctor --github       # focus GitHub provider readiness
chaos:doctor --azure-devops # focus Azure DevOps provider readiness
chaos:doctor --hooks        # focus Claude hooks readiness
chaos:doctor --fix-plan     # propose safe local setup fixes (no apply)
chaos:doctor --fix          # apply only safe local setup fixes after confirmation
chaos:doctor --dry-run      # never write; report only
```

## Required references

Read before executing:

- `reference/doctor-contract.md` (report shape, verdicts, fix policy)
- `reference/check-catalog.md` (the diagnostic checks)
- `.claude/skills/chaos-shared/reference/repository-context-contract.md`
- `.claude/skills/chaos-shared/reference/repository-context-resolution-policy.md`
- `.claude/skills/chaos-shared/reference/mcp-security-policy.md`
- `.claude/skills/chaos-shared/reference/mcp-tool-profiles.md` (profile `doctor`)

## Behaviour

1. Read `.chaos/config.yaml`; resolve paths, validation commands, and
   `integrations.repository` / `mcp` policy.
2. Run the check catalog one by one (git, repo, provider detection, remote, branch, default
   branch, working tree, git user, GitHub/Azure MCP availability per provider, gh/az CLI
   availability+auth, OpenSpec, build/test commands, hooks presence, protected-file guard,
   repository context confidence, repo-wide sync authority confidence, provider missing
   capabilities).
3. Resolve repository context via the resolution policy (MCP → CLI → git → manual), using the
   `doctor` tool profile (least privilege, read-only).
4. Classify each check and compute the verdict.
5. If `--fix-plan`, propose safe local setup fixes (commands to run), but do not apply.
6. If `--fix`, present each safe fix as one decision and STOP; apply only confirmed ones.
7. Write the doctor report (unless `--dry-run`).

## Output

```text
.chaos/doctor/doctor-report-YYYY-MM-DD.md
```

In a future change-scoped run, doctor may also reference
`.chaos/changes/<change-id>/lifecycle.md`. Doctor does not migrate or mutate existing
generated artifacts.

## Verdicts

`READY` · `READY_WITH_WARNINGS` · `NOT_READY` · `BLOCKED` · `UNKNOWN`
(semantics in `reference/doctor-contract.md`).

## Interaction Runtime health (Iteration 7)

When the repository has the CHAOS Interaction Runtime (`.chaos/interactions/`), `chaos:doctor`
includes an **`## Interaction Runtime`** section reporting: whether the runtime root/schemas
exist and validate, pending decisions, ready-to-resume sessions, stale locks, expired runner
leases, malformed artifacts, MCP/Decision Center package presence, hook-violation activity, and
command-contract integration.

- Source: `tools/chaos-interaction-diagnostics/` (read-only). Embed its output via
  `node tools/chaos-interaction-diagnostics/src/cli/chaos-interaction-diagnostics.ts doctor --section`.
- **Read-only by default.** Diagnostics never deletes locks, cancels sessions, mutates decisions,
  rewrites artifacts, marks decisions consumed, or completes commands. There is **no auto-repair**;
  findings only recommend action (and may emit Todo Candidates).
- Severity: `OK/INFO/WARN/ERROR/BLOCKER`; overall `healthy/degraded/blocked/unknown`. A `BLOCKER`
  means a command should stop unless explicitly overridden.
- Config: `policies.interactionRuntime.diagnostics` in `.chaos/config.yaml`.

## Todo Candidates (optional)

`chaos:doctor` MAY end its report with an optional `## Todo Candidates` section listing
material local tooling/repository-readiness gaps (e.g. a recurring `NOT_READY`/`BLOCKED`
check, not an expected optional-capability warning), using the shared fields in
`.claude/skills/chaos-todo/reference/todo-candidate-contract.md`. `chaos:doctor` does not
create durable todo items — only `chaos:todo` curates `.chaos/todo/items/`. Interaction-runtime
findings (stale lock, malformed artifact, missing capsule, expired lease, long-pending decision)
surface as Todo Candidates through this same section.

## Do not

- Implement or edit production code.
- Apply broad auto-fixes or anything beyond safe local setup with confirmation.
- Treat MCP absence as a universal failure.
- Write secrets to any file or report.
- Register the command in `.chaos/commands/index.md` from here — route that to `chaos:sync`.
