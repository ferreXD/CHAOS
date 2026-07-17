# chaos:status Output Contract

`chaos:status` must produce a Markdown report at:

```text
.chaos/status-report.md
```

unless run with `--no-write`.

## Required sections

```markdown
# CHAOS Status Report

## 1. Run Metadata
## 2. Executive Verdict
## 3. Status Summary
## 4. Blocking Findings
## 5. Major Warnings
## 6. Check Results
## 7. Source Inventory Audit
## 8. Scope and ADR Status Audit
## 9. Command Implementation Matrix
## 10. Gate Readiness
## 11. Recommended Next Actions
## 12. Remediation Prompts
## 13. Config Health

Must include a config health table when `.chaos/config.yaml` is present or expected:

| Check | Status | Severity | Knowledge type | Confidence | Evidence | Impact | Remediation |
|---|---|---|---|---|---|---|---|

Allowed config statuses:

- `CONFIG_OK`
- `CONFIG_MISSING`
- `CONFIG_PARTIAL`
- `CONFIG_STALE`
- `CONFIG_CONFLICT`
- `CONFIG_UNSUPPORTED_VERSION`

Must report:

- config path;
- detected config version;
- top-level sections found/missing;
- whether config contains repository conventions only;
- path coherence;
- toolchain command source: `config`, `defaults`, or `mixed`;
- validation command source: `config`, `defaults`, or `unknown`;
- protected-file policy for `AGENTS.md` and root `README.md`;
- conflicts with discovered repo facts, `AGENTS.md`, command indexes, rules, gates, or bootstrap report.

If config is missing, partial, stale, conflicting, or unsupported, include a remediation prompt. Do not create or patch `.chaos/config.yaml` without explicit confirmation.

Use:

```text
.github/skills/chaos-status/reference/config-audit.md
```

## 14. Toolchain Preflight

Must include a table of required tools:

| Tool | Required | Status | Detected version | Evidence | Impact | Remediation |
|---|---:|---|---|---|---|---|
| Git | yes | PASS / FAIL / WARN / UNKNOWN |  |  | source tracking / manifests |  |
| Node.js | yes | PASS / FAIL / WARN / UNKNOWN |  |  | OpenSpec runtime |  |
| npm | yes | PASS / FAIL / WARN / UNKNOWN |  |  | OpenSpec install/update |  |
| OpenSpec CLI | yes | PASS / FAIL / WARN / UNKNOWN |  |  | OpenSpec workflows |  |

If any required tool is missing or invalid, include a remediation prompt.

Allowed remediation choices:

1. Install now, if safe and supported
2. Show manual install instructions
3. Continue in degraded mode
4. Defer with rationale
5. Abort command

Do not install anything without explicit confirmation.

## 15. Machine-Readable Summary
```

## 1. Run Metadata

Must include:

- run date/time if available;
- mode used;
- scope used;
- whether report was written or dry-run;
- auditor identity: `CHAOS Status Auditor`;
- inspected root path if available.

## 2. Executive Verdict

Must include exactly one verdict:

```text
NOT_INITIALIZED
BLOCKED
NEEDS_ATTENTION
READY
STRONG
```

Also include:

- short reason;
- confidence: `HIGH`, `MEDIUM`, or `LOW`;
- evidence coverage: `COMPLETE`, `PARTIAL`, or `WEAK`;
- assumption load: `LOW`, `MEDIUM`, or `HIGH`.

Hard rule: `chaos:status` must not emit a confidence-less verdict.

## 3. Status Summary

Use a compact table:

| Category | Status | Severity | Confidence | Notes |
|---|---|---|---|---|

Required categories:

- Workspace structure
- Agent entrypoint
- Bootstrap audit trail
- Config health
- Source inventory
- Scope decisions
- ADR status handling
- Constitution confidence doctrine
- Decisions index
- Rules index
- Commands index
- Gates index
- README
- Change-scoped layout & collaboration posture
- Repository-wide sync posture
- Next-command readiness
- Toolchain readiness

## 4. Blocking Findings

List blocker findings with:

- ID;
- title;
- knowledge type: `FACT`, `INFERENCE`, `ASSUMPTION`, `UNKNOWN`, or `CONFLICT`;
- confidence: `HIGH`, `MEDIUM`, or `LOW`;
- evidence;
- why it blocks;
- recommended fix.

If none, write:

```text
No blocking findings.
```

## 5. Major Warnings

List major warnings with:

- ID;
- title;
- knowledge type;
- confidence;
- evidence;
- risk;
- recommended fix.

If none, write:

```text
No major warnings.
```

## 6. Check Results

Each check result must include:

