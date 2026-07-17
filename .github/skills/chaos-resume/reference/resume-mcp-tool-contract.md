# Resume MCP Tool Contract

`chaos:resume` prefers the MCP server (`chaos-interaction`, Iteration 2) when it is
registered in the Copilot workspace. Tools map onto the Iteration 1 runtime; all are
non-blocking and return the structured result envelope
`{ ok, status, mustStop, message, data, warnings, nextAction? }`. When the MCP server is
not wired, use the runtime CLI (`--adapter copilot`), which drives the same tools.

## Tools used by resume

| Tool | Purpose in resume |
|---|---|
| `chaos_find_resume_candidates` | Find ready-to-resume sessions (`NOT_FOUND` / `FOUND` / `MULTIPLE_FOUND`). `MULTIPLE_FOUND` sets `mustStop: true`. |
| `chaos_get_resume_capsule` | Load a capsule by `commandRunId` / `changeId` / `latest`. `MULTIPLE_FOUND` → ask the user. |
| `chaos_list_sessions` | Inspect session state/summaries when needed. |
| `chaos_get_active_decision` | Detect any still-pending decision before resuming. |
| `chaos_get_decision_response` | Read the answered response to incorporate. |
| `chaos_mark_decision_consumed` | Mark a decision consumed **after** incorporation. |
| `chaos_complete_command` | Complete the session and release locks when the resumed command finishes. |

## Selection

- Use `chaos_find_resume_candidates` first to resolve the candidate set.
- Use `chaos_get_resume_capsule` for the full capsule of the chosen candidate.
- Honour `mustStop: true` — when a tool says stop (e.g. `MULTIPLE_FOUND`,
  `NO_RESPONSE_YET`, a pending decision), STOP.

## Error handling

MCP tool errors are structured (`ok: false`, a `status`/`error.code`) and never
contain stack traces. On `VALIDATION_ERROR` / `NOT_FOUND` / `MALFORMED_STATE`,
report the message and stop; do not retry blindly.

## Fallback when MCP is unavailable

- Read `.chaos/interactions/**` directly, or use the runtime CLI
  (`tools/chaos-interaction-runtime/src/cli/chaos-interaction-runtime.ts`, with
  `--adapter copilot`).
- Do not hand-write runtime state. If no safe writer is available (e.g. to mark a
  decision consumed), report what must be done and stop rather than editing JSON
  by hand.
- Disclose the degraded mode; cap confidence to MEDIUM unless direct file
  validation is strong.
