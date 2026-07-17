# C# Read-Only Archaeology Delegation

For C#/.NET repositories, `chaos:archaeology` may delegate code-level inspection to a C# specialist.

## Claude

Delegate to `chaos-csharp-implementation-specialist` if available.

## Copilot

Delegate to `.github/agents/CSharpExpert.agent.md` if available.

## Required delegation prompt

The delegation must include:

```text
Operate in read-only archaeology mode.
Do not edit files.
Do not propose implementation patches.
Inspect only the requested scope.
Return evidence, file list, behaviour reconstruction, tests found/missing, assumptions, unknowns, and confidence.
```

## Specialist output

The specialist must return:

- files inspected;
- entry points found;
- call flow summary;
- data access / persistence evidence;
- side-effect evidence;
- tests found/missing;
- facts, inferences, assumptions, unknowns, conflicts;
- confidence and confidence caps;
- recommended further archaeology, if any.

## Stop conditions

Stop delegation if:

- scope becomes too broad;
- required files are unavailable;
- implementation changes are needed;
- the task requires architectural decisions;
- evidence conflicts require user input.
