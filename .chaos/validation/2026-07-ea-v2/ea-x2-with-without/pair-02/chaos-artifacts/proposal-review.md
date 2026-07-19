---
chaosMetadata:
  schemaVersion: 1
  artifactType: proposal-review
  artifactScope: change
  changeId: soft-delete-tasks
  sourceCommand: "chaos:review"
  lastWrittenAt: "2026-07-19T18:18:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T18:18:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "p2-armA (worktree; detached from main)"
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:886e8df0e88d63418d21a66bb5b101d542d8bc6ce9e294f654870bc204172e3d"
---

# CHAOS Proposal Review — soft-delete-tasks

## 1. Review Metadata

- Command: `chaos:review`
- Mode: `--strict`
- Mode source: `inferred` (schema change + non-goal-adjacent area)
- Target change: `soft-delete-tasks`
- Review date: `2026-07-19`
- Reviewer: `CHAOS Proposal Reviewer`
- Review type: `pre-implementation proposal review`
- Implementation reviewed: `No` (review precedes apply in this lifecycle record; apply/verify follow)
- Run context: EA-X2 mechanized — no live human; material decisions resolved-in-arm (documented deviation from R-001)

## 2. Final Verdict

- Verdict: `READY_FOR_APPROVAL`
- Confidence: `MEDIUM`
- Evidence coverage: `PARTIAL`
- Assumption load: `LOW`
- OpenSpec validation: `PASSED` (`openspec validate soft-delete-tasks --strict`)
- Approval eligible: `Yes` (conditional: the R-001 no-human deviation is explicitly recorded and accepted for this mechanized run)

## 3. Executive Summary

The proposal is coherent, rule-aligned, and OpenSpec-valid under `--strict`. It correctly
identifies that soft-delete touches a **decision-bearing architecture area** (data retention,
adjacent to the persistence non-goal) and bounds it explicitly (MDEC-003: in-memory retention
only). The model choice (nullable `DeletedAt` timestamp, MDEC-001) matches the contract exactly and
its trailing-defaulted-param form delivers the backward-compatible migration with no migration
engine. Visibility/mutation are domain-owned (MDEC-002, R-004). The one structural caveat is the
**documented R-001 deviation** — no live human answered the material decisions; they were
resolved-in-arm with maintainer rationale. That deviation is explicit and auditable, so it does not
block approval in this run. Confidence is `MEDIUM` only because soft-delete tests are pending at
review time (inherent pre-implementation); expected to rise to `HIGH` at verify.

## 4. Source Manifest

| Source | Status | Purpose | Notes |
|---|---|---|---|
| `openspec/changes/soft-delete-tasks/proposal.md` | verified | proposal | Why/What/Capabilities/Impact present; non-goal called out |
| `openspec/changes/soft-delete-tasks/design.md` | verified | design | Options A/B/C; MDEC-001/002/003; risks; open questions |
| `openspec/changes/soft-delete-tasks/specs/task-api/spec.md` | verified | spec delta | MODIFIED List Tasks + ADDED deletedAt/Soft-Delete/Get-by-id |
| `openspec/changes/soft-delete-tasks/tasks.md` | verified | tasks | impl + test tasks; all mapped to decisions |
| `.chaos/changes/soft-delete-tasks/proposal-report.md` | verified | governance | MDEC-001/002/003 recorded; non-goal surfaced |
| `.chaos/changes/soft-delete-tasks/decision-events.md` | verified | governance | 6 decisions; R-001 deviation declared |
| `.chaos/rules/index.md` | verified | rules | R-001/R-003/R-004/R-005/R-006 |
| `.chaos/architecture.md` | verified | boundary/non-goals | persistence non-goal; domain→HTTP posture |
| `src/TaskTracker.Api/**` | verified | current behaviour | DELETE hard-remove; web-default JSON |

## 5. Change Classification

