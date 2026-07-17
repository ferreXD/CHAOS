# CHAOS MCP Security Policy

Security posture for all CHAOS use of MCP servers and provider CLIs (GitHub and Azure DevOps).
This policy is **provider-neutral** and binds every command that resolves repository context.

## Defaults

```yaml
mcp:
  defaultMode: read-only
  remoteWritesRequireExplicitConfirmation: true
  preferLeastPrivilegeToolsets: true
  commandSpecificToolProfiles: true
```

## Read-only by default

- Default MCP and CLI usage is **read-only**. Commands resolve context; they do not mutate
  remote state as a side effect.
- A remote **write** is allowed only when **both** hold:
  1. the command **explicitly supports** that write, and
  2. the user **explicitly confirms** it via the interactive decision protocol
     (`interactive-decision-protocol.md`).
- Specifically, do **not** create or update GitHub issues, PR comments, PR reviews, labels,
  or Azure DevOps work items / PR comments unless explicitly requested or confirmed.

## Least privilege

- Prefer **command-specific minimal toolsets / domains** (`mcp-tool-profiles.md`). Request
  only what the current command needs.
- Do not enable write-capable toolsets for read-only commands.

## Secrets

- **Never** write secrets, tokens, PATs, connection strings, or credentials to repository
  files — including `.chaos/config.yaml`, reports, prompts, skills, or agent files.
- `.chaos/config.yaml` may declare **non-secret intent** only (enabled, preferred, toolsets,
  domains, non-secret org/project names). Secrets come from the environment or the MCP
  client's own secret store.
- If MCP or CLI output contains sensitive values, **redact** them in any report or chat
  surface. Do not expose tokens in reports.

## Capability gaps

- Report MCP/CLI capability gaps as `resolution.missingCapabilities` and warnings in the
  context object and command report.
- Do **not** fail a command for a missing capability **unless** the current mode requires
  that provider-backed fact (e.g. strict verification depending on provider CI, or strict
  repo-wide sync depending on provider authority). Otherwise treat the gap as a warning.

## MCP optionality

- MCP is **not** a hard dependency. CHAOS must remain usable with CLI or local-git fallback
  only. Absence of MCP is a warning, never a universal failure.

## Confirmation wording (writes)

Any remote write uses a single, explicit decision (then STOP), e.g.:

```text
Decision required: Remote write to <provider>

Context: <command> wants to <create/update> <resource> on <provider>.

Recommended option:
2 — Skip the remote write (read-only); record intent in the report.

Options:
1. Perform the remote write now (requires confirmation) — mutates remote state.
2. Skip the remote write; keep CHAOS read-only — no remote change.
3. Stop / defer.

Select one option to continue.
```

## Related

- `repository-context-contract.md`, `repository-context-resolution-policy.md`
- `mcp-tool-profiles.md`
- `interactive-decision-protocol.md`, `model-robustness-policy.md`
