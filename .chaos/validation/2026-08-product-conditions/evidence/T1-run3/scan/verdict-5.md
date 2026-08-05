---
chaosMetadata:
  schemaVersion: 1
  artifactType: change-artifact
  artifactScope: change
  changeId: add-priority-filter
  sourceCommand: unknown
  lastWrittenAt: "2026-08-04T23:42:42+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-08-04T23:42:42+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: demo/dotnet
    reviewRequest: null
    contextSource: session-context
    confidence: HIGH
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: LOW
    bodyHash: "sha256:61529fb743468ac476de31186e654c058958612711daf771cb1158ba6265b6c8"
---

# Scan verdict 5 — K3

- FIRED M3 (by adjudication, surface contract-dependency) [TRG-002] — cite: patch 'src/TaskTracker.Api/Endpoints/TaskEndpoints.cs: -group.MapGet("/", (TaskStore store) => Results.Ok(store.All())); +group.MapGet("/", (string? priority, TaskStore store) => { ... return Results.BadRequest(new { error = ... }); }' x scope 'the GET /tasks handler gains an optional priority query parameter' — the public contract of an existing route changed: it accepts a new query parameter and can now answer 400 where it previously always answered 200. The deterministic route-delta scan cannot see this because the route template MapGet("/") is byte-identical; only the handler's parameter list and status set changed.
- stops: none demanded
- dimensions: stops 1 · evidence.targeted 1 · evidence.breadth 0 · review 1 · verify 1 · openspec 1 · adr 1
- confidence: MEDIUM · scanSeq: 5
- adjudication: not due
