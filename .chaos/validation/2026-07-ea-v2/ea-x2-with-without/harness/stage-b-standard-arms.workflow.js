export const meta = {
  name: 'ea-x2-stage-b-standard-arms',
  description: 'EA-X2 with/without, Stage-B standard lifecycle: record-emitting governed arm (Arm A) vs plain (Arm B) over the 3 frozen brownfield tasks. Same tasks, same held-out oracles, plain-arm prompt byte-identical to the frozen baseline; only the governed arm moves from the legacy 11-artifact standard lifecycle to record emission + chaos:render. Sequential for clean per-arm output-token deltas.',
  phases: [
    { title: 'Pair 1 — auth gate' },
    { title: 'Pair 2 — soft-delete' },
    { title: 'Pair 3 — optimistic concurrency' },
  ],
}

// Frozen baseline fields + Stage-B render telemetry (additive, optional).
const ARM_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    arm: { type: 'string' },
    summary: { type: 'string', description: '2-4 sentences on what you did' },
    codeFilesChanged: { type: 'array', items: { type: 'string' }, description: 'src/ and tests/ files you changed' },
    testsPassed: { type: 'integer' },
    testsFailed: { type: 'integer' },
    testsGreen: { type: 'boolean' },
    wallTimeSeconds: { type: 'integer', description: 'END-START from the system clock (date +%s) bracketing your work' },
    buildOk: { type: 'boolean' },
    governanceArtifactsProduced: { type: 'array', items: { type: 'string' }, description: 'CHAOS artifacts that now exist, repo-relative (empty for the plain arm)' },
    materialDecisionsRecorded: { type: 'array', items: { type: 'string' }, description: 'material decisions you recorded (empty for the plain arm)' },
    governanceArtifactsReadAndUsed: { type: 'array', items: { type: 'string' }, description: 'governance artifacts you actually READ and that changed a choice you made (empty for the plain arm)' },
    selfAssessment: { type: 'string', description: 'honest note on confidence, gaps, anything you were unsure about' },
    // --- Stage-B telemetry ---
    recordsEmitted: { type: 'array', items: { type: 'string' }, description: 'record files written under .chaos/changes/<id>/records/ (Stage-B arm only)' },
    renderInvocations: { type: 'integer', description: 'how many times you ran chaos-render (--check or --write)' },
    renderFailures: { type: 'integer', description: 'how many render invocations exited non-zero (validation rejected a record)' },
    renderFailureNotes: { type: 'string', description: 'what the renderer rejected and how you fixed the RECORD; empty if none' },
    handWroteRenderedArtifact: { type: 'boolean', description: 'HONESTY FIELD: true if you ever hand-wrote or hand-edited change.md / lifecycle.md' },
  },
  required: ['arm', 'summary', 'codeFilesChanged', 'testsPassed', 'testsFailed', 'testsGreen', 'wallTimeSeconds', 'buildOk'],
}

// ---- Plain arm: VERBATIM from the frozen ea-x2-arms.workflow.js. Do not drift. ----
function plainPrompt(p) {
  return `You are a pragmatic senior software engineer. Implement a change in an existing .NET 8 repository and keep the tests green. Work ONLY inside the git worktree at:
  ${p.wtB}

FIRST, run \`date +%s\` and remember the number as START.

=== TASK ===
${p.statement}
=== END TASK ===

Rules of engagement (this is a PLAIN engineering task — no governance process):
- The API code is under \`src/TaskTracker.Api\`; the tests are under \`tests/TaskTracker.Tests\`. Edit those.
- Keep it green: \`dotnet test tests/TaskTracker.Tests/TaskTracker.Tests.csproj\` must pass (0 failed) when you finish. Also confirm \`dotnet build\` succeeds.
- Do NOT read, use, or write any governance files: do not touch AGENTS.md, anything under \`.chaos/\`, or \`openspec/\`. No proposals, reviews, reports, or decision logs. Just implement the change well.
- Do NOT spawn subagents. Do the work yourself. Do NOT git commit — leave changes in the working tree.
- Implement exactly the contract in the task (headers, params, status codes, field names) so behaviour is testable.

WHEN DONE: run \`date +%s\` as END, compute wallTimeSeconds = END - START. Run the final \`dotnet test\` and record passed/failed counts. Return the structured result with arm="plain". Leave the governance arrays empty.`
}