- Change type: `BEHAVIOUR_CHANGE + SCHEMA_CHANGE`
- Risk tier: `MEDIUM` (domain-model edit + DELETE contract change; reviewed with strict rigor)
- Brownfield impact: `Low` (additive nullable field; existing calls unaffected)
- Archaeology requirement: `Not applicable` (current behaviour directly evidenced)

## 6. OpenSpec Validation

- Command: `openspec validate soft-delete-tasks --strict`
- Result: `PASSED` — "Change 'soft-delete-tasks' is valid"
- Evidence: MODIFIED "List Tasks" matches the existing base requirement; every requirement has ≥1 scenario with WHEN/THEN.
- Impact on confidence: positive — structural validity confirmed.

## 7. Proposal Artefact Review

### proposal.md
- Present. Clear Why/What/Impact; explicitly surfaces the persistence/retention non-goal and the
  in-memory scoping. Confidence: HIGH.

### design.md
- Present. Options A/B/C with rejection rationale; records MDEC-001/002/003 + APP-DEC-002/003;
  Goals/Non-Goals bound scope well; open questions (restore/purge/TTL, PUT-on-deleted) deferred.
  Confidence: HIGH.

### specs/
- Present (`task-api`). MODIFIED List Tasks (adds default-active + includeDeleted) and ADDED
  Task-Representation/Soft-Delete/Get-by-id requirements, each scenario'd. Confidence: HIGH.

### tasks.md
- Present. Spec/impl/test groups; impl tasks map to the decisions; 6 test tasks cover seeds-active,
  null-serialization, soft-delete visibility, 404-unknown, includeDeleted, and baseline (R-003).
  Confidence: HIGH.

## 8. Evidence Coverage Matrix

| Area | Evidence required | Evidence found | Coverage | Confidence impact |
|---|---|---|---|---|
| Current DELETE behaviour | read of handler | TaskEndpoints.cs `store.Remove` | COMPLETE | none |
| Task model shape | record definition | TaskItem.cs | COMPLETE | none |
| JSON null/camelCase default | host config | Program.cs (no ignore condition) | COMPLETE | none |
| Non-goal boundary | architecture doc | architecture.md Non-goals | COMPLETE | none |
| Soft-delete behaviour tests | passing tests | pending at review (land at apply) | PARTIAL | caps confidence at MEDIUM |

## 9. ADR / Decision / Rule Alignment

| Source decision/rule | Alignment | Finding | Severity | Confidence |
|---|---|---|---|---|
| R-001 Human owns material decisions | DEVIATION (documented) | No live human in EA-X2 run; MDEC-001/002/003 resolved-in-arm with rationale + explicit deviation notice | ADVISORY | HIGH |
| R-003 Preserve green test baseline | ALIGNED | 5 baseline tests preserved; new tests planned (3.1–3.6) | — | HIGH |
| R-004 Respect domain→HTTP boundary | ALIGNED | `DeletedAt` pure-domain; visibility/mutation in `TaskStore` | — | HIGH |
| R-005 Keep `TaskState` naming | ALIGNED | field added; no enum rename | — | HIGH |
| R-006 Protected files | ALIGNED | AGENTS.md / README.md untouched | — | HIGH |
| Architecture persistence non-goal | ALIGNED (bounded) | MDEC-003 scopes retention to in-memory; no persistence introduced | — | HIGH |

## 10. Findings Register

