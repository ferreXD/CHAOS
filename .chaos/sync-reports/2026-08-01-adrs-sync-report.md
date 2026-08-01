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

# CHAOS Sync Report — `--adrs` (2026-08-01)

## 1. Sync Dashboard

| | |
|---|---|
| Scope | ADR-focused |
| Role level | **maintainer** |
| Decisions surfaced | 3 — all answered, all applied |
| Files changed | 3 governance documents |
| Review approval condition 2 | **DISCHARGED** |
| Verdict | RECONCILED |

## 2. Invocation and Mode

Command: `chaos:sync --adrs`
Mode: standard (default; no mode flag supplied)
Scope: ADR-focused · Role level: maintainer
Report target: `.chaos/sync-reports/2026-08-01-adrs-sync-report.md`
Maintainer confirmation: n/a (the `--all` gate applies to repo-wide sync only)
Dry-run: no

## 3. Source Manifest

| Source | Status | Notes |
|---|---|---|
| `docs/adr/2026-08-01-api-authentication-posture.md` | verified | ADR-0001; its §Superseded governance is the authority for patches 1–2 below |
| `.chaos/architecture.md` | **patched** | 4 patches |
| `.chaos/context.md` | **patched** | 4 patches |
| `.chaos/decisions/index.md` | **patched** | 2 patches |
| `.chaos/changes/secure-task-api/decision-events.md` | read | REV-DEC-001 sync obligation; REV-DEC-004 approval provenance |
| `.chaos/changes/secure-task-api/sync-report.md` | read | SYNC-001…006 catalogue from the contributor-safe run |
| `.chaos/rules/index.md` | **not touched** | R-009/R-010 belong to `chaos:sync --rules` |

## 4. Toolchain / OpenSpec Status

No OpenSpec artifact touched; `openspec validate secure-task-api --strict` unaffected.
Repository context resolved from **local git only** (branch `demo/dotnet`) → authority
confidence **LOW**. Acceptable: `--adrs` is maintainer-level, not the repo-owner `--all` gate,
so provider-backed authority was not required.

## 5. Drift Findings

| ID | Category | Severity | Knowledge | Confidence | Summary | Resolution |
|---|---|---|---|---|---|---|
| SYNC-001 | architecture posture | HIGH | FACT | HIGH | `.chaos/architecture.md` declared auth a non-goal and stated "None. The API is open." | **RESOLVED** |
| SYNC-002 | project context | HIGH | FACT | HIGH | `.chaos/context.md` said auth was out of scope and promised a dependency-free local start | **RESOLVED** |
| SYNC-003 | decisions index | MEDIUM | FACT | HIGH | Index asserted "No `docs/adr/` files exist. `[FACT]`." | **RESOLVED** |
| SYNC-004 | ADR indexing | MEDIUM | FACT | HIGH | ADR had no display ID and no index row | **RESOLVED** |
| SYNC-007 | stale test count | LOW | FACT | HIGH | Both documents said "5 integration tests"; actual is 34. **Found during this run**, not by the change-scoped sync | **RESOLVED** |
| SYNC-008 | stale hosting note | LOW | FACT | HIGH | "No production hosting defined `[UNKNOWN]`" ignored PROP-DEC-002 fixing exposure as public-internet. **Found during this run** | **RESOLVED** |
| SYNC-005 | rule candidates | MEDIUM | INFERENCE | MEDIUM | R-009/R-010 uncaptured | **out of scope** → `chaos:sync --rules` |
| SYNC-006 | ADR frontmatter | LOW | FACT | HIGH | ADR carries no `chaosMetadata` (config lists `docs/adr/**` as *optional*, not `include`) | deferred — advisory |

## 6. Decision Reconciliation

| Decision | Answer | Rationale | Applied |
|---|---|---|---|
| SYNC-001 architecture | `apply-all-four` | "Demo purposes" | yes — 4 patches |
| SYNC-002 context | `apply-all-four` | "Demo purposes" | yes — 4 patches |
| SYNC-003/004 index | `apply-both` | "Demo purposes" | yes — 2 patches |

All three answered in the Decision Center and consumed only after their patches landed.

## 7. Applied Sync Actions

### `.chaos/architecture.md`

1. §Authentication/authorization posture — "None. The API is open." replaced with the delivered
   posture (JWT bearer on `/tasks`, anonymous `GET /`, external credential config with fail-fast
   startup, app-terminated TLS, `UseForwardedHeaders` deliberately unregistered per R-008,
   dev-only issuance behind two registration-time gates), citing ADR-0001.
2. §Non-goals — **split rather than deleted.** Authentication and transport hardening are no
   longer non-goals; **per-caller authorization and multi-tenancy remain** non-goals, because
   `TaskItem` still has no owner field (RK-4). Deleting the whole line would have overstated
   what shipped.
