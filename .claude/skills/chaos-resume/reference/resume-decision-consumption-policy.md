# Resume Decision Consumption Policy

Answering a decision is **not** the same as consuming it. Consumption records
that the resumed command actually incorporated the human's choice.

## Consumption flow (order is mandatory)

1. **Load the response** (`chaos_get_decision_response`, or read
   `.chaos/interactions/decisions/<id>/response.json`).
2. **Validate** it: selected option exists in the decision; required rationale is
   present. If invalid, STOP and report.
3. **Incorporate** the selected option into the resumed command's plan and/or
   artifacts (e.g. choose the execution profile, apply the approved scope).
4. **Record a decision event** in the change artifact if the change contract has
   one (see below).
5. **Only then** call `chaos_mark_decision_consumed` (or the runtime
   `markDecisionConsumed`).
6. Continue from `nextStep`.

## Never consume before use

- Do not mark a decision consumed merely because the user answered it.
- If the command cannot continue after reading the response, **leave the decision
  `answered`**, do not consume it, and report the blocker.
- Consuming a decision you did not use is forbidden.

## Decision-record output

An incorporated answer surfaces in the change's decision record
(`.chaos/decisions/<date>-<slug>.md`, written at the record step of the resumed
`chaos:run`): the decision id, the chosen option, and the rationale. Do not create
governance files the resumed command's own contract would not create.

## Pending unresolved decisions

If the session still has a `waiting` decision, do not bypass it. Stop and route
the user to the Decision Center (or `chaos_get_active_decision`) to answer it
first.
