# SC-09 — underspec-concurrent

Band: value fixture (under-specified; EA-X2b task C) · Source: `../../2026-07-ea-v2/ea-x2b-under-specified/tasks/taskC-concurrent.md` · Checkpoints: K1, K2
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Pre-registered 2026-08-02, before any classifier code.

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc09-concurrent-underspecified
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
Incident: two people had the same task open, both hit save, one person's changes silently
overwrote the other's. Change how task updates work so this class of "silently lost edit" can't
happen again. Keep the build and tests green.
```

## Scope

```text
scope: src/TaskTracker.Api/, tests/TaskTracker.Tests/
```

## Ledger

```markdown
# Decision Events — sc09-concurrent-underspecified

## PROP-DEC-001 — Conflict strategy: optimistic versioning, pessimistic locking, or last-write-wins with audit?

- status: ANSWERED (maintainer, 2026-08-02)
- approves-change: true
- options: A optimistic version + 409 · B lock-on-open with lease · C keep LWW, add change audit
- recommendation: A — stateless, fits the in-memory single-instance posture
- answer: A
- why-material: determines the public update contract and whether the store gains lock state
- sync-action: CREATE_ADR
- knowledge: HUMAN_DECISION · confidence: HIGH

## PROP-DEC-002 — Backward compatibility: must existing clients (no version field) keep working?

- status: ANSWERED (maintainer, 2026-08-02)
- options: A yes — version optional, omitted = unconditional · B no — version required, 400 without it
- recommendation: A — protects existing integrations during rollout
- answer: A
- why-material: choosing B breaks every current PUT caller — an observable contract break
- sync-action: NONE
- knowledge: HUMAN_DECISION · confidence: HIGH
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
      "lowConfidenceNote": "The approach (locking vs versioning vs audit) is undecided and determines whether store shape / update semantics cross posture; scope is vague. LOW folds a confirmation into the floor stop."
    },
    "K2": {
      "newlyFired": [
        { "trigger": "M4", "by": "scan", "surface": "process", "cite": "ledger scan rule: 2 entries matching ^## PROP-DEC- >= threshold 2" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 1, "verify": 0, "openspec": 1, "adr": 0 },
      "confidence": "HIGH"
    }
  },
  "notes": "K1 must NOT fire M1 — the crossing is approach-dependent and unconfirmable from intent alone; the LOW-confidence fold is the correct behaviour (the EA-X2b product WAS the K2 decisions). A K3 exercising the chosen approach would mirror SC-03's K3; omitted to keep this seed focused on the LOW->M4 arc.",
  "properties": ["P4"]
}
```
