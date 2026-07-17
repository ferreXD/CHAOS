# Verification Contract

## Definition

`chaos:verify` is the post-implementation confidence/archive-readiness gate.

It checks whether the implementation produced by `chaos:apply` satisfies the approved OpenSpec change and CHAOS governance requirements.

## It verifies

- OpenSpec structural validity;
- task completion integrity;
- spec-to-implementation traceability;
- implementation evidence;
- test/build evidence;
- ADR/rule/decision alignment;
- scope drift;
- decision-event completeness;
- archive readiness.

## It does not

- design the solution;
- approve the proposal before implementation;
- implement missing production code;
- silently mutate OpenSpec or CHAOS governance files;
- replace `chaos:sync` or ADR generation.

## Required output

v0 change-scoped layout (legacy `.chaos/verification/<change-id>-verification.md`
read-only for compatibility; do not migrate):

```text
.chaos/changes/<change-id>/verification.md
```

Reads change-folder inputs when present: `.chaos/changes/<change-id>/lifecycle.md`,
`apply-report.md`, `proposal-review.md`, `decision-events.md`, `waivers.md`.
Canonical layout: `.chaos/changes/README.md`.

## Required final sections

- Verification Dashboard
- Scope and Inputs
- Toolchain and Validation Evidence
- Source Manifest
- OpenSpec Validation
- Task Completion Integrity
- Spec Traceability Matrix
- Implementation Inspection
- Scope Drift Analysis
- Decision Event Audit
- Test/Build Evidence
- Findings Register
- Runtime Remediation Log
- Waiver / Accepted Risk Ledger
- Confidence Caps Applied
- Archive Readiness
- Final Verdict
- Closure Summary
