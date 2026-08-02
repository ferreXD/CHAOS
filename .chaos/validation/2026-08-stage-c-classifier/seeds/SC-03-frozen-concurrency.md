# SC-03 — frozen-concurrency

Band: measured (pinned contract) · Source: `../../2026-07-ea-v2/ea-x2-with-without/oracles/task3-concurrency.md` · Checkpoints: K1, K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Pre-registered 2026-08-02, before any classifier code.

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc03-optimistic-concurrency
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Add optimistic concurrency to PUT /tasks/{id}: integer version on the task (starts at 1,
increments on every successful update); UpdateTaskRequest gains optional expectedVersion —
mismatch -> 409 Conflict with the task unchanged, match -> 200, omitted -> unconditional update
(backward compatible).
```

## Scope

```text
scope: src/TaskTracker.Api/Domain/, src/TaskTracker.Api/Contracts/, src/TaskTracker.Api/Endpoints/, tests/TaskTracker.Tests/
```

## Diff numstat

```text
6	2	src/TaskTracker.Api/Domain/TaskItem.cs
15	6	src/TaskTracker.Api/Domain/TaskStore.cs
4	1	src/TaskTracker.Api/Contracts/TaskRequests.cs
18	7	src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
44	3	tests/TaskTracker.Tests/TaskEndpointsTests.cs
```

## Diff patch excerpt

```diff
+++ b/src/TaskTracker.Api/Domain/TaskItem.cs
-public record TaskItem(Guid Id, string Title, TaskState State, TaskPriority Priority)
+public record TaskItem(Guid Id, string Title, TaskState State, TaskPriority Priority,
+    int Version = 1)
+++ b/src/TaskTracker.Api/Contracts/TaskRequests.cs
-public record UpdateTaskRequest(string Title, TaskState State, TaskPriority Priority);
+public record UpdateTaskRequest(string Title, TaskState State, TaskPriority Priority,
+    int? ExpectedVersion = null);
```

## Expected

```json
{
  "checkpoints": {
    "K1": {
      "newlyFired": [
        { "trigger": "M2", "by": "scan", "surface": "data-store", "cite": "persistence class: predicted scope includes src/TaskTracker.Api/Domain/" },
        { "trigger": "M1", "by": "adjudication", "surface": "data-store", "cite": "intent 'integer version on the task' + conditional update semantics x posture boundary 'not in the store's public shape unless a decision says otherwise'" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 1, "adr": 2 },
      "confidence": "MEDIUM"
    },
    "K3": {
      "newlyFired": [],
      "scanEcho": ["M2"],
      "scanEchoCite": "persistence class: Domain/TaskItem.cs + Domain/TaskStore.cs hunks (5 files, not rename-shaped)",
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 1, "adr": 2 },
      "confidence": "HIGH"
    }
  },
  "notes": "openspec stays 1 (C-13: M1+M2 correlated on data-store). M3 must NOT fire: expectedVersion on UpdateTaskRequest and 409 on an existing route are additive (no route delta, no schema artifact). Known design gap: concurrency/shared-state has NO M2 class (two-axis G-SYS-CONCURRENCY orphan, observation O-2) — this seed's coverage comes from the persistence path + M1, deliberately.",
  "properties": ["P6"]
}
```
