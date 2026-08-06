---
chaosMetadata:
  schemaVersion: 1
  artifactType: runtime-contract
  artifactScope: repository
  changeId: null
  sourceCommand: iteration-0-design
  lastWrittenAt: "2026-07-06T17:30:00+02:00"
  lastWrittenBy: "chaos-iteration-0"
  lastAuditedAt: "2026-07-06T17:30:00+02:00"
  lastAuditedBy: "chaos-iteration-0"
  repositoryContext:
    provider: unknown
    branch: unknown
    reviewRequest: null
    contextSource: generated-artifact
    confidence: LOW
  metadata:
    identitySource: generated-artifact
    timestampSource: local-system
    confidence: MEDIUM
---

# CHAOS Interaction Runtime

This folder defines Iteration 0 of the CHAOS Interaction Runtime: the file-backed contracts for material human decisions, command sessions, locks, responses, audit events, and resume capsules.

The runtime exists to remove ambiguity from human decision points.

```text
Human decisions are not chat messages; they are runtime state.
```

## Design goals

- Make material decisions durable and inspectable.
- Allow long CHAOS runs to pause and resume safely.
- Support live auto-resume only when a runner is active.
- Support explicit `chaos:resume` from any chat/thread when a session is no longer live.
- Block conflicting commands over the same `changeId` while a decision is pending.
- Keep Claude-native as the reference workflow while allowing Copilot to consume the same runtime.
- Preserve a file-backed audit trail.

## Runtime path

```text
.chaos/interactions/
  active.json
  index.json
  locks.json
  audit.jsonl
  sessions/
  decisions/
  capsules/
  schema/
```

## Source of truth

The source of truth is the file-backed interaction state, not the chat transcript.

A model may summarize or explain state, but it must not invent state. Commands must read the runtime when available.

## Main concepts

| Concept | Meaning |
|---|---|
| `changeId` | The CHAOS change being worked on. |
| `commandRunId` | One concrete execution of a CHAOS command. |
| `decisionId` | One concrete material human decision. |
| session | The runtime record of a command execution. |
| lock | A change-level guard that prevents conflicting commands from advancing while a decision is pending. |
| resume capsule | Minimal structured context needed to resume without relying on chat memory. |
| Decision Center | VS Code UI for answering and inspecting decisions. |
| MCP runtime | Agent/tool API for creating decisions, reading responses, and managing sessions. |

## Contract files

| File | Purpose |
|---|---|
| `contracts/interaction-runtime-contract.md` | Overall runtime principles and write boundaries. |
| `contracts/state-machine-contract.md` | Session and decision state machines. |
| `contracts/session-locking-policy.md` | Same-change locking and compatibility rules. |
| `contracts/resume-capsule-contract.md` | Cross-thread resume semantics. |
| `contracts/decision-center-ui-contract.md` | VS Code Decision Center UX contract. |
| `contracts/mcp-tool-contract.md` | MCP tool surface and response statuses. |
| `contracts/auto-resume-policy.md` | Live auto-resume vs explicit resume rules. |
| `contracts/runner-lease-contract.md` | Live-runner liveness lease (Iteration 5). |

## JSON schemas

Schemas live under `schema/` and define the runtime's durable JSON artifacts.

They are intended for:

- runtime implementation validation.
- doctor/status diagnostics.
- integration tests.
- extension and MCP server contract alignment.

## Non-goals for Iteration 0

- No VS Code extension implementation.
- No MCP server implementation.
- No `chaos:resume` command implementation.
- No command contract rewrites.
- No auto-resume runner implementation.
- No `chaos:delete` or discard workflow.
- No GitHub/Azure work item integration.

## Implementation status (non-normative pointer)

These contracts and schemas are the source of truth for the state in this folder. The
implementations are **not** in this repository — they install with the CHAOS toolkit:

- **Decision runtime + stdio MCP server** — the npm package
  [`@ferrexd-chaos/interaction-mcp`](https://www.npmjs.com/package/@ferrexd-chaos/interaction-mcp),
  launched via `npx` by the CHAOS Claude Code plugin. It owns the file-backed store here:
  sessions, decisions, responses, locks, and resume capsules.
- **Decision Center** — the VS Code extension (publisher `ferreXD`), the human-facing UI
  over this same state.
- **Commands** — `chaos:run` creates its pre-code decision through the runtime and stops
  on `mustStop`; `chaos:resume` continues from the capsule and the answered decision,
  never from chat memory.

Schemas under `schema/` are seeded by the MCP server on first use and are yours to keep;
runtime state files are gitignored.

This subsection is an additive pointer only; the contracts above are unchanged.
