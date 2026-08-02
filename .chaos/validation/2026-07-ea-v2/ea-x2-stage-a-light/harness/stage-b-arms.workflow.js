export const meta = {
  name: 'ea-x2-stage-b-render-arms',
  description: 'Stage-B ledger-first measurement: record-emitting governed arm (Arm A) vs plain (Arm B) across the frozen 3 (forced-light, valve OFF) + 3 light-eligible tasks (valve LIVE), plus a FRAME-only valve escalate seed. Same tasks/oracles/plain-arm as Stage A; only the governed arm path moves (agents emit records; chaos:render writes the artifacts). Sequential for clean per-arm output-token deltas.',
  phases: [
    { title: 'Cost A — frozen (forced light)' },
    { title: 'Cost B — light-eligible (valve live)' },
    { title: 'Valve — escalate seed' },
  ],
}

// Arm result schema — frozen baseline fields + Stage-A valve fields + Stage-B render telemetry.
// The frozen fields are byte-identical to stage-a-arms.workflow.js; the render* fields are
// additive and optional so the cost row stays comparable.
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
    governanceArtifactsProduced: { type: 'array', items: { type: 'string' }, description: 'CHAOS artifacts that now exist, as repo-relative paths (empty for the plain arm)' },
    materialDecisionsRecorded: { type: 'array', items: { type: 'string' }, description: 'material decision ids you recorded (empty for the plain arm)' },
    governanceArtifactsReadAndUsed: { type: 'array', items: { type: 'string' }, description: 'governance artifacts you READ that changed a choice (empty for the plain arm)' },
    escalated: { type: 'boolean', description: 'CHAOS/light arm only: did the auto-escalation valve fire (light -> standard)?' },
    escalatedTo: { type: ['string', 'null'], description: 'mode escalated to, or null' },
    escalationTrigger: { type: ['string', 'null'], description: 'which trigger fired, or null' },
    stoppedAtFrame: { type: 'boolean', description: 'valve seed only: true if you stopped after FRAME routing without delivering' },
    selfAssessment: { type: 'string', description: 'honest note on confidence, gaps, anything you were unsure about' },
    // --- Stage-B telemetry (new; measures record-emission friction) ---
    recordsEmitted: { type: 'array', items: { type: 'string' }, description: 'record files you WROTE under .chaos/changes/<id>/records/ (Stage-B arm only)' },
    renderInvocations: { type: 'integer', description: 'how many times you ran chaos-render (--check or --write) in total' },
    renderFailures: { type: 'integer', description: 'how many render invocations exited non-zero (validation rejected your records)' },
    renderFailureNotes: { type: 'string', description: 'what the renderer rejected and how you fixed the RECORD (one line per failure); empty if none' },
    handWroteRenderedArtifact: { type: 'boolean', description: 'HONESTY FIELD: true if you ever hand-wrote or hand-edited change.md / lifecycle.md instead of rendering them' },
  },
  required: ['arm', 'summary', 'codeFilesChanged', 'testsPassed', 'testsFailed', 'testsGreen', 'wallTimeSeconds', 'buildOk'],
}

// ---- Plain arm: verbatim from the frozen ea-x2-arms.workflow.js (do not drift). ----
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

WHEN DONE: run \`date +%s\` as END, compute wallTimeSeconds = END - START. Run the final \`dotnet test\` and record passed/failed counts. Return the structured result with arm="plain". Leave the governance arrays empty; leave escalated=false, stoppedAtFrame=false.`
}

