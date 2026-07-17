# Touched-Files Audit

How `chaos-touched-files.py` turns a `PostToolUse` hook payload into an
appended record in `.chaos/runtime/touched-files.jsonl`. Audit trail only —
this hook never blocks a tool call and never rewrites/deletes prior
records (`hook-runtime-policy.md`).

## Which tools produce a record

| `tool_name` | path source | `operation` |
| --- | --- | --- |
| `Edit`, `MultiEdit`, `NotebookEdit` | `tool_input.file_path` (or `.path`) | `edit` |
| `Write` | `tool_input.file_path` (or `.path`) | `write` |
| `Bash` | inferred from `tool_input.command` | see below |
| anything else (`Read`, `Grep`, ...) | — | not recorded at all |

`MultiEdit` touches one file per invocation (the tool itself batches
multiple edits against a single `file_path`), so one record is appended
per call, not per edit.

## Bash path inference

`Bash` doesn't carry a structured file path, so the command text is
matched against a few simple, deliberately narrow patterns — this is
"simple shell path inference," not a shell parser:

- `rm`/`del`/`Remove-Item <path>` → `operation: "delete"`
- `touch`/`New-Item <path>` → `operation: "create"`
- an output redirect (`> path` / `>> path`) → `operation: "create"` for
  `>`, `"write"` for `>>`
- `mv`/`cp`/`copy`/`move <src> <dest>` → `operation: "write"`, path is the
  destination

If none match (e.g. `dotnet build`, `git status`, `npm test`), **no record
is appended** — most Bash calls don't touch a specific file, and guessing
would be noisy and unreliable. The raw shell command text itself is never
stored in `touched-files.jsonl` (only the extracted path, if any) —
`chaos-hook-common.py`'s `safe_string()`/secret-scrubbing exists for other
fields, but the simplest guarantee here is that command text just isn't
persisted.

## Path normalization

Extracted paths are normalized relative to the repo root with forward
slashes via `normalize_path()`. If normalization fails (the path can't be
resolved, or resolves outside the repo root — e.g. an absolute path like
`C:/Windows/system.ini`), the record is still appended (so the audit trail
isn't silently incomplete) but with the raw, un-normalized path string and
`confidence: "LOW"`, and a `CHAOS-HOOK-004` warning is logged.

## Confidence levels

- `HIGH` — path came directly from a file-editing tool's structured input
  (`source: "hook-payload"`).
- `MEDIUM` — path was inferred from Bash command text
  (`source: "inferred"`).
- `LOW` — path came from either source but could not be normalized
  relative to the repo root.

## Missing-field handling

If the tool is one of `Edit`/`MultiEdit`/`Write`/`NotebookEdit` but the
payload has no `file_path`/`path` at all, no record is appended and a
`CHAOS-HOOK-007` warning ("hook payload missing expected fields") is
logged instead — this is treated as a payload-shape problem, not a
"nothing happened" case.

## `command`/`changeId` correlation

Every appended record copies `command`/`changeId` from whatever
`.chaos/runtime/active-command.json` currently holds at the moment of the
touch. This is a best-effort snapshot, not a transactional link — if the
active command changes mid-turn, earlier touches in the same turn keep
whatever command was active when they were recorded.

## Related

- `runtime-file-contract.md` — the full `touched-files.jsonl` schema.
- `hook-violation-contract.md` — `CHAOS-HOOK-004` / `CHAOS-HOOK-007`.
