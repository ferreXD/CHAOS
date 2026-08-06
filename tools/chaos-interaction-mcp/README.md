# @ferrexd-chaos/interaction-mcp

Local **MCP server** for the [CHAOS](https://github.com/ferreXD/CHAOS) interaction
runtime: durable decisions, sessions, locks, and resume capsules, file-backed
under `.chaos/interactions/` in your repository.

> The chat thread is not the source of truth. The interaction runtime is the
> source of truth. **MCP is the agent-facing API to that runtime.**

- Server name: `chaos-interaction`
- Transport: **stdio**
- Storage: local JSON files only. No network calls, no telemetry.

## Install / run

No install step — run it with `npx` from your repository root:

```json
{
  "mcpServers": {
    "chaos-interaction": {
      "command": "npx",
      "args": [
        "-y",
        "@ferrexd-chaos/interaction-mcp",
        "--repo-root",
        ".",
        "--log-level",
        "error"
      ]
    }
  }
}
```

The CHAOS Claude Code plugin ships this exact wiring; installing the plugin is
the normal way to get this server. Requires Node.js **>= 20.19** (the published
package is a single pre-bundled JS file — no compile at install time).

### Schemas

Artifacts are validated against JSON schemas in
`.chaos/interactions/schema/`. The canonical schema files are embedded in this
package and seeded automatically:

- On startup, if the interactions root (`.chaos/interactions/`) exists but the
  schema directory is missing or empty, the server seeds it. A repository where
  CHAOS was never initialized is left untouched.
- Explicitly: `npx -y @ferrexd-chaos/interaction-mcp --seed-schemas` (add
  `--force` to overwrite existing files). Existing files are never overwritten
  without `--force` — once seeded, the workspace copy is yours.

## MCP tools

| Tool | Notes |
|---|---|
| `chaos_begin_command` | READY / RESUME_AVAILABLE / BLOCKED_BY_PENDING_DECISION / CONFLICTING_COMMAND_ACTIVE. |
| `chaos_create_decision` | Returns `mustStop: true`; never blocks; idempotent (`PENDING_DECISION_EXISTS`). |
| `chaos_get_active_decision` | NO_ACTIVE_DECISION / ACTIVE_DECISION / MULTIPLE_ACTIVE_DECISIONS. |
| `chaos_get_decision_response` | NO_RESPONSE_YET / ANSWERED / CANCELLED / EXPIRED / SUPERSEDED / CONSUMED. |
| `chaos_answer_decision` | **Manual/dev/test bridge** (see caveat below). |
| `chaos_mark_decision_consumed` | answered → consumed; preserves response. |
| `chaos_create_resume_capsule` | Compact; references artifacts by path. |
| `chaos_get_resume_capsule` | FOUND / NOT_FOUND / MULTIPLE_FOUND; by run/change/`latest`. |
| `chaos_find_resume_candidates` | Ready-to-resume sessions for `chaos:resume`. |
| `chaos_complete_command` | Distinguishes administrative terminalization. |
| `chaos_cancel_command` | Cancels pending decisions, releases locks, preserves artifacts. |
| `chaos_list_locks` | Flags stale locks; never deletes/repairs. |
| `chaos_list_sessions` | Summaries only. |

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

Errors are structured and never contain stack traces. Any result that requires
the model to stop sets `mustStop: true` and says so explicitly.

**Caveat:** `chaos_answer_decision` is a manual/dev/testing bridge only. Human
responses are normally written by the VS Code Decision Center extension. The
model must **not** choose the human decision itself.

## MCP resources (read-only)

| URI | Content |
|---|---|
| `chaos://interactions/active` | Active interaction pointer. |
| `chaos://interactions/locks` | Current locks with stale flags. |
| `chaos://interactions/sessions` | All session summaries. |
| `chaos://interactions/sessions/{commandRunId}` | One session. |
| `chaos://interactions/decisions/{decisionId}` | One decision + its response. |
| `chaos://interactions/capsules/{commandRunId}` | One resume capsule. |

All resources return `application/json`. Missing items return a clean
`NOT_FOUND` body.

## CLI flags / environment variables

| CLI flag | Env var | Default |
|---|---|---|
| `--repo-root <dir>` | `CHAOS_REPOSITORY_ROOT` | `process.cwd()` |
| `--root <dir>` | `CHAOS_INTERACTIONS_ROOT` | `<repo-root>/.chaos/interactions` |
| `--schema-dir <dir>` | `CHAOS_INTERACTIONS_SCHEMA_DIR` | `<root>/schema` |
| `--no-validate` / `--validate` | `CHAOS_INTERACTION_VALIDATE` | `true` |
| `--log-level <level>` | `CHAOS_INTERACTION_LOG_LEVEL` | `info` |
| `--config <file>` | — | (optional JSON config) |
| `--seed-schemas [--force]` | — | mode: write embedded schemas and exit |

Precedence: CLI > env > JSON config > defaults. All logging goes to **stderr**;
stdout is reserved for the MCP protocol stream.

## Development (from a CHAOS checkout)

The server runs its TypeScript sources directly (Node >= 22.6 for type
stripping); the runtime package is consumed from source via a relative path:

```bash
npm test               # node --test (unit + spawned stdio smoke)
npm run typecheck      # tsc --noEmit
npm run generate:schemas  # regenerate embedded schemas from .chaos/interactions/schema/
npm run bundle         # esbuild -> dist/chaos-interaction-mcp.mjs (the published artifact)
npm run smoke:bundle   # cold-start smoke of the bundle outside the checkout
```

Authoritative contracts live in the CHAOS repository:
[`.chaos/interactions/`](https://github.com/ferreXD/CHAOS/tree/main/.chaos/interactions)
and [`tools/chaos-interaction-runtime`](https://github.com/ferreXD/CHAOS/tree/main/tools/chaos-interaction-runtime).

## License

MIT