// ---- Stage-B governed arm: collapsed light path, RECORD-FIRST (agents emit data, renderer writes). ----
// forceLight=true  => valve DISABLED (cost run over the frozen posture-crossing tasks).
// forceLight=false => valve LIVE (light-eligible tasks; must stay light).
function stageBChaosPrompt(p, forceLight) {
  const valveClause = forceLight
    ? `VALVE — DISABLED for this run. This is a COST measurement over a task that deliberately
crosses an architecture non-goal. Do NOT auto-escalate; run the collapsed light path end to end
regardless of posture. Set escalated=false, keep the frame record's \`mode\` = "light", and note
"valve suppressed for cost measurement (would normally escalate: posture crossing)" in the frame
record's \`commentary\` field. This is the only deviation; everything else is the real light path.`
    : `VALVE — LIVE. Apply the real auto-escalation triggers. Escalate light -> standard, WITHOUT
asking, if ANY fires: (a) the change crosses an architecture non-goal/posture boundary (auth,
persistence); (b) more than 2 material decisions surface; (c) the inline self-review checklist
fails; (d) OpenSpec is genuinely unavailable AND cannot be hand-authored. If you escalate:
announce it, append an \`ESC-001\` entry to \`decision-events.md\` (fields: status/from/to/trigger/
kept-work/knowledge/confidence per the template §2), set the frame record's \`mode\` to "standard",
and set escalated=true / escalatedTo="standard" / escalationTrigger=<trigger>. The renderer derives
the "> ⚠ escalated" warning and \`escalatedFrom\` from that ledger entry — do NOT hand-write them.
If nothing fires, stay light and set escalated=false. Judge honestly — a small, in-boundary
convenience change should stay light; do not manufacture an escalation.`

  return `You are executing the real CHAOS **--light** collapsed lifecycle (Controlled, Human-led,
Agent-Orchestrated software delivery) on a change in this repository, in its **Stage-B
ledger-first** form: you emit STRUCTURED RECORDS and a deterministic renderer produces the
human-readable artifacts. You never hand-write \`change.md\` or \`lifecycle.md\`.
Work ONLY inside the git worktree at:
  ${p.wtA}

Before deciding anything, DISCOVER and READ the governance — but SCOPED (light does not re-derive
the whole workspace):
- \`AGENTS.md\` (entrypoint, protected files)
- \`.chaos/constitution.md\` (confidence/knowledge doctrine: FACT/INFERENCE/ASSUMPTION + HIGH/MEDIUM/LOW)
- \`.chaos/rules/index.md\` (R-001..R-007 — R-003 keep tests green, R-004 domain must not depend on
  the HTTP layer, R-005 keep \`TaskState\` naming, R-006 protected files)
- \`.chaos/architecture.md\` — read ONLY the boundary model + the NON-GOALS section (auth / persistence)
- \`.claude/skills/chaos-shared/reference/record-emission.md\` — **the writer protocol you MUST
  follow** (what to emit, where, the three hard rules, how to render).
- \`.claude/skills/chaos-shared/reference/change-template.md\` §2 (decision-entry format — the ledger
  is still hand-appended) and §5 (the machine layer: record files + per-phase verdict enums).
- \`tools/chaos-render/schema/phase-facts.schema.json\` and \`contract.schema.json\` — the exact field
  shapes. Read these BEFORE authoring records; they are strict (\`additionalProperties: false\`).
Explicitly FORBIDDEN on light: repo-wide discovery sweeps (find/grep walks over the whole tree),
reading assessments/archaeology/history unless this change touches them. Do NOT read the existing
\`.chaos/changes/secure-task-api/\` artifacts — that is a different, unrelated change.

FIRST, run \`date +%s\` and remember the number as START.

=== TASK (the change to deliver) ===
${p.statement}
=== END TASK ===

Execute the collapsed light lifecycle for change id "${p.changeId}". Produce ONLY the light
record set under \`.chaos/changes/${p.changeId}/\` plus the OpenSpec set — and NOTHING ELSE.

--- FRAME (chaos:propose --light) ---
1. Scoped evidence scan (as above).
2. OpenSpec artifacts: produce the FULL set by hand under \`openspec/changes/${p.changeId}/\`
   (proposal.md, tasks.md, design.md, specs/ delta) — this is unchanged in every mode. The
   \`openspec\` CLI may be absent in this worktree; hand-authoring stands in for it, exactly as the
   frozen baseline did. Do NOT treat CLI-absence as degraded mode / an escalation trigger.
3. Emit \`.chaos/changes/${p.changeId}/records/contract.json\` — the testable contract statements as
   DATA: stable ids \`C-001\`, \`C-002\`, … , optional \`group\`, the statement \`text\`, and \`source\`
   = the decision ids that shaped it. NO checkbox state (ticking is a render-time join).
4. Surface every MATERIAL decision — same materiality bar as standard; light never means fewer
   decisions. Write them as lean append-only entries in \`.chaos/changes/${p.changeId}/decision-events.md\`
   (hand-written markdown, format from template §2: status/options/recommendation/answer/
   why-material/knowledge lines). Exactly ONE entry carries \`approves-change: true\`. If the change
   surfaces zero material decisions, surface the explicit gate decision "Approve contract as framed?".
5. Inline self-review (checklist: scope sane / rules mapped / contract testable / decisions
   complete). Its outcome IS the frame record's verdict.
6. Emit \`.chaos/changes/${p.changeId}/records/frame.pass-01.facts.json\` — the frame phase record:
   envelope (\`phase\`:"frame", \`pass\`:1, \`changeId\`, \`sourceCommand\`:"chaos:propose", \`run\`: a
   plausible run id of the form \`RUN-<YYYY-MM-DD>-chaos-propose-${p.changeId}-<6hex>\`, \`mode\`,
   \`verdict\`:"READY_FOR_REVIEW", \`at\`: an ISO-8601 Z timestamp, \`assessment\`), and \`facts\`:
   \`title\`, \`intent\` (<=3 single lines), \`openspec\` (the invocation proof block: status INVOKED,
   the artifacts you wrote, validation). Light depth: NO sourceManifest / risk / framingTraceability.
7. RENDER: from the worktree root run
      \`python tools/chaos-render/render.py ${p.changeId} --write\`
   This writes \`change.md\` and \`lifecycle.md\`. **Exit 2 means your RECORD is wrong — read the
   error, fix the record (never the rendered file), and re-run.** Exit 0 = done. Count every
   invocation and every non-zero exit for the telemetry fields.

${valveClause}

--- HUMAN STOP (mechanized) ---
No live human is available in this measurement. Record each decision AND resolve it with an
explicit, documented maintainer-style rationale, editing the entry's \`status:\` line to
\`RESOLVED-IN-ARM\` and tagging "resolved-in-arm (no live human; Stage-B mechanized run)". Answering
the \`approves-change\` decision IS the approval. This is a documented deviation from the real
Decision-Center stop — state it in the frame record's \`commentary\`.

--- DELIVER (chaos:apply) ---
8. Implement to the approved contract in \`src/TaskTracker.Api\`, honoring the decisions verbatim,
   updating \`tests/TaskTracker.Tests\` to keep the baseline green. Honor R-003/R-004/R-005/R-006.
   Implement exactly the contract in the task (params, status codes, field names) so it is testable.
9. Validate: \`dotnet build\` and \`dotnet test tests/TaskTracker.Tests/TaskTracker.Tests.csproj\`.
10. Emit \`.chaos/changes/${p.changeId}/records/deliver.pass-01.facts.json\` — the deliver phase
    record: envelope (\`phase\`:"deliver", \`sourceCommand\`:"chaos:apply", a \`chaos-apply\` run id,
    \`verdict\`:"APPLIED" or "PARTIALLY_APPLIED", \`at\`, \`assessment\`), and \`facts\`: \`build\`,
    \`tests\` (passed/total), \`coverage\` — **one row per contract statement id**, each with
    \`covered\`, \`evidence\` ("test" | "code" | "doc") and, when evidence is not "test", a
    \`whyNotTest\` line — \`rules\` (R-id + evidence), \`files\` (path + added/modified/deleted),
    \`deviations\` (each with a backing decision id, or omit if none), \`scopeDrift\`.
11. RENDER again: \`python tools/chaos-render/render.py ${p.changeId} --write\`. Same rule: a
    non-zero exit is a defect in your RECORD, not in the artifact. Finish only when it exits 0.

STRICT ARTIFACT SET (this is being measured): the ONLY files you may create under governance are
\`openspec/changes/${p.changeId}/*\`, \`.chaos/changes/${p.changeId}/decision-events.md\`, and
\`.chaos/changes/${p.changeId}/records/*.json\`. \`change.md\` and \`lifecycle.md\` must exist ONLY as
renderer output. Do NOT create proposal-report.md, proposal-review.md, apply-report.md,
verification.md, or approval.md. **Do NOT hand-write or hand-edit \`change.md\` / \`lifecycle.md\`
under any circumstances** — if the rendered output looks wrong, the fix is always in the record or
the ledger. If you ever do edit them by hand, you MUST report handWroteRenderedArtifact=true.

Rules of engagement:
- Honor the rules. Keep \`dotnet test\` green. Domain (\`Domain/**\`) must not reference ASP.NET types
  (R-004). Keep \`TaskState\` naming (R-005). Do NOT silently edit AGENTS.md or root README (R-006).
- Do NOT spawn subagents. Do the work yourself. Do NOT git commit — leave changes in the working tree.
- Track which governance artifacts you genuinely READ that CHANGED a choice (not files you produced).

WHEN DONE: run \`date +%s\` as END, compute wallTimeSeconds = END - START. Run the final
\`dotnet test\` and record passed/failed counts. Return the structured result with arm="chaos-stage-b",
listing governanceArtifactsProduced (repo-relative paths of every governance file that now exists,
including the rendered ones), recordsEmitted, materialDecisionsRecorded, governanceArtifactsReadAndUsed,
renderInvocations, renderFailures, renderFailureNotes, handWroteRenderedArtifact, and the
escalated/escalatedTo/escalationTrigger fields. stoppedAtFrame=false.`
}

