# Question Bank

Use these prompts when runtime decisions are needed.

## Mode inference

```text
Mode inferred: <mode>
Reason:
- <reason>

Options:
1. Continue with inferred mode
2. Choose --light
3. Choose --standard
4. Choose --strict
5. Stop
```

## Missing validation

```text
Validation evidence is incomplete.
Detected commands:
1. <command>
2. <command>

Options:
1. Run all recommended
2. Choose specific commands
3. Provide custom command
4. Skip with rationale
```

## Missing decision event

```text
A material implementation decision appears to be missing from the decision event register.

Detected change:
<description>

Suggested decision event:
<summary>

Options:
1. Record verification-time decision event now
2. Provide custom rationale
3. Defer to chaos:sync with rationale
4. Mark accepted risk
5. Leave blocked
```

## Scope drift

```text
Potential scope drift detected:
<description>

Options:
1. Record as bounded/accepted drift
2. Route to chaos:apply --continue
3. Amend OpenSpec before continuing
4. Defer with rationale
5. Leave blocked
```

## Archive readiness

```text
Archive readiness is <status>.

Required before archive:
- <item>

Options:
1. Continue to chaos:archive
2. Archive with debt rationale
3. Fix first using chaos:apply --continue
4. Run chaos:sync
5. Stop
```
