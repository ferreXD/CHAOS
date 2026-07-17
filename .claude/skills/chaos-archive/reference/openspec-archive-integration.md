# OpenSpec Archive Integration Contract

CHAOS does not replace OpenSpec. OpenSpec remains the spec lifecycle engine.

`chaos:archive` wraps OpenSpec archive with governance checks, decision/debt routing, and audit reporting.

## Expected OpenSpec structure

```text
openspec/changes/<change-id>/
  proposal.md
  design.md
  specs/
  tasks.md

openspec/specs/
```

## Archive orchestration

The command should perform:

```text
1. Pre-archive CHAOS readiness check
2. Optional sync-first check when requested or required
3. OpenSpec validation if available
4. Archive execution plan
5. User confirmation unless safely skipped by --yes
6. OpenSpec archive execution or host-specific /opsx:archive guidance
7. Post-archive confirmation
8. CHAOS archive report generation
```

## Commands

Use whichever is available in the local environment:

```text
openspec validate <change-id> --strict
openspec status --json
openspec list --json
openspec archive <change-id>
```

If the host exposes `/opsx:archive`, guide or invoke that workflow according to the environment.

If CLI command names differ in the local OpenSpec version, inspect local help output and record the resolved command in the archive report.

## Failure handling

If OpenSpec archive fails:

```text
verdict: ARCHIVE_FAILED
confidence: HIGH if failure output was observed, otherwise MEDIUM/LOW
next command: resolve OpenSpec error and rerun chaos:archive
```

If OpenSpec archive appears to run but cannot be confirmed:

```text
verdict: ARCHIVED_BUT_UNCONFIRMED
confidence cap: MEDIUM
```

## No silent archive

Never call archive before presenting the execution plan unless `--yes` is used and no unresolved decisions, waivers, blockers, or risky confirmations remain.
