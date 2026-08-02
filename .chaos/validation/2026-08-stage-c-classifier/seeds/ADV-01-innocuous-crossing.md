# ADV-01 — innocuous-posture-crossing

Band: adversarial (the semantic-detector stressor from design doc §7 / handoff §5.6) · Checkpoints: K1
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Pre-registered 2026-08-02, before any classifier code. Deliberately shares NO keywords with the
non-goals bullet list — the crossing lands on the data-access section's single-source-of-truth
posture. A lexical detector fails here by construction (this seed is why C-12 rejected the
lexical pre-filter).

## Frontmatter

```yaml
chaosMetadata:
  changeId: adv01-list-cache
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Speed up GET /tasks a little for the dashboard: remember the task list between requests so we
don't rebuild it every time. Small perf win, no behaviour change intended.
```

## Scope

```text
scope: src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/
```

## Expected

```json
{
  "checkpoints": {
    "K1": {
      "newlyFired": [
        { "trigger": "M1", "by": "adjudication", "surface": "data-store", "cite": "intent 'remember the task list between requests' x posture data-access 'The store is the single source of truth in memory' — a cross-request cache is a second copy of store state with its own staleness semantics ('no behaviour change intended' is false under concurrent writes)" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 0, "openspec": 1, "adr": 2 },
      "confidence": "MEDIUM"
    }
  },
  "notes": "THE under-detection tripwire. Scan is structurally blind (scope is only Endpoints/ + tests — no class path); only the adjudication layer can catch it, and it must, with a cite landing on the data-access section. Missing this seed = governance bypass = hard corpus FAIL (acceptance A1). Single trigger -> openspec stays 1 (delta).",
  "properties": []
}
```
