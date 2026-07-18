# 05 — Workflow matrix: 4 templates × 3 overlays

Part of the CHAOS two-axis classification design · commit `6421feb` · 2026-07-18 · [Index](README.md)

## 5.1 Composition model — no hardcoded 12

**Four profile templates** define workflow shape; **three risk overlays** define safeguard strength. Every combination is derived `template ⊕ overlay` — zero per-combination workflows are hand-maintained (the brief's template-sharing requirement):

- **Templates (shape):** `micro` = one session, one consolidated note, inline decisions except gated ones · `compact` = 1–2 sessions (propose+apply merged or apply+verify merged), one consolidated change report, batched decisions · `normal` = separate propose/review/apply/verify, standard reports · `full` = the current full chain incl. broad archaeology, standalone code-review, archive/sync/retro.
- **Overlays (strength):** `light` = reports recommended; waivers casual · `standard` = evidence PARTIAL+, blockers block, waivers recorded · `strict` = G-GOV-APPROVAL before apply; evidence COMPLETE-or-waived; triggered system gates non-waivable where marked; verification depth = deep on safeguards; missing tests for behavioral **code** change block.

## 5.2 The matrix

Token/interruption figures are **Hypothesis** at current prompt sizes (baseline: measured ~196k full chain), to be measured by IL-PF10/EA-X3; they shrink further with the PF program. "Stops" = runtime decision stops (after IL-DQ2 materiality).

| Combo | Intended use | Required commands | Optional | Verification depth | Archive/Sync/Retro | Est. tokens | Stops |
|---|---|---|---|---|---|---|---|
| light-micro | typo, comment, trivial config | one governed session (propose+apply+verify collapsed) | — | smoke-level | auto-archive note / no / no | ~15–20k | 0–1 |
| light-compact | small docs/test/tooling change | compact session ×1–2 | verify separate | targeted | light archive / no / no | ~25–35k | 1 |
| light-normal | low-risk feature of ordinary size | propose→apply→verify | review | standard | archive / opt / periodic | ~60–90k | 2–3 |
| light-full *(rare)* | large low-risk restructure (docs/tooling) | + archaeology-lite, code-review | retro | standard | archive / opt / triggered | ~110–150k | 3–5 |
| standard-micro | index add, small bounded fix | compact session w/ standard evidence | — | targeted + triggered system gates | note / no / no | ~18–25k | 1 |
| standard-compact | bounded fix/feature in one module | propose+apply merged, verify | review-lite | focused | archive / opt / no | ~35–50k | 1–2 |
| standard-normal | ordinary feature | propose→review→apply→verify | code-review | standard | archive / opt / periodic | ~90–120k | 3–5 |
| standard-full | large refactor, complex feature | + archaeology, standalone code-review | — | extensive (code-heavy) | archive / yes / **triggered (full)** | ~140–190k | 5–8 |
| **strict-micro** | one-line risky config w/ trivial validation | one session + approval + system gates | — | deep on safeguards only | archive note / yes (decision promotion) / no | ~25–35k | 2 |
| **strict-compact** | risky-but-small (conn string, auth policy cfg, migration) | propose+apply (staged) + approval + verify | targeted archaeology | deep on safeguards; targeted otherwise | archive / yes / triggered | ~40–60k | 2–3 |
| strict-normal | risky ordinary feature (auth code, breaking API) | full spine + review mandatory | code-review per code gates | deep | archive / yes / triggered | ~110–140k | 4–6 |
| strict-full | brownfield architectural/dangerous work | today's complete chain | — | maximal | archive / yes / yes | ~180–220k | 6–10 |

Reading the flagship: **strict-compact** grants explicit risk explanation, focused impact analysis (targeted — not broad — archaeology), approval before apply, the triggered system gates, rollback consideration, deep verification *of the safeguards*, and decision promotion via sync — while skipping broad archaeology, architectural analysis, standalone code review, generic implementation gates, mandatory retro, and the full report set. That is exactly the brief's expected behavior, produced by composition rather than a bespoke workflow.

## 5.3 Consolidated reporting per template

micro → one `change-note.md` (classification line, what/why, gate evidence, verify verdict). compact → one `change-report.md` with sections replacing proposal-report/apply-report/verification as separate files. normal/full → today's per-command reports (budgeted per IL-PF9). The consolidated formats are where most of the artifact-count reduction comes from (19 → ~6 files at compact; Hypothesis, verify in EA-X3).

## 5.4 Legality notes

All 12 combinations are legal. Rare-but-valid: light-full (large mechanical restructures) and strict-micro (single-value production edits with tooling-verified validation). The matrix is a *derivation*, so odd combinations cost nothing to support — the rule table simply lands there when the signals say so.
