# CHAOS Code Review — <change-id-or-scope>

## 1. Review Metadata

- Command: `chaos:code-review`
- Driver: `code-reviewer` agent + skill (read-only)
- Mode: `--light|--standard|--strict`
- Mode source: `explicit|inferred|user-overridden`
- Scope: `<change-id | pr#N | since:<ref> | scope:<path> | staged | working>`
- Review date: `<date>`
- Review type: `post-implementation code review`
- Code modified by this command: `No (read-only)`

## 2. Final Verdict

- Verdict: `CODE_READY|CODE_READY_WITH_CONDITIONS|NEEDS_REMEDIATION|BLOCKED|INSUFFICIENT_AUTHORITY`
- Confidence: `HIGH|MEDIUM|LOW`
- Evidence coverage: `COMPLETE|PARTIAL|WEAK`
- Assumption load: `LOW|MEDIUM|HIGH`
- Blocking findings: `<n>`
- Confidence caps applied: `<none | reason>`

## 3. Executive Summary

Short, decision-oriented summary of code health and what (if anything) blocks readiness.

## 4. Scope Reviewed

- Files / modules / diff reviewed.
- For change-scoped: link to `.chaos/changes/<change-id>/` and the OpenSpec change used for
  intent/spec context.
- What was **not** reviewed (and why), e.g. partial diff, generated files excluded.

## 5. Authorities Loaded

| Authority | Status | Use |
|---|---|---|
| `AGENTS.md` | loaded/missing | architecture, conventions, mandatory skills |
| Project skill `<name>` | loaded/missing/not-applicable | domain rules |
| ADRs / `.chaos/rules` | loaded/missing | governance constraints |
| Technology best practice | applied | fallback after project rules |

Note any missing-authority decision (`CR-DEC-*`) and resulting confidence cap.

## 6. Findings Register

| ID | CHAOS severity | Driver severity | Type | Confidence | File:line | Authority | Finding | Required action |
|---|---|---|---|---|---|---|---|---|

- CHAOS severity: `BLOCKING|MAJOR|MINOR|ADVISORY`.
- Driver severity: `CRITICAL|HIGH|MEDIUM|LOW|NIT`.
- Type: `FACT|INFERENCE|ASSUMPTION|UNKNOWN|CONFLICT`.
- Confidence: `HIGH|MEDIUM|LOW`.
- Authority: `AGENTS.md | project skill | repository evidence | general best practice`.

## 7. Architecture & Convention Compliance

- Dependency-direction / layering violations.
- `AGENTS.md` convention violations.
- Project skill compliance (only within each skill's declared domain).

## 8. Positive Observations

Meaningful things done well (kept honest, not filler).

## 9. Remediation Routing Log

| Finding ID | Option offered | User decision | Routed to | Result | Confidence impact |
|---|---|---|---|---|---|

## 10. Decision Events

Record material decisions as `CR-DEC-*` (see `reference/decision-event-register.md`).

### CR-DEC-001 — <short title>

(Full event shape per the decision-event register: type, status, knowledge type,
confidence, evidence, review impact, sync action.)

## 11. Assumption & Unknowns Register

| ID | Assumption/unknown | Why it matters | Confidence | Required validation |
|---|---|---|---|---|

## 12. Metrics

- Files reviewed / total in scope.
- Findings by CHAOS severity.
- Tests present / run / not run.

## 13. Config Context

- Status: `CONFIG_OK|CONFIG_MISSING|CONFIG_PARTIAL|CONFIG_CONFLICT|CONFIG_UNSUPPORTED_VERSION`
- Paths used: `paths.changes`, `paths.codeReviews`, `paths.openspec`, validation commands.
- Material config decisions: `<CR-DEC-* or none>`
- Confidence impact: `<none | cap | rationale>`

## 14. Prioritized Recommendations

| Priority | Action | Owner | Blocks readiness? |
|---|---|---|---|

## 15. Next Suggested Command

Usually one of:

- `chaos:verify <change-id>` when code is ready.
- `chaos:apply <change-id>` to remediate BLOCKING/MAJOR findings.
- `chaos:sync` to promote a recommended rule/ADR/decision-log draft or to register this
  command in `.chaos/commands/index.md`.
- `chaos:archaeology <topic>` if evidence is insufficient to judge.

## 16. Completion Checklist

- [ ] `AGENTS.md` + applicable skills loaded (or missing-authority decision recorded).
- [ ] Scope and mode shown.
- [ ] Findings classified with CHAOS severity + knowledge type + confidence.
- [ ] No invented files/lines/rules.
- [ ] Material decisions asked one at a time and recorded as `CR-DEC-*`.
- [ ] Read-only respected (no code/config/index edits).
- [ ] Report written to the scope-correct path; lifecycle updated (change-scoped).
