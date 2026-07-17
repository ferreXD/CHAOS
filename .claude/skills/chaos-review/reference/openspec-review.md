# OpenSpec Proposal Review Contract

`chaos:review` reviews an existing OpenSpec change before implementation.

## Expected OpenSpec layout

```text
openspec/changes/<change-id>/
  proposal.md
  design.md
  specs/
  tasks.md
```

Alternative roots such as `.openspec/` may be supported if the repository uses them, but the chosen root must be recorded in the source manifest.

## Required OpenSpec checks

1. Resolve the change id.
2. Verify required artefacts exist.
3. Run or request:

```bash
openspec validate <change-id> --strict
```

4. Check proposal intent and scope.
5. Check design is aligned with proposal and CHAOS architecture.
6. Check specs express observable behaviour and acceptance criteria.
7. Check tasks are actionable, ordered, and not over-broad.
8. Check no task exceeds approved scope.
9. Check risks and assumptions are explicit.

## OpenSpec validation result handling

| Result | Review effect |
|---|---|
| Passed | Supports confidence, but does not replace CHAOS review. |
| Failed | Usually `BLOCKED` or `NEEDS_REVISION`. |
| Not available | Record missing tool; confidence cannot be HIGH unless other strong evidence exists. |
| Not run | Record reason; confidence reduced. |

## CHAOS vs OpenSpec responsibilities

OpenSpec owns:

- Proposal structure.
- Design/spec/tasks artefacts.
- Change validation.
- Apply/archive lifecycle.

CHAOS owns:

- Evidence sufficiency.
- ADR/rule/gate compliance.
- Human governance.
- Confidence and assumption labelling.
- Review verdict before implementation.

## Approval handoff

`chaos:review` may offer approval only after completing review.

It must ask:

```text
This change is eligible for approval. Do you want me to create .chaos/changes/<change-id>/approval.md?
```

It must not silently approve.


## Guided OpenSpec remediation

When review findings indicate missing or weak OpenSpec artefact content, `chaos:review` should offer to patch the relevant OpenSpec artefact after explicit confirmation.

Examples:

- Missing validation tasks -> offer `tasks.md` amendment.
- Ambiguous scope -> offer `proposal.md` amendment.
- Design/spec mismatch -> offer targeted amendment to the inconsistent artefact.
- Missing acceptance criteria -> offer `specs/**` amendment.

After patching, re-read the artefact and update the finding status.

Do not patch production code.
