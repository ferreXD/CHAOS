# PATCH SUMMARY — CHAOS Interaction Runtime, Iteration 4 (chaos:resume)

**Scope:** Claude-native `chaos:resume` + runtime/MCP capsule-discovery API so a
paused CHAOS command can be resumed from structured runtime state (same thread or
a new thread) after decisions are answered in the Decision Center.
**Date:** 2026-07-07

> Iteration 4 touches four packages; this is the package-level summary for the new
> primary deliverable (`.claude/skills/chaos-resume`). It also records the
> runtime/MCP/extension changes. No root `PATCH-SUMMARY.md` was created.

## Confirmation: no production code modified

No production application source, production tests, migrations, OpenSpec changes,
ADR content, or other CHAOS command contracts were changed. Changes are confined
to the interaction-runtime packages (`tools/`), the Decision Center extension
(`extensions/`), and the new Claude-native resume artifacts (`.claude/`).

## Files added

### Claude-native (resume command/agent/skill)
- `.claude/commands/chaos-resume.md`
- `.claude/agents/chaos-resume-orchestrator.md`
- `.claude/skills/chaos-resume/SKILL.md`
- `.claude/skills/chaos-resume/reference/resume-command-contract.md`
- `.claude/skills/chaos-resume/reference/resume-candidate-resolution.md`
- `.claude/skills/chaos-resume/reference/resume-capsule-contract.md`
- `.claude/skills/chaos-resume/reference/resume-decision-consumption-policy.md`
- `.claude/skills/chaos-resume/reference/resume-state-machine.md`
- `.claude/skills/chaos-resume/reference/resume-mcp-tool-contract.md`
- `.claude/skills/chaos-resume/reference/resume-safety-policy.md`
- `.claude/skills/chaos-resume/reference/resume-examples.md`
- `.claude/skills/chaos-resume/PATCH-SUMMARY.md` (this file)

### Tests
- `tools/chaos-interaction-runtime/test/resumeDiscovery.test.ts`
- `tools/chaos-interaction-mcp/test/mcpResumeCandidates.test.ts`
- `tools/chaos-interaction-mcp/test/resumeArtifacts.test.ts`

### MCP tool
- `tools/chaos-interaction-mcp/src/tools/findResumeCandidates.ts`

## Files modified

- `tools/chaos-interaction-runtime/src/store/capsuleStore.ts` — added read-only `list()`.
- `tools/chaos-interaction-runtime/src/model/resumeCapsule.ts` — added `ResumeCapsuleSummary`, `ResumeCandidate`, filter types.
- `tools/chaos-interaction-runtime/src/services/interactionRuntime.ts` — added `getResumeCapsule`, `listCapsules`, `findResumeCandidates`.
- `tools/chaos-interaction-runtime/README.md` — discovery API section.
- `tools/chaos-interaction-mcp/src/tools/getResumeCapsule.ts` — now uses the runtime discovery API.
- `tools/chaos-interaction-mcp/src/tools/registry.ts` — registers `chaos_find_resume_candidates` (13 tools).
- `tools/chaos-interaction-mcp/test/mcpTools.test.ts`, `test/mcpSmoke.test.ts` — updated tool count/list.
- `tools/chaos-interaction-mcp/README.md` — tool table rows.
- `extensions/chaos-decision-center/src/runtime/runtimeClient.ts` — uses `store.capsules.list()` (removed ad-hoc fs enumeration).
- `extensions/chaos-decision-center/README.md` — real `chaos:resume` usage (removed "Planned Iteration 4" wording).
- `extensions/chaos-decision-center/MANUAL-SMOKE-TEST.md` — resume step + PowerShell/bash CLI variants.

## Files removed

- `tools/chaos-interaction-mcp/src/capsuleLookup.ts` — replaced by the official runtime discovery API.

## Runtime API additions (read-only, no state mutation)

- `getResumeCapsule(commandRunId): ResumeCapsule | null`
- `listCapsules(filter?): ResumeCapsuleSummary[]` — filter by `changeId` / `commandRunId` / `sourceCommand` / `state` / `readyToResumeOnly`.
- `findResumeCandidates(filter?): ResumeCandidate[]` — ready-to-resume sessions joined with capsules; `{ latest: true }` collapses to newest.
- `CapsuleStore.list()` backs them; malformed capsule files are skipped, not thrown. Existing capsule format is unchanged.

