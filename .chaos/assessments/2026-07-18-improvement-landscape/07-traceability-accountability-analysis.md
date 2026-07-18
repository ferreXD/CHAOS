# 07 — Traceability & accountability analysis

Part of the CHAOS improvement-landscape assessment · commit `6421feb` · 2026-07-18 · [Index](README.md)
Topic inventory: [02 §TR](02-topics-workflow-decisions-traceability.md). This file assesses answerability question-by-question and tiers the mechanisms.

## 7.1 The fourteen questions — answerable today vs proposed

| Question | Today (Observed) | Proposed mechanism | Tier |
|---|---|---|---|
| Who proposed this? | Partial — session + artifact metadata stamp (identity is self-declared) | IL-TR2 provider-identity in sessions/stamps | Essential |
| Who approved it? | **Yes** — `response.json` `selectedBy` + audit chain; identity weak | IL-TR2; team-grade identity deferred | Essential |
| What evidence existed? | Partial — reports exist, citations are prose | IL-TR9 stable evidence IDs (`ARCH-*`), per-option `evidenceRefs` | Essential |
| What alternatives were considered? | **Yes** — decision options with consequences | IL-DQ9 adds `rejectedBecause` | Essential |
| Why was this option selected? | **Yes** — free-text rationale (quality varies) | IL-DQ9 structured rationale | Essential |
| Which command implemented it? | **Yes** — sessions + apply-report | — (works) | Essential |
| Which files changed because of it? | **No** — touched-files hook writes a stream nobody links | **IL-TR1 per-task manifest** (decisionRefs → filesTouched) | Essential |
| Which tests/checks validated it? | Partial — verify narrative | IL-TR1 validation records (command, exit, testRefs) | Essential |
| Which risks were accepted? | Partial — waivers.md prose | IL-TR4 waiver lifecycle (IDs, owner, expiry, status) | Essential |
| Did the outcome match the prediction? | **No** | IL-TR5/IL-DQ6 outcome records | Useful-optional → differentiator |
| Was the decision later revised? | **No** in practice — `superseded` state exists, unused | supersededBy links + sync discipline | Useful-optional |
| Which agent/model/provider contributed? | **No** | IL-TR2 model/adapter fields | Essential (cheap) |
| Deterministic vs model-reasoned parts? | **No** | IL-TR3 section source labels | Useful-optional |
| Which artifacts are authoritative? | Convention only | IL-TR6 authoritative-artifact map + freshness probe | Essential |

Eight of fourteen are fully or partially unanswerable today; all eight close with five mechanisms (TR1, TR2, TR4, TR6, TR9) — none of which requires new ceremony from the human, because all are captured at points where the machinery is already acting (Recommendation, Confidence: HIGH).

## 7.2 Tiering — and what *not* to record

- **Essential traceability** (default-on, alpha→beta): the table's essential rows. Capture is deterministic or incidental; artifact volume grows by one manifest per change plus fields on existing records — bounded.
- **Useful optional** (default-on at strict, opt-in below): outcome records, revision links, section source labels, confidence history (IL-TR7).
- **Enterprise/compliance** (v1, pull-driven): DSSE-style attestation/signing, hash-chained audit logs, retention policies, provider-verified identity. Design the ledger format (IL-EX6) so these bolt on without schema breaks; do not build now.
- **Unnecessary telemetry** (reject): usage analytics, timing beacons, remote reporting of any kind, per-keystroke/‑tool-call event capture beyond the existing local touched-files stream. CHAOS's trust posture is *local-first*; telemetry would spend it for little insight the experiments can't get consensually.

## 7.3 Noise control (the audit-noise anti-goal)

Rules to keep the trail readable (Recommendation): one manifest per task, not per file-write; decision events only for material or explicitly-logged choices (IL-DQ2); outcome records only for material decisions; waivers only for standard/strict blockers; summaries-first templates (IL-PF9) so every ledger artifact leads with 5 lines a human will actually read; the evidence index (IL-PF3) is the machine's entry point so humans are never the ones grepping raw JSON.

## 7.4 Provenance completeness statement (target)

After TR1/TR2/TR4/TR6/TR9 land, a reviewer with only the repo can reconstruct: *intent → evidence (with confidence) → options → decision (who/why/when, model that proposed) → implementation (tasks → files → validations) → verification verdict → accepted risks (with expiry) → closure — and, at strict, whether predictions held.* That statement, verified against the showcase change, is the definition of done for this area — and the sentence CHAOS's README should be able to print truthfully (ties IL-PA7).
