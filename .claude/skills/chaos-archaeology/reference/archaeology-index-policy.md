# Archaeology Index Policy

`.chaos/archaeology/index.md` is the discovery surface for existing archaeology evidence.

Individual reports are evidence sources. The index is memory.

## Required index behaviour

Before new archaeology, check:

```text
.chaos/archaeology/index.md
```

If present, search for related entries and offer reuse/refresh/extend/create-new options.

If missing, prompt the user.

### No index and no reports

```text
No archaeology index was found.
No existing archaeology reports were found.

Options:
1. Create an index during this run
2. Continue without index
3. Stop
```

### No index but existing reports

```text
I found existing archaeology reports but no index.

Options:
1. Build index from existing reports before continuing
2. Create index with only this new run
3. Continue without index
4. Stop
```

Recommended default: build from existing reports.

## Mode behaviour

- `--light`: prompt, allow continuing without index.
- `--standard`: recommend creating/building index.
- `--strict`: require index creation/build or explicit waiver when existing reports exist.

## Index entries

Each entry must reference one or more related archaeology reports.

Required columns:

- ID
- Topic
- Mode
- Verdict
- Confidence
- Date
- Related change — when applicable, the change id and its folder `.chaos/changes/<change-id>/`
- Reports
- Status
- Notes

## Relationship to the change-scoped layout (v0)

Archaeology stays **topic-scoped** under `.chaos/archaeology/`. It is not change-scoped.

- Archaeology reports and the index remain under `.chaos/archaeology/`. Do **not** move
  archaeology reports under `.chaos/changes/<change-id>/` by default.
- Archaeology reports and index entries **may reference** one or more related change ids and
  their `.chaos/changes/<change-id>/` folders when applicable (e.g. the change that consumed
  the evidence).
- Canonical layout contract: `.chaos/changes/README.md`.

Valid statuses:

- `Current`
- `Possibly stale`
- `Stale`
- `Superseded`
- `Draft`

## Update policy

After writing a report, offer to update the index.

Do not silently modify the index.
