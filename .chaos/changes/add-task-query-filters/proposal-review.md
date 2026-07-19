---
chaosMetadata:
  schemaVersion: 1
  artifactType: proposal-review
  artifactScope: change
  changeId: add-task-query-filters
  sourceCommand: "chaos:review"
  lastWrittenAt: "2026-07-19T11:48:23+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T11:48:23+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "{'name': 'chaos/dotnet/demo', 'isDefaultBranch': False, 'upstream': '', 'mergeBase': '', 'confidence': 'MEDIUM'}"
    reviewRequest: "{'providerType': 'unknown', 'id': '', 'url': '', 'title': '', 'author': '', 'sourceBranch': '', 'targetBranch': '', 'status': 'unknown', 'confidence': 'LOW'}"
    contextSource: session-context
    confidence: HIGH
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:c170cf58daf2dfd5478fa95ec1c0176956a7efb4932e58843e4de01751190df0"
---

# CHAOS Proposal Review — add-task-query-filters

## 1. Review Metadata

- Command: `chaos:review`
- Mode: `--standard`
- Mode source: `inferred` (from LOW–MEDIUM risk; proposal was authored `--strict`)
- Target change: `add-task-query-filters`
- Review date: `2026-07-19`
- Reviewer: `CHAOS Proposal Reviewer`
- Review type: `pre-implementation proposal review`
- Implementation reviewed: `No`

## 2. Final Verdict

- Verdict: `READY_FOR_APPROVAL`
- Confidence: `MEDIUM`
- Evidence coverage: `PARTIAL`
- Assumption load: `LOW`
- OpenSpec validation: `PASSED`
- Approval eligible: `Yes`

## 3. Executive Summary

The proposal is coherent, rule-aligned, and OpenSpec-valid under `--strict`. The single material
gap found in review — the invalid-*priority* half of the PROP-DEC-001 `400` contract was
untested/unscenarioed — was remediated in-session (REV-DEC-001) and OpenSpec re-validated clean.
No blocking issues remain. Confidence is `MEDIUM` only because no filtering tests exist yet
(inherent at pre-implementation); it is expected to rise to `HIGH` at verify once the tests land.

## 4. Source Manifest

| Source | Status | Purpose | Notes |
|---|---|---|---|
| `openspec/changes/add-task-query-filters/proposal.md` | verified | proposal | Why/What/Capabilities/Impact all present |
| `openspec/changes/add-task-query-filters/design.md` | verified | design | Option B (domain-owned filtering); decisions + trade-offs recorded |
| `openspec/changes/add-task-query-filters/specs/task-api/spec.md` | verified | spec delta | ADDED List Tasks + 6 scenarios (incl. both invalid-value cases post-remediation) |
| `openspec/changes/add-task-query-filters/tasks.md` | verified | tasks | impl + 6 test tasks (3.6 added by REV-DEC-001) |
| `.chaos/changes/add-task-query-filters/proposal-report.md` | verified | governance | PROP-DEC-001 recorded |
| `.chaos/changes/add-task-query-filters/decision-events.md` | verified | governance | PROP-DEC-001, REV-DEC-001 |
| `.chaos/rules/index.md` | verified | rules | R-001/R-003/R-004/R-005 relevant |
| `examples/task-tracker/dotnet/src/TaskTracker.Api/**` | verified | current behavior | GET /tasks unfiltered; TaskState/TaskPriority enums |
| `docs/adr/**`, `docs/decision-log/**` | missing | governance | none exist; invalid-filter convention pending promotion (PROP-DEC-001 → CREATE_DECISION_LOG) |
| `.chaos/archaeology/**` | not-applicable | archaeology | new capability; current behavior directly evidenced |

## 5. Change Classification

- Change type: `NEW_CAPABILITY`
- Risk tier: `LOW` (inherent) / reviewed with `MEDIUM` rigor given the new API-wide convention
- Brownfield impact: `None` (additive to an existing endpoint; current behavior fully evidenced)
- Archaeology requirement: `Not applicable`

## 6. OpenSpec Validation

- Command attempted: `openspec validate add-task-query-filters --strict`
- Result: `PASSED` (re-run after REV-DEC-001 amendment; still valid)
- Evidence: "Change 'add-task-query-filters' is valid"
- Impact on confidence: positive — structural validity confirmed twice (before and after remediation)

## 7. Proposal Artefact Review

### proposal.md
- Present. Clear Why/What/Impact; correctly identifies `task-api` as a NEW capability (base specs
  empty). Marks the change non-breaking. Confidence: HIGH.

### design.md
- Present. Records the invalid-value decision (PROP-DEC-001) with alternatives, the domain-owned
  filtering choice (Option B, aligns R-004), and defers enum case-sensitivity to apply. Goals/
  Non-Goals bound scope well. Confidence: HIGH.

### specs/
- Present (`task-api`). ADDED "List Tasks" requirement with 6 scenarios: unfiltered, by-status,
  by-priority, combined-AND, invalid-status→400, invalid-priority→400 (last added via
  REV-DEC-001). Every requirement has ≥1 scenario. Confidence: HIGH.

### tasks.md
- Present. Spec/impl/test groups; impl tasks map to design; 6 test tasks now cover both 400 paths,
  AND semantics, and the preserved unfiltered baseline (R-003). Confidence: HIGH.
- Runtime remediation applied: REV-DEC-001 added task 3.6.

## 8. Evidence Coverage Matrix

