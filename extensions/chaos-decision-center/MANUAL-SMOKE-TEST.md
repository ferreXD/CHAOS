# Manual Smoke Test — CHAOS Decision Center

Automated tests cover the pure logic and the runtime client. The webview + VS
Code wiring must be verified manually with these steps.

## Prerequisites

```bash
cd extensions/chaos-decision-center
npm install
npm run build
```

Open this folder in VS Code and start an Extension Development Host (press **F5**,
or Run → Start Debugging). Open the target repository (the one containing
`.chaos/interactions/`) as the workspace folder in that host window.

## 1. Create a pending decision

Use the Iteration 2 MCP tools, or the Iteration 1 CLI directly. Run from the
repository root. The CLI is a TypeScript file run directly by Node 22 (built-in
type-stripping) — note the `.ts` extension, not `.js`. The default root is
`.chaos/interactions` and the default schema dir is `.chaos/interactions/schema`.

**PowerShell** (the VS Code default terminal on Windows):

```powershell
$cli = "tools/chaos-interaction-runtime/src/cli/chaos-interaction-runtime.ts"
$begin = node $cli begin-command --command chaos:propose --change smoke-change | ConvertFrom-Json
$RUN = $begin.commandRunId
node $cli create-decision --run $RUN --title "Choose execution profile" `
  --option full-strict --option strict-risk-compact --recommended strict-risk-compact
```

**bash** (Git Bash on Windows, or Linux/macOS):

```bash
RUN=$(node tools/chaos-interaction-runtime/src/cli/chaos-interaction-runtime.ts \
  begin-command --command chaos:propose --change smoke-change \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).commandRunId))')

node tools/chaos-interaction-runtime/src/cli/chaos-interaction-runtime.ts \
  create-decision --run "$RUN" --title "Choose execution profile" \
  --option full-strict --option strict-risk-compact --recommended strict-risk-compact
```

> The bash snippet fails in PowerShell (`RUN=$(...)`, `\` continuations, and
> `node -e '...'` are bash syntax). Use the PowerShell block above, or switch the
> terminal to Git Bash.
>
> If you built the package (`npm run build`), you can instead run the compiled
> CLI at `tools/chaos-interaction-runtime/dist/cli/chaos-interaction-runtime.js`.

## 2. Open the Decision Center

- Run **CHAOS: Open Decision Center** from the Command Palette.
- ✅ The panel opens and shows the **Active Decision** (title, context, options,
  with the recommended option marked).

## 3–7. Answer the decision

3. ✅ Select an option (recommended is preselected).
4. ✅ If the decision required a rationale, the field is shown and enforced.
5. Click **Submit answer**.
6. ✅ An information message appears: *“Decision answered. Session is ready to resume.”*
7. ✅ `response.json` is written under
   `.chaos/interactions/decisions/<decisionId>/response.json` with
   `"source": "vscode-decision-center"` and your configured `userName`.

## 8. Status bar

- ✅ Before answering: status bar shows `CHAOS: 1 decision pending`.
- ✅ After answering: status bar returns to `CHAOS: Ready`.
- ✅ Clicking the status bar opens/focuses the Decision Center.

## 9. Ready to Resume

- ✅ The **Ready to Resume** section shows the session with the resume commands
  (`chaos:resume --run/--change/--latest`).
- ✅ **Copy resume instruction** copies the text to the clipboard.

## 9b. Resume the session (Iteration 4)

- Copy the resume instruction (previous step), then in Claude run:

  ```text
  chaos:resume --latest
  ```

- ✅ `chaos:resume` finds the ready-to-resume session, loads its capsule, and
  asks you to confirm / continues from `nextStep` (it does **not** rely on chat
  memory). With multiple candidates it lists them and STOPS for you to choose.
- ✅ The answered decision is incorporated, then marked **consumed** (verify
  `decision.json` state becomes `consumed` only after use).
- ✅ In standard/strict modes a resume report is written (see the command
  contract for exact paths).

> The Decision Center itself does not run `chaos:resume`; it surfaces the copyable
> instruction and the runtime state. Claude runs the command.

## 10. Security — no external assets

- Open the webview Developer Tools (Command Palette →
  *Developer: Open Webview Developer Tools*).
- ✅ Network tab shows **no** external requests (no CDN, no http(s), no fonts).
- ✅ Console shows no CSP violations for legitimate content.

## Additional checks

- **Multiple decisions:** create a second decision on a different change; ✅ it
  appears in the **Decision Queue**; clicking it makes it the active decision.
- **Malformed state:** corrupt a `decision.json`; ✅ the panel shows a
  **Runtime Health Warning** and does not crash.
- **Cancel:** use **Cancel session**; ✅ a confirmation modal appears; on confirm
  the session is cancelled, locks released, and artifacts preserved.
- **Invalid option / missing rationale:** these are rejected with an error
  message (the panel never writes an invalid response).
