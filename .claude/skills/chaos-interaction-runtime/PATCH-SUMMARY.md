# PATCH SUMMARY — CHAOS Interaction Runtime, Iteration 6 (command-contract integration)

**Scope:** Backfill iteration (implemented after Iteration 7). Integrates the CHAOS
Interaction Runtime into the actual CHAOS command contracts: a shared command
protocol skill plus per-command `## Interaction Runtime Obligations` sections, so
commands preflight the runtime, create material decisions and stop on `mustStop`,
hand off to `chaos:resume`, and complete/release locks — leaving the evidence
Iteration 7 diagnostics expect.
**Date:** 2026-07-07

> **Iteration 7 was preserved.** No diagnostics package code, health model, doctor/
> status reporters, or hook/advisory enforcement was redesigned, removed, or rolled
> back. Iteration 6 only adds command-side contracts + static tests and tiny additive
> notes.

## Confirmation: no production code modified

No production application source, production tests, or migrations were changed. No
runtime/MCP/runner/diagnostics source was modified. Changes are Markdown command
contracts, a new shared skill, one new static test file in the diagnostics package,
and additive doc pointers.

## Files added

- `.claude/skills/chaos-interaction-runtime/SKILL.md` — shared command protocol.
- `.claude/skills/chaos-interaction-runtime/reference/command-preflight-protocol.md`
- `.claude/skills/chaos-interaction-runtime/reference/material-decision-protocol.md`
- `.claude/skills/chaos-interaction-runtime/reference/runtime-resume-handoff.md`
- `.claude/skills/chaos-interaction-runtime/reference/command-completion-policy.md`
- `.claude/skills/chaos-interaction-runtime/reference/diagnostics-integration-contract.md`
- `.claude/skills/chaos-interaction-runtime/reference/fallback-protocol.md`
- `.claude/skills/chaos-interaction-runtime/PATCH-SUMMARY.md` (this file)
- `tools/chaos-interaction-diagnostics/test/commandContractIntegration.test.ts` — 18 static tests.

## Files modified (additive `## Interaction Runtime Obligations` sections)

Mutating commands: `chaos-apply.md`, `chaos-propose.md`, `chaos-review.md`,
`chaos-archive.md`, `chaos-verify.md`, `chaos-sync.md`, `chaos-todo.md`,
`chaos-retro.md`, `chaos-code-review.md`.
Read-only/support: `chaos-status.md`, `chaos-archaeology.md`, `chaos-init.md`,
`chaos-help.md`. Resume alignment pointer: `chaos-resume.md` (existing Iteration 4
contract preserved; added a "Shared protocol" pointer only).
Doc pointer: `.chaos/interactions/README.md` (Iteration 6 implementation-status line).

## Commands updated

Every existing runtime-relevant command now links the shared protocol and carries
command-specific obligations. Alias stubs `chaos-proposal.md` / `chaos-archeology.md`
were left untouched (they delegate to `chaos-propose` / `chaos-archaeology`).

## Shared protocol added

Lifecycle: `runtime-preflight → command-execution → material-decision? →
create-runtime-decision → mustStop → STOP → (answer) → chaos:resume →
incorporate → mark-consumed → complete-command → diagnostics-clean`. Six reference
contracts cover preflight, material decisions, resume handoff, completion, diagnostics
integration, and MCP-unavailable fallback (with the explicit no-silent-bypass rule).

## Iteration 7 integration notes

- The Iteration 7 `commandContractProbe` now reports **`IR-CMD-INTEGRATION-OK`
  ("Write commands reference the runtime")** for `chaos-apply/verify/archive` — it
  previously reported `IR-CMD-INTEGRATION-PARTIAL`. This is the intended coherence
  outcome; the probe itself was not changed.
- Commands leave the exact evidence Iteration 7 expects: pending decisions (created +
  stopped), ready-to-resume sessions (answered → `chaos:resume`), released locks on
  completion, no continue-after-`mustStop`, no production writes while a decision
  blocks a change. No Iteration 7 artifact/event shape was changed.
- No new diagnostics finding/event was required; where a command cannot act safely it
  emits a Todo Candidate (existing contract) rather than needing a new model.

## Tests / static validation added

`tools/chaos-interaction-diagnostics/test/commandContractIntegration.test.ts` — 18
static checks: shared protocol + fallback exist; mutating commands link the protocol
and include preflight / `chaos_create_decision` / `mustStop`; apply blocks on pending
same-change decision; propose/review/archive/sync/todo obligations; resume forbids
chat memory and consumes only after incorporation; doctor/status preserve Iteration 7
integration; no bypass language; no auto-resume-after-death overclaim; no
destructive-auto-repair-by-default instruction; diagnostics references present.

