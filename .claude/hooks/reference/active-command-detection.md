# Active Command Detection

How `chaos-active-command.py` parses `.chaos/runtime/active-command.json`
from a Claude Code hook payload. This is text pattern matching against the
prompt, not a real command parser — treat every field as a best-effort
hint, never a guarantee. The hook only *records* detection; it never
enforces anything (`hook-runtime-policy.md`) and never asks the user
anything.

## Where the prompt text comes from

The hook reads the first non-empty string field found among
`prompt`, `user_prompt`, `message`, `text`, `input` in the stdin JSON
payload. If none are present (e.g. a `SessionStart` payload, which
typically carries no user text), no command can be detected.

## Command token matching

Two literal forms are recognized, in this order:

1. **`chaos:<name>`** — e.g. `chaos:run`, `chaos:doctor`. Matched
   with `\bchaos:([a-zA-Z][a-zA-Z-]*)\b` and looked up case-insensitively
   against the known command table.
2. **`/chaos-<name>`** — the skill-invocation slash form, e.g.
   `/chaos-run`, `/chaos-doctor`. Matched with `/chaos-([a-zA-Z][a-zA-Z-]*)\b`.

Recognized command words (lean core): `init`, `help`, `doctor`, `run`,
`resume`. Anything else is not a CHAOS command and is ignored.

If a `chaos:<name>` match exists, it wins over a `/chaos-<name>` match.
Only the first match in the text is used.

## Mode flags

`--light`, `--standard`, `--strict` are searched for anywhere in the text
(`--(light|standard|strict)\b`, case-insensitive). First match wins. If
none is present, `mode` is `"unknown"` — this hook does **not** fall back
to `.chaos/config.yaml`'s `policies.commandExecution.defaultMode`; mode
inference from config is a command-orchestration concern, not something
this hook infers.

## `changeId` resolution (in priority order)

1. An explicit `--change <id>` / `--change=<id>` flag.
2. An OpenSpec/CHAOS change path appearing anywhere in the text:
   `openspec/changes/<id>/...`.
3. The first positional token immediately following the command match
   (e.g. `chaos:run add-task-query-filters` → `add-task-query-filters`).
4. Otherwise `changeId` is `""` with `LOW` confidence.

`--change`/path matches are `HIGH`/`MEDIUM` confidence respectively;
positional inference is `MEDIUM`.

## Expected artifacts and write-glob hints

Each command has a small table entry (in `chaos-active-command.py`,
`COMMAND_TABLE`) giving a template `expectedArtifacts` / `allowedWriteGlobs`
list with `{changeId}`, `{date}`, `{topic}` placeholders. At write time:

- `{date}` is always resolved to today's date (`YYYY-MM-DD`).
- `{changeId}` is resolved from the changeId rules above; if it could not
  be resolved, that template's artifact entry is **omitted** (not written
  with a literal `{changeId}` in the path) and a note is added instead.
- `{topic}` is never resolved by this hook (prompt text doesn't reliably
  contain a normalized topic slug); such entries are omitted with a note.

Read-only hints per command mirror the lean command inventory (`help` and
`doctor` are read-only except doctor's own report; `run`/`resume`/`init`
are not). These are hints only — see `hook-runtime-policy.md` for why
nothing here is enforced.

## What happens when no command is detected

- **`session-start`**: the file is always reset to an "unknown" record
  (`command: ""`, `confidence: "LOW"`, a note explaining the reset) — a
  fresh session shouldn't inherit a stale active command from a previous,
  possibly days-old session. `CHAOS-HOOK-003` is logged at `INFO`.
- **`user-prompt-submit`**: if no command token is found, the existing
  `active-command.json` is left **unchanged** — an ordinary follow-up turn
  ("yes, proceed", "looks good") shouldn't erase the active command from a
  multi-turn CHAOS workflow. `CHAOS-HOOK-003` is only logged (at `WARN`)
  when the prompt text contains the substring `"chaos"` but still couldn't
  be parsed into a known command — a genuine detection miss worth
  flagging; ordinary conversational prompts produce no log entry at all,
  to avoid flooding `hook-violations.jsonl`.

## Related

- `runtime-file-contract.md` — the full `active-command.json` schema.
- `hook-runtime-policy.md` — why detection is recorded but not enforced.
- `hook-violation-contract.md` — `CHAOS-HOOK-003` and other codes.
