# CHAOS Hooks

Claude Code hooks for CHAOS. Two independent capabilities live here today:

1. **Runtime observability (vNext)** — local `.chaos/runtime/*` state
   (session/repository context, active command, touched files, hook
   warnings, decision waits) maintained by `chaos-session-context.py`,
   `chaos-active-command.py`, `chaos-touched-files.py`,
   `chaos-stop-summary.py`, and the shared `chaos-hook-common.py`.
2. **Artifact provenance metadata** — `chaosMetadata` YAML frontmatter on
   CHAOS-owned Markdown artifacts, validated/stamped by
   `chaos-artifact-metadata-hook.py`.

Both are optional, standard-library-only Python 3 tooling. Neither is
wired into a committed `.claude/settings.json` by default — installing
either is a per-developer/per-repository choice (see "Installing the
hooks" below). Capability 2 *consumes* capability 1's runtime files if
they exist, but works fine without them (falls back to plain `git`).

## Files in this package

```text
.claude/hooks/
  README.md                                        -- this file
  settings.runtime-observability.example.json       -- example wiring for capability 1
  settings.artifact-metadata.example.json           -- example wiring for capability 2
  scripts/
    chaos-hook-common.py                             -- shared stdlib utilities for capability 1
    chaos-session-context.py                         -- writes .chaos/runtime/session-context.json
    chaos-active-command.py                          -- writes .chaos/runtime/active-command.json
    chaos-touched-files.py                           -- appends .chaos/runtime/touched-files.jsonl
    chaos-stop-summary.py                            -- reads all runtime files, prints a stop summary
    chaos-artifact-metadata-hook.py                  -- capability 2 (self-contained, no shared import)
  reference/
    hook-runtime-policy.md                           -- capability 1 scope/principles
    runtime-file-contract.md                         -- capability 1 file schemas
    active-command-detection.md                      -- command/mode/changeId parsing rules
    touched-files-audit.md                           -- file-touch extraction rules
    decision-wait-contract.md                        -- best-effort decision-wait detection
    hook-violation-contract.md                       -- severity levels + CHAOS-HOOK-* codes
    artifact-metadata-hook-policy.md                 -- capability 2 scope/principles
    artifact-metadata-schema.md                      -- chaosMetadata schema
    artifact-metadata-config.md                      -- capability 2 config contract
    artifact-metadata-validation.md                  -- capability 2 validation rules
```

## Capability 1: Runtime Observability Hooks (vNext)

### Purpose

Give CHAOS commands (and a human reading `.chaos/runtime/*` directly) a
local, best-effort answer to five questions during a session:

- **Where am I?** (`session-context.json` — provider, repo, branch, user,
  working tree, resolved from local `git`, tolerant of non-git dirs)
- **What CHAOS command looks active?** (`active-command.json` — parsed
  from the prompt text; mode, scope, changeId, read-only/write hints)
- **What files has the agent touched?** (`touched-files.jsonl` — one
  record per `Edit`/`Write`/`MultiEdit`/file-shaped `Bash` call)
- **What did the hooks warn about?** (`hook-violations.jsonl` — the
  shared `INFO`/`WARN`/`ERROR`/`BLOCKED` log every script writes to)
- **Is the agent waiting on me?** (`decision-waits.jsonl` — best-effort;
  see `reference/decision-wait-contract.md`)

**Core principle: hooks should make CHAOS observable before they become
enforcement-heavy.** This capability only *records* state. It does not
guard protected files, does not enforce command-boundary or scope rules,
does not gate `chaos:sync --all` authority, and does not stamp provenance
metadata — see "What this does not do" below and
`reference/hook-runtime-policy.md` for the full scope statement.

### What each runtime file is for

| File | Written by | Purpose |
| --- | --- | --- |
| `.chaos/runtime/session-context.json` | `chaos-session-context.py` | Best-effort local repo/branch/user/working-tree snapshot. |
| `.chaos/runtime/active-command.json` | `chaos-active-command.py` | Which CHAOS command the current prompt looks like, plus scope/mode/write hints. |
| `.chaos/runtime/touched-files.jsonl` | `chaos-touched-files.py` | Append-only audit trail of files the agent wrote/edited/touched. |
| `.chaos/runtime/hook-violations.jsonl` | all four scripts (via `chaos-hook-common.py`) | Shared warning/error log; see `reference/hook-violation-contract.md`. |
| `.chaos/runtime/decision-waits.jsonl` | `chaos-stop-summary.py` (best-effort) | Records apparent "waiting on a user decision" moments. |

Full schemas: `reference/runtime-file-contract.md`. All five are ephemeral,
git-ignored (`.chaos/runtime/` in `.gitignore`), and safe to delete at any
time — the next hook invocation recreates what it needs.

### Installing the hooks

1. Open `settings.runtime-observability.example.json` and pick a profile:
   `reportOnly` (recommended default — writes runtime state, never
   blocks), `strict` (same wiring, adds `--strict` to every invocation;
   still only affects the exit code for critical runtime errors, not
   ordinary findings), or `sessionAndCommandOnly` (minimal footprint —
   just keeps `session-context.json`/`active-command.json` fresh, skips
   touched-file auditing and the stop summary).
2. Copy that profile's `"hooks"` object into your own `.claude/settings.json`
   (repo-shared) or `.claude/settings.local.json` (personal, git-ignored).
   **This repository's committed `.claude/settings.json` already wires
   `PostToolUse`/`Stop` to `chaos-artifact-metadata-hook.py`** — merge the
   new `SessionStart`/`UserPromptSubmit`/`PostToolUse`/`Stop` entries
   alongside the existing ones (append to each event's hook array; don't
   replace it). This delivery does not touch that file for you.
3. Adjust the `command` interpreter (`py -3` here) if it doesn't resolve
   on your machine — see Troubleshooting.

### Running manually

```bash
python3 .claude/hooks/scripts/chaos-session-context.py --event session-start --print
python3 .claude/hooks/scripts/chaos-active-command.py --event user-prompt-submit --print
python3 .claude/hooks/scripts/chaos-touched-files.py --event post-tool-use --dry-run
python3 .claude/hooks/scripts/chaos-stop-summary.py --event stop --print
```

All four accept `--repo-root <path>`, `--strict`, `--dry-run`, `--print`.
Without a piped JSON payload on stdin, each script degrades gracefully
(e.g. `chaos-active-command.py` with no prompt text detects nothing;
`chaos-session-context.py` still resolves whatever local `git` state it
can). `--dry-run` computes and prints/reports without writing or appending
anything to `.chaos/runtime/`.

### How this differs from enforcement hooks

Nothing here blocks a Claude Code turn by default. `--strict` exists on
every script, but it only changes the **process exit code**, and only for
a narrow set of critical runtime errors each script defines (e.g. an
unreadable/corrupt `.chaos/runtime/*.json` file) — never for ordinary
findings like "no command detected" or "expected artifact missing."
Protected-file write guards, command-boundary enforcement, and
`chaos:sync --all` authority gating remain unimplemented specification
only (`.claude/skills/chaos-shared/reference/hooks-repository-context-policy.md`)
— a possible future capability built **on top of** this observability
data, not part of this delivery.

### How this relates to artifact provenance metadata hooks

Independent capability, same directory. `chaos-artifact-metadata-hook.py`
already reads `.chaos/runtime/session-context.json` and
`active-command.json` if present (to resolve identity/repository
context/`sourceCommand` for the `chaosMetadata` it stamps) and falls back
to plain `git` if they're absent — so installing capability 1 improves
capability 2's output, but capability 2 works without it. Capability 1
never writes `chaosMetadata` frontmatter itself.

### What is intentionally not implemented yet

- Protected-file write guards (`AGENTS.md`, root `README.md`,
  `.chaos/config.yaml`, ...).
- Command-boundary enforcement (blocking a write because it falls outside
  `activeCommand.allowedWriteGlobs`).
- Sync-authority blocking (`chaos:sync --all` gating).
- Automatic provenance metadata stamping (that's capability 2, wired
  separately).
- MCP/provider-CLI repository-context resolution (`chaos-session-context.py`
  is local-`git`-only by design in this delivery).
- Migration of any existing CHAOS artifacts into or out of runtime state.

Full rationale: `reference/hook-runtime-policy.md`.

### Troubleshooting

- **"command not found" / hook silently does nothing**: same Windows
  Python-launcher issue as capability 2 below — use whatever
  `python3 --version` / `python --version` / `py -3 --version` actually
  resolves on your machine in the `command` string.
- **A script hangs when run manually with no piped input**: it shouldn't —
  `load_json_stdin()` in `chaos-hook-common.py` waits at most ~1 second for
  a payload before proceeding with none, exactly like
  `chaos-artifact-metadata-hook.py`'s stdin reader.
- **`active-command.json` didn't update after a plain follow-up prompt**:
  expected — see `reference/active-command-detection.md`; a
  `user-prompt-submit` event with no detected command token leaves the
  file unchanged by design, so a multi-turn CHAOS command doesn't lose its
  context on an ordinary "yes, continue."
- **`decision-waits.jsonl` never appears**: expected if no `Stop` payload
  ever included a `transcript_path` with matching text, or if you never
  hit a genuine decision point — detection is best-effort
  (`reference/decision-wait-contract.md`), not a guarantee.
- **Exit code 2 from a script**: only happens under `--strict`, and only
  for the critical-error cases listed in
  `reference/hook-violation-contract.md`. Re-run without `--strict` to see
  the same findings as warnings only.

## Capability 2: Artifact Provenance Metadata

Claude Code hooks that validate, and optionally stamp, standardized provenance metadata
(`chaosMetadata` YAML frontmatter) on CHAOS-owned Markdown artifacts — so a report/decision
file records who last wrote it, when, who last audited it, when, which CHAOS command produced
it, and repository context, without that metadata churning on every command run.

This is a narrow, focused capability: **only** artifact provenance metadata. It does not
implement command-boundary guards, protected-file write guards, sync-authority guards, or
broad MCP/repository-context enforcement — see
`reference/artifact-metadata-hook-policy.md` for exact scope boundaries and
`.claude/skills/chaos-shared/reference/hooks-repository-context-policy.md` for the broader,
still-spec-only hooks policy this is one slice of.

### What "artifact provenance metadata" means

A small YAML frontmatter block at the top of a CHAOS-owned Markdown file:

```yaml
---
chaosMetadata:
  schemaVersion: 1
  artifactType: verification-report
  artifactScope: change
  changeId: add-task-query-filters
  sourceCommand: chaos:verify
  lastWrittenAt: 2026-07-01T10:15:00+02:00
  lastWrittenBy: vscode-user
  lastAuditedAt: 2026-07-01T10:15:00+02:00
  lastAuditedBy: vscode-user
  repositoryContext:
    provider: github
    branch: feature/add-task-query-filters
    reviewRequest: null
    contextSource: git
    confidence: MEDIUM
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:..."
---
```

Full schema: `reference/artifact-metadata-schema.md`. Config contract (which files are
"CHAOS-owned", identity resolution, policy flags): `reference/artifact-metadata-config.md`.
Validation rules: `reference/artifact-metadata-validation.md`.

### Installing the metadata hooks

Nothing is wired into a committed `settings.json` by this delivery — hooks are optional
tooling, and wiring them is a per-developer/per-repository choice. To install:

1. Open `settings.artifact-metadata.example.json` and pick a profile: `contributorSafe`
   (report-only, recommended default) or `strict` (blocking).
2. Copy that profile's `"hooks"` object into your own `.claude/settings.json` (repo-shared) or
   `.claude/settings.local.json` (personal, gitignored) under the top-level `"hooks"` key.
3. Adjust the `command` strings if `python3` is not the right interpreter name on your system
   (see Troubleshooting below — this matters especially on Windows).

### Report-only vs strict

- **Report-only / contributor-safe** (recommended default): `PostToolUse` and `Stop` both
  run `--check-only` (never writes). Missing/invalid metadata prints a warning and a
  remediation hint; the hook still exits `0` so it never blocks your turn.
- **Strict**: adds `--strict`. Missing/invalid metadata on a CHAOS-managed file makes the hook
  exit `2` (a blocking hook result in Claude Code), per
  `policies.artifactMetadata.failOnMissingMetadataInStrictHooks` in `.chaos/config.yaml`.

Neither example profile passes `--stamp` — both are read-only with respect to the filesystem.
If you want a hook to also *fix* metadata automatically, add `--stamp` yourself (test with
`--dry-run` first) and understand that this then writes to disk during a turn.

### How identity is resolved

Default `identityMode: provider-username` avoids raw email by design: it prefers a
`.chaos/runtime/session-context.json` username, falls back to `git config user.name`, and
finally `unknown`. Full resolution table, other modes (`git-name`, `git-email`,
`configured-alias`, `anonymous`), and the secret-scrubbing guard:
`reference/artifact-metadata-config.md`.

### How repository context is consumed

The hook reads `.chaos/runtime/session-context.json` if some other tool already wrote it
(now: `chaos-session-context.py`, capability 1 above); otherwise it falls back to plain
`git branch --show-current` / `git remote get-url origin` / `git config`. Provider is
inferred from the remote host (`dev.azure.com`/`visualstudio.com` → `azure-devops`,
`github.com` → `github`). MCP/CLI resolution is optional and never required — see
`reference/artifact-metadata-config.md`.

### Avoiding timestamp churn

`lastWrittenAt`/`lastWrittenBy` only change when the Markdown **body** (frontmatter excluded)
hashes differently than the value already stored in `metadata.bodyHash`. `lastAuditedAt`/
`lastAuditedBy` only change on an explicit `--stamp` run, and only when the body changed too —
unless `policies.artifactMetadata.allowAuditOnlyStamp: true`, which permits a deliberate
"audit, no content change" stamp. Running the hook in `--check-only` mode, or running
`--stamp` against an already-valid, unchanged file with the default policy, writes nothing.

### Running the metadata hook manually

```bash
# Validate everything, report only
python3 .claude/hooks/scripts/chaos-artifact-metadata-hook.py --event stop --check-only

# Preview what stamping would change, without writing
python3 .claude/hooks/scripts/chaos-artifact-metadata-hook.py --event stop --stamp --dry-run

# Validate a single file's PostToolUse path (simulating a hook invocation) with blocking on
python3 .claude/hooks/scripts/chaos-artifact-metadata-hook.py --event post-tool-use --check-only --strict

# Actually stamp (insert/repair) metadata across all CHAOS-managed files
python3 .claude/hooks/scripts/chaos-artifact-metadata-hook.py --event stop --stamp
```

The script never migrates/stamps existing artifacts unless `--stamp` is passed explicitly —
running `--check-only` (or the report-only hook profile) will report every currently
un-stamped CHAOS file as `missing`, which is expected until you choose to run `--stamp`
yourself.

### Troubleshooting (metadata hooks)

- **"command not found" / hook silently does nothing**: the `command` in your settings.json
  hardcodes an interpreter name. On some Windows setups, plain `python`/`python3` resolve to
  the Microsoft Store stub instead of a real interpreter; use whatever `python3 --version` /
  `python --version` / `py -3 --version` actually resolves on your machine, and adjust the
  `command` string accordingly (e.g. `py -3 "${CLAUDE_PROJECT_DIR}/.claude/hooks/scripts/chaos-artifact-metadata-hook.py" ...`).
- **Hook seems to hang when run manually with no piped input**: it shouldn't — the script
  waits at most ~1 second for a stdin payload before proceeding with none. If it hangs longer,
  you are likely hitting a shell/terminal quirk rather than the script itself; run with
  `--repo-root` explicit and check `python3 --version` succeeds standalone first.
- **A file you expect to be validated shows up under "optional (not yet CHAOS-managed)"**:
  patterns under `policies.artifactMetadataManagedFiles.optional` (e.g. `docs/adr/**/*.md`)
  are recognized but inactive by design — move the pattern into `include` to activate it. See
  `reference/artifact-metadata-config.md`.
- **A file is reported `missing` even though it looks like it has frontmatter**: frontmatter
  must open with `---` as the file's literal first line and have a matching closing `---`;
  and the `chaosMetadata:` key must be present inside that block (nested under any other
  frontmatter keys the file already has, e.g. an ADR's `title`/`status`/`tags`).
- **Exit code 2 from the hook**: this is the Claude Code "blocking" convention, produced only
  in `--strict` mode when policy requires it. Re-run with `--check-only` (no `--strict`) to see
  the same findings without blocking, or `--stamp` to fix them.
- **`chaosMetadata.lastWrittenBy` is `unknown`**: no identity source resolved. Configure
  `policies.artifactMetadata.identityMode: configured-alias` with a
  `policies.artifactMetadata.configuredAlias`, or ensure `git config user.name` is set.

## Related

- `reference/hook-runtime-policy.md`, `reference/runtime-file-contract.md`,
  `reference/active-command-detection.md`, `reference/touched-files-audit.md`,
  `reference/decision-wait-contract.md`, `reference/hook-violation-contract.md` — capability 1.
- `reference/artifact-metadata-hook-policy.md`, `reference/artifact-metadata-schema.md`,
  `reference/artifact-metadata-config.md`, `reference/artifact-metadata-validation.md` —
  capability 2.
- `.claude/skills/chaos-shared/reference/hooks-repository-context-policy.md` — the broader,
  still-spec-only hooks policy both capabilities are narrow slices of.
- `.claude/skills/chaos-shared/reference/mcp-security-policy.md` — no-secrets/read-only-by-default
  posture both capabilities follow.
