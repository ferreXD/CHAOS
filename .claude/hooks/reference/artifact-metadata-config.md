# CHAOS Artifact Metadata — Config Contract

Declared in `.chaos/config.yaml` under `policies.artifactMetadata` and
`policies.artifactMetadataManagedFiles`.

```yaml
policies:
  artifactMetadata:
    enabled: true
    requireOnChaosMarkdown: true
    identityMode: provider-username # provider-username | git-name | git-email | configured-alias | anonymous
    configuredAlias: ""
    includeRepositoryContext: true
    updateTimestampOnlyOnMaterialChange: true
    allowAuditOnlyStamp: false
    stampSharedNonChaosFiles: false
    failOnMissingMetadataInStrictHooks: true
    warnOnMissingMetadataInContributorHooks: true

  artifactMetadataManagedFiles:
    include:
      - ".chaos/**/*.md"
    optional:
      - "docs/adr/**/*.md"
      - "docs/decision-log/**/*.md"
    exclude:
      - "README.md"
      - "AGENTS.md"
```

If a repository's `config.yaml` already has a similar section, merge into it — do not
duplicate `policies.artifactMetadata*` keys.

## `include` / `optional` / `exclude` semantics

- **`exclude`** always wins. Root `README.md` and `AGENTS.md` are excluded by default and are
  never stamped, per acceptance criterion 11 of the originating task — even if a pattern in
  `include` would otherwise match them.
- **`include`** patterns are the active managed set: files the hook validates/stamps.
- **`optional`** patterns (by default `docs/adr/**/*.md`, `docs/decision-log/**/*.md`) are
  *recognized but inactive*. They are never validated or stamped unless a repository
  explicitly moves the pattern (or an equivalent) into `include`. This is how "only if marked
  or configured as CHAOS-managed" is implemented — there is no per-file frontmatter marker;
  the config's `include` list **is** the marker. The `Stop` summary lists optional-but-inactive
  file counts purely as an informational footer.
- Patterns use `**` glob semantics (matched via Python's `glob.glob(..., recursive=True)`, so
  `.chaos/**/*.md` matches both `.chaos/status-report.md` directly and
  `.chaos/changes/<id>/lifecycle.md`).

## Policy flags

| Flag | Effect |
|---|---|
| `enabled` | Master switch. `false` makes both hook events a no-op. |
| `requireOnChaosMarkdown` | Missing metadata on a managed file is reportable (warn by default, block in `--strict` when `failOnMissingMetadataInStrictHooks` is true). |
| `identityMode` | See identity resolution below. |
| `configuredAlias` | Used only when `identityMode: configured-alias`. |
| `includeRepositoryContext` | If `false`, the `repositoryContext` block is omitted from newly stamped metadata. |
| `updateTimestampOnlyOnMaterialChange` | Documents the churn rule; the hook script always enforces it (see `artifact-metadata-hook-policy.md`). |
| `allowAuditOnlyStamp` | If `true`, running `--stamp` against an unchanged, already-valid file still refreshes `lastAuditedAt`/`lastAuditedBy` (an explicit "I re-audited this and nothing changed" action). If `false` (default), an unchanged valid file is left untouched even under `--stamp`. |
| `stampSharedNonChaosFiles` | Reserved for a future, broader hooks capability; the current script never stamps `exclude`d files regardless of this flag. |
| `failOnMissingMetadataInStrictHooks` | When `--strict` is passed to the hook script, missing/invalid metadata on a managed file makes the hook exit `2` (blocking). |
| `warnOnMissingMetadataInContributorHooks` | When not `--strict`, missing/invalid metadata prints a remediation message but the hook still exits `0`. |

## Identity resolution (`identityMode`)

Resolved by `resolve_identity()` in `scripts/chaos-artifact-metadata-hook.py`:

| Mode | Resolution | Fallback |
|---|---|---|
| `provider-username` (default) | `.chaos/runtime/session-context.json` `username` field | `git config user.name` → `unknown` |
| `git-name` | `git config user.name` | `unknown` |
| `git-email` | `git config user.email` (only used when explicitly configured this way) | `unknown` |
| `configured-alias` | `policies.artifactMetadata.configuredAlias` | `unknown` |
| `anonymous` | always `"anonymous"` | n/a |

The default (`provider-username`, falling back to `git-name`) deliberately avoids raw email
exposure. `git-email` only applies when a repository explicitly opts into it. Any resolved
identity value that looks like a secret/token is discarded and replaced with `unknown`
(`LOW` confidence) — see `artifact-metadata-validation.md`.

## Repository context sources (resolution order)

1. `.chaos/runtime/session-context.json`, if present (not created by this capability).
2. GitHub/Azure DevOps MCP-resolved context via the existing repository-context resolver, if
   some other CHAOS capability already populated (1). This hook does **not** call MCP itself.
3. CLI fallback (`gh`/`az devops`), if some other tool already resolved it into (1). This hook
   does **not** shell out to those CLIs itself.
4. Local `git` fallback: `git branch --show-current`, `git config user.name`/`user.email`,
   `git remote get-url origin` (provider inferred from the remote host — `dev.azure.com` /
   `visualstudio.com` → `azure-devops`, `github.com` → `github`, otherwise `local-git`).
5. `unknown` — no git repository, no remote, no session context.

This hook intentionally does not implement a full repository-context resolver (that remains
the scope of `hooks-repository-context-policy.md` / the vNext resolver); it only *consumes*
`.chaos/runtime/session-context.json` if some other part of the system already wrote it, and
otherwise falls back to the plain local-git chain above.

## Related

- `artifact-metadata-hook-policy.md`
- `artifact-metadata-schema.md`
- `artifact-metadata-validation.md`
- `.claude/skills/chaos-shared/reference/repository-context-contract.md`
