---
name: chaos-propose
description: "Create evidence-aware, ADR/rule-aligned OpenSpec proposals through CHAOS. Supports --light, --standard, and --strict modes with runtime decision resolution."
---

# CHAOS Propose

Use this skill when the user invokes:

```text
/chaos-propose "<change intent>" [--light|--standard|--strict]
```

or asks to create a CHAOS/OpenSpec proposal.

## Purpose

Create a proposal for a change using CHAOS governance and OpenSpec as the spec motor.

The skill must not implement code.

## Repository context (vNext, optional)

When easily available, `chaos:propose` may record the **branch / change source** from the
provider-neutral repository context
(`.claude/skills/chaos-shared/reference/repository-context-contract.md`, tool profile
`propose`, read-only). This is purely additive provenance — propose does **not** require MCP,
CLI, or provider context, and local git fallback is sufficient.

## Non-negotiable execution contract (model robustness)

This skill must be executable by the **weakest supported Claude model**. Do not depend on
inferring governance intent. Obey:

- `.claude/skills/chaos-shared/reference/model-robustness-policy.md`
- `.claude/skills/chaos-shared/reference/interactive-decision-protocol.md`

Two behaviours are mandatory and non-inferable:

1. **Hard OpenSpec invocation gate.** `chaos:propose` MUST use OpenSpec as the proposal
   engine before any CHAOS wrapping. Detect → invoke → confirm change folder → confirm
   artifacts → validate → only then wrap. Never hand-write proposal/design/spec/tasks when
   OpenSpec is available. See `reference/openspec-integration-contract.md`.
2. **Stop after material decisions.** Ask one decision at a time and STOP after presenting
   it; never continue until the user selects an option. A recommendation is not a
   decision; a displayed approach is not approval.

## Required references

Before operating, read the reference files in this skill (and the shared policies above):

