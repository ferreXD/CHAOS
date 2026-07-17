# /chaos-doctor

Run the CHAOS Doctor — the local runtime / tooling / repository readiness diagnostic.

`chaos:doctor` is distinct from `chaos:status`:

- `chaos:status` = governance/workspace health (are the `.chaos` artifacts coherent?).
- `chaos:doctor` = local execution readiness (tooling, hooks, MCP, repo/provider context).

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`.claude/skills/chaos-shared/reference/model-robustness-policy.md` and
`.claude/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- **Read-only by default.** Diagnose; do not mutate. `--fix-plan` only *proposes*; `--fix` may apply **only safe local setup fixes** after explicit per-item confirmation. Never apply broad auto-fixes.
- **Provider-neutral.** Consume the repository context contract; never hard-code GitHub-only or Azure-only assumptions. Internally prefer "review request" over "PR".
- **MCP optional.** Missing MCP is a **warning**, not a failure, unless the requested mode (`--strict` / `--mcp`) requires a provider-backed fact. Local git fallback always works.
- **No secrets.** Never read secrets into the report; redact sensitive MCP/CLI output.
- Ask one remediation decision at a time. **After presenting a decision, STOP. Do not continue until the user selects an option.** When the interaction runtime is enabled, route it through the runtime → the Decision Center (not an ad-hoc chat prompt); see the "Interaction Runtime Obligations" section below.
- Attempt to use native interactive selection UI when the Claude Code runtime exposes it. If no explicit UI affordance is available, use the numbered decision block fallback. The fallback is compliant only if the command stops after presenting the options.

## Command intent

Diagnose whether the local environment, tooling, MCP, and repository/provider context are ready to run CHAOS, and produce a doctor report.

## Procedure

1. Delegate the diagnosis to the `chaos-doctor-orchestrator` subagent.
2. Read `.chaos/config.yaml` when present; resolve paths, validation commands, and `integrations.repository` / `mcp` policy before defaults.
3. Run the check catalog one by one (git, repo, provider detection, remote, branch, default branch, working tree, git user, GitHub/Azure MCP availability, gh/az CLI availability+auth, OpenSpec, build/test commands, hooks presence, protected-file guard, repository context confidence, repo-wide sync authority confidence).
4. Resolve repository context via the resolution policy (MCP → CLI → git → manual) using the `doctor` tool profile (least privilege, read-only).
5. Classify each check and compute the verdict.
6. If `--fix-plan`, propose safe local setup fixes (commands to run) but do not apply. If `--fix`, present each safe fix as one decision and STOP; apply only confirmed ones.
7. Write the doctor report unless `--dry-run`.

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

Use the report contract and check catalog in:

```text
.claude/skills/chaos-doctor/SKILL.md
.claude/skills/chaos-doctor/reference/doctor-contract.md
.claude/skills/chaos-doctor/reference/check-catalog.md
```

## Output

```text
.chaos/doctor/doctor-report-YYYY-MM-DD.md
```

## Verdicts

`READY` · `READY_WITH_WARNINGS` · `NOT_READY` · `BLOCKED` · `UNKNOWN`
(semantics in `.claude/skills/chaos-doctor/reference/doctor-contract.md`).

## Interaction Runtime Obligations

Follow the shared **CHAOS Interaction Runtime command protocol**
(`.claude/skills/chaos-interaction-runtime/SKILL.md`).

For this command:

- sourceCommand: `chaos:doctor`
- **Read-only + lock-compatible**: may run alongside a pending decision, but must report, not fix, and must not mutate blocked-change state (except confirmed `--fix` safe local setup edits, which never touch `.chaos` change state).
- Preserve the Iteration 7 **detailed** `## Interaction Runtime` health section (runtime root/schemas, pending decisions, ready-to-resume sessions, stale locks, expired runner leases, malformed artifacts, MCP/Decision Center package presence, hook-violation activity, command-contract integration). This is the detailed counterpart to `chaos:status`'s compact summary.
- Never continue past `mustStop`; surface it. Never perform destructive auto-repair.

## Do not

- Implement or edit production code.
- Apply broad auto-fixes or anything beyond safe local setup with confirmation.
- Treat MCP absence as a universal failure.
- Write secrets to any file or report.
- Register the command in `.chaos/commands/index.md` from here — route that to `chaos:sync`.
