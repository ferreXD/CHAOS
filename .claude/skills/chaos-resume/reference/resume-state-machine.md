# Resume State Machine

`chaos:resume` operates over the Iteration 1 session/decision state machines
(`.chaos/interactions/contracts/state-machine-contract.md`). It does not invent
new states.

## Session states relevant to resume

```text
running -> waiting-for-decision -> ready-to-resume -> resumed -> running -> completed
```

- `ready-to-resume` — all blocking decisions answered and a valid capsule exists.
  This is the only state resume starts from (plus `resumed` re-entry).
- `resumed` — the command consumed a response/capsule and continued after a pause.
- Terminal: `completed`, `cancelled`, `expired`, `failed`.

Administrative terminal edges `ready-to-resume -> completed|cancelled` exist for
runtime cleanup / no-runner environments. **Normal resumed execution should
prefer `ready-to-resume -> resumed -> completed`.** When `chaos:resume`
successfully continues, transition the session to `resumed`, and to `completed`
only when the resumed command actually finishes.

## Decision states relevant to resume

```text
waiting -> answered -> consumed
```

- Resume acts on `answered` decisions and moves them to `consumed` **after**
  incorporation.
- Do not touch `cancelled` / `expired` / `superseded` decisions as if answered.

## Resume outcomes

- **Continued & completed** → session `resumed` then `completed`; locks released.
- **Continued & still active** → session `resumed` (or back to `running`); leave
  locks in place; report remaining work.
- **Blocked** → leave session `ready-to-resume`; do not consume decisions; report
  the blocker.
- **New decision needed mid-resume** → create it via the runtime/MCP, STOP, and
  wait (this is a fresh pause, not auto-resume).

## Locks

A `ready-to-resume` session still holds its change lock until it is resumed and
completed/cancelled. Respect the lock: do not advance a change locked by a
different command run.
