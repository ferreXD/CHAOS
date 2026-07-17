# CHAOS Repository Context Contract

Shared, **provider-neutral** contract for how CHAOS commands understand the repository they
run in: provider, repository, user, branch, review request, working tree, CI/checks, and
authority posture.

**Core principle.** CHAOS commands must **not** depend on GitHub-specific or Azure-specific
concepts internally. Commands consume this stable `repositoryContext` object. Provider
detail lives in provider adapters and provider-specific reference docs
(`github-mcp-integration.md`, `azure-devops-mcp-integration.md`). Internally, prefer the
neutral term **review request**; user-facing docs may say "PR" because both GitHub and
Azure DevOps use pull requests.

This contract is a **conceptual schema**, not a wire format. A command may resolve a partial
context; every block carries its own `confidence`, and unresolved fields stay empty rather
than guessed.

## Normalized context object

```yaml
repositoryContext:
  provider: github | azure-devops | local-git | unknown

  repository:
    name: ""
    ownerOrOrganization: ""
    project: ""              # Azure DevOps project; empty for GitHub
    remoteUrl: ""
    defaultBranch: main
    providerUrl: ""

  user:
    id: ""
    username: ""
    displayName: ""
    email: ""
    role: owner | maintainer | contributor | unknown
    source: github-mcp | azure-devops-mcp | gh-cli | az-devops-cli | git-config | unknown
    confidence: HIGH | MEDIUM | LOW

  branch:
    name: ""
    isDefaultBranch: false
    upstream: ""
    mergeBase: ""
    confidence: HIGH | MEDIUM | LOW

  reviewRequest:
    providerType: pull-request | changeset | unknown
    id: ""
    url: ""
    title: ""
    author: ""
    sourceBranch: ""
    targetBranch: ""
    status: open | merged | closed | unknown
    reviewers: []
    linkedItems: []          # linked issues (GitHub) or work items (Azure DevOps)
    confidence: HIGH | MEDIUM | LOW

  workingTree:
    clean: true
    changedFiles: []
    stagedFiles: []
    untrackedFiles: []
    baseRef: ""
    confidence: HIGH | MEDIUM | LOW

  ci:
    status: passing | failing | pending | unknown
    checks: []
    confidence: HIGH | MEDIUM | LOW

  authority:
    repoWideSyncAllowed: true | false | unknown
    reason: ""
    requiresMaintainerConfirmation: true
    confidence: HIGH | MEDIUM | LOW

  resolution:
    sourcesUsed: []
    fallbackLevel: mcp | cli | git | manual | none
    missingCapabilities: []
    warnings: []
    confidence: HIGH | MEDIUM | LOW
```

## Field semantics

- **provider** — detected provider; `local-git` when only a generic git remote is present;
  `unknown` when even that is missing.
- **user.role** — `owner`/`maintainer` can only be asserted from provider-backed sources
  (MCP/CLI). `git-config` identity alone caps `user.confidence` and **cannot** prove
  `owner`/`maintainer` (see `repository-context-resolution-policy.md`).
- **reviewRequest.providerType** — `pull-request` for GitHub/Azure DevOps PRs; `changeset`
  reserved for other changeset models; `unknown` when none is resolvable.
- **authority** — the posture that gates repo-wide operations (notably `chaos:sync --all`).
  `repoWideSyncAllowed` is `unknown` whenever provider authority cannot be proven.
- **resolution.fallbackLevel** — the *highest* source actually used: `mcp` > `cli` > `git` >
  `manual` > `none`. `missingCapabilities` lists provider capabilities a command wanted but
  could not reach (e.g. `code_security`, `builds`). `warnings` record redactions, stale data,
  or capability gaps.

## How commands consume the contract

- Resolve context through the resolution policy (`repository-context-resolution-policy.md`),
  never by calling a provider API directly from command logic.
- Treat every block as optional. Degrade gracefully: a missing block lowers confidence, it
  does not crash the command.
- Record the **proof** of what was resolved in the command report using the shared
  "Repository Context" section (see below). Never invent fields.
- Honour the security posture (`mcp-security-policy.md`): read-only by default, no secrets in
  reports, redact sensitive values.

## Repository Context report section (shared shape)

Commands that surface context use this exact section so reports stay comparable:

```markdown
## Repository Context

Provider: github | azure-devops | local-git | unknown
Context source: github-mcp | azure-devops-mcp | gh-cli | az-devops-cli | git | manual
Branch: <branch>
Default branch: <branch-or-unknown>
Review request: <id/url-or-none>
User: <resolved user-or-unknown>
Authority confidence: HIGH | MEDIUM | LOW
Repo-wide sync posture: ALLOWED | REQUIRES_CONFIRMATION | BLOCKED
Missing capabilities:
- <capability-or-none>
```

## Related

- `repository-context-resolution-policy.md` — how each block is resolved and how confidence
  is capped.
- `github-mcp-integration.md`, `azure-devops-mcp-integration.md` — provider adapters.
- `mcp-security-policy.md`, `mcp-tool-profiles.md` — security posture and per-command toolsets.
- `hooks-repository-context-policy.md` — vNext hook policy consuming this contract.
