---
chaosMetadata:
  schemaVersion: 1
  artifactType: sync-report
  artifactScope: repository
  changeId: null
  sourceCommand: "chaos:sync"
  repositoryContext:
    provider: github
    branch: demo/dotnet
    reviewRequest: null
    contextSource: local-git
    confidence: LOW
---

# CHAOS Sync Report — `--rules` (2026-08-01)

## 1. Sync Dashboard

| | |
|---|---|
| Scope | rule consistency |
| Role level | **maintainer** |
| Decisions surfaced | 2 — both answered, both applied |
| Rules promoted | **R-009** (major), **R-010** (blocker) |
| Rules index | 8 → **10** rows |
| Verdict | RECONCILED |

## 2. Invocation and Mode

Command: `chaos:sync --rules`
Mode: standard (default) · Scope: rules · Role level: maintainer
Report target: `.chaos/sync-reports/2026-08-01-rules-sync-report.md`
Maintainer confirmation: n/a (`--all` gate only) · Dry-run: no

## 3. Source Manifest

| Source | Status | Notes |
|---|---|---|
| `.chaos/changes/secure-task-api/decision-events.md` | verified | REV-DEC-002 and REV-DEC-003 are the promotion sources |
| `.chaos/changes/secure-task-api/change.md` | verified | §Review findings REV-002/REV-003; RK-8 in §Risk |
| `openspec/changes/secure-task-api/design.md` | verified | D5 (pipeline order), D7 (two-gate issuance) |
| `.chaos/changes/secure-task-api/sync-report.md` | read | SYNC-005 catalogued both candidates |
| `.chaos/rules/index.md` | **patched** | 2 rows appended |
| `.chaos/gates/index.md` | not touched | no gate drift; G-01…G-05 remain adequate |

## 4. Placement Decision (recorded, not asked)

`rule-gate-generation.md` allows either per-rule files or central-index definitions:
*"If the workspace currently uses only central indexes, insert lightweight definitions there."*
`.chaos/rules/` contains **only** `index.md` — no per-rule files exist, and R-001…R-008 all live
as index rows. Both new rules therefore follow that precedent as rows. `R-009`/`R-010` are
**index display IDs** per `policies.artifactNaming`; no file is named after a sequential ID.

This was a convention-following call, not a material choice, so it was recorded rather than
surfaced as a decision.

## 5. Decision Reconciliation

| Decision | Source | Answer | Rationale | Applied |
|---|---|---|---|---|
| SYNC-005a → R-009 | REV-DEC-002 | `promote-as-proposed` (major) | "Demo purposes" | yes |
| SYNC-005b → R-010 | REV-DEC-003 / design D7 | `promote-as-proposed` (blocker) | "Demo purposes" | yes |

Each was consumed only after its row landed in the index.

## 6. Rules Created

### R-009 — Rate limiting precedes authentication on public surfaces · `major`

Scope `src/TaskTracker.Api/**` · source `secure-task-api` REV-002 → REV-DEC-002 (2026-08-01).

> On any surface reachable by untrusted callers, `UseRateLimiter()` is registered **before**
> `UseAuthentication()`/`UseAuthorization()`, so a request that fails authentication still
> consumes a permit. Endpoints that are deliberately anonymous carry their own rate-limiting
> policy.

**Violation criteria:** `UseAuthentication()` or `UseAuthorization()` registered before
`UseRateLimiter()` on a publicly-exposed app; or a publicly reachable anonymous endpoint with no
rate-limiting policy attached.

**Deferral:** waiver with rationale only where an upstream gateway demonstrably throttles
unauthenticated traffic; the gateway must be named as the enforcement point.

*Why it earned promotion:* this was a real MAJOR review finding, not a hypothetical. The change
originally left middleware order unpinned, which on a public-internet surface would have let
unauthenticated callers flood JWT signature validation for free. Two tests now pin the fixed
behaviour (`Unauthenticated_flood_is_throttled`,
`Permits_consumed_while_unauthenticated_still_block_a_valid_token`).

### R-010 — Environment-gated auth bypasses need two independent gates · `blocker`

Scope `src/TaskTracker.Api/**` · source `secure-task-api` REV-003 → REV-DEC-003, design D7
(2026-08-01).

