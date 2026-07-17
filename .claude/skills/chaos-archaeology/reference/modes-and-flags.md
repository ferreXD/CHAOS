# CHAOS Archaeology Modes and Flags

## Modes

### `--light`

Use for quick orientation, low-risk refactors, documentation, or early investigation.

Default budget:

- max files: 10-15
- max depth: 1
- tests: nearby/obvious only
- side effects: list only if obvious
- questions: max 2 high-impact prompts

### `--standard`

Use for normal brownfield work and proposal preparation.

Default budget:

- max files: 25-40
- max depth: 2
- tests: inspect nearby tests if available
- side effects: classify known/possible/missing
- questions: max 5 material prompts

### `--strict`

Use for high-risk migration, persistence, external side effects, auth/security, contracts, replay/idempotency, offline sync, or critical behaviour.

Default budget:

- max files: up to 60 unless overridden
- max depth: 3
- tests: required or absence recorded
- side effects/data flow: required if relevant
- questions: all blocking scope/evidence prompts

## Flags

```text
--dry-run                         Do not write report/index; show plan and/or findings.
--scope <path-or-module>           Bound investigation to a path/module.
--entrypoint <file-or-symbol>      Start from a known entry point.
--from-change <change-id>          Associate archaeology with an OpenSpec change.
--since <git-ref-or-date>          Prefer changed/relevant files since ref/date.
--focus <area>                     Narrow the investigation lens.
--max-files <n>                    Override file budget.
--max-depth <n>                    Override traversal depth.
--include-tests                    Require test evidence scan.
--include-db                       Require DB/persistence scan.
--include-side-effects             Require side-effect scan.
--include-callers                  Include callers of entrypoint.
--include-callees                  Include callees of entrypoint.
--include-config                   Include runtime/config files.
--include-docs                     Include docs/ADRs/decision logs.
--no-code                          Docs/config archaeology only.
```
