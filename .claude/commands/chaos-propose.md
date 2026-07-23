# `/chaos-propose`

Run the CHAOS propose workflow.

## Non-negotiable execution contract

Mandatory for every model (especially weaker ones such as Sonnet). Do not rely on
inferring intent. Full rules: `.claude/skills/chaos-shared/reference/model-robustness-policy.md`
and `.claude/skills/chaos-shared/reference/interactive-decision-protocol.md`.

- Read `.chaos/config.yaml` if present; resolve `paths`/`validation` from config before defaults.
- Resolve and show the mode (`light|standard|strict`); if inferred, state why. Do not silently downgrade `strict`.
- **Hard OpenSpec gate (highest priority):** `chaos:propose` MUST use OpenSpec as the proposal engine. Detect OpenSpec, invoke the OpenSpec proposal workflow, confirm the change folder and artifacts exist, and run OpenSpec validation **before** applying any CHAOS wrapping. Do **not** hand-write proposal/design/spec/tasks files when OpenSpec is available. See `Hard OpenSpec invocation gate` below.
- Ask one material decision at a time. **After presenting a decision, STOP. Do not continue until the user selects an option.** When the interaction runtime is enabled, route it through the runtime → the Decision Center (not an ad-hoc chat prompt); see the "Interaction Runtime Obligations" section below.
- Attempt to use native interactive selection UI when the Claude Code runtime exposes it. If no explicit UI affordance is available, use the numbered decision block fallback. The fallback is compliant only if the command stops after presenting the options.
- A recommendation is not a decision; a displayed plan/approach is not approval.
- Record material answers as `PROP-DEC-*` Decision Events (knowledge type + confidence + sync action). Do not silently apply inferred decisions.
- Write change-scoped artifacts under `.chaos/changes/<change-id>/`; recommended ADR/decision-log drafts use date-prefixed, slug-based filenames (no sequential-ID filenames).
- Do not implement code. Do not silently mutate OpenSpec artefacts or shared governance files.

### Sonnet-safe execution checklist

- [ ] Config read and paths resolved?
- [ ] Mode resolved (and inference explained)?
- [ ] OpenSpec availability detected?
- [ ] OpenSpec proposal workflow invoked (not hand-written)?
- [ ] OpenSpec change folder + proposal/spec/tasks artifacts detected?
- [ ] OpenSpec validation attempted and result recorded?
- [ ] Material decisions asked one at a time, stopping after each?
- [ ] `PROP-DEC-*` decision events recorded with sync actions?
- [ ] Change folder + `lifecycle.md` updated under `.chaos/changes/<change-id>/`?
- [ ] OpenSpec Invocation Proof section written to the report?
- [ ] Next command (`chaos:review <change-id>`) recommended?

## Hard OpenSpec invocation gate

Before manually writing proposal artifacts, `chaos:propose` MUST:

1. Detect OpenSpec availability from `.chaos/config.yaml` (`project.specEngine`,
   `toolchain.openspec`, `validation.openspec`) or default command/path conventions
   (`/opsx:propose`, `openspec` CLI, `openspec/changes/`).
2. Invoke the OpenSpec proposal workflow / command appropriate for the repository
   (`/opsx:propose` or the `openspec-propose` skill).
3. Confirm the OpenSpec change folder exists (`openspec/changes/<change-id>/`).
4. Confirm proposal/spec/task artifacts were created or updated.
5. Run OpenSpec validation using the configured command when available
   (`openspec validate <change-id> --strict`).
6. Only then apply CHAOS wrapping: confidence, decision events, archaeology references,
   lifecycle updates, review routing, and governance recommendations.

Forbidden: manually replacing OpenSpec generation when OpenSpec is available; creating
ad-hoc proposal/design/tasks files outside OpenSpec; proceeding as if OpenSpec was invoked
when it was not; hiding OpenSpec failure behind a successful CHAOS proposal.

**Degraded mode (decision-gated):**

- `--strict`: if OpenSpec is unavailable or cannot be invoked, **block**.
- `--standard`: ask whether to continue in degraded mode, **STOP for explicit choice**, and cap confidence.
- `--light`: **auto-escalate to `--standard`** (the light valve — announce + record `ESC-*`;
  light never skips the spec silently), then apply the standard degraded-mode handling above.
- Degraded mode must be explicitly recorded (decision event + report).

The proposal report MUST include an **OpenSpec Invocation Proof** section (see
`.claude/skills/chaos-propose/reference/openspec-integration-contract.md`).

## Usage

Arguments are passed as the change intent and optional mode flags:

```text
/chaos-propose "<change intent>" --light
/chaos-propose "<change intent>" --standard
/chaos-propose "<change intent>" --strict
```

Delegate to the `chaos-propose` skill and, when useful, the `chaos-proposal-architect` subagent.

Rules:

- Do not implement code.
- Use OpenSpec as the proposal/spec motor (see the hard gate above).
- Infer mode when omitted and explain the inference.
- Ask for missing material context at runtime instead of dumping open questions by default.
- Record user answers as `PROP-DEC-*` Decision Events with sync actions.
- Ask for approach alignment before writing final OpenSpec proposal artefacts.
- Do not silently mutate OpenSpec artefacts; confirm amendments first.
- Recommend `chaos:review` after proposal generation.

## Interaction Runtime Obligations

Follow the shared **CHAOS Interaction Runtime command protocol**
(`.claude/skills/chaos-interaction-runtime/SKILL.md`).

For this command:

- sourceCommand: `chaos:propose`
- changeId: the proposed change (may be new)
- compatibleWithPendingDecision: **false** for the same change.
- Preflight: `chaos_begin_command`; honour `mustStop: true`.
- Material decisions (via `chaos_create_decision`, then STOP): proposal approval;
  execution-profile selection; risky/uncertain assumption acceptance; scope-ambiguity
  resolution. If a decision is created, STOP — do not proceed into apply-like behaviour.
- Resume: after the decision is answered, continue via `chaos:resume`; incorporate the
  answer, then mark it consumed.
- Completion: complete the runtime session (release locks) when the proposal reaches a
  terminal state; never leave a stale lock or an unconsumed answered decision.
