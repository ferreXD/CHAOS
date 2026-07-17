# CHAOS Archive Modes and Flags

Canonical invocation:

```text
chaos:archive <change-id> [--light|--standard|--strict] [--dry-run] [--yes] [--sync-first] [--archive-with-debt] [--no-retro] [--force-waiver]
```

## Mode inference

If no explicit mode is provided, infer mode from change risk.

### Infer `--light`

Use for:

```text
documentation-only changes
spec-only cleanup
test-only changes
low-risk internal cleanup
non-behavioural changes
```

### Infer `--standard`

Use for:

```text
normal feature changes
bounded API/application changes
module-local persistence or application logic
standard OpenSpec lifecycle closure
```

### Infer `--strict`

Use for:

```text
brownfield migration
auth/security changes
external side effects
data persistence
new tables/migrations
API contract changes
offline/replay/idempotency
cross-module behaviour
production-critical behaviour
accepted risks/debt present
decision events requiring ADR/log sync
```

When inferred mode affects whether closure is blocked, present the inference and ask:

```text
1. Continue with inferred mode
2. Downgrade/upgrade mode and record rationale
3. Stop
```

## `--light`

Permissive closure.

Allows archive with limited evidence or minor classified debt. Confidence must be downgraded when evidence is missing.

## `--standard`

Default closure.

Requires:

```text
verification report
archive-readiness check
task closure summary
decision-event classification for material decisions
explicit handling for waivers/debt
archive report
```

Can archive with debt if debt is explicit, classified, and routed.

## `--strict`

High-integrity closure.

Requires:

```text
clean or explicitly waived verification
OpenSpec validation pass
all material decision events classified
no unclassified waivers
no unresolved major debt
source-of-truth update confirmation
```

Blocks aggressively.

## `--dry-run`

No mutations. Produces a full archive readiness report and execution plan only.

Can combine with modes:

```text
chaos:archive <change-id> --strict --dry-run
```

## `--yes`

Convenience flag only. It may skip repeated confirmations for already-resolved, non-risky steps.

It must not bypass:

```text
missing decisions
blocking verification verdicts
unclassified waivers
unclassified decision events
governance override prompts
force-waiver prompts
```

## `--sync-first`

Run or prompt a source-of-truth sync path before archive when specs or governance indexes may be stale.

Use when:

```text
parallel changes happened
long-running changes exist
base specs changed
ADR/rule indexes may be stale
verification suggests sync before archive
```

## `--archive-with-debt`

Explicitly allows closure with classified unresolved debt.

Requires each debt item to have:

```text
reason
impact
confidence impact
sync route or retro route
follow-up recommendation
```

## `--no-retro`

Suppresses retro recommendation only when no major learning signal exists.

If retro triggers exist, the command must challenge the user and record rationale.

## `--force-waiver`

High-friction governance override.

It must require:

```text
waiver id
blocking issue overridden
reason
accepted risk
confidence downgrade
debt classification
sync action
retro action
user confirmation
```

`--force-waiver` cannot produce `ARCHIVED`. It can only produce:

```text
ARCHIVED_WITH_DEBT
ARCHIVED_UNDER_GOVERNANCE_OVERRIDE
ARCHIVED_BUT_UNCONFIRMED
```
