# Scope Drift Policy

## Compare

`chaos:verify` must compare:

- OpenSpec proposal/design/spec/tasks;
- chaos:review findings;
- chaos:apply report;
- actual git diff / changed files;
- decision events.

## Drift categories

```text
NO_DRIFT
BOUNDED_DRIFT
RECORDED_DRIFT
UNRECORDED_DRIFT
SCOPE_DRIFT_BLOCKER
```

## Detect drift

Look for:

- files changed outside expected scope;
- new dependencies/packages;
- new tables/migrations;
- new external calls;
- new auth/security behaviour;
- new public API contracts;
- unrelated module changes;
- test deletions;
- governance file mutation;
- changes not mapped to OpenSpec tasks.

## Mode behaviour

- Light: warn and record confidence cap.
- Standard: prompt user to record/accept/defer if non-blocking; block on major unrecorded drift.
- Strict: block on unrecorded material drift.

## Finding template

```md
### VFY-XXX — <drift title>

Severity: MAJOR
Knowledge type: FACT
Confidence: HIGH
Fixability: NEEDS_USER_DECISION

Finding:
<what drift was found>

Impact:
<why it matters>

Required action:
<record decision / amend OpenSpec / rerun apply / stop>
```
