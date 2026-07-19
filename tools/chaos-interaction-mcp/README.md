# CHAOS Interaction MCP Server — Iteration 2

Local **MCP server** exposing the CHAOS Interaction Runtime decision/session
tools, so Claude-native CHAOS commands can create, inspect, and resume material
human-decision workflows deterministically.

> The chat thread is not the source of truth. The interaction runtime is the
> source of truth. **MCP is the agent-facing API to that runtime.**

- Server name: `chaos-interaction`
- Transport: **stdio**
- Description: *Local MCP server exposing CHAOS Interaction Runtime decision/session tools.*

## Relationship to Iteration 1

This package is a thin **adapter** over the Iteration 1 file-backed runtime
([`tools/chaos-interaction-runtime`](../chaos-interaction-runtime/README.md)).
It adds no new persistence and no new state semantics — every tool maps onto an
Iteration 1 `InteractionRuntime` operation. The runtime is imported from source
via a relative path (`src/runtime.ts`), because Node's built-in TypeScript
type-stripping does not strip types under `node_modules`; this keeps the whole
thing runnable with zero build step.

Authoritative sources:

- ADR: [`docs/adr/2026-07-06-chaos-interaction-runtime-and-decision-center.md`](../../docs/adr/2026-07-06-chaos-interaction-runtime-and-decision-center.md)
- Contracts/schemas: [`.chaos/interactions/`](../../.chaos/interactions/)
- Runtime: [`tools/chaos-interaction-runtime`](../chaos-interaction-runtime/)

## MCP tools

| Tool | Maps to | Notes |
|---|---|---|
| `chaos_begin_command` | `beginCommand` | READY / RESUME_AVAILABLE / BLOCKED_BY_PENDING_DECISION / CONFLICTING_COMMAND_ACTIVE. |
| `chaos_create_decision` | `createDecision` | Returns `mustStop: true`; never blocks; idempotent (`PENDING_DECISION_EXISTS`). |
| `chaos_get_active_decision` | `getActiveDecision` | NO_ACTIVE_DECISION / ACTIVE_DECISION / MULTIPLE_ACTIVE_DECISIONS. |
| `chaos_get_decision_response` | `getDecisionResponse` | NO_RESPONSE_YET / ANSWERED / CANCELLED / EXPIRED / SUPERSEDED / CONSUMED. |
| `chaos_answer_decision` | `answerDecision` | **Manual/dev/test bridge** (see caveat). |
| `chaos_mark_decision_consumed` | `markDecisionConsumed` | answered → consumed; preserves response. |
| `chaos_create_resume_capsule` | `createResumeCapsule` | Compact; references artifacts by path. |
| `chaos_prune_capsule` | `pruneCapsule` | Retires a stale/orphaned capsule for a terminal session; preserves the session record + audit log (`capsule-pruned`); refuses live sessions unless `force`; idempotent (`NO_CAPSULE`). |
| `chaos_get_resume_capsule` | `getResumeCapsule` / `listCapsules` | FOUND / NOT_FOUND / MULTIPLE_FOUND; by run/change/`latest`. |
| `chaos_find_resume_candidates` | `findResumeCandidates` | NOT_FOUND / FOUND / MULTIPLE_FOUND ready-to-resume sessions for `chaos:resume`. |
| `chaos_complete_command` | `completeCommand` | Distinguishes administrative terminalization (see below). |
| `chaos_cancel_command` | `cancelCommand` | Cancels pending decisions, releases locks, preserves artifacts. |
| `chaos_list_locks` | `listLocks` | Flags stale locks; never deletes/repairs. |
| `chaos_list_sessions` | `store.sessions.list` | Summaries only. |

### Tool result contract

Every tool returns a consistent, model-friendly wrapper:

```json
{
  "ok": true,
  "status": "WAITING_FOR_USER_DECISION",
  "mustStop": true,
  "message": "Decision created. Stop now and wait for the human response.",
  "data": {},
  "warnings": [],
  "nextAction": "Stop now. Do not continue this CHAOS command until a decision response exists."
}
```

Errors are structured and **never** contain stack traces:

```json
{
  "ok": false,
  "status": "VALIDATION_ERROR",
  "mustStop": true,
  "message": "selectedOptionId does not exist.",
  "data": {},
  "warnings": [],
  "error": { "code": "VALIDATION_ERROR", "details": [] }
}
```

Any result that requires the model to stop sets `mustStop: true` and says so
explicitly. This is part of the model-robustness contract.

### Administrative terminalization

`chaos_complete_command` completing directly from `ready-to-resume` is treated as
**administrative terminalization** (valid for runtime cleanup, CLI smoke paths,
and no-runner environments). This is distinct from *normal resumed execution*
(`ready-to-resume → resumed → completed`), which a later iteration's live runner
will drive. The tool returns `data.completionMode` and warns when it infers the
administrative path.

## MCP resources (read-only)