// ---- Valve escalate seed: FRAME-only routing test on an under-specified auth task. ----
function valveSeedPrompt(p) {
  return `You are executing the real CHAOS **--light** FRAME step (chaos:propose --light) on a
change in this repository, in its Stage-B ledger-first form. Work ONLY inside the git worktree at:
  ${p.wtA}

This is a VALVE-FIDELITY test: we are checking whether the light auto-escalation valve correctly
routes a posture-crossing change. Do the FRAME reasoning faithfully, apply the LIVE valve, then
STOP — do NOT implement production code, do NOT run DELIVER.

Read (scoped): \`AGENTS.md\`, \`.chaos/rules/index.md\`, and especially \`.chaos/architecture.md\`'s
NON-GOALS section (auth / persistence are called out as out-of-scope, strict, decision-bearing).
Also read \`.claude/skills/chaos-shared/reference/change-template.md\` §2 for the ledger entry shape.

FIRST, run \`date +%s\` and remember the number as START.

=== TASK (the change intent) ===
${p.statement}
=== END TASK ===

FRAME reasoning:
1. Classify the change: what does it touch, and does it cross an architecture non-goal / posture
   boundary (auth, persistence)? How many material decisions does it surface?
2. Apply the LIVE auto-escalation valve. Escalate light -> standard, without asking, if the change
   crosses a posture boundary, surfaces > 2 material decisions, or fails the self-review.
3. If you escalate: set escalated=true, escalatedTo="standard", escalationTrigger=<the trigger>,
   and (in the worktree) append an \`ESC-001\` entry to
   \`.chaos/changes/${p.changeId}/decision-events.md\` per template §2 (status: RECORDED (<date>) /
   from: light · to: standard / trigger / kept-work / knowledge · confidence). That ledger entry is
   the escalation record — the renderer derives the warning banner and \`escalatedFrom\` from it, so
   do NOT hand-write \`change.md\`. If you judge it should stay light, set escalated=false and
   explain why in selfAssessment.
4. STOP after the routing decision. Set stoppedAtFrame=true. Do NOT write src/ code, do NOT emit
   phase records, do NOT run DELIVER.

WHEN DONE: run \`date +%s\` as END, wallTimeSeconds = END - START. You will not run dotnet here;
report testsPassed=0, testsFailed=0, testsGreen=true, buildOk=true (not applicable — frame only).
Return the structured result with arm="chaos-stage-b-valveseed", stoppedAtFrame=true, and the
escalated/escalatedTo/escalationTrigger fields set to your routing decision.`
}

