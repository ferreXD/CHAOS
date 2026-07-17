# Change Classification and Risk Matrix

`chaos:propose` must classify the change before generating approaches.

## Change types

| Type | Meaning | Archaeology expectation |
|---|---|---|
| `NEW_CAPABILITY` | Something genuinely new | Optional unless touching existing flows |
| `BROWNFIELD_CHANGE` | Modifies/migrates existing behaviour | Expected; strict mode blocks without archaeology or waiver |
| `BUGFIX` | Corrects existing behaviour | Expected if current behaviour is unclear |
| `REFACTOR` | Internal structure change | Expected if behaviour-preserving claim must be verified |
| `MIGRATION_SLICE` | Migrates bounded legacy slice | Required in strict mode |
| `ARCHITECTURAL_CHANGE` | Changes target posture or cross-cutting decision | ADR/rule evidence required; archaeology may be optional |
| `OPERATIONAL_CHANGE` | Deployment, runtime, pipeline, observability, support | Evidence from ops docs/ADRs required |
| `DOCUMENTATION_ONLY` | Docs only | Usually no archaeology |
| `SPIKE` | Time-boxed investigation | Proposal should define questions and outputs, not solution certainty |

## Risk triggers

Escalate to HIGH or CRITICAL if any apply:

- External side effects: ERP, OnBase, email, PDF, print, file system, external HTTP.
- Auth/security/authorization/identity.
- Offline replay, idempotency, sync queues, operation IDs.
- Database schema, migrations, write ownership, transaction boundaries.
- Deployment/runtime/cutover/rollback.
- Legacy behaviour preservation.
- Financial, regulatory, legal, or customer-facing correctness.
- Existing public API contract changes.
- MAUI/backend compatibility.

## Risk response

| Risk | Required response |
|---|---|
| LOW | Light proposal allowed |
| MEDIUM | Standard evidence and approach alignment |
| HIGH | Strict evidence; review mandatory |
| CRITICAL | Strict evidence; human decision required before proposal finalization |

## Archaeology rules

- New capability: archaeology optional.
- Brownfield change: archaeology expected.
- Brownfield + strict: archaeology required unless explicitly waived.
- Waiver must lower confidence unless equivalent evidence exists.
- Missing archaeology must be recorded in the proposal report.
