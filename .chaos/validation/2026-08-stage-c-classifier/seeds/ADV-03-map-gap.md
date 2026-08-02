# ADV-03 — path-class-map-gap

Band: adversarial (the C-7 raise-net test: sensitive content on an unmapped path) · Checkpoints: K1, K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Pre-registered 2026-08-02, before any classifier code. The map has no rule for `.key` files under
`tools/` — deliberately. This seed measures the adjudication net behind the map, not the map.

## Frontmatter

```yaml
chaosMetadata:
  changeId: adv03-ops-signing-helper
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Add a small request-signing helper for the ops smoke-test script so the nightly check can call
the staging instance. Tooling only; no API behaviour change.
```

## Scope

```text
scope: tools/ops/smoke/, src/TaskTracker.Api/Infrastructure/
```

## Diff numstat

```text
27	0	tools/ops/smoke/sign-request.sh
9	0	tools/ops/smoke/demo-signing.key
18	0	src/TaskTracker.Api/Infrastructure/OpsSigning.cs
```

## Diff patch excerpt

```diff
+++ b/tools/ops/smoke/demo-signing.key
+-----BEGIN RSA PRIVATE KEY-----
+MIIEowIBAAKCAQEA7cP3... (demo material)
+-----END RSA PRIVATE KEY-----
+++ b/src/TaskTracker.Api/Infrastructure/OpsSigning.cs
+    // shared helper for tools/ops/smoke/sign-request.sh; NOT registered in Program.cs,
+    // no API wiring — the API's auth posture is untouched
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
      "confidence": "HIGH",
      "antiExpectations": "Nothing fires at K1: intent reads as tooling, predicted paths hit no class (tools/ unmapped; Infrastructure/ unmapped — the gap is real in the map)."
    },
    "K3": {
      "newlyFired": [
        { "trigger": "M2", "by": "adjudication", "surface": "auth", "cite": "patch hunk 'BEGIN RSA PRIVATE KEY' in tools/ops/smoke/demo-signing.key — private key material committed on a path the class map does not cover; loader wired into the API process (OpsSigning.cs)" }
      ],
      "scanEcho": [],
      "newStops": 1,
      "dimensions": { "stops": 2, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 0, "adr": 0 },
      "confidence": "MEDIUM"
    }
  },
  "notes": "The one wave-1 seed that PLACES a mid-flight stop: first materiality firing at K3 with no covering answered decision and no K1 fold available — the design halting on a secret appearing mid-DELIVER is correct behaviour, not over-detection. The raise MUST carry the patch-content cite (P5); '.key under tools/' is exactly the shape a path map misses. M2 alone -> openspec stays 0.",
  "properties": ["P5"]
}
```
