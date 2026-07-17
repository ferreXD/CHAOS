# chaos:review UX Flow

## Default UX

1. User invokes:

```text
chaos:review <change-id> --standard
```

1. Agent resolves target and summarizes:

```text
I found OpenSpec change `<change-id>`.
Mode: standard.
Detected risk: medium.
Detected change type: new capability / brownfield change / etc.
I will review proposal/design/spec/tasks against CHAOS rules and ADRs.
```

1. If target or scope is ambiguous, ask one compact clarification question.

1. Run non-mutating checks first.

1. Detect issues and classify each issue by severity, confidence, and fixability.

1. Before finalizing the report, run the Runtime Remediation Loop for material/fixable issues:
   - explain issue;
   - propose remediation;
   - ask whether to apply, customize, defer, accept risk, keep blocking, or stop;
   - record each answer as a `REV-DEC-*` Decision Event;
   - patch only OpenSpec/CHAOS artefacts after explicit confirmation;
   - re-read/re-evaluate affected artefacts.

1. Generate review report.

1. Return short summary and next action.

## Good UX rules

- Do not ask for information that can be read from files.
- Do ask when a major decision affects verdict.
- Ask one decision/remediation question at a time.
- Summarize detected scope before review when ambiguous.
- Do not force archaeology for new capabilities.
- Do require archaeology or explicit waiver for strict brownfield review.
- Always explain confidence downgrades.
- Offer remediation actions in priority order.
- Offer approval handoff only when eligible.
- Do not dump issues without offering guided fixes when fixes are safe and in scope.

## Clarification triggers

Ask the user before proceeding if:

- Multiple OpenSpec changes match the request.
- No OpenSpec change exists and the user seems to be asking for proposal generation instead.
- The change appears high-risk but the user requested `--light`.
- The proposal excludes a major track detected in docs.
- Archaeology appears required but is missing.
- ADRs marked Proposed are being treated as accepted without an existing CHAOS bootstrap decision.
- A review finding is fixable only by a user/product decision.
- The change includes test tasks but `tasks.md` does not reflect decision-log mandates on assertion library, mocking framework, or test runner (RETRO-DEC-006, 2026-06-30).

## Remediation UX

When issues are found, offer choices:

```text
1. Apply suggested OpenSpec amendment now.
2. Provide custom amendment/context.
3. Defer with rationale.
4. Mark accepted risk and continue.
5. Keep as blocking.
6. Stop.
```

Do not patch OpenSpec artefacts unless the user explicitly confirms.

## Re-review after remediation

After applying any remediation:

1. Re-read the amended artefact.
2. Re-evaluate the original finding.
3. Update confidence/verdict.
4. Record the remediation decision event.

Do not claim the review issue is fixed unless the artefact reflects the fix.

## ARCHITECTURAL_CHANGE — ADR authoring before apply

When the change is classified `ARCHITECTURAL_CHANGE` and a review finding raises a new
architectural decision (e.g., a new shared port strategy, a cross-module seam, or a
departure from an existing ADR):

- Surface an explicit note alongside any approval condition: "An ADR authoring step may
  be required before `chaos:apply` can proceed."
- Classify the finding as `NEEDS_ADR_OR_DECISION_LOG` (Fixability) and
  `APPROVAL_CONDITION` (Decision Event type).
- The approval condition must state that the ADR must be drafted (and its path recorded)
  before or concurrent with `chaos:apply`. Do not assume the ADR will be created
  automatically.
- In `--strict` mode, missing ADR for a new architectural decision is BLOCKING unless
  the user explicitly accepts risk.

Provenance: RETRO-DEC-005 Sub-A (implement-file-storage-foundation retro, 2026-06-30).
