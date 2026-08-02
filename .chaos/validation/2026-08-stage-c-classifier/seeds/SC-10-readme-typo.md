# SC-10 — readme-typo (S1 recast)

Band: golden (two-axis S1: docs typo — everything below the floor) · Checkpoints: K1, K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Wave-2 fixture encoded 2026-08-02 from the manifest row frozen the same day.

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc10-readme-typo
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Fix two typos in the demo README ("recieve" -> "receive", "endpont" -> "endpoint"). Docs only.
```

## Scope

```text
scope: README.md
```

## Diff numstat

```text
2	2	README.md
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
  "notes": "The absolute floor: one stop (C-11), nothing else. Whether even that stop survives is the registered §5.7 re-test — this seed is the one that prices it.",
  "properties": []
}
```
