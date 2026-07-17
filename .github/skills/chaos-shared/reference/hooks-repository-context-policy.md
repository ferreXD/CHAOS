# CHAOS Hooks ↔ Repository Context Policy (vNext-ready)

vNext-ready policy for how runtime hooks may consume the provider-neutral repository
context contract (`repository-context-contract.md`). This document is **policy/specification
only**. Do **not** implement hooks unless hooks are already part of this repository's
conventions; CHAOS must remain fully usable with no hooks installed.

## Copilot adapter note (advisory / reference only)

Hooks are a **Claude-runtime** feature. The GitHub Copilot adapter is **advisory/reference
only**: Copilot does **not** execute Claude hooks natively unless a Copilot-equivalent runtime
is added. The Copilot adapter consumes the **same** `.chaos/runtime/*` files that a hook
runtime would produce, but it does not run the hooks itself.

The runtime file contracts remain stable regardless of which runtime (if any) produces them:

- `.chaos/runtime/session-context.json` — injected repository context for the session.
- `.chaos/runtime/active-command.json` — the currently active CHAOS command.
- `.chaos/runtime/touched-files.jsonl` — files touched during the session (audit trail).
- `.chaos/runtime/hook-violations.jsonl` — recorded protected-file / boundary violations.
- `.chaos/runtime/decision-waits.jsonl` — pending material decisions awaiting confirmation.

Under Copilot, these files are **read as advisory context** when present. Their absence never
blocks a session; commands still perform and record their own resolution proof in reports.

## Principle

Hooks, when present, consume the **same** `repositoryContext` contract as commands. They do
not invent a parallel provider model and do not embed GitHub- or Azure-specific logic; they
go through the resolver/adapters. Hooks remain read-only and least-privilege by default
(`mcp-security-policy.md`).

## Hook roles

- **SessionStart** — may resolve and inject repository context (provider, branch, review
  request, authority posture) so commands start with shared, cached context. Resolution
  follows `repository-context-resolution-policy.md`; MCP optional; degrade to CLI/git/manual.
- **PreToolUse** — may guard protected files and command boundaries (e.g. block edits to
  `AGENTS.md`/`README.md`/`.chaos/config.yaml` without the confirmed protected-doc flow; block
  remote writes without explicit confirmation). May read authority posture to gate repo-wide
  operations.
- **PostToolUse** — may record touched files (feeding `workingTree.changedFiles`) for audit
  trails and report enrichment.
- **Stop** — may validate that expected report artifacts were produced (e.g. a
  change-scoped report under `.chaos/changes/<change-id>/`, or a doctor report under
  `.chaos/doctor/`).

Under the Copilot adapter, these roles describe the **contract** the runtime files satisfy;
Copilot itself does not execute them unless a Copilot-equivalent runtime is added.

## Constraints

- Hooks must not store secrets/tokens/PATs/connection strings.
- Hooks must not perform remote writes without explicit user confirmation.
- Hooks must not make MCP a hard dependency; missing MCP/CLI degrades context, never blocks
  the session (outside mode-required provider facts).
- Hook-injected context is **advisory**; commands still record their own resolution proof in
  reports.

## Configuration intent (non-secret)

If a repository adopts hooks, declare intent (not secrets) alongside the integration config.
Actual hook wiring lives in the host's settings, not in `.chaos/config.yaml`.

## Related

- `repository-context-contract.md`, `repository-context-resolution-policy.md`
- `mcp-security-policy.md`
- `model-robustness-policy.md`
