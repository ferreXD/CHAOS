# PATCH SUMMARY — CHAOS Interaction Runtime, Iteration 2 (MCP server)

**Scope:** Local MCP server (stdio) exposing the Iteration 1 file-backed runtime.
**Location:** `tools/chaos-interaction-mcp/` (new, separate package; adapter over the runtime).
**Date:** 2026-07-07

> Package-level patch summary (existing convention from Iteration 1). No root
> `PATCH-SUMMARY.md` and no OpenSpec change folder were created.

## Confirmation: no production code modified

No file outside `tools/chaos-interaction-mcp/` was created or modified. The
Iteration 1 runtime package (`tools/chaos-interaction-runtime/`) was **not**
changed except for a one-line additive pointer in its `README.md` (docs only);
`.chaos/interactions/README.md` received a short additive pointer subsection
(docs only, no contract changes). No production application source, tests,
migrations, OpenSpec changes, ADR content, command contracts, hooks, or the VS
Code extension were touched.

## Files added

### Config / docs
- `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.build.json`, `.gitignore`
- `README.md`, `PATCH-SUMMARY.md` (this file)
- `examples/mcp.example.json` — committed example client config (relative
  placeholder paths). Users copy it to a repo-root `.mcp.json` for local
  dogfooding. **Iteration 2 does not create/modify an active repo-root
  `.mcp.json`** — auto-wiring is deferred until Iteration 3/4, once the Decision
  Center / resume flow is usable enough that enabling the server does not expose
  a half-integrated runtime.

### Server / protocol
- `src/index.ts` — public API barrel
- `src/server.ts` — SDK wiring (`McpServer`, tools + resources)
- `src/cli/chaos-interaction-mcp.ts` — stdio entrypoint
- `src/config.ts` — CLI/env/JSON config resolution
- `src/runtimeFactory.ts` — builds the Iteration 1 `InteractionRuntime`
- `src/runtime.ts` — single relative bridge to the Iteration 1 package
- `src/logger.ts` — stderr-only logger
- `src/views.ts` — compact summaries + relative paths
- `src/capsuleLookup.ts` — MCP-side capsule enumeration adapter (see follow-up)
- `src/protocol/toolResult.ts` — result wrapper (`success` / `stopResult` / `failure`)
- `src/protocol/errors.ts` — structured error mapping (no stack traces)
- `src/protocol/validation.ts` — argument validation helpers
- `src/protocol/tool.ts` — tool type + `invokeTool`

### Tools (12)
- `src/tools/{beginCommand,createDecision,getActiveDecision,getDecisionResponse,answerDecision,markDecisionConsumed,createResumeCapsule,getResumeCapsule,completeCommand,cancelCommand,listLocks,listSessions}.ts`
- `src/tools/registry.ts`

### Resources (6)
- `src/resources/{activeInteractionResource,lockResource,sessionResource,decisionResource,capsuleResource,types,registry}.ts`
  (sessionResource exports both the sessions-list and session-by-id resources.)

### Tests
- `test/helpers.ts`
- `test/mcpTools.test.ts`
- `test/mcpValidation.test.ts`
- `test/mcpResources.test.ts`
- `test/mcpSmoke.test.ts`

## Files modified

- `tools/chaos-interaction-runtime/README.md` — one additive line noting the Iteration 2 MCP adapter exists.
- `.chaos/interactions/README.md` — one short additive pointer subsection (no contract rewrite).

## Tools implemented

`chaos_begin_command`, `chaos_create_decision`, `chaos_get_active_decision`,
`chaos_get_decision_response`, `chaos_answer_decision` (manual/dev bridge),
`chaos_mark_decision_consumed`, `chaos_create_resume_capsule`,
`chaos_get_resume_capsule`, `chaos_complete_command`, `chaos_cancel_command`,
`chaos_list_locks`, `chaos_list_sessions`. Each maps 1:1 onto an Iteration 1
runtime operation. `chaos_create_decision` returns `mustStop: true` and never
blocks waiting for a human.

## Resources implemented

`chaos://interactions/active`, `/locks`, `/sessions`, `/sessions/{commandRunId}`,
`/decisions/{decisionId}`, `/capsules/{commandRunId}` — all read-only JSON.

## Tool result contract

Consistent wrapper `{ ok, status, mustStop, message, data, warnings, nextAction?, error? }`.
Success/blocking use `ok: true`; only genuine failures use `ok: false`. Any
stop-required result sets `mustStop: true` with explicit stop wording. Errors are
structured with a `code`; stack traces are never returned to the model (full
detail is logged to stderr).

