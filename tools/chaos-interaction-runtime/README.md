# CHAOS Interaction Runtime — Iteration 1

File-backed interaction state layer for the CHAOS Interaction Runtime.

This package implements **Iteration 1** of the runtime described in the
Iteration 0 design package:

- ADR: [`docs/adr/2026-07-06-chaos-interaction-runtime-and-decision-center.md`](../../docs/adr/2026-07-06-chaos-interaction-runtime-and-decision-center.md)
- Contracts + schemas + examples: [`.chaos/interactions/`](../../.chaos/interactions/)

> The chat thread is not the source of truth. The interaction runtime is.

## Purpose

Provide a deterministic, inspectable, file-backed store for material human
decisions so long CHAOS runs can pause and resume safely — testable **without**
an MCP server and **without** a VS Code UI.

It owns:

- command sessions
- material decisions
- decision responses
- change locks
- resume capsules
- audit events
- active interaction state (`active.json`) and an index (`index.json`)

## Storage layout

All state lives under a runtime root (default `.chaos/interactions/`):

```text
.chaos/interactions/
  active.json                    # workspace pointer to active/pending state
  index.json                     # index of sessions + decisions
  locks.json                     # aggregate change locks
  audit.jsonl                    # repository-level append-only audit log
  sessions/<commandRunId>.json
  decisions/<decisionId>/
    decision.json
    response.json
    audit.jsonl                  # decision-scoped audit log
  capsules/<commandRunId>.json
  schema/*.schema.json           # Iteration 0 schemas (authoritative)
```

## Project layout

```text
tools/chaos-interaction-runtime/
  src/
    index.ts                     # public API barrel
    model/                       # types + state machines (session/decision/lock/...)
    store/                       # persistence: paths, atomic writes, validation, per-entity stores
    services/                    # runtime operations + policy (lock, capsule, ids, errors)
    validation/schemas.ts        # schema filename map + lock policy constants
    cli/chaos-interaction-runtime.ts
  test/                          # node:test suites
```

## Requirements

- Node.js **>= 22.6** (uses built-in TypeScript type-stripping and `node:test`).

There are **no runtime dependencies**. `typescript` and `@types/node` are the
only dev dependencies, and they are needed only for `typecheck`/`build`.

## Running tests

Tests run directly against the TypeScript sources — **no build or install
required** (Node strips types natively):

```bash
node --test
# or
npm test
```

The tests validate produced artifacts against the **real** Iteration 0 schemas
under `.chaos/interactions/schema/`, and validate the Iteration 0 examples too
(a drift check).

## Typecheck / build (optional)

```bash
npm install        # installs typescript + @types/node (dev only)
npm run typecheck  # tsc --noEmit
npm run build      # emits dist/ (.ts import specifiers are rewritten to .js)
```

`build` exists for the future MCP server / VS Code extension, which will consume
compiled JS. Normal use does not need it.

## CLI smoke test

Development/validation only — **not** required for normal CHAOS use.

```bash
# Zero-build (runs the TypeScript source directly):
node src/cli/chaos-interaction-runtime.ts begin-command \
  --command chaos:propose --change request-context-middleware

node src/cli/chaos-interaction-runtime.ts create-decision \
  --run <runId> --title "Choose execution profile" \
  --option full-strict --option strict-risk-compact --recommended strict-risk-compact

node src/cli/chaos-interaction-runtime.ts answer-decision \
  --decision <decisionId> --selected strict-risk-compact --by vscode-user

node src/cli/chaos-interaction-runtime.ts get-response --decision <decisionId>
node src/cli/chaos-interaction-runtime.ts list-locks

# After a build you can also run: node dist/cli/chaos-interaction-runtime.js ...
```

Global flags: `--root <dir>` (default `.chaos/interactions`),
`--schema-dir <dir>` (default `<root>/schema`), `--no-validate`.

## Runtime operations (public API)

`InteractionRuntime` (see [`src/services/interactionRuntime.ts`](src/services/interactionRuntime.ts)):

| Operation | Summary |
|---|---|
| `beginCommand` | Register/resume a session; returns `READY` / `RESUME_AVAILABLE` / `BLOCKED_BY_PENDING_DECISION` / `CONFLICTING_COMMAND_ACTIVE`. |
| `createDecision` | Create a material decision; returns `WAITING_FOR_USER_DECISION`, `mustStop: true`. Never blocks on a human. |
| `answerDecision` | Record a validated human response; may transition the session to `ready-to-resume` and write a resume capsule. |
| `getActiveDecision` | Return active/pending decision (or blocked-multiple). |
| `getDecisionResponse` | Return response status (`NO_RESPONSE_YET` / `ANSWERED` / `CANCELLED` / `EXPIRED` / `SUPERSEDED` / `CONSUMED`). |
| `markDecisionConsumed` | Mark an answered decision consumed (artifact preserved). |
| `completeCommand` | Complete a session and release its locks. |
| `cancelCommand` | Cancel a session, cancel its pending decisions, release locks (artifacts preserved). |
| `listLocks` | List locks and flag stale ones (never auto-deletes). |
| `createResumeCapsule` | Create/update a compact resume capsule. |

