---
description: Deliver a change end-to-end under CHAOS in one continuous loop (no phase march)
argument-hint: "<change intent>" [--standard|--strict]
allowed-tools: Read, Glob, Grep, Bash, Edit, MultiEdit, Write, Task
---

Use the `chaos-run` skill to deliver the requested change as one continuous loop, from intent to
close. **There is no orchestrator agent for this command**: `chaos:run` runs in the current
session, which *is* the orchestrator and the tier ceiling (L1 ceiling model). It delegates only
downward — never spawn a subagent on a stronger model than your own.

Invocation arguments:

```text
$ARGUMENTS
```

## What this replaces — and what it does not

`chaos:run` replaces the **mandatory** `propose → review → apply → verify` sequence with one
continuous loop. It changes **when things happen**, never **what is owed**. The artifact set is
unchanged (`change.md`, `lifecycle.md`, `decision-events.md`, `records/*.facts.json`, OpenSpec
deltas, ADRs) and the classifier is unchanged — only its cadence moves, from phases to evidence
classes. `chaos:propose` / `chaos:review` / `chaos:apply` / `chaos:verify` remain individually
invocable; `chaos:verify` becomes the human's **opt-in extra pass** over an already-verified
change rather than the enforcement end.

## Non-negotiable execution contract

Full rules live in the skill. The points that must not be skipped by any model:

- **Read the digest first.** Run `python tools/chaos-digest/digest.py --check` **before reading
  any change-specific file**. Exit 0 → read `governance-digest.md` once, in one step, and do not
  open the source references. Any other exit → the digest is stale: fall back to the full source
  list, record the degradation in the frame facts, and recommend `chaos:sync` at close.
- **The classifier decides rigour, not you.** Drive every checkpoint through
  `tools/chaos-scan/scan.py` (`k1`, `rescan`, `k2`, `k4`, `merge`); never hand-wave a verdict.
  Tier selection is `scan.py tier` — a tool verdict, never a model judgement.
- **Stop where the contract says stop.** S1 frame approval is unconditional. S2 fires on any
  work-loop scan with `newStops > 0`, S3 whenever you hit ambiguity or contradiction, S4 only
  under a preset floor ≥ 2. **After presenting a decision, STOP.** A recommendation is not a
  decision; a displayed plan is not approval.
- **Every stop writes its resume capsule at creation**, never on demand.
- **Records are emitted, artifacts are rendered.** `change.md` and `lifecycle.md` come from
  `tools/chaos-render/render.py`; never hand-write them. Facts may be derived — judgement fields
  never are.
- **Close is gated by the deterministic obligation audit** (`tools/chaos-classify/audit.py`).
  A non-zero audit exit blocks close; fix the obligation rather than the audit.

## Mode

Omitting the flag means **no preset floor** — the classifier alone decides what is owed, which is
the Stage-D default. `--standard` and `--strict` raise floors; do not silently downgrade
`--strict`. Resolve the mode and show it; if inferred, ask the user to accept or override.

## Interaction Runtime Obligations

Follow the shared **CHAOS Interaction Runtime command protocol**
(`.claude/skills/chaos-interaction-runtime/SKILL.md`).

- sourceCommand: `chaos:run`
- Preflight: `chaos_begin_command` with the change intent as context, then derive the change id.
- Material decisions: create via `chaos_create_decision`, then **STOP** on `mustStop: true`.
- Resume: once answered, continue via `chaos:resume`; incorporate the selected option before
  marking the decision consumed, never before.
- Completion: `chaos_complete_command` only at a safe terminal checkpoint, releasing the lock.

## Checklist

- [ ] Digest checked before any change-specific read; degradation recorded if stale?
- [ ] Every checkpoint driven through `scan.py`, with the verdict digest retained?
- [ ] Adjudication run whenever the verdict said `adjudicationDue`, raise-only and cited?
- [ ] S1 taken; S2/S3/S4 taken where the contract demands, each with a capsule at creation?
- [ ] Records emitted, `change.md`/`lifecycle.md` rendered rather than written?
- [ ] `audit.py` exit 0 before close?
- [ ] `chaos:verify` offered as the optional extra pass; `chaos:archive` recommended when ready?
