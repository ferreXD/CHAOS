---
name: chaos-run
description: "The lean CHAOS core loop: read the terrain, stop ONCE before code with every open question folded into a single Decision Center decision, build, verify honestly, and leave a small decision record. Size-gated OpenSpec for large or posture-crossing changes."
---

# CHAOS Run — the lean core

Use this skill when the user invokes:

```text
/chaos-run "<change intent>"
```

This is the distilled loop the 2026 validation program endorsed
(`.chaos/validation/2026-08-hostile-terrain/VERDICT.md`). Its value lives in exactly three
mechanisms, and everything here serves them:

1. **The stop.** One forced pre-code decision, answered by the human who owns the intent.
   Every measured catch of the program (T4 graphemes, B3 label fallback, B2 posture
   crossing) came from this and nothing else.
2. **The verify.** Checks actually run; delegated work independently checked; what cannot
   be verified stays *labeled*, never ticked.
3. **The record.** A small, durable note of what was decided and shipped — the asset that
   lets a future stop catch a crossing.

**Budget discipline — spend minutes, not words.** The whole loop's machine overhead on a
small change is single-digit minutes; that is the budget worth defending. **Nothing you write
here has a length ceiling** — not the stop, not the spec, not the record — and the runtime
enforces no character limit on any of them (operator decision, 2026-08-06). Write what the
change actually requires: the failure mode to avoid is *ceremony*, work that adds no
information, not length. A long stop that a human needs is correct; a short one that hides a
crossing is not.

## The loop

### 1. Read (targeted, minutes)

Read what the change touches, plus the crossing sources: `AGENTS.md`,
`.chaos/architecture.md` (if present), `docs/adr/`. You are looking for two things: how
the repo already does what the task needs (conventions, precedent), and whether the intent
**crosses** anything recorded — an accepted posture, a contract the repo doesn't own, an
ADR, anything irreversible or externally visible. No breadth mandate; read until the plan
and the doubts are concrete.

### 2. Stop — before any code, always

Collect into ONE decision:

- **Every open question, doubt, and assumption** whose wrong answer would change what
  ships. Surface uncertainty; never resolve it silently. If the repo answers a question,
  cite the answer instead of asking (note it under "not asked, because").
- **Every crossing** found in step 1, each with the recorded position it crosses and real
  alternatives — including "don't deliver that requirement" when honest.
- **The size estimate** (files / LOC) and the **spec-gate result** (below).
- **The plan**, in a few lines.

Create the decision through the interaction runtime (`chaos_begin_command` →
`chaos_create_decision`, one decision, `folds: <n>`), write the resume capsule, and STOP
(`mustStop`). Follow `.claude/skills/chaos-interaction-runtime/SKILL.md` for the protocol,
including: never re-ask (`ANSWERED_DECISION_EXISTS` → fetch, incorporate, consume), no
silent bypass, and `chaos_resume_command` after consuming — a session left at
`ready-to-resume` rejects the next decision.

A clean frame (no questions, no crossings, small) still stops — as a short confirmation of
the plan. That confirmation is the catch mechanism; it is cheap and it stays.

### 3. Spec gate (OpenSpec)

Deterministic rule, evaluated at the stop and shown in it:

- estimated **files ≥ specGate.files** (default 5), or estimated **LOC ≥ specGate.loc**
  (default 250), or **any crossing** → an OpenSpec change is **owed**: after approval, run
  the `openspec-propose` flow scoped small (proposal + delta spec; skip design.md unless
  the human asks).
- below the gate → OpenSpec is **optional**; the human can flip it either way at the stop.

Thresholds live in `.chaos/config.yaml` under `specGate:` when the workspace overrides the
defaults. **Standing demotion rule (operator, 2026-08-05):** if the spec path visibly
balloons wall time again, it gets demoted to optional-everywhere — record the observation
in the decision record and tell the user.

### 4. Build

Implement what was approved. Delegation to agents is fine — note in the record what was
delegated and to whom. Scope drift beyond the approved plan that changes *capability* (not
just file layout) gets a follow-up decision through the runtime; helper files completing
approved work do not.

### 5. Verify

- Run the build and the tests; paste real outcomes, not claims.
- **Delegated work gets an independent check**: review the diff against the task in fresh
  context (or a second agent) before accepting it.
- Anything unverifiable in this environment is recorded as a *verification limit* with its
  reason — never as a pass.

### 6. Record

Write `.chaos/decisions/<YYYY-MM-DD>-<slug>.md`. **No length limit** — carry every field
below in full, and add what a future stop would need to catch a crossing against this change:

```markdown
# <slug> — <one-line intent>
- intent (verbatim): ...
- size: estimated N files / M LOC → actual N'/M' (spec gate: owed|optional|skipped —
  note if the actuals would have flipped the gate)
- stop: <runtime decision id> — questions asked + answers chosen (one line each);
  "not asked, because" items; crossings + the ADR/architecture amendments they caused
- shipped: <files>
- checks: <real command results; verification limits with reasons>
- delegated: <what/to whom/how verified> | none
- deviations & follow-ups: ...
```

Add one line to `.chaos/decisions/index.md`. If a crossing was approved, amend the crossed
record (`architecture.md` / the ADR) in the same change — the record must stop
contradicting the shipped code (the B2 pattern).

### 7. Complete

`chaos_complete_command`. Locks released; done.

## Interrupted runs

`chaos:resume` continues from the capsule and the answered decisions — never from chat
memory. Capsule `nextStep` values for this loop: `spec` | `build` | `verify` | `record`.

## Golden rules

- One decision at a time; a recommendation is not a decision; STOP means stop.
- The stop is small or it is broken.
- Never tick what you did not verify; never guess what you did not derive.
- No artifact here has a size limit. Write what the change needs; never trim a fact,
  a crossing, or a verification limit to hit a length.
