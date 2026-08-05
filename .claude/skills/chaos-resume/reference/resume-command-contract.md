# Resume Command Contract

`chaos:resume` continues a paused CHAOS command from structured runtime state.

## Invocation forms

```text
chaos:resume
chaos:resume --latest
chaos:resume --change <change-id>
chaos:resume --run <commandRunId>
```

Natural-language equivalents are accepted (map to the same behaviour):

- "Decisions accepted, continue where you left off." → no-args auto-resolve.
- "Resume the latest CHAOS run." → `--latest`.
- "Continue the run for that change." → `--change <change-id>` (and validate the
  candidate's `sourceCommand`).

## Execution order

1. **Read the runtime first.** Prefer MCP; fall back to files only if MCP is
   unavailable (disclose the degraded mode).
2. **Resolve the candidate** (see `resume-candidate-resolution.md`).
3. **Load + validate the capsule** (see `resume-capsule-contract.md`).
4. **Validate answered decisions/responses** (see `resume-decision-consumption-policy.md`).
5. **Reconstruct context** and load `requiredArtifacts`.
6. **Incorporate the answers, mark consumed, then flip the session** with
   `chaos_resume_command` (see `resume-state-machine.md`).
7. **Continue semantically** from `nextStep` under the original `sourceCommand`
   contract — for `chaos:run`, the lean loop steps `spec` | `build` | `verify` | `record`
   per `.claude/skills/chaos-run/SKILL.md`.
8. **Finalize** session state (`chaos_complete_command` when the run actually finishes).

## Hard stops (STOP and report — never continue)

- Missing/invalid capsule fields → report which fields.
- Multiple candidates → present numbered list and stop for user choice.
- No candidate → report none; do not fabricate.
- Pending unresolved decision on the session → route to the Decision Center.
- Malformed runtime state → report repair actions (`chaos:doctor`).
- Unknown `sourceCommand` → ask the user for direction.

## What resume is NOT

- Not "reread the whole chat and continue."
- Not a restore of hidden chain-of-thought or previous chat state.
- Not permission to modify production files beyond the approved `nextStep`.
- Not the live auto-resume runner (that is a later iteration).
