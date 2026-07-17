# CHAOS Repository Context Resolution Policy

How CHAOS resolves the `repositoryContext` object (`repository-context-contract.md`) across
providers, and how confidence and authority are capped. The resolver is **provider-neutral**:
commands ask the resolver for context; the resolver picks an adapter; the adapter picks a
source (MCP → CLI → local git → manual).

```
CHAOS command
  -> repository context resolver
     -> provider adapter (github | azure-devops | local-git)
        -> GitHub MCP / gh CLI / local git
        -> Azure DevOps MCP / az devops CLI / local git
```

## Provider detection

1. Read `.chaos/config.yaml` → `integrations.repository.provider`
   (`auto | github | azure-devops | local-git`).
2. If `auto`, infer from the git remote URL:
   - `github.com` (or a configured GitHub Enterprise host) → `github`.
   - `dev.azure.com`, `visualstudio.com`, or a configured Azure DevOps host → `azure-devops`.
   - any other reachable remote → `local-git`.
   - no remote → `local-git` with `provider: local-git` and a warning, or `unknown`.
3. An explicit `provider` in config overrides inference.

Do **not** ask for Azure DevOps organization/project unless the provider is explicitly
`azure-devops`, the remote URL clearly indicates Azure DevOps, or the user chooses to
configure it.

## Resolution order

### GitHub
1. **GitHub MCP server** — if configured and reachable (`integrations.repository.github.mcp`).
2. **gh CLI** — if available and authenticated and `allowCliFallback: true`.
3. **local git fallback** — always available when `allowGitFallback: true`.
4. **manual user confirmation** — only for non-sensitive missing context.

### Azure DevOps
1. **Azure DevOps MCP server** (remote or local) — if configured and reachable.
2. **az devops CLI** — if available and authenticated and `allowCliFallback: true`.
3. **local git fallback** — always available when `allowGitFallback: true`.
4. **manual user confirmation** — only for non-sensitive missing context.

When `preferMcp: true` (default), try MCP first; degrade down the chain on the first
unreachable/unauthorized/disabled source. Record every source attempted in
`resolution.sourcesUsed` and the highest one reached in `resolution.fallbackLevel`.

### Local git fallback commands (read-only)

```bash
git remote -v
git branch --show-current
git status --porcelain
git config user.name
git config user.email
git merge-base <upstream> HEAD     # when an upstream/base is known
git diff --name-only
git diff --cached --name-only
```

These populate `repository`, `branch`, `user` (identity only), and `workingTree`. They
**cannot** populate `reviewRequest`, `ci`, or provider `authority`.

## Confidence rules

- **MCP** context can produce **HIGH** confidence when provider, user, review request, and
  branch are resolved.
- **CLI** context can produce **MEDIUM/HIGH** depending on completeness.
- **local git** fallback **cannot prove provider authority**; it caps `authority.confidence`
  (and `user.role` provability) to **LOW**.
- **manual confirmation** can confirm *intent* but does **not** prove provider role; it does
  not raise `authority.confidence` above what the source supports.
- Each context block carries its own confidence; the report's overall authority confidence is
  the **minimum** across the blocks that gate the operation.

## Authority & repo-wide sync gating

`authority.repoWideSyncAllowed` gates `chaos:sync --all` and other repository-wide writes.
Posture maps to mode as follows:

- **strict** — repo-wide sync **blocks** if provider context is unavailable and authority
  cannot be resolved (`repoWideSyncAllowed: unknown`). An `unknown`/`contributor` user cannot
  approve repo-wide sync in strict mode.
- **standard** — repo-wide sync may proceed **only** with explicit maintainer confirmation,
  and the resolved authority confidence (LOW/MEDIUM) is **recorded** in the report. Confirmation
  does not upgrade the recorded confidence.
- **light** — if provider context is missing, **recommend `--dry-run`** rather than blocking.

Prefer running repo-wide reconciliation on the **default branch / mainline**. Warn (standard)
or block (strict) when run from a feature branch, per the sync command's flags.

These rules mirror `.chaos/config.yaml`:

```yaml
policies:
  repositoryContext:
    repoWideSyncRequiresProviderContext: true
    fallbackToGitCapsAuthorityToLow: true
    unknownUserCannotApproveRepoWideSyncInStrict: true
    allowManualMaintainerConfirmationInStandard: true
```

## MCP optionality (non-negotiable)

- MCP **improves context quality**; it is **not** a hard dependency. CHAOS must remain usable
  with CLI or local-git fallback only.
- Report MCP/CLI capability gaps as `resolution.missingCapabilities` / warnings. Do **not**
  fail a command for a missing capability **unless** the current mode requires that
  provider-backed fact (e.g. strict verification depending on provider CI status, or strict
  repo-wide sync depending on provider authority).

## Security posture (summary)

Default MCP/CLI usage is **read-only**. Remote writes require explicit user confirmation.
Never write secrets/tokens/PATs/connection strings to repository files; redact sensitive
values in reports. Full rules: `mcp-security-policy.md`.

## Related

- `repository-context-contract.md`
- `github-mcp-integration.md`, `azure-devops-mcp-integration.md`
- `mcp-security-policy.md`, `mcp-tool-profiles.md`
