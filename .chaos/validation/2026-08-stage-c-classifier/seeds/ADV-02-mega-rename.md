# ADV-02 — mechanical-mega-rename

Band: adversarial (huge blast radius, zero materiality — the P1 seed) · Checkpoints: K1, K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Pre-registered 2026-08-02, before any classifier code. Exercises the C-14 rename-shape guard:
the diff touches `Domain/TaskItem.cs` (persistence class) but is rename-shaped end to end.

## Frontmatter

```yaml
chaosMetadata:
  changeId: adv02-rename-taskitem
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Rename TaskItem to TrackedTask across the solution for domain-language consistency with the
product glossary. Pure mechanical rename; no behaviour change.
```

## Scope

```text
scope: src/TaskTracker.Api/, tests/TaskTracker.Tests/ (solution-wide identifier rename, ~28 files)
```

## Diff numstat

```text
4	4	src/TaskTracker.Api/Domain/TaskItem.cs
11	11	src/TaskTracker.Api/Domain/TaskStore.cs
9	9	src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
3	3	src/TaskTracker.Api/Contracts/TaskRequests.cs
2	2	src/TaskTracker.Api/Program.cs
6	6	tests/TaskTracker.Tests/TaskEndpointsTests.cs
5	5	tests/TaskTracker.Tests/Fixtures/SeedData.cs
2	2	tests/TaskTracker.Tests/Fixtures/ClientFactory.cs
# totals: files=28 loc=392
```

(Fixture note: numstat abbreviated to 8 representative rows of the ~28-file rename; every row is
adds==deletes. The harness should treat the fixture numstat as the complete diff.)

## Expected

```json
{
  "checkpoints": {
    "K1": {
      "newlyFired": [
        { "trigger": "X1", "by": "scan", "surface": null, "cite": "predicted ~28 files >= review2 threshold (20)" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 0, "evidence.breadth": 1, "review": 2, "verify": 1, "openspec": 0, "adr": 0 },
      "confidence": "HIGH"
    },
    "K3": {
      "newlyFired": [],
      "scanEcho": ["X1"],
      "scanEchoCite": "numstat: 8+ files, adds==deletes per file, global ratio 1.0 -> rename-shaped (C-14 guard active)",
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 0, "evidence.breadth": 1, "review": 2, "verify": 1, "openspec": 0, "adr": 0 },
      "confidence": "HIGH",
      "antiExpectations": "M2 must NOT fire despite Domain/TaskItem.cs + Domain/TaskStore.cs being persistence-class paths: the C-14 guard demotes the path hits to adjudication candidates, and adjudication must DECLINE a pure rename. M1 must NOT fire (no semantic posture change). Any stop here is a hard P1 violation."
    }
  },
  "notes": "Zero stops, zero materiality dimensions; all rigor lands on review/verify/breadth. This is the family law measured: blast radius buys mechanical rigor, never a stop.",
  "properties": ["P1"]
}
```
