# SC-22 — self-review-fail (K4 / X2)

Band: mechanical (C-3: X2 never stops — deeper eyes, not a halt) · Checkpoints: K4
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Added 2026-08-02 via changelog (corpus grows 27 → 28) to close observation **O-9** before
`chaos:verify` is wired (step 4c) — the per-increment discipline: no wiring without corpus
coverage. K4 is scan-only (C-12): no adjudication packet, no blind judging needed.

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc22-count-selfreview-fail
  mode: null
  declaredTriggers: []
  selfReview: fail        # the inline self-review checklist result (contract statement untestable)
  lifecycle: { status: Delivered }
```

## Intent

```text
Add GET /tasks/count (as SC-04); at DELIVER exit the inline self-review failed its checklist:
the "count always equals GET /tasks length" contract statement was recorded without a covering
test (coverage row evidence "code" with no whyNotTest).
```

## Scope

```text
scope: src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/
```

## Expected

```json
{
  "checkpoints": {
    "K4": {
      "newlyFired": [
        { "trigger": "X2", "by": "scan", "surface": null, "cite": "self-review verdict 'fail' != clean" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 0, "evidence.breadth": 0, "review": 2, "verify": 1, "openspec": 0, "adr": 0 },
      "confidence": "HIGH"
    }
  },
  "notes": "C-3 measured: a failed self-review buys an INDEPENDENT review pass (review 2) and deeper verify — never a stop (newStops 0; any stop here is a hard P1 violation). The human sees it at the existing verify/dashboard checkpoint, not via a halt. Mechanical-only fired set keeps every materiality dimension at floor.",
  "properties": ["P1"]
}
```