| ID | Severity | Type | Confidence | Fixability | Status | Finding | Evidence | Required action |
|---|---|---|---|---|---|---|---|---|
| REV-001 | ADVISORY | FACT | HIGH | ACCEPTED_RISK | ACCEPTED | R-001 stop-and-resume not exercised (no live human, EA-X2) | decision-events.md deviation notice | Accept for mechanized run; decisions recorded + resolved-in-arm |
| REV-002 | MINOR | FACT | HIGH | FIXABLE_AT_APPLY | DEFERRED | No soft-delete test coverage yet | tasks.md 3.1–3.6 | Implement tests at apply |
| REV-003 | ADVISORY | INFERENCE | HIGH | NEEDS_DECISION_LOG | DEFERRED | "Retention is in-memory only" is a scoping convention not yet in a decision log | MDEC-003 | Consider promoting at sync if durable retention is ever proposed |
| REV-004 | ADVISORY | FACT | MEDIUM | OUT_OF_SCOPE | DEFERRED | PUT on a soft-deleted task still mutates the physical row | design.md open questions | Leave as-is (don't change unrelated endpoints); revisit in a future change |

## 11. Runtime Remediation Log

| Finding ID | Action offered | Decision | Artefact changed | Result | Confidence impact |
|---|---|---|---|---|---|
| — | (mechanized run; no interactive remediation) | resolved-in-arm | — | material decisions recorded + resolved | none |

## 12. Decision Events

See `.chaos/changes/soft-delete-tasks/decision-events.md`.

- **MDEC-001** — Nullable `DeletedAt` timestamp on the domain record — SCHEMA_DESIGN, RESOLVED_IN_ARM, HIGH.
- **MDEC-002** — Domain-owned visibility + mutation (R-004) — ARCHITECTURE_DESIGN, RESOLVED_IN_ARM, HIGH.
- **MDEC-003** — In-memory retention only; don't cross the persistence non-goal — SCOPE_ARCH_BOUNDARY, RESOLVED_IN_ARM, HIGH.
- **APP-DEC-001/002/003** — GET-by-id-hides-deleted, DELETE physical-existence semantics, default JSON serialization — LOCAL_DESIGN, RESOLVED_IN_ARM, HIGH.

## 13. Assumption Register

| ID | Assumption | Why it matters | Confidence | Required validation |
|---|---|---|---|---|
| A-1 | Web-default JSON emits `deletedAt: null` for active tasks | Contract requires `null` present | HIGH | Raw-JSON test at apply |
| A-2 | Trailing defaulted record param is a source-compatible migration | Seeds/`Add` must stay valid & active | HIGH | Build clean + seeds-active test |
| A-3 | Re-deleting a physically-present soft-deleted task → 204 is acceptable | Contract silent on this | MEDIUM | APP-DEC-002 records the choice |

## 14. Conflicts and Unknowns

- No conflicts between OpenSpec, rules, and user intent.
- The only structural caveat is the recorded R-001 deviation (mechanized run), explicitly accepted.

## 15. Deferred / Remaining Open Questions

| ID | Question/issue | Reason unresolved | Owner | Confidence impact | Sync action |
|---|---|---|---|---|---|
| Q-1 | Restore/undelete + hard-purge + TTL | out of scope; future decision-bearing work | team | none | NONE |
| Q-2 | PUT on a soft-deleted task | contract says don't change unrelated endpoints | team | none | NONE |
| Q-3 | Promote "in-memory retention only" convention | only relevant if durable retention proposed | team | advisory | CONSIDER_DECISION_LOG |

## 16. Recommended Remediation

| Priority | Action | Owner | Blocks approval? |
|---|---|---|---|
| At apply | Implement soft-delete tests (3.1–3.6) | implementer | No |
| Accepted | R-001 deviation for mechanized run | run owner | No (recorded) |
| Later | Consider promoting MDEC-003 convention | chaos:sync | No |

## 17. Approval Handoff

- Eligible for approval: `Yes` (with the recorded R-001 deviation accepted for this run)
- Approval artefact recommended: `Yes` (omitted in this mechanized EA-X2 run; deviation noted)
- Required human decision: normally confirm approval in the Decision Center; not available here.

## 18. Next Suggested Command

```text
chaos:apply soft-delete-tasks
```

## Config Context

Status: `CONFIG_OK`

Config values used:
- OpenSpec path: `openspec`
- Review report path: `.chaos/changes/soft-delete-tasks/proposal-review.md`
- OpenSpec validation command: `openspec validate --strict`

Material config questions asked: None.
Confidence impact: None.
