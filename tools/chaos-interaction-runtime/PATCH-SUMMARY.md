# PATCH SUMMARY — CHAOS Interaction Runtime, Iteration 1

**Scope:** Implement the file-backed interaction state layer defined by Iteration 0.
**Location:** `tools/chaos-interaction-runtime/` (new, self-contained package).
**Date:** 2026-07-07

> This is a **package-level** patch summary (the option explicitly permitted by the
> iteration brief). No root `PATCH-SUMMARY.md` was created, and no OpenSpec change
> folder was added under `.chaos/changes/`, to avoid polluting OpenSpec change
> tracking with runtime-tooling content.

## Confirmation: no production code modified

No file outside `tools/chaos-interaction-runtime/` was created or modified.
`git status` before documentation showed only `tools/` (new), plus the
pre-existing untracked Iteration 0 package (`.chaos/interactions/`) and its ADR,
which this work did **not** touch. No production application source, tests,
migrations, ADRs, OpenSpec artifacts, rules, gates, hooks, or CHAOS command
contracts were changed.

## Files added

### Config / docs
- `tools/chaos-interaction-runtime/package.json`
- `tools/chaos-interaction-runtime/package-lock.json`
- `tools/chaos-interaction-runtime/tsconfig.json`
- `tools/chaos-interaction-runtime/tsconfig.build.json`
- `tools/chaos-interaction-runtime/.gitignore`
- `tools/chaos-interaction-runtime/README.md`
- `tools/chaos-interaction-runtime/PATCH-SUMMARY.md` (this file)

### Model (types + state machines)
- `src/model/commandSession.ts`
- `src/model/decision.ts`
- `src/model/response.ts`
- `src/model/lock.ts`
- `src/model/resumeCapsule.ts`
- `src/model/auditEvent.ts`
- `src/model/activeState.ts`

### Store (persistence)
- `src/store/pathResolver.ts`
- `src/store/atomicWrite.ts`
- `src/store/schemaValidation.ts`
- `src/store/sessionStore.ts`
- `src/store/decisionStore.ts`
- `src/store/lockStore.ts`
- `src/store/capsuleStore.ts`
- `src/store/auditStore.ts`
- `src/store/activeStateStore.ts`
- `src/store/interactionStore.ts`

### Services (operations + policy)
- `src/services/interactionRuntime.ts` (the 10 runtime operations)
- `src/services/commandSessionService.ts`
- `src/services/decisionService.ts`
- `src/services/lockService.ts`
- `src/services/resumeCapsuleService.ts`
- `src/services/identifiers.ts`
- `src/services/errors.ts`

### Validation / CLI / API
- `src/validation/schemas.ts`
- `src/cli/chaos-interaction-runtime.ts`
- `src/index.ts`

### Tests
- `test/helpers.ts`
- `test/interactionRuntime.test.ts`
- `test/lockPolicy.test.ts`
- `test/resumeCapsule.test.ts`
- `test/schemaValidation.test.ts`

## Files modified

None (outside the new package).

## Runtime operations implemented

All 10 required operations on `InteractionRuntime`:

1. `beginCommand` → `READY` / `RESUME_AVAILABLE` / `BLOCKED_BY_PENDING_DECISION` / `CONFLICTING_COMMAND_ACTIVE`.
2. `createDecision` → `WAITING_FOR_USER_DECISION`, `mustStop: true`; validates payload (duplicate option ids, unknown `recommendedOptionId`); idempotent (`PENDING_DECISION_EXISTS`); writes `decision.json`, updates session/active/locks, appends audit.
3. `answerDecision` → validates selected option + required rationale; writes `response.json`; may transition session to `ready-to-resume` and write a resume capsule.
4. `getActiveDecision` → none / one / blocked-multiple.
5. `getDecisionResponse` → `NO_RESPONSE_YET` / `ANSWERED` / `CANCELLED` / `EXPIRED` / `SUPERSEDED` / `CONSUMED`.
6. `markDecisionConsumed` → `answered → consumed`, preserves response artifact, updates session.
7. `completeCommand` → completes session, releases locks.
8. `cancelCommand` → cancels session + pending decisions, releases locks, preserves artifacts.
9. `listLocks` → returns locks with computed `stale` flag; never auto-deletes.
10. `createResumeCapsule` → compact, schema-valid capsule referencing artifacts by path.

