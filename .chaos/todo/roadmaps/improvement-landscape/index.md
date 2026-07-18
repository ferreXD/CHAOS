---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-index
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-18T13:00:01+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-18T13:00:01+02:00"
  lastAuditedBy: vscode-user
  repositoryContext:
    provider: github
    branch: main
    reviewRequest: null
    contextSource: git
    confidence: LOW
  metadata:
    identitySource: provider
    timestampSource: local-system
    confidence: LOW
---

# CHAOS Improvement-Landscape Roadmap — Todo Index

> Roadmap-scoped todo index derived from the 2026-07-18 improvement-landscape assessment's
> **Top-20 ranked opportunities**
> ([11-final-prioritization.md §11.2](../../../assessments/2026-07-18-improvement-landscape/11-final-prioritization.md)),
> placed into horizons via §11.3 / §11.5. Item detail lives under `items/`. The generated
> dashboard is at `.chaos/todo/views/roadmaps/improvement-landscape/index.html` — regenerate
> with the command in the provenance notes below.
>
> These items mirror the assessment's ranking for planning and are **not** part of the durable
> main backlog (`.chaos/todo/items/`). 20 items (20 open, 0 done),
> one per ranked opportunity. Many rows carry over EA-* items already materialized in the
> sibling [public-alpha roadmap view](../public-alpha/index.md); see Deduplication.

