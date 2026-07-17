# CHAOS output workspace contract

This document defines the files that `chaos:init` must generate or update.

## Required output

```text
AGENTS.md
.chaos/
  config.yaml
  bootstrap-report.md
  constitution.md
  context.md
  architecture.md
  changes/
    README.md          # canonical v0 collaboration contract (per-change layout, lifecycle manifest, naming, sync roles)
  decisions/
    index.md
  rules/
    index.md
  commands/
    index.md
  gates/
    index.md
```

The generated `.chaos/changes/README.md` documents the v0 team-safe collaboration model:
the per-change artifact layout (`.chaos/changes/<change-id>/`), the lifecycle manifest
template, the artifact-naming policy (date-prefixed slug filenames; sequential IDs in indexes
only), the team concurrency policy, and the `chaos:sync` role model. Generated `AGENTS.md` and
`.chaos/commands/index.md` must reference this collaboration model (team concurrency + mainline
sync). `chaos:init` scaffolds the `.chaos/changes/` workspace but does not create per-change
folders or migrate any legacy scattered report folders.

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

It must include the v0 sections defined in `reference/config-contract.md`:

- `version`
- `project`
- `paths`
- `agents`
- `toolchain`
- `validation`
- `policies`

It should centralise **where/how** information:

- CHAOS, OpenSpec, ADR, decision-log, report, archaeology, rule, gate, and command paths;
- Copilot and Claude specialist agent locations;
- required toolchain commands;
- default build/test/OpenSpec validation commands;
- protected-file policy for `AGENTS.md` and root `README.md`;
- confidence and decision-event policy toggles.

It must not contain:

- architectural decisions that belong in ADRs, rules, gates, or OpenSpec;
- secrets, credentials, tokens, connection strings, or environment-specific private data;
- hidden auto-approval or force-apply switches;
- command prompt bodies or giant rule definitions.

If `.chaos/config.yaml` already exists, preserve existing values by default and ask before semantic changes. Record config conflicts, inferred values, defaults, and user answers in `.chaos/bootstrap-report.md`.


## `AGENTS.md`

`AGENTS.md` is the agent-facing repo instruction entrypoint.

It must:

- route agents to `.chaos/context.md`, `.chaos/architecture.md`, `.chaos/constitution.md`, `.chaos/bootstrap-report.md`, and folder indexes;
- state minimum pre-edit behavior;
- identify mandatory review/gate expectations;
- note the v0 team collaboration model (per-change layout under `.chaos/changes/<change-id>/`,
  `chaos:sync --change` for contributors vs maintainer-confirmed `chaos:sync --all`, and mainline
  sync after merge into `main`), pointing to `.chaos/changes/README.md`;
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

## `.chaos/constitution.md`

Owns behavioral principles:

- human ownership;
- evidence before design;
- no silent assumptions;
- fact/inference/assumption separation;
- review before execution;
- ADR/rule compliance;
- no “agents go brrr” without evidence, gates, and human ownership;
- confidence and knowledge classification for every material judgement.

The constitution must include a dedicated confidence doctrine requiring all material findings and verdicts to declare:

- knowledge type: `FACT`, `INFERENCE`, `ASSUMPTION`, `UNKNOWN`, or `CONFLICT`;
- confidence: `HIGH`, `MEDIUM`, or `LOW`;
- verdict metadata: evidence coverage and assumption load.

Hard rule: no confidence-less verdicts, no unlabeled assumptions, and no inference disguised as fact. See `reference/confidence-model.md`.

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

## `.chaos/rules/index.md`

Owns executable constraints:

- rule ID;
- title;
- severity;
- scope;
- source decision/doc;
- rule statement;
- violation criteria;
- deferral/override policy.

Rules should be operational, not inspirational.

## `.chaos/commands/index.md`

Owns the public workflow surface.

Each command entry must include:

- command name;
- implementation status: `implemented`, `defined-only`, `planned`, or `external`;
- purpose;
- inputs;
- context loaded;
- output contract (change-scoped commands target `.chaos/changes/<change-id>/`; legacy scattered
  folders are read-only for compatibility);
- human decision points;
- forbidden behavior.

It must also document the v0 team collaboration model: the per-change artifact layout, the team
concurrency policy, and `chaos:sync --change` (contributor-safe) vs `chaos:sync --all`
(maintainer/repo-owner). Canonical contract: `.chaos/changes/README.md`.

At minimum, `chaos:init` must be marked `implemented`. Commands only described conceptually must be marked `defined-only`.

## `.chaos/gates/index.md`

Owns readiness checks:

- gate name;
- purpose;
- required evidence;
- blocking criteria;
- deferrable items;
- owner;
- output/verdict shape.

Gates must evaluate meaningful readiness, not just file presence.
