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
