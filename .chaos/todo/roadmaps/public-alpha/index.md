---
chaosMetadata:
  schemaVersion: 1
  artifactType: todo-index
  artifactScope: repository
  changeId: null
  sourceCommand: chaos:todo
  lastWrittenAt: "2026-07-19T00:13:59+02:00"
  lastWrittenBy: vscode-user
  lastAuditedAt: "2026-07-19T00:13:59+02:00"
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

# CHAOS Public-Alpha Roadmap — Todo Index

> Roadmap-scoped todo index derived from the 2026-07-18 public-alpha external assessment
> ([14-roadmap.md](../../../assessments/2026-07-18-public-alpha-assessment/14-roadmap.md),
> including its same-day improvement-landscape addendum). Item detail lives under
> `items/`. The generated dashboard is at
> `.chaos/todo/views/roadmaps/public-alpha/index.html` — regenerate with the command in
> the provenance notes below.
>
> These items mirror the assessment roadmap for planning and are **not** part of the durable
> main backlog (`.chaos/todo/items/`). 28 items (25 open, 3 done) across
> Horizons 0–4, the Horizon 0–1 (alpha) addendum, and the research track.

| Todo ID | Title | Status | Priority | Target | Type | Owner | Item file |
|---|---|---|---|---|---|---|---|
| TODO-2026-07-18-ea-s1-sanitize-for-real | EA-S1 — Sanitize public surface for real | done | BLOCKER | h0-stabilization | sanitization | TBD | `items/2026-07-18-ea-s1-sanitize-for-real.md` |
| TODO-2026-07-18-ea-s2-first-run-integrity | EA-S2 — First-run integrity on a fresh clone | done | BLOCKER | h0-stabilization | implementation | TBD | `items/2026-07-18-ea-s2-first-run-integrity.md` |
| TODO-2026-07-18-ea-s3-real-ci | EA-S3 — Real CI that runs the tests | done | BLOCKER | h0-stabilization | ci | TBD | `items/2026-07-18-ea-s3-real-ci.md` |
| TODO-2026-07-18-ea-s4-security-md-demo-reframing | EA-S4 — SECURITY.md + honest demo reframing | open | BLOCKER | h0-stabilization | documentation | TBD | `items/2026-07-18-ea-s4-security-md-demo-reframing.md` |
| TODO-2026-07-18-ea-v1-showcase-trail | EA-V1 — Publish the showcase trail (one real strict-mode lifecycle) | open | BLOCKER | h1-validation | validation | TBD | `items/2026-07-18-ea-v1-showcase-trail.md` |
| TODO-2026-07-18-ea-v2-run-experiments-x1-x2-x4 | EA-V2 — Run validation experiments EA-X1 / EA-X2 / EA-X4 | open | BLOCKER | h1-validation | validation | TBD | `items/2026-07-18-ea-v2-run-experiments-x1-x2-x4.md` |
| TODO-2026-07-18-ea-v3-runtime-hardening-pass | EA-V3 — Runtime hardening pass | open | HIGH | h1-validation | runtime | TBD | `items/2026-07-18-ea-v3-runtime-hardening-pass.md` |
| TODO-2026-07-18-il-dq2-materiality-doctrine-stop-budgets | IL-DQ2 — Materiality doctrine + stop budgets (prompt-only) | open | MEDIUM | h1b-addendum | governance | TBD | `items/2026-07-18-il-dq2-materiality-doctrine-stop-budgets.md` |
| TODO-2026-07-18-il-pf10-token-accounting-ci | IL-PF10 — Token accounting in CI + per-command budgets | open | MEDIUM | h1b-addendum | ci | TBD | `items/2026-07-18-il-pf10-token-accounting-ci.md` |
| TODO-2026-07-18-il-pf9-report-budgets-summary-first | IL-PF9 — Report budgets / summary-first reports | open | MEDIUM | h1b-addendum | performance | TBD | `items/2026-07-18-il-pf9-report-budgets-summary-first.md` |
| TODO-2026-07-18-il-wf9-retire-chaos-gate-concept | IL-WF9 — Retire the chaos:gate concept | open | MEDIUM | h1b-addendum | cleanup | TBD | `items/2026-07-18-il-wf9-retire-chaos-gate-concept.md` |
| TODO-2026-07-18-il-rt9-abuse-suite-skeleton-ci | IL-RT9 — Abuse-suite skeleton in CI | open | MEDIUM | h1b-addendum | ci | TBD | `items/2026-07-18-il-rt9-abuse-suite-skeleton-ci.md` |
| TODO-2026-07-18-ea-b1-risk-execution-profile-model | EA-B1 — Risk × execution-profile model + command merges | open | BLOCKER | h2-beta-foundation | architecture | TBD | `items/2026-07-18-ea-b1-risk-execution-profile-model.md` |
| TODO-2026-07-18-ea-b2-token-program | EA-B2 — Token program: lazy refs, evidence index, deterministic validators | open | HIGH | h2-beta-foundation | performance | TBD | `items/2026-07-18-ea-b2-token-program.md` |
| TODO-2026-07-18-ea-b3-contract-single-sourcing | EA-B3 — Contract single-sourcing + generated Copilot surface + content-aware parity | open | HIGH | h2-beta-foundation | architecture | TBD | `items/2026-07-18-ea-b3-contract-single-sourcing.md` |
| TODO-2026-07-18-ea-b4-claude-code-plugin-packaging | EA-B4 — Claude Code plugin packaging | open | HIGH | h2-beta-foundation | packaging | TBD | `items/2026-07-18-ea-b4-claude-code-plugin-packaging.md` |
| TODO-2026-07-18-ea-b5-decision-center-v2 | EA-B5 — Decision Center v2 (history, batch queue, rendering, one-click resume, wait-state) | open | MEDIUM | h2-beta-foundation | ui | TBD | `items/2026-07-18-ea-b5-decision-center-v2.md` |
| TODO-2026-07-18-ea-b6-greenfield-foundation-mvp | EA-B6 — Greenfield Foundation Discovery MVP | open | MEDIUM | h2-beta-foundation | architecture | TBD | `items/2026-07-18-ea-b6-greenfield-foundation-mvp.md` |
| TODO-2026-07-18-ea-b7-decision-schema-v2 | EA-B7 — Decision schema v2 + dependent decisions + expiry | open | MEDIUM | h2-beta-foundation | runtime | TBD | `items/2026-07-18-ea-b7-decision-schema-v2.md` |
| TODO-2026-07-18-ea-b8-provenance-chain-waiver-lifecycle | EA-B8 — Provenance chain + waiver lifecycle | open | MEDIUM | h2-beta-foundation | governance | TBD | `items/2026-07-18-ea-b8-provenance-chain-waiver-lifecycle.md` |
| TODO-2026-07-18-ea-a1-runtime-extraction-spike | EA-A1 — Standalone runtime extraction spike + ledger/capsule format spec | open | MEDIUM | h3-beta-adoption | research | TBD | `items/2026-07-18-ea-a1-runtime-extraction-spike.md` |
| TODO-2026-07-18-ea-a2-pr-ledger-rendering | EA-A2 — PR ledger rendering (decision-events.md → PR body) | open | LOW | h3-beta-adoption | implementation | TBD | `items/2026-07-18-ea-a2-pr-ledger-rendering.md` |
| TODO-2026-07-18-ea-a3-openspec-compat-pinning | EA-A3 — OpenSpec compatibility pinning + spec-engine seam | open | MEDIUM | h3-beta-adoption | architecture | TBD | `items/2026-07-18-ea-a3-openspec-compat-pinning.md` |
| TODO-2026-07-18-ea-a4-external-reference-users | EA-A4 — Three external reference users/repos with committed trails | open | MEDIUM | h3-beta-adoption | adoption | TBD | `items/2026-07-18-ea-a4-external-reference-users.md` |
| TODO-2026-07-18-ea-a6-rules-gates-structured-data | EA-A6 — Rules/gates as structured data | open | MEDIUM | h3-beta-adoption | architecture | TBD | `items/2026-07-18-ea-a6-rules-gates-structured-data.md` |
| TODO-2026-07-18-ea-a7-ledger-format-v1-publication | EA-A7 — Ledger format v1 publication | open | MEDIUM | h3-beta-adoption | documentation | TBD | `items/2026-07-18-ea-a7-ledger-format-v1-publication.md` |
| TODO-2026-07-18-h4-v1-productization-bundle | H4 — v1 productization bundle (deferred until beta evidence) | open | LOW | h4-v1-productization | productization | TBD | `items/2026-07-18-h4-v1-productization-bundle.md` |
| TODO-2026-07-18-research-track-bundle | Research track — compact resume, archaeology snapshots, model routing, chaos:run, cross-worktree locks | open | LOW | research-track | research | TBD | `items/2026-07-18-research-track-bundle.md` |

