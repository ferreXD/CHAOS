# Source inventory contract

`chaos:init` must record a source inventory in `.chaos/bootstrap-report.md`.

## Source status values

### `verified`

Use when the agent directly inspected the source during the run.

Examples:

- Read `docs/adr/adr-0001.md`.
- Read `README.md`.
- Listed repository directories and found `src/` and `tests/`.

### `missing`

Use when the agent expected or was pointed to a source but could not find or inspect it.

Examples:

- ADR index references `docs/adr/adr-0005.md`, but the file is absent.
- README says local setup is in `docs/setup.md`, but `docs/setup.md` is missing.

### `inferred`

Use when the agent used information not directly verified from a file during the run.

Examples:

- User described a project constraint in chat.
- A path is mentioned in an ADR but was not available in the current workspace.
- Repository structure suggests a backend project, but project files were not inspected.

## Required fields

Every inventory row must include:

- source path or description;
- type: ADR, README, spec, blueprint, decision log, repo structure, user input, existing instruction, other;
- status: verified, missing, inferred;
- used for: context, architecture, decisions, rules, commands, gates, README, bootstrap report;
- notes.

## Path rule

Do not present a source path as verified unless it was inspected during the run.
