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
  id: TODO-2026-07-18-ea-s2-first-run-integrity
  title: "EA-S2 — First-run integrity on a fresh clone"
  status: done
  priority: BLOCKER
  target: h0-stabilization
  type: implementation
  scope: repository
  owner: TBD
  sourceArtifacts:
    - .chaos/assessments/2026-07-18-public-alpha-assessment/14-roadmap.md
  sourceIds:
    - EA-S2
  relatedChanges:
  relatedRoadmapItems:
    - EA-S2
  relatedFindings:
  nextStep: "Fix the silent first-run breakages so a fresh clone works end to end: openspec init, test fixture, MCP dist artifacts, py -3 launcher assumption, PATCH-SUMMARY drift."
  recommendedCommand: none
  closureCriteria:
    - "Fresh clone reaches doctor green."
    - "All 266/266 tests pass on a fresh clone."
  knowledgeType: RECOMMENDATION
  confidence: HIGH
  createdAt: "2026-07-18T12:00:00+02:00"
  lastSeenAt: "2026-07-19T00:13:59+02:00"
  closedAt: "2026-07-19T00:13:59+02:00"
---

# TODO — EA-S2 — First-run integrity on a fresh clone

## Why this exists

Fresh clones break silently (openspec init, test fixture, MCP dist, py -3 launcher assumption, PATCH-SUMMARY drift), so every evaluator hits first-run failures.

## Source Evidence

- EA-S2 — Horizon 0, P0, complexity S, no dependencies; gates EA-S3, EA-V1 and EA-B4 (14-roadmap.md §14.2).

## Next Action

Fix the silent first-run breakages so a fresh clone works end to end: openspec init, test fixture, MCP dist artifacts, py -3 launcher assumption, PATCH-SUMMARY drift.

## Recommended Command

No specific CHAOS command required.

## Closure Criteria

- Fresh clone reaches doctor green.
- All 266/266 tests pass on a fresh clone.

## Resolution

Closed on maintainer instruction (2026-07-19), scoped to the evidence below.

**Independently verified this session:**

- **All 266/266 tests pass.** Fresh `npm ci` + `npm test` + `npm run typecheck` across all five packages, zero failures: interaction-runtime 45, -mcp 38, -runner 69, -diagnostics 65, decision-center 49 = 266. This now runs in CI too ([EA-S3](2026-07-18-ea-s3-real-ci.md), `.github/workflows/ci.yml`).
- **MCP runs from source, no dist artifact required.** [.mcp.json](../../../../../.mcp.json) launches `tools/chaos-interaction-mcp/src/cli/chaos-interaction-mcp.ts` directly, so the "MCP dist" first-run breakage no longer applies.
- First-run docs/tooling updated in the working tree (chaos-init SKILL + toolchain-preflight, chaos-doctor check-catalog, bootstrap-architect, `docs/installation.md`).

**Rests on the maintainer's own work / not independently re-verified in a clean room:** a literal fresh `git clone` reaching full `chaos:doctor` green, and the specific `openspec init` / `py -3` launcher / PATCH-SUMMARY-drift fixes. Two caveats worth noting: (1) the first-run fixes above are **uncommitted**, so the "fresh clone" criterion only truly holds once they are committed; (2) the runtime diagnostics `doctor` currently reports **degraded** — but solely from two stale leftover resume capsules referencing the removed `create-public-readme` change (0 malformed, 0 blocking findings); this is unrelated to first-run integrity and out of EA-S2 scope. Recommend re-running the fresh-clone check post-commit and clearing the stale capsules separately.

## History

- 2026-07-18 — Created from the public-alpha assessment roadmap (14-roadmap.md) during roadmap-view generation. Roadmap-scoped: not imported into the main backlog.
- 2026-07-19 — Closed (status → done) on maintainer instruction. Verified 266/266 tests + typecheck green across all five packages and MCP-from-source; broader fresh-clone `chaos:doctor`-green dimension attributed to maintainer's uncommitted first-run work (see Resolution for scope and caveats).
