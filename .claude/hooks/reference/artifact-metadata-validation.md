# CHAOS Artifact Metadata — Validation

What the hook script checks, and how to run validation without modifying anything.

## Manual validation (never writes)

```bash
# Full repository sweep, report-only
python3 .claude/hooks/scripts/chaos-artifact-metadata-hook.py --event stop --check-only

# Same, but block (exit 2) on any missing/invalid managed-file metadata
python3 .claude/hooks/scripts/chaos-artifact-metadata-hook.py --event stop --check-only --strict

# Preview what --stamp would change, without writing
python3 .claude/hooks/scripts/chaos-artifact-metadata-hook.py --event stop --stamp --dry-run
```

`--check-only` always wins over `--stamp` if both are passed — it forces read-only validation.

## Checks performed per managed file

| Code | Severity | Meaning |
|---|---|---|
| `MISSING_FRONTMATTER` | ERROR | File has no `---`-delimited frontmatter block at all. |
| `MISSING_CHAOS_METADATA` | ERROR | Frontmatter exists but has no `chaosMetadata` key. |
| `INVALID_SCHEMA_VERSION` | ERROR | `schemaVersion` is missing or not `1`. |
| `INVALID_TIMESTAMP` | ERROR | `lastWrittenAt`/`lastAuditedAt` missing, unparseable, or lacks a timezone offset. |
| `MISSING_LAST_WRITTEN_BY` / `MISSING_LAST_AUDITED_BY` | ERROR | Identity field missing/empty. |
| `SECRET_LIKE_VALUE` | ERROR | An identity field matches a secret/token pattern (see below) — never write, always flag. |
| `UNKNOWN_IDENTITY` | WARN | Identity field is literally `"unknown"` — valid, but worth surfacing so a repository can configure a better `identityMode`. |
| `INVALID_CONFIDENCE` | ERROR | `repositoryContext.confidence` / `metadata.confidence` not one of `HIGH`/`MEDIUM`/`LOW`. |
| `MISSING_METADATA_BLOCK` | WARN | The `metadata` sub-block (`identitySource`/`timestampSource`/`confidence`) is absent. |
| `MALFORMED_BODY_HASH` | WARN | `metadata.bodyHash` present but not `sha256:<64 hex chars>`. |

A file with any `ERROR`-level issue is reported `invalid` (or `missing` if the issue is
`MISSING_FRONTMATTER`/`MISSING_CHAOS_METADATA`); `WARN`-only files are still `ok`.

The `Stop` summary additionally reports, purely informationally, how many files match an
`optional` pattern (see `artifact-metadata-config.md`) but are not currently in `include` —
these are never validated as managed and never counted toward `missing`/`invalid`.

## Secret scrubbing

Before writing any identity/command/review-request value, and when validating an existing
one, the hook checks it against a set of secret-like patterns (GitHub tokens `ghp_...` /
`github_pat_...`, AWS access keys `AKIA...`, JWT-shaped strings, PEM private key headers,
`Bearer <token>`, `password=`/`token=`/`connectionstring=`-style assignments, and generic
40+ character base64/hex blobs). A value that matches:

- during **stamping** — is discarded; the field is written as `unknown` (identity) or `null`
  (review request) and the contributing confidence drops to `LOW`. Nothing secret-looking is
  ever written to disk.
- during **validation of an existing file** — is reported as `SECRET_LIKE_VALUE` (ERROR), so a
  repository can catch a secret that got hand-typed into a `chaosMetadata` block before it is
  committed further.

`metadata.bodyHash` is exempt from this heuristic (a `sha256:` hex digest legitimately looks
like a long hex blob); it is instead checked against the expected `sha256:[0-9a-f]{64}` shape.

## Material-change detection

See `artifact-metadata-hook-policy.md` for the full churn rule. In short: the hook hashes the
Markdown body (frontmatter stripped) and compares it to the `metadata.bodyHash` already stored
in the file. If they differ, the change is material and `lastWrittenAt`/`lastWrittenBy` (plus
the stored hash) update on the next `--stamp`. If they match, or if there is no prior hash to
compare against, the file is left untouched — the hook never assumes a change happened just
because it ran.

## Related

- `artifact-metadata-hook-policy.md`
- `artifact-metadata-schema.md`
- `artifact-metadata-config.md`
