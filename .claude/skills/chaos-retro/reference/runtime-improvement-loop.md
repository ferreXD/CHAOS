# Runtime Improvement Loop

`chaos:retro` must guide improvement decisions one by one.

## Loop

```text
Detect learning signal
Classify impact
Recommend improvement
Ask user one decision at a time
Record the decision
Add to retro action register if accepted
Mark as deferred/no-action with rationale if declined
Continue
```

## Prompt shape

```markdown
## Improvement <n>/<total> — <title>

Signal:
<evidence-backed signal>

Why it matters:
<impact>

Recommended improvement:
<recommended action>

Overfitting classification:
<ONE_OFF_LESSON | REPEATED_PATTERN | GLOBAL_RULE_CANDIDATE | GATE_CANDIDATE | PROMPT_TUNING | NO_ACTION>

Options:
1. Accept recommended improvement
2. Change improvement type
3. Record as retro note only
4. Defer with rationale
5. Mark no action with rationale
6. Stop retro
```

## Report every decision

Retro decisions must be recorded as:

```text
RETRO-DEC-001
RETRO-DEC-002
...
```
