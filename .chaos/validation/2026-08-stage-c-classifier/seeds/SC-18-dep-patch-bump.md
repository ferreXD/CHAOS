# SC-18 — dependency-patch-bump (S11a recast)

Band: golden (two-axis S11, patch/minor arm — mechanical per C-4) · Checkpoints: K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Wave-2 fixture encoded 2026-08-02 from the frozen manifest row.

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc18-aspnetcore-openapi-bump
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Bump Microsoft.AspNetCore.OpenApi from 8.0.4 to 8.0.6 (routine patch update; changelog is
bugfix-only). No code changes.
```

## Scope

```text
scope: src/TaskTracker.Api/TaskTracker.Api.csproj
```

## Diff numstat

```text
1	1	src/TaskTracker.Api/TaskTracker.Api.csproj
```

## Diff patch excerpt

```diff
+++ b/src/TaskTracker.Api/TaskTracker.Api.csproj
-    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.4" />
+    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.6" />
```

## Expected

```json
{
  "checkpoints": {
    "K3": {
      "newlyFired": [
        { "trigger": "X3", "by": "scan", "surface": null, "cite": "dependency-manifests class: existing PackageReference version delta 8.0.4 -> 8.0.6 = patch bump (C-4 mechanical arm)" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 0, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 0, "adr": 0 },
      "confidence": "HIGH",
      "antiExpectations": "M3 must NOT fire: same package, patch-level delta — the C-4 split's mechanical side. Any stop or spec obligation on a routine patch bump is over-detection."
    }
  },
  "notes": "X3 buys exactly one thing: the supply-chain verify check (advisory scan / changelog sanity). Pairs with SC-19, which crosses the C-4 line the other way.",
  "properties": ["P1"]
}
```