// ---------------------------------------------------------------------------
// Task statements are embedded so the kit is self-contained (args carries only
// changeId + worktree paths). Byte-identical to stage-a-arms.workflow.js.
const STATEMENTS = {
  "require-api-key-auth": "# Task 1 — Require API-key authentication on the task endpoints\n\nThe Task Tracker API is currently open (no authentication). Add API-key authentication to\nthe `/tasks` endpoints.\n\n## Contract (implement exactly this — behaviour is checked against it)\n\n- Every request to any `/tasks` route — `GET /tasks`, `GET /tasks/{id}`, `POST /tasks`,\n  `PUT /tasks/{id}`, `DELETE /tasks/{id}` — must present a valid API key in the\n  **`X-Api-Key`** request header.\n- The valid API key is the string value of configuration key **`ApiKey`**, defaulting to\n  **`test-secret-key`** when that configuration value is not set.\n- A request to a `/tasks` route with a **missing or incorrect** `X-Api-Key` header must be\n  rejected with **HTTP 401 Unauthorized**, and must not read or mutate any task (the auth\n  check happens before existence/validation checks).\n- The root health endpoint **`GET /`** must stay **public** (no key required).\n- Update the existing visible test suite as needed so it supplies the key and stays green.\n\n## Constraints\n\n- Keep `dotnet build` and `dotnet test` green.\n- Do not change unrelated behaviour of the CRUD endpoints.\n- Work only inside this repository's Task Tracker API (`src/TaskTracker.Api`) and its tests\n  (`tests/TaskTracker.Tests`).\n",
  "soft-delete-tasks": "# Task 2 — Soft-delete for tasks (schema change + backward-compatible migration)\n\nToday `DELETE /tasks/{id}` permanently removes a task. Change deletion to a **soft delete**\nso deleted tasks are retained but hidden by default.\n\n## Contract (implement exactly this — behaviour is checked against it)\n\n- Add a nullable **`deletedAt`** timestamp to the task model, serialized in JSON as\n  `deletedAt` (an ISO-8601 string when set, **`null`** when the task is active).\n- `DELETE /tasks/{id}` must **soft-delete**: set `deletedAt` to the current time and return\n  **204 No Content**. It must **not** permanently remove the task. Deleting an unknown id\n  still returns 404.\n- `GET /tasks` returns only **active** (not soft-deleted) tasks by default.\n- `GET /tasks?includeDeleted=true` returns **all** tasks including soft-deleted ones (whose\n  `deletedAt` is non-null).\n- `GET /tasks/{id}` returns **404 Not Found** for a soft-deleted task.\n- The four seeded tasks remain active (`deletedAt` = null) after startup — existing rows must\n  keep working (backward-compatible migration).\n\n## Constraints\n\n- Keep `dotnet build` and `dotnet test` green (the existing 5 tests must still pass).\n- Do not change unrelated behaviour of the other CRUD endpoints.\n- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).\n",
  "optimistic-concurrency-updates": "# Task 3 — Optimistic concurrency on task updates\n\n`PUT /tasks/{id}` currently overwrites a task unconditionally, so a client working from a\nstale copy can silently clobber someone else's update (lost-update race). Add **optimistic\nconcurrency control**.\n\n## Contract (implement exactly this — behaviour is checked against it)\n\n- Add an integer **`version`** to the task, serialized as `version`. New and seeded tasks\n  start at version **1**.\n- Every **successful** `PUT /tasks/{id}` increments the task's `version` by 1 (1 → 2 → 3 …).\n- `UpdateTaskRequest` gains an **optional** integer field **`expectedVersion`**:\n  - When `expectedVersion` is **provided** and does **not** equal the task's current\n    `version`, the update must be **rejected with HTTP 409 Conflict** and the task must be\n    left **unchanged** (no field updated, version not bumped).\n  - When `expectedVersion` is **provided** and **matches**, the update succeeds (200) and the\n    version increments.\n  - When `expectedVersion` is **omitted** (null), the update proceeds unconditionally\n    (backward-compatible last-writer-wins) and the version increments.\n- `POST /tasks` returns a task with `version` = 1.\n\n## Constraints\n\n- Keep `dotnet build` and `dotnet test` green — the existing PUT test omits `expectedVersion`\n  and must keep working.\n- Do not change unrelated behaviour of the other CRUD endpoints.\n- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).\n",
  "task-count": "# Task B1 — Active-task count endpoint\n\nAdd a lightweight aggregate endpoint that reports how many tasks exist. This is a read-only\nconvenience for the dashboard; it introduces no authentication and no persistence-model change.\n\n## Contract (implement exactly this — behaviour is checked against it)\n\n- Add **`GET /tasks/count`**. It returns **HTTP 200** with a JSON object\n  **`{ \"count\": <integer> }`** where `count` is the total number of tasks currently in the store.\n- `count` must always equal the number of items returned by `GET /tasks` (same store, same moment).\n- Creating a task (`POST /tasks`, 201) increases `count` by exactly 1; deleting a task\n  (`DELETE /tasks/{id}`, 204) decreases `count` by exactly 1.\n- The root health endpoint **`GET /`** and all existing `/tasks` CRUD behaviour are unchanged.\n\n## Constraints\n\n- Keep `dotnet build` and `dotnet test` green (the existing 5 tests must still pass).\n- Do not change unrelated behaviour of the CRUD endpoints.\n- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).\n",
  "filter-tasks-by-status": "# Task B2 — Filter GET /tasks by status\n\n`GET /tasks` currently returns every task. Add an optional query-parameter filter on task status.\nThis is a query-shaping convenience: no authentication, no persistence-model change.\n\n## Contract (implement exactly this — behaviour is checked against it)\n\n- `GET /tasks?status=<state>` returns only tasks whose status equals `<state>`, where `<state>`\n  is one of the `TaskState` names: **`Open`**, **`InProgress`**, **`Done`**.\n- The match is **case-insensitive**: `?status=open` behaves identically to `?status=Open`.\n- `GET /tasks` with **no** `status` parameter returns **all** tasks (unchanged behaviour).\n- An **unrecognised** status value (e.g. `?status=Bogus`) returns **HTTP 400 Bad Request** and\n  returns no task list.\n- Existing seeded data: of the four seeded tasks, exactly **two** are `Open`, **one** is\n  `InProgress`, and **one** is `Done`. A filtered response must contain only tasks of the\n  requested status.\n\n## Constraints\n\n- Keep `dotnet build` and `dotnet test` green (the existing 5 tests must still pass; the\n  unfiltered `GET /tasks` test must keep working).\n- Do not change unrelated behaviour of the other CRUD endpoints.\n- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).\n",
  "enforce-title-max-length": "# Task B3 — Enforce a maximum title length\n\nTask titles are currently unbounded. Add an upper bound on title length as input validation.\nThis is a request-validation convenience: no authentication, no persistence-model change.\n\n## Contract (implement exactly this — behaviour is checked against it)\n\n- A task **title** may be at most **200 characters** long.\n- `POST /tasks` with a title **longer than 200 characters** must be rejected with\n  **HTTP 400 Bad Request** and must not create a task.\n- `PUT /tasks/{id}` with a title **longer than 200 characters** must be rejected with\n  **HTTP 400 Bad Request** and must not modify the task.\n- A title of **exactly 200 characters** is accepted (`POST` → 201, `PUT` → 200).\n- The existing **blank/whitespace title → 400** behaviour is preserved for both `POST` and `PUT`.\n- Titles of normal length continue to work exactly as before.\n\n## Constraints\n\n- Keep `dotnet build` and `dotnet test` green (the existing 5 tests must still pass).\n- Do not change unrelated behaviour of the other CRUD endpoints.\n- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).\n",
  "secure-api-underspecified": "# Task A — Secure the API before we expose it\n\nWe're about to put the Task Tracker API on the public internet and it's wide open right now.\nPlease secure it with an API key so it's not just anyone hitting it. Keep the build and tests\ngreen.\n\n(That's the whole ask — do what you think is right.)\n"
}

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args
const withStmt = (p) => ({ ...p, statement: STATEMENTS[p.changeId] })
const costA = (parsedArgs.costA || []).map(withStmt)           // frozen 3, forced light
const costB = (parsedArgs.costB || []).map(withStmt)           // new 3, valve live
const valveSeeds = (parsedArgs.valveSeeds || []).map(withStmt) // FRAME-only escalate seeds
const out = { costA: [], costB: [], valveSeeds: [] }

