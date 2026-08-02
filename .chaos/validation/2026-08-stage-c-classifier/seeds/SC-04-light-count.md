# SC-04 — light-count-endpoint

Band: measured (light-eligible; stayed light with valve live, twice) · Source: `../../2026-07-ea-v2/ea-x2-stage-a-light/tasks/taskB1-count.md` · Checkpoints: K1, K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Pre-registered 2026-08-02, before any classifier code.

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc04-task-count
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Add GET /tasks/count returning 200 with { "count": <integer> } — the number of tasks currently in
the store; always equals what GET /tasks returns. Read-only dashboard convenience; no auth, no
persistence-model change.
```

## Scope

```text
scope: src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/
```

## Diff numstat

```text
8	0	src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
26	0	tests/TaskTracker.Tests/TaskEndpointsTests.cs
```

## Diff patch excerpt

```diff
+++ b/src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
+        app.MapGet("/tasks/count", (TaskStore store) =>
+            Results.Ok(new { count = store.All().Count() }));
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
      "antiExpectations": "M1 must NOT fire — a read-only aggregate at the endpoint boundary is inside the boundary posture; adjudication runs (K1, C-12) and must DECLINE."
    },
    "K3": {
      "newlyFired": [
        { "trigger": "M3", "by": "scan", "surface": "contract-dependency", "cite": "api-surface-source route delta: +MapGet(\"/tasks/count\" in Endpoints/TaskEndpoints.cs; breaking: false (additive)" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 0, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 1, "adr": 1 },
      "confidence": "HIGH"
    }
  },
  "notes": "The additive-M3 policy seed (observation O-3): a NEW public route owes a delta spec + ledger ADR entry and nothing else — no stop (non-breaking). Under the old model this task carried the FULL OpenSpec set on the light path; delta-only is still a strict cost reduction. If the creator judges additive-M3 too hot, this row is where that decision is made visible.",
  "properties": []
}
```
