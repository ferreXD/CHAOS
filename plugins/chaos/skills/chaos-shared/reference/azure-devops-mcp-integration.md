# Azure DevOps / Azure Repos MCP Integration (First-Class Internal Provider)

Azure DevOps / Azure Repos is a **first-class internal** CHAOS provider, resolved through the
same provider-neutral contract as GitHub. CHAOS stays GitHub-native for public OSS usage while
treating Azure DevOps as a fully supported internal adapter.

MCP is **optional**. CHAOS works on Azure DevOps with the `az devops` CLI or local git alone;
the Azure DevOps MCP server only raises context quality and confidence.

## Provider detection

CHAOS treats the provider as Azure DevOps when:

- `.chaos/config.yaml` → `integrations.repository.provider` is `azure-devops`, **or**
- provider is `auto` and the git remote host is `dev.azure.com`, `*.visualstudio.com`, or a
  configured Azure DevOps host.

Organization/project come from `.chaos/config.yaml`
(`integrations.repository.azureDevOps.organization` / `.project`) or the local environment —
**never** from secrets stored in the repo. Do not prompt for organization/project unless the
provider is explicitly `azure-devops`, the remote clearly indicates Azure DevOps, or the user
opts in.

## Resolution chain (Azure DevOps)

1. **Azure DevOps MCP server** — remote or local mode — preferred for review-request (PR),
   repository, work-item, and build context when configured and reachable.
2. **az devops CLI** — fallback when available and authenticated.
3. **local git fallback** — always available; caps authority confidence to LOW.
4. **manual confirmation** — only for non-sensitive missing context.

### Remote vs local MCP mode

- `mode: remote` — a hosted Azure DevOps MCP endpoint. Preferred for centrally managed orgs.
- `mode: local` — a locally run Azure DevOps MCP server. Useful for restricted networks or
  developer machines.

Both modes are read-only by default and follow the same security posture.

### What each source can provide

| Context block | Azure DevOps MCP | az devops CLI | local git |
|---|---|---|---|
| repository / branch | yes (HIGH) | yes (MEDIUM/HIGH) | yes (provider unproven) |
| user identity | yes | yes | identity only |
| user role (owner/maintainer) | yes | yes | **no** (caps to LOW) |
| review request (PR) | yes | yes (`az repos pr show`) | no |
| linked work items | yes | yes (`az boards work-item`) | no |
| build validation / CI | yes | yes (`az pipelines build`) | no |

## Least-privilege domains

Request the **minimum** Azure DevOps MCP domains a command needs (see `mcp-tool-profiles.md`):

- `core` — organization/project/identity context.
- `repositories` — repo, branch, and PR (review-request) metadata and diffs.
- `work-items` — linked work items.
- `builds` — build validation / CI status.

## Read-only-by-default posture

- Default Azure DevOps MCP/CLI usage is **read-only**.
- Do **not** create/update work items, PR comments, or reviews unless the command explicitly
  supports a write and the user confirms it (`mcp-security-policy.md`).
- Redact PATs, connection strings, and sensitive values in reports.

## Example configuration (no secrets)

`.chaos/config.yaml` declares **intent and non-secret org/project** only:

```yaml
integrations:
  repository:
    azureDevOps:
      enabled: false          # opt-in; GitHub remains the default
      organization: ""        # non-secret org name (or supplied via environment)
      project: ""             # non-secret project name
      mcp:
        preferred: true
        mode: remote          # remote | local
        domains: [core, repositories, work-items, builds]
      cli:
        command: az devops
```

PATs / tokens come from the environment or the MCP client's own secret store — never from
repository files.

## Enabling the remote Azure DevOps MCP server (opt-in)

The remote Azure DevOps MCP server is **not** wired into the committed default MCP configs,
since GitHub is the default provider. To opt in, add an `ado-remote-mcp` server entry to your
MCP client config and replace `<your-azure-devops-org>` with your organization:

- VS Code — uncomment the pre-seeded block in `.vscode/mcp.json`.
- Claude Code — add the entry to `.mcp.json`:

```jsonc
"ado-remote-mcp": {
  "url": "https://mcp.dev.azure.com/<your-azure-devops-org>",
  "type": "http"
}
```

The endpoint URL carries a non-secret org name only; PATs/tokens are supplied by the MCP
client's own auth flow, never committed to the repository.

## az devops CLI fallback (read-only examples)

```bash
az devops configure --list
az repos show --repository <repo>
az repos pr show --id <pr-id>
az boards work-item show --id <work-item-id>
az pipelines build list --branch <branch>
```

## Related

- `repository-context-contract.md`, `repository-context-resolution-policy.md`
- `mcp-security-policy.md`, `mcp-tool-profiles.md`
- `github-mcp-integration.md` (public / default provider)