async function runPair(p, i, phaseTitle, forceLight) {
  phase(phaseTitle)
  log(`${phaseTitle} — pair ${i + 1} (${p.changeId}): Arm A (chaos-stage-b) starting`)
  const a0 = budget.spent()
  const chaos = await agent(stageBChaosPrompt(p, forceLight), {
    label: `${p.changeId}:armA-stageB`, phase: phaseTitle, schema: ARM_SCHEMA, agentType: 'general-purpose',
  })
  const a1 = budget.spent()
  log(`${phaseTitle} — pair ${i + 1} (${p.changeId}): Arm B (plain) starting`)
  const plain = await agent(plainPrompt(p), {
    label: `${p.changeId}:armB-plain`, phase: phaseTitle, schema: ARM_SCHEMA, agentType: 'general-purpose',
  })
  const a2 = budget.spent()
  const rec = {
    changeId: p.changeId,
    forcedLight: forceLight,
    armA_chaos: chaos,
    armB_plain: plain,
    tokens: {
      method: 'budget.spent() output-token delta around each sequential agent; output-only proxy',
      armA_output_tokens: a1 - a0,
      armB_output_tokens: a2 - a1,
    },
  }
  log(`  done: armA=${chaos ? chaos.testsPassed + '/' + (chaos.testsPassed + chaos.testsFailed) : 'NULL'} (esc=${chaos ? chaos.escalated : '?'} renderFail=${chaos ? chaos.renderFailures : '?'}) tok=${a1 - a0}; armB=${plain ? plain.testsPassed + '/' + (plain.testsPassed + plain.testsFailed) : 'NULL'} tok=${a2 - a1}`)
  return rec
}

