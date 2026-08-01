---
chaosMetadata:
  schemaVersion: 1
  artifactType: sync-report
  artifactScope: change
  changeId: secure-task-api
  sourceCommand: "chaos:sync"
  repositoryContext:
    provider: github
    branch: demo/dotnet
    reviewRequest: null
    contextSource: local-git
    confidence: LOW
---

# CHAOS Sync Report — secure-task-api

## 1. Sync Dashboard

| | |
|---|---|
| Scope | one change (`secure-task-api`) |
| Role level | **contributor-safe** |
| Decision events | 13 — all terminal, all classified |
| Change-scoped reconciliation | **DONE** |
| Shared-governance promotions | **6 recommended, 0 applied** (out of scope at this role level) |
| Approval condition 2 | **NOT DISCHARGED** — needs a maintainer-level run |
| Verdict | PARTIALLY_RECONCILED |

## 2. Invocation and Mode

Command: `chaos:sync --change secure-task-api`
Mode: strict (inferred from `change.md` `chaosMetadata.mode`)
Scope: single change
Role level: contributor-safe
Report target: `.chaos/changes/secure-task-api/sync-report.md`
Maintainer confirmation: n/a (not `--all`)
Dry-run: no

**Scope ceiling — the load-bearing fact of this run.** `chaos:sync --change` "must **not**
silently edit shared governance (ADRs, decision logs, rules, gates, indexes, `AGENTS.md`,
`README.md`). It may *recommend* promotions and route them to a maintainer-level / repo-owner
sync" (`change-scope-and-roles.md` §1). Every drift item below that touches `.chaos/architecture.md`,
`.chaos/context.md`, `.chaos/decisions/index.md`, or `.chaos/rules/index.md` is therefore
**recommended, not applied**. That includes review approval condition 2.

## 3. Source Manifest

| Source | Status | Notes |
|---|---|---|
| `.chaos/changes/secure-task-api/change.md` | verified | strict; Delivered; §Review, §Delivery, §Verification all present |
| `.chaos/changes/secure-task-api/decision-events.md` | verified | 13 entries, none OPEN |
| `.chaos/changes/secure-task-api/lifecycle.md` | verified | Frame/Review/Deliver/Verify complete |
| `openspec/changes/secure-task-api/` | verified | `validate --strict` PASS, `isComplete: true` |
| `.chaos/architecture.md` | **drift** | SYNC-001 |
| `.chaos/context.md` | **drift** | SYNC-002 |
| `.chaos/decisions/index.md` | **drift** | SYNC-003, SYNC-004 |
| `.chaos/rules/index.md` | **drift** | SYNC-005 |
| `docs/adr/2026-08-01-api-authentication-posture.md` | verified | new; unindexed (SYNC-004), no `chaosMetadata` (SYNC-006) |
| `openspec/specs/` | empty | delta specs unpromoted — `chaos:archive`'s job, not sync's |

## 4. Toolchain / OpenSpec Status

`openspec` 1.6.0 · `openspec validate secure-task-api --strict` → **PASS** · `isComplete: true` ·
39/39 tasks ticked. Repository context resolved from **local git only** (branch `demo/dotnet`);
no MCP/provider context, so authority confidence is **LOW** — acceptable here because
contributor-safe change sync does not require provider-backed facts.

## 5. Drift Findings

| ID | Category | Severity | Knowledge | Confidence | Summary | Action |
|---|---|---|---|---|---|---|
| SYNC-001 | architecture posture | **HIGH** | FACT | HIGH | `.chaos/architecture.md` §Non-goals still lists "Authentication / authorization / multi-tenant concerns", and §Authentication/authorization posture still reads "None. The API is open." Both are false as of delivery. | **Recommend** maintainer sync; this is review approval condition 2 |
| SYNC-002 | project context | **HIGH** | FACT | HIGH | `.chaos/context.md` §Known facts still carries "`[UNKNOWN]` Persistence, auth, and multi-user concerns are out of scope for the demo", and §Environments still says local-dev-only with no deployment target — contradicted by PROP-DEC-002 (`public-internet`). | **Recommend** maintainer sync |
| SYNC-003 | decisions index | MEDIUM | FACT | HIGH | `.chaos/decisions/index.md` §ADR status handling asserts "No `docs/adr/` files exist. `[FACT]`." One now exists. | **Recommend** `chaos:sync --adrs` |
| SYNC-004 | ADR indexing | MEDIUM | FACT | HIGH | `docs/adr/2026-08-01-api-authentication-posture.md` has no display ID and no index row. Per `artifactNaming`, sequential IDs are assigned in indexes only — so the filename is correct and only the index entry is missing. | **Recommend** `chaos:sync --adrs` |
| SYNC-005 | rules | MEDIUM | INFERENCE | MEDIUM | Two reusable invariants emerged that no rule captures — see §9. | **Recommend** `chaos:sync --rules` |
| SYNC-006 | artifact metadata | LOW | FACT | HIGH | The ADR carries no `chaosMetadata` frontmatter. `config.artifactMetadataManagedFiles` lists `docs/adr/**/*.md` under **optional**, not `include`, so this is advisory rather than a policy violation. | Defer |

