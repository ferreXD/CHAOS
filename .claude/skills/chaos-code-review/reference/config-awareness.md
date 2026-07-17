# Config Awareness — chaos:code-review

Read `.chaos/config.yaml` before resolving paths or planning the review report. Use
configured paths before defaults.

## Values used

| Need | Config source | Default |
|---|---|---|
| Change-scoped artifacts | `paths.changes` | `.chaos/changes` |
| Non-change code-review reports | `paths.codeReviews` (if declared) | `.chaos/code-reviews` |
| OpenSpec change context | `paths.openspec` | `openspec` |
| C# / build / test validation commands | `validation.build`, `validation.test` | `dotnet build`, `dotnet test` |
| Code-review driver agent | `agents.claude.*` (informational) | `code-reviewer` |
| Protected files | `policies.protectedFiles` | — (review reads, never edits) |

`paths.codeReviews` may not exist in older config; if absent, default to
`.chaos/code-reviews/` and note it. Recommending that `chaos:init`/`chaos:sync` add
`paths.codeReviews` is allowed; do not edit config from this command.

## If config is missing or partial

- `--light`: infer defaults and warn.
- `--standard`: infer defaults, warn, recommend `chaos:status` / `chaos:init` repair.
- `--strict`: ask whether to continue with inferred paths or stop when config affects review
  safety (one decision, STOP).

## Config status in the report

Record one of: `CONFIG_OK | CONFIG_MISSING | CONFIG_PARTIAL | CONFIG_CONFLICT |
CONFIG_UNSUPPORTED_VERSION`, the values used, and any confidence impact.

Do not edit `.chaos/config.yaml` from `chaos:code-review`. Route config drift remediation to
`chaos:status` or `chaos:sync`.
