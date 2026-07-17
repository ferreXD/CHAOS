# chaos:status Mode Reference

## Default mode

```text
chaos:status
```

Default mode audits the repository and writes `.chaos/status-report.md`.

It should not ask questions unless a missing answer would materially change a blocking verdict and cannot be inferred from existing CHAOS files, bootstrap report, or user-provided context.

## Strict mode

```text
chaos:status --strict
```

Strict mode treats missing provenance, missing source status, undocumented scope exclusions, and ambiguous ADR status handling as blockers.

Use strict mode before adopting the CHAOS workspace as a team-level process.

## No-write mode

```text
chaos:status --no-write
```

No-write mode prints the report in chat and does not create or update `.chaos/status-report.md`.

Use this for dry runs, reviews, or external audits.

## JSON mode

```text
chaos:status --json
```

JSON mode emits a machine-readable summary in addition to the Markdown report.

The JSON block must still be embedded in `.chaos/status-report.md` unless `--no-write` is also supplied.

## Scoped mode

```text
chaos:status --scope architecture
chaos:status --scope rules
chaos:status --scope commands
chaos:status --scope gates
chaos:status --scope sources
chaos:status --scope config
chaos:status --scope toolchain
```

Scoped mode audits only the selected dimension and its dependencies.

Example: `--scope rules` still checks that decisions exist because rules must link back to decisions.


## Config scope

```text
chaos:status --scope config
```

Audits only `.chaos/config.yaml` and direct dependencies such as bootstrap-report provenance, protected-file policy, toolchain command source, validation command source, and path coherence.

## Toolchain scope

```text
chaos:status --scope toolchain
```

Audits required tools using `.chaos/config.yaml` commands when present and CHAOS defaults otherwise.
