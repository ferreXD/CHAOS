# AGENTS.md — Task Tracker API

Agent-facing entrypoint. This repository is the demo subject for **CHAOS**: humans answer
the material decisions, agents do the work, and every change leaves a record. Read this
before editing anything.

## The subject

The **Task Tracker API** (.NET / ASP.NET Core Minimal API, `net8.0`) under
`src/TaskTracker.Api/`, with tests in `tests/TaskTracker.Tests/`. That is the whole
codebase — the CHAOS machinery is not vendored here; it arrives as a Claude Code plugin.

## Start here

| Read | For |
|---|---|
| [`.chaos/context.md`](.chaos/context.md) | project reality, domain, flows, constraints |
| [`.chaos/architecture.md`](.chaos/architecture.md) | technical posture, boundaries, testing |
| [`.chaos/decisions/index.md`](.chaos/decisions/index.md) | what was decided, and why |
| [`docs/adr/`](docs/adr/) | accepted postures a change may not silently cross |

## Minimum pre-edit behavior

1. **Stop before code.** Every non-trivial change goes through `chaos:run`: read the
   terrain, fold every open question, doubt, and crossing into **one** decision, and wait
   for the human. Never settle a material decision in chat on your own.
2. **Respect the recorded postures.** `.chaos/architecture.md` and `docs/adr/` say what
   must be true. Contradicting one is a *crossing*: surface it at the stop with real
   alternatives, and if the human approves it, amend the crossed record in the same change.
3. **Keep the baseline green.** `dotnet build TaskTracker.sln` and
   `dotnet test TaskTracker.sln` must pass. Paste real results — never tick what you did
   not run; record what you could not verify as a limit with its reason.
4. **Keep the domain→HTTP boundary.** Domain types stay in `Domain/`; HTTP shapes stay in
   `Contracts/`; endpoints translate between them.
5. **Leave the record.** One page per change under `.chaos/decisions/`, plus a line in
   its index. That record is the asset — it is what lets a future stop catch a change that
   contradicts this one.

## Conventions worth knowing before you propose anything

- `TaskState` is the task status type's name (not `TaskStatus`, which collides with the
  BCL type). Keep it.
- Filter values are parsed **case-insensitively**, and an unrecognized value is a
  **400** — never a silent ignore, never an empty list. This was a recorded human
  decision; see [`.chaos/decisions/index.md`](.chaos/decisions/index.md).
- Spec gate: an estimated ≥5 files or ≥250 LOC, or any crossing, owes an OpenSpec change
  under `openspec/changes/<id>/`. Smaller work is optional and the human can flip it at
  the stop.

## Protected files

`AGENTS.md` and root `README.md` are protected: propose a patch with a preview and get
explicit confirmation; never edit them silently.
