# SC-14 — db-index (S6 recast, synthetic subject)

Band: golden (two-axis S6: environment-dependent risk) · Checkpoints: K1, K3
Posture: inline (synthetic Orders service — the demo has no database) · Map: `../assets/path-class-map.json` (generic `**/Migrations/**` and `**/*.sql` rules apply)
Wave-2 fixture encoded 2026-08-02 from the frozen manifest row.

## Posture

```markdown
# Architecture — Orders Service (synthetic fixture subject)

## Data access posture
EF Core over PostgreSQL; SQL-first migrations under src/Orders.Data/Migrations/. The orders
database is the store of record. DDL changes are reviewed for lock impact before rollout. [FACT]

## Module / boundary model
Orders.Api depends on Orders.Data; no reverse dependency. [FACT]

## Non-goals
- Multi-region replication.
- Schema changes without a migration file.
```

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc14-orders-index
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Add a composite index on orders(customer_id, created_at) — the account dashboard's order-history
query is slow in production. Single migration; no code change.
```

## Scope

```text
scope: src/Orders.Data/Migrations/
```

## Diff numstat

```text
9	0	src/Orders.Data/Migrations/20260802_AddOrdersCustomerCreatedIndex.sql
```

## Diff patch excerpt

```diff
+++ b/src/Orders.Data/Migrations/20260802_AddOrdersCustomerCreatedIndex.sql
+CREATE INDEX CONCURRENTLY ix_orders_customer_created
+    ON orders (customer_id, created_at DESC);
```

## Expected

```json
{
  "checkpoints": {
    "K1": {
      "newlyFired": [
        { "trigger": "M2", "by": "scan", "surface": "data-store", "cite": "persistence class: predicted scope is src/Orders.Data/Migrations/ (map rule **/Migrations/**)" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 0, "adr": 0 },
      "confidence": "HIGH"
    },
    "K3": {
      "newlyFired": [],
      "scanEcho": ["M2"],
      "scanEchoCite": "persistence class: new file under Migrations/ + .sql extension",
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 0, "adr": 0 },
      "confidence": "HIGH"
    }
  },
  "notes": "S6's environment dependence (100-row table vs 500M-row production table are different changes) has NO deterministic home in C beyond this seed's targeted verify check (lock-impact review per the subject's own posture line) — observation O-7. Confidence stays mechanically HIGH (signals are unanimous); the unknown is environmental, not signal conflict. M2 alone: openspec 0, adr 0, one folded stop.",
  "properties": []
}
```
