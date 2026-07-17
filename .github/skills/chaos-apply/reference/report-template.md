# Apply Report Template

Save as (v0 change-scoped layout; legacy `.chaos/apply-reports/` read-only for compat):

```text
.chaos/changes/<change-id>/apply-report.md
```

---

# CHAOS Apply Report — <change-id>

## 1. Summary

Change ID: `<change-id>`  
Mode: `<light|standard|strict>`  
Mode source: `explicit | inferred | user-overridden`  
Result: `APPLIED | PARTIALLY_APPLIED | BLOCKED | SCOPE_DRIFT_DETECTED | NEEDS_HUMAN_DECISION | VALIDATION_FAILED | DRY_RUN_ONLY`  
Implementation specialist: `<CSharpExpert | chaos-csharp-implementation-specialist | none | other>`  
Execution confidence: `HIGH | MEDIUM | LOW`  
Validation evidence: `COMPLETE | PARTIAL | MISSING`  
Scope drift risk: `LOW | MEDIUM | HIGH`  
Assumption load: `LOW | MEDIUM | HIGH`

## 2. Source Manifest

| Source | Found | Used | Notes |
|---|---:|---:|---|
| OpenSpec proposal | yes/no | yes/no | |
| OpenSpec design | yes/no | yes/no | |
| OpenSpec specs | yes/no | yes/no | |
| OpenSpec tasks | yes/no | yes/no | |
| CHAOS review | yes/no | yes/no | |
| CHAOS rules | yes/no | yes/no | |
| ADRs / decisions | yes/no | yes/no | |
| Archaeology | yes/no | yes/no | |

## 3. Preflight Result

- Toolchain:
- OpenSpec validation availability:
- C# project detected:
- C# Expert availability:
- Direct blockers:
- Continuable gaps:

## 4. Implementation Boundary

### Allowed

- ...

### Not allowed

- ...

### Expected files/components

- ...

## 5. Apply Plan

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## 6. Task Execution Log

### Task <id> — <title>

Status: `COMPLETE | PARTIAL | BLOCKED | SKIPPED | DEFERRED`  
Specialist used: `<name>`

Files inspected:
- ...

Files changed:
- ...

Tests added/updated:
- ...

Assumptions:
- ...

Unknowns:
- ...

Decisions discovered:
- ...

## 7. Controlled Amendments

| ID | Classification | Description | User decision | Sync action |
|---|---|---|---|---|
| APP-DEC-001 | SPEC_AMENDMENT | ... | ... | AMEND_OPENSPEC_TASKS |

## 8. Decision Events

### APP-DEC-001 — <title>

Command: chaos:apply  
Change ID: `<change-id>`  
Mode: `<mode>`  
Type: `<type>`  
Status: `<status>`  
Knowledge type: `<FACT|INFERENCE|ASSUMPTION|UNKNOWN|CONFLICT>`  
Confidence: `<HIGH|MEDIUM|LOW>`  
Evidence coverage: `<COMPLETE|PARTIAL|WEAK>`  
Assumption load: `<LOW|MEDIUM|HIGH>`

Decision:

Rationale:

Evidence:

Scope impact:

Sync action:

## 9. Validation

Commands detected:
- ...

Commands run:
- ...

Commands skipped:
- ...

Skip rationale:
- ...

Results:
- ...

Confidence impact:
- ...

## 10. Scope Drift Assessment

Scope drift class: `NO_DRIFT | BOUNDED_DRIFT | SPEC_DRIFT | ARCHITECTURE_DRIFT | OUT_OF_SCOPE`  
Rationale:

## 11. Open Questions / Follow-ups

- ...

## 12. Recommended Next Command

```bash
chaos:verify <change-id>
```

## Config Context

Status: `CONFIG_OK | CONFIG_MISSING | CONFIG_PARTIAL | CONFIG_CONFLICT | CONFIG_UNSUPPORTED_VERSION`

Config path: `.chaos/config.yaml`

Configured values used:
- OpenSpec path:
- Review report path:
- Apply report path:
- Validation commands:
- C# specialist path:

Inferred defaults:
- <none or list>

Config decisions / waivers:
- <APP-DEC-* or waiver references>

Confidence impact:
- <none / cap / rationale>
