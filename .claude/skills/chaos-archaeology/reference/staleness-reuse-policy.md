# Staleness and Reuse Policy

## Reuse detection

Before inspecting new code, search the archaeology index for related topics. Present candidates in chat:

```md
## Existing Archaeology Candidates

1. CustomerInventory API
   Mode: standard
   Confidence: MEDIUM
   Reports:
   - .chaos/archaeology/customer-inventory-api-archaeology.md

Options:
1. Reuse existing evidence
2. Refresh selected report
3. Extend existing archaeology
4. Create new report
5. Continue without reuse
```

## Staleness detection

Reports should include:

- generated date;
- git ref/commit when available;
- inspected file list;
- source manifest;
- confidence caps.

If git is available, compare inspected files with current state when feasible. For v0, exact file hashes are optional.

Possible statuses:

- `Current`
- `Possibly stale`
- `Stale`
- `Superseded`
- `Draft`

If staleness cannot be checked, record `UNKNOWN` with confidence `LOW` or `MEDIUM` depending on evidence.