## Config / transport

- Transport: **stdio** only (HTTP/SSE out of scope).
- Config from CLI args > env vars > optional JSON config > defaults.
- Env: `CHAOS_INTERACTIONS_ROOT`, `CHAOS_INTERACTIONS_SCHEMA_DIR`,
  `CHAOS_REPOSITORY_ROOT`, `CHAOS_INTERACTION_VALIDATE`,
  `CHAOS_INTERACTION_LOG_LEVEL`.
- Logging is stderr-only (stdout is the protocol channel).

## Tests added / validation performed

- `node --test` → **23 passed, 0 failed** (tool flows, validation/errors,
  resources, and a **spawned-server stdio smoke test** using the official MCP
  client). Covers all 20 required cases.
- `npm install` → OK (`@modelcontextprotocol/sdk` 1.29.0, `zod`; dev: `typescript`, `@types/node`).
- `npm run typecheck` (`tsc --noEmit`) → **clean**.
- `npm run build` (`tsc -p tsconfig.build.json`) → **emits `dist/`** including the
  runtime it imports; the **compiled** server was verified to start over stdio
  and serve all 12 tools.

Nothing was skipped. No network services required at runtime.

Required-case coverage: 1 registry ✓, 2 begin READY ✓, 3 create mustStop ✓,
4 duplicate decision ✓, 5 active decision ✓, 6 NO_RESPONSE_YET ✓, 7 answer ✓,
8 ANSWERED ✓, 9 rationale enforced ✓, 10 invalid option ✓, 11 conflict ✓,
12 different change ✓, 13 create capsule ✓, 14 get capsule latest/multiple ✓,
15 complete releases locks ✓, 16 cancel ✓, 17 stale lock flag (no delete) ✓,
18 structured errors / no stack ✓, 19 stdio server starts ✓, 20 resources ✓.

## Known limitations

- stdio transport only.
- `chaos_answer_decision` is a manual/dev/test bridge (documented). Production
  responses will be written by the Iteration 3 Decision Center.
- `chaos_get_resume_capsule` enumeration is implemented MCP-side
  (`capsuleLookup.ts`) because Iteration 1 has no capsule-list API (follow-up #1).
- Schema validation fidelity is inherited from the Iteration 1 pragmatic
  validator (documented there).
- No `.mcp.json` is created/modified; setup is documented with placeholders.

## Explicit non-goals (not implemented, by design)

VS Code Decision Center UI; live auto-resume runner; full `chaos:resume`
command; command-contract rewrites; hook enforcement; `chaos:delete`/discard;
HTTP/SSE transports; any production application change.

## Self-audit

- **Files added:** listed above (all under `tools/chaos-interaction-mcp/`).
- **Files modified:** two docs-only additive pointers (runtime README,
  `.chaos/interactions/README.md`); no code outside the new package.
- **Tests run:** `node --test` (23 pass), `tsc --noEmit` (clean), `tsc` build
  (ok), compiled dist stdio smoke (ok).
- **Validation status:** all green; nothing skipped.
- **Production code changed:** no.
- **Iteration 1 API mismatch detected:** two minor gaps, handled with the
  smallest compatible MCP-side adapters (below); Iteration 1 was not modified.
- **Iteration 0 contract gap:** none new beyond those already recorded by
  Iteration 1; MCP statuses and result shapes align with the mcp-tool-contract.
- **MCP SDK/runtime limitation affecting design:** Node refuses to type-strip
  files under `node_modules`, so the runtime is imported via a relative source
  path (`src/runtime.ts`) instead of a `file:` dependency. This is the reason the
  build compiles both packages into `dist/`.

### Follow-up findings (smallest-compatible adapter chosen; Iteration 1 not silently redesigned)

1. **No capsule-list API in Iteration 1.** The runtime reads capsules by
   `commandRunId` only. `chaos_get_resume_capsule` needs lookup by `changeId` /
   `--latest`, so `src/capsuleLookup.ts` enumerates the capsules directory
   read-only. Follow-up: consider adding `listCapsules()` / a capsule index to the
   Iteration 1 runtime.
2. **`CapsuleOverrides` not exported from the Iteration 1 index.**
   `chaos_create_resume_capsule` builds a structurally-typed overrides object
   instead of importing the type. Follow-up: export `CapsuleOverrides` from the
   runtime index for stronger typing at the boundary.

Neither gap blocked Iteration 2; both were handled inside the MCP package.