// ---- Governed arm: the CURRENT (Stage-B) standard lifecycle — records + renderer. ----
function stageBStandardPrompt(p) {
  return `You are executing the real CHAOS governed lifecycle (Controlled, Human-led,
Agent-Orchestrated software delivery) on a change in this repository, at **--standard** rigor, in
its **Stage-B ledger-first** form: you emit STRUCTURED RECORDS and a deterministic renderer
produces the human-readable artifacts. You never hand-write \`change.md\` or \`lifecycle.md\`.
Work ONLY inside the git worktree at:
  ${p.wtA}

This repo is CHAOS-governed. Before deciding anything, DISCOVER and READ the governance:
- \`AGENTS.md\` (entrypoint, minimum pre-edit behaviour, protected files)
- \`.chaos/constitution.md\` (principles + the confidence/knowledge doctrine: FACT/INFERENCE/ASSUMPTION/UNKNOWN + HIGH/MEDIUM/LOW)
- \`.chaos/rules/index.md\` (executable rules R-001..R-007 — especially R-003 keep tests green, R-004 domain must not depend on the HTTP layer, R-005 keep \`TaskState\` naming, R-006 protected files)
- \`.chaos/architecture.md\` (boundary model, testing posture, and the NON-GOALS: auth / persistence are called out as out-of-scope, strict, decision-bearing work)
- \`.claude/skills/chaos-shared/reference/record-emission.md\` — **the writer protocol you MUST follow**
- \`.claude/skills/chaos-shared/reference/change-template.md\` §2 (decision-entry format; the ledger is hand-appended) and §5 (record files + per-phase verdict enums)
- \`tools/chaos-render/schema/phase-facts.schema.json\` and \`contract.schema.json\` — the exact field shapes. Read these BEFORE authoring records; they are strict (\`additionalProperties: false\`).
Do NOT copy the legacy reference lifecycle at \`.chaos/changes/add-task-query-filters/\` — that is a
pre-Stage-B change kept only as a read-fallback; its 11-artifact shape is retired.

FIRST, run \`date +%s\` and remember the number as START.

=== TASK (the change to deliver) ===
${p.statement}
=== END TASK ===

Execute the governed **standard** lifecycle for change id "${p.changeId}". The artifact set is the
universal one: the hand-appended ledger + records under \`.chaos/changes/${p.changeId}/records/\`,
with \`change.md\` and \`lifecycle.md\` produced ONLY by the renderer. There is no
\`proposal-report.md\`, \`proposal-review.md\`, \`apply-report.md\`, \`verification.md\` or
\`approval.md\` in this model — do not create them.

1. FRAME (chaos:propose --standard)
   - Note explicitly that this task touches an architecture NON-GOAL / decision-bearing area.
   - OpenSpec: hand-author the set under \`openspec/changes/${p.changeId}/\` (proposal.md, tasks.md,
     design.md, specs/ delta). The \`openspec\` CLI may be absent; hand-authoring stands in for it
     exactly as the frozen baseline did — this is NOT degraded mode and NOT an escalation trigger.
   - Emit \`records/contract.json\`: testable statements as data, stable ids \`C-001\`…, \`source\` =
     the decision ids that shaped each. NO checkbox state (ticking is a render-time join).
   - Emit \`records/frame.pass-01.facts.json\`: envelope (\`phase\`:"frame", \`pass\`:1, \`changeId\`,
     \`sourceCommand\`:"chaos:propose", \`run\`: \`RUN-<YYYY-MM-DD>-chaos-propose-${p.changeId}-<6hex>\`,
     \`mode\`:"standard", \`verdict\`:"READY_FOR_REVIEW", \`at\`: ISO-8601 Z, \`assessment\`), and \`facts\`:
     \`title\`, \`intent\` (<=3 lines), \`openspec\` (invocation proof). Standard depth: add
     \`confidenceLimiters\`; do NOT add sourceManifest/risk/framingTraceability (those are strict).
2. DECISIONS — every material decision as an append-only entry in
   \`.chaos/changes/${p.changeId}/decision-events.md\` (template §2 shape, with knowledge-type +
   confidence). Exactly ONE entry carries \`approves-change: true\`.
3. REVIEW (chaos:review) — emit \`records/review.pass-01.facts.json\`: verdict from
   \`READY_FOR_APPROVAL | READY_WITH_CONDITIONS | NEEDS_REVISION | BLOCKED | INSUFFICIENT_EVIDENCE\`,
   \`assessment\` (confidence / evidenceCoverage / assumptionLoad), \`facts.scope\` (paths + rules in
   play), \`facts.openspecValidation\`, and \`facts.findings\` (\`REV-###\`, severity, summary, status,
   the resolving decision ref). Authored analysis goes in \`commentary\` — nowhere else.
4. APPLY (chaos:apply) — implement in \`src/TaskTracker.Api\`, updating \`tests/TaskTracker.Tests\` to
   keep the baseline green, honoring R-003/R-004/R-005/R-006. Run \`dotnet build\` and
   \`dotnet test tests/TaskTracker.Tests/TaskTracker.Tests.csproj\`. Emit
   \`records/deliver.pass-01.facts.json\`: \`verdict\` APPLIED|PARTIALLY_APPLIED, and \`facts\`:
   \`build\`, \`tests\`, \`coverage\` (**one row per contract statement id**, \`evidence\`
   test|code|doc, with \`whyNotTest\` whenever evidence is not "test"), \`rules\`, \`files\`,
   \`deviations\` (each with a backing decision id), \`scopeDrift\`.
5. VERIFY (chaos:verify) — re-run build + tests independently. Emit
   \`records/verify.pass-01.facts.json\`: \`verdict\` READY|READY_WITH_DEBT|NOT_READY, \`facts\`:
   \`archiveReadiness\`, \`checks\` (build/tests/contract, plus openspec/scopeDrift/rules as
   applicable), and \`findings\` (\`VFY-###\`). "Why this verdict" goes in \`verdictRationale\`.

RENDER after FRAME and again after each later phase, from the worktree root:
    \`python tools/chaos-render/render.py ${p.changeId} --write\`
**Exit 2 means your RECORD is wrong — read the error, fix the record (never the rendered file), and
re-run.** Exit 0 = done. Count every invocation and every non-zero exit for the telemetry fields.

--- HUMAN STOP (mechanized) ---
No human is available to answer runtime decisions in this mechanized run. Record each decision AND
resolve it with an explicit, documented maintainer-style rationale, editing the entry's \`status:\`
line to \`RESOLVED-IN-ARM\` and tagging "resolved-in-arm (no live human; EA-X2 mechanized run)".
Answering the \`approves-change\` decision IS the approval. This is a documented deviation from the
normal Decision-Center stop-and-resume — state it in the frame record's \`commentary\`.

Rules of engagement:
- Honor the rules. Keep \`dotnet test\` green. Domain (\`Domain/**\`) must not reference ASP.NET types
  (R-004). Keep \`TaskState\` naming (R-005). Do NOT silently edit AGENTS.md or root README (R-006).
- Implement exactly the contract in the task (headers, params, status codes, field names) so
  behaviour is testable.
- Do NOT spawn subagents. Do the work yourself. Do NOT git commit — leave changes in the working tree.
- **Do NOT hand-write or hand-edit \`change.md\` / \`lifecycle.md\`.** If the rendered output looks
  wrong, the fix is in the record or the ledger. If you ever do edit them by hand, you MUST report
  handWroteRenderedArtifact=true.
- For the "artifacts actually read" metric: track which governance artifacts you genuinely READ and
  that CHANGED a choice you made (not merely files you produced).

WHEN DONE: run \`date +%s\` as END, compute wallTimeSeconds = END - START. Run the final
\`dotnet test\` and record passed/failed counts. Return the structured result with arm="chaos-stage-b-standard",
listing governanceArtifactsProduced (every governance file that now exists, including rendered ones),
recordsEmitted, materialDecisionsRecorded, governanceArtifactsReadAndUsed, renderInvocations,
renderFailures, renderFailureNotes and handWroteRenderedArtifact.`
}

