# CHAOS Artifact Metadata Hook — Policy

Scope of this capability: **only** provenance metadata for CHAOS-owned Markdown artifacts.
This is not the full hooks capability set described in
`.claude/skills/chaos-shared/reference/hooks-repository-context-policy.md` — it does not
implement command-boundary guards, protected-file write guards, sync-authority guards, or
broad MCP/repository-context enforcement. Those remain specification-only until a future task
implements them.

## Core principle

CHAOS artifacts must be auditable, but metadata must not churn on every command run. A
`chaosMetadata.lastWrittenAt`/`lastWrittenBy` pair changes **only** when the Markdown body
materially changed. A `chaosMetadata.lastAuditedAt`/`lastAuditedBy` pair changes **only** when
an explicit stamp/audit operation ran (`--stamp`) **and** either the body changed or
`policies.artifactMetadata.allowAuditOnlyStamp` is `true`. Running a hook in `--check-only`
mode, or running `--stamp` against an unchanged, already-valid file with
`allowAuditOnlyStamp: false` (the default), writes nothing.

## What this capability does

- Defines a standard `chaosMetadata` YAML frontmatter schema
  (`artifact-metadata-schema.md`).
- Validates that schema against CHAOS-owned Markdown files
  (`artifact-metadata-validation.md`).
- Optionally stamps (inserts/repairs) that schema when explicitly asked to (`--stamp`), subject
  to the material-change rule above.
- Runs as a Claude Code `PostToolUse` hook (single edited/written Markdown file) and a `Stop`
  hook (full managed-file sweep + summary).
- Consumes existing repository-context/session data if present
  (`.chaos/runtime/session-context.json`, `.chaos/runtime/active-command.json`) and otherwise
  falls back to local `git` — it does not resolve MCP/CLI context itself.

## What this capability does not do

- It does not guard `AGENTS.md`, root `README.md`, or `.chaos/config.yaml` against arbitrary
  edits — see the (currently spec-only) protected-file/command-boundary guard policy in
  `hooks-repository-context-policy.md`.
- It does not migrate existing artifacts. Files without `chaosMetadata` are reported as
  `missing`, never silently backfilled outside an explicit `--stamp` run.
- It does not stamp files outside `policies.artifactMetadataManagedFiles.include` (see
  `artifact-metadata-config.md`) — notably root `README.md` and `AGENTS.md` are excluded by
  default, and `docs/adr/**` / `docs/decision-log/**` are only *optional* candidates until a
  repository opts them into `include`.
- It does not implement a general MCP/GitHub/Azure repository-context resolver; it reads
  `.chaos/runtime/session-context.json` if some other tool already wrote it, and otherwise uses
  plain `git` commands.

## Hook roles used here

- **PostToolUse** — after `Edit`/`Write`/`MultiEdit` on a `.md` file, validate (and, if
  `--stamp` was passed to the wired command, stamp) that single file if it is CHAOS-managed.
- **Stop** — sweep every CHAOS-managed Markdown file in the repository and report a concise
  validity summary; block (exit 2) only when `--strict` is set and policy requires it.

`SessionStart` is intentionally not implemented in this delivery (optional per the originating
task; broad session-context warming is out of scope here).

## Related

- `artifact-metadata-schema.md` — the `chaosMetadata` frontmatter schema.
- `artifact-metadata-config.md` — `policies.artifactMetadata` / `artifactMetadataManagedFiles`
  contract in `.chaos/config.yaml`.
- `artifact-metadata-validation.md` — validation rules and manual validation usage.
- `../README.md` — installation, profiles, troubleshooting.
- `.claude/skills/chaos-shared/reference/hooks-repository-context-policy.md` — the broader,
  still-spec-only hooks policy this capability is a first, narrow slice of.
- `.claude/skills/chaos-shared/reference/mcp-security-policy.md` — no-secrets/read-only-by-default
  posture this hook also follows.
