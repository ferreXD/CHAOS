# CHAOS Help Contract

## Purpose

`chaos:help` is the user-facing discovery and navigation command for CHAOS.

It answers:

- What is CHAOS?
- Which commands exist?
- When should each command be used?
- What should I run next?
- Which artifacts are produced?
- How do modes work?
- How can I generate a workflow README?

## Supported invocations

```text
chaos:help
chaos:help workflow
chaos:help commands
chaos:help modes
chaos:help artifacts
chaos:help next
chaos:help <command>
chaos:help --readme
chaos:help --readme --dry-run
chaos:help --readme --write
chaos:help --readme --target <path>
```

## Unsupported invocation

```text
chaos:help demo
```

Demo mode is intentionally excluded from v0. Use README/workflow help instead.

## Output style

Prefer short, useful guidance over exhaustive documentation. When the user asks for a specific command, show only what helps them use that command.

## Command distinction

```text
chaos:help   -> navigation and documentation
chaos:status -> health/readiness audit
chaos:sync   -> governance reconciliation
```

## Team collaboration model (v0)

`chaos:help` must be able to explain the v0 collaboration model (canonical contract:
`.chaos/changes/README.md`):

- **Per-change artifact layout.** Feature/change artifacts live under a flattened
  per-change folder `.chaos/changes/<change-id>/` (`lifecycle.md`, `proposal-review.md`,
  `approval.md`, `apply-report.md`, `verification.md`, `archive-report.md`,
  `sync-report.md`, `retro.md`, `decision-events.md`, `waivers.md`). Shared governance
  artifacts stay global and are reconciled through `chaos:sync`.
- **Team concurrency policy.** Multiple developers may work on different OpenSpec changes
  in the same sprint; feature work writes change-scoped artifacts and must not silently
  edit shared governance.
- **`chaos:sync --change` vs `chaos:sync --all`.** `--change <change-id>` is
  contributor-safe and reconciles only that change folder. `--all` is a repository-wide,
  maintainer-confirmed reconciliation run by the repo owner / CHAOS maintainer after
  feature branches merge into `main`.
- **`chaos:help next`** uses `.chaos/changes/<change-id>/lifecycle.md` when available.

## Legacy compatibility

Commands may READ legacy scattered report folders (`.chaos/reviews/`,
`.chaos/apply-reports/`, etc.) for compatibility, but new artifacts are written under
`.chaos/changes/<change-id>/`. `chaos:help` must not migrate legacy artifacts; it may note
that a future migration is recommended.

## README idempotency contract

When invoked with `--readme`, the command must be idempotent:

```text
- generate candidate
- compare with existing target
- report README_UP_TO_DATE when unchanged
- do not rewrite unchanged files
- write only when missing/outdated and explicitly requested or confirmed
```

The command must include metadata fingerprints in generated README files so future invocations can detect staleness without creating timestamp-only diffs.
