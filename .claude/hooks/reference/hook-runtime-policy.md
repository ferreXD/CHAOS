# CHAOS vNext Runtime Hooks — Policy

Scope of this capability: the **local runtime observability backbone** —
`.chaos/runtime/session-context.json`, `active-command.json`,
`touched-files.jsonl`, `hook-violations.jsonl`, `decision-waits.jsonl` — and
the five hook scripts that maintain them
(`chaos-session-context.py`, `chaos-active-command.py`,
`chaos-touched-files.py`, `chaos-stop-summary.py`, plus the shared
`chaos-hook-common.py`). This is a separate, narrower capability than
`chaos-artifact-metadata-hook.py` (provenance metadata on Markdown
artifacts — see `artifact-metadata-hook-policy.md`), though the metadata
hook consumes `session-context.json`/`active-command.json` if this
capability has already produced them.

## Core principle

**Hooks should make CHAOS observable before they become enforcement-heavy.**
This delivery only *records* what is happening (repository/session context,
which CHAOS command looks active, which files were touched, warnings, and
apparent decision waits). It never blocks a turn by default, never guards
protected files, never enforces command-boundary or sync-authority rules,
and never stamps provenance metadata. Those are separate, larger
capabilities that may be built **on top of** this observability data in a
future task — they are out of scope here.

## What is intentionally not implemented

- **No protected-file blocking.** Editing `AGENTS.md`, root `README.md`,
  `.chaos/config.yaml`, etc. is not guarded by anything in this delivery.
- **No command-boundary enforcement.** `activeCommand.readOnly`,
  `.scope`, and `.allowedWriteGlobs` are recorded hints, not gates. No hook
  here blocks a write because it falls outside them.
- **No sync-authority blocking.** `chaos:sync --all` repo-wide-sync gating
  (`policies.repositoryContext.*` in `.chaos/config.yaml`,
  `repository-context-resolution-policy.md`) is not implemented by these
  hooks.
- **No automatic provenance metadata stamping.** That is
  `chaos-artifact-metadata-hook.py`'s job, wired separately.
- **No MCP/CLI repository-context resolution.** `chaos-session-context.py`
  only ever calls local `git`; it never talks to a GitHub/Azure DevOps MCP
  server or CLI. It happily reuses `session-context.json` if some other
  tool already wrote richer, provider-backed context — it just doesn't
  produce that richer context itself.

## Runtime files are ephemeral, not durable governance

Everything under `.chaos/runtime/` is local, disposable, per-machine/session
scratch state:

- It is **not** a CHAOS governance artifact (unlike `.chaos/changes/**`,
  `.chaos/decisions/**`, ADRs, etc.) and carries no `chaosMetadata`
  frontmatter — these are JSON/JSONL, not Markdown.
- It is git-ignored (`.chaos/runtime/` in `.gitignore`) and must never be
  committed.
- It can be deleted at any time with no loss of durable history; the next
  hook invocation recreates it from scratch (or best-effort git state).
- Existing CHAOS artifacts (status reports, doctor reports, decision logs,
  etc.) are never migrated into this runtime state, and this runtime state
  is never migrated into them.

## Report-only by default; strict mode is opt-in

Every hook script defaults to writing `WARN`/`INFO` entries to
`hook-violations.jsonl` and exiting `0`. Passing `--strict` makes a script
exit non-zero (`2`, the Claude Code blocking convention) **only** for
critical runtime errors it cannot recover from gracefully — e.g. a runtime
JSON file that exists but fails to parse. Ordinary findings (no command
detected, an expected artifact missing at stop, an un-normalizable touched
path) remain warnings even under `--strict`; see
`hook-violation-contract.md` for the full severity model.

## No secrets

No hook script in this capability writes tokens, PATs, connection strings,
or other credential-shaped values to any runtime file — see
`safe_string()` / `detect_secret_like_value()` in `chaos-hook-common.py`.
Email addresses are the one intentionally-permitted exception: raw email is
stored in `session-context.json.user.email` **only** when it came from
local `git config user.email` (never a provider identity API, which this
hook doesn't call), and only ever tagged `identitySource: git-config` with
`confidence: LOW` or `MEDIUM` — never `HIGH`.

## No production code touched

This capability only adds files under `.claude/hooks/` and
`.chaos/runtime/*` (plus the `policies.hooks.runtimeObservability` block in
`.chaos/config.yaml` and the `.chaos/runtime/` line in `.gitignore`). It
does not modify application source, tests, migrations, OpenSpec change
content, or ADR decisions.

## Related

- `runtime-file-contract.md` — the five runtime file schemas.
- `active-command-detection.md` — command/mode/changeId parsing rules.
- `touched-files-audit.md` — how file touches are extracted and logged.
- `decision-wait-contract.md` — best-effort decision-wait detection.
- `hook-violation-contract.md` — severity levels and `CHAOS-HOOK-*` codes.
- `artifact-metadata-hook-policy.md` — the separate provenance-metadata
  capability that *consumes* `session-context.json`/`active-command.json`.
- `.claude/skills/chaos-shared/reference/hooks-repository-context-policy.md`
  — the broader, still-spec-only hooks policy (protected-file guards,
  command-boundary guards, sync-authority guards) this delivery is a first,
  narrow, observability-only slice of.
- `.claude/skills/chaos-shared/reference/repository-context-contract.md` —
  the fuller provider-neutral `repositoryContext` shape;
  `session-context.json` is a lighter-weight, local-git-only capture in the
  same spirit, not a wire-compatible implementation of that contract.
- `PATCH-SUMMARY.md` (repo root) — what this delivery added and why.
