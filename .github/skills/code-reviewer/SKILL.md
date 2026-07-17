---
name: code-reviewer
description: Read-only code review procedure for architecture compliance, AGENTS.md convention validation, project skill usage audits, PR reviews, maintainability reviews, and code quality assessments. Use when reviewing code, checking architecture, validating conventions, reviewing PRs, auditing quality, or assessing whether code follows project-defined skills.
---

> Copilot agent skill. Keep this file named `SKILL.md`; supplementary material lives in `reference/`.

# Code Reviewer Skill

Use this skill to perform a disciplined, evidence-based, read-only code review.

The skill is optimized for project-specific review workflows where `AGENTS.md` and project skills define the actual authority model.

## Core rule

`AGENTS.md` is the highest project-local authority. Project skills are mandatory only when `AGENTS.md` or the reviewed context makes them applicable. Generic best practices come after project-specific rules.

## Required procedure

Follow the review workflow in:

- `reference/review-workflow.md`

Apply the authority model from:

- `reference/authority-model.md`

Apply the skill applicability policy from:

- `reference/skill-applicability-policy.md`

Use the severity model from:

- `reference/severity-model.md`

Write the review using:

- `reference/output-format.md`

Complete the review checklist from:

- `reference/completion-checklist.md`

## Operating boundaries

You may read files, inspect diffs, search code, and run read-only discovery commands.

You must not edit files, apply patches, format code, install dependencies, run migrations, create commits, delete files, or execute untrusted scripts.

## Missing authority behaviour

If `AGENTS.md` is missing, do not assume the project architecture.

Ask the user whether to:

1. provide `AGENTS.md`,
2. authorize a generic best-effort review with capped confidence, or
3. stop.

If a mandatory skill referenced by `AGENTS.md` is missing, ask the user whether to:

1. provide/install the skill,
2. continue without it with capped confidence, or
3. stop.

## Review confidence

Cap confidence when:

- `AGENTS.md` is missing,
- mandatory skills are missing,
- only partial diffs are available,
- tests are unavailable,
- line numbers cannot be verified,
- the reviewed code depends on unseen runtime behaviour.

Always explain confidence caps.
