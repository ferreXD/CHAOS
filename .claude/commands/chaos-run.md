---
description: Deliver a change through the lean CHAOS core — one pre-code stop, build, verify, small record
argument-hint: "<change intent>"
allowed-tools: Read, Glob, Grep, Bash, Edit, MultiEdit, Write, Task
---

Use the `chaos-run` skill to deliver the requested change through the lean core loop:
targeted read → **one pre-code stop** through the interaction runtime / Decision Center
(every open question, doubt, and crossing folded into a single decision) → size-gated
OpenSpec when owed → build → honest verify → a one-page decision record in
`.chaos/decisions/`.

Invocation arguments:

```text
$ARGUMENTS
```

There is no orchestrator agent: `chaos:run` runs in the current session. Interrupted runs
continue via `chaos:resume` from the capsule, never from chat memory.
