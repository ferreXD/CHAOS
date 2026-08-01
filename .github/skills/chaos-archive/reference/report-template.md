# CHAOS Archive Report — <change-id>

## 1. Archive Dashboard

| Field | Value |
|---|---|
| Change | `<change-id>` |
| Mode | `<light|standard|strict>` |
| Flags | `<flags>` |
| Verification verdict | `<verdict>` |
| OpenSpec validation | `<Passed|Failed|Skipped|Unknown>` |
| Tasks complete | `<Yes|No|Partial|Unknown>` |
| Decision events | `<N enumerated / N classified (must balance), M unclassified, K sync-required>` |
| Waivers | `<N>` |
| Accepted risks | `<N>` |
| Spec sync required | `<Yes|No|Unknown>` |
| Archive readiness | `<Ready|Ready with debt|Not ready>` |
| Recommended outcome | `<outcome>` |
| Lifecycle completeness | `<percentage or qualitative state>` |

## 2. Invocation and Mode

Command:

```text
chaos:archive <change-id> <flags>
```

Mode selection:

```text
Explicit or inferred: <value>
Rationale: <reason>
```

## 3. Source Manifest

| Source | Status | Notes |
|---|---|---|
| `openspec/changes/<change-id>/proposal.md` | `<found/missing>` | |
| `openspec/changes/<change-id>/design.md` | `<found/missing/not-required>` | |
| `openspec/changes/<change-id>/specs/` | `<found/missing/not-required>` | |
| `openspec/changes/<change-id>/tasks.md` | `<found/missing>` | |
| `.chaos/changes/<change-id>/change.md` | `<found/missing>` | current model, any mode: §Review/§Delivery/§Verification |
| `.chaos/changes/<change-id>/lifecycle.md` | `<found/missing>` | |
| `.chaos/changes/<change-id>/decision-events.md` | `<found/missing>` | |
| `.chaos/changes/<change-id>/verification.md` | `<found/missing/legacy-only>` | legacy changes only (absent by design when `change.md` present); fallback: `.chaos/verification/<change-id>-verification.md` |
| `.chaos/changes/<change-id>/apply-report.md` | `<found/missing/legacy-only>` | legacy changes only (absent by design when `change.md` present); fallback: `.chaos/apply-reports/<change-id>-apply-report.md` |
| `.chaos/changes/<change-id>/proposal-review.md` | `<found/missing/legacy-only>` | legacy changes only (absent by design when `change.md` present); fallback: `.chaos/reviews/<change-id>-proposal-review.md` |

## 4. Pre-Archive Checks

| Check | Result | Severity | Confidence | Notes |
|---|---|---|---|---|
| OpenSpec change exists | | | | |
| Toolchain available | | | | |
| Verification evidence present (`change.md` §Delivery/§Verification, or legacy `verification.md`) | | | | |
| Tasks complete/waived | | | | |
| Decision events classified | | | | |

## 5. Verification Gate Summary

Verdict consumed from `change.md` §Delivery/§Verification (any mode) or, on legacy changes
without `change.md`, the `chaos:verify` report:

```text
<summary>
```

Open conditions:

```text
<conditions>
```

## 6. OpenSpec Archive Execution Plan

Planned actions:

```text
1. <action>
2. <action>
```

Dry-run:

```text
<YES|NO>
```

## 7. OpenSpec Archive Execution Result

Archive operation executed:

```text
<YES|NO>
```

Command/workflow used:

```text
<command or host workflow>
```

Result:

```text
<summary>
```

## 8. Source-of-Truth Update Confirmation

| Confirmation | Result | Evidence |
|---|---|---|
| Active change removed | | |
| Archived change found | | |
| Base specs updated | | |
| OpenSpec status confirms closure | | |
| CHAOS report written | | |

## 9. Task Closure Summary

| Task | Status | Evidence | Closure |
|---|---|---|---|

## 10. Decision Event Closure Audit

Reconciliation: `<N enumerated (§2 scan rule) / N classified>` — the two numbers MUST balance.

| ID | Source | Type | Closure Status | Sync Action | Retro Topic | Confidence |
|---|---|---|---|---|---|---|

One row per enumerated decision entry (§2 scan rule, `chaos-shared/reference/change-template.md`) —
entries matching no closure bucket are rowed as `UNCLASSIFIED`, never omitted. `UNCLASSIFIED: none`
may only be claimed when the reconciliation line balances.

## 11. Waiver / Accepted Risk Ledger

| ID | Source | Reason | Impact | Archive Impact | Follow-up Route |
|---|---|---|---|---|---|

## 12. Debt and Follow-Up Routing

| Debt / Follow-up | Classification | Route | Owner/Next Step |
|---|---|---|---|

## 13. Sync Impact Preview

```text
<sync actions>
```

Recommended next command:

```text
chaos:sync
```

## 14. Retro Trigger Analysis

Retro recommended:

```text
<YES|NO>
```

Reasons:

```text
<reasons>
```

Recommended next command:

```text
chaos:retro <change-id>
```

## 15. Runtime Closure Decisions

## ARC-DEC-<nnn> — <title>

<!-- H2 + <nnn> is the canonical decision-entry shape (§2 scan rule,
     chaos-shared/reference/change-template.md); keep it when mirroring into decision-events.md. -->

Command: chaos:archive  
Change ID: `<change-id>`  
Type: `<decision type>`  
Status: `<accepted/deferred/waived>`  
Confidence: `<HIGH|MEDIUM|LOW>`  

Decision:

```text
<decision>
```

Rationale:

```text
<rationale>
```

Sync action:

```text
<action>
```

## 16. Archive Verdict

Verdict: `<ARCHIVED|ARCHIVED_WITH_DEBT|ARCHIVED_UNDER_GOVERNANCE_OVERRIDE|ARCHIVED_BUT_UNCONFIRMED|BLOCKED|NOT_READY|NEEDS_SYNC|NEEDS_RETRO|NEEDS_FOLLOW_UP_CHANGE|ARCHIVE_FAILED|DRY_RUN_READY|DRY_RUN_NOT_READY>`  
Confidence: `<HIGH|MEDIUM|LOW>`  
Archive readiness: `<READY|READY_WITH_DEBT|NOT_READY>`  
Evidence coverage: `<COMPLETE|PARTIAL|WEAK>`  
Debt load: `<LOW|MEDIUM|HIGH>`  
Sync load: `<LOW|MEDIUM|HIGH>`  
Retro recommended: `<YES|NO>`  

Reason:

```text
<reason>
```

## 17. Closure Summary

Can this change be considered closed?

```text
<yes/no/with-debt>
```

What happened:

```text
<summary>
```

What must happen next:

```text
<actions>
```

Recommended next command:

```text
<command>
```
