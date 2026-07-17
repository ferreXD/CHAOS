# Verification Contract

## Definition

`chaos:verify` is the post-implementation confidence/archive-readiness gate.

It checks whether the implementation produced by `chaos:apply` satisfies the approved OpenSpec change and CHAOS governance requirements.

## It verifies

- OpenSpec structural validity;
- task completion integrity;
- spec-to-implementation traceability;
- implementation evidence;
- test/build evidence;
- ADR/rule/decision alignment;
- scope drift;
- decision-event completeness;
- archive readiness.

## Implementation inspection — required checks (worker/background & deferred-migration changes)

Provenance: RETRO-ACTION-001 (`keyed-outbox-writer-category2-redrive` retro, 2026-07-13). CR-001 — a new worker
poll-cycle step that could halt core outbox delivery on a coordination-scan fault (most concretely before its
deferred client-pipeline migration was applied) — passed `chaos:verify` and was only caught by the later
`chaos:code-review`. For a change touching a **worker/background poll cycle, hosted service, or startup path**,
Implementation Inspection MUST verify:

- **Secondary-path fault isolation.** A newly added secondary/coordination step (e.g. a step that runs before or
  alongside the existing critical work in a cycle) is fault-isolated so a fault in the new step cannot skip,
  block, or abort the existing critical path. A shared `try`/`catch` that lets a new step's failure prevent the
  primary work is a finding.
- **Deferred-migration tolerance.** New code that queries a table/column behind a **deferred (client-pipeline)
  migration** (R-010; DB apply gated to the client pipeline) tolerates the object's absence until the migration is
  applied — it must not fault every cycle (or at startup) against an environment where the migration has not yet
  run. Verify this whenever the change adds a table/column with `chaos:apply` DB-apply deferred.

When these checks cannot be evidenced for an applicable change, record a finding and cap confidence; do not pass a
clean verdict on assumed isolation. (Also prefer running `chaos:code-review` **before** `chaos:verify`, per
`AGENTS.md` — the earlier gate is where this class of defect is cheapest to catch.)

## It does not

- design the solution;
- approve the proposal before implementation;
- implement missing production code;
- silently mutate OpenSpec or CHAOS governance files;
- replace `chaos:sync` or ADR generation.

## Required output

v0 change-scoped layout (legacy `.chaos/verification/<change-id>-verification.md`
read-only for compatibility; do not migrate):

```text
.chaos/changes/<change-id>/verification.md
```

Reads change-folder inputs when present: `.chaos/changes/<change-id>/lifecycle.md`,
`apply-report.md`, `proposal-review.md`, `decision-events.md`, `waivers.md`.
Canonical layout: `.chaos/changes/README.md`.

## Required final sections

- Verification Dashboard
- Scope and Inputs
- Toolchain and Validation Evidence
- Source Manifest
- OpenSpec Validation
- Task Completion Integrity
- Spec Traceability Matrix
- Implementation Inspection
- Scope Drift Analysis
- Decision Event Audit
- Test/Build Evidence
- Findings Register
- Runtime Remediation Log
- Waiver / Accepted Risk Ledger
- Confidence Caps Applied
- Archive Readiness
- Final Verdict
- Closure Summary
