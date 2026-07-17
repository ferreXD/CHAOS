# CHAOS Archaeology Skill

Use this skill when the user invokes `chaos:archaeology` or `chaos:archeology`, or asks to discover current behaviour before proposing/changing an existing system.

## Purpose

Produce a bounded archaeology report that reconstructs relevant existing behaviour with explicit evidence, confidence, assumptions, and proposal readiness.

## Required behaviour

1. Read `.chaos/config.yaml` if present.
2. Infer mode when omitted and ask for confirmation if risk is high.
3. Check `.chaos/archaeology/index.md` for reusable evidence.
4. If the index is missing, prompt the user:
   - create empty index and add this run;
   - build index from existing reports;
   - continue without index;
   - stop.
5. Show an archaeology budget before scanning.
6. Ask narrowing questions if the topic is too broad.
7. Inspect only within the approved budget and focus.
8. Stop when evidence threshold is reached unless user chooses to continue.
9. Show evidence map before writing.
10. Write report and optionally update index unless `--dry-run`.

## Never do this

- Do not implement code.
- Do not modify tests.
- Do not create OpenSpec changes.
- Do not create ADRs/rules/gates.
- Do not silently update the archaeology index.
- Do not keep expanding scope just because related files exist.

## Repository context (vNext, optional)

`chaos:archaeology` may record the **repository provider** only when relevant to the evidence
(e.g. provider-specific behaviour), via the provider-neutral repository context
(`.claude/skills/chaos-shared/reference/repository-context-contract.md`, read-only). It does
**not** require MCP, CLI, or provider context; local git fallback is sufficient and provider
logic must not be overloaded onto archaeology.

## Todo Candidates (optional)

`chaos:archaeology` MAY end its report with an optional `## Todo Candidates` section listing
material unresolved unknowns, follow-up archaeology, missing tests, or missing runtime
evidence surfaced during the investigation, using the shared fields in
`.claude/skills/chaos-todo/reference/todo-candidate-contract.md`. `chaos:archaeology` does not
create durable todo items — only `chaos:todo` curates `.chaos/todo/items/`.

## Reference docs

Read the files in `reference/` for the full contract.
