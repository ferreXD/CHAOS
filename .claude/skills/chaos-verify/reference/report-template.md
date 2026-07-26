# `chaos:verify` Report Template (legacy fallback)

**Retired as an output for new changes — all modes.** When
`.chaos/changes/<change-id>/change.md` exists, the verification result lives on `change.md`:
verify reads §Contract + §Delivery, and standalone post-hoc verification appends a compact
`## Verification` table there instead of writing `verification.md`. Canonical format:
`chaos-shared/reference/change-template.md` (§Delivery dashboard/table shape). The appended
section:

```md
## Verification

| check | result |
|---|---|
| build | <0 warn / 0 err> |
| tests | <N/N (baseline + new)> |
| contract | <N/N statements covered> |
| rules | <R-00x ✅ · R-00y ✅> |

verdict: <VERIFIED|VERIFIED_WITH_CONDITIONS|BLOCKED|INSUFFICIENT_EVIDENCE> · confidence: <HIGH|MEDIUM|LOW> · evidence_coverage: <COMPLETE|PARTIAL|WEAK> · assumption_load: <LOW|MEDIUM|HIGH>
archive: <READY|READY_WITH_DEBT|NOT_READY> · run: <verify commandRunId> · <date>
```

Depth scales with mode (standard: short prose allowed; strict: fuller + extras, overflow →
`appendix/<section>.md`).

The template below is kept **only** as the legacy-fallback shape — the read shape for
old/archived changes' existing verification reports, and the write shape when verifying a
legacy change that has no `change.md`.

```md
# CHAOS Verification Report — <change-id>

## Verification Dashboard

| Area | Status | Confidence | Notes |
|---|---|---:|---|
| OpenSpec validation | <Passed/Failed/Skipped> | <HIGH/MEDIUM/LOW> | <notes> |
| Build | <Passed/Failed/Skipped> | <...> | <notes> |
| Tests | <Passed/Failed/Partial/Skipped> | <...> | <notes> |
| Review report | <Found/Missing> | <...> | <notes> |
| Apply report | <Found/Missing> | <...> | <notes> |
| Decision events | <Complete/Partial/Missing> | <...> | <notes> |
| Scope drift | <None/Bounded/Recorded/Unrecorded> | <...> | <notes> |
| Archive readiness | <READY/READY_WITH_DEBT/NOT_READY> | <...> | <notes> |

## Scope and Inputs

- Change ID: `<change-id>`
- Mode: `<light|standard|strict>`
- Mode source: `<explicit|inferred>`
- Verification run: `<initial|continue>`
- Dry run: `<yes|no>`

## Source Manifest

| Source | Status | Role | Notes |
|---|---|---|---|
| `openspec/changes/<change-id>/proposal.md` | Found | Source of truth |  |
| `openspec/changes/<change-id>/tasks.md` | Found | Task boundary |  |
| `.chaos/changes/<change-id>/proposal-review.md` | Found | Pre-implementation review | legacy fallback: `.chaos/reviews/<change-id>-proposal-review.md` |
| `.chaos/changes/<change-id>/apply-report.md` | Found | Implementation evidence | legacy fallback: `.chaos/apply-reports/<change-id>-apply-report.md` |

## Toolchain and Validation Evidence

| Tool/Command | Status | Output summary | Confidence impact |
|---|---|---|---|
| `git --version` |  |  |  |
| `openspec validate <change-id> --strict` |  |  |  |
| `dotnet build ...` |  |  |  |
| `dotnet test ...` |  |  |  |

## OpenSpec Validation

<summary>

## Task Completion Integrity

| Task | Declared status | Evidence found | Verification status | Confidence |
|---|---|---|---|---|

## Spec Traceability Matrix

| Requirement | Source | Implementation evidence | Test evidence | Status | Knowledge type | Confidence | Notes |
|---|---|---|---|---|---|---|---|

## Implementation Inspection

### C#/.NET Specialist Delegation

- Specialist used: `<yes/no>`
- Mode: `read-only verification`
- Confidence impact: `<...>`

### Findings from implementation inspection

<content>

## Scope Drift Analysis

| Drift item | Category | Evidence | Decision event? | Severity | Confidence |
|---|---|---|---|---|---|

## Decision Event Audit

| Decision ID | Source command | Status | Sync action | Issue | Confidence |
|---|---|---|---|---|---|

## Findings Register

### VFY-001 — <title>

Severity: `<BLOCKING|MAJOR|MINOR|ADVISORY>`  
Knowledge type: `<FACT|INFERENCE|ASSUMPTION|UNKNOWN|CONFLICT>`  
Confidence: `<HIGH|MEDIUM|LOW>`  
Fixability: `<FIXABLE_NOW|NEEDS_USER_DECISION|NEEDS_CHAOS_APPLY|...>`

Finding:
<finding>

Evidence:
- <source>

Impact:
<impact>

Required action:
<action>

Fix route:
<next command/action>

## Runtime Remediation Log

| Issue | User decision | Action taken | Remaining impact |
|---|---|---|---|

## Verification-Time Decision Events

### VFY-DEC-001 — <title>

Command: `chaos:verify`  
Change ID: `<change-id>`  
Type: `<...>`  
Status: `<...>`  
Confidence: `<...>`

Decision:
<decision>

Rationale:
<rationale>

Sync action:
<sync action>

## Waivers / Accepted Risks

### VFY-WAIVER-001 — <title>

Reason:
<reason>

Accepted by:
<user/command context>

Impact:
<confidence/archive impact>

## Confidence Caps Applied

| Cap | Reason | Resulting max confidence |
|---|---|---|

## Archive Readiness

Status: `<READY|READY_WITH_DEBT|NOT_READY>`

Blocking before archive:
- <item>

Debt allowed before archive:
- <item>

Required before `chaos:archive`:
1. <action>

## Final Verdict

Verdict: `<VERIFIED|VERIFIED_WITH_CONDITIONS|BLOCKED|...>`  
Confidence: `<HIGH|MEDIUM|LOW>`  
Evidence coverage: `<COMPLETE|PARTIAL|WEAK>`  
Assumption load: `<LOW|MEDIUM|HIGH>`  
Validation evidence: `<COMPLETE|PARTIAL|MISSING>`  
Scope drift risk: `<LOW|MEDIUM|HIGH>`  
Archive readiness: `<READY|READY_WITH_DEBT|NOT_READY>`

Reason:
<reason>

## Closure Summary

Can this change be archived?
<yes/no/yes with debt>

Why?
<short explanation>

What must happen next?
1. <action>

Recommended next command:

```text
chaos:<next-command> <change-id>
```
```
