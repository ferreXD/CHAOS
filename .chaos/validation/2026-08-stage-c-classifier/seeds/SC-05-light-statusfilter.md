# SC-05 — light-status-filter

Band: measured (light-eligible; stayed light with valve live, twice) · Source: `../../2026-07-ea-v2/ea-x2-stage-a-light/tasks/taskB2-statusfilter.md` · Checkpoints: K1, K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Pre-registered 2026-08-02, before any classifier code. The canonical zero-trigger seed: the
demo's architecture NAMES query filtering as the known extension point.

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc05-status-filter
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Add an optional ?status= query parameter to GET /tasks filtering by TaskState name
(case-insensitive: Open, InProgress, Done); no parameter -> all tasks (unchanged); unrecognised
value -> 400. Query-shaping convenience; no auth, no persistence-model change.
```

## Scope

```text
scope: src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/
```

## Diff numstat

```text
14	3	src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
31	0	tests/TaskTracker.Tests/TaskEndpointsTests.cs
```

## Diff patch excerpt

```diff
+++ b/src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
-        app.MapGet("/tasks", (TaskStore store) => Results.Ok(store.All()));
+        app.MapGet("/tasks", (TaskStore store, string? status) =>
+        {
+            if (status is null) return Results.Ok(store.All());
+            if (!Enum.TryParse<TaskState>(status, true, out var state)) return Results.BadRequest();
```

## Expected

```json
{
  "checkpoints": {
    "K1": {
      "newlyFired": [],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 0, "evidence.breadth": 0, "review": 0, "verify": 0, "openspec": 0, "adr": 0 },
      "confidence": "HIGH",
      "antiExpectations": "M1 must NOT fire — the posture explicitly names ?status= filtering as the known extension point. An adjudication raise here is a hard over-detection failure."
    },
    "K3": {
      "newlyFired": [],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 0, "evidence.breadth": 0, "review": 0, "verify": 0, "openspec": 0, "adr": 0 },
      "confidence": "HIGH",
      "antiExpectations": "M3 must NOT fire: the MapGet(\"/tasks\" route line is MODIFIED (parameter added), not added/removed — route-marker DELTA is zero. This is the route-delta rule's precision test."
    }
  },
  "notes": "Zero-trigger through both checkpoints; the floor stop (C-11) is the only stop. Every dimension stays at base — the 'start small' promise measured.",
  "properties": []
}
```
