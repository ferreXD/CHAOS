# `chaos:apply` Mode Reference

## `change.md` deliver (universal lifecycle — all modes)

When `.chaos/changes/<change-id>/change.md` exists, the mode is **inferred from
`chaosMetadata.mode`** (light | standard | strict) and the **Deliver** section of
`reference/apply-contract.md` governs the run: output is the `change.md` §Delivery dashboard at
mode depth (**no apply-report**), and validation (build + tests + contract coverage) is
**required** in every mode. Light additionally waives the `chaos:review` requirement (the FRAME
self-review + the human's answered decisions are the gate) and runs the collapsed lifecycle
instead of the standard stages; standard/strict keep the full mode-behaviour table below inside
the Deliver shell. Rows of the table that imply a legacy apply-report output apply to
legacy-layout changes (no `change.md`) only.

## Invocation

```bash
chaos:apply <change-id> --light
chaos:apply <change-id> --standard
chaos:apply <change-id> --strict
chaos:apply <change-id> --dry-run
```

If no mode is supplied, infer mode from change risk and ask the user to accept or override it.

## Mode inference

Infer `--light` when the change is low risk:

- documentation-only
- test-only
- small internal refactor with no behaviour change
- no persistence/API/auth/external side effects
- no production behaviour migration

Infer `--standard` when the change is normal feature work:

- bounded application change
- one module or component primarily affected
- tests can reasonably validate behaviour
- proposal/review exists but may contain non-blocking gaps

Infer `--strict` when the change is high risk:

- brownfield migration
- persistence or database schema changes
- API contract changes
- auth/security/authorization changes
- external side effects
- idempotency/replay/offline queue
- cross-module changes
- release/cutover/deployment-sensitive changes
- proposal review has major findings

## Mode behaviour

| Behaviour | Light | Standard | Strict |
|---|---:|---:|---:|
| Requires OpenSpec change | Yes | Yes | Yes |
| Requires `tasks.md` | Yes | Yes | Yes |
| Requires `chaos:review` | Recommended | Required unless waived | Required |
| Allows continuation with non-direct blockers | Yes | Yes, with explicit decisions | No |
| Allows in-apply amendment | Yes | Yes, recorded | Only after explicit OpenSpec amendment or decision |
| Requires apply plan before editing | Brief | Yes | Mandatory detailed plan |
| Requires task-by-task execution | Suggested | Yes | Mandatory |
| Requires validation attempt | Suggested | Strongly expected | Required or explicit blocker/waiver |
| Blocks on unresolved major review findings | No, ask | Ask unless direct blocker | Yes |

## Dry run

`--dry-run` performs all preflight, classification, boundary, and plan generation without changing code.

The output result should be `DRY_RUN_ONLY`. On a `change.md` change, present the would-be
§Delivery dashboard in the response without appending it or setting
`lifecycle.status: Delivered`; on a legacy-layout change, still write or propose the legacy
apply report.
