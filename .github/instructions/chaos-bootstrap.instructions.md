---
applyTo: ".github/prompts/chaos-init.prompt.md,.github/skills/chaos-init/**"
---

# CHAOS bootstrap instructions

This repository may use CHAOS: **Controlled Human-led Agent-Orchestrated SDLC**.

When running `chaos:init` or working on CHAOS governance files:

- Discover existing ADRs, docs, README files, specs, and repo structure before asking questions.
- Do not ask for context already present in repository evidence.
- Distinguish facts, inferences, assumptions, conflicts, risks, and open questions.
- Treat ADRs/docs as evidence, not automatically accepted truth.
- Do not silently resolve contradictions.
- Do not implement production code during bootstrap.
- Always generate `.chaos/bootstrap-report.md`.
- Record mode used, questions asked, user answers, scope decisions, source inventory, assumptions, conflicts, and open questions.
- Generate folder indexes under `.chaos/decisions`, `.chaos/rules`, `.chaos/commands`, and `.chaos/gates`.
- Generate `.chaos/config.yaml` as the lightweight repository-conventions file.
- Mark generated commands as `implemented`, `defined-only`, `planned`, or `external`.
- Require explicit confirmation before excluding a major available documentation track.
- Require explicit confirmation before treating `Proposed` ADRs as accepted working posture.
- Generate or update README.md only when requested or allowed.
- Preserve existing governance files and README content unless the user approves replacement.
- Include provenance and confidence in generated files.

Default `chaos:init` UX is guided-confirmation:

1. Discover.
2. Summarize.
3. Ask only high-impact missing questions.
4. Generate.
5. Report.

`--auto` means best-effort generation with conservative assumptions.

`--guided` means section-by-section wizard.

## Confidence and knowledge classification doctrine

`chaos:init` must generate `.chaos/constitution.md` with a doctrine requiring every CHAOS finding, recommendation, approval, verification, gate result, and verdict to label:

- knowledge type: `FACT`, `INFERENCE`, `ASSUMPTION`, `UNKNOWN`, or `CONFLICT`;
- confidence: `HIGH`, `MEDIUM`, or `LOW`.

Final verdicts must include confidence, evidence coverage, and assumption load.

Never generate a constitution that allows confidence-less verdicts, unlabeled assumptions, or inferences disguised as facts.

## Toolchain preflight

`chaos:init` must check required tools one by one before or during generation:

1. Git: `git --version`
2. Node.js: `node --version` and verify `>= 20.19.0` for OpenSpec
3. npm: `npm --version`
4. OpenSpec CLI: `openspec --version`

If a required tool is missing, the command must ask the user whether to install now, show manual installation instructions, continue in degraded mode, defer with rationale, or abort.

No tool may be installed silently. If installing OpenSpec is approved, use `npm install -g @fission-ai/openspec@latest` after Node/npm pass.

Record the toolchain preflight in `.chaos/bootstrap-report.md`.

## Config generation

`chaos:init` must generate `.chaos/config.yaml`.

The config centralises repository conventions needed by commands: paths, toolchain commands, validation commands, agent locations, and protected-file policies.

The config must not encode architectural decisions, secrets, credentials, connection strings, environment-private data, hidden approval switches, or giant prompt/rule bodies.

If `.chaos/config.yaml` already exists, preserve it by default, ask before semantic changes, and record config decisions in `.chaos/bootstrap-report.md`.
