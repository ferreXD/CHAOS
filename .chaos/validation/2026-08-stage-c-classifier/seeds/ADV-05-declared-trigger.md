# ADV-05 — declared-trigger

Band: adversarial (the C-9 declared-triggers instrument) · Checkpoints: K1
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Pre-registered 2026-08-02, before any classifier code. The change looks trivial; the human knows
better ("this response is scraped by our uptime vendor's auth probe") and declares the trigger.

## Frontmatter

```yaml
chaosMetadata:
  changeId: adv05-health-response
  mode: null
  declaredTriggers: [sensitive-surface:auth]
  lifecycle: { status: Framed }
```

## Intent

```text
Tighten the GET / health response to a fixed minimal JSON body ({"status":"ok"}) instead of the
current framework default page. Cosmetic-looking, but our own status dashboard's authenticated
uptime probe parses this response — declaring sensitive-surface.
```

## Scope

```text
scope: src/TaskTracker.Api/Program.cs, tests/TaskTracker.Tests/
```

## Expected

```json
{
  "checkpoints": {
    "K1": {
      "newlyFired": [
        { "trigger": "M2", "by": "declared", "surface": "auth", "cite": "frontmatter declaredTriggers: [sensitive-surface] — declarations are treated as fired (C-9); they can only add, never suppress" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 0, "adr": 0 },
      "confidence": "HIGH"
    }
  },
  "notes": "No scan hit, no adjudication needed — the declaration is authoritative input, so confidence stays HIGH (scan-grade determination). The declared M2 folds into the floor stop and buys exactly the targeted verify checks. A classifier that ignores declaredTriggers fails this seed.",
  "properties": []
}
```
