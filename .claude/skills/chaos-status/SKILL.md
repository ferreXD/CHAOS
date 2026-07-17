---
name: chaos-status
description: Audit a repository's CHAOS workspace and produce .chaos/status-report.md with readiness, blockers, warnings, source inventory, command implementation matrix, and next actions.
---

# chaos-status

Use this skill when the user asks to run `chaos:status`, review CHAOS workspace readiness, audit a CHAOS repository, or validate the output of `chaos:init`.

## Goal

Audit whether the repository's CHAOS workspace is coherent, auditable, and safe to use as the operating surface for Controlled Human-led Agent-Orchestrated SDLC.

## Invocation

Tool-specific slash command:

```text
/chaos-status
```

Public CHAOS command name:

```text
chaos:status
```

## Behaviour

1. Discover required CHAOS files.
2. Inspect `AGENTS.md`, `.chaos/*`, `.chaos/config.yaml`, and referenced sources.
3. Audit config health and repository convention coherence.
4. Validate bootstrap audit trail.
5. Validate source inventory exactness.
6. Validate scope and ADR status handling.
7. Validate decisions, rules, commands, and gates.
8. Validate README honesty.
9. Audit the v0 change-scoped layout & collaboration posture (`CS-CHG-*`,
   `CS-SYNCPOSTURE-*`): config declares the change-scoped layout / naming / sync-role
   policies; command contracts are not legacy-only; `commands/index.md` documents the new
   layout; `AGENTS.md` / `README.md` / `.chaos/README.md` mention team concurrency and
   mainline sync; and report repository-wide sync posture. Canonical contract:
   `.chaos/changes/README.md`. Do not mutate shared files except through confirmed remediation.
10. Detect protected documentation drift in `AGENTS.md` / `AGENT.md` and root `README.md`.
11. Offer confirmed patch/rewrite remediation for protected docs when drift is found.
12. Run toolchain preflight checks one by one, using `.chaos/config.yaml` commands when present and defaults otherwise.
13. Produce the status report.
14. Recommend the next command.

## Output

Write `.chaos/status-report.md` unless the user passes `--no-write`.

Use the report structure from:

```text
.claude/skills/chaos-status/reference/status-contract.md
```

Use the checks from:

```text
.claude/skills/chaos-status/reference/check-catalog.md
```

Use the mode semantics from:

```text
.claude/skills/chaos-status/reference/modes.md
```

Use the protected documentation remediation policy from:

```text
.claude/skills/chaos-status/reference/protected-doc-remediation.md
```

## Interaction Runtime summary (Iteration 7)

When the repository has the CHAOS Interaction Runtime (`.chaos/interactions/`), `chaos:status`
includes a **compact** `## Interaction Runtime` block: runtime health (`healthy/degraded/blocked`),
pending decisions, ready-to-resume sessions, blocking locks, and a single next suggested action
(e.g. `chaos:resume --run RUN-...`). Keep it compact — the full detail belongs to `chaos:doctor`.

- Source: `tools/chaos-interaction-diagnostics/` (read-only). Embed via
  `node tools/chaos-interaction-diagnostics/src/cli/chaos-interaction-diagnostics.ts status`.
- Read-only: `chaos:status` never mutates interaction state and never performs repair.

## Todo Candidates (optional)

`chaos:status` MAY end its report with an optional `## Todo Candidates` section listing
material, actionable workspace-health findings (e.g. a repeated `CS-HARDEN-*`/`CS-REPOCTX-*`
gap, a real blocker, not routine advisory noise), using the shared fields in
`.claude/skills/chaos-todo/reference/todo-candidate-contract.md`. `chaos:status` does not
create durable todo items — only `chaos:todo` curates `.chaos/todo/items/`.

## Repository context / MCP readiness audit (vNext)

`chaos:status` audits whether the repository declares and is ready for the provider-neutral
repository-context / MCP integration. Treat MCP **absence as a warning**, not a universal
failure — only escalate when config/mode requires provider context.

Audit:

- whether `.chaos/config.yaml` declares `integrations.repository` provider policy and
  `policies.repositoryContext`;
