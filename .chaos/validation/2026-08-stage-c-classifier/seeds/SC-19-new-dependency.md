# SC-19 — new-direct-dependency (S11b recast)

Band: golden (two-axis S11, new-direct arm — materiality per C-4) · Checkpoints: K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Wave-2 fixture encoded 2026-08-02 from the frozen manifest row.

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc19-add-fluentvalidation
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Adopt FluentValidation for request validation instead of growing the hand-rolled checks: add the
package and move the title rules onto a CreateTaskRequestValidator.
```

## Scope

```text
scope: src/TaskTracker.Api/TaskTracker.Api.csproj, src/TaskTracker.Api/Validation/, src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/
```

## Diff numstat

```text
1	0	src/TaskTracker.Api/TaskTracker.Api.csproj
34	0	src/TaskTracker.Api/Validation/CreateTaskRequestValidator.cs
11	9	src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
26	4	tests/TaskTracker.Tests/TaskEndpointsTests.cs
```

## Diff patch excerpt

```diff
+++ b/src/TaskTracker.Api/TaskTracker.Api.csproj
+    <PackageReference Include="FluentValidation" Version="11.9.0" />
```

## Expected

```json
{
  "checkpoints": {
    "K3": {
      "newlyFired": [
        { "trigger": "M3", "by": "scan", "surface": "contract-dependency", "cite": "dependency-manifests class: NEW direct PackageReference FluentValidation (C-4 materiality arm)", "breaking": false }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 0, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 1, "adr": 1 },
      "confidence": "HIGH",
      "antiExpectations": "No stop: adopting a dependency is an architectural decision (adr 1 = ledger entry) with a delta spec, but it is not breaking and crosses no posture — behaviour (400 on bad titles) is preserved. M1 must NOT fire."
    }
  },
  "notes": "The C-4 split measured end to end with SC-18: same file class, opposite family, different obligations. Single materiality surface -> openspec stays 1.",
  "properties": []
}
```
