---
chaosMetadata:
  schemaVersion: 1
  artifactType: proposal-review
  artifactScope: change
  changeId: optimistic-concurrency-updates
  sourceCommand: "chaos:review"
  lastWrittenAt: "2026-07-19T18:24:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T18:24:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: chaos/ea-x2/p3-armA
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
---

# CHAOS Proposal Review — optimistic-concurrency-updates

## 1. Review Metadata

- Command: `chaos:review`
- Mode: `--strict`
- Mode source: `inferred` (contract-bearing + decision-bearing / adjacent to an architecture non-goal)
- Target change: `optimistic-concurrency-updates`
- Review date: `2026-07-19`
- Reviewer: `CHAOS Proposal Reviewer`
- Review type: `pre-implementation proposal review`
- Implementation reviewed: `No`
- Run context: `EA-X2 mechanized run` — material decisions resolved in-arm (documented deviation
  from Decision-Center stop-and-resume; see decision-events.md).

## 2. Final Verdict

- Verdict: `READY_FOR_APPROVAL`
- Confidence: `MEDIUM`
- Evidence coverage: `PARTIAL`
- Assumption load: `LOW`
- OpenSpec validation: `PASSED` (`openspec validate optimistic-concurrency-updates --strict` → valid)
- Approval eligible: `Yes` (conditional on EA-X2 in-arm resolution; no human approver present)

## 3. Executive Summary

The proposal is coherent, rule-aligned, and OpenSpec-valid under `--strict`. It correctly and
explicitly surfaces the decision-bearing surface (this feature sits next to the persistence
non-goal): the **atomicity requirement** (a version field alone does not stop lost updates) and the
**non-durability** of `version`. The design keeps the domain→HTTP boundary (R-004) by making the
compare-and-increment domain-owned and returning a domain outcome the endpoint maps to 200/404/409.
Confidence is `MEDIUM` only because no versioning tests exist yet (inherent pre-implementation);
expected to rise to `HIGH` at verify once tests land. No blocking issues.

## 4. Source Manifest

| Source | Status | Purpose | Notes |
|---|---|---|---|
| `openspec/changes/optimistic-concurrency-updates/proposal.md` | verified | proposal | Why/What/Impact present; non-goal surfaced |
| `openspec/changes/optimistic-concurrency-updates/design.md` | verified | design | D1–D5 recorded with trade-offs |
| `openspec/changes/optimistic-concurrency-updates/specs/task-api/spec.md` | verified | spec delta | ADDED 2 requirements, 5 scenarios (each ≥1) |
| `openspec/changes/optimistic-concurrency-updates/tasks.md` | verified | tasks | impl + 6 test tasks + validation |
| `.chaos/changes/optimistic-concurrency-updates/proposal-report.md` | verified | governance | PROP-DEC-001..005 recorded |
| `.chaos/changes/optimistic-concurrency-updates/decision-events.md` | verified | governance | 5 propose decisions, resolved in-arm |
| `.chaos/rules/index.md` | verified | rules | R-003/R-004/R-005/R-006 relevant |
| `.chaos/architecture.md` | verified | non-goals | persistence/durability non-goals; store non-durable |
| `src/TaskTracker.Api/**` | verified | current behavior | blind PUT overwrite; camelCase JSON |

## 5. Change Classification

- Change type: `NEW_CAPABILITY` (adds a field + conditional-update semantics to an existing endpoint)
- Risk tier: `MEDIUM` (public JSON shape change + new 409 path + concurrency correctness)
- Brownfield impact: `Low` (additive; backward-compatible for callers omitting `expectedVersion`)
- Archaeology requirement: `Not applicable` (current behavior directly evidenced)

## 6. OpenSpec Validation

- Command: `openspec validate optimistic-concurrency-updates --strict`
- Result: `PASSED` — "Change 'optimistic-concurrency-updates' is valid"
- Impact on confidence: positive — structural validity confirmed.

## 7. Proposal Artefact Review

### proposal.md
- Present. Clear Why/What/Impact; explicitly flags the NON-GOAL / decision-bearing surface and the
  atomicity requirement. Correctly classifies `task-api` as a MODIFIED capability (base spec
  exists). Confidence: HIGH.

### design.md
- Present. D1 (domain-owned), D2 (atomic lock, no TOCTOU), D3 (domain outcome, no exceptions),
  D4 (no extra 400), D5 (non-durable version) with risks/trade-offs. Goals/Non-Goals bound scope
  (ETag/If-Match explicitly excluded). Confidence: HIGH.

### specs/
- Present (`task-api` delta). ADDED "Task Version Field" (2 scenarios: create v1, seeded v1) and
  "Optimistic Concurrency on Update" (3 scenarios: omitted→increment, match→increment,
  stale→409+unchanged). Every requirement has ≥1 scenario. Confidence: HIGH.

### tasks.md
- Present. Spec/impl/test/validation groups; impl tasks map to design decisions; 6 test tasks cover
  version-1, increment, match, stale→409+unchanged, and the preserved baseline (R-003). Confidence: HIGH.

## 8. Evidence Coverage Matrix

