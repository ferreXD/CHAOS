# CHAOS Model Robustness Policy

Shared, Claude-facing policy for the CHAOS command suite. Every CHAOS command, skill, and
agent must comply.

## Purpose

CHAOS must work reliably with the **weakest supported Claude model**, not only with Opus.
Opus tends to infer governance intent — it asks explicit questions, uses interactive
choice UI, invokes OpenSpec, and stops for human decisions. Weaker models need the
workflow to be explicit, gated, mechanical, and auditable.

**Core principle:** CHAOS commands must not depend on the model inferring governance
intent. All critical behaviours must be explicit, gated, and auditable.

## Non-negotiable rules

1. **Model portability.** CHAOS commands must be executable by the weakest supported
   Claude model. If a behaviour only works because a strong model "understood what was
   meant," it is a defect. The weakest supported model is pinned: **Haiku 4.5**.

2. **Checklists over implied intent.** Critical behaviours must be expressed as
   checklists, not implied intent. Each command carries a compact, mechanical checklist
   the model can follow step by step.

3. **OpenSpec must be invoked, not replaced.** When the spec gate says a `chaos:run`
   change owes an OpenSpec change, invoke OpenSpec instead of manually replacing it,
   unless degraded mode is explicitly approved by the user and recorded.

4. **Material decisions require explicit user confirmation.** A material decision is one
   that changes scope, risk, governance, source-of-truth artifacts, protected files, or
   correctness. It must be confirmed by an explicit user selection.

5. **A recommendation is not a decision.** Recommending an option never authorizes acting
   on it. Wait for the user to choose.

6. **A displayed plan is not approval.** Printing a plan, dashboard, or diff does not mean
   the user approved it. Approval is an explicit selection.

7. **Stop after asking.** A command must stop immediately after asking for a material user
   decision and must not continue until the user selects an option.

8. **Native selection UI first.** Use native Claude Code interactive selection/choice UI
   when available. If unavailable, use numbered options in chat and stop.

9. **No continuation after presenting options.** Commands must not continue after
   presenting options until the user chooses.

10. **Label assumptions.** Assumptions must be labelled with knowledge type
    (`FACT | INFERENCE | ASSUMPTION | UNKNOWN | CONFLICT`) and confidence
    (`HIGH | MEDIUM | LOW`).

11. **No silent inferred decisions.** Inferred decisions must not be silently applied. If
    a decision is material, surface it via the interactive decision protocol and stop.

## Spec-gate robustness

When `chaos:run` evaluates the spec gate:

- Show the size estimate and the gate result (owed / optional) at the stop.
- Never silently skip an owed OpenSpec change; the human can flip the gate either way at
  the stop, and the flip is recorded in the decision record.

## Config awareness robustness

Every command must:

- Read `.chaos/config.yaml` if present, before discovering sources or planning writes.
- Use configured paths before defaults.
- Report config status when relevant.
- Not edit config unless the command contract explicitly allows it (`chaos:init` only).
- Route config drift remediation to `chaos:init` (re-run over the existing workspace) and
  surface it via `chaos:doctor`.

If config is missing: infer defaults, warn, and recommend `chaos:init` repair; when the
missing config affects safety, ask whether to continue with inferred paths and stop after
asking.

## What "hardened" means

A command is considered hardened when it declares, near the top of its wrapper:

- a reference to this model robustness policy;
- a reference to the interactive decision protocol;
- (for `chaos:run`) the spec gate and the mandatory pre-code stop;
- the decision-record output location (`.chaos/decisions/`);
- date-prefixed physical artifact naming;
- the stop-after-decision requirement.

## Related

- `interactive-decision-protocol.md`
- `artifact-naming-policy.md`
