# OpenSpec Integration Contract

CHAOS uses OpenSpec as the spec motor.

`chaos:propose` is a wrapper around OpenSpec proposal creation, not a replacement for OpenSpec.

## Hard OpenSpec invocation gate (mandatory, model-portable)

`chaos:propose` MUST use OpenSpec as the proposal engine. This behaviour must not depend
on the model inferring intent — it is a hard, ordered gate.

Before manually writing any proposal artifacts, `chaos:propose` MUST:

1. **Detect** OpenSpec availability from `.chaos/config.yaml`
   (`project.specEngine: openspec`, `toolchain.openspec`, `validation.openspec`) or default
   command/path conventions (`opsx-propose.prompt.md`, `openspec` CLI, `openspec/changes/`).
2. **Invoke** the OpenSpec proposal workflow / command appropriate for the repository
   (`opsx-propose.prompt.md` or the `openspec-propose` skill).
3. **Confirm** the OpenSpec change folder exists (`openspec/changes/<change-id>/`).
4. **Confirm** proposal/spec/task artifacts were created or updated.
5. **Validate** using the configured command when available
   (`openspec validate <change-id> --strict`).
6. **Only then** apply CHAOS wrapping: confidence, decision events, archaeology
   references, lifecycle updates, review routing, governance recommendations.

### Forbidden

- Manually replacing OpenSpec proposal generation when OpenSpec is available.
- Creating ad-hoc proposal/design/tasks files outside the OpenSpec workflow.
- Proceeding as if OpenSpec was invoked when it was not.
- Hiding OpenSpec failure behind a successful CHAOS proposal.

### Degraded-mode handling (decision-gated; record it)

- **`--strict`:** if OpenSpec is unavailable or cannot be invoked, **block**.
- **`--standard`:** ask the user whether to continue in degraded mode, STOP for an explicit
  choice, and cap confidence to MEDIUM.
- **`--light`:** **auto-escalate to `--standard`** (the light valve — announce, record `ESC-*`,
  set `escalatedFrom: light`; light never skips the spec silently), then apply the standard
  handling above.
- Degraded mode must be explicitly recorded as a `PROP-DEC-*` decision event and reflected
  in the OpenSpec Invocation Proof.

## CHAOS overlay invocation rules

`chaos:propose` is an **overlay** on OpenSpec: OpenSpec creates and owns the proposal
artifacts; CHAOS wraps them with governance. These rules make the invocation explicit so it
does not depend on the model inferring how to call OpenSpec.

### Acceptable invocation paths (in priority order)

1. **`opsx-propose.prompt.md "<change-name-or-intent>"`** — the experimental OpenSpec propose
   command. Preferred when available.
2. **The `openspec-propose` skill** — invoke it with the change name/intent. Equivalent to
   path 1.
3. **Drive the `openspec` CLI directly**, following the `openspec-propose` steps:
   1. Derive a kebab-case change name from the intent (e.g. "add user auth" → `add-user-auth`).
   2. `openspec new change "<name>"`.
   3. `openspec status --change "<name>" --json` — parse `applyRequires`, `artifacts`,
      `planningHome`, `changeRoot`, `artifactPaths`, `actionContext`. **Use these paths; do
      not assume repo-local paths.**
   4. For each ready artifact: `openspec instructions <artifact-id> --change "<name>" --json`,
      then write the artifact to its `resolvedOutputPath` using the returned `template`.
   5. Re-run `openspec status` until all `applyRequires` artifacts are `done`.

Paths 1–3 are all first-class OpenSpec invocation — path 3 is **not** a degraded fallback.
Hand-writing OpenSpec-shaped files **without** any of these paths is forbidden as an
automatic action and is treated as decided-gated degraded mode (see below).

### Overlay hand-off sequence

1. **Pass the CHAOS brief into OpenSpec.** Supply intent, change classification, risk,
   ADR/rule constraints, archaeology references, and approach-aligned decisions as input/
   context to the OpenSpec proposal generation. Let OpenSpec own artifact content and paths.
2. **Capture what OpenSpec used.** Record the change id/name and the actual artifact paths
   returned by `openspec status --json` (`changeRoot`/`resolvedOutputPath`).
3. **Do not duplicate.** Never copy OpenSpec `proposal.md`/`design.md`/`specs/`/`tasks.md`
   into `.chaos/` as a second source of truth.
