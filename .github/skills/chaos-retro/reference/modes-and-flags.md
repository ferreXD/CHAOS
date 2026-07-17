# CHAOS Retro Modes and Flags

## Modes

### `--light`

Use for small changes or quick learning capture.

Behaviour:

- Show dashboard.
- Detect the top 3 learning signals.
- Ask only high-impact improvement decisions.
- Produce retro action register.
- Allow lightweight sync handoff.

### `--standard`

Default mode.

Behaviour:

- Analyze full lifecycle evidence.
- Walk the user through material improvement decisions one by one.
- Capture human friction and agent usefulness when relevant.
- Produce action register and sync handoff.

### `--strict`

Use for high-risk, debt-heavy, failed, overridden, or learning-rich changes.

Behaviour:

- Requires stronger evidence.
- Requires disposition for every major learning signal.
- Challenges vague “no action” on repeated issues.
- Produces explicit governance/process improvement recommendations.

## Flags

### `--dry-run`

Do not write durable files except an optional dry-run report when requested. Show dashboard, learning signals, proposed actions, and sync handoff preview.

### `--yes`

May skip repeated confirmations for already-selected safe actions. It must not silently create semantic governance artifacts such as rules, gates, ADRs, or agent contract amendments.

### `--period <date-range>`

Run a periodic retrospective across multiple changes/reports.

### `--since <git-ref-or-date>`

Analyze CHAOS lifecycle evidence changed since a Git reference or date.

### `--all`

Analyze the full available CHAOS history. Use carefully on large repositories.

## Mode inference

When no mode is supplied, infer mode from evidence:

```text
--light
  documentation-only, test-only, small non-risky changes

--standard
  normal feature/change lifecycle

--strict
  archive-with-debt, verification waivers, governance override, repeated scope drift,
  security/auth/data/external-side-effect changes, or high learning load
```

Always show inferred mode and rationale before continuing.
