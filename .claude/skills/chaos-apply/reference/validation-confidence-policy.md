# Validation and Confidence Policy

`chaos:apply` is not the final verification command. That is `chaos:verify`.

However, `chaos:apply` must record validation evidence and confidence signals.

## Validation candidates

Detect and offer relevant commands:

```text
openspec validate <change-id> --strict
dotnet build
dotnet test
dotnet test <specific test project>
npm test / pnpm test / yarn test, if relevant
```

Do not blindly run expensive, flaky, destructive, or environment-dependent validation without asking.

## Required UX

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

## Confidence caps

- OpenSpec validation failed -> result cannot be `APPLIED`; use `VALIDATION_FAILED` or `BLOCKED`.
- OpenSpec validation skipped -> validation evidence max `PARTIAL`.
- Build skipped -> execution confidence max `MEDIUM`.
- Behavioural tests skipped -> execution confidence max `MEDIUM`, or `LOW` for high-risk behaviour.
- No tests added/updated for behavioural change -> assumption load at least `MEDIUM`.
- External side-effect change without integration/idempotency evidence -> execution confidence max `MEDIUM`.
- Strict mode without validation attempt -> result should be `BLOCKED` unless explicit waiver.

## Evidence levels

Validation evidence:

- `COMPLETE`: OpenSpec validation plus relevant build/tests succeeded or explicitly evidenced.
- `PARTIAL`: some validation ran or validation skipped with bounded rationale.
- `MISSING`: no meaningful validation evidence.

Execution confidence:

- `HIGH`: scoped tasks completed, validation evidence complete, no unresolved major assumptions.
- `MEDIUM`: tasks completed/mostly completed but validation or evidence is partial.
- `LOW`: implementation relies on unresolved assumptions, validation missing, or scope uncertainty remains.
