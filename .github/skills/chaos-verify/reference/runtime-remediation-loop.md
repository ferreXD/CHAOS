# Runtime Remediation Loop

`chaos:verify` should not merely report fixable governance issues.

It must prompt the user to fix, defer, or accept risk when the issue is fixable during verification.

## Fixability types

```text
FIXABLE_NOW
NEEDS_USER_DECISION
NEEDS_CHAOS_APPLY
NEEDS_OPENSPEC_AMENDMENT
NEEDS_TEST_EXECUTION
NEEDS_ADR_OR_DECISION_LOG
NEEDS_MANUAL_FIX
NOT_FIXABLE_IN_VERIFY
```

## Prompt shape

Ask one issue at a time.

```text
Issue VFY-XXX: <title>
Severity: <severity>
Knowledge type: <type>
Confidence: <confidence>
Why it matters: <impact>
Suggested remediation: <action>

Options:
1. Apply suggested remediation now
2. Provide custom rationale/remediation
3. Defer with rationale
4. Mark accepted risk
5. Leave blocked
```

## Allowed remediation in verify

Allowed with confirmation:

- write/update the verification report;
- add verification-time decision events to the verification report;
- add an explicit amendment section to an apply report;
- correct task status metadata only if user approves;
- record waivers and accepted risks.

Not allowed:

- production-code changes;
- test implementation;
- migration/source updates;
- silent ADR/rule/decision mutation;
- unapproved OpenSpec rewrite.

## Re-check after remediation

After applying a remediation, re-read the affected artifact and update:

- finding status;
- confidence;
- archive readiness;
- final verdict.
