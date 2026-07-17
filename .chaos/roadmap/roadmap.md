---
title: CHAOS OSS Roadmap
date: 2026-07-01
status: advisory — roadmap index only, no lifecycle governance mutated

chaosMetadata:
  schemaVersion: 1
  artifactType: unknown
  artifactScope: repository
  changeId: null
  sourceCommand: unknown
  lastWrittenAt: "2026-07-01T00:00:00+02:00"
  lastWrittenBy: <example-user>
  lastAuditedAt: "2026-07-01T00:00:00+02:00"
  lastAuditedBy: <example-user>
  repositoryContext:
    provider: github
    branch: main
    reviewRequest: null
    contextSource: git
    confidence: LOW
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: LOW
---

# CHAOS OSS Roadmap

> Source: `.chaos/roadmap/oss-readiness-audit-2026-07-01.md`. This index groups the remaining
> public-readiness work from that audit by release gate. Completed hygiene work has been retired
> from the active list below.

## Completed / already addressed

The following items were completed during the repo hardening pass and are no longer tracked as
active roadmap work:

- Repository sanitization and public-safe defaults.
- OSS license placement via the repository license file.

## Public alpha blockers

Must land before CHAOS is described or distributed as "public alpha" anywhere.

| ID | Title | Priority |
|---|---|---|
| RM-001 | Create canonical public README and positioning | BLOCKER |
| RM-003 | Create minimal installation and onboarding guide | BLOCKER |
| RM-006 | Choose and add OSS license | BLOCKER |
| RM-004 | Create demo repository or worked end-to-end example (sanitized, non-project-specific) | HIGH |
| RM-002 | Create five-minute CHAOS overview | HIGH |
| RM-007 (minimal scope) | Add CONTRIBUTING.md | HIGH |
| RM-008 | Document lightweight, normal, and strict CHAOS paths explicitly | MEDIUM |

## v1 blockers

Must land before CHAOS is described as "v1"/production-ready.

| ID | Title | Priority |
|---|---|---|
| RM-009 | Create stable command support matrix (mode/confidence/Copilot-status/next-command per command) | HIGH |
| RM-010 | Validate and harden GitHub Copilot adapter (add chaos:doctor mirror, explicit stability label, parity check, fix mirrored project-specific default) | HIGH |
| RM-007 (full scope) | Add CODE_OF_CONDUCT.md and issue templates | HIGH |
| RM-011 | Complete chaos:doctor implementation (Claude command wrapper + Copilot mirror) | MEDIUM |
| RM-012 | Stabilize hooks installation and profiles (report-only protected-file guard profile) | MEDIUM |
| RM-013 | Complete repository-context and MCP integration docs (public-default posture, templated example config) | MEDIUM |

## vNext enhancements

Quality/consistency polish — not required for any specific release gate.

| ID | Title | Priority |
|---|---|---|
| RM-014 | Finalize chaos:code-review lifecycle integration (explicit per-mode posture) | LOW |
| RM-015 | Schedule legacy scattered-folder retirement (`.chaos/reviews/`, `.chaos/apply-reports/`, `.chaos/retros/`) | LOW |
| RM-016 | Decide fate of `chaos:gate` (implement or fold into verify/archive, downgrade G-0x language) | LOW |

## Later ideas

Not evaluated in depth this pass; carried forward from the prior internal advisory
(`.chaos/workflow-evaluation-2026-06-29.md`) as candidates for a future audit pass, not
current roadmap commitments:

- Generate the Copilot prompts/instructions/agents *from* the Claude skills (as `chaos:help
  --readme` already generates `.chaos/README.md`) so the two surfaces cannot drift by hand —
  a stronger version of RM-010.
- CHAOS-integrate the Copilot `CSharpExpert.agent.md` fallback (add decision-event / scope-
  control awareness) or explicitly document that CHAOS discipline on the Copilot path lives in
  the orchestrator, not the specialist.
- Full Claude↔Copilot automated parity CI (command sets, decision-event vocab, forbidden-
  behavior lists, output contracts).
