# SC-08 — underspec-delete

Band: value fixture (under-specified; EA-X2b task B) · Source: `../../2026-07-ea-v2/ea-x2b-under-specified/tasks/taskB-delete.md` · Checkpoints: K1, K2, K3
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Pre-registered 2026-08-02, before any classifier code. The full-arc seed: LOW-confidence K1 →
M4 at K2 → M2+M1 at K3 with the stop-satisfaction rule exercised.

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc08-delete-underspecified
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Users keep asking to be able to get rid of tasks they don't need anymore — the delete endpoint
exists but product wants the "get rid of it" experience to be solid. Make deleting tasks work
properly for our users. Keep the build and tests green.
```

## Scope

```text
scope: src/TaskTracker.Api/, tests/TaskTracker.Tests/
```

## Ledger

```markdown
# Decision Events — sc08-delete-underspecified

## PROP-DEC-001 — Delete semantics: hard delete, soft delete, or archive?

- status: ANSWERED (maintainer, 2026-08-02)
- approves-change: true
- options: A keep hard delete, improve UX/idempotency · B soft delete with deletedAt · C archive state
- recommendation: B — recoverable deletes fit "solid" without a new state machine
- answer: B — soft delete; keep the rows, hide them by default
- why-material: changes the data-retention story and the task model's public shape (store shape is posture-guarded)
- sync-action: CREATE_ADR
- knowledge: HUMAN_DECISION · confidence: HIGH

## PROP-DEC-002 — Visibility of deleted tasks: hidden entirely or retrievable?

- status: ANSWERED (maintainer, 2026-08-02)
- options: A hidden everywhere · B ?includeDeleted=true opt-in · C separate /tasks/deleted route
- recommendation: B — parity with list filtering, no new route
- answer: B
- why-material: defines what clients can still see after deletion — observable contract behaviour
- sync-action: NONE
- knowledge: HUMAN_DECISION · confidence: HIGH
```

## Diff numstat

```text
7	2	src/TaskTracker.Api/Domain/TaskItem.cs
19	4	src/TaskTracker.Api/Domain/TaskStore.cs
16	5	src/TaskTracker.Api/Endpoints/TaskEndpoints.cs
36	2	tests/TaskTracker.Tests/TaskEndpointsTests.cs
```

## Diff patch excerpt

```diff
+++ b/src/TaskTracker.Api/Domain/TaskItem.cs
-public record TaskItem(Guid Id, string Title, TaskState State, TaskPriority Priority)
+public record TaskItem(Guid Id, string Title, TaskState State, TaskPriority Priority,
+    DateTimeOffset? DeletedAt = null)
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
      "confidence": "LOW",
      "lowConfidenceNote": "Intent is ambiguous (hard-delete UX vs soft delete vs archive — approach determines whether posture is crossed) and scope is vague (whole project). LOW forces a confirmation question folded into the floor stop (no new stop) — design doc §6."
    },
    "K2": {
      "newlyFired": [
        { "trigger": "M4", "by": "scan", "surface": "process", "cite": "ledger scan rule: 2 entries matching ^## PROP-DEC- >= threshold 2" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 1, "verify": 0, "openspec": 1, "adr": 0 },
      "confidence": "HIGH"
    },
    "K3": {
      "newlyFired": [
        { "trigger": "M2", "by": "scan", "surface": "data-store", "cite": "persistence class: Domain/TaskItem.cs + Domain/TaskStore.cs in diff (not rename-shaped)" },
        { "trigger": "M1", "by": "adjudication", "surface": "data-store", "cite": "deletedAt added to the task model x posture boundary 'not in the store's public shape unless a decision says otherwise'" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "stopSatisfiedBy": "PROP-DEC-001 (ANSWERED, same surface: the soft-delete/store-shape choice was the human's own answer at K2 — demanding a second stop would duplicate an answered decision)",
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 1, "verify": 1, "openspec": 2, "adr": 2 },
      "confidence": "MEDIUM"
    }
  },
  "notes": "openspec reaches 2 at K3 (C-13: process + data-store are distinct surfaces). newStops stays 0 across ALL checkpoints — K1 folds into the floor stop, K3's materiality stop is satisfied by the answered K2 decision (stop-satisfaction rule, README micro-rule MR-3). The under-specified arc never pays a stop it didn't already pay as a decision.",
  "properties": ["P4"]
}
```
