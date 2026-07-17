# chaos:archive

Invoke the CHAOS Archive Orchestrator to close a verified OpenSpec change.

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`.claude/skills/chaos-shared/reference/model-robustness-policy.md` and
`.claude/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Read `.chaos/config.yaml` if present; resolve paths and OpenSpec archive conventions from config before defaults.
- Resolve the change folder; perform the verification gate check before any closure.
- Resolve and show the mode; if inferred, state why. Do not silently downgrade `strict`.
- Ask one material decision at a time (archive-with-debt, waiver/force-waiver, source-of-truth update, sync-first). **After presenting a decision, STOP. Do not continue until the user selects an option.** When the interaction runtime is enabled, route it through the runtime → the Decision Center (not an ad-hoc chat prompt); see the "Interaction Runtime Obligations" section below.
- Attempt to use native interactive selection UI when the Claude Code runtime exposes it. If no explicit UI affordance is available, use the numbered decision block fallback. The fallback is compliant only if the command stops after presenting the options.
- A recommendation is not a decision; record waivers/debt and material decisions as Decision Events.
- Write the archive report under `.chaos/changes/<change-id>/archive-report.md` (legacy `.chaos/archive-reports/` is read-only for compat); record waivers in `waivers.md`.
- Never edit production code or ADR/rule/decision-index files.

### Sonnet-safe execution checklist

- [ ] Config read; change folder + lifecycle + verification resolved?
- [ ] Verification gate checked (and archive-with-debt only via explicit decision)?
- [ ] Mode resolved (and inference explained)?
- [ ] Closure decisions asked one at a time, stopping after each?
- [ ] Waivers/debt and decisions recorded?
- [ ] OpenSpec source-of-truth update confirmed?
- [ ] Archive report written under `.chaos/changes/<change-id>/`; sync/retro follow-up routed?

## Usage

```text
chaos:archive <change-id> [--light|--standard|--strict] [--dry-run] [--yes] [--sync-first] [--archive-with-debt] [--no-retro] [--force-waiver]
```

Aliases may be supported by the host, but the canonical command is `chaos:archive`.

## Instructions

Use the `chaos-archive` skill.
Delegate orchestration to `chaos-archive-orchestrator`.

Perform the command as follows:

1. Parse `<change-id>` and flags.
2. Check toolchain one by one.
3. Load OpenSpec and CHAOS lifecycle artifacts.
4. Infer mode if absent.
5. Present archive readiness dashboard.
6. Perform verification gate check.
7. If `--dry-run`, produce dry-run archive report and stop before mutation.
8. If closure issues exist, run the runtime closure loop.
9. If allowed, execute or guide OpenSpec archive.
10. Confirm source-of-truth update.
11. Write `.chaos/changes/<change-id>/archive-report.md` (legacy `.chaos/archive-reports/<change-id>-archive-report.md` is READ-only for compatibility, not a write target).
12. Recommend next commands.

Never edit production code or ADR/rule/decision-index files.

## Interaction Runtime Obligations

Follow the shared **CHAOS Interaction Runtime command protocol**
(`.claude/skills/chaos-interaction-runtime/SKILL.md`).

For this command:

- sourceCommand: `chaos:archive`
- changeId: required
- compatibleWithPendingDecision: **false** — do NOT archive a change that has an
  unresolved pending decision in the interaction runtime; STOP and route to the
  Decision Center / `chaos:resume`.
- Preflight: `chaos_begin_command`; honour `mustStop: true`.
- Material decisions (via `chaos_create_decision`, then STOP): archive approval;
  debt/waiver acceptance; unresolved-evidence promotion.
- Completion: release locks via runtime completion and leave diagnostics clean
  (`chaos:doctor` must report no stale lock or unconsumed decision for the change).
