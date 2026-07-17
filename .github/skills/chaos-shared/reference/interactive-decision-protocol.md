# CHAOS Interactive Decision Protocol

Shared, Copilot-facing protocol for resolving **material user decisions** in the CHAOS
command suite. Every command, skill, and agent must follow it whenever a material decision
arises.

A **material decision** is one that changes scope, mode/risk, governance, source-of-truth
artifacts, protected files, or correctness. Examples: scope confirmation, mode downgrade,
governance waiver, OpenSpec degraded mode, approval, protected-file update,
archive-with-debt, sync promotion, maintainer confirmation, conflict resolution, ID
reconciliation, artifact overwrite, or missing context that materially affects
correctness.

## Routing: interaction runtime first, chat as fallback

Before presenting a material decision, decide **where** it is answered:

- **Interaction runtime (preferred).** When `policies.interactionRuntime.commands.enabled`
  is `true` (default) **and** the runtime is available, the decision is created **through the
  runtime** and answered in the **Decision Center** — not as an ad-hoc chat prompt. Create it
  with title/context/`interactionType`/options/recommendedOptionId, receive `mustStop: true`,
  and **STOP**. Choose the `interactionType` to match the decision — `single-choice-decision`
  (default), `confirmation` (yes/no gate, two options), `multi-choice-decision` (select one or
  more), or `freeform-input` (the human types a value; options optional); see
  `.github/skills/chaos-interaction-runtime/reference/material-decision-protocol.md`. The
  human answers in the Decision Center; the human then runs `chaos-resume.prompt.md` to
  continue the command (resume is manual in Copilot — there is no auto-resume runner or
  Stop-hook). Batch independent decisions per `commands.decisionBatching`
  (`.github/skills/chaos-interaction-runtime/reference/decision-batching-policy.md`).
  Full contract: `.github/skills/chaos-interaction-runtime/SKILL.md`.

  **Two writers exist; use the runtime CLI, or MCP when the server is registered.** Both
  write the exact same file-backed state the Decision Center reads.
  - **Runtime CLI (default for Copilot).** Run the CLI in the terminal
    (`execute/runInTerminal`). It needs only `node`, has no daemon/connection to drop, and is
    the safe default when in doubt:

    ```bash
    node tools/chaos-interaction-runtime/src/cli/chaos-interaction-runtime.ts begin-command   --command "<sourceCommand>" --change <changeId> --adapter copilot
    node tools/chaos-interaction-runtime/src/cli/chaos-interaction-runtime.ts create-decision  --run <runId> --change <changeId> --title "<title>" --context "<context>" [--interaction-type <type>] --option <a> --option <b> --recommended <b>
    node tools/chaos-interaction-runtime/src/cli/chaos-interaction-runtime.ts get-response      --decision <decisionId>
    node tools/chaos-interaction-runtime/src/cli/chaos-interaction-runtime.ts mark-consumed     --decision <decisionId>
    node tools/chaos-interaction-runtime/src/cli/chaos-interaction-runtime.ts complete-command  --run <runId>
    ```

  - **MCP tools (when wired).** `chaos_begin_command`, `chaos_create_decision`,
    `chaos_get_active_decision`, `chaos_get_decision_response`,
    `chaos_mark_decision_consumed`, `chaos_complete_command` — available when the
    `chaos-interaction` MCP server is registered in this Copilot workspace **and** its tools
    are in the prompt/agent tool allowlist. When it is not registered, use the CLI.

    Either way, `create-decision` / `chaos_create_decision` returns `mustStop: true` → STOP.
- **Chat fallback.** Only when `commands.enabled` is `false`, or the runtime/CLI is
  unavailable, present the decision in chat using the steps below. This is a configured
  fallback, not a silent bypass.

The steps below are the **chat-fallback** presentation (also the literal content to surface
inside the Decision Center / native UI).

## Protocol (chat fallback / decision content)

When a material user decision is required (and runtime routing above does not apply):

1. Ask exactly **one** decision at a time.
2. Present the decision context briefly.
3. Provide numbered options.
4. Mark the recommended option.
5. Explain the consequence of each option briefly.
6. Use native GitHub Copilot interactive choice / selection UI when available.
7. If unavailable, use numbered chat options.
8. **Stop immediately** after presenting the choices.
9. Do **not** continue until the user explicitly selects an option.
10. Record the selected option as a **Decision Event** or **Context Note**, depending on
    materiality.

## Forbidden

- Silently choosing.
- Burying decisions in paragraphs.
- Presenting several unrelated decisions at once.
- Continuing after asking a decision.
- Treating a recommendation as accepted.
- Treating lack of response as approval.
- Treating inferred intent as confirmation.

## Decision wording pattern

Use this shape (native selection UI is preferred; this is the chat fallback / the literal
content to surface in the UI):

```text
Decision required: <short title>

Context: <brief context>

Recommended option:
<option number and reason>

Options:
1. <option> — <consequence>
2. <option> — <consequence>
3. <option> — <consequence>
4. Stop / defer

Select one option to continue.
```

After presenting this decision, **STOP. Do not continue until the user selects an
option.**

## Native vs fallback UI

- **Preferred:** native GitHub Copilot interactive selection UI (e.g. a single-select choice
  prompt). Present one decision per prompt, with the recommended option first and labelled
  "(Recommended)", and a "Stop / defer" option.
- **Fallback:** if native selection UI is unavailable, print the numbered options in chat
  and stop. Never auto-advance.

## Recording the outcome

- **Material** outcomes (scope, governance, waivers, protected-file edits, mode downgrade,
  maintainer confirmation, OpenSpec degraded mode, archive-with-debt) → record as a
  **Decision Event** in the change-scoped `decision-events.md` (or the command's report)
  with: decision type, status, knowledge type, confidence, evidence, impact, and sync
  action.
- **Lower-materiality** outcomes → record as a **Context Note** in the command report so
  the audit trail stays complete.

## Specialist boundary

When an orchestrator delegates to a specialist (e.g. the C# implementation specialist),
the **orchestrator** owns user-facing decisions. Specialists return findings, options,
confidence, and evidence; they must not ask final user decisions directly unless the
orchestrator explicitly delegated that. The orchestrator then presents the decision using
this protocol and stops.

## Related

- `model-robustness-policy.md`
- `.github/skills/chaos-interaction-runtime/SKILL.md` (runtime routing, batching, resume, completion)
- `.github/skills/chaos-interaction-runtime/reference/material-decision-protocol.md`
