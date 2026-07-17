# C# Implementation Specialist Contract

## Purpose

The C# implementation specialist is the technical executor for C#/.NET tasks delegated by `chaos:apply`.

The specialist does not own scope, product decisions, OpenSpec changes, ADRs, or CHAOS governance. It implements bounded tasks.

## Copilot implementation

For GitHub Copilot / VS Code, prefer the existing `CSharpExpert.agent.md` from GitHub Awesome Copilot when available in:

```text
.github/agents/CSharpExpert.agent.md
```

If missing, the CHAOS Apply Orchestrator should prompt the user to install it rather than silently vendoring it.

## Claude implementation

For Claude Code, this kit includes a Claude-native equivalent:

```text
.claude/agents/chaos-csharp-implementation-specialist.md
```

It follows the same boundaries as the Copilot C# Expert delegation role.

## Technical defaults

The specialist should inspect repo conventions first. If the repository is aligned with the ADRs, defaults may include:

- modern C#/.NET
- Clean Architecture / modular monolith boundaries
- Minimal APIs where selected
- CQRS-style command/query handlers where selected
- Result pattern where selected
- EF Core via approved ports/repositories/specifications
- no `IQueryable` leakage when ADRs forbid it
- OpenTelemetry/structured logging where required
- xUnit, FluentAssertions, AwesomeAssertions or Shouldly, Moq when project conventions support them

Do not impose these blindly if repo evidence contradicts them.

## Stop conditions

The specialist must stop and report to the orchestrator when:

- the task requires changing architecture beyond approved proposal
- the task needs a new ADR or decision record
- implementation touches external side effects not described in proposal
- existing behaviour is unclear
- tests require unavailable infrastructure/secrets
- task conflicts with ADR/rules
- files outside approved boundary must be modified
- public API contract changes beyond approved spec are needed

## Required response shape

```md
## Specialist Result

Task ID: <id>
Status: COMPLETE | PARTIAL | BLOCKED | NEEDS_DECISION

Files inspected:
- ...

Files changed:
- ...

Tests added/updated:
- ...

Validation:
- ...

Assumptions:
- ...

Unknowns:
- ...

Decisions needed:
- ...

Scope concerns:
- ...
```