## MCP tool additions

- `chaos_find_resume_candidates` → `NOT_FOUND` / `FOUND` / `MULTIPLE_FOUND` (the last sets `mustStop: true`); filters `changeId` / `commandRunId` / `sourceCommand` / `latest`.
- `chaos_get_resume_capsule` refactored onto the runtime discovery API (behaviour unchanged).

## Claude command / agent / skill additions

- Command `chaos:resume` with a non-negotiable execution contract at the top.
- Agent `chaos-resume-orchestrator`.
- Skill `chaos-resume` + 8 reference contracts (command, candidate resolution,
  capsule, decision-consumption, state machine, MCP tools, safety, examples).

## Docs updates

Runtime README (discovery API), MCP README (tool rows), Decision Center README
(real `chaos:resume` usage; the panel surfaces copyable instructions but does not
run the command), MANUAL-SMOKE-TEST (answer → copy instruction → `chaos:resume`).

## Tests added / validation performed

- Runtime `node --test` → **33 pass** (6 new discovery tests: summaries, changeId
  filter, none/one/many/latest candidates, malformed-capsule safety, no-mutation).
- MCP `node --test` → **33 pass** (5 new `chaos_find_resume_candidates` tests +
  5 static resume-artifact validations; existing suites updated for 13 tools).
- Extension `node --test` → **31 pass** (capsule refactor; unchanged behaviour).
- `tsc --noEmit` clean and `tsc` build ok for all three packages.
- Compiled MCP server dist-smoke over stdio: **13 tools**, `chaos_find_resume_candidates` present and returns `NOT_FOUND` on empty state.

Static command validation (per the brief): asserts command/agent/skill/8
references exist and that the command text contains the required safety
language — read runtime first, do not rely on chat memory, multiple candidates →
STOP, consume only after incorporation, MCP preferred + file fallback, no
candidate → do not invent context.

## Manual smoke instructions

`extensions/chaos-decision-center/MANUAL-SMOKE-TEST.md` (step 9b): begin command
→ create decision → answer in Decision Center → copy resume instruction →
`chaos:resume --latest` → verify capsule loaded, decision incorporated then
consumed, resume report written, session/lock finalized. Not executed here (needs
an interactive Claude + VS Code session).

## Known limitations

- `chaos:resume` performs **semantic** continuation (from capsule + answered
  decisions + source-command contract), not literal chat-thread restoration — by
  design.
- The live auto-resume runner is **not** implemented (Iteration 5).
- Resume report paths/decision-event writes depend on the resumed command's own
  change-artifact contract; where absent, the command records a note/Todo instead.
- The MCP README "Manual dev flow" still describes `chaos_answer_decision` as the
  bridge; it remains valid (dev/test bridge) though the Decision Center now exists.

## Explicit non-goals (not implemented, by design)

Live auto-resume runner; broad command-contract rewrites; hook enforcement;
`chaos:delete`/discard; GitHub/Azure issue sync; cloud dashboard/remote approval;
Copilot migration; any production application change.

## Self-audit

- **Files added:** 12 `.claude` artifacts + 1 MCP tool + 3 test files (listed above).
- **Files modified:** runtime (3 src + README), MCP (2 src + 2 tests + README),
  extension (1 src + 2 docs); one MCP file removed.
- **Tests run:** runtime 33, MCP 33, extension 31 — all pass; typecheck clean;
  builds ok; compiled MCP stdio smoke ok.
- **Production code changed:** no.
- **Runtime/MCP API gaps remaining:** the Iteration 1/2 "no capsule-list API"
  follow-up is now **resolved** (official `listCapsules`/`findResumeCandidates`;
  MCP and extension both consume it; `capsuleLookup.ts` removed).
- **Broader command rewrites:** none needed. `chaos:resume` delegates to existing
  command skills/agents at `nextStep` rather than rewriting them, so no other
  CHAOS command contract was modified.
- **Resume ambiguity:** handled explicitly — multiple candidates → present + STOP;
  none → report + do not invent; unknown `sourceCommand` → stop and ask.
- **Follow-up before Iteration 5 (live auto-resume runner):** a runner can reuse
  `findResumeCandidates` + the consume/complete tools; the semantic-continuation
  boundary and "consume only after use" policy defined here are the contract it
  must honour.