Non-blocking guarantee: no operation waits for a human. `createDecision` records
state and returns `mustStop: true`.

## State machines implemented

- **Command session:** `created, running, waiting-for-decision, ready-to-resume, resumed, completed, cancelled, expired, failed`. Transition table in `src/model/commandSession.ts`; invalid transitions raise `InvalidStateTransitionError` before any write (fail-safe).
- **Decision:** `created, waiting, answered, consumed, cancelled, expired, superseded` (`src/model/decision.ts`).

**Intentional superset (documented, not drift):** two additional terminal session
edges are exposed — `ready-to-resume → completed` and `ready-to-resume →
cancelled` — as **administrative** transitions, **not** as normal resumed-command
completion. They serve runtime cleanup, CLI smoke paths, and no-runner
environments (Iteration 1 has no live auto-resume runner). Normal resumed
execution should prefer `ready-to-resume → resumed → completed`; later iterations
(with a live runner) are expected to route ordinary completion through `resumed`,
while these administrative edges remain valid for cleanup / no-runner cases. All
contract edges remain present and enforced.

## Lock policy implemented

Per `session-locking-policy.md`:

- Locks scoped to `changeId`; acquired when a change-scoped decision is created (reason `waiting-for-user-decision`, downgraded to `ready-to-resume` once answered — **not** released on answer).
- Same-change conflicting command → `CONFLICTING_COMMAND_ACTIVE`; same command re-entry → `BLOCKED_BY_PENDING_DECISION`.
- Compatible commands (`chaos:status`, `chaos:doctor`, `chaos:help`, `chaos:resume`, `chaos:todo --dry-run`) and different `changeId` → allowed.
- Locks released only on `completeCommand` / `cancelCommand`.
- Stale locks are detected and flagged by `listLocks`, never auto-removed.

## Schema validation approach

Runtime artifacts are validated **on write** against the authoritative Iteration 0
schemas in `.chaos/interactions/schema/`. The validator is a **dependency-free**
JSON Schema subset (`src/store/schemaValidation.ts`) implementing exactly the
keywords those schemas use (`type` incl. array-of-types + `null`, `const`, `enum`,
`minLength`/`maxLength`, `minItems`, `pattern`, `format: date-time`, `required`,
`properties`, `additionalProperties` as boolean or schema, `items`, local
`$ref` → `#/$defs/...`). Keywords outside this subset are ignored.

**Documented limitation:** this is a pragmatic, contract-scoped validator, not a
full JSON Schema 2020-12 implementation. It can be replaced by a well-known
validator later without changing the store API. Its fidelity is exercised by
tests that validate the Iteration 0 **example** artifacts against the real
schemas (drift check) and validate the runtime's own outputs.

## Atomic writes

`src/store/atomicWrite.ts`: write to sibling temp file → `fsync` → atomic
`rename` (POSIX rename / Windows `MoveFileEx` replace-existing). Directories are
created as needed; existing artifacts are preserved. Corrupt JSON raises
`MalformedStateError` with the file preserved for inspection (fail-safe).

## Tests added

`node:test` suites, **27 tests**, covering all 15 required cases:

| # | Case | Where |
|---|---|---|
| 1 | begin creates session | interactionRuntime.test.ts |
| 2 | create decision writes decision.json + active.json | interactionRuntime.test.ts |
| 3 | create decision returns mustStop=true | interactionRuntime.test.ts |
| 4 | answer writes response.json | interactionRuntime.test.ts |
| 5 | answer validates selected option | interactionRuntime.test.ts |
| 6 | required rationale enforced | interactionRuntime.test.ts |
| 7 | same-change conflicting command blocked | lockPolicy.test.ts |
| 8 | different changeId allowed | lockPolicy.test.ts |
| 9 | compatible read-only command allowed | lockPolicy.test.ts |
| 10 | resume capsule created when answered | resumeCapsule.test.ts |
| 11 | complete releases lock | interactionRuntime.test.ts |
| 12 | cancel releases lock + preserves artifacts | interactionRuntime.test.ts |
| 13 | invalid state transition fails safely | interactionRuntime.test.ts |
| 14 | malformed existing JSON reported safely | schemaValidation.test.ts |
| 15 | atomic write leaves no partial target file | schemaValidation.test.ts |

