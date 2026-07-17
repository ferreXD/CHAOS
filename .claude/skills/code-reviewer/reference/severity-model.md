# Severity Model

Use these severities consistently.

## CRITICAL

Use when the issue can cause severe production failure, data loss/corruption, security breach, broken authorization, irreversible side effects, or a hard violation of non-negotiable architecture rules.

## HIGH

Use when the issue can cause incorrect behaviour, significant maintainability risk, broken dependency direction, missing required validation, unsafe persistence/transaction handling, or violation of mandatory project skills.

## MEDIUM

Use when the issue creates moderate maintainability, testability, clarity, performance, or consistency risk but is unlikely to break critical behaviour immediately.

## LOW

Use for minor maintainability, readability, local consistency, or small design improvements.

## NIT

Use for small style or wording improvements that are not correctness or architecture problems.

## Severity discipline

- Do not inflate severity for personal preferences.
- A repeated LOW issue may become MEDIUM if it reveals a systemic pattern.
- A missing test is HIGH only when the changed behaviour is risky or project rules require it.
- A generic best-practice deviation is not HIGH unless backed by project authority or real impact.
