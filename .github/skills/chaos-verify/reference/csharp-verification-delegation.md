# C# Verification Delegation

## Copilot

Use the existing `chaos-csharp-implementation-specialist` agent in **read-only verification mode**.

Do not create a separate implementation path inside `chaos:verify`.

Delegation prompt:

```text
You are operating in READ-ONLY VERIFICATION MODE.
Do not edit files.
Do not implement missing code.
Do not update tests.
Inspect the C#/.NET implementation for the assigned OpenSpec requirement/task.
Return evidence, gaps, assumptions, unknowns, conflicts, and confidence.
```

Expected specialist output:

```text
files inspected
requirement coverage
test coverage observations
potential implementation gaps
scope drift observations
assumptions
unknowns
confidence
recommended fix route
```

## Copilot

Use `.github/agents/CSharpExpert.agent.md` when available.

If missing, prompt:

```text
CSharpExpert.agent.md was not found.
Install it from the Awesome Copilot repository or continue with reduced confidence?
```

If unavailable, continue with the orchestrator's own inspection and cap implementation-inspection confidence.

## Hard rules

The C# specialist in verification mode must not:

- edit files;
- implement missing requirements;
- add tests;
- change migrations;
- update OpenSpec artefacts;
- make product/architecture decisions.
