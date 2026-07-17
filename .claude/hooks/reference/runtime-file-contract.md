# CHAOS Runtime File Contract

Schemas for the five files under `.chaos/runtime/`. All are written by the
hook scripts in `../scripts/`; see `hook-runtime-policy.md` for why these
are ephemeral, git-ignored, non-governance state.

Files are created **lazily**: `.chaos/runtime/` itself is created by
`ensure_runtime_dir()` on first hook invocation, but an individual file
(especially `decision-waits.jsonl`, which may never fire in an ordinary
session) only appears once something is actually written to it. A missing
runtime file is not an error — treat it as "no data yet."

## 1. `session-context.json`

Written by `chaos-session-context.py`. A single JSON object, fully
overwritten (atomically) on every run.

```json
{
  "schemaVersion": 1,
  "generatedAt": "ISO-8601-with-timezone",
  "generatedBy": "chaos-session-context-hook",
  "repoRoot": "<absolute-or-repo-relative-path>",
  "provider": "github | azure-devops | local-git | unknown",
  "repository": {
    "name": "",
    "ownerOrOrganization": "",
    "project": "",
    "remoteUrl": "",
    "defaultBranch": "",
    "providerUrl": "",
    "confidence": "HIGH | MEDIUM | LOW"
  },
  "user": {
    "id": "",
    "username": "",
    "displayName": "",
    "email": "",
    "identitySource": "github-mcp | azure-devops-mcp | gh-cli | az-devops-cli | git-config | unknown",
    "confidence": "HIGH | MEDIUM | LOW"
  },
  "branch": {
    "name": "",
    "isDefaultBranch": false,
    "upstream": "",
    "mergeBase": "",
    "confidence": "HIGH | MEDIUM | LOW"
  },
  "reviewRequest": {
    "providerType": "pull-request | changeset | unknown",
    "id": "", "url": "", "title": "", "author": "",
    "sourceBranch": "", "targetBranch": "",
    "status": "open | merged | closed | unknown",
    "confidence": "HIGH | MEDIUM | LOW"
  },
  "workingTree": {
    "clean": true,
    "changedFiles": [], "stagedFiles": [], "untrackedFiles": [],
    "confidence": "HIGH | MEDIUM | LOW"
  },
  "resolution": {
    "sourcesUsed": [],
    "fallbackLevel": "mcp | cli | git | manual | none",
    "missingCapabilities": [],
    "warnings": [],
    "confidence": "HIGH | MEDIUM | LOW"
  }
}
```

Notes:
- This hook only ever populates `resolution.fallbackLevel` with `git` or
  `none` — it never calls MCP or a provider CLI itself (`mcp`/`cli` remain
  possible values for a future, richer resolver; `missingCapabilities`
  always lists `mcp` and `provider-cli` as not-attempted by this hook).
- `reviewRequest` cannot be resolved from local git at all. If a prior
  `session-context.json` already had one (written by some other tool), it
  is carried forward rather than being wiped to the empty/unknown default.
- `repository`, `branch`, and `user` are each carried forward wholesale
  from a prior `session-context.json` when that prior section's
  `confidence` outranks what this run's local-git resolution produced
  (e.g. a richer, MCP-aware resolver wrote `HIGH` confidence identity
  data and this run only has local-git `MEDIUM`/`LOW`). `provider` is
  carried forward alongside `repository` in that case. This prevents a
  lower-confidence local-git fallback run from clobbering richer
  existing context. `workingTree` is never carried forward — it reflects
  live, time-sensitive repo state that local git can always resolve
  accurately.
- `user.email` is only ever populated from `git config user.email`
  (`identitySource: git-config`, confidence `LOW`/`MEDIUM`, never `HIGH`).

## 2. `active-command.json`

Written by `chaos-active-command.py`. A single JSON object, overwritten
atomically only when a command is (re-)detected — see
`active-command-detection.md` for exactly when a `user-prompt-submit` event
leaves the file untouched instead.

```json
{
  "schemaVersion": 1,
  "detectedAt": "ISO-8601-with-timezone",
  "detectedBy": "chaos-active-command-hook",
  "command": "chaos:apply",
  "rawPrompt": "",
  "changeId": "",
  "mode": "light | standard | strict | unknown",
  "scope": "change | repository | topic | unknown",
  "readOnly": true,
  "repoWide": false,
  "expectedArtifacts": [],
  "allowedWriteGlobs": [],
  "notes": [],
  "confidence": "HIGH | MEDIUM | LOW"
}
```

`readOnly`/`scope`/`allowedWriteGlobs`/`repoWide` are **recorded hints**,
not enforcement — see `hook-runtime-policy.md`.

## 3. `touched-files.jsonl`

Appended to by `chaos-touched-files.py`. One JSON object per line, one line
per touched-file observation (never rewritten/compacted by these hooks).

```json
{
  "schemaVersion": 1,
  "timestamp": "ISO-8601-with-timezone",
  "event": "post-tool-use",
  "tool": "Edit | MultiEdit | Write | Bash | unknown",
  "path": "relative/path",
  "operation": "write | edit | delete | create | bash | unknown",
  "command": "chaos:apply",
  "changeId": "",
  "source": "hook-payload | inferred | unknown",
  "confidence": "HIGH | MEDIUM | LOW"
}
```

`command`/`changeId` are copied from `active-command.json` at the moment of
the touch (best-effort correlation, not a transactional guarantee).

## 4. `hook-violations.jsonl`

Appended to by every hook script via `chaos-hook-common.py`'s
`log_violation()`. One JSON object per line.

```json
{
  "schemaVersion": 1,
  "timestamp": "ISO-8601-with-timezone",
  "severity": "INFO | WARN | ERROR | BLOCKED",
  "hook": "chaos-stop-summary",
  "command": "chaos:verify",
  "changeId": "",
  "code": "CHAOS-HOOK-001",
  "message": "",
  "path": "",
  "confidence": "HIGH | MEDIUM | LOW"
}
```

Full code list and severity model: `hook-violation-contract.md`.

## 5. `decision-waits.jsonl`

Appended to by `chaos-stop-summary.py` (best-effort transcript scan) or by
any future caller of `chaos-hook-common.py`'s `record_decision_wait()`. One
JSON object per line.

```json
{
  "schemaVersion": 1,
  "timestamp": "ISO-8601-with-timezone",
  "command": "chaos:sync",
  "changeId": "",
  "decisionTitle": "",
  "optionsCount": 4,
  "recommendedOption": "1",
  "source": "assistant-output | inferred | explicit-marker | unknown",
  "status": "waiting | resolved | unknown",
  "confidence": "HIGH | MEDIUM | LOW"
}
```

Full detection rules: `decision-wait-contract.md`.

## Related

- `hook-runtime-policy.md`, `active-command-detection.md`,
  `touched-files-audit.md`, `decision-wait-contract.md`,
  `hook-violation-contract.md`.
