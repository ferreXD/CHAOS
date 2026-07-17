# Modes & Scope — chaos:code-review

## Mode mapping

CHAOS modes map directly onto the `code-reviewer` driver's review modes:

| CHAOS mode | Driver mode | Use when |
|---|---|---|
| `--light` | Light review | Small diffs, quick sanity checks, narrow files. |
| `--standard` | Standard review | Normal change/PR/feature reviews (default). |
| `--strict` | Strict review | Security-sensitive, persistence-heavy, external-side-effect, migration, auth, concurrency, or high-risk code. |

## Mode inference (robust)

When mode is omitted, infer it from scope and risk, then **show the inferred mode and the
reasons** before reviewing:

- Strict signals: changes touching auth, persistence/migrations, money, external side
  effects, concurrency, security boundaries, or public contracts.
- Light signals: docs-only, comments, small isolated diffs.
- Otherwise standard.

Ask only when the inferred mode materially changes risk or when `strict` would block. Allow
a downgrade only with explicit rationale (recorded as a `CR-DEC-*` event). Never silently
downgrade `strict` to `standard`/`light`, and never silently upgrade to `strict` and then
block without explaining why.

## Scope resolution

| Invocation | Scope |
|---|---|
| `<change-id>` | The change's implementation. Read `.chaos/changes/<change-id>/` and the OpenSpec change for intent/spec context; review the code that implements it. |
| `--pr <n>` | The PR diff (read-only `gh`/`git` discovery). |
| `--since <ref>` | Commits/diff since a git ref or date. |
| `--scope <path>` | A path or module. |
| `--staged` | Staged changes. |
| `--working` | Working-tree changes. |

Show the resolved scope before deep review. For change-scoped reviews, the output is
change-scoped; otherwise it is a repository-level code-review report.

## Mode effect on verdict

- `--strict`: HIGH-severity (driver) findings that affect correctness/security/data
  integrity map to `BLOCKING` and prevent a `CODE_READY` verdict unless waived.
- `--light`/`--standard`: HIGH maps to `MAJOR`; the verdict can be
  `CODE_READY_WITH_CONDITIONS` with explicit conditions.
- Confidence caps from the driver (missing `AGENTS.md`/skills, partial diffs, unverifiable
  lines, untested behaviour) carry into the CHAOS verdict.