// Task statements embedded so the kit is self-contained; byte-identical to args.example.json.
const STATEMENTS = {
  "require-api-key-auth": "# Task 1 — Require API-key authentication on the task endpoints\n\nThe Task Tracker API is currently open (no authentication). Add API-key authentication to\nthe `/tasks` endpoints.\n\n## Contract (implement exactly this — behaviour is checked against it)\n\n- Every request to any `/tasks` route — `GET /tasks`, `GET /tasks/{id}`, `POST /tasks`,\n  `PUT /tasks/{id}`, `DELETE /tasks/{id}` — must present a valid API key in the\n  **`X-Api-Key`** request header.\n- The valid API key is the string value of configuration key **`ApiKey`**, defaulting to\n  **`test-secret-key`** when that configuration value is not set.\n- A request to a `/tasks` route with a **missing or incorrect** `X-Api-Key` header must be\n  rejected with **HTTP 401 Unauthorized**, and must not read or mutate any task (the auth\n  check happens before existence/validation checks).\n- The root health endpoint **`GET /`** must stay **public** (no key required).\n- Update the existing visible test suite as needed so it supplies the key and stays green.\n\n## Constraints\n\n- Keep `dotnet build` and `dotnet test` green.\n- Do not change unrelated behaviour of the CRUD endpoints.\n- Work only inside this repository's Task Tracker API (`src/TaskTracker.Api`) and its tests\n  (`tests/TaskTracker.Tests`).\n",
  "soft-delete-tasks": "# Task 2 — Soft-delete for tasks (schema change + backward-compatible migration)\n\nToday `DELETE /tasks/{id}` permanently removes a task. Change deletion to a **soft delete**\nso deleted tasks are retained but hidden by default.\n\n## Contract (implement exactly this — behaviour is checked against it)\n\n- Add a nullable **`deletedAt`** timestamp to the task model, serialized in JSON as\n  `deletedAt` (an ISO-8601 string when set, **`null`** when the task is active).\n- `DELETE /tasks/{id}` must **soft-delete**: set `deletedAt` to the current time and return\n  **204 No Content**. It must **not** permanently remove the task. Deleting an unknown id\n  still returns 404.\n- `GET /tasks` returns only **active** (not soft-deleted) tasks by default.\n- `GET /tasks?includeDeleted=true` returns **all** tasks including soft-deleted ones (whose\n  `deletedAt` is non-null).\n- `GET /tasks/{id}` returns **404 Not Found** for a soft-deleted task.\n- The four seeded tasks remain active (`deletedAt` = null) after startup — existing rows must\n  keep working (backward-compatible migration).\n\n## Constraints\n\n- Keep `dotnet build` and `dotnet test` green (the existing 5 tests must still pass).\n- Do not change unrelated behaviour of the other CRUD endpoints.\n- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).\n",
  "optimistic-concurrency-updates": "# Task 3 — Optimistic concurrency on task updates\n\n`PUT /tasks/{id}` currently overwrites a task unconditionally, so a client working from a\nstale copy can silently clobber someone else's update (lost-update race). Add **optimistic\nconcurrency control**.\n\n## Contract (implement exactly this — behaviour is checked against it)\n\n- Add an integer **`version`** to the task, serialized as `version`. New and seeded tasks\n  start at version **1**.\n- Every **successful** `PUT /tasks/{id}` increments the task's `version` by 1 (1 → 2 → 3 …).\n- `UpdateTaskRequest` gains an **optional** integer field **`expectedVersion`**:\n  - When `expectedVersion` is **provided** and does **not** equal the task's current\n    `version`, the update must be **rejected with HTTP 409 Conflict** and the task must be\n    left **unchanged** (no field updated, version not bumped).\n  - When `expectedVersion` is **provided** and **matches**, the update succeeds (200) and the\n    version increments.\n  - When `expectedVersion` is **omitted** (null), the update proceeds unconditionally\n    (backward-compatible last-writer-wins) and the version increments.\n- `POST /tasks` returns a task with `version` = 1.\n\n## Constraints\n\n- Keep `dotnet build` and `dotnet test` green — the existing PUT test omits `expectedVersion`\n  and must keep working.\n- Do not change unrelated behaviour of the other CRUD endpoints.\n- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).\n"
}

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args
const pairs = (parsedArgs.pairs || []).map((p) => ({ ...p, statement: STATEMENTS[p.changeId] }))
const PHASE_TITLES = ['Pair 1 — auth gate', 'Pair 2 — soft-delete', 'Pair 3 — optimistic concurrency']
const out = []

