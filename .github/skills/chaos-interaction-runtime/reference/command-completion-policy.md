# Command Completion Policy

When a runtime-aware command reaches a terminal state and it owns a runtime session
(`commandRunId`), it must close that session cleanly.

## On completion

- Call runtime completion (`chaos_complete_command`) when a `commandRunId` exists and
  the runtime is available. This releases the change lock.
- Do **not** leave stale locks. A completed/cancelled session that still owns an
  active lock is exactly what Iteration 7's lock/session probes flag.
- If the completion is an **administrative terminalization** (cleanup / no-runner /
  CLI path rather than normal resumed execution), label it clearly. Normal resumed
  execution prefers `ready-to-resume → resumed → completed`; the administrative
  `ready-to-resume → completed/cancelled` edges remain valid for cleanup.

## When completion cannot happen safely

If the runtime is unavailable, or state is malformed, or completion is uncertain, do
**not** mutate uncertain state. Instead:

- leave the session as-is,
- report the situation, and
- emit a **Todo Candidate** (or route the user to `chaos:doctor`) rather than
  hand-writing runtime JSON.

## Decisions before completion

Any decision this run created must be answered and consumed (after incorporation)
before completion. Completing while an answered decision is unconsumed is a
`decision-not-consumed` advisory violation.
