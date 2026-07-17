# Runtime Decision Loop

`chaos:propose` must actively resolve material uncertainty with the user at command runtime whenever possible.

Open questions are a fallback, not the default output.

## Purpose

The command should not dump unresolved questions into the proposal when those questions can be answered by the user during the command run.

Instead, it must:

1. Detect missing context or missing decisions.
2. Determine whether the missing information materially affects the proposal.
3. Ask focused questions one by one.
4. Offer a recommended answer when evidence supports one.
5. Record the user's answer as a Decision Event.
6. Use the answer to generate or amend the OpenSpec proposal.
7. Leave only deferred, externally blocked, or genuinely unresolved items as open questions.

## Runtime decision types

Use these types when prompting the user:

| Type | Meaning | Typical outcome |
|---|---|---|
| `SCOPE_DECISION` | Determines what is included/excluded from the proposal. | Amend proposal scope/non-goals. |
| `SPEC_AMENDMENT` | Affects OpenSpec specs or observable behaviour. | Amend specs or record pending amendment. |
| `DESIGN_DECISION` | Selects an implementation/design direction inside current architecture. | Amend design.md or proposal rationale. |
| `TASK_AMENDMENT` | Affects OpenSpec tasks.md. | Add/update tasks. |
| `EVIDENCE_WAIVER` | User chooses to proceed despite missing evidence. | Record confidence reduction and waiver. |
| `RISK_ACCEPTANCE` | User accepts known risk. | Record accepted risk and sync action. |
| `ARCHITECTURAL_DECISION_CANDIDATE` | May require ADR or decision log later. | Record for `chaos:sync`. |
| `DEFERRED_DECISION` | User defers a decision. | Record open question with owner/reason. |

## Required prompt shape

Ask one decision at a time.

```text
Decision needed: <short title>

Why this matters:
<explain impact on scope, design, risk, confidence, or OpenSpec artefacts>

Current evidence:
- <source/fact/inference>

Recommended option:
<option, if evidence supports one>
Confidence: HIGH | MEDIUM | LOW

Options:
1. Accept recommended option
2. Choose alternative: <alternative A>
3. Choose alternative: <alternative B>
4. Defer with rationale
5. Mark accepted risk and continue
6. Provide custom answer
7. Stop
```

## Question budget by mode

| Mode | Runtime question behaviour |
|---|---|
| `--light` | Ask at most 3 high-impact questions unless safety/risk requires escalation. Record remaining low-impact items as assumptions or deferred questions. |
| `--standard` | Ask all material questions that affect scope, approach, OpenSpec artefacts, confidence, or implementation readiness. |
| `--strict` | Ask every question required for approval-readiness. Blocking/material questions cannot remain unresolved unless the final status is not ready. |

## What becomes an open question

Only record an open question when:

- the user explicitly defers it;
- it requires external evidence or archaeology;
- it depends on another team/system;
- the command is running non-interactively;
- it is outside current proposal scope;
- resolving it would require a new ADR or governance decision that the user does not want to make now.

## Anti-patterns

Forbidden:

```text
There are several open questions:
- What persistence strategy should be used?
- What tests are needed?
- Is this in scope?
```

Better:

```text
Decision needed: persistence strategy
Recommended: module-owned table
Confidence: MEDIUM
Options: ...
```

## Required confidence effect

If the user defers a material decision, the command must downgrade or cap confidence.

Examples:

- Missing persistence strategy for a data change: max confidence `MEDIUM`.
- Missing legacy behaviour evidence for brownfield strict proposal: status cannot be ready unless waived and confidence is downgraded.
- Missing test strategy for behavioural change: confidence capped at `MEDIUM` until tasks/specs are amended.
