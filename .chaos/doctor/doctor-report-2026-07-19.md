---
chaosMetadata:
  schemaVersion: 1
  artifactType: doctor-report
  artifactScope: repository
  changeId: null
  sourceCommand: "chaos:doctor"
  lastWrittenAt: "2026-07-19T11:20:00+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T11:20:00+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: chaos/dotnet/demo
    reviewRequest: null
---

# chaos:doctor report — 2026-07-19

Mode: standard
Focus: all
Verdict: READY

## Summary
- All required runtime, tooling, repository, provider, MCP, and hook checks pass; the
  Interaction Runtime is healthy (0 pending decisions, 0 stale locks, 0 malformed
  artifacts). Only informational notes remain.

## Repository Context
Provider: github
Context source: gh-cli (auth confirmed) + git; chaos-interaction MCP wired and enabled
Branch: chaos/dotnet/demo
Default branch: main (origin/HEAD → origin/main)
Review request: none
User: ferreXD (gh, keyring) / git: Pablo Ferreira <ferreimavi1998@hotmail.com>
Authority confidence: HIGH
Repo-wide sync posture: REQUIRES_CONFIRMATION (maintainer confirmation per policy)
Missing capabilities:
- none

## Checks
| Check | Result | Confidence | Notes |
|---|---|---|---|
| CD-RT-01 git available | PASS | HIGH | git 2.45.0.windows.1 |
| CD-RT-02 inside git repo | PASS | HIGH | true |
| CD-RT-03 OpenSpec CLI | PASS | HIGH | openspec 1.6.0 |
| CD-RT-04 build command | PASS | HIGH | dotnet 10.0.300 (`dotnet build` resolvable) |
| CD-RT-05 test command | PASS | HIGH | `dotnet test` resolvable via same SDK |
| CD-RT-06 node/npm | PASS | HIGH | node v24.18.0 (≥20.19.0), npm 10.5.1 |
| CD-RT-07 openspec project | PASS | HIGH | `openspec/` project dir exists |
| CD-REPO-01 provider detection | PASS | HIGH | github (remote inference + config) |
| CD-REPO-02 remote resolved | PASS | HIGH | origin → github.com/ferreXD/CHAOS.git |
| CD-REPO-03 current branch | PASS | HIGH | chaos/dotnet/demo |
| CD-REPO-04 default branch | PASS | HIGH | main |
| CD-REPO-05 working tree | INFO | HIGH | 67 modified files (assessment docs, uncommitted) |
| CD-REPO-06 git user | PASS | MEDIUM | identity only; email differs from session userEmail (see notes) |
| CD-REPO-07 context confidence | PASS | HIGH | provider context resolvable via MCP/CLI/git |
| CD-REPO-08 sync authority | PASS | HIGH | HIGH (gh authed); repo-wide sync still gated by confirmation |
| CD-PROV-GH-01 GitHub MCP | INFO | MEDIUM | GitHub MCP not configured; optional, gh CLI covers provider facts |
| CD-PROV-GH-02 gh CLI + auth | PASS | HIGH | gh 2.96.0, logged in as ferreXD (keyring) |
| CD-PROV-AZ-01/02 Azure DevOps | SKIP | HIGH | azureDevOps.enabled=false |
| CD-MCP-01 MCP reachable | PASS | HIGH | chaos-interaction enabled; runtime tools present this session |
| CD-MCP-02 MCP posture | PASS | HIGH | defaultMode read-only, least-privilege profiles configured |
| CD-MCP-03 local MCP wiring | PASS | HIGH | `.mcp.json` → src/*.ts (build-free); node_modules installed; node v24 runs TS |
| CD-HOOK-01 hooks present | PASS | HIGH | SessionStart/UserPromptSubmit/PostToolUse/Stop wired in settings.json |
| CD-HOOK-03 artifact-metadata hook | PASS | HIGH | chaos-artifact-metadata-hook.py present |
| CD-HOOK-04 metadata config | PASS | HIGH | policies.artifactMetadata + managedFiles declared |
| CD-HOOK-05 interpreter runs | PASS | HIGH | `python` = Python 3.12.3; dry-run of chaos-session-context.py succeeds |

## Interaction Runtime
Status: healthy
- Pending decisions: 0
- Ready-to-resume sessions: 0
- Stale locks: 0
- Expired runner leases: 0
- Malformed artifacts: 0
- Blocking findings: 0
- Notes: `runners/` subdir and runner leases not yet created (lazy on first use) — INFO only.

## Next actions
- Environment is ready — proceed with any CHAOS command (propose / apply / verify / sync).
- Optional: the 67 uncommitted `.chaos/assessments/**` edits are unrelated to readiness;
  commit or discard when convenient.
