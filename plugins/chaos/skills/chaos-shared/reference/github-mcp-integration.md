# GitHub MCP Integration (Public / Default Provider)

GitHub is the **public, default** CHAOS provider. This document describes how CHAOS resolves
GitHub repository context and how the optional GitHub MCP server fits the resolution chain
defined in `repository-context-resolution-policy.md`.

MCP is **optional**. CHAOS works on GitHub with the `gh` CLI or local git alone; MCP only
raises context quality and confidence.

## Provider detection

CHAOS treats the provider as GitHub when:

- `.chaos/config.yaml` → `integrations.repository.provider` is `github`, **or**
- provider is `auto` and the git remote host is `github.com` (or a configured GitHub
  Enterprise host).

## Resolution chain (GitHub)

1. **GitHub MCP server** — preferred for review-request (PR), repository, issue, and check
   context when configured and reachable.
2. **gh CLI** — fallback when available and authenticated (`gh auth status`).
3. **local git fallback** — always available; caps authority confidence to LOW.
4. **manual confirmation** — only for non-sensitive missing context.

### What each source can provide

| Context block | GitHub MCP | gh CLI | local git |
|---|---|---|---|
| repository / branch | yes (HIGH) | yes (MEDIUM/HIGH) | yes (provider unproven) |
| user identity | yes | yes | identity only |
| user role (owner/maintainer) | yes | yes | **no** (caps to LOW) |
| review request (PR) | yes | yes (`gh pr view`) | no |
| linked issues | yes | yes (`gh issue`) | no |
| CI / checks | yes | yes (`gh pr checks`) | no |
| code/security context | yes (if `code_security` enabled) | limited | no |

## Least-privilege toolsets

Request the **minimum** GitHub MCP toolsets a command needs (see `mcp-tool-profiles.md`).
Available toolsets referenced by CHAOS:

- `repos` — repository and branch metadata.
- `pull_requests` — PR (review-request) metadata, diffs, reviewers, checks.
- `issues` — linked issues.
- `code_security` — security/code-scanning context (code-review, opt-in only).

Default configuration enables `repos`, `pull_requests`, `issues`, and `code_security`, but
each command should consume only the profile-declared subset.

## Read-only-by-default posture

- Default GitHub MCP/CLI usage is **read-only**.
- Do **not** create/update issues, PR comments, reviews, or labels unless the command
  explicitly supports a write and the user confirms it (`mcp-security-policy.md`).
- Redact tokens and sensitive values in reports.

## Example MCP configuration (no secrets)

Configuration lives in the host's MCP client settings, **not** in `.chaos/config.yaml`.
Secrets/PATs come from the environment, never from repository files.

```jsonc
// Example MCP client entry (illustrative; place tokens in env, not here)
{
  "mcpServers": {
    "github": {
      "command": "github-mcp-server",
      "args": ["--toolsets", "repos,pull_requests,issues,code_security", "--read-only"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    }
  }
}
```

`.chaos/config.yaml` only declares **intent** (enabled, preferred, toolsets), never secrets:

```yaml
integrations:
  repository:
    github:
      enabled: true
      mcp:
        preferred: true
        toolsets: [repos, pull_requests, issues, code_security]
      cli:
        command: gh
```

## gh CLI fallback (read-only examples)

```bash
gh auth status
gh repo view --json name,owner,defaultBranchRef,url
gh pr view --json number,url,title,author,headRefName,baseRefName,state,reviewers
gh pr checks
gh issue list --state open
```

## Related

- `repository-context-contract.md`, `repository-context-resolution-policy.md`
- `mcp-security-policy.md`, `mcp-tool-profiles.md`
- `azure-devops-mcp-integration.md` (first-class internal provider)
