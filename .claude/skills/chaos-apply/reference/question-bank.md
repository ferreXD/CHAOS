# `chaos:apply` Question Bank

Use questions sparingly and only when needed. Ask one decision at a time when possible.

## Mode inference

```text
Mode inferred: --strict

Reason:
- The change touches persistence.
- The change affects an API contract.
- The review has major findings.

Options:
1. Continue with --strict
2. Downgrade to --standard and record rationale
3. Cancel
```

## Proposal not ready but not blocked

```text
The proposal is not fully ready for approval, but no direct blocker was found.

Missing decisions/gaps:
- <gap>

Options:
1. Continue and record accepted risk
2. Provide missing context now
3. Defer the gap and limit implementation scope
4. Stop and revise proposal/review
```

## Missing implementation decision

```text
Missing Decision <id>:
<question>

Recommended: <recommendation>
Confidence: <HIGH|MEDIUM|LOW>
Why: <rationale>

Choose:
1. <option A>
2. <option B>
3. Defer
4. Stop
5. Provide custom answer
```

## Discovered amendment

```text
Implementation discovered a required change not explicitly captured in OpenSpec tasks.

Discovered change: <description>
Classification: <classification>
Recommended action: <action>
Confidence: <confidence>

Options:
1. Add directly and record decision event
2. Amend OpenSpec tasks/spec first, then continue
3. Defer and limit implementation scope
4. Accept risk and continue
5. Stop
6. Provide custom instruction
```

## Validation prompt

```text
Implementation step completed.

Detected validation commands:
1. openspec validate <change-id> --strict
2. dotnet build <solution>
3. dotnet test <test-project>

Choose:
1. Run all recommended validation
2. Choose commands one by one
3. Skip with rationale
```

## C# Expert missing

```text
C#/.NET project detected, but .github/agents/CSharpExpert.agent.md was not found.

Options:
1. Continue with generic Copilot agent and record lower specialist confidence
2. Install CSharpExpert from Awesome Copilot, then continue
3. Stop
```