- check ID;
- status;
- severity;
- knowledge type;
- confidence;
- evidence;
- notes.

Example:

```markdown
### CS-BOOT-001 — Bootstrap report exists

Status: PASS  
Severity: BLOCKER  
Knowledge type: FACT  
Confidence: HIGH  
Evidence:
- `.chaos/bootstrap-report.md`

Notes:
- Report includes mode, Q&A, scope, and source inventory.
```

## 7. Source Inventory Audit

Must report whether source inventory is exact.

Minimum fields for ADR-like sources:

| Path | ID | Title | Detected status | Inventory status | Included in CHAOS scope | Reason |
|---|---|---|---|---|---|---|

Inventory status values:

- `verified`
- `missing`
- `inferred`

Hard rule:

> Do not summarize sources using ranges unless every source in the range is verified or missing items are explicitly listed.

## 8. Scope and ADR Status Audit

Must answer:

- Which tracks are included?
- Which tracks are excluded?
- Were exclusions explicitly confirmed?
- Were Proposed/Draft ADRs treated as accepted?
- If yes, where was that explicitly confirmed?
- Are any ADRs deferred, superseded, or contradictory?

## 9. Command Implementation Matrix

Required fields:

| Command | Status | Backing file/skill/prompt | Notes |
|---|---|---|---|

Status values:

- `implemented`
- `defined-only`
- `external`
- `missing`
- `deprecated`

## 10. Gate Readiness

For each gate:

| Gate | Status | Required evidence present? | Blocking criteria present? | Owner present? | Confidence metadata present? | Notes |
|---|---|---:|---:|---:|---:|---|

## 11. Recommended Next Actions

Use at most 7 actions.

Each action must include:

- priority;
- owner;
- expected impact;
- whether it is required before next command.

## 12. Remediation Prompts

If missing or weak foundational concerns are found, include interactive remediation options unless `--no-interactive` is supplied.

This section is mandatory when any of these are missing or weak:

- confidence/knowledge classification in `.chaos/constitution.md`;
- source inventory discipline;
- Proposed/Draft ADR confirmation;
- major track exclusion confirmation;
- command implementation status;
- gate evidence/blocker definitions;
- missing/partial/stale/conflicting `.chaos/config.yaml`.

Each remediation prompt must include:

- issue ID;
- affected file(s);
- proposed fix summary;
- available choices: `Fix now`, `Create remediation plan`, `Defer with rationale`, `Mark accepted risk`, `Do nothing`;
- whether explicit user confirmation is required before editing.

The status command must ask the user whether to apply fixes for foundational concerns such as missing confidence/knowledge classification in `.chaos/constitution.md`. It must not silently modify files.

Example:

```markdown
### RP-001 — Add confidence doctrine to constitution

Issue: CS-CONST-001 failed.  
Affected files: `.chaos/constitution.md`, optionally `.chaos/rules/index.md`, `.chaos/gates/index.md`  
Proposed fix: add the CHAOS Confidence and Knowledge Classification Doctrine.  
Choices:
1. Fix now
2. Create remediation plan
3. Defer with rationale
4. Mark accepted risk
5. Do nothing

Requires confirmation before editing: yes
```

## 13. Config Health

Must include a config health table when `.chaos/config.yaml` is present or expected:

| Check | Status | Severity | Knowledge type | Confidence | Evidence | Impact | Remediation |
|---|---|---|---|---|---|---|---|

Allowed config statuses:

- `CONFIG_OK`
- `CONFIG_MISSING`
- `CONFIG_PARTIAL`
- `CONFIG_STALE`
- `CONFIG_CONFLICT`
- `CONFIG_UNSUPPORTED_VERSION`

Must report:

- config path;
- detected config version;
- top-level sections found/missing;
- whether config contains repository conventions only;
- path coherence;
- toolchain command source: `config`, `defaults`, or `mixed`;
- validation command source: `config`, `defaults`, or `unknown`;
- protected-file policy for `AGENTS.md` and root `README.md`;
- conflicts with discovered repo facts, `AGENTS.md`, command indexes, rules, gates, or bootstrap report.

If config is missing, partial, stale, conflicting, or unsupported, include a remediation prompt. Do not create or patch `.chaos/config.yaml` without explicit confirmation.

Use:

```text
.github/skills/chaos-status/reference/config-audit.md
```

## 14. Toolchain Preflight

Must include a table of required tools:

| Tool | Required | Status | Detected version | Evidence | Impact | Remediation |
|---|---:|---|---|---|---|---|
| Git | yes | PASS / FAIL / WARN / UNKNOWN |  |  | source tracking / manifests |  |
| Node.js | yes | PASS / FAIL / WARN / UNKNOWN |  |  | OpenSpec runtime |  |
| npm | yes | PASS / FAIL / WARN / UNKNOWN |  |  | OpenSpec install/update |  |
| OpenSpec CLI | yes | PASS / FAIL / WARN / UNKNOWN |  |  | OpenSpec workflows |  |

