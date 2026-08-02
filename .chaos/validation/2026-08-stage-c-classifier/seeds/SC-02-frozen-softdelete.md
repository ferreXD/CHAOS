# SC-02 — frozen-softdelete

Band: measured (pinned contract) · Source: `../../2026-07-ea-v2/ea-x2-with-without/oracles/task2-softdelete.md` · Checkpoints: K1, K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Pre-registered 2026-08-02, before any classifier code.

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc02-soft-delete
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Change DELETE /tasks/{id} to a soft delete: add a nullable deletedAt timestamp to the task model
(null when active), DELETE sets it and returns 204 without removing the row, GET /tasks hides
soft-deleted tasks by default, ?includeDeleted=true shows them, GET /tasks/{id} returns 404 for
soft-deleted. Seeded tasks stay active (backward-compatible migration).
```

## Scope

```text
scope: src/TaskTracker.Api/Domain/, src/TaskTracker.Api/Endpoints/, tests/TaskTracker.Tests/
```

## Diff numstat

```text
7	2	src/TaskTracker.Api/Domain/TaskItem.cs
19	4	src/TaskTracker.Api/Domain/TaskStore.cs
16	5	src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
38	2	tests/TaskTracker.Tests/TaskEndpointsTests.cs
```

## Diff patch excerpt

```diff
+++ b/src/TaskTracker.Api/Domain/TaskItem.cs
-public record TaskItem(Guid Id, string Title, TaskState State, TaskPriority Priority)
+public record TaskItem(Guid Id, string Title, TaskState State, TaskPriority Priority,
+    DateTimeOffset? DeletedAt = null)
+++ b/src/TaskTracker.Api/Domain/TaskStore.cs
+    public bool SoftDelete(Guid id) // sets DeletedAt, keeps the row
```

## Expected

```json
{
  "checkpoints": {
    "K1": {
      "newlyFired": [
        { "trigger": "M2", "by": "scan", "surface": "data-store", "cite": "persistence class: predicted scope includes src/TaskTracker.Api/Domain/ (TaskStore, TaskItem)" },
        { "trigger": "M1", "by": "adjudication", "surface": "data-store", "cite": "intent 'add deletedAt to the task model' x posture boundary 'new behaviour belongs at the endpoint/query boundary, not in the store's public shape, unless a decision says otherwise'" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 1, "adr": 2 },
      "confidence": "MEDIUM"
    },
    "K3": {
      "newlyFired": [],
      "scanEcho": ["M2"],
      "scanEchoCite": "persistence class: Domain/TaskItem.cs + Domain/TaskStore.cs hunks (not rename-shaped — 4 files, adds >> deletes)",
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 1, "adr": 2 },
      "confidence": "HIGH"
    }
  },
  "notes": "openspec stays 1: M1+M2 both cite 'data-store' — correlated per C-13 (the store-shape change IS the persistence-semantics change). M3 must NOT fire: no route delta; deletedAt in responses is an additive field (observation O-3 band). NOT a durability/persistence-introduction crossing — the store stays in-memory; M1's cite is the boundary posture, not the persistence non-goal.",
  "properties": ["P6"]
}
```
