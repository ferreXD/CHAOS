# Resume Safety Policy

These rules are non-negotiable and apply to every model.

## Source of truth

- The chat thread is **not** the source of truth. The interaction runtime is.
- **Do not rely on chat memory.** Reconstruct only from the resume capsule,
  answered decisions/responses, required artifacts, and the source command's
  contract.
- Do not fake literal continuation of the old chat (no restored chain-of-thought).
  Resume is **semantic**: continue the original `sourceCommand` from `nextStep`.

## Stop conditions (STOP and report — never guess or invent)

- Capsule missing required fields → report which fields.
- Multiple resume candidates → present them and STOP for user choice.
- No candidate → report none; do not fabricate a session.
- A still-pending (`waiting`) decision on the session → route to the Decision Center.
- Response invalid (option not in decision, missing required rationale) → stop.
- Runtime state malformed → report repair actions (`chaos:doctor`); do not continue.
- `sourceCommand` unknown → ask the user for direction.

## Write safety

- Only write under `.chaos/interactions/**` (runtime state) and the resumed
  command's own approved artifacts.
- **Do not modify production files** unless the resumed command's approved
  `nextStep` explicitly allows it.
- Never hand-write runtime JSON state. Use MCP tools or the runtime CLI/package.
  If no safe writer exists, report what must be done and stop.
- Preserve the audit trail; never delete decision/response/capsule artifacts.

## Decision integrity

- Never bypass an unresolved pending decision.
- Never ignore or override the human's selected option.
- Mark a decision consumed **only after** it has been incorporated; never before.
- Do not silently change `sourceCommand`.

## Locks & concurrency

- Respect same-change locks; do not advance a change locked by a different run.
- If the lock state is uncertain, stop and ask (fail safe).

## Degraded mode

- If MCP is unavailable, disclose it and cap confidence to MEDIUM unless direct
  file validation is strong.
- `--strict` may refuse to resume on stale/malformed/low-confidence state.

## Scope

Forbidden in this iteration: live auto-resume runner, `chaos:delete`/discard,
GitHub/Azure issue sync, production application changes, broad rewrites of other
CHAOS commands.
