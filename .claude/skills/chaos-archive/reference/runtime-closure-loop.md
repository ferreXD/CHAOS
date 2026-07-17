# Runtime Closure Loop

`chaos:archive` must resolve closure issues interactively where possible.

Open questions are a fallback, not the default.

## Loop

```text
Detect closure issue
Classify severity and fixability
Recommend action
Ask user one question
Record answer as runtime closure decision
Apply safe governance/reporting amendment if confirmed
Re-evaluate archive readiness
Continue or stop
```

## Fixability classes

```text
FIXABLE_NOW
NEEDS_USER_DECISION
NEEDS_VERIFY
NEEDS_APPLY
NEEDS_OPENSPEC_ARCHIVE
NEEDS_SYNC
NEEDS_RETRO
NEEDS_ADR_OR_DECISION_LOG
NEEDS_FOLLOW_UP_CHANGE
NOT_FIXABLE_IN_ARCHIVE
```

## Safe fixes inside archive

Allowed with confirmation:

```text
classify decision events
record waiver/debt routing
record retro trigger rationale
record sync action
write archive report
run OpenSpec archive
```

Not allowed:

```text
edit production code
edit tests
edit migrations
edit ADRs
edit architecture.md
edit rules/index.md
edit decisions/index.md
silently rewrite verification/apply/review reports
```

## Prompt format

```markdown
### Closure Issue <ID>

Issue: <description>
Severity: <BLOCKING|MAJOR|MINOR|ADVISORY>
Knowledge type: <FACT|INFERENCE|ASSUMPTION|UNKNOWN|CONFLICT>
Confidence: <HIGH|MEDIUM|LOW>
Fixability: <class>
Why it matters: <impact>
Suggested action: <recommendation>

Options:
1. Accept suggested action
2. Provide custom action/rationale
3. Defer with rationale
4. Archive with debt
5. Stop archive
```

## Mode-specific prompt budget

```text
--light     ask only high-impact closure questions
--standard  ask all material closure questions
--strict    ask all blocking/material questions and block if unresolved
```
