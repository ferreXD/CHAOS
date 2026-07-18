---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T12:48:10+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T12:48:10+02:00"
  lastAuditedBy: vscode-user
  repositoryContext:
    provider: github
    branch: main
    reviewRequest: null
    contextSource: git
    confidence: LOW
  metadata:
    identitySource: provider
    timestampSource: local-system
    confidence: LOW

todo:
  id: TODO-2026-07-17-add-claude-copilot-parity-check
  title: "Add Claude↔Copilot parity check"
  status: done
  priority: MEDIUM
  target: v1
  type: adapter
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/roadmap/oss-readiness-audit-2026-07-01.md
    - .chaos/roadmap/roadmap.md
  sourceIds:
    - RM-010
    - F-10
  relatedChanges: []
  relatedRoadmapItems:
    - RM-010
  relatedFindings:
    - F-10
  nextStep: "Add an automated or scripted parity check across command sets, decision-event vocabulary, and output contracts between the two surfaces."
  recommendedCommand: none
  closureCriteria:
    - "A parity mechanism (script/CI) compares the Claude vs Copilot surfaces."
    - "Drift between the two surfaces is detectable."
  knowledgeType: FACT
  confidence: HIGH
  createdAt: "2026-07-17T20:30:00+02:00"
  lastSeenAt: "2026-07-18T12:48:10+02:00"
  closedAt: "2026-07-18T12:48:10+02:00"
---

# TODO — Add Claude↔Copilot parity check

## Why this exists

Parity between the Claude skills/orchestrators and the Copilot prompts is asserted in prose but never mechanically verified; hand-maintained drift already exists.

## Source Evidence

- F-10 — No automated Claude↔Copilot parity check
- RM-010 — harden Copilot adapter (add parity check)

## Next Action

Add an automated or scripted parity check across command sets, decision-event vocabulary, and output contracts between the two surfaces.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- A parity mechanism (script/CI) compares the Claude vs Copilot surfaces.
- Drift between the two surfaces is detectable.

## History

- 2026-07-18 — Closed as **done** via `chaos:todo --close` after the mechanism was built and
  verified. Delivered `tools/chaos-parity-check/` — a deterministic, zero-dependency Node checker
  (`check.mjs`) that compares the two surfaces across five dimensions: command/prompt set,
  skill set, agent set, per-skill contract files (`SKILL.md` + `reference/**`), and Copilot
  prompt→agent linkage. Intentional asymmetries are declared in `parity-exceptions.json`
  (`opsx-*` prompts, `CSharpExpert` fallback); anything else that differs is reported as drift
  (exit 1). Wired into CI via `.github/workflows/parity-check.yml` and declared in
  `.chaos/config.yaml` (`policies.parity`). **Drift-detection proven**: the first run surfaced
  real pre-existing drift (`PATCH-SUMMARY.md` present under two Claude skills but not their Copilot
  mirrors) — resolved by scoping the contract-file check to `SKILL.md` + `reference/`, since
  `PATCH-SUMMARY.md` is dev history, not agent-read contract. Current baseline: PARITY OK (exit 0).
  Closure criteria met (F-10 / RM-010). Authorized by the direct "solve" directive (repository owner).

