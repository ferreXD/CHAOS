# SC-15 — breaking-schema-migration (S7 recast, synthetic subject)

Band: golden (two-axis S7: schema migration with a public-contract consequence) · Checkpoints: K3
Posture: inline (synthetic Orders service) · Map: `../assets/path-class-map.json`
Wave-2 fixture encoded 2026-08-02 from the frozen manifest row. Single-checkpoint seed: the
registration pins the K3 compound firing (M2 + breaking M3, distinct surfaces, one folded stop).

## Posture

```markdown
# Architecture — Orders Service (synthetic fixture subject)

## Data access posture
EF Core over PostgreSQL; SQL-first migrations under src/Orders.Data/Migrations/. Store of
record; destructive DDL requires a rollback path. [FACT]

## API strategy
Public API is described by docs/api/orders.openapi.yaml (contract artifact). Breaking response
changes require the deprecation policy. [FACT]
```

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc15-split-address
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Split orders.address into structured columns (address_line1, address_line2, city, postal_code)
and drop the legacy address column; update the order response shape to match.
```

## Scope

```text
scope: src/Orders.Data/Migrations/, src/Orders.Api/Contracts/, docs/api/orders.openapi.yaml
```

## Diff numstat

```text
31	0	src/Orders.Data/Migrations/20260802_SplitOrderAddress.sql
14	6	src/Orders.Api/Contracts/OrderDto.cs
22	9	docs/api/orders.openapi.yaml
```

## Diff patch excerpt

```diff
+++ b/src/Orders.Data/Migrations/20260802_SplitOrderAddress.sql
+ALTER TABLE orders DROP COLUMN address;
+++ b/docs/api/orders.openapi.yaml
-        address:
-          type: string
+        addressLine1:
+          type: string
```

## Expected

```json
{
  "checkpoints": {
    "K3": {
      "newlyFired": [
        { "trigger": "M2", "by": "scan", "surface": "data-store", "cite": "persistence class: Migrations/*.sql with destructive DDL (DROP COLUMN)" },
        { "trigger": "M3", "by": "scan", "surface": "contract-dependency", "cite": "contract-artifacts class: docs/api/orders.openapi.yaml removes response field 'address' — breaking per MR-7 (removed schema field)", "breaking": true }
      ],
      "scanEcho": [],
      "newStops": 1,
      "dimensions": { "stops": 2, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 2, "adr": 2 },
      "confidence": "HIGH"
    }
  },
  "notes": "The compound-materiality seed: M2 (data-store) + breaking M3 (contract-dependency) are DISTINCT surfaces -> openspec 2 by C-13, and breaking alone would demand it by C-10 anyway (belt and braces at the rule level). Both firings FOLD into ONE K3 stop (newStops 1, not 2) carrying both questions — P6 away from K1. adr 2 from breaking M3. All scan-detected: HIGH.",
  "properties": ["P6"]
}
```
