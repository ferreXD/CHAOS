# SC-12 — config-secret-rotate (S3 recast)

Band: golden (two-axis S3: the dangerous-but-tiny config change, demo-scaled) · Checkpoints: K1, K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Wave-2 fixture encoded 2026-08-02 from the frozen manifest row.

**Encoding note (row interpretation):** the manifest row reads "M2 scan (auth: `appsettings`
configKeyMarker) fold". The configKeyMarker is only *visible to the scan* in the K3 patch; at K1
the scan sees just a path in scope, so the K1 firing that enables the fold is necessarily **by
adjudication** (intent names the token), with the **scan echo at K3** carrying the deterministic
detection. This is an interpretation of the frozen row, not a change to it.

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc12-rotate-webhook-token
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Rotate the uptime-webhook Token in appsettings.json: replace the committed value with a
placeholder and read the real one from configuration/env override. One-line-ish config change.
```

## Scope

```text
scope: src/TaskTracker.Api/appsettings.json
```

## Diff numstat

```text
2	1	src/TaskTracker.Api/appsettings.json
```

## Diff patch excerpt

```diff
+++ b/src/TaskTracker.Api/appsettings.json
-  "UptimeWebhook": { "Token": "whk_live_9f2c11ab" },
+  "UptimeWebhook": { "Token": null },
+  // real value supplied via env override UptimeWebhook__Token
```

## Expected

```json
{
  "checkpoints": {
    "K1": {
      "newlyFired": [
        { "trigger": "M2", "by": "adjudication", "surface": "auth", "cite": "intent 'rotate the uptime-webhook Token' + appsettings.json in scope — credential material; scan cannot see keys before a patch exists" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 0, "adr": 0 },
      "confidence": "MEDIUM"
    },
    "K3": {
      "newlyFired": [],
      "scanEcho": ["M2"],
      "scanEchoCite": "secrets class configKeyMarker: key 'Token' in appsettings.json hunk (a committed live token is being removed — the diff itself contains whk_live_9f2c11ab)",
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 0, "adr": 0 },
      "confidence": "HIGH"
    }
  },
  "notes": "S3's lesson carried into C: dangerous-but-tiny buys ONE folded stop + targeted checks (secret not committed, env override documented) — no review ceremony, no spec, no archaeology. M2 alone moves no openspec/adr. The two-axis strict-compact answer, expressed per-dimension.",
  "properties": []
}
```
