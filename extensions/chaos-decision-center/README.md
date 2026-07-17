# CHAOS Decision Center — Iteration 3

A persistent VS Code webview that lets a human inspect pending CHAOS decisions,
choose an answer, and write a **validated** response to the file-backed
interaction runtime.

> The chat thread is not the source of truth. The interaction runtime is the
> source of truth. **The Decision Center is the human-facing UI for that runtime.**

## Relationship to Iterations 1 & 2

| Layer | Package | Audience |
|---|---|---|
| File-backed runtime store | [`tools/chaos-interaction-runtime`](../../tools/chaos-interaction-runtime/) | — |
| MCP server (stdio) | [`tools/chaos-interaction-mcp`](../../tools/chaos-interaction-mcp/) | **Agent-facing** |
| Decision Center (this) | `extensions/chaos-decision-center` | **Human-facing** |

The Decision Center reads and writes the **same** `.chaos/interactions/` state as
the MCP server. It uses the Iteration 1 runtime package directly (imported from
source and compiled into the extension), so:

- It does **not** require the MCP server to be running.
- Responses are written **only** through the runtime's `answerDecision`
  operation (never by hand-editing JSON), with source `vscode-decision-center`.
- `chaos_answer_decision` (MCP) remains a manual/dev bridge; normal human
  responses should now be submitted through this Decision Center.

## Setup

```bash
cd extensions/chaos-decision-center
npm install
npm run build        # compiles the extension + runtime into dist/
```

Then launch an Extension Development Host (VS Code “Run Extension”, or press F5
with this folder open). The compiled entry is
`dist/extensions/chaos-decision-center/src/extension.js` (already referenced by
`main`).

> Node **>= 22.6** is required. The extension is compiled to CommonJS; the pure
> logic modules are also runnable/testable directly via Node type-stripping.

## Commands

| Command | ID | Behaviour |
|---|---|---|
| Open Decision Center | `chaosDecisionCenter.open` | Reveal the panel. |
| Refresh Decision Center | `chaosDecisionCenter.refresh` | Recompute from disk. |
| Answer Active Decision | `chaosDecisionCenter.answerDecision` | Focus the panel to answer (options are chosen in the webview). |
| Cancel Command Session for Decision | `chaosDecisionCenter.cancelDecision` | Cancel the owning session (confirmation required). |
| Copy Resume Instruction | `chaosDecisionCenter.copyResumeInstruction` | Pick a ready session and copy its resume text. |

A status bar item shows `CHAOS: Ready` / `CHAOS: N decisions pending` /
`CHAOS: runtime unavailable`, and opens the panel when clicked.

## Settings (`chaosDecisionCenter.*`)

| Setting | Default | Purpose |
|---|---|---|
| `interactionsRoot` | `.chaos/interactions` | Runtime root (relative to workspace or absolute). |
| `schemaDir` | `.chaos/interactions/schema` | Schema directory. |
| `openOnPendingDecision` | `true` | Open panel when a decision appears. |
| `focusOnPendingDecision` | `false` | Steal focus (off by default). |
| `showNotificationOnPendingDecision` | `true` | Notify on new pending decision. |
| `afterSubmit` | `switchToDashboard` | `switchToDashboard` / `keepDecisionOpen` / `closePanel`. |
| `validateResponses` | `true` | Validate responses against schemas on write. |
| `pollingFallbackMs` | `2000` | Polling fallback interval (0 disables). |
| `maxHistoryItems` | `50` | History cap. |
| `userName` | `vscode-user` | Recorded as `selectedBy` (avoid using an email). |

## UI layout

1. **Active Decision** — command / change / run / decision ids, title, context,
   options (recommended marked, consequences/risks shown), rationale input when
   required, Submit / Cancel session.
2. **Decision Queue** — other pending decisions; click to inspect.
3. **Ready to Resume** — answered sessions with a copyable resume instruction.
4. **History** — recent answered/cancelled/consumed decisions (capped, compact).
5. **Runtime Health Warnings** — missing root/schema, malformed state, stale locks.

## Answering a decision

1. Select an option (the recommended one is preselected).
2. Enter a rationale if the decision requires one.
3. Click **Submit answer**.

The extension validates the selected option and rationale, then calls the
runtime's `answerDecision` (writing `response.json` and appending audit). Invalid
options and missing rationale are rejected with a clear message — the panel never
hand-writes response JSON.

## Ready-to-resume behaviour

After all blocking decisions are answered the session becomes **ready-to-resume**
and appears in that section with a copyable instruction:

```text
chaos:resume --run <commandRunId>
chaos:resume --change <changeId>
chaos:resume --latest
```

As of **Iteration 4** `chaos:resume` is implemented (Claude-native command at
`.claude/commands/chaos-resume.md`). Copy an instruction from this panel and run
it in Claude to continue the paused command from its resume capsule.

**The Decision Center does not run the resumed command itself** — it surfaces the
copyable instruction and the runtime state; `chaos:resume` performs the semantic
continuation from the capsule, answered decisions, and the original source
command's contract. The panel still shows the manual fallback
(*“ask Claude to resume from capsule: `<capsule path>`”*) for environments where
the command is unavailable.

**Live auto-resume (Iteration 5).** If the command was launched through the
`tools/chaos-interaction-runner` live runner *and that runner is still alive*,
answering a decision here may **auto-resume** the same live session — no manual
`chaos:resume` needed. This only applies to runner-controlled sessions: if no
runner is live (crash, timeout, close, or the session was started outside the
runner), the **Ready to Resume** instruction above remains the fallback. Liveness
is a fresh runner lease heartbeat under `.chaos/interactions/runners/`, not a
process id. (No Decision Center UI change is required for this; the auto-resume is
driven entirely by the local runner process.)

## Security posture

- **Strict CSP**: `default-src 'none'`; only nonce'd inline `<style>`/`<script>`.
  No external scripts, CSS, fonts, images, or network (verified by test).
- All decision text/paths/labels/context/rationale/metadata are **escaped**;
  nothing from an artifact is rendered as raw HTML or executed.
- Every webview message is **validated** before any action (untrusted payloads).
- The selected option is validated against `decision.json` by the runtime.
- Writes go only through the runtime, only under `.chaos/interactions/`.
- Malformed state produces a health warning, never a crash. Secrets and full
  artifact bodies are not logged.

## Testing

```bash
npm test        # node --test — pure logic + RuntimeClient integration (28 tests)
npm run typecheck
npm run build
```

Full VS Code integration is validated manually — see
[`MANUAL-SMOKE-TEST.md`](MANUAL-SMOKE-TEST.md).

## Known limitations

- Per-decision cancel is not offered; only **session-level** cancel (the
  Iteration 1 runtime has `cancelCommand`, not a per-decision cancel). See the
  PATCH-SUMMARY follow-up.
- Capsule enumeration is an extension-side read-only adapter (Iteration 1 has no
  capsule-list API).
- Automated tests cover the pure logic and the runtime client; the webview and
  vscode wiring are covered by the manual smoke test.

## Next iteration

**Iteration 4 — `chaos:resume` + resume capsules.** The resume instructions this
panel already surfaces become an executable command; **Iteration 5** adds the
live auto-resume runner.