```ts
import { InteractionRuntime } from "@chaos/interaction-runtime";

const runtime = new InteractionRuntime({ root: ".chaos/interactions" });
const begin = runtime.beginCommand({ sourceCommand: "chaos:propose", changeId: "my-change" });
const dec = runtime.createDecision({
  commandRunId: begin.commandRunId!,
  title: "Choose execution profile",
  context: "...",
  options: [{ id: "a", label: "A" }, { id: "b", label: "B", recommended: true }],
});
// ... command STOPS here (dec.mustStop === true) ...
runtime.answerDecision({ decisionId: dec.decisionId, selectedOptionId: "b", selectedBy: "vscode-user" });
```

## Resume capsule discovery (Iteration 4)

Read-only discovery APIs used by `chaos:resume`, the MCP server, and the Decision
Center (replacing earlier ad-hoc capsule enumeration):

| Method | Returns |
|---|---|
| `getResumeCapsule(commandRunId)` | Full `ResumeCapsule` or `null`. |
| `listCapsules(filter?)` | `ResumeCapsuleSummary[]` (compact; filter by `changeId` / `commandRunId` / `sourceCommand` / `state` / `readyToResumeOnly`). |
| `findResumeCandidates(filter?)` | `ResumeCandidate[]` — ready-to-resume sessions joined with capsules; `{ latest: true }` collapses to the most recent. |

These never modify state; malformed capsule files are skipped, not thrown.
`CapsuleStore.list()` backs them.

## State machines

Implemented per [`state-machine-contract.md`](../../.chaos/interactions/contracts/state-machine-contract.md).

- **Session:** `created → running → waiting-for-decision → ready-to-resume → resumed → completed`, plus `cancelled` / `expired` / `failed`. Invalid transitions throw `InvalidStateTransitionError` (fail-safe, no partial mutation).
- **Decision:** `created → waiting → answered → consumed`, plus `cancelled` / `expired` / `superseded`.

### Administrative terminal transitions

Two additional terminal edges are exposed — `ready-to-resume → completed` and
`ready-to-resume → cancelled` — as **administrative** transitions, **not** as the
normal way a resumed command completes. They exist for:

- runtime cleanup,
- CLI smoke paths,
- no-runner environments (Iteration 1 has no live auto-resume runner).

Normal resumed execution should prefer **`ready-to-resume → resumed →
completed`**. In later iterations (once a live runner exists), ordinary
completion is expected to route through `resumed`, while these administrative
edges remain valid for cleanup / no-runner cases. This is an intentional,
additive superset of the contract graph — not a contradiction of it, and not
schema drift.

## Lock policy

Implemented per [`session-locking-policy.md`](../../.chaos/interactions/contracts/session-locking-policy.md):

- Locks are scoped to `changeId`. A pending material decision acquires the lock.
- Conflicting commands over the same change → `CONFLICTING_COMMAND_ACTIVE`.
- Same command re-invoked over the same change → `BLOCKED_BY_PENDING_DECISION` (focus existing).
- Compatible commands (`chaos:status`, `chaos:doctor`, `chaos:help`, `chaos:resume`, `chaos:todo --dry-run`) and different changes → allowed.
- Locks are **not** released merely because a decision was answered; they release on complete/cancel.

## Schema validation

Runtime artifacts are validated on write against the authoritative Iteration 0
schemas under `.chaos/interactions/schema/`.

The validator ([`src/store/schemaValidation.ts`](src/store/schemaValidation.ts)) is a
**pragmatic, dependency-free** JSON Schema subset supporting exactly the keywords
those schemas use (`type`, `const`, `enum`, `minLength`/`maxLength`, `minItems`,
`pattern`, `format: date-time`, `required`, `properties`, `additionalProperties`,
`items`, and local `$ref` to `#/$defs/...`). Keywords outside this subset are
ignored. This is an intentional, contract-scoped fallback rather than a full
2020-12 implementation; it can be swapped for a well-known validator in a later
iteration without changing the store API.

## Atomic writes

All JSON state uses write-temp → `fsync` → atomic `rename`
([`src/store/atomicWrite.ts`](src/store/atomicWrite.ts)). Corrupt/unreadable JSON
raises `MalformedStateError` and the offending file is **preserved** (fail-safe),
never deleted or overwritten.

## Relationship to Iteration 0

Iteration 0 (ADR + `.chaos/interactions/**`) is the authoritative source of
truth. This package implements the runtime store described there and validates
against those schemas. No Iteration 0 artifact is modified by this package.

## Non-goals (explicitly out of scope for Iteration 1)

- No MCP server (Iteration 2).
- No VS Code Decision Center / UI (Iteration 3).
- No live auto-resume runner (Iteration 5).
- No `chaos:resume` command (Iteration 4).
- No command-contract rewrites or hook enforcement.
- No `chaos:delete` / discard workflow.
- No production application changes.

## Next iteration

**Iteration 2 — MCP runtime server (implemented).** The MCP tools
(`chaos_begin_command`, `chaos_create_decision`, `chaos_get_decision_response`,
`chaos_complete_command`, …) map 1:1 onto the operations in this package; the
store implemented here is the backing state for those tools. See the adapter
package at [`tools/chaos-interaction-mcp`](../chaos-interaction-mcp/README.md).
