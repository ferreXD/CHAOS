# chaos-shared — Claude-facing shared CHAOS contracts

This folder is a **shared reference library** for the CHAOS Claude command suite. It is
**not an invokable command skill** (it has no `SKILL.md` and must not be invoked with
`/chaos-shared`). Its files are read by CHAOS commands, skills, and agents to keep
governance behaviour consistent across the workflow.

## Why this library exists — model robustness

CHAOS behaves very well with Claude Opus, which tends to *infer* governance intent: it
asks explicit questions, uses interactive choice UI, invokes OpenSpec during
`chaos:propose`, and stops for human decisions. Weaker Claude models (e.g. Sonnet) are
less consistent: they sometimes display a decision in chat and keep going, proceed
without an explicit choice, or hand-write proposal artifacts instead of invoking
OpenSpec.

**Core principle:** CHAOS commands must not depend on the model inferring governance
intent. All critical behaviours must be explicit, gated, mechanical, and auditable so the
workflow works reliably with the *weakest supported Claude model*, not only with Opus.

## Contents

| File | Purpose |
|---|---|
| `reference/model-robustness-policy.md` | The model-portability rules every command must satisfy. |
| `reference/interactive-decision-protocol.md` | How to ask, present, stop on, and record material user decisions. |
| `reference/change-scoped-artifact-layout.md` | Where change-scoped artifacts are written (`.chaos/changes/<change-id>/`). |
| `reference/artifact-naming-policy.md` | Date-prefixed physical filenames; sequential IDs are display-only. |
| `reference/repository-context-contract.md` | Provider-neutral repository context object commands consume (provider/user/branch/review-request/working-tree/CI/authority). |
| `reference/repository-context-resolution-policy.md` | Resolution order (MCP → CLI → git → manual), confidence caps, and repo-wide sync authority gating. |
| `reference/github-mcp-integration.md` | GitHub as the public/default provider; MCP/`gh`/git chain and least-privilege toolsets. |
| `reference/azure-devops-mcp-integration.md` | Azure DevOps / Azure Repos as a first-class internal provider; MCP/`az devops`/git chain. |
| `reference/mcp-security-policy.md` | Read-only-by-default, least-privilege, no-secrets, redaction, and remote-write confirmation rules. |
| `reference/mcp-tool-profiles.md` | Command-specific least-privilege capability profiles. |
| `reference/hooks-repository-context-policy.md` | vNext-ready policy for hooks consuming the same repository context contract (spec only). |

## How commands use this library

Each `chaos-*` command wrapper carries a compact **Non-negotiable execution contract**
near its top that references these policies. Skills and agents link here for the full
rules. `chaos:status` audits whether commands declare these contracts; `chaos:sync` can
reconcile missing hardening references with patch preview.
