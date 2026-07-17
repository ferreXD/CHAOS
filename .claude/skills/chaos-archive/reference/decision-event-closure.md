# Decision Event Closure Audit

`chaos:archive` must collect and classify decision events from all previous lifecycle commands.

## Sources

Scan:

```text
.chaos/changes/<change-id>/decision-events.md
.chaos/changes/<change-id>/proposal-review.md
.chaos/changes/<change-id>/apply-report.md
.chaos/changes/<change-id>/verification.md
.chaos/changes/<change-id>/waivers.md
openspec/changes/<change-id>/**
```

Legacy fallbacks (read-only for compatibility): `.chaos/proposals/**`,
`.chaos/reviews/<change-id>-proposal-review.md`,
`.chaos/apply-reports/<change-id>-apply-report.md`,
`.chaos/verification/<change-id>-verification.md`.

Decision IDs may include:

```text
PROP-DEC-*
REV-DEC-*
APP-DEC-*
VFY-DEC-*
```

## Required closure statuses

Each material decision must be classified as one of:

```text
CLOSED
SYNC_REQUIRED
ADR_REQUIRED
DECISION_LOG_REQUIRED
RULE_UPDATE_REQUIRED
OPENSPEC_AMENDED
DEFERRED_WITH_RATIONALE
ACCEPTED_RISK
RETRO_REQUIRED
FOLLOW_UP_CHANGE_REQUIRED
UNCLASSIFIED
```

## Mode behavior

```text
--light
  Warn on unclassified material decisions and ask whether to archive with debt.

--standard
  Require material decisions to be classified or explicitly deferred.

--strict
  Block on unclassified material decisions.
```

## Runtime classification prompt

Ask one decision at a time:

```text
Decision event APP-DEC-003 has no closure classification.

Detected type: SPEC_AMENDMENT
Suggested closure: DECISION_LOG_REQUIRED
Confidence: MEDIUM
Reason: implementation added a persistence table not represented as an accepted global pattern.

Options:
1. Accept suggested classification
2. Mark ADR_REQUIRED
3. Mark RULE_UPDATE_REQUIRED
4. Mark CLOSED
5. Defer with rationale
6. Stop archive
```

## Sync handoff

Every decision with any of these statuses must be routed to `chaos:sync`:

```text
SYNC_REQUIRED
ADR_REQUIRED
DECISION_LOG_REQUIRED
RULE_UPDATE_REQUIRED
OPENSPEC_AMENDED
DEFERRED_WITH_RATIONALE
ACCEPTED_RISK
```

## Archive report matrix

Include:

```markdown
| ID | Source | Type | Closure Status | Sync Action | Retro Topic | Confidence |
|---|---|---|---|---|---|---|
```