> Any endpoint that weakens authentication in a named environment — dev token minters, test
> hooks, impersonation, auth stubs — is gated on **both** the hosting environment **and** an
> explicit configuration flag that defaults to disabled, and the gate is applied at route-
> **registration** time so the route is absent (`404`) rather than present-and-refusing when
> either gate fails.

**Violation criteria:** such an endpoint guarded only by `IsDevelopment()`; or guarded by a
runtime check inside a mapped handler rather than by conditional registration; or a gating flag
whose default is enabled.

**Deferral:** none. To remove the risk, do not ship the endpoint — that is the safe default, not
a single gate.

*Why it earned promotion, and at blocker:* this is the durable form of **RK-8**, the only
Critical-impact risk in the change, accepted by the human with "Risk accepted". Before this rule,
the mitigation existed solely as a conditional in `Program.cs` and prose in ADR-0001 — nothing
repo-wide would have stopped the next change from shipping the same pattern behind a single
`IsDevelopment()` guard, which fails open on the most common operational mistake there is
(`ASPNETCORE_ENVIRONMENT` left as `Development` in a deployed environment). Blocker severity
matches the recorded Critical impact.

The override wording deliberately echoes R-008's. Both rules answer the same shape of pressure,
where the tempting shortcut is to weaken the guard rather than drop the feature.

## 7. Gates

None created or updated. Neither decision implies a new repeatable lifecycle check — both are
code-level invariants checkable by reading a registration site, which is rule territory, not gate
territory. G-01…G-05 remain adequate.

## 8. Post-Sync Consistency Check

| Check | Result |
|---|---|
| Rules index row count | 8 → **10** |
| R-009 and R-010 present | PASS |
| Duplicate sequential rule IDs | **none** |
| Every rule row has 8 columns (incl. a checkable violation criterion) | PASS — 10/10 |
| No rule file named after a sequential ID | PASS — `.chaos/rules/` still contains only `index.md` |
| Quality gate: no `DRAFT_WEAK`/vague statements | PASS — both violation criteria are mechanically checkable |
| Gates index untouched | PASS |
| `AGENTS.md` / root `README.md` untouched | PASS |
| Production code untouched | PASS |

## 9. Sync Debt Ledger

| Item | Reason | Impact | Follow-up |
|---|---|---|---|
| SYNC-006 ADR `chaosMetadata` | advisory; `docs/adr/**` is `optional` in `artifactMetadataManagedFiles` | provenance only | defer |
| VFY-001, VFY-002, APPLY-DEC-002, RK-5, RK-8 | implementation/verification debt, not governance drift | unchanged by this run | follow-up change / `chaos:todo` |

Note: RK-8 remains accepted risk in the change, but R-010 now constrains how the *pattern* may be
used in future work — the acceptance is bounded rather than open-ended.

## 10. Final Sync Verdict

Verdict: **RECONCILED**
Confidence: HIGH (rows applied and re-grepped) · authority confidence LOW (local-git context)
Drift load: **NONE remaining in governance** · Decision load: LOW · Rule impact: RESOLVED (2
promoted) · Gate impact: NONE · ADR impact: RESOLVED (previous run)
Manual follow-up required: NO

## 11. Closure Summary

SYNC-005 is discharged. Combined with the `--adrs` run earlier today, **all governance drift from
`secure-task-api` is now reconciled**: architecture and context describe the delivered system,
ADR-0001 is indexed, and the two invariants the lifecycle actually discovered are enforceable
rules rather than one-off code.

`chaos:archive secure-task-api` can now proceed. It will still close as `ARCHIVED_WITH_DEBT` —
VFY-001, VFY-002, APPLY-DEC-002, RK-5 and RK-8 are real and carried — but none of that debt is a
governance contradiction.

## Todo Candidates

- **SYNC-006** — add `chaosMetadata` frontmatter to ADR-0001, or move `docs/adr/**` from
  `optional` to `include` in `artifactMetadataManagedFiles`.
- **Runtime defect (3rd occurrence this session)** — `createDecision` writes the decision
  artifact before validating the session transition, stranding a `waiting` decision when the
  session is `ready-to-resume`. Fix in `tools/chaos-interaction-runtime`, or make commands call
  `resumeCommand` first.
