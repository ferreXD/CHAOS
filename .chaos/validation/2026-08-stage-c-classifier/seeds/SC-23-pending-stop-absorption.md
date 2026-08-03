# SC-23 — pending-stop-absorption (Stage-D continuous mode)

Band: adversarial (absorption at a repeated K3 · Stage-D pending-stop rule) · Checkpoints: K1, K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Pre-registered 2026-08-03, BEFORE the absorption code — this seed is EXPECTED TO FAIL
(`newStops 1`, A2 stop over-detection) against the pre-D classifier; the failure is the point.

Scenario: a mid-run snapshot of a continuous `chaos:run`. The loop surfaced a discordance
stop (RUN-DEC-002) two work units ago; the human has not answered yet. The next unit's scan
fires new stop-demanding triggers (a scope spill into the persistence surface). Under phase
checkpoints each of the four checkpoints fired at most once, so this shape could not occur;
under per-unit scanning it is routine — and without absorption every such scan would surface
a fresh interruption, un-folding what design §5.3 law 2 folds. The synthetic ledger elides
the answered approval entry to isolate the absorption path (M4 density is SC-07/SC-08's
concern, not this seed's).

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc23-export-tasks
  mode: null
  declaredTriggers: []
  lifecycle: { status: Delivering }
```

## Intent

```text
Add a CSV export of the task list (GET /tasks/export). Approved scope is the endpoint file
and tests; the store is expected to already expose what export needs.
```

## Scope

```text
scope: src/TaskTracker.Api/Endpoints/TaskEndpoints.cs, tests/TaskTracker.Tests/
```

## Ledger

```text
## RUN-DEC-002 — export column set: contract-fixed or reflect the model?

- status: PENDING
- folds: 1
- why-material: the export becomes a consumed artifact; column choice is a compatibility promise
```

## Diff numstat

```text
14	2	src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
9	1	src/TaskTracker.Api/Domain/TaskStore.cs
```

## Diff patch excerpt

```diff
+++ b/src/TaskTracker.Api/Domain/TaskStore.cs
+    /// <summary>Snapshot() copies the live list so export never observes a mutation
+    /// mid-enumeration; no behaviour change for existing callers.</summary>
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
      "newlyFired": [
        { "trigger": "M5", "by": "scan", "surface": null, "cite": "diff touches src/TaskTracker.Api/Domain/TaskStore.cs, which is NOT in the approved scope (Endpoints + tests)" },
        { "trigger": "M2", "by": "scan", "surface": "data-store", "cite": "the spilled path is persistence-class (Domain/); not rename-shaped" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 0, "adr": 0 },
      "confidence": "HIGH"
    }
  },
  "notes": "The Stage-D absorption rule: M5+M2 demand a stop, no ANSWERED same-surface decision covers them (MR-3 cannot satisfy), but RUN-DEC-002 is PENDING unanswered -> the demands ATTACH to it (stopAbsorbedBy: RUN-DEC-002) instead of placing a second interruption. newStops 0, stops stays at the floor 1. The loop's duty on absorption: amend the pending entry — append the folded question(s), increment its `folds:` count — so the eventual answer covers everything attached and M4 still counts questions honestly. Satisfaction still beats absorption: an ANSWERED same-surface entry alongside the pending one satisfies via MR-3 (stopSatisfiedBy), it does not absorb. All scan, no adjudication -> HIGH.",
  "properties": ["P6"]
}
```
