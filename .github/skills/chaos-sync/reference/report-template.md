# Sync Report Template

```md
# CHAOS Sync Report — <scope/date>

## 1. Sync Dashboard

<chat-first dashboard repeated for audit trail>

## 2. Invocation and Mode

Command: `chaos:sync ...`
Mode: <light|standard|strict>
Scope: <scope>
Role level: <contributor-safe | maintainer | repo-owner>
Report target: <.chaos/changes/<id>/sync-report.md | .chaos/sync-reports/repo-sync-YYYY-MM-DD.md | .chaos/sync-reports/<scope-or-date>-sync-report.md>
Maintainer confirmation (for `--all`): <recorded | not-required-dry-run | blocked | n/a>
Dry-run: <yes/no>

## 3. Source Manifest

| Source | Status | Notes |
|---|---|---|

## 4. Toolchain / OpenSpec Status

<tool availability, openspec status/validation if available>

## 5. Drift Findings

| ID | Category | Severity | Knowledge | Confidence | Summary | Action |
|---|---|---|---|---|---|---|

## 6. Decision Event Reconciliation

| Decision | Source | Promotion | User action | Status |
|---|---|---|---|---|

## 7. Planned Patch Preview

### Will create

- <files>

### Will update

- <files>

### Will not modify

- production code
- tests
- migrations

## 8. Applied Sync Actions

| Action | File | Result |
|---|---|---|

## 9. Rules and Gates

### Rules created/updated

### Gates created/updated

### Duplicate sequential-ID reconciliation (`--all`)

| Duplicate ID | Candidate A | Candidate B | Resolution | User decision | Status |
|---|---|---|---|---|---|

Note: physical filenames remain date-prefixed and slug-based; sequential IDs are
index display values only.

## 10. Sync Debt Ledger

| Item | Reason | Impact | Follow-up |
|---|---|---|---|

## 11. Post-Sync Consistency Check

| Check | Result |
|---|---|

## 12. Final Sync Verdict

Verdict: <verdict>
Confidence: <HIGH|MEDIUM|LOW>
Drift load: <LOW|MEDIUM|HIGH>
Decision load: <LOW|MEDIUM|HIGH>
Rule impact: <LOW|MEDIUM|HIGH>
Gate impact: <LOW|MEDIUM|HIGH>
ADR impact: <LOW|MEDIUM|HIGH>
Manual follow-up required: <YES|NO>

## 13. Closure Summary

<what happened, what remains, next command>
```

## Config Health

Status: `CONFIG_OK | CONFIG_MISSING | CONFIG_PARTIAL | CONFIG_STALE | CONFIG_CONFLICT | CONFIG_UNSUPPORTED_VERSION`

Config values used:
- ADR path:
- Decision-log path:
- OpenSpec path:
- Rules path/index:
- Gates path/index:
- Report paths:
- Protected-file policies:

## Config Drift Findings

| ID | Finding | Recommended action | User decision | Status |
|---|---|---|---|---|

## Config Reconciliation Decisions

- <SYNC-DEC-* entries, or none>

## Config Sync Debt

- <deferred config issues, or none>

## Protected Documentation Reconciliation

| File | Drift type | Action | Patch/Rewrite | Override used | Result |
|---|---|---|---|---|---|

Required notes:

- current policy from `.chaos/config.yaml`;
- whether `AGENTS.md`, `AGENT.md`, or `README.md` was patched or rewritten;
- source indexes used for rewrite;
- user rationale if protected-doc override was used;
- post-sync consistency check result.