3. §Testing/release posture — "5 integration tests" → "34 integration tests (5 original CRUD
   tests, updated to authenticate, plus 29 new)".
4. §Runtime/deployment — "No production hosting defined `[UNKNOWN]`" → public-internet exposure
   intent (PROP-DEC-002) with the host still `[UNKNOWN]`.

### `.chaos/context.md`

1. §Known facts — the `[UNKNOWN]` auth line split into a `[FACT]` (auth delivered, cites
   ADR-0001) and a narrowed `[UNKNOWN]` (persistence and per-caller authorization).
2. §Environments — records that the app now **fails to start** without `Auth:SigningKey`,
   `Auth:Issuer` and `Auth:Audience`, and that intended exposure is the public internet. This is
   the operationally load-bearing patch: `context.md` is where a newcomer looks before their
   first `dotnet run`, and it previously promised a clean start.
3. §Known facts — test count 5 → 34.
4. §Important flows — all five `/tasks` rows annotated "requires bearer token, `401` without
   one"; `GET /` annotated "anonymous, rate limited"; footnote on `429`/`413`.

### `.chaos/decisions/index.md`

1. New area row: API authentication + transport → ADR-0001, accepted (human-confirmed via
   REV-DEC-004, "Risk accepted"), with RK-4/RK-5 as open questions.
2. §ADR status handling — the false "No `docs/adr/` files exist. `[FACT]`." replaced with the
   real state, keeping the `Proposed`-ADR caution, plus an explicit note that `ADR-0001` is an
   index display ID and the file is never renamed.

## 8. Rules and Gates

None created or updated. R-009 (rate limiting precedes authentication) and R-010
(environment-gated auth bypasses need two independent gates) remain queued for
`chaos:sync --rules` — out of scope for an ADR-focused run.

## 9. Sync Debt Ledger

| Item | Reason | Impact | Follow-up |
|---|---|---|---|
| SYNC-005 R-009/R-010 | out of `--adrs` scope | the two invariants live only in this change's history | `chaos:sync --rules` |
| SYNC-006 ADR `chaosMetadata` | advisory; `docs/adr/**` is `optional` in config | provenance only | defer |
| VFY-001, VFY-002, APPLY-DEC-002, RK-5, RK-8 | verification/implementation debt, not governance drift | unchanged by this run | follow-up change / `chaos:todo` |

## 10. Post-Sync Consistency Check

| Check | Result |
|---|---|
| No "The API is open" / "auth is out of scope" left in governance | **PASS** |
| No "No `docs/adr/` files exist" assertion left | **PASS** |
| No stale "5 integration tests" outside change history | **PASS** |
| ADR-0001 present in the decisions index | PASS (3 references) |
| ADR physical filename unchanged (naming policy) | PASS — `2026-08-01-api-authentication-posture.md` |
| Rules/gates untouched by an `--adrs` run | PASS |
| `AGENTS.md` / root `README.md` untouched | PASS — no protected-doc drift surfaced in this scope |
| Production code untouched | PASS |

## 11. Final Sync Verdict

Verdict: **RECONCILED**
Confidence: HIGH (patches applied and re-grepped) · authority confidence LOW (local-git context)
Drift load: LOW (was MEDIUM) · Decision load: LOW · Rule impact: MEDIUM (2 candidates pending)
· Gate impact: NONE · ADR impact: RESOLVED
Manual follow-up required: YES — `chaos:sync --rules`

## 12. Closure Summary

**Review approval condition 2 is discharged.** `.chaos/architecture.md` and `.chaos/context.md`
now describe the system that actually shipped, and the decisions index no longer denies the
existence of the ADR it should be pointing at.

Two extra staleness items (SYNC-007 test count, SYNC-008 hosting note) surfaced only because
this run compared the documents against reality rather than against one change's decision list —
worth remembering as a limitation of change-scoped sync.

Remaining before a clean archive: `chaos:sync --rules` for R-009/R-010. After that,
`chaos:archive secure-task-api` still closes as `ARCHIVED_WITH_DEBT`, but only carrying
LOW/MEDIUM implementation debt (VFY-001, VFY-002, APPLY-DEC-002, RK-5, RK-8) — no governance
contradiction.

## Todo Candidates

- **`chaos:sync --rules`** — promote R-009 and R-010; R-010 is what would stop a future change
  repeating the RK-8 dev-bypass pattern less carefully.
- **SYNC-006** — add `chaosMetadata` frontmatter to the ADR, or move `docs/adr/**` from
  `optional` to `include` in `artifactMetadataManagedFiles`.