| Rank | Todo ID | Opportunity | Priority | Target | Type | Item file |
|---|---|---|---|---|---|---|
| 1 | TODO-2026-07-18-r01-ea-v1-il-dx5-showcase-trail | EA-V1 (IL-DX5) — Showcase trail (decided) | BLOCKER | h-alpha | validation | `items/2026-07-18-r01-ea-v1-il-dx5-showcase-trail.md` |
| 2 | TODO-2026-07-18-r02-il-dq2-materiality-doctrine | IL-DQ2 — Materiality doctrine + stop budgets | BLOCKER | h-alpha | governance | `items/2026-07-18-r02-il-dq2-materiality-doctrine.md` |
| 3 | TODO-2026-07-18-r03-il-wf1-ea-b1-risk-execution-profile | IL-WF1 (EA-B1) — risk × execution-profile model | BLOCKER | h-beta | architecture | `items/2026-07-18-r03-il-wf1-ea-b1-risk-execution-profile.md` |
| 4 | TODO-2026-07-18-r04-ea-s1-s4-stabilization-bundle | EA-S1–S4 — Stabilization bundle | BLOCKER | h-alpha | sanitization | `items/2026-07-18-r04-ea-s1-s4-stabilization-bundle.md` |
| 5 | TODO-2026-07-18-r05-il-pf10-token-accounting-ci | IL-PF10 — Token accounting in CI + budgets | BLOCKER | h-alpha | ci | `items/2026-07-18-r05-il-pf10-token-accounting-ci.md` |
| 6 | TODO-2026-07-18-r06-il-tr1-provenance-chain | IL-TR1 — Decision→files→tests provenance chain | HIGH | h-beta | traceability | `items/2026-07-18-r06-il-tr1-provenance-chain.md` |
| 7 | TODO-2026-07-18-r07-il-rt1-rt2-ea-i08-lockfile-mcp-hardening | IL-RT1+RT2 (EA-I08) — Lockfile + MCP boundary hardening | HIGH | h-beta | runtime | `items/2026-07-18-r07-il-rt1-rt2-ea-i08-lockfile-mcp-hardening.md` |
| 8 | TODO-2026-07-18-r08-il-pf2-pf9-lazy-refs-report-budgets | IL-PF2+PF9 — Lazy references + report budgets | HIGH | h-beta | performance | `items/2026-07-18-r08-il-pf2-pf9-lazy-refs-report-budgets.md` |
| 9 | TODO-2026-07-18-r09-il-pf3-pf4-evidence-index-validators | IL-PF3+PF4 — Evidence index + deterministic validators | HIGH | h-beta | performance | `items/2026-07-18-r09-il-pf3-pf4-evidence-index-validators.md` |
| 10 | TODO-2026-07-18-r10-il-dx4-ea-b5-decision-center-v2 | IL-DX4 (EA-B5) — Decision Center v2 | HIGH | h-beta | ui | `items/2026-07-18-r10-il-dx4-ea-b5-decision-center-v2.md` |
| 11 | TODO-2026-07-18-r11-il-ag1-ea-b6-greenfield-foundation-mvp | IL-AG1 (EA-B6) — Greenfield Foundation Discovery MVP | MEDIUM | h-beta | architecture | `items/2026-07-18-r11-il-ag1-ea-b6-greenfield-foundation-mvp.md` |
| 12 | TODO-2026-07-18-r12-il-dq1-dq10-ea-b7-decision-schema-v2 | IL-DQ1+DQ10 (EA-B7) — Decision schema v2 + expiry policy | MEDIUM | h-beta | runtime | `items/2026-07-18-r12-il-dq1-dq10-ea-b7-decision-schema-v2.md` |
| 13 | TODO-2026-07-18-r13-il-rt3-ea-i09-capsule-integrity | IL-RT3 (EA-I09) — Capsule integrity + quality gate | MEDIUM | h-beta | runtime | `items/2026-07-18-r13-il-rt3-ea-i09-capsule-integrity.md` |
| 14 | TODO-2026-07-18-r14-il-dx1-ea-b4-plugin-install | IL-DX1 (EA-B4) — One-command plugin install | MEDIUM | h-beta | packaging | `items/2026-07-18-r14-il-dx1-ea-b4-plugin-install.md` |
| 15 | TODO-2026-07-18-r15-il-pf1-ex1-ea-b3-contract-single-sourcing | IL-PF1→IL-EX1 (EA-B3) — Contract single-sourcing → generated adapters | MEDIUM | h-beta | architecture | `items/2026-07-18-r15-il-pf1-ex1-ea-b3-contract-single-sourcing.md` |
| 16 | TODO-2026-07-18-r16-il-ag4-wf9-rules-gates-as-data | IL-AG4 (+IL-WF9) — Rules/gates as structured data | LOW | h-longterm | architecture | `items/2026-07-18-r16-il-ag4-wf9-rules-gates-as-data.md` |
| 17 | TODO-2026-07-18-r17-il-wf5-governed-break-glass | IL-WF5 — Governed break-glass path | LOW | h-beta | workflow | `items/2026-07-18-r17-il-wf5-governed-break-glass.md` |
| 18 | TODO-2026-07-18-r18-il-dq6-tr5-outcome-tracking-calibration | IL-DQ6/IL-TR5 — Decision outcome tracking + calibration | LOW | h-longterm | governance | `items/2026-07-18-r18-il-dq6-tr5-outcome-tracking-calibration.md` |
| 19 | TODO-2026-07-18-r19-il-ex2-ea-a1-ex6-runtime-extraction-ledger-format | IL-EX2 (EA-A1) + IL-EX6 — Standalone runtime extraction + published ledger format | LOW | h-longterm | research | `items/2026-07-18-r19-il-ex2-ea-a1-ex6-runtime-extraction-ledger-format.md` |
| 20 | TODO-2026-07-18-r20-il-ag5-ea-a5-observed-posture-mirror | IL-AG5 (EA-A5) — Brownfield observed-posture mirror | LOW | h-longterm | architecture | `items/2026-07-18-r20-il-ag5-ea-a5-observed-posture-mirror.md` |

## Decision provenance (Context Notes)

- Generated 2026-07-18 on direct maintainer instruction (chat session): a roadmap-scoped todo
  view of the improvement-landscape assessment's Top-20 ranked opportunities. View-only import —
  no runtime command run or decisions were involved. The README suggests the governed path is
  `chaos:todo --from-audit` importing §11.3 horizon lists with IL-*/EA-* provenance; do that
  (with maintainer confirmation) to promote any of these into the durable main backlog.
- Priority encodes the §11.2 **rank tier** (impact × confidence-in-impact ÷ cost), not a separate
  P0/P1/P2 field: ranks 1–5 → BLOCKER, 6–10 → HIGH, 11–15 → MEDIUM, 16–20 → LOW. Within a
  horizon+priority group, items stay in rank order (the item id and createdAt both increase with
  rank). This deliberately differs from the public-alpha roadmap view, whose priorities encode the
  roadmap's own P0/P1/P2.
- Targets encode the §11.3 horizons (sorted via `target-meta.json`): h-alpha (immediate
  public-alpha) · h-beta (beta-level foundation & hardening) · h-longterm (longer-term
  differentiators, incl. Horizon 3/4/research).
