# SC-11 — small-internal-rename (S2 recast)

Band: golden (two-axis S2: internal rename below every threshold) · Checkpoints: K1, K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Wave-2 fixture encoded 2026-08-02 from the frozen manifest row. Deliberately keeps its paths OUT
of class-mapped directories: this seed measures thresholds, not the C-14 guard (ADV-02 does that).

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc11-rename-validate-helper
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Rename the private endpoint helper ValidateTitle to EnsureValidTitle for consistency with the
other Ensure* helpers. Internal identifier only; no behaviour change.
```

## Scope

```text
scope: src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/
```

## Diff numstat

```text
5	5	src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
3	3	tests/TaskTracker.Tests/TaskEndpointsTests.cs
2	2	tests/TaskTracker.Tests/Fixtures/RequestBuilders.cs
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
      "antiExpectations": "X1 must NOT fire: 3 files / 20 LOC is far below MR-5 (8 files / 400 LOC). M3 must NOT fire: no route-marker delta (helper is private)."
    }
  },
  "notes": "S2's classification held: a small rename deserves nothing beyond the floor. Pairs with ADV-02 (same operation at 28-file scale earns review 2 — and still no stop).",
  "properties": []
}
```
