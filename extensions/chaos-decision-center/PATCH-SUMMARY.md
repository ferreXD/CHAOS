# PATCH SUMMARY — CHAOS Interaction Runtime, Iteration 3 (Decision Center)

**Scope:** VS Code Decision Center UI over the Iteration 1 file-backed runtime.
**Location:** `extensions/chaos-decision-center/` (new extension package).
**Date:** 2026-07-07

> Package-level patch summary (convention from Iterations 1–2). No root
> `PATCH-SUMMARY.md` and no OpenSpec change folder were created.

## Confirmation: no production code modified

No file outside `extensions/chaos-decision-center/` was created or modified,
except two docs-only additive pointers (see "Files modified"). No production
application source, tests, migrations, OpenSpec changes, ADR content, command
contracts (`.claude/commands`, `.github/prompts`), hooks, the MCP server, or the
Iteration 1 runtime were changed.

## Files added

### Config / docs
- `package.json` (VS Code manifest: commands, configuration, activation), `package-lock.json`
- `tsconfig.json`, `tsconfig.build.json`, `.gitignore`
- `README.md`, `MANUAL-SMOKE-TEST.md`, `PATCH-SUMMARY.md`

### Pure logic (vscode-free, unit-tested)
- `src/runtime.ts` — relative bridge to the Iteration 1 runtime package
- `src/config/extensionConfig.ts` — config type + `resolveConfig` (defaults/validation)
- `src/runtime/workspaceResolver.ts` — path resolution
- `src/runtime/runtimeClient.ts` — reads projection + writes via `answerDecision`; read-only capsule adapter
- `src/decisionCenter/decisionViewModel.ts` — `buildProjection`, `buildResumeInstruction`, `statusBarText`, `withActiveDecision`
- `src/decisionCenter/htmlEscape.ts` — HTML/attr/script escaping
- `src/decisionCenter/decisionCenterHtml.ts` — CSP+nonce webview HTML renderer
- `src/decisionCenter/messageHandlers.ts` — webview message validation + dispatch
- `src/decisionCenter/controller.ts` — controller interface (breaks a cycle)

### VS Code glue (typechecked + built)
- `src/extension.ts` — activate/deactivate + `ExtensionController`
- `src/decisionCenter/decisionCenterPanel.ts` — persistent webview panel (singleton)
- `src/statusBar/chaosStatusBar.ts` — status bar item
- `src/runtime/interactionWatcher.ts` — FileSystemWatcher + polling fallback
- `src/logging/logger.ts` — output-channel logger
- `src/commands/{openDecisionCenter,refreshDecisionCenter,answerDecision,cancelDecision,copyResumeInstruction}.ts`

### Tests
- `test/{decisionViewModel,htmlEscape,messageHandlers,workspaceResolver,runtimeClient}.test.ts`, `test/helpers.ts`

## Files modified

- `tools/chaos-interaction-mcp/README.md` — one additive line noting the human-facing Decision Center exists.
- `.chaos/interactions/README.md` — the existing implementation-status pointer extended by one line (no contract change).

## Commands registered

`chaosDecisionCenter.open`, `.refresh`, `.answerDecision`, `.cancelDecision`,
`.copyResumeInstruction` (all under the "CHAOS" category).

## Settings added

`chaosDecisionCenter.*`: `interactionsRoot`, `schemaDir`, `openOnPendingDecision`,
`focusOnPendingDecision`, `showNotificationOnPendingDecision`, `afterSubmit`,
`validateResponses`, `pollingFallbackMs`, `maxHistoryItems`, `userName`.

## Runtime integration approach

- The extension imports the Iteration 1 runtime **from source** (`src/runtime.ts`)
  and compiles it into `dist/` alongside the extension (CommonJS). It does not
  depend on the MCP server.
- Responses are written **only** via `runtime.answerDecision` with source
  `vscode-decision-center` and `selectedBy` = configured `userName` (default
  `vscode-user`, never an email). No hand-written response JSON.
- Reads use `runtime.store` (decisions/sessions/locks/active) plus a small
  read-only capsule-enumeration adapter. Reads are defensive: a malformed file
  becomes a health warning, not a crash.

## UI behavior

