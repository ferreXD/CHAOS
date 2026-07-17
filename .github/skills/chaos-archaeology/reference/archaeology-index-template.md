# CHAOS Archaeology Index

Generated/updated by: chaos:archaeology  
Last updated: YYYY-MM-DD  

## Purpose

This index helps CHAOS commands discover and reuse existing archaeology evidence. Individual archaeology reports remain the source of evidence.

## Reports

The `Related change` column, when applicable, names the change id and points to its
change-scoped folder `.chaos/changes/<change-id>/`. Archaeology reports stay under
`.chaos/archaeology/` — they are not moved under change folders.

| ID | Topic | Mode | Verdict | Confidence | Date | Related change | Reports | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ARCH-IDX-001 | Example topic | standard | PARTIAL_EVIDENCE_READY_WITH_RISKS | MEDIUM | YYYY-MM-DD | example-change (`.chaos/changes/example-change/`) | [report](./example-topic-archaeology.md) | Current | Example row |

## Status definitions

- `Current`: evidence appears current for its recorded source manifest.
- `Possibly stale`: inspected files may have changed or report is old.
- `Stale`: known stale compared to current sources.
- `Superseded`: replaced by a newer report.
- `Draft`: incomplete or dry-run archaeology.

## Maintenance rules

- Every entry must reference at least one report.
- One topic may reference multiple related reports.
- Do not delete old entries silently; mark as `Superseded` when appropriate.