for (let i = 0; i < pairs.length; i++) {
  const p = pairs[i]
  const phaseTitle = PHASE_TITLES[i] || `Pair ${i + 1}`
  phase(phaseTitle)
  log(`Pair ${i + 1} (${p.changeId}): Arm A (CHAOS Stage-B standard) starting`)

  const a0 = budget.spent()
  const chaos = await agent(stageBStandardPrompt(p), {
    label: `pair${i + 1}:armA-stageB`, phase: phaseTitle, schema: ARM_SCHEMA, agentType: 'general-purpose',
  })
  const a1 = budget.spent()

  log(`Pair ${i + 1} (${p.changeId}): Arm B (plain) starting`)
  const plain = await agent(plainPrompt(p), {
    label: `pair${i + 1}:armB-plain`, phase: phaseTitle, schema: ARM_SCHEMA, agentType: 'general-purpose',
  })
  const a2 = budget.spent()

  out.push({
    pair: i + 1,
    changeId: p.changeId,
    armA_chaos: chaos,
    armB_plain: plain,
    tokens: {
      method: 'budget.spent() output-token delta around each sequential agent; output-only proxy, no budget cap set',
      armA_output_tokens: a1 - a0,
      armB_output_tokens: a2 - a1,
    },
  })
  log(`Pair ${i + 1} done: armA=${chaos ? chaos.testsPassed + '/' + (chaos.testsPassed + chaos.testsFailed) : 'NULL'} (renderFail=${chaos ? chaos.renderFailures : '?'}) tokens=${a1 - a0}; armB=${plain ? plain.testsPassed + '/' + (plain.testsPassed + plain.testsFailed) : 'NULL'} tokens=${a2 - a1}`)
}

return { pairs: out, totalOutputTokens: budget.spent() }
