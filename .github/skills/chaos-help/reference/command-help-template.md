# Command Help Template

When the user asks `chaos:help <command>`, answer with this structure:

```md
# chaos:<command>

## Purpose

<One paragraph.>

## Use when

- <Scenario>

## Inputs

- <Files/artifacts/readiness>

## Outputs

- <Primary output artifact>

## Modes / flags

- `--light` ...
- `--standard` ...
- `--strict` ...

## May edit files?

<Yes/no, and which files.>

## Recommended next command

`chaos:<next>`

## Common blockers

- <Blocker>
```

Keep command help short unless the user asks for detail.
