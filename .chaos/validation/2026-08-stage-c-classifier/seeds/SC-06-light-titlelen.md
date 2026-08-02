# SC-06 — light-title-max-length

Band: measured (light-eligible; stayed light with valve live, twice) · Source: `../../2026-07-ea-v2/ea-x2-stage-a-light/tasks/taskB3-titlelen.md` · Checkpoints: K1, K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Pre-registered 2026-08-02, before any classifier code.

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc06-title-max-length
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Enforce a 200-character maximum on task titles: POST/PUT with a longer title -> 400 and no
create/modify; exactly 200 accepted; existing blank-title 400 behaviour preserved.
Request-validation convenience; no auth, no persistence-model change.
```

## Scope

```text
scope: src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/
```

## Diff numstat

```text
10	2	src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
29	0	tests/TaskTracker.Tests/TaskEndpointsTests.cs
```

## Diff patch excerpt

```diff
+++ b/src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
+        private static bool TitleTooLong(string title) => title.Length > 200;
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
      "newlyFired": [],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 0, "evidence.breadth": 0, "review": 0, "verify": 0, "openspec": 0, "adr": 0 },
      "confidence": "HIGH"
    }
  },
  "notes": "Pre-registered NO-FIRE per the measured stay-light calibration (this task stayed light with the valve live in both Stage-A and Stage-B runs). KNOWN BLIND SPOT registered as observation O-4: validation tightening is arguably a breaking contract change (previously-accepted 250-char titles now 400) and neither the route-delta scan nor the pre-registered adjudication expectation flags it. Deliberate: flipping this row later requires a dated register entry, not a silent edit.",
  "properties": []
}
```
