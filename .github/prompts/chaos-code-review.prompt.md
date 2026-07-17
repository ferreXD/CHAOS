---
agent: code-reviewer
description: "Run the chaos:code-review workflow through GitHub Copilot."
tools: ['search/codebase', 'search', 'edit', 'vscode/runCommand', 'execute/runInTerminal']
---

# Copilot prompt: `chaos-code-review.prompt.md`

You are executing the CHAOS/OpenSpec workflow through GitHub Copilot Agent mode.

## Copilot-native execution contract

- Treat this prompt file as the command wrapper for `chaos-code-review`.
- Load `.github/skills/chaos-code-review/SKILL.md` when present.
- Use the custom agent `.github/agents/code-reviewer.agent.md` when available or when the user selects/delegates to it.
- Follow `.github/skills/chaos-shared/reference/model-robustness-policy.md` and `.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.
- Read `.chaos/config.yaml` if present and resolve paths before defaults.
- For material decisions, ask one decision at a time, show numbered options, and STOP until the user answers.
- Use `.chaos/changes/<change-id>/` for change-scoped artifacts. Legacy scattered folders are read-only compatibility inputs unless a policy says otherwise.
- Use date-prefixed physical filenames for generated governance artifacts; sequential IDs belong in indexes/display references only.

## Source command content converted to Copilot

# `chaos-code-review.prompt.md`

Run a post-implementation **code review** under CHAOS governance, driven by the
`code-reviewer` agent.

`chaos:code-review` reviews **implemented code** (a change's implementation, a PR, a branch,
a diff, or a scoped path) for architecture compliance, `AGENTS.md` conventions, project
skill usage, correctness, and maintainability. It is distinct from `chaos:review`, which
reviews an OpenSpec **proposal** before implementation.

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Full rules:
`.github/skills/chaos-shared/reference/model-robustness-policy.md` and
`.github/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Read `.chaos/config.yaml` if present; resolve paths, validation commands, and agent locations from config before defaults.
- Drive the review with the **`code-reviewer` agent** and the `code-reviewer` skill. The orchestrator owns user decisions; the driver returns findings/options/confidence/evidence and must not ask final user decisions or edit files.
- Operate **read-only** on the codebase; this command reviews, it does not modify source, tests, migrations, or application code.
- Resolve and show the mode (`light|standard|strict`); if inferred, state why. Do not silently downgrade `strict`.
- Resolve scope and show it: change-scoped (`<change-id>`), PR, `--since <ref>`, or `--scope <path>`.
- Ask one material decision at a time (missing `AGENTS.md`/mandatory skill, remediation routing, accepted risk, scope confirmation). **After presenting a decision, STOP. Do not continue until the user selects an option.**
- Attempt to use native interactive selection UI when the GitHub Copilot runtime exposes it. If no explicit UI affordance is available, use the numbered decision block fallback. The fallback is compliant only if the command stops after presenting the options.
- A recommendation is not a decision; a displayed findings list is not approval or remediation.
- Classify every material finding with CHAOS knowledge type + confidence + severity (map the driver's `CRITICAL/HIGH/MEDIUM/LOW/NIT` to `BLOCKING/MAJOR/MINOR/ADVISORY`).
- Record material remediation/accepted-risk choices as `CR-DEC-*` Decision Events with sync actions.
- Write change-scoped output under `.chaos/changes/<change-id>/code-review.md`; non-change-scoped output under `.chaos/code-reviews/YYYY-MM-DD-<slug>-code-review.md` (date-prefixed, slug-based).
- Do not edit production code, governance indexes, or config. Route governance promotions/registration to `chaos:sync`.

### Sonnet-safe execution checklist

- [ ] Config read; paths resolved?
- [ ] Scope resolved and shown (change / PR / since / path)?
- [ ] Mode resolved (and inference explained)?
- [ ] `AGENTS.md` + applicable project skills loaded (or missing-authority decision asked, stopping after the prompt)?
- [ ] Review delegated to the `code-reviewer` agent (read-only)?
- [ ] Findings classified with CHAOS severity + knowledge type + confidence?
- [ ] Remediation decisions asked one at a time, stopping after each?
- [ ] `CR-DEC-*` decisions recorded with sync actions?
- [ ] Report written to the scope-correct path (change folder vs `.chaos/code-reviews/`)?
- [ ] Lifecycle updated (change-scoped) and next command recommended?

## Usage

```text
chaos-code-review.prompt.md <change-id> [--light|--standard|--strict]
chaos-code-review.prompt.md --pr <number> [--standard]
chaos-code-review.prompt.md --since <git-ref-or-date>
chaos-code-review.prompt.md --scope <path-or-module>
chaos-code-review.prompt.md --staged
chaos-code-review.prompt.md --working
chaos-code-review.prompt.md <change-id> --dry-run
chaos-code-review.prompt.md <change-id> --no-write
```

Natural-language aliases:

```text
chaos:code-review <change-id>
code-review CHAOS change <change-id>
```

## Execution

Delegate to the `chaos-code-review` skill and the `code-reviewer` agent (read-only driver).

- The `code-reviewer` agent + skill produce the read-only findings (authority model,
  severity model, output format, confidence caps).
- The CHAOS `chaos-code-review` skill overlays governance: config awareness, mode/scope
  resolution, CHAOS severity/confidence mapping, `CR-DEC-*` decision events, change-scoped
  reporting, lifecycle update, and next-command routing.

`--dry-run` reviews and reports in chat without writing. `--no-write` keeps the review
report-only. Neither edits code.

## Position in the CHAOS lifecycle

`chaos:code-review` is a post-implementation gate. Typical flow:

```text
chaos:apply <id>  →  chaos:code-review <id>  →  chaos:verify <id>  →  chaos:archive <id>
```

After review, recommend `chaos:verify <change-id>` when code is ready, or `chaos:apply
<change-id>` remediation when BLOCKING/MAJOR findings remain.

## Boundaries

- Read-only. Never edits production code, tests, migrations, config, or governance indexes.
- Does not approve or archive a change.
- New command registration in `.chaos/commands/index.md` is a governance edit — route it
  through `chaos:sync` (do not edit the index from this command).

## Interaction Runtime Obligations

Follow the shared **CHAOS Interaction Runtime command protocol** (`.github/skills/chaos-interaction-runtime/SKILL.md`).

For this command:

- sourceCommand: `chaos:code-review`
- Mostly **read-only**: it may proceed alongside a same-change pending decision only if
  the lock policy marks it compatible/read-only — and even then it must report, not fix,
  and must not mutate the blocked change's state.
- Preflight: `chaos_begin_command`; honour `mustStop: true`.
- Material decisions (via `chaos_create_decision`, then STOP): materially blocking
  waive/fix choices that change the review outcome.
- Emits Todo Candidates for follow-up; does not write durable todos itself.
