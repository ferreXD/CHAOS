# `chaos:propose` Runtime Question Bank

The command should not ask questions that repository evidence already answers.

Use questions only when answers materially affect proposal scope, approach, OpenSpec artefacts, confidence, or implementation readiness.

Ask one decision at a time.

## Change intent

```text
Decision needed: change classification

I need to classify this change before proposing an approach.

Detected intent:
<summary>

Recommended classification:
<NEW_CAPABILITY|BROWNFIELD_CHANGE|BUGFIX|...>
Confidence: <HIGH|MEDIUM|LOW>

Options:
1. Accept recommended classification
2. Choose a different classification
3. Provide more context
4. Stop
```

## Scope decision

```text
Decision needed: proposal scope

The request could include multiple responsibilities.

Recommended scope:
- Include: <...>
- Exclude: <...>

Why this matters:
Scope determines OpenSpec proposal/design/spec/tasks and prevents implementation drift.

Options:
1. Accept recommended scope
2. Add/remove scope items
3. Defer unclear scope and lower confidence
4. Stop
```

## Evidence / archaeology waiver

```text
Decision needed: evidence waiver

This looks like brownfield or behaviour-preserving work, but I did not find an archaeology file.

Recommended action:
Run or create archaeology before finalizing the proposal.
Confidence: MEDIUM/LOW

Options:
1. Run chaos:archaeology first
2. Continue and record evidence waiver
3. Provide equivalent evidence now
4. Reclassify as new work
5. Stop
```

## Approach selection

```text
Decision needed: implementation approach

Candidate approaches:
1. Conservative — <summary>
2. Balanced — <summary>
3. Strategic — <summary>

Recommended: <option>
Confidence: <HIGH|MEDIUM|LOW>

Options:
1. Use recommended approach
2. Use another candidate approach
3. Combine approaches
4. Provide custom approach
5. Defer and generate pre-proposal only
6. Stop
```

## Persistence/data decision

```text
Decision needed: persistence strategy

The proposal appears to require persisted data, but the persistence approach is not explicit.

Recommended: <module-owned table / existing table / no persistence / etc.>
Confidence: <HIGH|MEDIUM|LOW>

Options:
1. Accept recommended persistence approach
2. Choose alternative persistence approach
3. Keep persistence out of scope
4. Defer with rationale
5. Stop
```

## Test/validation task decision

```text
Decision needed: validation strategy

The proposal changes observable behaviour but does not yet define test expectations.

Recommended amendment:
Add explicit tasks for unit/integration/contract validation.
Confidence: HIGH

Options:
1. Add suggested test tasks
2. Add custom test tasks
3. Defer tests with rationale
4. Mark accepted risk and continue
5. Stop
```

## Test-toolchain mandate check

Before generating test task sections in `tasks.md`, check the decision log
(`docs/decision-log/`) for mandates on:

- assertion library (e.g., AwesomeAssertions — do not nominate FluentAssertions or
  MSTest assertions if a decision log entry mandates a different library);
- mocking framework;
- test runner or test project structure.

If a mandate exists and contradicts the default or proposed test tasks, surface it as a
decision event candidate:

```text
Decision needed: test-toolchain mandate alignment

I found a decision-log entry mandating <assertion library / mocking framework / test runner>.
The proposed test tasks currently nominate <conflicting choice>.

Recommended action:
Align test tasks with the decision-log mandate before finalizing tasks.md.
Confidence: HIGH

Options:
1. Apply decision-log mandate to test tasks now
2. Record the mandate and defer alignment to chaos:review
3. Override mandate with rationale (record as PROP-DEC-*)
4. Stop
```

Provenance: RETRO-DEC-006 (implement-file-storage-foundation retro, 2026-06-30). SIG-06: AwesomeAssertions mandate in decision log was not consulted during chaos:propose; gap caught during chaos:review (REV-DEC-002).

## Task-wiring completeness check

Before finalizing `tasks.md`, for every task that introduces a new DI-registration
extension method (e.g. `AddXModule()`, `AddXPolicies()`) or a new data/read contract with
a field list, verify:

- there is a corresponding task that itemizes wiring the extension into its consumer or
  the composition root (do not assume "built" implies "wired");
- every field in the contract has a task specifying its data source.

If either is missing, surface it:

```text
Decision needed: task-wiring completeness

Task <id> introduces <DI extension / data contract> but no task itemizes
<wiring it into the composition root / sourcing field <name>>.

Recommended action:
Add the missing wiring/data-source task now.
Confidence: HIGH

Options:
1. Add the missing task now
2. Provide custom task text
3. Defer with rationale (record as PROP-DEC-*)
4. Stop
```

Provenance: RETRO-ACTION-001 (implement-authorization-pipeline retro, 2026-07-06). SIG-01:
a DI-registration extension (`AddAuthorizationModule()`) was built with no task itemizing
its composition-root call site, breaking DI validation until caught mid-apply (APP-DEC-002);
a data contract's field list needed 3 tables beyond what was originally scoped (APP-DEC-001).

## Cross-cutting layer state-assumption check

Before tasking a cross-cutting check that depends on caller identity or other ambient
state (e.g. an Application-layer command-attribute-driven authorization check), verify
that the state it depends on is actually resolvable at that layer today — not assumed to
become available later.

```text
Decision needed: layer state-assumption check

This design introduces a <layer> check that depends on <caller identity/other state>.

Detected: <state> is currently only populated by <HTTP middleware/other layer-specific
mechanism>, which may not run for every invocation path this check is meant to cover.

Recommended action:
Confirm the state-resolution path exists for every invocation path before tasking
implementation, or scope the check to only the paths where it does.
Confidence: HIGH

Options:
1. Confirm the state-resolution path and proceed
2. Narrow the check's scope to covered paths
3. Design a new state-resolution mechanism first (may require its own decision/ADR)
4. Defer with rationale
5. Stop
```

Provenance: RETRO-ACTION-002 (implement-authorization-pipeline retro, 2026-07-06). SIG-02:
a command-attribute-driven dispatch-pipeline check (design.md D4) was fully built during
apply before discovering the Application layer had no non-HTTP-coupled identity-resolution
path — the same limitation the check itself was meant to cover for non-HTTP invocations
(APP-DEC-004).

## OpenSpec creation

```text
Decision needed: OpenSpec output

OpenSpec is <available|missing|unclear>.

Options:
1. Create/update OpenSpec change now
2. Create only CHAOS pre-proposal brief
3. Initialize/fix OpenSpec first
4. Stop
```

## Proposed ADR posture

```text
Decision needed: ADR status handling

I found ADRs marked Proposed.

Options:
1. Treat them as accepted working posture for this proposal
2. Treat them as non-binding guidance only
3. Use only ADRs explicitly marked Accepted
4. Stop and clarify governance first
```

## Deferred decision

When the user defers:

```text
Please provide a short rationale for deferring this decision.

This will be recorded as a Decision Event and may reduce proposal confidence.
```