## Validation performed

- Diagnostics `node --test` → **54 pass** (36 prior + 18 new command-contract tests).
- `tsc --noEmit` and `tsc` build clean.
- CLI `json` against the real repo confirms `command-contract` category →
  `IR-CMD-INTEGRATION-OK`.
- Runtime 38 / MCP 33 / runner 48 / extension 31 unaffected (no code touched).

## Manual validation status

Documented: seed a pending decision → inspect `chaos:apply` (contract stops on
same-change pending decision) → `chaos:status` reports it via Iteration 7 diagnostics →
`chaos:resume` resumes once answered → confirm no command claims it may bypass the
runtime. The contract-level obligations are covered by the static tests; end-to-end
model-in-the-loop execution needs an interactive Claude + Decision Center session.

## Known limitations

- Integration is at the **contract** level (Markdown obligations + static validation).
  Runtime enforcement of those obligations at model runtime is the job of Iteration 7's
  advisory hook guard, not this iteration.
- The `commandContractProbe` keyword check covers `chaos-apply/verify/archive`; other
  commands' obligations are validated by the new static tests, not by the probe.

## Explicit non-goals (not implemented, by design)

No new diagnostics framework (Iteration 7 owns it); no live auto-resume runner
(Iteration 5); no `chaos:delete`/discard; no Decision Center / MCP / diagnostics
redesign; no production application change; no Copilot migration; no rollback/removal
of Iteration 7.

## Update — UX feature flags + decision batching (post-Iteration 6)

Added at the user's request; additive, no redesign.

- **Config (`.chaos/config.yaml` → `policies.interactionRuntime`):** boolean
  `commands.enabled` (master opt-out; `false` → classic in-chat decisions, no runtime/
  Decision Center), `commands.decisionBatching` (`sequential` | `batch-independent`,
  default `batch-independent`), `commands.fallbackWhenDisabled`, and boolean
  `autoResume.enabled` + `autoResume.adapter` (`none`|`mock`|`claude-code`) — the future
  live Claude adapter is gated here and ships opt-in.
- **Shared skill:** `command-preflight-protocol.md` gained a **Step 0 enablement gate**;
  new `reference/decision-batching-policy.md` (sequential vs batch-independent, with the
  honest "dependent decisions still need a later round" rule); `runtime-resume-handoff.md`
  documents the `autoResume` feature flag; `SKILL.md` + `diagnostics-integration-contract.md`
  summarise the flags; `chaos-apply.md` references them.
- **Diagnostics (additive):** `DiagnosticsConfig.commandsEnabled` (CLI `--commands-enabled`
  / `--no-commands-enabled`, env `CHAOS_IR_COMMANDS_ENABLED`, JSON config; default true).
  `commandContractProbe` now emits `IR-CMD-INTEGRATION-DISABLED` (INFO) when opted out
  instead of a partial-integration gap. Batching creates multiple pending decisions on one
  session — already supported by the runtime (`activeDecisionIds` accumulates); no runtime
  code change.
- **Tests:** diagnostics **60 pass** (6 new: enablement gate, batching policy, SKILL flags,
  config flags, apply flag reference, opt-out probe behaviour). Typecheck/build clean. CLI
  `--no-commands-enabled` confirmed → `IR-CMD-INTEGRATION-DISABLED`.
- **No production code / no Iteration 7 redesign:** the health model, reporters, and hook
  guard are unchanged; only an additive config field + one probe branch. The hook guard
  needs no change — with commands opted out no decisions are created, so it naturally
  no-ops.

## Self-audit

- **Files added:** shared skill (SKILL + 6 references + this summary) + 1 diagnostics test.
- **Files modified:** 14 command contracts + `.chaos/interactions/README.md` (additive).
- **Commands updated:** apply, propose, review, archive, verify, sync, todo, retro,
  code-review, status, archaeology, init, help, resume (pointer).
- **Tests run:** diagnostics 54 (all pass); typecheck/build clean; sibling suites unaffected.
- **Production code changed:** no.
- **Iteration 7 preserved:** yes — no diagnostics code/model/reporter/hook change; only
  the probe's *result* improved from PARTIAL → OK as intended.
- **Iteration 7 diagnostics expectations changed:** none. Command integration produces
  the state the existing model already expects.
- **Commands still lacking integration & why:** alias stubs `chaos-proposal.md` /
  `chaos-archeology.md` (intentional — they forward to the canonical commands).
- **Follow-up:** a committed advisory-hook `settings.json` example wiring Iteration 7's
  `RuntimeContractGuard` to enforce these obligations at runtime (optional, out of scope).
