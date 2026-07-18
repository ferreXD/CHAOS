---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-item
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-19T00:13:59+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-19T00:13:59+02:00"
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
  id: TODO-2026-07-18-ea-s1-sanitize-for-real
  title: "EA-S1 — Sanitize public surface for real"
  status: done
  priority: BLOCKER
  target: h0-stabilization
  type: sanitization
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-S1
  relatedChanges:
  relatedRoadmapItems:
    - EA-S1
  relatedFindings:
  nextStep: "Sweep the public surface for private-client residue, untrack settings.local.json, and make the config self-description true."
  recommendedCommand: none
  closureCriteria:
    - "Repository grep is clean for client terms."
    - "settings.local.json is untracked."
    - "Config self-description is true."
  knowledgeType: RECOMMENDATION
  confidence: HIGH
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-18T12:00:00+02:00"
  closedAt: "2026-07-18T20:00:00+02:00"
---

# TODO — EA-S1 — Sanitize public surface for real

## Why this exists

The public-alpha assessment found private-client residue that contradicts the repository claim that sanitization is completed — a live reputational risk on the public surface.

## Source Evidence

- EA-S1 — Horizon 0, P0, complexity S, no dependencies (14-roadmap.md §14.2).

## Next Action

Sweep the public surface for private-client residue, untrack settings.local.json, and make the config self-description true.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Repository grep is clean for client terms.
- settings.local.json is untracked.
- Config self-description is true.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
- 2026-07-18 — Closed. Sanitization completed; all three closure criteria met:
  - **Grep clean for client terms.** Purged private-client identifiers from the product surface (both `.claude/` and `.github/` mirror trees, parity preserved): example `changeId`/branch `customer-inventory-api` → `add-task-query-filters` (hooks README + `artifact-metadata-schema.md` + `active-command-detection.md`); archaeology example `CustomerInventory API` / `customer-inventory-api-archaeology.md` → `Task Tracker API` / `task-tracker-api-archaeology.md` (`staleness-reuse-policy.md`); verify example `customer-inventory-snapshot` → `add-task-comments` (`decision-event-audit.md`); traceability example `CustomerInventoryEndpoint(.Tests).cs` → `CreateTaskEndpoint(.Tests).cs` (`traceability-matrix.md`). Neutralized leaked personal identity in example metadata `ferrexd` → `vscode-user` (repo's neutral convention) in the hooks metadata examples and the interaction-runtime tool README/CLI docstring. Remaining `ferrexd`/`ferreXD` is the author's own copyright (`LICENSE`) and self-authored test fixtures — not client residue. Legitimate `azure-devops`/`ado-remote-mcp` provider-feature documentation was intentionally left intact (supported feature, not residue).
  - **`settings.local.json` untracked.** `git rm --cached .claude/settings.local.json` (personal `ado-remote-mcp` opt-in leaked into the tracked tree); file kept on disk and now covered by a new `.gitignore` rule for `.claude/settings.local.json`.
  - **Config self-description true.** `.chaos/config.yaml`: `project.type: dotnet` → `node`, `primaryLanguage: csharp` → `typescript` (repo is Markdown + TypeScript/Node tooling, no repo-level .csproj); `mainlineBranch: chaos/main` → `main` (the real mainline; `chaos/main` never existed) and dropped the stale disjoint-history comment.
- 2026-07-19 — Normalized `status: closed` → `status: done`. The dashboard's terminal vocabulary is `{done, wont-do, superseded}` ([tools/chaos-todo-views/lib/compute.mjs](../../../../../tools/chaos-todo-views/lib/compute.mjs)), so the earlier `closed` token was miscounted as open; also synced the roadmap index row + regenerated the HTML digest. No change to the underlying work, which remained complete.
