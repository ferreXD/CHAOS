# Scope Drift Policy

`chaos:apply` must actively detect scope drift.

## Scope boundary sources

Build the implementation boundary from:

- OpenSpec `proposal.md`
- OpenSpec `design.md`
- OpenSpec `specs/`
- OpenSpec `tasks.md`
- `chaos:review` report
- CHAOS decisions/rules/architecture
- user-provided constraints

## Drift classes

### NO_DRIFT

Changes match approved tasks and expected implementation boundary.

### BOUNDED_DRIFT

Small local change needed to complete an approved task.

Examples:

- Add a missing unit test helper.
- Add a migration for already-approved persistence.
- Rename a generated class to match repo convention.

Allowed in light/standard with decision event. In strict, requires confirmation and usually OpenSpec task amendment.

### SPEC_DRIFT

Implementation requires changing requirements, acceptance criteria, public contracts, or tasks.

Requires OpenSpec amendment or explicit user-approved risk in light/standard. Blocks in strict unless amended.

### ARCHITECTURE_DRIFT

Implementation requires changing ADR posture, module boundaries, integration patterns, auth model, deployment model, or persistence strategy.

Blocks in strict. In light/standard, only continue after explicit user decision and `sync_action: CREATE_ADR` or `CREATE_DECISION_LOG`.

### OUT_OF_SCOPE

Change is unrelated to current OpenSpec change.

Stop or defer.

## Drift budget by mode

- `--light`: allow bounded drift after recording.
- `--standard`: allow bounded drift and some spec amendment after explicit prompt.
- `--strict`: no drift without formal amendment/decision first.