| Area | Evidence required | Evidence found | Coverage | Confidence impact |
|---|---|---|---|---|
| Current PUT behavior | read of PUT handler + Update | TaskEndpoints.cs:38–46, TaskStore.cs:34–42 | COMPLETE | none |
| JSON naming policy | camelCase web default | Program.cs + passing tests (Title→title) | COMPLETE | none |
| Concurrency model | store threading posture | TaskStore.cs (ConcurrentDictionary singleton), architecture | COMPLETE | none |
| Atomicity requirement | reasoned analysis | PROP-DEC-002 (TOCTOU) | COMPLETE | none |
| Non-durability posture | architecture non-goal | PROP-DEC-004 | COMPLETE | surfaced (MEDIUM) |
| Versioning behavior tests | passing tests | not yet — land at apply | PARTIAL | caps confidence at MEDIUM |

## 9. ADR / Decision / Rule Alignment

| Source decision/rule | Alignment | Finding | Severity | Confidence |
|---|---|---|---|---|
| R-003 Preserve green test baseline | ALIGNED | baseline + new tests scoped; existing PUT (omits expectedVersion) stays green | — | HIGH |
| R-004 Respect domain→HTTP boundary | ALIGNED | domain-owned compare-and-increment; outcome mapped at endpoint (PROP-DEC-001/003) | — | HIGH |
| R-005 Keep `TaskState` naming | ALIGNED | `Version` added; enum not renamed | — | HIGH |
| R-006 Protected files | ALIGNED | no `AGENTS.md`/root `README.md` edits | — | HIGH |
| Architecture non-goals | HONORED | no persistence introduced; non-durability surfaced (PROP-DEC-004) | ADVISORY | MEDIUM |
| R-001 Human owns material decisions | DEVIATION (disclosed) | EA-X2: no human; decisions resolved in-arm with rationale + explicit tag | ADVISORY | MEDIUM |

## 10. Findings Register

| ID | Severity | Type | Confidence | Fixability | Status | Finding | Required action |
|---|---|---|---|---|---|---|---|
| REV-001 | ADVISORY | FACT | HIGH | ACCEPTED | NOTED | Concurrency guarantee depends on atomic check-and-increment, not the version field alone | Verify the lock/critical-section at apply; add a stale→409+unchanged test (PROP-DEC-002) |
| REV-002 | ADVISORY | FACT | MEDIUM | NEEDS_DECISION_LOG | DEFERRED | `version` is non-durable (resets on restart) | Accept + surface (PROP-DEC-004); consider decision-log promotion at sync |
| REV-003 | ADVISORY | PROCESS | MEDIUM | ACCEPTED | NOTED | R-001 stop-and-resume bypassed (no live human in EA-X2) | Documented deviation; decisions carry in-arm rationale + tag |
| REV-004 | MINOR | FACT | HIGH | FIXABLE_AT_APPLY | OPEN | No versioning tests exist yet | Land tasks §3 at apply; verify closes the gap |

## 11. Runtime Remediation Log

| Finding ID | Action offered | Resolution | Artefact changed | Result |
|---|---|---|---|---|
| REV-001 | Require an explicit stale→409+unchanged test | resolved-in-arm (EA-X2) | tasks.md §3.5 (already scoped) | no change needed — already covered |
| (none other) | — | — | — | — |

## 12. Decision Events

See `.chaos/changes/optimistic-concurrency-updates/decision-events.md` — PROP-DEC-001..005, all
`RESOLVED_IN_ARM` with documented rationale and the EA-X2 deviation tag. No review-time decision
required beyond confirming the propose decisions; the atomicity and non-durability points are
already recorded (PROP-DEC-002, PROP-DEC-004).

## 13. Assumption Register

| ID | Assumption | Why it matters | Confidence | Required validation |
|---|---|---|---|---|
| A-1 | Web camelCase policy serializes `Version`→`version` | satisfies "serialized as `version`" | HIGH | new tests read `version` at apply |
| A-2 | Absent `expectedVersion` → null → unconditional | backward compat of existing PUT test | HIGH | existing PUT test stays green |
| A-3 | 404 precedence over 409 for unknown id | endpoint outcome ordering | HIGH | contract implies conflict needs an existing task |

## 14. Conflicts and Unknowns

- No conflicts between the OpenSpec delta, rules, architecture, and the task contract.
- One accepted, surfaced limitation (non-durability). No implementation-blocking unknowns.

## 15. Deferred / Remaining Open Questions

| ID | Question | Reason unresolved | Owner | Sync action |
|---|---|---|---|---|
| Q-1 | Promote the concurrency-on-non-durable-store posture to a decision log | outside review scope | team | CONSIDER_DECISION_LOG |
| Q-2 | Durable versioning | persistence non-goal; separate `--strict` change | team | NONE (out of scope) |

## 16. Recommended Remediation

| Priority | Action | Owner | Blocks approval? |
|---|---|---|---|
| At apply | Implement atomic check-and-increment + stale→409+unchanged test | implementer | No |
| Later | Consider decision-log entry for concurrency posture | chaos:sync | No |

## 17. Approval Handoff

- Eligible for approval: `Yes` (EA-X2: in-arm; no human approver — recorded as a disclosed deviation).
- Required human decision (normal flow): confirm approval in the Decision Center. Bypassed here per
  the EA-X2 mechanized-run protocol; recorded.

## 18. Next Suggested Command

```text
chaos:apply optimistic-concurrency-updates
```
