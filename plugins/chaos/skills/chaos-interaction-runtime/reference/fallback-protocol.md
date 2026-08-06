# Fallback Protocol (MCP / runtime unavailable)

When the MCP server or runtime is unavailable, a command follows this protocol. It
never silently bypasses the runtime.

## Read path

- Read `.chaos/interactions/` directly (sessions, decisions, responses, locks,
  capsules) when the command's contract allows file fallback.
- Cap confidence to **MEDIUM** unless direct file validation is strong.
- Do not invent missing runtime context.

## Write path

- Prefer the runtime CLI/package writer
  (`tools/chaos-interaction-runtime/src/cli/chaos-interaction-runtime.ts`) only when a
  safe writer is available.
- If no safe writer is available, **stop before writing runtime state** and report
  that the MCP/runtime writer is unavailable.
- Never hand-write runtime JSON state.

## No silent bypass

Forbidden statements/behaviours:

- “I’ll just continue.”
- “Decision Center is unavailable, so I’ll decide.”
- “No runtime found, assuming approved.”
- “Pending decision exists but proceeding anyway.”

Instead, the command must use the runtime, use this explicit fallback, or **stop and ask the user**.
When diagnostics integration is available, emit a Todo Candidate for the unresolved
runtime gap rather than proceeding.
