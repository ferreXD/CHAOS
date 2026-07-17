# In-Session Auto-Resume Contract

`chaos-auto-resume.py` is a `Stop` hook that lets a CHAOS command invoked in a
**normal interactive chat** continue across material decisions **in the same
session** — the command's output (dashboards, summaries, decision context) stays
in the chat, and after you answer in the Decision Center it auto-continues with no
manual `chaos:resume`.

It complements, and does not replace:

- the **headless runner** (`tools/chaos-interaction-runner/`, `adapter: claude-code`)
  — the autonomous path that drives its own headless Claude Code session, and
- `chaos:resume` — the always-available manual fallback.

## When it engages (all must hold; otherwise a pure no-op)

- `.chaos/config.yaml` → `policies.interactionRuntime.autoResume.enabled: true`
  **and** `autoResume.inSessionResume: true`.
- `CHAOS_COMMAND_RUN_ID` is **not** set in the environment. That variable means the
  session is the headless runner's child; the runner owns resume, so this hook
  stays out of the way. This is how the two mechanisms coexist without fighting.

If the gate is off, the hook exits 0 immediately and the command stops normally
(classic answer-then-`chaos:resume`).

## What it does on `Stop`

1. Reads the interaction runtime `active.json`. If it is waiting on a decision
   (`activeDecisionId` set, waiting state) and that decision is genuinely
   `waiting`, and its `changeId` matches the session's active command
   (`.chaos/runtime/active-command.json`; when there is no changeId, the single
   active decision is accepted), that decision is "ours".
2. **Blocks and polls** the decision file (cheap; no model tokens) until it is
   answered in the Decision Center, bounded by `--max-wait-seconds` (default 1800;
   the settings `timeout` is set just above it):
   - **answered** → emits `{"decision":"block","reason":"…"}`, which makes this
     same session continue. The `reason` names the decision + selected option and
     points at the runtime.
   - **cancelled / expired / consumed elsewhere** → allows the stop.
   - **timeout** → allows the stop and prints a one-line note (answer, then send a
     message or run `chaos:resume`).
3. Multiple decisions loop naturally: each continued turn resolves one decision,
   may create the next, stops, and the hook waits again — until the command
   finishes with no pending decision (then the stop is allowed).

## The continued turn MUST resume from the runtime (defensive contract)

A Stop hook's `reason` is not guaranteed to be delivered to the model, so the
continuation must not depend on it. The `chaos-interaction-runtime` skill therefore
requires: **if your turn is continued after you stopped on a material decision, the
interaction runtime is the source of truth — your first action is to read the
freshly-answered, not-yet-consumed decision for the active run, incorporate the
selected option, mark it consumed, and continue the original command from its
capsule `nextStep`; do not restart the command or re-ask the user.**

## Safety / degradation

- Every uncertain path (gate off, runner-driven, no pending decision, cancelled,
  timeout, any internal error) **allows the stop**. Worst case is "no auto-resume
  this time", never a stuck or corrupted session.
- The hook never writes runtime state; it only reads and, when answered, blocks.
- Single-active-session assumption: it matches the one active decision by
  `changeId`. Correct for the normal single-local-user case; for concurrent
  multi-command sessions, fall back to `chaos:resume`.

## Related

- `.claude/skills/chaos-interaction-runtime/` — the defensive-resume rule + the
  full command/resume protocol.
- `tools/chaos-interaction-runner/README.md` — the headless runner path.
- `hook-runtime-policy.md` — hooks are report-first and never block on their own
  observability state; this hook's block is an explicit, opt-in exception scoped to
  answered-decision continuation.
