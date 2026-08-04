# `chaos:propose` Mode Reference

> **Stage-C (2026-08-02):** the flags are **floor vectors over one flow**, not paths
> (`docs/design/2026-08-02-stage-c-progressive-rigor.md` §8; SKILL.md "Dimension-driven
> obligations"). Mode inference is retired — the trigger classifier owns rigor; a flag only
> raises minimums and can never suppress a fired trigger. The per-flag sections below survive
> as **floor-choice guidance** ("when might a human want to floor higher"); where anything here
> conflicts with SKILL.md's Stage-C sections, Stage-C wins.

## Default (no flag)

Zero floors + the mandatory FRAME approval stop (design C-11). Rigor comes from classification
alone. Do NOT infer a mode from risk — run the classifier (SKILL.md workflow step 3) and show
its result instead:

```text
Classified: M2 sensitive-surface (scan: predicted scope includes Security/ (new)) ·
M1 posture-crossing (adjudication: intent x non-goals auth)
Dimensions: stops 1 · evidence.targeted 1 · verify 1 · openspec 1 · adr 2
Their questions fold into the approval decision. Override: a recorded human decision only.
```

## `--light`

**Light is a collapsed path, not relaxed validation** (see "Light mode: collapsed FRAME workflow"
in `SKILL.md` and `docs/design/2026-07-24-artifact-model-roadmap.md`). It preserves every material
decision, the human's decision weight, green tests, and the full OpenSpec set; it cuts the
narrative ceremony (no proposal-report, no separate review/approval artifacts, one human stop).

Use for:

- documentation-only changes;
- isolated low-risk new capability;
- exploratory spike notes;
- small internal improvement with no behaviour or architecture impact.

Behaviour:

- Scoped evidence scan (files the intent names + rules index + architecture posture; no
  repo-wide sweeps).
- Ask at most three clarification questions unless the request is unsafe or ambiguous.
- One recommended approach; compact Approach Alignment Checkpoint.
- OpenSpec at the classified depth (`openspec` dimension: skip / delta / full — SKILL.md
  "Dimension-driven obligations").
- Output = `change.md` + lean decision entries + `lifecycle.md` stub + capsule
  (`chaos-shared/reference/change-template.md`), then STOP for the human.
- `chaos:review` is not part of the light path — the Review line in `change.md` records the
  inline self-review; next command after answers is `chaos:apply`.

There is no "cannot stay light" under Stage-C — there are no modes to leave. The cases the old
valve escalated on are now triggers that raise dimensions in place (see "Escalation → the
ratchet" below); the flag's zero floors are unaffected by firings, and firings are unaffected
by the flag.

## `--standard`

Use for normal product/backend/frontend changes.

Behaviour:

- Discover sources.
- Classify change and risk.
- Load relevant ADRs/rules/context.
- Load archaeology when relevant and available.
- Produce 2–3 approaches.
- Require Approach Alignment Checkpoint.
- Generate OpenSpec change artefacts when available.
- Write the universal change artifact set: `change.md` (§Intent + §Contract + §Review verdict
  line; short prose allowed per section) + `decision-events.md` + `lifecycle.md` stub
  (`chaos-shared/reference/change-template.md`). No `proposal-report.md`.
- Recommend `chaos:review` before implementation.

## `--strict`

Use for:

- brownfield migration;
- architecture changes;
- security/auth;
- external side effects;
- offline/replay/idempotency;
- deployment/cutover;
- high-impact data access/schema changes;
- regulated/compliance-sensitive workflows.

Behaviour:

- Exact source manifest required.
- Missing ADRs/rules/archaeology must be called out.
- Brownfield work requires archaeology unless explicitly waived.
- Proposed ADRs must not be treated as accepted unless CHAOS workspace or user confirms that posture.
- OpenSpec validation must be requested or run if possible.
- Write the same `change.md` artifact set at strict depth — fuller analysis + extra sections
  (risk, traceability matrix) + the overflow rule (any section > ~80 lines →
  `appendix/<section>.md`, one-line summary + link). No `proposal-report.md`.
- Proposal cannot be marked ready if blocking evidence gaps remain.
- `chaos:review` is mandatory before implementation.

## Escalation → the ratchet (Stage-C)

Mode escalation is retired. Triggers fire, dimensions raise, obligations grow — monotone,
recorded as `TRG-*` ledger events (change-template §2), announced but never asked about.
The old valve's cases map onto triggers (posture crossing → M1, decision count → M4,
self-review fail → X2, scope spill → M5); `ESC-*`/`escalatedFrom`/⚠ H1 warnings remain only on
legacy pre-C changes. "Escalate to strict?" confirmations are gone: what strict used to bundle
now arrives per-dimension when triggers demand it, and a human who wants more anyway sets a
floor flag. Downgrades exist only as recorded human override decisions (design C-8).

## Runtime decision behaviour by mode

| Mode | Missing decisions / context |
|---|---|
| `--light` | Ask only high-impact questions. Allow deferral or accepted risk for non-critical gaps. Record remaining items as assumptions/deferred questions. |
| `--standard` | Ask material questions one by one. If no direct blocker exists, allow continuation after recording user decision, accepted risk, or deferral rationale. |
| `--strict` | Blocking/material decisions must be resolved before the proposal can be marked ready. Deferral is allowed only if final status reflects not-ready/blocked. |

Open questions must not be emitted by default. Ask the user to resolve them first unless non-interactive execution or explicit deferral applies.
