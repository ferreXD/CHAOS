# ADV-04 — mid-flight-scope-spill

Band: adversarial (M5 + checkpoint-local folding at K3) · Checkpoints: K1, K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Pre-registered 2026-08-02, before any classifier code.

## Frontmatter

```yaml
chaosMetadata:
  changeId: adv04-sort-param
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Add an optional ?sort=priority|createdAt query parameter to GET /tasks. Endpoint-level
convenience; approved scope is the endpoint file and tests only.
```

## Scope

```text
scope: src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/
```

## Diff numstat

```text
12	2	src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
9	1	src/TaskTracker.Api/Domain/TaskStore.cs
24	0	tests/TaskTracker.Tests/TaskEndpointsTests.cs
```

## Diff patch excerpt

```diff
+++ b/src/TaskTracker.Api/Domain/TaskStore.cs
+    /// <summary>All() returns tasks in creation order — documented for the new sort
+    /// parameter's default; no behaviour change in this file.</summary>
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
      "confidence": "HIGH"
    },
    "K3": {
      "newlyFired": [
        { "trigger": "M5", "by": "scan", "surface": null, "cite": "diff touches src/TaskTracker.Api/Domain/TaskStore.cs, which is NOT in the approved scope (Endpoints + tests)" },
        { "trigger": "M2", "by": "scan", "surface": "data-store", "cite": "the spilled path is persistence-class (Domain/); classifier re-runs over the spilled surface per M5's outcome; not rename-shaped" }
      ],
      "scanEcho": [],
      "newStops": 1,
      "dimensions": { "stops": 2, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 0, "adr": 0 },
      "confidence": "HIGH"
    }
  },
  "notes": "M5 and M2 fire at the SAME checkpoint -> they FOLD into ONE re-approval stop (newStops 1, not 2) carrying both questions ('scope grew into Domain/ — re-approve?' + 'persistence surface touched'). M5 carries no surface and never counts toward C-13's full-set rule; M2 alone moves no openspec -> openspec stays 0. All scan, no adjudication -> HIGH.",
  "properties": ["P6"]
}
```
