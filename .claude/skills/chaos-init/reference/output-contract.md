# CHAOS output workspace contract

This document defines the files that `chaos:init` must generate or update.

## Required output (lean core, 2026-08)

```text
AGENTS.md
.chaos/
  config.yaml
  bootstrap-report.md
  context.md
  architecture.md
  decisions/
    index.md
docs/adr/              # created if absent; existing ADRs discovered and indexed
```

`architecture.md` and `docs/adr/` are the **crossing sources** the `chaos:run` pre-code
stop checks intent against — recording owner-confirmed postures here is what makes a
future stop able to catch a contradiction (the measured B2 pattern). `AGENTS.md` carries
the ask-hard standing instruction: *surface uncertainty at the stop rather than resolve it
silently*. `.chaos/decisions/` holds the one-page per-change decision records written by
`chaos:run`.

Not scaffolded anymore (retired with the apparatus, tag `apparatus-final`):
`constitution.md`, `rules/`, `gates/`, `commands/`, `.chaos/changes/`.

## Optional output

```text
README.md
```

Generate or update `README.md` only if:

- no README exists and the user allows README generation;
- the user explicitly requests README generation;
- the existing README is clearly a placeholder and the user allows replacement or augmentation;
- guided mode reaches the README section and the user approves.

Never destructively overwrite an existing README without preserving prior content or asking for approval.

## `.chaos/bootstrap-report.md`

Mandatory audit trail for every `chaos:init` run.

It must include:

- mode used: default / `--auto` / `--guided`;
- timestamp if available from the execution environment;
- generated/updated files;
- questions asked and user answers;
- scope decisions;
- major tracks discovered and their inclusion status;
- ADR status handling, especially how `Proposed` ADRs were treated;
- source inventory with `verified`, `missing`, or `inferred` status;
- assumptions accepted;
- conflicts detected;
- open questions;
- command implementation status;
- config generation status and config inference/provenance;
- next recommended command.

The bootstrap report is not optional. It is part of the CHAOS acceptance contract.

## `.chaos/config.yaml`

Owns repository conventions used by CHAOS commands.

It must include the sections defined in `reference/config-contract.md`:

- `version`
- `project`
- `paths`
- `toolchain`
- `validation`
- `specGate`
- `policies`

It should centralise **where/how** information:

- CHAOS, OpenSpec, ADR, and decision-record paths;
- Claude specialist agent identity (when the repo uses one);
- required toolchain commands;
- default build/test/OpenSpec validation commands;
- the spec-gate thresholds `chaos:run` evaluates at the stop;
- protected-file policy for `AGENTS.md` and root `README.md`.

It must not contain:

- architectural decisions that belong in ADRs, `architecture.md`, or OpenSpec;
- secrets, credentials, tokens, connection strings, or environment-specific private data;
- hidden auto-approval or force-apply switches;
- command prompt bodies or giant rule definitions.

If `.chaos/config.yaml` already exists, preserve existing values by default and ask before semantic changes. Record config conflicts, inferred values, defaults, and user answers in `.chaos/bootstrap-report.md`.


## `AGENTS.md`

`AGENTS.md` is the agent-facing repo instruction entrypoint.

It must:

- route agents to `.chaos/context.md`, `.chaos/architecture.md`, `.chaos/bootstrap-report.md`,
  `docs/adr/`, and the decision-record index (`.chaos/decisions/index.md`);
- state minimum pre-edit behavior (targeted read incl. the crossing sources; ask-hard);
- state that material change flows through `chaos:run` — one pre-code stop, honest verify,
  a decision record;
- carry the confidence doctrine: material findings and verdicts declare knowledge type
  (`FACT` / `INFERENCE` / `ASSUMPTION` / `UNKNOWN` / `CONFLICT`) and confidence
  (`HIGH` / `MEDIUM` / `LOW`); no confidence-less verdicts, no unlabeled assumptions, no
  inference disguised as fact (see `reference/confidence-model.md`);
- remain short enough to be useful as always-on agent context.

It must not:

- duplicate all ADRs;
- become a giant architecture document;
- contain long one-off prompts;
- silently override project decisions.

## `.chaos/context.md`

Owns project reality:

- project summary;
- domain summary;
- actors/users;
- important flows;
- constraints;
- environments;
- glossary;
- known facts vs assumptions;
- scope decisions and track handling;
- open questions.

If a major documentation track is excluded from active scope, the file must link to the confirmation recorded in `.chaos/bootstrap-report.md`.

## `.chaos/architecture.md`

Owns target technical posture:

- architecture style;
- module/boundary model;
- runtime/deployment model;
- data access posture;
- API strategy;
- authentication/authorization posture;
- observability/release safety posture;
- side-effect/integration strategy;
- testing/release posture;
- non-goals;
- confidence and open questions.

Architecture content must distinguish:

- accepted decisions;
- proposed working posture;
- inferred posture;
- unresolved conflicts.

## `.chaos/decisions/index.md`

Owns decision lookup:

- decision area;
- source docs;
- source status;
- selected/proposed posture;
- operational consequences;
- open questions;
- conflicts.

It must not copy whole ADRs.
