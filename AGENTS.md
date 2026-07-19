# AGENTS.md — Task Tracker API (CHAOS-governed)

Agent-facing entrypoint. This repository runs under **CHAOS** (Controlled, Human-led,
Agent-Orchestrated Software delivery): humans make the material decisions, agents do the
orchestrated work, and every material decision is recorded and reviewable. Read this
before editing anything.

## Governed subject

The **Task Tracker API** (.NET / ASP.NET Core Minimal API, `net8.0`) under
`src/TaskTracker.Api/` with tests in `tests/TaskTracker.Tests/`. The CHAOS toolkit that
hosts this workspace (`.claude/`, `.github/`, `tools/`) is context-only for governance
(see the scope decision in the bootstrap report).

## Start here

| Read | For |
|---|---|
| [`.chaos/context.md`](.chaos/context.md) | project reality, domain, flows, constraints |
| [`.chaos/architecture.md`](.chaos/architecture.md) | technical posture, boundaries, testing |
| [`.chaos/constitution.md`](.chaos/constitution.md) | behavioral principles + confidence doctrine |
| [`.chaos/decisions/index.md`](.chaos/decisions/index.md) | decisions & their consequences |
| [`.chaos/rules/index.md`](.chaos/rules/index.md) | executable constraints (R-001 …) |
| [`.chaos/gates/index.md`](.chaos/gates/index.md) | readiness gates (G-01 …) |
| [`.chaos/commands/index.md`](.chaos/commands/index.md) | the workflow surface |
| [`.chaos/bootstrap-report.md`](.chaos/bootstrap-report.md) | how this workspace was generated |

## Minimum pre-edit behavior

1. **Locate the change.** Non-trivial work belongs to an OpenSpec change under
   `openspec/changes/<id>/` with governance artifacts under `.chaos/changes/<id>/`. Don't
   free-edit `src/**` outside a change.
2. **Respect the rules.** Especially: keep the test baseline green (R-003), respect the
   domain→HTTP boundary (R-004), keep the `TaskState` naming (R-005).
3. **Never guess a material decision.** Create a runtime decision (Decision Center) and
   **stop** — do not decide in chat. See the interaction runtime below.
4. **Label everything.** Findings and verdicts carry knowledge type + confidence
   (constitution confidence doctrine, R-002).
5. **Validate.** `dotnet build` / `dotnet test` for the API; `openspec validate --strict`
   for spec changes.

## Review / gate expectations

Changes pass the gates in [`.chaos/gates/index.md`](.chaos/gates/index.md): proposal
readiness (G-01) → apply scope integrity (G-02) → verification (G-03) → archive & sync
(G-04), on top of toolchain readiness (G-05). Rigor scales with blast radius
(`--light` / `--standard` / `--strict`).

## Interaction runtime (the source of truth)

The chat thread is **not** the source of truth — the interaction runtime under
`.chaos/interactions/` is, reached via the `chaos-interaction` MCP server, with the
**Decision Center** (VS Code panel) as the human UI. A command that hits a material
decision creates it in the runtime, holds a change lock, and **stops**; a human answers
in the Decision Center; the command continues via `chaos:resume`. Never bypass a pending
decision.

## Team collaboration model (v0)

Change artifacts live under `.chaos/changes/<change-id>/` (per-change layout, with a
`lifecycle.md` manifest). Contributors run `chaos:sync --change <change-id>`
(contributor-safe); repo-wide `chaos:sync --all` requires maintainer/repo-owner
confirmation; a **mainline sync** is recommended after merge into `main`. Canonical
contract: [`.chaos/changes/README.md`](.chaos/changes/README.md).

## Protected files

`AGENTS.md` and root `README.md` are protected: commands may **propose** patches (with a
preview) but must not edit them silently (R-006, `policies.protectedFiles`).