One persistent panel (not one-per-decision) with Active Decision, Decision
Queue, Ready to Resume, History (capped), and Runtime Health Warnings. Status
bar reflects ready/pending/multiple/unavailable and opens the panel on click.
`openOnPendingDecision`/`focusOnPendingDecision`/`showNotificationOnPendingDecision`
control appearance; `afterSubmit` controls post-answer behaviour (default
`switchToDashboard`, never closes immediately).

## Security posture

- Strict CSP (`default-src 'none'`; nonce'd inline style/script only); no
  external scripts/CSS/fonts/images/network (asserted by test).
- All decision-derived text escaped; nothing rendered as raw HTML or executed.
- Every webview message validated before action; selected option validated
  against `decision.json` by the runtime; writes confined to `.chaos/interactions/`.
- Malformed state degrades to a warning; no secrets/full artifact bodies logged.

## Tests added / validation performed

- `npm test` (`node --test`) → **28 passed, 0 failed**. Covers required cases:
  1 no-pending, 2 one active, 3 multiple, 4 recommended marked, 5 rationale
  represented, 6 HTML-escaping/injection, 7 valid submit calls answer path
  (+ real response.json write), 8 invalid option rejected, 9 rationale enforced,
  10 resume instruction (run/change/latest), 11 status bar text, 12 path
  resolution, 13 malformed state → warning not crash, 14 history capped, 15 no
  external CDN/http refs + strict CSP.
- `npm run typecheck` (`tsc --noEmit`) → **clean**.
- `npm run build` (`tsc -p tsconfig.build.json`) → **emits `dist/`** (extension +
  runtime, CommonJS). The compiled `RuntimeClient` + runtime bridge were verified
  to run in plain Node (projection computed from a seeded decision).

## Manual smoke status

Not executed here (requires an interactive VS Code Extension Development Host).
Full steps are documented in `MANUAL-SMOKE-TEST.md` and remain required to verify
the live webview, watcher, status bar, and clipboard behaviour.

## Known limitations

- **Per-decision cancel not available** (follow-up #1): Iteration 1 exposes
  `cancelCommand` (session-level) only. The UI offers session-level cancel with a
  confirmation modal and clear labelling, rather than a destructive per-decision
  cancel that doesn't exist.
- **Capsule enumeration** is an extension-side read-only adapter (follow-up #2):
  Iteration 1 has no capsule-list API.
- Webview + vscode wiring are covered by the manual smoke test, not automated
  tests (no headless VS Code harness in this repo).
- `node --test` prints a `MODULE_TYPELESS_PACKAGE_JSON` performance warning
  because the extension package is CommonJS (required for the VS Code host) while
  test files use ESM syntax. Harmless; tests pass.

## Explicit non-goals (not implemented, by design)

Live auto-resume runner; full `chaos:resume` command; broad command-contract
rewrites; hook enforcement; `chaos:delete`/discard; GitHub/Azure issue sync;
cloud dashboard/remote approval; MCP server redesign; any production application
change.

## Self-audit

- **Files added:** listed above (all under `extensions/chaos-decision-center/`).
- **Files modified:** two docs-only additive pointers; no code outside the new package.
- **Tests run:** `node --test` (28 pass), `tsc --noEmit` (clean), `tsc` build (ok), compiled runtime-client smoke (ok).
- **Validation status:** all automated validation green; manual VS Code smoke documented but not executed here.
- **Production code changed:** no.
- **Iteration 1 runtime API gaps found:** (1) no per-decision cancel; (2) no
  capsule-list API. Both handled with the smallest extension-side approach
  (session-level cancel with confirmation; read-only capsule enumeration).
  Iteration 1 was not modified. No incompatible state is ever hand-written — all
  writes go through `answerDecision`/`cancelCommand`.
- **Iteration 2 MCP assumptions changed:** none. The MCP server is unchanged
  (docs pointer only). `chaos_answer_decision` remains the documented manual/dev
  bridge; humans now answer via the Decision Center.
- **Security caveats remaining:** none known. CSP is strict, all content escaped,
  messages validated. The webview dev-tools network check is part of the manual
  smoke test.
- **Follow-up before Iteration 4:** consider adding to the Iteration 1 runtime a
  `listCapsules()` API and (optionally) a per-decision cancel/supersede
  operation; Iteration 4 (`chaos:resume`) can consume the resume instructions
  this panel already surfaces.