// Phase 1 — Cost A: frozen 3, forced light (valve OFF).
for (let i = 0; i < costA.length; i++) {
  out.costA.push(await runPair(costA[i], i, 'Cost A — frozen (forced light)', true))
}
// Phase 2 — Cost B: new 3, valve LIVE (must stay light).
for (let i = 0; i < costB.length; i++) {
  out.costB.push(await runPair(costB[i], i, 'Cost B — light-eligible (valve live)', false))
}
// Phase 3 — Valve escalate seeds: FRAME-only routing test.
for (let i = 0; i < valveSeeds.length; i++) {
  const p = valveSeeds[i]
  phase('Valve — escalate seed')
  log(`Valve seed ${i + 1} (${p.changeId}): FRAME-only routing on posture-crossing task`)
  const s0 = budget.spent()
  const seed = await agent(valveSeedPrompt(p), {
    label: `${p.changeId}:valve-seed`, phase: 'Valve — escalate seed', schema: ARM_SCHEMA, agentType: 'general-purpose',
  })
  const s1 = budget.spent()
  out.valveSeeds.push({ changeId: p.changeId, expected: 'escalate', result: seed, tokens: { output_tokens: s1 - s0 } })
  log(`  valve seed ${p.changeId}: escalated=${seed ? seed.escalated : 'NULL'} trigger=${seed ? seed.escalationTrigger : '?'}`)
}

return { ...out, totalOutputTokens: budget.spent() }
