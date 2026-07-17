# CHAOS Archaeology Report — <topic>

## 1. Archaeology Dashboard

Topic: `<topic>`  
Mode: `<light|standard|strict>`  
Focus: `<areas>`  
Verdict: `<verdict>`  
Confidence: `<HIGH|MEDIUM|LOW>`  
Evidence coverage: `<COMPLETE|PARTIAL|WEAK>`  
Assumption load: `<LOW|MEDIUM|HIGH>`  
Related change: `<change-id|none>`  

## 2. Invocation and Mode

Command: `chaos:archaeology ...`  
Mode source: `<explicit|inferred>`  
Mode rationale: `<why>`  

## 3. Config Status

Config: `<CONFIG_OK|CONFIG_MISSING|CONFIG_PARTIAL|CONFIG_CONFLICT>`  
Impact: `<none|confidence cap|scope warning>`  

## 4. Archaeology Budget

Max files: `<n>`  
Max depth: `<n>`  
Focus flags: `<flags>`  
Inclusion flags: `<flags>`  
Budget changes approved by user: `<yes/no>`  

## 5. Scope Boundary

In scope:
- ...

Out of scope:
- ...

## 6. Source Manifest

| Source | Type | Included | Notes |
|---|---|---:|---|
| `<path>` | code/doc/test/config | yes/no | `<notes>` |

## 7. Existing Archaeology Reuse

Related index entries:
- ...

Reuse decision:
- ...

## 8. Relevant ADRs / Rules / Gates

- ...

## 9. Entry Points

- ...

## 10. Current Behaviour Reconstruction

Describe current behaviour with evidence references.

## 11. Data Access / Persistence

- ...

## 12. External Side Effects

- ...

## 13. Contracts / API Surface

- ...

## 14. Tests / Validation Evidence

- ...

## 15. Failure Modes

- ...

## 16. Evidence Map

| Area | Evidence found | Missing evidence | Confidence |
|---|---|---|---|
| API | ... | ... | MEDIUM |

## 17. Facts

### ARK-FACT-001 — <title>

Knowledge type: FACT  
Confidence: HIGH  
Evidence:
- ...

Finding:
...

## 18. Inferences

### ARK-INF-001 — <title>

Knowledge type: INFERENCE  
Confidence: MEDIUM  
Evidence:
- ...

Why not FACT:
...

## 19. Assumptions

### ARK-ASM-001 — <title>

Knowledge type: ASSUMPTION  
Confidence: LOW  
Validation needed:
- ...

## 20. Unknowns

- ...

## 21. Conflicts

- ...

## 22. Confidence Caps

Maximum confidence: `<HIGH|MEDIUM|LOW>`  
Reasons:
- ...

## 23. Proposal Readiness

Verdict: `<EVIDENCE_READY_FOR_PROPOSE|PARTIAL_EVIDENCE_READY_WITH_RISKS|INSUFFICIENT_EVIDENCE|CONFLICTING_EVIDENCE|NEEDS_USER_SCOPE_DECISION>`  
Confidence: `<HIGH|MEDIUM|LOW>`  
Reason:
...

## 24. Proposal Handoff

Recommended next command:

```text
chaos:propose "<intent>" --<mode>
```

Evidence to pass forward:
- ...

Suggested proposal constraints:
- ...

## 25. Follow-up Archaeology Recommendations

- ...

## 26. Index Update Decision

Index path: `.chaos/archaeology/index.md`  
Decision: `<created|updated|skipped|deferred>`  
Rationale:
...

## 27. Final Verdict

Verdict: `<verdict>`  
Confidence: `<HIGH|MEDIUM|LOW>`  
Evidence coverage: `<COMPLETE|PARTIAL|WEAK>`  
Assumption load: `<LOW|MEDIUM|HIGH>`  
Recommended next command: `<command>`
