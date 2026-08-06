# Resume Capsule Contract (consumer view)

The resume capsule is the compact handoff that lets CHAOS continue without chat
memory. Schema: `.chaos/interactions/schema/resume-capsule.schema.json`.
Authoring contract: `.chaos/interactions/contracts/resume-capsule-contract.md`.

## Required fields (STOP if any are missing)

A valid capsule for resume must include:

- `commandRunId`
- `sourceCommand`
- `changeId` (unless a repository-global command)
- `state` — `ready-to-resume` (or a resumed-compatible state)
- `lastCompletedStep`
- `nextStep`
- `answeredDecisionIds`
- `contextCapsule` (intent, approvedScope, constraints, openRisks; optionally
  selectedPath, assumptions, confidenceCaps, forbiddenActions)
- `requiredArtifacts` (if applicable)
- `confidence`, `knowledgeType`

If a required field is missing or empty, **STOP and report exactly which fields
are missing**. Do not invent values.

## Validation checklist

Before continuing, verify:

- session exists and is `ready-to-resume` (or resumed-compatible);
- every `answeredDecisionIds` entry exists as a decision;
- those decisions are `answered` (or already `consumed`) with valid responses;
- the selected option in each response exists in the decision's options;
- required rationale is present where the decision demanded it;
- `requiredArtifacts` exist on disk — in `--strict`, a missing artifact is a
  STOP; in `--standard`, disclose the missing artifact and proceed only if safe;
- a lock exists for the change, or its absence is explainable;
- `sourceCommand` is a known CHAOS command;
- `nextStep` is present and non-empty.

## Compactness

Capsules reference artifacts by path and must not embed large report bodies. Read
`requiredArtifacts` only when needed for correctness (token economy). Read the
capsule before reading full reports.

## Confidence handling

- `--strict`: if `confidence` is LOW or any required artifact is missing, require
  explicit user confirmation before resuming.
- File-fallback (MCP unavailable): cap effective confidence to MEDIUM unless
  direct file validation is strong.