## 6. Decision Event Reconciliation

All 13 classified. **No promotion was applied** — see the scope ceiling in §2.

| Decision | Type | Promotion | Status |
|---|---|---|---|
| ESC-001 | escalation record | NO_PROMOTION | closed |
| PROP-DEC-001 | scope (authn-plus-edge) | OPENSPEC_UPDATE | already reflected in spec deltas |
| PROP-DEC-002 | exposure (public-internet) | ADR_CANDIDATE + context reconciliation | ADR covers it in Context; **`.chaos/context.md` still contradicts it** (SYNC-002) |
| PROP-DEC-003 | rigor (strict) | NO_PROMOTION | closed |
| PROP-DEC-004 | credential mechanism (JWT bearer) | **ADR_REQUIRED — satisfied** | ADR exists; index entry pending (SYNC-004) |
| PROP-DEC-005 | transport (app terminates TLS) | ADR_REQUIRED — satisfied + RULE_UPDATE candidate | ADR covers it; R-008 interaction worth a rule note |
| PROP-DEC-006 | archaeology waiver | **ACCEPTED_RISK** | recorded in `decision-events.md`. No `waivers.md` written — that file belongs to the legacy layout, and the `change.md` model keeps waivers in the ledger |
| REV-DEC-001 | governance obligation | **RULE_UPDATE + ADR** | **the condition-2 item — blocked at this role level** |
| REV-DEC-002 | rate limiting precedes auth | OPENSPEC_UPDATE (done) + RULE_UPDATE candidate | spec/design/tasks amended during review; rule candidate open |
| REV-DEC-003 | dev-only issuance | **ACCEPTED_RISK + RULE_UPDATE candidate** | RK-8 accepted by the human ("Risk accepted"). Currently visible only inside the change folder and the ADR |
| REV-DEC-004 | approval | NO_PROMOTION | `approves-change: true`; closed |
| APPLY-DEC-001 | options placement | NO_PROMOTION | closed |
| APPLY-DEC-002 | dead partition branch | **OPENSPEC_UPDATE + FOLLOW_UP_CHANGE** | needs a spec amendment; confirmed by VFY-005 |

## 7. Planned Patch Preview

### Will create

- `.chaos/changes/secure-task-api/sync-report.md` (this file)

### Will update

- `.chaos/changes/secure-task-api/change.md` — frontmatter `lifecycle.phases.sync` + `lifecycle.current.syncState` only (change-scoped state write, explicitly permitted)
- `.chaos/changes/secure-task-api/lifecycle.md` — Sync row + Current line

### Will not modify

- production code, tests, migrations
- `.chaos/architecture.md`, `.chaos/context.md`, `.chaos/decisions/index.md`, `.chaos/rules/index.md`, `docs/adr/**`
- `AGENTS.md`, root `README.md`

## 8. Applied Sync Actions

| Action | File | Result |
|---|---|---|
| Write change-scoped sync report | `.chaos/changes/secure-task-api/sync-report.md` | created |
| Set `lifecycle.phases.sync` | `change.md` frontmatter | complete · verdict PARTIALLY_RECONCILED |
| Reconcile `lifecycle.current.syncState` | `change.md` frontmatter | `PARTIALLY_RECONCILED` |
| Re-render lifecycle view | `lifecycle.md` | Sync row updated |

## 9. Rules and Gates

### Rules created/updated

**None** — contributor-safe scope cannot write `.chaos/rules/index.md`. Two candidates are
recommended to `chaos:sync --rules`, both drawn from decisions that already proved their worth on
this change:

- **Candidate R-009 — Rate limiting precedes authentication on publicly-reachable surfaces.**
  Source: REV-DEC-002. Statement: where a surface is reachable by untrusted callers, the rate
  limiter is registered before authentication/authorization so that rejected requests consume a
  permit. Violation criterion: `UseAuthentication()`/`UseAuthorization()` registered before
  `UseRateLimiter()` on a publicly-exposed app. Severity: major. This is testable and was caught
  as a real gap at review, which is the bar the rules index asks for.
- **Candidate R-010 — Environment-gated auth bypasses need two independent gates.**
  Source: REV-DEC-003 / design D7. Statement: any endpoint that weakens authentication in a
  named environment (test hooks, dev token minters, impersonation) is gated on the environment
  **and** an opt-in flag defaulting to off, and is applied at route-registration time so the
  route is absent rather than present-and-refusing. Violation criterion: such an endpoint guarded
  only by `IsDevelopment()`, or guarded by a runtime check inside a mapped handler. Severity:
  blocker. Directly encodes the RK-8 mitigation so it survives future refactors.

### Gates created/updated

None. G-01…G-05 remain adequate; no gate drift found.

### Duplicate sequential-ID reconciliation

n/a (`--all` only).

## 10. Sync Debt Ledger

| Item | Reason | Impact | Follow-up |
|---|---|---|---|
| SYNC-001 architecture posture | shared governance, out of role scope | **Committed governance actively misdescribes the delivered system.** Review approval condition 2 stays open | maintainer sync before archive |
| SYNC-002 context posture | shared governance, out of role scope | Same class as SYNC-001, lower blast radius | maintainer sync |
| SYNC-003 / SYNC-004 ADR indexing | shared governance, out of role scope | The first ADR is invisible to the decisions index | `chaos:sync --adrs` |
| SYNC-005 rule candidates | shared governance, out of role scope | R-009/R-010 invariants live only in this change's history | `chaos:sync --rules` |
| SYNC-006 ADR metadata | advisory (optional path in config) | provenance only | defer |
| APPLY-DEC-002 / VFY-005 spec amendment | needs a spec decision, not a sync action | a spec clause is unreachable as written | follow-up change |
| VFY-001, VFY-002 | verification findings, not governance drift | spec-vs-test mismatch; chunked-body `413` gap | follow-up change / `chaos:todo` |

## 11. Post-Sync Consistency Check

| Check | Result |
|---|---|
| `change.md` lifecycle vs `lifecycle.md` view | consistent after this write |
| Decision-event ids cross-referenced in `change.md` all resolve | PASS (13/13) |
| No OPEN decision events | PASS |
| OpenSpec validation still green after sync | PASS (sync touched no OpenSpec artifact) |
| No shared-governance file modified | PASS — verified against §7 "will not modify" |
| No production code modified | PASS |

## 12. Final Sync Verdict

Verdict: **PARTIALLY_RECONCILED**
Confidence: HIGH (for what was in scope) · LOW authority confidence (local-git context only)
Drift load: MEDIUM · Decision load: LOW (all 13 terminal and classified) · Rule impact: MEDIUM
(2 candidates) · Gate impact: NONE · ADR impact: MEDIUM (1 ADR unindexed)
Manual follow-up required: **YES**

## 13. Closure Summary

The change-scoped side is fully reconciled: 13 decision events classified, lifecycle state
written, no OPEN decisions, OpenSpec still valid, nothing shared touched.

What remains is not a defect in this change — it is work that a contributor-safe scope is
deliberately not allowed to do. Six governance items are queued for a maintainer, and one of
them is review **approval condition 2**: `.chaos/architecture.md` still tells readers the API has
no authentication. Archiving before that is reconciled means archiving with the architecture
document knowingly wrong, which is the debt `chaos:verify` already priced into
`READY_WITH_DEBT`.

**Recommended order:** `chaos:sync --adrs` and `chaos:sync --rules` (maintainer) to discharge
SYNC-001…SYNC-005, then `chaos:archive secure-task-api`. Archiving first is legitimate — the
change is `READY_WITH_DEBT`, not blocked — but it closes the change with the governance mismatch
still live.

## Todo Candidates

- **Maintainer sync for SYNC-001/SYNC-002** — architecture and context still describe a
  pre-auth system. Highest-value item here.
- **`chaos:sync --adrs`** — index the first ADR and correct the "No `docs/adr/` files exist"
  assertion in the decisions index.
- **`chaos:sync --rules`** — promote candidates R-009 and R-010.
- **Spec amendment for APPLY-DEC-002 / VFY-005** — the unreachable partition-key clause.
