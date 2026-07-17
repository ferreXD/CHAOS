# chaos:review Runtime Question Bank

The command should avoid asking questions unless the answer materially affects verdict, confidence, scope, or fixability.

Ask one decision/remediation question at a time.

## Target resolution

```text
I found multiple OpenSpec changes that match your request:
<list>

Which one should I review?
```

```text
I could not find an OpenSpec change.

Options:
1. Run chaos:propose first
2. Provide the change path manually
3. Stop
```

## Mode/risk mismatch

```text
You requested --light, but the change appears high-risk because <reason>.

Recommended: escalate to --strict
Confidence: <HIGH|MEDIUM|LOW>

Options:
1. Escalate to --strict
2. Continue as --light and record accepted risk
3. Use --standard
4. Stop
```

## Source-of-truth ambiguity

```text
Decision needed: ADR status handling

I found ADRs with status Proposed.

Options:
1. Treat them as accepted working posture for this review
2. Treat them as non-binding guidance only
3. Use only accepted ADRs
4. Stop and clarify governance first
```

## Missing archaeology

```text
Review issue: missing archaeology for brownfield/high-risk proposal

Why this matters:
The proposal claims behaviour preservation or modifies existing behaviour, but I cannot verify the current behaviour evidence.

Options:
1. Stop and run chaos:archaeology first
2. Continue with explicit evidence waiver and lower confidence
3. Provide equivalent evidence now
4. Reclassify the change as new work
5. Keep as blocking
```

## Fix missing test tasks

```text
Review issue: tasks.md lacks validation tasks

Suggested remediation:
Add explicit test/validation tasks covering acceptance criteria.

Options:
1. Apply suggested task amendment now
2. Provide custom test tasks
3. Defer with rationale
4. Mark accepted risk and continue
5. Keep as blocking
```

## Fix test-toolchain mandate gap

When the change includes test tasks, check the decision log (`docs/decision-log/`) for
mandates on assertion library, mocking framework, and test runner before finalizing the
review. If a mandate is present but not reflected in tasks.md, surface it:

```text
Review issue: test tasks do not reflect decision-log mandates

The change includes test tasks, but I found a decision-log mandate for
<assertion library / mocking framework / test runner> that is not reflected in tasks.md.

Why this matters:
Using a prohibited library (e.g., FluentAssertions instead of mandated AwesomeAssertions)
will require a rework during apply. Catching it here is zero-friction.

Suggested remediation:
Update tasks.md to name the mandated <library/framework> in the test task section.

Options:
1. Apply suggested amendment to tasks.md now
2. Provide custom amendment
3. Defer with rationale
4. Mark accepted risk and continue
5. Keep as blocking
```

Provenance: RETRO-DEC-006 (implement-file-storage-foundation retro, 2026-06-30).

## Fix task-wiring completeness gap

Check whether every task that introduces a new DI-registration extension method or a new
data/read contract with a field list has a matching task that wires it into its consumer
(composition root) or sources every contract field:

```text
Review issue: task-wiring completeness gap

Task <id> introduces <DI extension / data contract> but tasks.md does not itemize
<wiring it into the composition root / sourcing field <name>>.

Why this matters:
An unwired DI registration or an unsourced contract field will surface as a stop-and-decide
interruption mid-apply rather than being caught here.

Suggested remediation:
Add the missing wiring/data-source task to tasks.md now.

Options:
1. Apply suggested task amendment now
2. Provide custom task text
3. Defer with rationale
4. Mark accepted risk and continue
5. Keep as blocking
```

Provenance: RETRO-ACTION-001 (implement-authorization-pipeline retro, 2026-07-06).

## Fix layer state-assumption gap

When a design introduces a cross-cutting check that depends on caller identity or other
ambient state, verify the state-resolution path actually exists at that layer for every
invocation path the check is meant to cover — not just the HTTP path.

```text
Review issue: layer state-assumption not verified

The design introduces a <layer> check depending on <state>, but I cannot confirm
<state> is resolvable outside <HTTP middleware/other layer-specific mechanism> for
every invocation path this check claims to cover.

Suggested remediation:
Confirm the state-resolution path before apply, or narrow the check's scope to covered
paths and record the narrowing as a decision.

Options:
1. Apply suggested scope narrowing now
2. Request confirmation of the state-resolution path before approval
3. Defer with rationale
4. Mark accepted risk and continue
5. Keep as blocking
```

Provenance: RETRO-ACTION-002 (implement-authorization-pipeline retro, 2026-07-06).

## Fix clause-level evidence gap (brownfield/equivalence-first)

For brownfield/equivalence-first changes (R-008), evidence-coverage checks must operate
at the clause level, not just the topic level: for each SHALL requirement bearing a
specific behavioral detail (a filter, condition, or exclusion), confirm that detail traces
to a specific evidence citation — not merely that the requirement's general topic area has
evidence coverage.

```text
Review issue: unevidenced behavioral clause in spec

Requirement "<requirement text>" in <spec file> claims <specific behavioral detail>,
but I cannot find an evidence citation (legacy code, test, or archaeology finding)
specifically supporting that detail.

Why this matters:
For an equivalence-first change, an unevidenced claim in the spec can silently diverge
from actual legacy/implementation behavior and reach archive undetected.

Suggested remediation:
Either cite the specific evidence for this clause, or correct the spec to describe only
what is actually evidenced/implemented.

Options:
1. Apply suggested spec correction now
2. Provide the missing evidence citation
3. Defer with rationale
4. Keep as blocking
5. Stop
```

Provenance: RETRO-ACTION-004 (implement-authorization-pipeline retro, 2026-07-06). SIG-06:
a spec claimed an unimplemented "non-deleted" permission filter, not sourced from any
evidence citation, not present in the implementation or in legacy; this passed review's
topic-level evidence-coverage check and was caught only by an independent specialist
re-read during chaos:verify (VFY-DEC-001).

## Fix unclear scope

```text
Review issue: proposal scope is ambiguous

Suggested remediation:
Add explicit In Scope / Out of Scope sections to proposal.md.

Options:
1. Apply suggested scope amendment now
2. Provide custom scope wording
3. Defer with rationale
4. Keep as blocking
5. Stop
```

## Fix design/spec mismatch

```text
Review issue: design.md and specs disagree

Suggested remediation:
<concrete amendment>

Options:
1. Apply suggested amendment to <file>
2. Provide custom amendment
3. Keep conflict and block approval
4. Stop
```

## Approval handoff

```text
The proposal is eligible for approval <with/without conditions>.

Do you want me to create `.chaos/changes/<change-id>/approval.md`?

Options:
1. Create approval artefact
2. Do not create approval artefact
3. Add approval conditions first
```

## Deferred decision rationale

```text
Please provide a short rationale for deferring this issue.

It will be recorded as a `REV-DEC-*` Decision Event and may lower confidence or prevent approval readiness depending on mode/severity.
```