## Decision provenance (Context Notes)

- Generated 2026-07-18 on direct maintainer instruction (chat session): a roadmap-scoped todo
  view of the public-alpha assessment roadmap, including the same-day improvement-landscape
  addendum (EA-B6/B7/B8, EA-A6/A7, IL-DQ2/PF10/PF9/WF9/RT9). View-only import — no runtime
  command run or decisions were involved; importing any item durably into the main backlog
  should go through a governed `chaos:todo --from-roadmap` run with maintainer confirmation.
- Priority mapping — roadmap P0 → BLOCKER, P1 → HIGH, P2 → MEDIUM; addendum and unprioritized
  Horizon 3 items default to MEDIUM (the roadmap assigns them no per-item priority); deferred
  bundles (Horizon 4, research track) are LOW.
- Targets encode roadmap horizons (sorted in horizon order via `target-meta.json`):
  h0-stabilization · h1-validation · h1b-addendum (Horizon 0–1 alpha addendum) ·
  h2-beta-foundation · h3-beta-adoption · h4-v1-productization · research-track.
- Regenerate the dashboard:
  `node tools/chaos-todo-views/generate.mjs --items .chaos/todo/roadmaps/public-alpha/items --index .chaos/todo/roadmaps/public-alpha/index.md --out .chaos/todo/views/roadmaps/public-alpha/index.html --items-href "../../../roadmaps/public-alpha/items/" --source-of-truth ".chaos/todo/roadmaps/public-alpha/items/" --title "CHAOS Public-Alpha Roadmap" --subtitle "Roadmap view · 2026-07-18 assessment" --target-meta .chaos/todo/roadmaps/public-alpha/target-meta.json --source-command "chaos:todo --from-roadmap (public-alpha assessment roadmap view)"`

## Deduplication

- IL-WF9 (retire the chaos:gate concept) overlaps the open main-backlog item
  `TODO-2026-07-17-decide-chaos-gate-fate` — kept here as the roadmap's resolution direction;
  close or merge the backlog item on durable import.
- The Horizon 4 bundle's protected-file guard scope overlaps the open main-backlog item
  `TODO-2026-07-17-add-protected-file-guard-profile`.

## Todo Candidates (not imported)

- Horizon 4 sub-scopes (versioned schemas, EA-I19 package formalization, CHANGELOG/releases,
  protected-file guard, identity enforcement, attestation, team pilot) and the research-track
  topics (EA-I15/16/17, chaos:run, cross-worktree locks) are intentionally bundled — split them
  into individual todos when their horizon activates.
