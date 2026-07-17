# chaos:doctor — Check Catalog

Run these checks one by one. Each yields `PASS | WARN | FAIL | UNKNOWN` with confidence.
Read-only; honour `mcp-security-policy.md` (least privilege, no secrets, redact).

## Runtime & tooling (`CD-RT-*`)

| ID | Check | FAIL/blocker semantics |
|---|---|---|
| CD-RT-01 | `git --version` available | FAIL → NOT_READY |
| CD-RT-02 | Inside a git repository | FAIL → UNKNOWN (cannot resolve context) |
| CD-RT-03 | OpenSpec available (`openspec --version`) | WARN; FAIL → NOT_READY only if OpenSpec-dependent flow requested |
| CD-RT-04 | Configured build command resolvable (`validation.build`) | WARN |
| CD-RT-05 | Configured test command resolvable (`validation.test`) | WARN |
| CD-RT-06 | Node `>= 20.19.0`, npm present (OpenSpec compatibility) | WARN |

## Repository / provider context (`CD-REPO-*`)

| ID | Check | Notes |
|---|---|---|
| CD-REPO-01 | Provider detection (`integrations.repository.provider` / remote inference) | github / azure-devops / local-git / unknown |
| CD-REPO-02 | Remote URL resolved (`git remote -v`) | WARN if no remote |
| CD-REPO-03 | Current branch (`git branch --show-current`) | — |
| CD-REPO-04 | Default branch discoverable | WARN if unknown |
| CD-REPO-05 | Working tree status (`git status --porcelain`) | informational |
| CD-REPO-06 | Current git user (`git config user.name/email`) | identity only; cannot prove role |
| CD-REPO-07 | Repository context confidence | from resolution policy |
| CD-REPO-08 | Repo-wide sync authority confidence | LOW when only local git resolved |

## Provider readiness (`CD-PROV-*`)

Run the GitHub checks when provider is `github` or `auto`; the Azure checks when provider is
`azure-devops` or `auto`. Use the `doctor` tool profile (least privilege).

| ID | Check | Notes |
|---|---|---|
| CD-PROV-GH-01 | GitHub MCP availability/reachability | WARN if unavailable (optional) |
| CD-PROV-GH-02 | `gh` CLI availability + auth (when GitHub fallback allowed) | WARN if missing/unauth |
| CD-PROV-AZ-01 | Azure DevOps MCP availability/reachability (remote/local) | WARN if unavailable (optional) |
| CD-PROV-AZ-02 | `az devops` CLI availability + auth (when Azure fallback allowed) | WARN if missing/unauth |
| CD-PROV-03 | Provider-specific missing capabilities | list in report `missingCapabilities` |

## MCP & hooks (`CD-MCP-*`, `CD-HOOK-*`)

Hook checks are **advisory/reference** on the Copilot surface: they inspect Claude-runtime hook
presence and configuration for cross-runtime parity. GitHub Copilot does not execute Claude
hooks natively, so `CD-HOOK-*` results are never a `READY` blocker here. The underlying runtime
file contracts are still reported.

| ID | Check | Notes |
|---|---|---|
| CD-MCP-01 | MCP configured & reachable for active provider(s) | WARN if absent; FAIL→BLOCKED only when `--strict`/`--mcp` requires a provider-backed fact |
| CD-MCP-02 | MCP posture is read-only / least-privilege per config | WARN if misconfigured |
| CD-HOOK-01 | Claude hooks present (advisory; only if configured in repo conventions) | WARN/skip if hooks not adopted; never a Copilot-surface blocker |
| CD-HOOK-02 | Protected-file guard presence (if configured) | WARN if expected but absent |
| CD-HOOK-03 | Artifact-metadata hook package present (`.claude/hooks/scripts/chaos-artifact-metadata-hook.py`, `reference/artifact-metadata-*.md`) | WARN/skip if not adopted; informational otherwise |
| CD-HOOK-04 | `.chaos/config.yaml` declares `policies.artifactMetadata` / `policies.artifactMetadataManagedFiles` | WARN if hook package present but config section missing |
| CD-HOOK-05 | If wired into Claude runtime settings, hook command resolves to a runnable Python 3 interpreter | WARN if wired but interpreter unresolvable (see hook README troubleshooting) |
| CD-HOOK-06 | CHAOS-managed Markdown artifacts contain valid `chaosMetadata` | Report-only; run the artifact-metadata check in `--check-only` mode for detail. Not required for `READY` unless a repository opts into strict enforcement. |

## Mode-gated escalation

- Default/standard: missing optional capabilities → `WARN` → `READY_WITH_WARNINGS`.
- `--strict`: a mode-required provider-backed fact that cannot be resolved → `BLOCKED`.
- `--mcp`/`--github`/`--azure-devops`/`--hooks`: scope the catalog to that area; the same
  escalation rules apply within scope.

## Related

- `doctor-contract.md`
- `.github/skills/chaos-shared/reference/repository-context-resolution-policy.md`
