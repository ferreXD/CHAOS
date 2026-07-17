# `chaos:propose` Output Contract

## Required outputs

When successful and OpenSpec is available:

```text
openspec/changes/<change-id>/...
.chaos/changes/<change-id>/lifecycle.md
.chaos/changes/<change-id>/proposal-report.md
.chaos/changes/<change-id>/decision-events.md   # when PROP-DEC-* recorded
```

When OpenSpec is unavailable or the user does not authorize OpenSpec writes, the
decision-gated degraded mode may produce a CHAOS pre-proposal brief under the change folder
(derive a provisional change-id slug from the intent when OpenSpec has not minted one):

```text
.chaos/changes/<change-id>/pre-proposal-brief.md
```

### v0 layout note

Per-change artifacts — including the degraded-mode `pre-proposal-brief.md` — are written
under `.chaos/changes/<change-id>/` (see `reference/change-artifacts-layout.md` and
`.chaos/changes/README.md`). The legacy `.chaos/proposals/` folder may be READ for
compatibility but is no longer a write target; do not migrate legacy artifacts.
`chaos:propose` does not update shared governance indexes; recommended ADR/decision-log
drafts use date-prefixed, slug-based filenames.

## Open questions policy

Open questions are a fallback, not the default output.

Before writing the final report, the command must ask the user to resolve material missing context using the Runtime Decision Loop.

Only include open questions when they were:

- explicitly deferred by the user;
- impossible to answer without external evidence;
- outside current proposal scope;
- blocked by missing archaeology/source access;
- generated in non-interactive mode.

## Proposal report template

```md
# CHAOS Proposal Report — <change-id>

## Metadata

- Command: chaos:propose
- Invocation: chaos:propose "..." --standard
- Mode: light | standard | strict
- Mode source: explicit | inferred | user-overridden
- Date/time: <if available>
- Change ID: <change-id>
- OpenSpec available: yes/no/unknown
- OpenSpec validation: PASSED | FAILED | NOT_RUN | UNAVAILABLE
- Proposal status: PROPOSED_READY_FOR_REVIEW | PROPOSED_WITH_CONDITIONS | NEEDS_MORE_CONTEXT | BLOCKED_PENDING_ARCHAEOLOGY | BLOCKED_ADR_CONFLICT | BLOCKED_OPENSPEC_MISSING | CANCELLED_BY_USER

## User intent

...

## Change classification

- Type: ...
- Risk: ...
- Reasoning: ...

## Source manifest

| Source | Status | Role | Notes |
|---|---|---|---|
| `.chaos/context.md` | verified/missing/inferred | context | ... |
| `docs/adr/...` | verified/missing/inferred | decision | ... |

## Evidence assessment

### Evidence required
- ...

### Evidence found
- ...

### Evidence missing
- ...

### Impact on proposal confidence
- ...

## Runtime decision log

Summarize decisions asked and answered during command runtime.

| Decision ID | Type | Question | User answer | Status | Confidence impact |
|---|---|---|---|---|---|

## Decision Events

### PROP-DEC-001 — <short title>

Command: chaos:propose
Change ID: <change-id>
Mode: <light|standard|strict>
Type: SCOPE_DECISION | SPEC_AMENDMENT | DESIGN_DECISION | TASK_AMENDMENT | EVIDENCE_WAIVER | RISK_ACCEPTANCE | ARCHITECTURAL_DECISION_CANDIDATE | DEFERRED_DECISION
Status: ACCEPTED_DURING_PROPOSAL | DEFERRED | REJECTED | NEEDS_SYNC | NEEDS_ADR | NEEDS_DECISION_LOG | NEEDS_OPENSPEC_AMENDMENT
Knowledge type: FACT | INFERENCE | ASSUMPTION | UNKNOWN | CONFLICT
Confidence: HIGH | MEDIUM | LOW
Evidence coverage: COMPLETE | PARTIAL | WEAK
Assumption load: LOW | MEDIUM | HIGH

Decision:
...

Rationale:
...

Evidence:
- ...

Impact on proposal:
...

Sync action:
- NONE | AMEND_OPENSPEC_PROPOSAL | AMEND_OPENSPEC_DESIGN | AMEND_OPENSPEC_SPEC | AMEND_OPENSPEC_TASKS | CREATE_DECISION_LOG | CREATE_ADR | UPDATE_CHAOS_RULES | RECORD_ACCEPTED_RISK

## Approach alignment record

### Candidate approaches presented
- ...

### Recommended approach
- ...

### User response
- proceed / alternative selected / modified / cancelled / archaeology requested / context added

## OpenSpec Invocation

Required proof that the hard OpenSpec invocation gate ran (see
`reference/openspec-integration-contract.md`). Fill honestly.

Status: INVOKED / UNAVAILABLE / FAILED / DEGRADED_WITH_USER_APPROVAL

Configured OpenSpec command: <command or unknown>

Actual invocation:
<command/workflow used>

Generated/updated OpenSpec artifacts:
- <path>

Validation command: <command or not run>

Validation result:
<PASS / FAIL / NOT_RUN>

Confidence impact:
<none / capped to MEDIUM / capped to LOW>

## OpenSpec artefacts

- Change path: ...
- Proposal: ...
- Design: ...
- Specs: ...
- Tasks: ...

## ADR/rule alignment

| Constraint | Source | Alignment | Confidence |
|---|---|---|---|

## Findings

### PRP-001 — <title>

Type: FACT | INFERENCE | ASSUMPTION | UNKNOWN | CONFLICT
Confidence: HIGH | MEDIUM | LOW
Severity: BLOCKING | MAJOR | MINOR | ADVISORY
Source: ...

Finding:
...

Impact:
...

Required action:
...

## Assumption register

| ID | Assumption | Why it matters | Confidence | Required validation |
|---|---|---|---|---|

## Deferred / remaining open questions

Only include questions that remain unresolved after runtime prompts.

| ID | Question | Reason unresolved | Owner | Confidence impact | Sync action |
|---|---|---|---|---|---|

## Confidence summary

- Overall confidence: HIGH | MEDIUM | LOW
- Evidence coverage: COMPLETE | PARTIAL | WEAK
- Assumption load: LOW | MEDIUM | HIGH

## Next command

Recommended:

```text
chaos:review <change-id>
```
```
