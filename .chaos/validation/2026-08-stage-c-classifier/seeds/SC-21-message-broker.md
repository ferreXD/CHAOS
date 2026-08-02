# SC-21 — message-broker (S13 recast)

Band: golden (two-axis S13: the foundation-crossing change — C's heaviest legitimate K1) · Checkpoints: K1
Posture: `../assets/architecture-posture.d27600f.md` (the frozen excerpt already carries the
crossed line: "No external integrations. All effects are in-process." [FACT]) · Map: `../assets/path-class-map.json`
Wave-2 fixture encoded 2026-08-02 from the frozen manifest row.

**Encoding note (row interpretation):** the manifest row lists "M3 scan (new dep)". At K1 no
patch exists, so the manifest delta is not scannable yet; the K1 firing is **by adjudication**
(the intent names the broker client and the csproj is in scope), with scan confirmation belonging
to a K3 this seed deliberately does not register. Same interpretation pattern as SC-12.

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc21-task-events-rabbitmq
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Publish task lifecycle events (created/updated/deleted) to RabbitMQ so the new reporting service
can consume them: add the RabbitMQ.Client dependency, a publisher behind an ITaskEvents
abstraction, connection config, and a health probe for the broker connection.
```

## Scope

```text
scope: src/TaskTracker.Api/TaskTracker.Api.csproj, src/TaskTracker.Api/Events/ (new), src/TaskTracker.Api/Program.cs, src/TaskTracker.Api/Endpoints/, src/TaskTracker.Api/appsettings.json, tests/TaskTracker.Tests/ (~22 files predicted)
```

## Expected

```json
{
  "checkpoints": {
    "K1": {
      "newlyFired": [
        { "trigger": "M1", "by": "adjudication", "surface": "integration", "cite": "intent 'publish task lifecycle events to RabbitMQ' x posture 'No external integrations. All effects are in-process against the in-memory store. [FACT]' — an out-of-process side-effect channel reverses the integration posture" },
        { "trigger": "M3", "by": "adjudication", "surface": "contract-dependency", "cite": "intent names a NEW direct dependency (RabbitMQ.Client) and an event contract consumed by another service; csproj in predicted scope (scan confirms at K3, outside this seed's registration)", "breaking": false },
        { "trigger": "X1", "by": "scan", "surface": null, "cite": "predicted ~22 files >= review2 threshold (20, MR-5)" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 1, "review": 2, "verify": 1, "openspec": 2, "adr": 2 },
      "confidence": "MEDIUM"
    }
  },
  "notes": "The heaviest legitimate K1 in the corpus, and still ONE stop: M1 (integration) + M3 (contract-dependency) are DISTINCT surfaces -> full OpenSpec set (C-13's positive case), adr 2 from the posture crossing, review 2 from predicted breadth — and both materiality firings FOLD into the floor approval, which now carries the two questions that matter ('reverse the no-integrations posture?' + 'adopt the broker client + event contract?'). S13's two-axis verdict (strict-full, foundation revision) expressed per-dimension, minus the ceremony.",
  "properties": ["P6"]
}
```
