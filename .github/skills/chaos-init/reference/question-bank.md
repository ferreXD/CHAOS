# CHAOS init question bank

Use this bank only after discovery. Do not ask questions already answered by repository evidence.

## Mandatory confirmation questions

Ask these when applicable.

### Proposed ADR handling

```text
I found ADRs marked Proposed. Should these be treated as:
1. accepted working posture for CHAOS,
2. proposed working posture requiring review, or
3. context only?
```

Do not treat Proposed ADRs as accepted working posture without explicit confirmation.

### Major track exclusion

```text
I found a major documentation track for <track>, but the requested CHAOS scope appears focused on <scope>.
Should <track> be:
1. included as active scope,
2. included as context-only, or
3. excluded from this CHAOS workspace?
```

Do not exclude a major track without explicit confirmation.

### Existing file overwrite

```text
I found an existing <file>. Should I:
1. preserve and append,
2. update surgically,
3. replace it, or
4. leave it untouched?
```

### Conflict resolution

```text
I found conflicting guidance between <source A> and <source B> about <topic>.
Should I record this as unresolved, or do you want to choose a working posture now?
```

## Required when missing

1. What is the primary project objective?
2. Is this project greenfield, brownfield, migration, product evolution, support/maintenance, or mixed?
3. Who is the intended user/team for the CHAOS workspace?
4. Which documents are authoritative: ADRs, specs, README, tickets, user input, or another source?
5. Should generated CHAOS files be treated as draft, proposed, or accepted working posture?
6. Should README.md be generated, updated, or left untouched?
7. Are there hard constraints not visible in the repository, such as timeline, budget, compliance, compatibility, client commitments, team skill, or deployment restrictions?
8. What is explicitly out of scope?


## Config questions

Ask these only when the value cannot be inferred safely from repository evidence or when an existing `.chaos/config.yaml` conflicts with detected evidence.

### Project conventions

```text
I could not confidently infer the project conventions for `.chaos/config.yaml`.
Should I use these defaults?

- project.type: dotnet
- primaryLanguage: csharp
- specEngine: openspec
- ADR path: docs/adr
- decision-log path: docs/decision-log
- default build command: dotnet build
- default test command: dotnet test
```

### Existing config conflict

```text
I found an existing `.chaos/config.yaml` value that conflicts with repository evidence:

- config: <config value>
- detected: <detected value>

Should I:
1. preserve the existing config,
2. update it to match detected evidence,
3. use a custom value, or
4. defer and record the conflict?
```

### Protected file policy

```text
Should `.chaos/config.yaml` keep `AGENTS.md` and root `README.md` protected from silent edits?

Recommended: yes. Commands may propose patches, but semantic edits require explicit confirmation.
```

### Validation commands

```text
Which default validation commands should CHAOS record in `.chaos/config.yaml`?

Recommended for this repository:
- build: <detected-or-default-build-command>
- test: <detected-or-default-test-command>
- OpenSpec validation: openspec validate --strict
```

## Ask only when relevant

### Brownfield / migration

- What existing behavior must be preserved?
- Are compatibility wrappers allowed?
- Is refactoring allowed during migration or only behavior-preserving translation?
- What is the rollback posture?
- Who validates behavioral equivalence?

### Architecture

- Is the current architecture selected, proposed, or exploratory?
- Which ADRs are accepted vs draft?
- Are there known ADR conflicts?
- Are there technology choices imposed externally?

### Delivery and estimation

- Are estimates required?
- Should estimates be single-point, ranged, confidence-banded, or scenario-based?
- What scope is explicitly deferred?
- Are there politically imposed constraints that must be represented honestly?

### README

- Should README target developers, stakeholders, operators, or all three?
- Should README describe product usage, engineering workflow, local setup, or CHAOS governance?
- Should existing README content be preserved as-is, appended to, or rewritten?

## Compact confirmation pattern

When evidence is strong, ask compact confirmation questions like:

```text
I found enough evidence to bootstrap CHAOS.

Detected:
- Brownfield migration
- ADR-backed architecture
- Existing target architecture decisions
- Missing explicit command/gate definitions

Before generation, confirm:
1. Should ADRs with status Proposed be treated as accepted working posture or proposed working posture?
2. I found a MAUI/mobile documentation track. Should it be active scope, context-only, or excluded?
3. Should README.md be generated/updated?
4. Should CHAOS optimize for migration workflows, product development workflows, or both?
```
