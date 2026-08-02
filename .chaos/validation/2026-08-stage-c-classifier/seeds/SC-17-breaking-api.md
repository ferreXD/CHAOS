# SC-17 — breaking-public-api (S10 recast)

Band: golden (two-axis S10: breaking public contract change) · Checkpoints: K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Wave-2 fixture encoded 2026-08-02 from the frozen manifest row. Fixture diff is synthetic against
the demo surface (the route swap need not exist on d27600f — the classifier judges texts, not a
checked-out tree; internal consistency is what matters).

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc17-archive-replaces-delete
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Replace DELETE /tasks/{id} with POST /tasks/{id}/archive; DELETE now returns 410 Gone with a
pointer header. Aligns the API with the retention policy — existing DELETE clients will break.
```

## Scope

```text
scope: src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/
```

## Diff numstat

```text
21	8	src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
47	19	tests/TaskTracker.Tests/TaskEndpointsTests.cs
```

## Diff patch excerpt

```diff
+++ b/src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
-        app.MapDelete("/tasks/{id:guid}", (Guid id, TaskStore store) =>
-            store.Delete(id) ? Results.NoContent() : Results.NotFound());
+        app.MapPost("/tasks/{id:guid}/archive", (Guid id, TaskStore store) =>
+            store.Archive(id) ? Results.NoContent() : Results.NotFound());
+        app.MapDelete("/tasks/{id:guid}", () => Results.StatusCode(410));
```

## Expected

```json
{
  "checkpoints": {
    "K3": {
      "newlyFired": [
        { "trigger": "M3", "by": "scan", "surface": "contract-dependency", "cite": "api-surface-source route delta: -MapDelete semantics (repurposed to 410) +MapPost(\"/tasks/{id:guid}/archive\" — removed/renamed public route per MR-7", "breaking": true }
      ],
      "scanEcho": [],
      "newStops": 1,
      "dimensions": { "stops": 2, "evidence.targeted": 0, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 2, "adr": 2 },
      "confidence": "HIGH"
    }
  },
  "notes": "Breaking M3 is the one single-trigger firing that demands everything at once: a stop (breaking, first fired at K3, no covering decision -> newStops 1), adr 2, and the FULL OpenSpec set (C-10's breaking arm — no C-13 distinct-surface count needed). Scan-deterministic via route markers: HIGH. Compare SC-04: the additive route earned a delta and no stop; removal is the difference.",
  "properties": []
}
```