4. **Resume the CHAOS overlay.** After OpenSpec returns, validate
   (`openspec validate <change-id> --strict` when available), then apply CHAOS wrapping:
   confidence, `PROP-DEC-*` decision events, lifecycle manifest, review routing, governance
   recommendations.
5. **Prove it.** Record the actual invocation path used (command/skill/CLI) in the OpenSpec
   Invocation Proof section.

### Material decision needs returned from OpenSpec

The OpenSpec propose surfaces carry a matching **CHAOS invocation overlay**
(`.github/skills/openspec-propose/SKILL.md`, `.github/prompts/opsx-propose.prompt.md`). Under
CHAOS they do **not** auto-decide material questions or ask the user directly for material
decisions; they **return the decision need** to this orchestrator. When that happens:

1. Resolve it via the interactive decision protocol (one decision, present options +
   recommendation, **STOP and wait** for the user's choice).
2. Record a `PROP-DEC-*` decision event.
3. Resume OpenSpec generation with the recorded answer.

Never let the OpenSpec surface use "reasonable decisions to keep momentum" for material
scope, design, risk, governance, or source-of-truth choices.

## OpenSpec Invocation Proof (required report section)

Every `chaos:propose` report MUST include this section, filled honestly:

```md
## OpenSpec Invocation

Status: INVOKED / UNAVAILABLE / FAILED / DEGRADED_WITH_USER_APPROVAL

Configured OpenSpec command: <command or unknown>

Actual invocation:
<command/workflow used>

Generated/updated OpenSpec artifacts:
- <path>

Validation command: <command or not run>

Validation result:
<PASS / FAIL / NOT_RUN>

Confidence impact:
<none / capped to MEDIUM / capped to LOW>
```

## Required source-of-truth rule

The authoritative proposal artefacts belong to OpenSpec:

```text
openspec/changes/<change-id>/
  proposal.md
  design.md
  specs/
  tasks.md
```

Exact paths may differ depending on the repository's OpenSpec configuration. The command must inspect the repo before assuming paths.

## If OpenSpec is available

The command should:

1. Inspect existing OpenSpec configuration/specs.
2. Invoke OpenSpec via one of the acceptable invocation paths (see **CHAOS overlay
   invocation rules**): `opsx-propose.prompt.md`, the `openspec-propose` skill, or driving the
   `openspec` CLI. All three are first-class OpenSpec invocation.
3. If **none** of the invocation paths can run, do **not** automatically hand-write
   OpenSpec-shaped artefacts. Treat this as a degraded condition and apply the
   **decision-gated degraded mode** below (ask the user, stop for the choice, cap
   confidence, record it). There is no automatic fallback generation.
4. Run or request `openspec validate <change-id> --strict` when possible.
5. Record validation status as run / not run / failed / unavailable.

## If OpenSpec is not available (or cannot be invoked)

The command must not pretend OpenSpec is initialized, and must not silently hand-fabricate
OpenSpec artefacts. There is no automatic fallback generation — every degraded outcome is
an explicit, decision-gated choice that is recorded as a `PROP-DEC-*` event:

- **`--strict`:** block. Do not produce ad-hoc artefacts.
- **`--light`:** auto-escalate to `--standard` first (the light valve), then proceed as standard.
- **`--standard`:** ask the user (one decision, then STOP) to choose between:
  1. initialize OpenSpec first, then re-run the gate;
  2. produce a CHAOS pre-proposal brief only at
     `.chaos/changes/<change-id>/pre-proposal-brief.md` (cap confidence);
  3. authorize draft OpenSpec-shaped artefacts under OpenSpec conventions (only after
     explicit confirmation; cap confidence);
  4. stop / defer.
- Derive a provisional CHAOS change-id slug from the intent when OpenSpec has not minted a
  change id, so the change folder can be created. Record the degraded path in the OpenSpec
  Invocation Proof.

## OpenSpec validation handling

Never fabricate validation results.

Record:

```md
## OpenSpec validation

Status: PASSED | FAILED | NOT_RUN | UNAVAILABLE
Command attempted: ...
Result summary: ...
Reason if not run: ...
```

## Relationship with `chaos:review`

`chaos:propose` creates the proposal.

`chaos:review` reviews the proposal before implementation.

The end of `chaos:propose` must recommend:

```text
Next recommended command: chaos:review <change-id>
```

For strict/high-risk changes, review is mandatory before implementation.
