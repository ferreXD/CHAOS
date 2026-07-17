# CHAOS MCP Tool Profiles

Command-specific, **least-privilege** capability profiles for repository-context resolution.
Each command requests only the GitHub toolsets / Azure DevOps domains it needs. Absent
capabilities degrade context (warnings); they do not fail the command unless the mode requires
the provider-backed fact (`mcp-security-policy.md`).

GitHub toolsets: `repos`, `pull_requests`, `issues`, `code_security`.
Azure DevOps domains: `core`, `repositories`, `work-items`, `builds`.

```yaml
mcpToolProfiles:
  doctor:
    github: [repos, pull_requests]
    azureDevOps: [core, repositories]

  status:
    github: [repos, pull_requests]
    azureDevOps: [core, repositories]

  codeReview:
    github: [repos, pull_requests, issues, code_security]
    azureDevOps: [repositories, work-items, builds]

  syncChange:
    github: [repos, pull_requests, issues]
    azureDevOps: [repositories, work-items]

  syncAll:
    github: [repos, pull_requests, issues]
    azureDevOps: [repositories, work-items, builds]

  archive:
    github: [repos, pull_requests]
    azureDevOps: [repositories, work-items]

  verify:
    github: [repos, pull_requests]
    azureDevOps: [repositories, builds]

  propose:
    github: [repos]
    azureDevOps: [core, repositories]

  review:
    github: [repos, pull_requests]
    azureDevOps: [repositories, work-items]

  apply:
    github: [repos, pull_requests]
    azureDevOps: [repositories, work-items]
```

## Usage rules

- A command requests **only** its profile's capabilities; do not request write-capable
  toolsets for read-only commands.
- If a profiled capability is unavailable, record it in `resolution.missingCapabilities` and
  proceed with reduced confidence.
- Profiles are read by the resolver/adapters, not hard-coded into command semantics.
- `code_security` (GitHub) and `builds` (Azure DevOps) are opt-in, enabled per command profile
  and only when configured.

## Related

- `repository-context-resolution-policy.md`
- `mcp-security-policy.md`
- `github-mcp-integration.md`, `azure-devops-mcp-integration.md`
