# Resume Examples

Illustrative flows. The interaction runtime is the source of truth; these show
the intended shape, not fabricated data.

## Example 1 — single candidate, `--latest`

```text
User: chaos:resume --latest
```

1. `chaos_find_resume_candidates { latest: true }` → `FOUND` one candidate
   `RUN-...-chaos-propose-request-context` (sourceCommand `chaos:propose`,
   change `request-context-middleware`, next `continue-with-selected-execution-profile`).
2. `chaos_get_resume_capsule { commandRunId: RUN-... }` → capsule loaded and validated.
3. `chaos_get_decision_response { decisionId: DEC-...-execution-profile }` →
   `ANSWERED`, selected `strict-risk-compact`.
4. Incorporate the profile into the proposal plan.
5. `chaos_mark_decision_consumed { decisionId: DEC-... }`.
6. Continue `chaos:propose` from `nextStep`; write a resume report.

## Example 2 — multiple candidates, ask and STOP

```text
User: chaos:resume
```

`chaos_find_resume_candidates {}` → `MULTIPLE_FOUND`:

```text
Multiple resumable CHAOS sessions found.

1. RUN-a chaos:apply request-context-middleware — ready-to-resume — next: continue compact implementation
2. RUN-b chaos:todo public-alpha-roadmap — ready-to-resume — next: import blockers
3. Stop

Select one session to resume.
```

STOP. Wait for the user's choice before doing anything else.

## Example 3 — no candidate

```text
User: Decisions accepted, continue where you left off.
```

`chaos_find_resume_candidates {}` → `NOT_FOUND`.

Report: "No ready-to-resume CHAOS session exists. Nothing to resume. If you
expected one, check the Decision Center for a still-pending decision, or start
the command fresh." Do not invent context.

## Example 4 — pending decision blocks resume

`chaos_get_active_decision { changeId }` → `ACTIVE_DECISION`.

Report: "This change still has a pending decision. Answer it in the Decision
Center first, then run `chaos:resume` again." Do not bypass it.

## Example 5 — exact run, capsule incomplete (strict)

```text
User: chaos:resume --run RUN-x --strict
```

Capsule is missing `nextStep`. STOP: "Cannot resume RUN-x: the resume capsule is
missing required field `nextStep`. Re-create the capsule (chaos_create_resume_capsule)
or inspect `.chaos/interactions/capsules/RUN-x.json`." Do not invent a next step.

## Example 6 — MCP unavailable (file fallback)

MCP tools are not reachable. Read `.chaos/interactions/sessions/*.json` for
`ready-to-resume` sessions and the matching `capsules/<runId>.json`. Disclose:
"MCP unavailable — resolved from files; confidence capped to MEDIUM." Use the
runtime CLI to mark decisions consumed; if unavailable, report the required step
and stop rather than editing JSON by hand.
