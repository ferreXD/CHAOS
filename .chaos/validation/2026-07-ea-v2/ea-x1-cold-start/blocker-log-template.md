---
chaosMetadata:
  schemaVersion: 1
  artifactType: unknown
  artifactScope: unknown
  changeId: null
  sourceCommand: "chaos:sync"
  lastWrittenAt: "2026-07-19T15:02:40+02:00"
  lastWrittenBy: Pablo Ferreira
  lastAuditedAt: "2026-07-19T15:02:40+02:00"
  lastAuditedBy: Pablo Ferreira
  repositoryContext:
    provider: github
    branch: "{'name': 'main', 'isDefaultBranch': True, 'upstream': 'origin/main', 'mergeBase': '8b751b7880b42286a882f2ecfd68428e72bb55f7', 'confidence': 'MEDIUM'}"
    reviewRequest: "{'providerType': 'unknown', 'id': '', 'url': '', 'title': '', 'author': '', 'sourceBranch': '', 'targetBranch': '', 'status': 'unknown', 'confidence': 'LOW'}"
    contextSource: session-context
    confidence: HIGH
  metadata:
    identitySource: git-config
    timestampSource: local-system
    confidence: MEDIUM
    bodyHash: "sha256:7e2cce257799b93eebdfaa63ca6dd36f4f7ac49a5702c719f9ed9245d0d16020"
---

# EA-X1 — Blocker log (one entry per blocker, per participant)

> Copy this file per participant (`blocker-log-P1.md`, …). One `###` entry per blocker.
> A **blocker** is anything that stopped or meaningfully slowed the participant: an error, a
> hang, a doc ambiguity, a missing prereq, a WARN they couldn't interpret, or a silent no-op
> they only discovered later. Record it even if they eventually recovered — recovery time is
> data. Be factual; quote what they said and did.

**Participant:** `P?`  ·  **OS / Node / dotnet:** `…`  ·  **Facilitator:** `…`  ·  **Date:** `…`

---

### B1 — <short title>

| Field | Value |
|---|---|
| **Step** | e.g. `install:openspec-init` / `doctor` / `demo:propose` (match a `timing-sheet.csv` step) |
| **Symptom (what they saw)** | The literal error / hang / confusion. Quote the message. |
| **What they tried** | In order. Include dead ends. |
| **Consulted docs?** | Which doc/section, and did it help? (Doc ambiguity is itself a finding.) |
| **Silent failure?** | y/n — did something report success (exit 0 / no error) but not do what the docs promised? Or a swallowed non-zero exit? Or a hang with no guidance? |
| **Recovered?** | y/n — and how (self / gave up / hard cap reached). |
| **Time lost** | minutes (start→resolved or start→abandoned). |
| **Maps to probe finding?** | e.g. F1 (py -3 hook), F2 (openspec init side-effects), or "new". |
| **Severity (facilitator)** | blocker / major / minor. |
| **Verbatim quote** | Their own words at the moment of friction — the most valuable field. |

---

### B2 — <short title>

| Field | Value |
|---|---|
| **Step** | |
| **Symptom (what they saw)** | |
| **What they tried** | |
| **Consulted docs?** | |
| **Silent failure?** | y/n |
| **Recovered?** | y/n |
| **Time lost** | |
| **Maps to probe finding?** | |
| **Severity (facilitator)** | |
| **Verbatim quote** | |

---

## Session summary (fill after the run)

- **Reached first value?** T0 / T1 / T2 / none (see `recruitment-protocol.md`).
- **Time-to-first-value (to T1):** `__ min` — Observed, facilitator-recorded. (`n/a` if abandoned.)
- **Abandonment point (if any):** step + the single blocker that caused it.
- **Silent failures they hit unaided:** count, and which they *never noticed*.
- **Did `chaos:doctor` help?** Did they run it, read the WARNs, act on them?
- **Top 3 friction points, ranked.**
