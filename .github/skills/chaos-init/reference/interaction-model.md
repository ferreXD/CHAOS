# CHAOS init mode reference

`chaos:init` supports three modes.

## Default: guided-confirmation

Use this mode for most repositories.

Behavior:

1. Discover existing documentation and repo evidence.
2. Produce a concise discovery summary.
3. Ask a compact set of high-impact questions only when needed.
4. Require explicit confirmation before:
   - excluding a major available documentation track;
   - treating `Proposed` ADRs as accepted working posture;
   - overwriting existing governance files;
   - resolving conflicts between sources.
5. Generate all required files after confirmation or after the user chooses to proceed with conservative assumptions.
6. Generate `.chaos/bootstrap-report.md` with a full audit trail.

The default mode balances UX and correctness. It avoids a long upfront questionnaire but does not silently create governance files when important context is missing.

## `--auto`

Use this mode when the repo already has strong ADRs/docs or the user explicitly wants a fast draft.

Behavior:

- Generate all files using available evidence.
- Do not stop for clarification unless a mandatory confirmation gate is triggered and no conservative fallback exists.
- Mark uncertain content as assumptions.
- Treat unconfirmed `Proposed` ADRs as proposed working posture, not accepted posture.
- Include major discovered tracks as context-included unless explicitly confirmed as excluded.
- Generate `.chaos/bootstrap-report.md` listing confidence levels and unresolved confirmations.

## `--guided`

Use this mode for greenfield repos, weakly documented repos, or when the human owner wants strong control.

Behavior:

Run a section-by-section wizard:

1. Project context
2. Architecture posture
3. Constitution
4. Decisions index
5. Operational rules
6. Commands
7. Gates
8. AGENTS.md
9. README handling
10. Bootstrap report

For each section, show:

- What was found.
- What was inferred.
- What is uncertain.
- Required questions before generating the section.
- Draft section output.

Proceed to the next section only after user confirmation, unless the user switches to auto mode.