Plus: duplicate-option / bad-recommended rejection, idempotent createDecision,
response-status progression, multi-decision gating, capsule idempotency,
stale-lock detection, Iteration 0 example schema conformance.

## Validation performed

- `node --test` → **27 passed, 0 failed** (zero-dependency; runs TS sources directly via Node 22 type-stripping).
- `npm install` → OK (dev deps only: `typescript`, `@types/node`).
- `npm run typecheck` (`tsc --noEmit`) → **clean**.
- `npm run build` (`tsc -p tsconfig.build.json`) → **emits `dist/`**; compiled CLI verified runnable.
- CLI smoke path (begin → create-decision → answer → get-response → list-locks → complete) verified end-to-end; produced the exact ADR file layout.

No validation was skipped.

## Known limitations

- Schema validation is a pragmatic keyword subset, not full JSON Schema 2020-12 (see above).
- `expiresAt` is persisted but no background expiry sweep runs yet (staleness is surfaced, per contract, not auto-actioned). Expiry-driven transitions are deferred to a doctor/status iteration.
- The aggregate `locks.json` wrapper (`{ schemaVersion, locks[], updatedAt }`) is not itself covered by an Iteration 0 schema; each element **is** validated against `lock.schema.json`. See follow-up finding below.
- Directory `fsync` is not performed (not meaningful on Windows); file `fsync` + atomic rename is.
- Idempotency keys on `commandRunId + normalized(sourceCommand) + title`.

## Explicit non-goals (not implemented, by design)

- MCP server (Iteration 2).
- VS Code Decision Center / UI (Iteration 3).
- Live auto-resume runner (Iteration 5).
- `chaos:resume` command (Iteration 4).
- Command-contract rewrites, hook enforcement, `chaos:delete` / discard.
- Any production application change.

## Self-audit

- **Files added:** listed above (all under `tools/chaos-interaction-runtime/`).
- **Files modified:** none outside the new package.
- **Tests run:** `node --test` (27 pass), `tsc --noEmit` (clean), `tsc` build (ok), CLI smoke (ok).
- **Validation status:** all green; nothing skipped.
- **Production code changed:** no.
- **Schema drift from Iteration 0:** none detected. Runtime outputs and the
  Iteration 0 examples both validate against the unmodified schemas. Response
  `source` values are mapped to the schema enum (`manual-file`, etc.); the
  session-state superset edges are additive, not contradictory.

### Follow-up findings for Iteration 0 (smallest-compatible behaviour chosen; not silently redesigned)

1. **No schema for the aggregate `locks.json` file.** Iteration 0 ships
   `lock.schema.json` (a single lock) but no wrapper schema for the on-disk
   `locks.json`. Chosen behaviour: store `{ schemaVersion, locks: ChangeLock[], updatedAt }`
   and validate each element against `lock.schema.json`. Follow-up: add a
   `locks-file.schema.json` (or document the array-file shape) in Iteration 0.
2. **No schema for the repository-level `audit.jsonl`.** `audit-event.schema.json`
   covers a single event; each appended line is validated against it. The
   `.jsonl` container shape is implicit. Follow-up: note the JSONL container in
   the contract.
3. **Response `source` enum vs. informal inputs.** The brief mentions sources like
   `vscode-webview` / `cli`; the schema enum is fixed
   (`vscode-decision-center`, `prompt-fallback`, `mcp-tool`, `manual-file`,
   `unknown`). Chosen behaviour: normalise informal labels to the enum
   (`normalizeResponseSource`). Follow-up: confirm the mapping is acceptable or
   extend the enum in Iteration 0.

None of these blocked Iteration 1; each was handled with the smallest
schema-compatible behaviour and recorded here rather than by editing Iteration 0.