| URI | Content |
|---|---|
| `chaos://interactions/active` | Active interaction pointer (`active.json`). |
| `chaos://interactions/locks` | Current locks with stale flags. |
| `chaos://interactions/sessions` | All session summaries. |
| `chaos://interactions/sessions/{commandRunId}` | One session. |
| `chaos://interactions/decisions/{decisionId}` | One decision + its response. |
| `chaos://interactions/capsules/{commandRunId}` | One resume capsule. |

All resources return `application/json` and never expose secrets. Missing items
return a clean `NOT_FOUND` body.

## Requirements

- Node.js **>= 22.6** (built-in TypeScript type-stripping + `node:test`).
- Dependencies: `@modelcontextprotocol/sdk`, `zod`. Dev-only: `typescript`, `@types/node`.

## Setup with Claude Code

Add an MCP server entry pointing at the stdio CLI. Use **placeholders** — do not
commit private absolute paths. The Claude Code project convention is a
repo-root `.mcp.json` (or the `mcpServers` block of your Claude settings):

```json
{
  "mcpServers": {
    "chaos-interaction": {
      "command": "node",
      "args": [
        "tools/chaos-interaction-mcp/src/cli/chaos-interaction-mcp.ts",
        "--root",
        ".chaos/interactions",
        "--schema-dir",
        ".chaos/interactions/schema"
      ]
    }
  }
}
```

Running the `.ts` source directly works because Node 22 strips types. After a
build you may instead point at the compiled entry:

```json
"args": [
  "tools/chaos-interaction-mcp/dist/chaos-interaction-mcp/src/cli/chaos-interaction-mcp.js",
  "--root", ".chaos/interactions", "--schema-dir", ".chaos/interactions/schema"
]
```

### Local dogfooding

A ready-to-copy example ships with this package:
[`examples/mcp.example.json`](examples/mcp.example.json) (repo-root-relative
placeholder paths). To wire the server for local use:

```bash
# From the repository root:
cp tools/chaos-interaction-mcp/examples/mcp.example.json .mcp.json
# then reload your MCP client
```

> **Iteration 2 deliberately does not create or modify a repo-root `.mcp.json`.**
> Auto-wiring is deferred until the Decision Center (Iteration 3) and resume flow
> (Iteration 4) are usable enough that enabling the server does not expose a
> half-integrated runtime. Until then, copy the example yourself to dogfood.
> `.mcp.json` is not created by this package and remains yours to manage.

## CLI args / environment variables

| CLI flag | Env var | Default |
|---|---|---|
| `--root <dir>` | `CHAOS_INTERACTIONS_ROOT` | `<repo-root>/.chaos/interactions` |
| `--schema-dir <dir>` | `CHAOS_INTERACTIONS_SCHEMA_DIR` | `<root>/schema` |
| `--repo-root <dir>` | `CHAOS_REPOSITORY_ROOT` | `process.cwd()` |
| `--no-validate` / `--validate` | `CHAOS_INTERACTION_VALIDATE` | `true` |
| `--log-level <level>` | `CHAOS_INTERACTION_LOG_LEVEL` | `info` |
| `--config <file>` | — | (optional JSON config) |

Precedence: CLI > env > JSON config > defaults. All logging goes to **stderr**;
stdout is reserved for the MCP protocol stream.

## Manual dev flow

While the VS Code Decision Center (Iteration 3) does not exist yet,
`chaos_answer_decision` lets a human's **already-chosen** option be recorded
through MCP for smoke testing:

```text
chaos_begin_command   -> commandRunId
chaos_create_decision -> decisionId (mustStop: true) — STOP
chaos_answer_decision -> record the option the USER chose
chaos_get_decision_response -> ANSWERED
chaos_mark_decision_consumed
chaos_complete_command
```

**Caveat:** `chaos_answer_decision` is a manual/dev/testing bridge only. In the
final Decision Center flow the VS Code extension writes responses. The model must
**not** choose the human decision itself; only call this tool when the user has
explicitly provided the chosen option.

## Testing

Zero-build; runs the TypeScript sources directly:

```bash
npm test          # node --test  (unit tool/resource/validation + spawned stdio smoke)
npm run typecheck # tsc --noEmit
npm run build     # tsc -> dist/ (also compiles the runtime it imports)
```

The smoke test spawns the real server over stdio and drives it with the official
MCP client.

## Non-goals (out of scope for Iteration 2)

- VS Code Decision Center UI (Iteration 3).
- Live auto-resume runner (Iteration 5).
- Full `chaos:resume` command implementation (Iteration 4).
- Command-contract rewrites, hook enforcement, `chaos:delete` / discard.
- HTTP/SSE/Streamable-HTTP transports.
- Any production application change.

## Next iteration

**Iteration 3 — VS Code Decision Center (implemented).** A persistent workspace
UI that reads this runtime state and writes decision responses (replacing the
manual `chaos_answer_decision` bridge), backed by the same file-backed runtime
store. See [`extensions/chaos-decision-center`](../../extensions/chaos-decision-center/README.md).
The MCP server (agent-facing) and the Decision Center (human-facing) are separate
and complementary; the MCP server is unchanged by Iteration 3.