If any required tool is missing or invalid, include a remediation prompt.

Allowed remediation choices:

1. Install now, if safe and supported
2. Show manual install instructions
3. Continue in degraded mode
4. Defer with rationale
5. Abort command

Do not install anything without explicit confirmation.

## 15. Machine-Readable Summary

Include a fenced JSON block:

```json
{
  "verdict": "READY",
  "toolchainReady": true,
  "mode": "default",
  "confidence": "MEDIUM",
  "evidenceCoverage": "PARTIAL",
  "assumptionLoad": "MEDIUM",
  "blockers": 0,
  "majorWarnings": 2,
  "checks": {
    "pass": 12,
    "warn": 2,
    "fail": 0,
    "unknown": 1,
    "notApplicable": 0,
    "deferred": 0
  },
  "nextRecommendedCommand": "chaos:archaeology",
  "remediationPrompts": 0
}
```


## Config machine-readable fields

The machine-readable summary should include, when possible:

```yaml
config:
  status: CONFIG_OK | CONFIG_MISSING | CONFIG_PARTIAL | CONFIG_STALE | CONFIG_CONFLICT | CONFIG_UNSUPPORTED_VERSION
  path: .chaos/config.yaml
  version: "0.1"
  source: verified | missing | inferred
  toolchainSource: config | defaults | mixed | unknown
  validationSource: config | defaults | mixed | unknown
  protectedFilesPolicyFound: true | false
  remediationRequired: true | false
```

## Protected Documentation Drift

The status report must include protected documentation findings for `AGENTS.md` / `AGENT.md` and root `README.md`.

Required fields:

| File | Drift type | Severity | Knowledge type | Confidence | Recommended action | User decision | Override used |
|---|---|---|---|---|---|---|---|

Recognized drift types:

```text
PROTECTED_DOC_MISSING
PROTECTED_DOC_STALE
PROTECTED_DOC_CONFLICT
PROTECTED_DOC_BLOATED
PROTECTED_DOC_UNLINKED
PROTECTED_DOC_COMMAND_DRIFT
PROTECTED_DOC_RULE_GATE_DRIFT
PROTECTED_DOC_CONFIG_DRIFT
PROTECTED_DOC_README_HONESTY_DRIFT
PROTECTED_DOC_POLICY_TOO_STRICT
```

If a patch or rewrite is proposed, include a concise patch summary and the exact files targeted. If a protected-doc override is used, record the human rationale.

## Change-Scoped Layout & Collaboration Posture

`chaos:status` must audit whether the workspace declares and documents the v0 team-safe
collaboration model (canonical contract: `.chaos/changes/README.md`). This is a read-only
audit; do not mutate shared files except through the existing confirmed remediation flow.

Required findings (use the `CS-CHG-*` and `CS-SYNCPOSTURE-*` checks from
`reference/check-catalog.md`):

| Area | Question | Status |
|---|---|---|
| Config layout | Does `.chaos/config.yaml` declare `policies.changeArtifacts.layout` = `.chaos/changes/<change-id>` and `paths.changes`? | OK / MISSING / DRIFT |
| Naming policy | Does config declare `policies.artifactNaming` (date-prefixed, slug, index-only sequential IDs)? | OK / MISSING / DRIFT |
| Sync roles | Does config declare `policies.sync` (contributor `--change`, maintainer-confirmed `--all`, mainline branch)? | OK / MISSING / DRIFT |
| Legacy-only contracts | Do command contracts still point only to legacy scattered folders (`.chaos/reviews/`, `.chaos/apply-reports/`, …) as the preferred output? | NONE / DRIFT |
| Commands index | Does `.chaos/commands/index.md` document the per-change layout and `chaos:sync --change` vs `--all`? | OK / DRIFT |
| Concurrency docs | Do `AGENTS.md`, root `README.md`, and `.chaos/README.md` mention team concurrency and mainline sync? | OK / DRIFT |
| Repo-wide sync posture | When was the last `chaos:sync --all` / `--since main`? Is a repository-wide reconciliation recommended (e.g. after merges to `main`)? | report posture |

Detecting legacy-only output contracts, an undocumented layout, or missing concurrency
documentation is **drift** (MAJOR by default; advisory in `--light`). Report it, recommend
the fix, and route shared-doc edits through the protected-doc remediation flow with patch
preview and confirmation. Do not migrate legacy artifacts; recommend a future migration task.
