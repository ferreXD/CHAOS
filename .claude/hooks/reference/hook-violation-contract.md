# Hook Violation Contract

`.chaos/runtime/hook-violations.jsonl` is the shared warning/error log for
all five vNext runtime hooks (`chaos-hook-common.py`'s `log_violation()`).
This delivery is **report-only by default** — see `hook-runtime-policy.md`
for the exit-code/strict-mode model. Most entries are `INFO`/`WARN`; this
task introduces no code that emits `BLOCKED`.

## Severity levels

- **INFO** — expected, routine events worth a durable trace (e.g. the
  runtime directory was just created; a session-start reset happened).
- **WARN** — something is incomplete or couldn't be resolved, but the hook
  degraded gracefully and continued (e.g. provider unknown, a path
  couldn't be normalized). This is the common case.
- **ERROR** — reserved for this task; not currently emitted. A future
  enforcement-capable hook could use it for policy violations that don't
  yet block.
- **BLOCKED** — reserved for a future enforcement capability. Nothing in
  this delivery emits `BLOCKED`; these hooks never block a turn by
  default, and `--strict` only affects the process **exit code**, not
  entries written here.

## Codes introduced by this delivery

| Code | Meaning | Emitted by |
| --- | --- | --- |
| `CHAOS-HOOK-001` | `.chaos/runtime/` did not exist and was just created. | any hook, on first invocation |
| `CHAOS-HOOK-002` | Session context is incomplete (`provider: unknown` or no branch name resolved). | `chaos-session-context.py` |
| `CHAOS-HOOK-003` | Active command not confidently detected. `INFO` on a `session-start` reset; `WARN` when a `user-prompt-submit` prompt mentions "chaos" but couldn't be parsed. | `chaos-active-command.py` |
| `CHAOS-HOOK-004` | A touched-file path could not be normalized relative to the repo root. | `chaos-touched-files.py` |
| `CHAOS-HOOK-005` | An `activeCommand.expectedArtifacts` entry does not exist on disk at `Stop`. | `chaos-stop-summary.py` |
| `CHAOS-HOOK-006` | A decision wait was detected (best-effort). | `chaos-stop-summary.py` |
| `CHAOS-HOOK-007` | A hook payload was missing an expected field (e.g. `file_path` on an `Edit`/`Write` tool call). | `chaos-touched-files.py` |
| `CHAOS-HOOK-008` | Repository context is unavailable entirely (not a git repo, or `git` unreachable). | `chaos-session-context.py` |
| `CHAOS-HOOK-009` | A `.chaos/runtime/*` file exists but could not be parsed (invalid JSON / malformed JSONL line(s)). | `chaos-stop-summary.py` |
| `CHAOS-HOOK-010` | A hook script caught and recovered from an unexpected internal exception rather than crashing. | any hook, via the top-level `except Exception` handler |

## `--strict` and exit codes

Every hook script's default exit code is `0`, regardless of how many
`WARN`/`INFO` entries it wrote. `--strict` only changes the exit code, and
only for what each script treats as a **critical runtime error** — not for
ordinary detection misses:

- `chaos-session-context.py --strict` — exits `2` only if it caught an
  unhandled internal exception (`CHAOS-HOOK-010`); an unresolved git
  repository (`CHAOS-HOOK-008`) still exits `0`, since "not a git repo" is
  an expected, tolerated case, not an error.
- `chaos-active-command.py`, `chaos-touched-files.py` — same pattern:
  `--strict` only escalates an unhandled internal exception.
- `chaos-stop-summary.py --strict` — exits `2` if `session-context.json`
  or `active-command.json` exist but fail to parse as JSON
  (`CHAOS-HOOK-009`), or on an unhandled internal exception. Missing
  expected artifacts (`CHAOS-HOOK-005`) and decision waits
  (`CHAOS-HOOK-006`) never affect the exit code, even under `--strict`.

`--dry-run` suppresses all writes (including to `hook-violations.jsonl`
itself) while still computing and printing/reporting what *would* have
been logged.

## Record shape

See `runtime-file-contract.md` §4 for the full JSON shape
(`schemaVersion`, `timestamp`, `severity`, `hook`, `command`, `changeId`,
`code`, `message`, `path`, `confidence`). `message` always passes through
`safe_string()` (secret-redaction + truncation to 500 chars) before being
written.

## Related

- `hook-runtime-policy.md` — why report-only is the default posture.
- `runtime-file-contract.md` — the record schema.
