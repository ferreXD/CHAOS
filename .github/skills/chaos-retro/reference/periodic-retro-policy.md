# Periodic Retro Policy

Periodic retros analyze patterns across multiple changes.

## Invocation

```text
chaos:retro --period 2026-06
chaos:retro --since main
chaos:retro --all
```

## Focus

Periodic retros should prioritize repeated patterns:

```text
repeated confidence downgrades
repeated missing tests
repeated decision events during apply
repeated archive-with-debt
repeated sync debt
repeated governance overrides
repeated missing archaeology for brownfield changes
repeated prompt/question failures
```

## Output

```text
.chaos/retros/periodic-<period>-retro.md
```

## Avoid excess detail

Periodic retros should not re-review every change in full. They should summarize patterns and produce high-value action recommendations.