- `reference/mode-reference.md`
- `reference/risk-classification.md`
- `reference/evidence-and-confidence-model.md`
- `reference/runtime-decision-loop.md`
- `reference/decision-event-register.md`
- `reference/controlled-proposal-amendment-policy.md`
- `reference/approach-alignment-contract.md`
- `reference/openspec-integration-contract.md`
- `reference/output-contract.md`
- `reference/change-artifacts-layout.md`
- `reference/question-bank.md`
- `.claude/skills/chaos-shared/reference/change-template.md` (universal change artifacts)
- `docs/design/2026-08-02-stage-c-progressive-rigor.md` (progressive rigor — the classification contract, C-1..C-14)
- `tools/chaos-classify/README.md` + `tools/chaos-classify/adjudication-prompt.md` (the pinned semantic-layer contract; part of the classifier's tested surface — do not paraphrase it, read it)

## Workflow

1. Parse the preset flag as a **floor vector** (Stage-C progressive rigor, design
   `docs/design/2026-08-02-stage-c-progressive-rigor.md` §8): no flag/`--light` = zero floors,
   `--standard`/`--strict` = the §8 floor vectors. Floors only raise; they never suppress a
   fired trigger. There is **no mode inference** — classification (step 3) is the inference.
2. Discover CHAOS/OpenSpec/ADR context.
3. **Classify (checkpoint K1).** Build the classifier payload — intent text, predicted scope
   (including planned NEW paths, or M5 false-fires at deliver time), `declaredTriggers`, the
   preset — and run the deterministic core:
   `python tools/chaos-classify/classify.py --inline <payload.json> --state .chaos/changes/<change-id>/classification-state.json`
   with `postureFiles` = the repo's architecture/posture docs and `mapFile` =
   `.chaos/path-class-map.json` (absent map ⇒ path-class scans are blind: say so, lean on
   adjudication, and record the gap). Then perform the **adjudication pass yourself** per the
   pinned contract `tools/chaos-classify/adjudication-prompt.md` (rules 1–14: raise-only,
   cites mandatory) and merge raises via `--adjudication`. Record one `TRG-*` ledger event per
   fired trigger (`chaos-shared/reference/change-template.md` §2). The resulting **dimension
   vector drives every obligation below**; `reference/risk-classification.md` still informs
   which questions to ask, never the rigor level.
4. Assess evidence coverage.
5. Load archaeology only when available and relevant; require it only when risk/classification demands it.
6. Detect missing material context or decisions.
7. Run the Runtime Decision Loop:
   - ask focused questions one by one;
   - offer recommended options when supported by evidence;
   - let the user answer, defer, accept risk, or stop;
   - record each material answer as a `PROP-DEC-*` Decision Event.
8. Present the Approach Alignment Checkpoint. STOP and wait for explicit confirmation.
9. After user confirmation, run the **OpenSpec gate at the classified depth** (see
   "Dimension-driven obligations" below): `openspec 2` → the full hard invocation gate
   (mechanical, in order, as sub-steps 1–8); `openspec 1` → invoke OpenSpec for a **delta spec
   only** (sub-steps 1–5 scoped to the delta); `openspec 0` → **skip OpenSpec entirely** — the
   contract lives in `change.md` §Contract; record the skip and the zero-trigger classification
   in the frame facts. Full-gate sub-steps:
   1. Detect OpenSpec availability (`.chaos/config.yaml` `project.specEngine`/`toolchain.openspec`, or `/opsx:propose`, `openspec` CLI, `openspec/changes/`).
   2. Invoke OpenSpec via one acceptable path — `/opsx:propose`, the `openspec-propose` skill, or driving the `openspec` CLI (all first-class; see "CHAOS overlay invocation rules" in `reference/openspec-integration-contract.md`). Pass the CHAOS brief as input and let OpenSpec own artifact paths. Do not hand-write artifacts when OpenSpec is available; if no path can run, there is no automatic fallback — go to degraded mode (6).
   3. Confirm the OpenSpec change folder exists (`openspec/changes/<change-id>/`).
   4. Confirm proposal/spec/task artifacts were created or updated.
   5. Run OpenSpec validation (`openspec validate <change-id> --strict`) when available; record run/not-run/failed honestly.
      **Completeness vs classified depth:** `openspec status --change <id> --json` measures the
      **full** artifact set and has no notion of Stage-C depth, so at `openspec 0` or `1` it
      reports `isComplete: false` **and that is the expected, correct answer** — it is NOT
      degraded mode, NOT an escalation trigger, and NOT a verify finding. Record the classified
      depth in the frame record's `facts.openspec.depth` (0|1|2); the renderer then labels the
      status line accordingly. **Never edit an already-written pass record to remove the apparent
      contradiction** — `record-emission.md` forbids rewriting a completed pass, and there is no
      contradiction to remove.
   6. If OpenSpec is unavailable/failed: apply degraded-mode handling — strict blocks; standard asks one decision and STOPs, then caps confidence; light auto-escalates to standard first (the light valve); record the degraded-mode decision event.
   7. Only after the gate, apply CHAOS wrapping (confidence, decision events, archaeology references, lifecycle, review routing, governance recommendations).
   8. Record the **OpenSpec Invocation Proof** in the frame record's `facts.openspec` block — the renderer projects it into `change.md` §OpenSpec Invocation (see `reference/openspec-integration-contract.md`).
10. Re-read/re-evaluate amended proposal artefacts when runtime decisions changed them.
11. When a change id is known, initialize the change folder `.chaos/changes/<change-id>/`
    per `reference/change-artifacts-layout.md`: record proposal-time decision events in
    `.chaos/changes/<change-id>/decision-events.md` (hand-appended, as always), then **emit
    the FRAME records** per `chaos-shared/reference/record-emission.md` —
    `records/contract.json` (testable statements with stable ids `C-001…`, grouped,
    `source` = the shaping decision refs) and `records/frame.pass-NN.facts.json`
    (title + intent lines + the OpenSpec invocation proof; standard adds confidence limiters;
    strict adds the source manifest, risk table and framing traceability payloads; verdict
    `READY_FOR_REVIEW`, the completing run id, the framing `mode`). Then render:
    `python tools/chaos-render/render.py <change-id> --write` — the renderer writes
    `change.md` and `lifecycle.md` (frontmatter `lifecycle` block, `current` rollup, section
    depth and the ~80-line overflow are all mechanical; never hand-write or hand-edit them).
    **No `proposal-report.md`.**
12. Recommend `chaos:review <change-id>`.

## The collapsed FRAME (universal base)

**Every change starts here** (Stage-C kills modes as paths; historically this was the `--light`
path). `chaos:propose` owns **FRAME** of the collapsed two-phase lifecycle
(FRAME → human answers → `chaos:apply` delivers; design:
`docs/design/2026-07-24-artifact-model-roadmap.md` +
`docs/design/2026-08-02-stage-c-progressive-rigor.md`). Steps 1–7 above still apply, with the
evidence scan **scoped by the evidence dimensions**: at base, read only the files/modules the
intent names + the rules index + the architecture posture (no repo-wide sweeps);
`evidence.targeted 1` adds the docs the fired triggers cite; `evidence.breadth` ≥ 1 adds
module-level understanding (2 = broad archaeology). Then, instead of steps 8–12:

1. Run the **OpenSpec gate at the classified depth** exactly as step 9 (full set / delta /
   skip per the `openspec` dimension).
2. Write the change folder per the light layout (`reference/change-artifacts-layout.md`):
   lean decision entries in `decision-events.md`, then emit `records/contract.json` +
   `records/frame.pass-01.facts.json` per `chaos-shared/reference/record-emission.md`
   (light depth: title + intent lines + the OpenSpec proof only — no manifest/risk/
   traceability payloads) and render
   (`python tools/chaos-render/render.py <change-id> --write`). **No `proposal-report.md`,
   no `proposal-review.md`** — the frame record's verdict is the inline self-review outcome
   (checklist: scope sane / rules mapped / contract testable / decisions complete; failure ⇒
   escalate, do not iterate).
3. Surface every material decision to the interaction runtime — **same materiality bar as
   standard**; light never means fewer decisions. Exactly one entry carries
   `approves-change: true` (answering it is the approval — no `approval.md`). If no material
   decision exists, surface the explicit gate decision "Approve contract as framed?" — light's
   floor is one human stop, never zero.
4. Create the resume capsule using the standard capsule schema
   (`chaos-resume/reference/resume-capsule-contract.md`) — `nextStep: deliver`;
   `contextCapsule.intent` = the change intent; `contextCapsule.approvedScope` = the scope
   (files/modules) list; `contextCapsule.constraints` = the contract statements' hash + in-scope
   rule ids; `requiredArtifacts` = [`.chaos/changes/<change-id>/change.md`]. Then **STOP**
   (mustStop). Next command after answers: `chaos:apply` (mode is inferred from `change.md`;
   `chaos:review` is not part of the light path).

**Progressive-rigor ratchet (replaces the auto-escalation valve).** There are no mode
escalations under Stage-C: a trigger fires, dimensions raise, obligations grow — **monotone
within the change** (design C-8). What the valve used to detect maps onto triggers: posture
crossing → M1 · more than 2 material decisions → M4 (the old `maxMaterialDecisions` is M4's
threshold, unchanged) · self-review fail → X2 · scope spill (at deliver) → M5.

- Record one `TRG-*` ledger event per firing (`change-template.md` §2) — never hand-write ⚠
  H1 warnings for triggers; `ESC-*`/`escalatedFrom` remain only on legacy changes.
- OpenSpec-degraded is no longer an escalation: when the `openspec` dimension ≥ 1 and no
  OpenSpec path can run, apply degraded-mode handling (one decision, cap confidence); at
  `openspec 0` nothing degrades.
- The frame record completes at the classified depth; rendering reflects it automatically.
- **Never emit `proposal-report.md` or `proposal-review.md`.**

The system never lowers a fired dimension. A **human** may, via a recorded override decision
entry (rationale + which dimension, from → to) — never silently (design C-8).

## Dimension-driven obligations (Stage-C)

The classification vector — not the flag — sets the obligations (design §4–§10; the flag only
floors them):

| Dimension | 0 (base) | 1 | 2 |
|---|---|---|---|
| openspec | skip OpenSpec; contract lives in `change.md` (record the skip) | delta spec only | full set (hard invocation gate) |
| evidence.targeted | scoped scan | also read the docs the fired triggers cite | — |
| evidence.breadth | scoped scan | module-level understanding of the touched surface | broad archaeology |
| review | inline self-review line | recommend review folded into verify | standalone `chaos:review` before implementation |
| verify | contract + tests | trigger-relevant safeguard checks (the trigger id says which) | full verify orchestration |
| adr | — | decision-log entry in the ledger | ADR required — `sync-action: CREATE_ADR`; verify blocks READY without it |
| stops | the floor approval stop (`approves-change`) | K1-fired materiality **folds its named questions into the approval decision's presentation** — never a second stop at K1; the entry MUST declare `folds: <n>` (`change-template.md` §2) so M4 can count questions rather than headings | preset floor 2 adds the DELIVER-exit sign-off |

Mid-flight (K3, `chaos:apply`'s checkpoint) is the only place a trigger creates a NEW stop, and
only when no ANSWERED same-surface decision already covers it (MR-3 stop satisfaction).

## UX rule

Do not ask questions the repository already answers.

Do ask targeted runtime decision questions when missing context materially changes proposal scope, approach, OpenSpec artefacts, confidence, or implementation readiness.

Open questions are a fallback, not the default output. Only unresolved/deferred/external questions should remain open in the final output (as deferred entries in `decision-events.md`).

## Runtime amendment rule

The command may amend OpenSpec proposal/design/spec/tasks only after explicit user confirmation.

No silent proposal mutation.

## Todo Candidates (optional)

`chaos:propose` MAY end its final response with an optional `## Todo Candidates` section listing
material deferred proposal questions, degraded-mode follow-up (e.g. OpenSpec unavailable), or
missing context that should be tracked, using the shared fields in
`.claude/skills/chaos-todo/reference/todo-candidate-contract.md`. `chaos:propose` does not
create durable todo items — only `chaos:todo` curates `.chaos/todo/items/`.

## Final response

Summarize:

- change ID;
- mode and whether it was inferred;
- proposal status;
- confidence;
- material runtime decisions recorded;
- OpenSpec artefacts created or not created;
- remaining open questions, if any;
- next command.
