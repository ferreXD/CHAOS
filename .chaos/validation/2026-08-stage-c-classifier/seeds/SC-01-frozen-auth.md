# SC-01 — frozen-auth-gate

Band: measured (pinned contract) · Source: `../../2026-07-ea-v2/ea-x2-with-without/oracles/task1-auth.md` (frozen, byte-identical intent basis) · Checkpoints: K1, K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Pre-registered 2026-08-02, before any classifier code. History: valve escalated this band correctly (Stage-A/B); EA-X2 measured 0 catches on it — C's expectation is fold-into-floor + targeted checks only.

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc01-auth-gate
  mode: null            # no preset flag — zero floors
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Require API-key authentication on the /tasks endpoints: every /tasks route must present a valid
X-Api-Key header (config key ApiKey, default test-secret-key); missing or incorrect key -> 401
before any read/mutation. GET / stays public.
```

## Scope

```text
scope: src/TaskTracker.Api/Endpoints/, src/TaskTracker.Api/Program.cs, src/TaskTracker.Api/appsettings.json, src/TaskTracker.Api/Security/ (new), tests/TaskTracker.Tests/
```

## Diff numstat

```text
36	0	src/TaskTracker.Api/Security/ApiKeyMiddleware.cs
9	1	src/TaskTracker.Api/Program.cs
14	3	src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
2	0	src/TaskTracker.Api/appsettings.json
41	6	tests/TaskTracker.Tests/TaskEndpointsTests.cs
```

## Diff patch excerpt

```diff
+++ b/src/TaskTracker.Api/Security/ApiKeyMiddleware.cs
+public sealed class ApiKeyMiddleware
+{
+    private const string HeaderName = "X-Api-Key";
+    // key from config["ApiKey"] ?? "test-secret-key"; 401 before existence checks
+++ b/src/TaskTracker.Api/appsettings.json
+  "ApiKey": null,
```

## Expected

```json
{
  "checkpoints": {
    "K1": {
      "newlyFired": [
        { "trigger": "M1", "by": "adjudication", "surface": "auth", "cite": "intent 'API-key authentication on the /tasks endpoints' x posture 'Non-goals: Authentication / authorization / multi-tenant concerns' + 'Any auth is out of scope and would be strict, decision-bearing work'" },
        { "trigger": "M2", "by": "scan", "surface": "auth", "cite": "auth class: predicted scope includes src/TaskTracker.Api/Security/ (new)" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 1, "adr": 2 },
      "confidence": "MEDIUM"
    },
    "K3": {
      "newlyFired": [],
      "scanEcho": ["M2"],
      "scanEchoCite": "auth class: src/TaskTracker.Api/Security/** path + configKeyMarker ApiKey in appsettings.json hunk + contentMarker X-Api-Key",
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 1, "adr": 2 },
      "confidence": "HIGH"
    }
  },
  "notes": "openspec stays 1 (delta): M1+M2 both cite surface 'auth' — correlated per C-13, NOT distinct. M3 must NOT fire: no route delta (auth wraps existing routes). X1 must NOT fire (5 files / ~112 LOC, below thresholds).",
  "properties": ["P6"]
}
```
