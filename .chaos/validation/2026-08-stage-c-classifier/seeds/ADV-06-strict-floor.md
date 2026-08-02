# ADV-06 — strict-preset-floor

Band: adversarial (the C-9 floor-vector semantics + P3) · Checkpoints: K1
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Pre-registered 2026-08-02, before any classifier code. A zero-trigger change under `--strict`:
the dimensions must equal the floor vector exactly — floors are not triggers.

## Frontmatter

```yaml
chaosMetadata:
  changeId: adv06-readme-strict
  mode: strict          # preset floor vector per design doc §8
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Fix the demo README's quick-start section: the dotnet run command lists the wrong project path
and the port is stale (5000 -> 5080). Docs only.
```

## Scope

```text
scope: README.md
```

## Diff numstat

```text
3	3	README.md
```

## Expected

```json
{
  "checkpoints": {
    "K1": {
      "newlyFired": [],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 2, "evidence.targeted": 1, "evidence.breadth": 2, "review": 2, "verify": 2, "openspec": 2, "adr": 1 },
      "confidence": "HIGH",
      "antiExpectations": "fired stays EMPTY — floors place rigor without creating trigger records (a preset is not evidence of materiality). The second stop is PLACED at DELIVER exit by the stops-floor-of-2 rule (design doc §8), not created by a trigger: newStops (trigger-created) is 0."
    }
  },
  "notes": "P3's positive half: floors raise, and nothing here may lower or suppress (there is nothing fired to suppress — the property test pairs this with a variant where a trigger fires under a LOWER floor and must survive). Dimensions == the strict floor vector verbatim from design doc §8's provisional table; when that table is re-calibrated, THIS ROW changes with it via a dated register entry.",
  "properties": ["P3"]
}
```
