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
- "Continue chaos:apply for request-context-middleware." → `--change request-context-middleware` (and validate the candidate's `sourceCommand` is `chaos:apply`).

## Execution order

1. **Resolve mode** (`--light` / `--standard` / `--strict`). Default `--standard`.
   If inferred, show it. Do not silently downgrade `--strict`.
2. **Read the runtime first.** Prefer the runtime tools (MCP `chaos_*`, else the runtime
   CLI with `--adapter copilot`); fall back to files only if neither is available
   (disclose the degraded mode).
3. **Resolve the candidate** (see `resume-candidate-resolution.md`).
4. **Load + validate the capsule** (see `resume-capsule-contract.md`).
5. **Validate answered decisions/responses** (see `resume-decision-consumption-policy.md`).
6. **Reconstruct context** and load `requiredArtifacts`.
7. **Continue semantically** from `nextStep` under the original `sourceCommand`
   contract, delegating to that command's skill/agent as needed.
   **Special case — light FRAME (`sourceCommand: chaos:propose`, capsule `nextStep: deliver`,
   `change.md` frontmatter `mode: light`):** the continuation is an **administrative
   terminalization only** — consume the answered decisions, close the run, release the lock,
   and point the user at `chaos:apply <change-id>` (which infers light from `change.md` and owns
   DELIVER). Resume never implements production code on a light run; `chaos:apply`'s preflight
   performs this same close when invoked directly, so this step may already be done.
8. **Consume decisions** after incorporation; **write a resume report** in
   standard/strict (or with `--write-report`).
9. **Finalize** session state.

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
- Not the live auto-resume runner (a Claude-harness capability not wired for Copilot).
