# README Generation Policy

`chaos:help --readme` generates or refreshes a human-facing CHAOS workflow guide.

## Core rule

README generation is **idempotent**.

```text
Preview by default.
Write only when explicitly requested.
Do not rewrite if the current target is already up to date.
```

`chaos:help --readme` must not blindly regenerate the target file on every invocation. It must first build a candidate README, compare it against the existing target, and report one of:

```text
README_MISSING
README_UP_TO_DATE
README_OUTDATED
README_TARGET_NOT_CHAOS_GENERATED
README_WRITE_BLOCKED
```

## Default target

```text
.chaos/README.md
```

## Optional targets

```text
docs/chaos-workflow.md
README.md
```

Root `README.md` must never be overwritten unless explicitly requested and confirmed after preview.

## Flags

```text
--readme          Generate candidate and preview status/diff by default; do not write.
--dry-run         Preview only; do not write.
--write           Write only if target is missing or outdated; do not rewrite when up to date.
--target <path>   Select target path.
```

## Required behaviour

1. Resolve the target path.
2. Collect README source inputs.
3. Render the candidate README.
4. Compute a source fingerprint and content fingerprint.
5. Inspect the existing target, if present.
6. Decide whether the target is missing, up to date, outdated, or not CHAOS-generated.
7. Show the result in chat before any write.
8. Write only when `--write` is present or the user explicitly confirms the write.
9. If the target is already up to date, do not write; tell the user no action is needed.

## Fingerprint model

Generated README files must include metadata that allows future idempotency checks.

```md
---
generatedBy: chaos:help --readme
generatorVersion: chaos-help-command-kit-v2
sourceFingerprint: sha256:<hash-of-source-snapshot>
contentFingerprint: sha256:<hash-of-normalized-rendered-readme>
generatedAt: <timestamp>
sources:
  - .chaos/commands/index.md
  - .chaos/workflow-map.md
  - .chaos/constitution.md
  - .chaos/rules/index.md
  - .chaos/gates/index.md
refreshWith: chaos:help --readme --write
---
```

### Source fingerprint

The source fingerprint should be derived from the paths and normalized contents of the files used to build the README, when available. Missing optional files should be included as `missing:<path>` entries so that later creation of those files changes the fingerprint.

Recommended inputs:

```text
.chaos/commands/index.md
.chaos/changes/README.md
.chaos/workflow-map.md
.chaos/constitution.md
.chaos/rules/index.md
.chaos/gates/index.md
.chaos/status-report.md
.chaos/config.yaml
AGENTS.md
.github/prompts/
.github/prompts/
.github/agents/
.github/instructions/
```

### Content fingerprint

The content fingerprint should be computed from the rendered README after normalizing volatile fields such as `generatedAt`, `sourceFingerprint`, and `contentFingerprint`.

This prevents timestamp-only changes from triggering unnecessary writes.

## Status UX

### Up to date

```text
README status: README_UP_TO_DATE
Target: .chaos/README.md
Action: none
Reason: existing README fingerprint matches current workflow sources.
```

### Missing

```text
README status: README_MISSING
Target: .chaos/README.md
Action: create available with --write
```

### Outdated

```text
README status: README_OUTDATED
Target: .chaos/README.md
Action: update available with --write
Changed inputs:
- .chaos/commands/index.md
- .chaos/gates/index.md
```

### Not CHAOS-generated

```text
README status: README_TARGET_NOT_CHAOS_GENERATED
Target: README.md
Action: blocked unless explicitly confirmed
Reason: target does not contain CHAOS-generated metadata.
```

## Write policy

`--write` may write automatically only when all are true:

```text
- target is not root README.md, unless root README was explicitly requested and confirmed
- target is missing or outdated
- target is CHAOS-generated or missing
- candidate content was generated successfully
```

If the existing target is already up to date:

```text
Do not rewrite.
Do not update generatedAt only.
Do not create a noisy diff.
```

## Patch preview

When the README is outdated, show a compact patch summary before writing:

```text
Will update:
- Command list
- Rule/gate count
- Artifact map

Will not modify:
- AGENTS.md
- root README.md
- ADRs
- rules/gates indexes
```

## Recommended structure

```md
# CHAOS Workflow Guide

## What CHAOS is
## Golden path
## Command map
## Modes
## Artifacts
## Team collaboration model       (per-change layout + team concurrency policy)
## How to start a change
## How to continue an existing change
## Decisions and confidence
## OpenSpec integration
## Mainline sync policy           (chaos:sync --change vs --all; run --all after merge to main)
## Copilot and Copilot usage
## Troubleshooting
## Known limitations
```

The generated README must describe the v0 collaboration model: per-change artifact
layout under `.chaos/changes/<change-id>/`, the team concurrency policy, and the mainline
sync policy (`chaos:sync --change <id>` is contributor-safe; `chaos:sync --all` is the
maintainer/repo-owner repository-wide reconciliation run after merge into `main`).
Source of truth: `.chaos/changes/README.md`. README generation remains idempotent and
must not rewrite when already up to date.

## Staleness

Generated README files are derived documentation. `chaos:status` and `chaos:sync` should eventually detect if they are stale compared to the command index, workflow map, or command installation surfaces.
