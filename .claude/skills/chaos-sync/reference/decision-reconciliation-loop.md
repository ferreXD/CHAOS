# Decision Reconciliation Loop

Each material decision is reconciled one by one.

## Prompt shape

```md
## Decision <i>/<n> — <decision-id>

Source: <command/report>
Type: <decision type>
Knowledge type: <FACT|INFERENCE|ASSUMPTION|UNKNOWN|CONFLICT>
Confidence: <HIGH|MEDIUM|LOW>

Decision:
<decision text>

Why it matters:
<impact>

Recommended action:
<recommended promotion/action>

Options:
1. Accept recommended action
2. Promote to ADR
3. Create lightweight decision log
4. Create/update rule
5. Create/update gate
6. Mark closed; no governance artifact needed
7. Defer with rationale
8. Provide custom action
9. Stop sync
```

## Rule

Open questions are fallback only. Ask the user to decide at runtime whenever possible.

## Decision output

Every reconciled decision must be recorded in the sync report and, if needed, in generated artifacts with provenance.

## Protected documentation decisions

Protected documentation issues are reconciled one by one, just like decision events.

Prompt shape:

```text
Protected doc issue <i>/<n>: <title>
File: AGENTS.md | AGENT.md | README.md
Drift type: <type>
Recommended action: patch | rewrite | defer
Why it matters: <impact>

Options:
1. Apply recommended patch
2. Rewrite file from current CHAOS indexes
3. Show/edit custom patch
4. Defer with rationale
5. Mark accepted drift
6. Stop sync
```
