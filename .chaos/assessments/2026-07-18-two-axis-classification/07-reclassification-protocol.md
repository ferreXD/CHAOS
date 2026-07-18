# 07 — Reclassification protocol and Decision Center presentation

Part of the CHAOS two-axis classification design · commit `6421feb` · 2026-07-18 · [Index](README.md)
Governing asymmetry: **escalation is easy and self-applying; downgrading always requires a human.**

## 7.1 Triggers

| Trigger | Detected by | Mechanism |
|---|---|---|
| Scope expansion (files/modules beyond prediction; new path classes hit) | `chaos:apply`, deterministically — diff of actual touched files (IL-TR1 manifest / touched-files hook) vs `signals.predicted-diff` | checked at **task boundaries**, not per edit (hysteresis: prevents churn) |
| New risk signal mid-work (secrets file opened, migration file created, contract diff appears) | apply's signal re-scan on new files | immediate |
| Review challenge | `chaos:review` re-runs classification and compares | review finding |
| Gate gap discovered | `chaos:verify` (a triggered gate has no evidence) | verify finding → escalation or waiver |
| User request | any time | override entry |

## 7.2 Escalation (upward: risk↑ or profile↑)

```text
detect → apply pauses at the current task boundary (finishes the in-flight write, starts nothing new)
→ reclassification applied PROVISIONALLY AND IMMEDIATELY (more safety needs no permission)
→ history entry appended {from, to, trigger, evidence}
→ gate delta computed: newly triggered gates added; already-satisfied evidence REUSED via hashes (IL-PF3) —
   only the delta needs new work; nothing restarts
→ if the new classification introduces a blocking approval (e.g. → strict adds G-GOV-APPROVAL):
   a runtime decision is created and mustStop applies (the normal decision loop)
   else: user is NOTIFIED (non-blocking event in DC), work continues under the stronger regime
```

Escalation is deliberately cheap: no restart, no re-proposal unless the *intent* changed (scope expansion that changes what is being built routes to a proposal amendment, which is a different thing than reclassification and is called out as such).

## 7.3 Downgrade (risk↓ or profile↓) — hardened against self-service

- An agent may **propose** a downgrade with evidence ("predicted 12 files, actual scope is 2; persistence signal was a false positive — file is a test fixture"); it may **never apply** one. The runtime enforces this mechanically: a history entry moving either axis down **requires a `decisionRef` whose response was written by a human** (`source: vscode-decision-center` or chat-confirmed); the classification store rejects the write otherwise.
- Downgrade decisions must carry rationale (structured, IL-DQ9) and are flagged in `chaos:status`; `chaos:doctor` has a probe: *any downgrade lacking a human decisionRef, or any strict→x downgrade lacking review sign-off, is a blocker-level finding.*
- `chaos:review` re-validates downgrades by re-running the signal scan — a downgrade contradicted by signals is a challenge finding.
- Asymmetry rationale: a wrongly-escalated change wastes ceremony; a wrongly-downgraded change ships unguarded risk. Cost asymmetry ⇒ protocol asymmetry.

## 7.4 Decision Center presentation

**Classification card** (rendered from `classification.yaml`, shown on strict confirmations, escalation notices, and on demand):

```text
┌─ Change: update-prod-connection-string ─────────────────┐
│ SYSTEM RISK: STRICT        EXECUTION PROFILE: COMPACT   │
│ confidence HIGH · classified by signals+agent           │
│                                                         │
│ Why strict: production connectivity · credential-       │
│   sensitive config · availability impact                │
│ Why compact: 1 file · no code redesign · staged         │
│   validation only                                       │
│                                                         │
│ Safeguards (5): secret-ref validation · environment     │
│   target check · connectivity verification · rollback   │
│   instructions · your approval before apply             │
│ Skipped as not applicable (with reason): archaeology ·  │
│   code review · architecture analysis · retrospective   │
│                                                         │
│ [Approve strict-compact] [Change profile…] [Escalate]   │
└─────────────────────────────────────────────────────────┘
```

Presentation rules: the **skipped list always shows *why* skipping is safe** — visible restraint is the trust mechanism that makes CHAOS read as adaptive governance rather than blind bureaucracy (and, inverted, makes the safeguards it *does* demand credible). Modifiers render as compact badges (blast HIGH · reversible · security-sensitive). Escalations appear as timeline events, not modal interruptions, unless an approval gate arrived.

**When the user is actually asked** (complete list — anything else is display-only): strict classification confirmation (folded into the existing strict confirm — one stop) · LOW confidence or materially-different plausible profiles (choice) · downgrade approval (always) · gate waiver (existing waiver flow) · escalation only when it introduces an approval gate. Everything else — including every light/standard-micro/compact classification — is an inline line plus an override affordance, never a stop (IL-DQ2 applied to classification itself).

## 7.5 Evidence continuity across reclassification

All completed evidence keeps its validity through its content hashes (IL-PF3): reclassification recomputes the **gate delta** and the **verification depth delta** only. Verify's report then shows three sets: evidence carried forward (hash-valid), evidence added by escalation, gates newly n/a after downgrade (each with reason). Nothing is re-derived that hasn't changed — the reclassification protocol and the token program share machinery deliberately.
