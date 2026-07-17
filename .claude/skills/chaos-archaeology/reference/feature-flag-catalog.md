# CHAOS Archaeology Feature / Focus Flag Catalog

`chaos:archaeology` uses focus and inclusion flags to keep discovery bounded.

## Focus flags

- `--focus api` — entrypoints, endpoint shape, route contracts.
- `--focus contracts` — request/response DTOs, versioning, compatibility.
- `--focus data` — DB access, query/write behaviour, ownership, migrations.
- `--focus side-effects` — external systems, outbox, emails, files, ERP, queues.
- `--focus auth` — authentication, authorization, roles, claims, security boundaries.
- `--focus tests` — existing tests, missing validation, behavioural coverage.
- `--focus observability` — logs, metrics, tracing, correlation, supportability.
- `--focus dependencies` — important package/service/internal dependencies.
- `--focus failure-modes` — retries, idempotency, partial failures, concurrency.

## Inclusion flags

Use inclusion flags when evidence is required, not merely interesting.

- `--include-tests`
- `--include-db`
- `--include-side-effects`
- `--include-callers`
- `--include-callees`
- `--include-config`
- `--include-docs`

## Rule

Do not expand scope because files are related. Expand only when the file is necessary to answer the archaeology question or the user approves a budget increase.
