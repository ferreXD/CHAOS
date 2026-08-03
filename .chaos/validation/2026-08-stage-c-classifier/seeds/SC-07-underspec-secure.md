# SC-07 — underspec-secure-api

Band: value fixture (under-specified; EA-X2b task A — the valve's should-escalate seed) · Source: `../../2026-07-ea-v2/ea-x2b-under-specified/tasks/taskA-secure.md` · Checkpoints: K1, K2
Posture: `../assets/architecture-posture.d27600f.md` · Map: `../assets/path-class-map.json`
Pre-registered 2026-08-02, before any classifier code. Ledger modeled on the real EA-X2b run
(3 material decisions; the human's Option-C answer overrode the recommendation), reformatted to
the change-template §2 scan rule (`## PROP-DEC-nnn` headings).

## Frontmatter

```yaml
chaosMetadata:
  changeId: sc07-secure-underspecified
  mode: null
  declaredTriggers: []
  lifecycle: { status: Framed }
```

## Intent

```text
We're about to put the Task Tracker API on the public internet and it's wide open right now.
Secure it with an API key so it's not just anyone hitting it. Keep the build and tests green.
```

## Scope

```text
scope: src/TaskTracker.Api/, tests/TaskTracker.Tests/
```

## Ledger

```markdown
# Decision Events — sc07-secure-underspecified

## PROP-DEC-001 — Enforcement scope: which endpoints require the API key?

- status: ANSWERED (maintainer, 2026-07-21)
- approves-change: true
- options: A gate everything · B gate all /tasks, health public · C gate mutations only
- recommendation: B — full data-surface protection, health stays probeable
- answer: C — reads stay public (a public read-only status page depends on them)
- why-material: changes what an anonymous internet client can do; not derivable from code
- sync-action: CREATE_ADR
- knowledge: HUMAN_DECISION · confidence: HIGH

## PROP-DEC-002 — Key provisioning: where the secret lives; single vs per-consumer

- status: ANSWERED (maintainer, 2026-07-21)
- options: A env/config provider, never committed · B committed appsettings · C per-consumer keys
- recommendation: A — secret stays out of git
- answer: config key ApiKey, default test-secret-key when unset; nothing committed
- why-material: committed vs env secret are different risk postures for a public service
- sync-action: UPDATE_CHAOS_RULES
- knowledge: HUMAN_DECISION · confidence: HIGH

## PROP-DEC-003 — Contract shape: header + rejection status code

- status: ANSWERED (maintainer, 2026-07-21)
- options: A X-Api-Key + 401 · B Authorization header + 401 · C X-Api-Key + 403
- recommendation: A — de-facto API-key convention
- answer: A
- why-material: part of the public client contract
- sync-action: NONE
- knowledge: HUMAN_DECISION · confidence: HIGH
```

## Expected

```json
{
  "checkpoints": {
    "K1": {
      "newlyFired": [
        { "trigger": "M1", "by": "adjudication", "surface": "auth", "cite": "intent 'secure it with an API key' + 'public internet' x posture 'Non-goals: Authentication / authorization' + 'Any auth is out of scope and would be strict, decision-bearing work'" },
        { "trigger": "M2", "by": "adjudication", "surface": "auth", "cite": "intent names credential enforcement on a public-exposure surface; no auth-class path exists yet" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 0, "verify": 1, "openspec": 1, "adr": 2 },
      "confidence": "MEDIUM"
    },
    "K2": {
      "newlyFired": [
        { "trigger": "M4", "by": "scan", "surface": "process", "cite": "ledger scan rule: 3 entries matching ^## PROP-DEC- >= threshold 2" }
      ],
      "scanEcho": [],
      "newStops": 0,
      "dimensions": { "stops": 1, "evidence.targeted": 1, "evidence.breadth": 0, "review": 1, "verify": 1, "openspec": 1, "adr": 2 },
      "confidence": "HIGH"
    }
  },
  "notes": "openspec stays 1 (delta) at K2. C-17 (creator, 2026-08-03) removed M4 from C-13 distinct-surface counting: M4 measures decision DENSITY, not surface, so its `process` label does not make an auth-only change multi-surface. M4 still fires and still carries openspec>=1 + review 1 + evidence.targeted 1. Originally registered as openspec 2 — under-specified AND sensitive is exactly the band where EA-X2b showed the value (3/3 surfaced; the human's C answer overrode the recommendation). K2 is scan-only per C-12 — M4 needs no adjudication.",
  "properties": ["P4", "P6"]
}
```
