# Decision Batching Policy

Controls how many material decisions a command writes to the runtime before it stops
and hands off to the Decision Center. Set by
`policies.interactionRuntime.commands.decisionBatching` in `.chaos/config.yaml`.

## Modes

### `sequential` (one at a time)

Create the first material decision, receive `mustStop: true`, and **STOP**. The human
answers it, resumes (`chaos:resume`), and the command may then discover the next
decision. Simplest and always safe; the human may be interrupted multiple times.

### `batch-independent` (default) — write all independent decisions, then stop once

Before stopping, create **every material decision the command can already determine
that is `independent`** (the runtime's `independent` flag). They accumulate as pending
on the same session (the runtime allows multiple `activeDecisionIds`). Then STOP once,
so the human answers them **together** in the Decision Center and a single
`chaos:resume` continues the command.

Rules:

1. Only batch decisions that are genuinely **independent** — their options and context
   do **not** depend on the answer to another unanswered decision in this run.
2. A **dependent** decision must NOT be created until its prerequisites are answered.
   Dependent decisions therefore still require a later round (this is inherent — a
   decision whose very options depend on a prior answer cannot be known up front).
3. After creating the batch, STOP. Do **not** do any work that depends on any queued
   decision. Creating additional *independent* decisions after a `mustStop` is allowed;
   *continuing execution* past them is a `continued-after-must-stop` violation.
4. Mark each decision consumed only after its answer is incorporated on resume
   (unchanged; see `runtime-resume-handoff.md`).

## Diagnostics coherence

Either mode leaves the same evidence Iteration 7 expects: N pending decisions + a held
change lock, and no continue-after-`mustStop`. `batch-independent` simply produces the
whole independent set at once instead of drip-feeding it. When
`commands.enabled: false`, no runtime decisions are created at all (see
`command-preflight-protocol.md` Step 0).
