# Task Delegation Contract

`chaos:apply` may delegate implementation to a specialist agent. The orchestrator must still own scope and workflow control.

## Delegation unit

Prefer delegation by OpenSpec task or work package, not the entire change.

Good:

```text
Implement task 2.1 from openspec/changes/<change-id>/tasks.md.
```

Bad:

```text
Implement the feature.
```

## Required task prompt

```md
# CHAOS Task Delegation

Change ID: <change-id>
Mode: <light|standard|strict>
Task ID: <task id>
Task text: <task text>
Specialist: <C# Expert or equivalent>

## Source of truth
- openspec/changes/<change-id>/proposal.md
- openspec/changes/<change-id>/design.md
- openspec/changes/<change-id>/specs/
- openspec/changes/<change-id>/tasks.md
- .chaos/changes/<change-id>/proposal-review.md   (legacy fallback: .chaos/reviews/<change-id>-proposal-review.md)

## Relevant CHAOS constraints
- <rule/decision excerpts>

## Allowed scope
- <files/components/modules/contracts>

## Non-goals
- <non-goals>

## Stop conditions
- Scope exceeds approved change.
- New architectural decision is needed.
- External side effect appears that proposal did not cover.
- Existing behaviour is unclear and evidence is insufficient.
- Tests require unavailable infrastructure.

## Required response
- Files inspected
- Files changed
- Tests added/updated
- Assumptions
- Unknowns
- Decisions needed
- Validation run/skipped
- Completion status
```

## Specialist output handling

The orchestrator must inspect the specialist response and classify:

- completed task
- partial task
- discovered amendment
- new decision required
- scope drift
- validation gap
- blocker

Do not continue to the next task if a direct blocker or unresolved required decision exists.
