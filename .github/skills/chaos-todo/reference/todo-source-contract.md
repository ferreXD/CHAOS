# CHAOS Todo Source Contract

Defines where `chaos:todo` looks for evidence and how candidates are extracted from it.

## Configured paths first

Read `.chaos/config.yaml` (`paths.*`, `paths.todo*`) before using any default path below. Do
not hardcode paths when config provides alternatives.

## Scan sources

| Source | Default path | What it yields |
|---|---|---|
| Status report | `.chaos/status-report.md` | Workspace-health findings, drift, blockers. |
| Doctor reports | `.chaos/doctor/*.md` | Local tooling/repo/MCP readiness gaps. |
| Roadmap | `.chaos/roadmap/*.md` | Roadmap promotions (`RM-*`) and audit findings (`F-*`). |
| Sync reports | `.chaos/sync-reports/*.md` + `.chaos/changes/<id>/sync-report.md` | Deferred governance reconciliation debt. |
| Archaeology reports | `.chaos/archaeology/*.md` | Unresolved unknowns, missing tests/runtime evidence. |
| Change artifacts | `.chaos/changes/<change-id>/*.md` | Per-change: apply/verify/review/archive/retro/decision-events/waivers/todo-candidates. |
| Runtime hook violations | `.chaos/runtime/hook-violations.jsonl` | Repeated/severe local rule violations (see gating below). |
| Runtime decision waits | `.chaos/runtime/decision-waits.jsonl` | Unresolved "waiting on a user decision" events. |
| ADRs | `docs/adr/*.md` | Proposed/deferred architecture decisions needing follow-up. |
| Decision log | `docs/decision-log/*.md` | Deferred/unresolved logged decisions. |
| OpenSpec tasks | `openspec/changes/**/tasks.md` | Unchecked tasks that are otherwise orphaned from lifecycle tracking. |

Every source above is **read-only** input to `chaos:todo`. Reading `.chaos/changes/**`,
`docs/adr/**`, `docs/decision-log/**`, or `openspec/changes/**` for candidate extraction never
implies write access to them — see `todo-write-policy.md`.

## Config-missing behavior

- `--light`: infer default paths above, warn once, proceed.
- `--standard`: infer defaults, warn, and recommend `chaos:status` / `chaos:init` to repair
  config.
- `--strict`: ask whether to continue with inferred paths (one decision, STOP) or stop, since
  missing config can affect which evidence is authoritative.

## Candidate extraction rules

Extract candidates only from the categories listed in
`todo-candidate-contract.md` (`sourceKind`). For each source file:

1. Look for structured findings/promotions first (tables, `### F-NN`, `### RM-NNN`, `##
   Decision Events`, checklist items in `tasks.md`, JSONL rows).
2. Apply the materiality guardrail in `todo-candidate-contract.md` before emitting a candidate.
3. Attach the originating file path and any embedded ID as `sourceArtifactPath`/`sourceIds`.
4. Never synthesize a candidate that isn't traceable to a specific artifact location.

## TODO/FIXME source-code markers (opt-in only)

Scanning `TODO`/`FIXME` code comments is **disabled by default**. Enable only when:

- `.chaos/config.yaml` sets `policies.todo.scanCodeMarkers: true`, or
- the user explicitly passes `--include-code-markers` (or asks for it in the conversation).

When enabled, code markers are a low-priority, low-confidence source (`knowledgeType:
INFERENCE`, `confidence: LOW` by default) and are still subject to deduplication and the
materiality guardrail — do not import every marker as a todo.

## Runtime event promotion gating

Hook violations and decision-wait events (`.chaos/runtime/*.jsonl`) are shared runtime logs.
They become todo candidates only when:

- the same violation/wait recurs across multiple sessions (repeated), or
- the event is classified `ERROR`/`BLOCKED` severity (severe), or
- the user explicitly promotes a specific event, or
- `chaos:todo --strict` is auditing for undisclosed repeated drift.

Do not promote every runtime event automatically — these logs are high-volume observability
data, not a backlog feed.

## Related

- `todo-candidate-contract.md`
- `todo-config-contract.md`
- `todo-roadmap-bridge.md`
