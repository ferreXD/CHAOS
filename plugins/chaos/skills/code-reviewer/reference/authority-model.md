# Code Review Authority Model

Use this priority order when reviewing code.

## 1. Project authority

`AGENTS.md` is the highest authority for project-specific rules.

Extract and apply:

- architecture style
- layer/module responsibilities
- official technology stack
- dependency flow
- folder structure
- naming conventions
- testing expectations
- mandatory skills and when to use them
- prohibited libraries/patterns
- workflow or governance rules

## 2. Applicable project skills

Skills referenced by `AGENTS.md` become mandatory when the reviewed code falls inside their declared domain.

A skill is not mandatory outside its domain unless `AGENTS.md` explicitly says it is.

## 3. Repository evidence

Use the existing codebase as evidence for established patterns, but do not let accidental legacy inconsistencies override explicit project rules.

Label repository-pattern conclusions as `INFERENCE` unless the rule is explicitly documented.

## 4. Technology-specific best practices

Apply language/framework best practices after project rules and skills.

Do not present a generic preference as a project-rule violation.

## Conflict handling

If authorities conflict:

1. Prefer `AGENTS.md` over skills.
2. Prefer explicit skill instructions over inferred repository patterns.
3. Prefer documented rules over generic best practices.
4. Report the conflict instead of silently resolving it when it affects review outcome.

Use this label:

```text
Authority conflict: <brief description>
Confidence: <HIGH | MEDIUM | LOW>
Evidence:
- <source>
- <source>
```
