# CHAOS Artifact Metadata Schema

YAML frontmatter, keyed `chaosMetadata`, as the first block of a CHAOS-owned Markdown file.

## Shape

```yaml
---
chaosMetadata:
  schemaVersion: 1
  artifactType: decision
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:run
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

Every lean-core artifact is repository-scoped (`artifactScope: repository`, `changeId: null`);
the decision record's change identity lives in its filename slug and body, not in the
frontmatter. `artifactScope: change` / non-null `changeId` remain valid schema values for
compatibility with artifacts written before the 2026-08 strip (tag `apparatus-final`).

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
| `.chaos/bootstrap-report.md` | `bootstrap-report` | `repository` | `null` |
| `.chaos/architecture.md` / `.chaos/context.md` | `architecture` / `context` | `repository` | `null` |
| `.chaos/decisions/*.md` | `decision` | `repository` | `null` |
| `docs/adr/*.md` (only if managed) | `adr` | `repository` | `null` |
| anything else | `unknown` | `unknown` | `null` |

`sourceCommand` resolves from `.chaos/runtime/active-command.json` when present (`HIGH`
confidence contribution), else from a static artifactType→command fallback table (`MEDIUM`),
else `unknown` (`LOW`). The hook never invents a high-confidence `sourceCommand`.

## Related

- `artifact-metadata-hook-policy.md`
- `artifact-metadata-config.md`
- `artifact-metadata-validation.md`
