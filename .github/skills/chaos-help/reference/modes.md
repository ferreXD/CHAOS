# CHAOS Modes

## `--light`

Use for low-risk changes, documentation, small cleanup, exploration, or simple report generation.

Characteristics:

- lower ceremony
- fewer questions
- allows more deferral with rationale
- confidence may be lower

## `--standard`

Default mode for normal feature/change work.

Characteristics:

- evidence-aware
- user-guided decisions
- normal governance and reporting
- blocks on direct blockers

## `--strict`

Use for brownfield migration, persistence, API contracts, auth/security, external side effects, replay/idempotency, cross-module behavior, or production-critical work.

Characteristics:

- stronger gates
- fewer waivers
- requires more evidence
- blocks on unresolved major issues

## Mode inference

When no mode is passed, commands should infer the mode, explain why, and allow the user to accept or override with rationale.
