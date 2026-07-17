# Validation Policy

## Toolchain checks

Check one by one:

```text
git --version
node --version
npm --version
openspec --version
dotnet --version when .NET is detected
```

If missing, do not silently install. Ask the user to install or continue with confidence caps.

## Validation command picker

Detect likely commands and prompt:

```text
Detected validation commands:
1. openspec validate <change-id> --strict
2. dotnet build <solution-or-project>
3. dotnet test <solution-or-test-project>

Options:
1. Run all recommended
2. Choose specific commands
3. Provide custom command
4. Skip with rationale
```

## OpenSpec validation

OpenSpec validation is expected for standard and required for strict mode.

If validation fails:

- Light: may continue only if issue is not structural and user accepts risk.
- Standard: block unless explicitly non-structural and accepted risk is recorded.
- Strict: block.

## Build and tests

Build/test validation should be evidence-driven.

- If behaviour changed and tests were not run, cap confidence.
- If tests failed, use `VALIDATION_FAILED` unless user is in light mode and records explicit accepted risk.
- If tests require unavailable environment, record a waiver and cap confidence.

## Validation evidence section

Record:

```text
command
status: RUN | SKIPPED | FAILED | UNAVAILABLE
output summary
reason/rationale
confidence impact
```