| Area | Evidence required | Evidence found | Coverage | Confidence impact |
|---|---|---|---|---|
| Current behavior | read of GET /tasks handler | TaskEndpoints.cs:21 | COMPLETE | none |
| Filter value domain | enum definitions | TaskItem.cs (TaskState/TaskPriority) | COMPLETE | none |
| Invalid-value contract | explicit decision | PROP-DEC-001 | COMPLETE | none |
| Invalid-status test | test task | tasks.md 3.4 | COMPLETE | none |
| Invalid-priority test | test task | tasks.md 3.6 (REV-DEC-001) | COMPLETE | resolved |
| Filtering behavior tests | passing tests | not yet — land at apply | PARTIAL | caps confidence at MEDIUM |
| Convention durability | decision-log entry | pending sync (PROP-DEC-001) | PARTIAL | advisory only |

## 9. ADR / Decision / Rule Alignment

| Source decision/rule | Alignment | Finding | Severity | Confidence |
|---|---|---|---|---|
| R-001 Human owns material decisions | ALIGNED | PROP-DEC-001 + REV-DEC-001 both routed through the runtime | — | HIGH |
| R-003 Preserve green test baseline | ALIGNED | 6 test tasks incl. preserved unfiltered baseline (3.5) | — | HIGH |
| R-004 Respect domain→HTTP boundary | ALIGNED | filtering pushed to domain `TaskStore` query method (design + task 2.3) | — | HIGH |
| R-005 Keep `TaskState` naming | ALIGNED | existing enum reused; no rename | — | HIGH |
| PROP-DEC-001 invalid → 400 | ALIGNED | spec + tasks now cover both status and priority 400 paths | — | HIGH |

## 10. Findings Register

| ID | Severity | Type | Confidence | Fixability | Status | Finding | Evidence | Required action |
|---|---|---|---|---|---|---|---|---|
| REV-001 | MINOR | FACT | HIGH | FIXABLE_NOW | RESOLVED_DURING_REVIEW | Invalid-priority half of the 400 contract was untested/unscenarioed | tasks.md (pre-amend), spec.md | Added task 3.6 + invalid-priority scenario (REV-DEC-001) |
| REV-002 | ADVISORY | INFERENCE | HIGH | NEEDS_ADR_OR_DECISION_LOG | DEFERRED | Invalid-filter 400 rule is a new API-wide convention not yet in a decision log | absence of `docs/decision-log/` | Carry PROP-DEC-001 (CREATE_DECISION_LOG) to `chaos:sync` |
| REV-003 | ADVISORY | ASSUMPTION | MEDIUM | NEEDS_USER_DECISION | DEFERRED | Enum-parse case-sensitivity intentionally left to apply | design.md Open Questions; A-2 | Confirm at apply (mirrors demo APP-DEC-001) |

## 11. Runtime Remediation Log

| Finding ID | Action offered | User decision | Artefact changed | Result | Confidence impact |
|---|---|---|---|---|---|
| REV-001 | Add invalid-priority test task + spec scenario | apply-fix (Decision Center) | tasks.md, specs/task-api/spec.md | RESOLVED; `--strict` re-validation PASSED | verdict → READY_FOR_APPROVAL |

## 12. Decision Events

See `.chaos/changes/add-task-query-filters/decision-events.md`.

- **REV-DEC-001 — Add a negative-path test for the invalid-priority 400 contract** —
  TASK_AMENDMENT, RESOLVED_DURING_REVIEW, HIGH. Runtime decision
  `DEC-2026-07-19-add-task-query-filters-invalid-priority-value-h-8d32` (vscode-user). Sync
  action: `AMEND_OPENSPEC_TASKS` (applied in-session).

## 13. Assumption Register

| ID | Assumption | Why it matters | Confidence | Required validation |
|---|---|---|---|---|
| A-1 | `task-api` is a new base capability (no base spec to modify) | ADDED vs MODIFIED delta shape | HIGH | `openspec/specs/` empty (verified) |
| A-2 | Enum-parse case-sensitivity is an apply-time detail | keeps spec stable; local choice at apply | MEDIUM | Confirm at apply |

## 14. Conflicts and Unknowns

- No conflicts between OpenSpec, rules, and user intent.
- No unknowns that materially affect implementation readiness. The only open item (case-
  sensitivity) is a bounded local decision deferred to apply.

## 15. Deferred / Remaining Open Questions

| ID | Question/issue | Reason unresolved | Owner | Confidence impact | Sync action |
|---|---|---|---|---|---|
| Q-1 | Promote invalid-filter 400 rule to a durable decision log | outside review scope; handled by sync | team | advisory | CREATE_DECISION_LOG |
| Q-2 | Enum-parse case-sensitivity for filter values | intentionally deferred to apply | implementer | none (local, non-spec) | NONE |

## 16. Recommended Remediation

| Priority | Action | Owner | Blocks approval? |
|---|---|---|---|
| Done | REV-001 — add invalid-priority test + scenario | review (applied) | No (resolved) |
| Later | Promote PROP-DEC-001 to a decision-log entry | chaos:sync | No |
| At apply | Decide enum-parse case-sensitivity | implementer | No |

## 17. Approval Handoff

- Eligible for approval: `Yes`
- Approval artefact recommended: `Yes`
- Required human decision: confirm writing `approval.md` (approval is a human gate; review does
  not self-approve). Pending confirmation via the Decision Center.

## 18. Next Suggested Command

```text
chaos:apply add-task-query-filters      # after approval.md is written
```

## Config Context

Status: `CONFIG_OK`

Config values used:
- OpenSpec path: `openspec`
- ADR path: `docs/adr` (empty)
- Decision-log path: `docs/decision-log` (empty)
- Archaeology path: `.chaos/archaeology` (not used — not applicable)
- Review report path: `.chaos/changes/add-task-query-filters/proposal-review.md`
- OpenSpec validation command: `openspec validate --strict`

Material config questions asked:
- None

Confidence impact:
- None

Recommended follow-up:
- None
