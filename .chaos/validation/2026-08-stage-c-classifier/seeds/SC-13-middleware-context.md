# SC-13 — request-context-middleware (S5 recast)

Band: golden (two-axis S5 + weakness #2: cross-cutting ≠ risky) · Checkpoints: K1, K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Wave-2 fixture encoded 2026-08-02 from the frozen manifest row. Carries its own adjudication
trap: the posture marks observability as `[UNKNOWN] for future intent` — **UNKNOWN-posture areas
are not crossings**. An M1 raise citing the observability section is a hard over-detection.

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc13-request-context
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Add request-context middleware: accept/generate an X-Correlation-Id header, flow it through the
request, echo it on every response so support can match client reports to server activity.
Cross-cutting but additive; no auth, no data-model change.
```

## Scope

```text
scope: src/TaskTracker.Api/Program.cs, src/TaskTracker.Api/Middleware/ (new), src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/, README.md (~9 files predicted)
```

## Diff numstat

```text
6	1	src/TaskTracker.Api/Program.cs
42	0	src/TaskTracker.Api/Middleware/RequestContextMiddleware.cs
18	0	src/TaskTracker.Api/Middleware/CorrelationId.cs
4	2	src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
58	0	tests/TaskTracker.Tests/RequestContextTests.cs
9	3	tests/TaskTracker.Tests/TaskEndpointsTests.cs
7	1	tests/TaskTracker.Tests/Fixtures/ClientFactory.cs
12	0	tests/TaskTracker.Tests/Fixtures/Headers.cs
5	1	README.md
```

## Expected

```json
{
  "checkpoints": {
    "K1": {
      "newlyFired": [
        { "trigger": "X1", "by": "scan", "surface": null, "cite": "predicted 9 files >= review1 threshold (8, MR-5)" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 0, "evidence.breadth": 1, "review": 1, "verify": 1, "openspec": 0, "adr": 0 },
      "confidence": "HIGH"
    },
    "K3": {
      "newlyFired": [],
      "scanEcho": ["X1"],
      "scanEchoCite": "numstat: 9 files (>=8), ~175 LOC; not rename-shaped (adds >> deletes)",
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 0, "evidence.breadth": 1, "review": 1, "verify": 1, "openspec": 0, "adr": 0 },
      "confidence": "HIGH",
      "antiExpectations": "M1 must NOT fire (observability is [UNKNOWN], not a non-goal; boundary posture untouched — middleware sits above endpoints). M2 must NOT fire (no class path; a correlation id is not PII in this subject). M3 must NOT fire (response header addition is not a route delta). Blast radius alone must never become materiality — two-axis weakness #2, property P1."
    }
  },
  "notes": "Cross-cutting buys mechanical rigor only: review folded into verify, module-level breadth understanding, zero stops.",
  "properties": ["P1"]
}
```
