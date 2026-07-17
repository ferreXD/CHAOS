# Resume Candidate Resolution

A **candidate** is a `ready-to-resume` command session, joined with its resume
capsule if one exists. Use `chaos_find_resume_candidates` (MCP) or the runtime
`findResumeCandidates(filter)` API. Never enumerate capsule files by hand — the
runtime exposes the official discovery API (Iteration 4).

## Resolution rules

1. **`--run <commandRunId>`** — exact match. If the session does not exist or is
   not resumable, STOP and report. Do not fall back to another session.
2. **`--change <changeId>`** — may match multiple sessions. If exactly one,
   select it. If more than one, present a numbered list and **STOP**.
3. **`--latest`** — the single newest ready-to-resume session. If ambiguous under
   additional filters, prefer the most-recently-seen; if still tied, ask.
4. **No args**:
   - exactly one ready-to-resume session → select it;
   - many → present a numbered list and **STOP**;
   - none → report "no resumable session" and suggest next actions.
5. **`--sourceCommand <name>`** (optional filter) — narrow candidates to a source
   command (e.g. only `chaos:apply` sessions).

## Multiple-candidate prompt (STOP after presenting)

```text
Multiple resumable CHAOS sessions found.

1. RUN-... chaos:apply request-context-middleware — ready-to-resume — next: continue compact implementation
2. RUN-... chaos:todo public-alpha-roadmap — ready-to-resume — next: import blockers
3. Stop

Select one session to resume.
```

After presenting the options, **STOP**. Do not pick for the user. Do not begin
loading artifacts for a guessed candidate.

## MCP status mapping

`chaos_find_resume_candidates` returns:

- `NOT_FOUND` → nothing to resume; do not invent context.
- `FOUND` → exactly one; proceed to capsule load.
- `MULTIPLE_FOUND` → present the list and STOP (`mustStop: true`).

## File fallback

If MCP is unavailable, read `.chaos/interactions/sessions/*.json` for
`ready-to-resume` sessions and `.chaos/interactions/capsules/<runId>.json` for
capsules. Disclose that MCP was unavailable and cap confidence to MEDIUM unless
direct file validation is strong.