- Each row keeps its ranked-row identity (one item per §11.2 row), so bundled rows (e.g.
  EA-S1–S4, IL-PF2+PF9, IL-RT1+RT2) are single items here; their sub-IDs are listed in
  `sourceIds` and expanded in the item body.
- Regenerate the dashboard:
  `node tools/chaos-todo-views/generate.mjs --items .chaos/todo/roadmaps/improvement-landscape/items --index .chaos/todo/roadmaps/improvement-landscape/index.md --out .chaos/todo/views/roadmaps/improvement-landscape/index.html --items-href "../../../roadmaps/improvement-landscape/items/" --source-of-truth ".chaos/todo/roadmaps/improvement-landscape/items/" --title "CHAOS Improvement-Landscape Roadmap" --subtitle "Top-20 ranked · 2026-07-18 assessment" --target-meta .chaos/todo/roadmaps/improvement-landscape/target-meta.json --source-command "chaos:todo --from-audit (improvement-landscape Top-20 ranked view)"`

## Deduplication

Per §11.1, 19 IL topics carry over EA-* items ranked once under the EA ID. In this view each
ranked row keeps its identity, but the following rows are the **same work** as items already in the
sibling [public-alpha roadmap view](../public-alpha/index.md) — deliver once and cross-close:

- #1 EA-V1 ≡ public-alpha `ea-v1-showcase-trail`
- #2 IL-DQ2 ≡ public-alpha addendum `il-dq2-materiality-doctrine-stop-budgets`
- #3 EA-B1 ≡ public-alpha `ea-b1-risk-execution-profile-model` (also absorbs #17 IL-WF5)
- #4 EA-S1–S4 ≡ public-alpha `ea-s1..s4-*` (four items)
- #5 IL-PF10 ≡ public-alpha addendum `il-pf10-token-accounting-ci`
- #6 IL-TR1 → public-alpha `ea-b8-provenance-chain-waiver-lifecycle` (base chain)
- #7 EA-I08 / #13 EA-I09 → public-alpha `ea-v3-runtime-hardening-pass` (bundle)
- #8 IL-PF9 half ≡ public-alpha addendum `il-pf9-report-budgets-summary-first`
- #10 EA-B5 ≡ public-alpha `ea-b5-decision-center-v2`
- #11 EA-B6 ≡ public-alpha `ea-b6-greenfield-foundation-mvp`
- #12 EA-B7 ≡ public-alpha `ea-b7-decision-schema-v2`
- #14 EA-B4 ≡ public-alpha `ea-b4-claude-code-plugin-packaging`
- #15 EA-B3 ≡ public-alpha `ea-b3-contract-single-sourcing`
- #16 EA-A6 ≡ public-alpha `ea-a6-rules-gates-structured-data` (rules half)
- #19 EA-A1 + EA-A7 ≡ public-alpha `ea-a1-runtime-extraction-spike` + `ea-a7-ledger-format-v1-publication`

Net-new relative to the public-alpha view: #9 (IL-PF3+PF4), #18 (IL-DQ6/TR5), #20 (IL-AG5 / EA-A5).

## Todo Candidates (not imported)

> Sub-components folded into ranked rows above (not standalone here): IL-WF3 (merges, in #3) ·
> IL-AG2 (foundation-aware commands, in #11) · IL-RT5 (migration framework, in #7/#12) ·
> IL-RT9 (abuse suite, in #4/#7) · IL-TR2/TR4/TR6/TR9 (traceability mechanisms, in #6) ·
> IL-DQ8 (dependent decisions, in #11/#12) · IL-PA7 (positioning refresh, paired with #8/PF9).
>
> Explicitly **not pursued** (§11.4): new provider adapters before generation exists · `chaos:gate`
> and any new lifecycle command except the `chaos:run` prototype · `chaos:foundation` as a command ·
> spec-engine plugin interface now (IL-EX4) · project-local skill extensions now (IL-EX7) ·
> role-aware approval/escalation, shared DC, telemetry, enterprise attestation now · architecture
> marketplace / >3 presets / technology-specific templates · IL-RT6 write-ahead journal until
> IL-RT9 shows real incidence · any absolute token-savings claim before IL-PF10 measures.
