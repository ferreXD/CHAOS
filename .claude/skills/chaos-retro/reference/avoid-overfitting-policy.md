# Avoid-Overfitting Policy

`chaos:retro` must avoid creating global bureaucracy from one weird case.

## Lesson classifications

```text
ONE_OFF_LESSON
REPEATED_PATTERN
GLOBAL_RULE_CANDIDATE
GATE_CANDIDATE
PROMPT_TUNING
NO_ACTION
```

## Guidance

Use `ONE_OFF_LESSON` when:

- The event was unusual.
- The cost of adding a rule/gate is higher than the expected future value.
- There is no evidence the issue will repeat.

Use `PROMPT_TUNING` when:

- Better questions would have avoided friction.
- The issue is command UX rather than governance.

Use `GATE_CANDIDATE` when:

- The issue is serious and preventable before moving phases.

Use `GLOBAL_RULE_CANDIDATE` when:

- The lesson is architectural or broadly applicable.
- It affects multiple commands or future changes.

Use `REPEATED_PATTERN` when:

- Similar issues appear across multiple reports or previous retros.

## Hard rule

```text
Not every lesson becomes a rule.
```
