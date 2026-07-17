# /chaos-status

Run the CHAOS Status Auditor.

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`.claude/skills/chaos-shared/reference/model-robustness-policy.md` and
`.claude/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Read `.chaos/config.yaml` if present; resolve paths from config before defaults.
- Audit first: do not silently fix issues. Edit files only after explicit user confirmation and patch preview.
- Ask one remediation decision at a time. **After presenting a decision, STOP. Do not continue until the user selects an option.** When the interaction runtime is enabled, route it through the runtime → the Decision Center (not an ad-hoc chat prompt); see the "Interaction Runtime Obligations" section below.
- Attempt to use native interactive selection UI when the Claude Code runtime exposes it. If no explicit UI affordance is available, use the numbered decision block fallback. The fallback is compliant only if the command stops after presenting the options.
- Audit **Claude command hardening** as workflow drift (see below); do not edit config from status except via the confirmed remediation flow.
- Write `.chaos/status-report.md` unless `--no-write`; `--no-interactive` keeps status report-only.

### Claude hardening audit (report missing items as workflow drift)

Detect whether the Claude command suite declares the model-robustness hardening. Report
missing items as drift (MAJOR by default; advisory in `--light`; BLOCKER in `--strict`
when the gap would misroute artifacts or bypass governance):

- [ ] Model robustness policy referenced by command wrappers.
- [ ] Interactive decision protocol referenced by command wrappers.
- [ ] OpenSpec invocation gate present in `chaos:propose` contracts.
- [ ] Change-scoped output layout (`.chaos/changes/<change-id>/`) declared by change-scoped commands.
- [ ] Sync role boundaries + `--all` maintainer confirmation gate intact.
- [ ] Date-prefixed physical artifact naming (sequential IDs display-only).
- [ ] Stop-after-decision requirement present in command wrappers.

Route remediation to `chaos:sync` (it reconciles Claude hardening drift with patch
preview). See `.claude/skills/chaos-status/reference/check-catalog.md`
(`CS-HARDEN-*` checks).

## Command intent

Audit whether this repository's CHAOS workspace is coherent, auditable, and ready to support controlled human-led, agent-orchestrated SDLC.

## Procedure

1. Delegate the audit to the `chaos-status-auditor` subagent.
2. Read the repository root and locate:
   - `AGENTS.md`
   - `README.md`
   - `.chaos/config.yaml`
   - `.chaos/context.md`
   - `.chaos/architecture.md`
   - `.chaos/constitution.md`
   - `.chaos/bootstrap-report.md`
   - `.chaos/decisions/index.md`
   - `.chaos/rules/index.md`
   - `.chaos/commands/index.md`
   - `.chaos/gates/index.md`
3. Audit `.chaos/config.yaml` when present and report whether repository conventions are missing, partial, stale, conflicting, or unsupported.
4. Validate the workspace against the status check catalog.
5. Write `.chaos/status-report.md` unless `--no-write` is passed.
6. Summarize the final verdict to the user.

## Supported arguments

- `--strict`
- `--no-write`
- `--json`
- `--scope <area>`
  - supported scopes include `architecture`, `rules`, `commands`, `gates`, `sources`, `config`, and `toolchain`
- `--no-interactive`

## Required report

Use the report contract in:

```text
.claude/skills/chaos-status/reference/status-contract.md
```

## Important

Do not silently fix issues. This command audits first.

However, when foundational governance concerns are missing or weak — especially missing confidence/knowledge classification in `.chaos/constitution.md` — ask the user whether to patch now, create a remediation plan, defer with rationale, mark accepted risk, or do nothing.

Only edit files after explicit user confirmation.


## Config audit

`chaos:status` must audit `.chaos/config.yaml` using:

```text
.claude/skills/chaos-status/reference/config-audit.md
```

If config is missing, partial, stale, conflicting, or unsupported, report the issue and ask the user whether to create/patch config, create a remediation plan, defer with rationale, mark accepted risk, or do nothing. Do not create or patch config without explicit confirmation.

## Protected documentation remediation

`chaos:status` must detect drift in `AGENTS.md` / `AGENT.md` and root `README.md`.

These files are protected-but-editable. The command may patch or rewrite them only after explicit user confirmation, patch preview, and status-report audit trail.

If `.chaos/config.yaml` marks these files as protected or disallows edits, do not stop at reporting only. Show the proposed patch and ask whether to:

1. apply once with protected-doc override and rationale;
2. update config policy to allow confirmed status/sync edits;
3. defer with rationale;
4. mark accepted drift;
5. stop.

`--no-write` and `--no-interactive` keep status report-only.

## Interaction Runtime Obligations

Follow the shared **CHAOS Interaction Runtime command protocol**
(`.claude/skills/chaos-interaction-runtime/SKILL.md`).

For this command:

- sourceCommand: `chaos:status`
- **Read-only + lock-compatible**: may run alongside a pending decision, but must
  report, not fix, and must not mutate blocked-change state.
- Preserve the Iteration 7 **compact** `## Interaction Runtime` summary (health,
  pending decisions, ready-to-resume, blocking locks, one next action such as
  `chaos:resume --run RUN-...`). Do not duplicate the full `chaos:doctor` output.
- Never continue past `mustStop`; surface it. Never perform destructive auto-repair.
