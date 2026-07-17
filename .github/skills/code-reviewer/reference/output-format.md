# Review Output Format

Use this structure for the final review.

```markdown
# Code Review — <scope>

## Summary

Verdict: <APPROVE | APPROVE_WITH_NITS | REQUEST_CHANGES | BLOCKED | INSUFFICIENT_CONTEXT>
Confidence: <HIGH | MEDIUM | LOW>

<brief summary of overall quality and main risks>

## Scope Reviewed

- Files / diff / module reviewed:
  - <path>
- Review mode: <light | standard | strict>
- Review basis: <diff | files | repository scan | user-provided snippet>

## Authorities Loaded

- AGENTS.md: <loaded | missing | partial>
- Skills loaded:
  - <skill-name>: <applicable | not applicable | missing>
- Repository evidence:
  - <brief notes>

## Issues Found

### CRITICAL

#### CRIT-001 — <title>

Location: `<file>:<line-or-section>`
Authority: <AGENTS.md section | skill section | repository evidence | technology best practice>
Knowledge type: <FACT | INFERENCE | ASSUMPTION | UNKNOWN | CONFLICT>
Confidence: <HIGH | MEDIUM | LOW>

Description:
<what is wrong>

Why it matters:
<impact>

Suggestion:
<actionable fix>

### HIGH

<same structure>

### MEDIUM

<same structure>

### LOW / NITS

<same structure, briefer allowed>

## Positive Observations

- <good practice observed>

## Metrics

- Files reviewed: <n>
- Issues found: <total>
- Critical: <n>
- High: <n>
- Medium: <n>
- Low/Nit: <n>
- Applicable skills validated: <n>

## Confidence and Evidence Gaps

- <gap and confidence impact>

## Prioritized Recommendations

1. <highest priority action>
2. <next action>
3. <next action>

## Completion Checklist

- [x] AGENTS.md checked
- [x] Applicable skills identified
- [x] Applicable skills read or missing skills reported
- [x] Findings reference authority/evidence
- [x] Severity assigned consistently
- [x] Positive observations included where meaningful
```

If there are no issues in a severity category, omit that category or write `None found`.
