# CHAOS Artifact Metadata Schema

YAML frontmatter, keyed `chaosMetadata`, as the first block of a CHAOS-owned Markdown file.

## Shape

```yaml
---
chaosMetadata:
  schemaVersion: 1
  artifactType: status-report
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:status
  lastWrittenAt: 2026-07-01T09:42:00+02:00
  lastWrittenBy: vscode-user
  lastAuditedAt: 2026-07-01T09:42:00+02:00
  lastAuditedBy: vscode-user
  repositoryContext:
    provider: github
    branch: main
    reviewRequest: null
    contextSource: github-mcp
    confidence: HIGH
  metadata:
    identitySource: github-mcp
    timestampSource: local-system
    confidence: HIGH
---
```

Change-scoped artifacts additionally carry `artifactScope: change` and a non-null `changeId`:

```yaml
chaosMetadata:
  schemaVersion: 1
  artifactType: verification-report
  artifactScope: change
  changeId: add-task-query-filters
  sourceCommand: chaos:verify
  ...
```

The hook script also writes an internal `metadata.bodyHash` field (`sha256:<64 hex chars>`),
used only to detect material body changes between runs — see
`artifact-metadata-hook-policy.md` for the churn rule. It is not part of the schema contract
external tools must produce, but the hook script preserves and updates it.

## Field rules

- Frontmatter must be the first block in the file (`---` on line 1, a matching closing `---`).
- Top-level key is `chaosMetadata`; `schemaVersion` must be present and equal to `1`.
- `lastWrittenAt` / `lastAuditedAt` must be ISO-8601 timestamps **with a timezone offset**
  (`+02:00`, `Z`, etc.) — a bare local timestamp without offset is invalid.
- `lastWrittenBy` / `lastAuditedBy` must not contain secrets, tokens, or raw email by default
  (see identity resolution in `artifact-metadata-config.md`). Use `unknown` when identity
  cannot be resolved — never leave the field empty.
- `repositoryContext.confidence` and `metadata.confidence` must be one of `HIGH`, `MEDIUM`,
  `LOW` (exact case).
- `changeId` is `null` for repository-scoped/topic-scoped artifacts, and the change slug for
  change-scoped artifacts.
- Never include tokens, PATs, connection strings, cookies, raw `Authorization` headers, or any
  other secret in any `chaosMetadata` field. The hook script scrubs values that look like
  secrets (replacing them with `unknown`/`null` and lowering confidence) rather than writing
  them — see `artifact-metadata-validation.md`.

## artifactType / artifactScope / changeId inference

Inferred from path by the hook script (`infer_artifact()` in
`scripts/chaos-artifact-metadata-hook.py`); a repository does not need to set these by hand.

| Path pattern | artifactType | artifactScope | changeId |
|---|---|---|---|
| `.chaos/status-report.md` | `status-report` | `repository` | `null` |
| `.chaos/bootstrap-report.md` | `bootstrap-report` | `repository` | `null` |
| `.chaos/architecture.md` / `context.md` / `constitution.md` / `README.md` | `architecture` / `context` / `constitution` / `workspace-readme` | `repository` | `null` |
| `.chaos/changes/<id>/proposal-review.md` | `proposal-review` | `change` | `<id>` |
| `.chaos/changes/<id>/approval.md` | `approval` | `change` | `<id>` |
| `.chaos/changes/<id>/apply-report.md` | `apply-report` | `change` | `<id>` |
| `.chaos/changes/<id>/code-review.md` | `code-review` | `change` | `<id>` |
| `.chaos/changes/<id>/verification.md` | `verification-report` | `change` | `<id>` |
| `.chaos/changes/<id>/archive-report.md` | `archive-report` | `change` | `<id>` |
| `.chaos/changes/<id>/sync-report.md` | `change-sync-report` | `change` | `<id>` |
| `.chaos/changes/<id>/retro.md` | `retro` | `change` | `<id>` |
| `.chaos/changes/<id>/lifecycle.md` | `lifecycle` | `change` | `<id>` |
| `.chaos/archaeology/index.md` | `archaeology-index` | `topic` | `null` |
| `.chaos/archaeology/*.md` (other) | `archaeology-report` | `topic` | `null` |
| `.chaos/sync-reports/*.md` | `repository-sync-report` | `repository` | `null` |
| `.chaos/doctor/*.md` | `doctor-report` | `repository` | `null` |
| `.chaos/rules/*.md` | `rule` | `repository` | `null` |
| `.chaos/gates/*.md` | `gate` | `repository` | `null` |
| `.chaos/decisions/*.md` | `decision` | `repository` | `null` |
| `docs/adr/*.md` (only if managed) | `adr` | `repository` | `null` |
| `docs/decision-log/*.md` (only if managed) | `decision-log` | `repository` | `null` |
| anything else | `unknown` | `unknown` | `null` |

`sourceCommand` resolves from `.chaos/runtime/active-command.json` when present (`HIGH`
confidence contribution), else from a static artifactType→command fallback table (`MEDIUM`),
else `unknown` (`LOW`). The hook never invents a high-confidence `sourceCommand`.

## Related

- `artifact-metadata-hook-policy.md`
- `artifact-metadata-config.md`
- `artifact-metadata-validation.md`
