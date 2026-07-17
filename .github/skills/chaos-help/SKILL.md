# CHAOS Help Skill

Use this skill when the user invokes `chaos:help` or asks how to use the CHAOS workflow in the current repository.

## Goals

- Make the workflow discoverable.
- Explain commands, modes, and artifacts.
- Explain **model robustness**: CHAOS commands are designed to be model-portable so they
  work with the weakest supported Copilot model, not only Opus. Opus may infer governance
  intent; weaker models (e.g. Sonnet) require explicit gates. Native interactive selection
  UI is preferred, with numbered chat options as the fallback, and a command always stops
  after asking a material decision. OpenSpec-backed commands (especially `chaos:propose`)
  must invoke OpenSpec rather than hand-writing proposal artifacts. Canonical source:
  `.github/skills/chaos-shared/reference/model-robustness-policy.md` and
  `interactive-decision-protocol.md`.
- Explain the v0 collaboration model: the per-change artifact layout
  (`.chaos/changes/<change-id>/`), the team concurrency policy, and
  `chaos:sync --change` vs `chaos:sync --all`. Canonical source: `.chaos/changes/README.md`.
- Explain the **repository context & MCP integration model**:
  - CHAOS is **GitHub-native** for public/OSS use; **Azure DevOps / Azure Repos** is a
    first-class internal provider, both consumed through one provider-neutral repository
    context contract (`.github/skills/chaos-shared/reference/repository-context-contract.md`).
  - The **repository context resolver** picks an adapter and a source: MCP → `gh`/`az devops`
    CLI → local git → manual.
  - **MCP is optional** — it improves context quality but is never required; **local git
    fallback** always works (with reduced/LOW authority confidence).
  - `chaos:doctor` diagnoses local runtime/tooling/MCP/repository readiness; run it when setup
    seems off, before relying on provider context, or before repo-wide sync.
  - `chaos:sync --all` needs **stronger repository context** because it is repository-wide:
    strict blocks without provider authority; standard needs explicit maintainer confirmation;
    light recommends `--dry-run`.
- Explain **hooks & runtime observability**: hook enforcement is Claude-first. The Copilot
  adapter consumes the same `.chaos/runtime/*` files but does not execute Claude hooks
  natively; treat hook material as advisory/reference. The Copilot adapter is experimental
  until validated.
- Recommend the next command from current repository state, using
  `.chaos/changes/<change-id>/lifecycle.md` for `chaos:help next` when available. `chaos:help
  next` may also consult `.chaos/todo/index.md` and its generated HTML views
  (`.chaos/todo/views/`) when present, for open blockers and recommended next actions.
- Explain `chaos:todo`: the CHAOS backlog curator. It scans CHAOS evidence and turns it into a
  traceable, deduplicated Markdown todo backlog (`.chaos/todo/items/`) with static HTML digest
  views (`.chaos/todo/views/`). It is distinct from `chaos:status` (workspace/governance
  health), `chaos:sync` (governance reconciliation), `chaos:retro` (lessons learned), and
  roadmap files (release direction) — `chaos:todo` answers "what concrete actionable work is
  pending?" Canonical source: `.github/skills/chaos-todo/SKILL.md`.
- Generate or refresh a CHAOS workflow README when requested, using idempotent
  compare-before-write behaviour; the generated README includes the team concurrency and
  mainline sync policy.

## Non-goals

- Do not implement code.
- Do not run lifecycle commands on the user's behalf unless explicitly asked.
- Do not enforce gates.
- Do not silently modify governance files.
- Do not support demo mode.

## Required process

1. Determine the requested help scope.
2. Load command registry and workflow map when available.
3. Inspect repository artifacts if `next` or `--readme` is requested.
4. Present a concise answer in chat.
5. For `--readme`, render a candidate README and compare it with the target before writing.
6. If the existing target is up to date, report `README_UP_TO_DATE` and do not rewrite it.
7. Preview first unless `--write` was explicit.
8. Record generated README metadata and fingerprints inside the README.

## Reference files

- `reference/help-contract.md`
- `reference/autodiscovery-policy.md`
- `reference/next-command-policy.md`
- `reference/readme-generation-policy.md`
- `reference/workflow-map-template.md`
- `reference/report-and-artifact-map.md`
- `reference/command-help-template.md`
- `reference/modes.md`
- `reference/question-bank.md`
- `.github/skills/chaos-shared/reference/repository-context-contract.md`
- `.github/skills/chaos-shared/reference/github-mcp-integration.md`
- `.github/skills/chaos-shared/reference/azure-devops-mcp-integration.md`