- whether GitHub/Azure provider docs exist under
  `.claude/skills/chaos-shared/reference/` (`github-mcp-integration.md`,
  `azure-devops-mcp-integration.md`, `mcp-security-policy.md`, `mcp-tool-profiles.md`,
  `repository-context-contract.md`, `repository-context-resolution-policy.md`);
- whether MCP is expected but unavailable (warning unless required);
- whether repo-wide sync requires provider context
  (`repoWideSyncRequiresProviderContext`);
- whether commands declare how they consume repository context;
- whether `chaos:doctor` is available (skill + agent present);
- whether the local-git fallback policy is documented.

Report these as `CS-REPOCTX-*` findings (advisory in `--light`; MAJOR by default; BLOCKER in
`--strict` only when config/mode requires provider context that is undeclared). Canonical
contract: `.claude/skills/chaos-shared/reference/repository-context-contract.md`.

## Hard blockers

Report `BLOCKED` when any of these happen:

- `.chaos/bootstrap-report.md` is missing after `chaos:init`.
- Major track exclusion exists without explicit confirmation.
- Proposed/Draft ADRs are treated as accepted without explicit confirmation.
- Source inventory cannot distinguish verified/missing/inferred.
- `AGENTS.md` is missing.
- Commands are documented without implementation status.
- Rules are only inspirational and not operational.
- Gates have no blockers or evidence requirements.

## Do not

- Implement code.
- Rewrite ADRs.
- Silently fix governance files.
- Invent missing source paths.
- Mark inferred sources as verified.
- Treat file existence as maturity.

## Confidence doctrine audit

Audit `.chaos/constitution.md` for a confidence/knowledge classification doctrine.

The workspace is incomplete if the constitution does not require CHAOS findings and verdicts to distinguish:

- `FACT`
- `INFERENCE`
- `ASSUMPTION`
- `UNKNOWN`
- `CONFLICT`

and does not require confidence levels:

- `HIGH`
- `MEDIUM`
- `LOW`

Final verdicts must include evidence coverage and assumption load.

If this concern is missing or weak, report it and ask the user whether to patch the constitution, create a remediation plan, defer with rationale, mark as accepted risk, or do nothing. Do not patch without confirmation.

Use:

```text
.claude/skills/chaos-status/reference/confidence-model.md
.claude/skills/chaos-status/reference/remediation-model.md
```

## Toolchain preflight audit

`chaos:status` must audit whether required CHAOS/OpenSpec tools are installed and usable. Use `reference/toolchain-preflight.md`.

Check one by one:

1. `git --version`
2. `node --version` and verify Node.js `>= 20.19.0`
3. `npm --version`
4. `openspec --version`

If a tool is missing or invalid, include a finding and a remediation prompt. Ask the user whether to install now, show manual installation instructions, continue in degraded mode, defer with rationale, or abort.

Do not install anything without explicit confirmation. Missing OpenSpec should make OpenSpec-dependent commands `defined-only` or `not ready`, not silently ready.


## Config health audit

`chaos:status` must audit `.chaos/config.yaml` using:

```text
.claude/skills/chaos-status/reference/config-audit.md
```

Report one of:

- `CONFIG_OK`
- `CONFIG_MISSING`
- `CONFIG_PARTIAL`
- `CONFIG_STALE`
- `CONFIG_CONFLICT`
- `CONFIG_UNSUPPORTED_VERSION`

The config file is only a repository-convention contract. It must not contain architectural decisions, secrets, credentials, connection strings, hidden approval switches, or giant prompt/rule bodies.

If config is missing, partial, stale, conflicting, or unsupported, include a finding and ask the user whether to fix now, create a remediation plan, defer with rationale, mark accepted risk, or do nothing. Do not patch without confirmation.

## Protected documentation drift

`chaos:status` must check `AGENTS.md` / `AGENT.md` and root `README.md` against current CHAOS reality.

If drift exists, report it and offer patch/rewrite remediation. These files are protected, not immutable: editing is allowed only after explicit confirmation and patch preview. If config blocks edits, offer a protected-doc override or config policy update.
