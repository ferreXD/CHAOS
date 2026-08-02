# SC-20 — logging-config (S12 recast)

Band: golden (two-axis S12: observability config, the quiet zero) · Checkpoints: K1, K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Wave-2 fixture encoded 2026-08-02 from the frozen manifest row.

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc20-loglevel-info
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Raise the default log level from Warning to Information in appsettings.json so request logs show
up while we chase the intermittent 500 reports. Config only.
```

## Scope

```text
scope: src/TaskTracker.Api/appsettings.json
```

## Diff numstat

```text
1	1	src/TaskTracker.Api/appsettings.json
```

## Diff patch excerpt

```diff
+++ b/src/TaskTracker.Api/appsettings.json
-      "Default": "Warning",
+      "Default": "Information",
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
      "confidence": "HIGH",
      "antiExpectations": "M2 must NOT fire: appsettings.json is touched but the configKeyMarker key set (ApiKey/Token/Secret/...) does not match 'Logging:LogLevel:Default' — the key-qualified rule's precision test. S12's PII-into-logs escalation variant is UNTESTABLE on this subject (pii class empty, observation O-5)."
    }
  },
  "notes": "The quiet zero: same file as SC-12, opposite outcome, and the difference is exactly one key name. This pair is the secrets rule's calibration.",
  "properties": []
}
```
