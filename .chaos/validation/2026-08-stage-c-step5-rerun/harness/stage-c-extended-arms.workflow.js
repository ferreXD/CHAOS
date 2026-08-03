export const meta = {
  name: 'stage-c-step5-extended-arms',
  description: 'Stage-C step-5 EXTENDED tier: progressive-rigor governed arm (no preset flag, zero floors) vs plain over the 3 light-eligible tasks - the band where C-10 zero-base OpenSpec pays maximally. Governed prompt byte-identical to the core-tier workflow; plain prompt byte-identical to the Stage-A/Stage-B Cost-B rows. Sequential for clean per-arm output-token deltas.',
  phases: [
    { title: 'B1 - task count' },
    { title: 'B2 - filter by status' },
    { title: 'B3 - title max length' },
  ],
}

// Frozen baseline fields + Stage-B render telemetry + Stage-C classification telemetry.
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
    // --- Stage-B render telemetry ---
    recordsEmitted: { type: 'array', items: { type: 'string' }, description: 'record files written under .chaos/changes/<id>/records/' },
    renderInvocations: { type: 'integer' },
    renderFailures: { type: 'integer' },
    renderFailureNotes: { type: 'string' },
    handWroteRenderedArtifact: { type: 'boolean', description: 'HONESTY FIELD: true if you ever hand-wrote or hand-edited change.md / lifecycle.md' },
    // --- Stage-C classification telemetry ---
    checkpointsRun: { type: 'array', items: { type: 'string' }, description: 'which classifier checkpoints you actually ran, e.g. ["K1","K2","K3","K4"]' },
    firedTriggers: { type: 'array', items: { type: 'string' }, description: 'one entry per FIRED trigger, format "M2@K1 by=scan surface=auth" (use the classifier verdict, not your memory)' },
    finalDimensions: { type: 'string', description: 'the final dimension vector, format "stops N · evidence.targeted N · evidence.breadth N · review N · verify N · openspec N · adr N"' },
    openspecDepth: { type: 'integer', description: 'the final `openspec` dimension the classifier produced: 0 skip / 1 delta / 2 full set' },
    openspecArtifactsWritten: { type: 'array', items: { type: 'string' }, description: 'files written under openspec/changes/<id>/ (empty if openspec 0)' },
    newStopsTotal: { type: 'integer', description: 'total trigger-CREATED stops across all checkpoints (the floor approval stop is NOT counted)' },
    classifierInvocations: { type: 'integer', description: 'how many times you ran tools/chaos-classify/classify.py' },
    classifierFailures: { type: 'integer', description: 'how many classifier invocations exited non-zero or errored' },
    classifierFailureNotes: { type: 'string', description: 'what failed and how you resolved it; empty if none' },
    adjudicationPasses: { type: 'integer', description: 'how many semantic adjudication passes you performed (K1 and K3 only, per C-12)' },
    adjudicationRaises: { type: 'array', items: { type: 'string' }, description: 'each raise you made, format "M1@K1 surface=auth cite=<short>"' },
    finalConfidence: { type: 'string', description: 'the classification confidence from the LAST checkpoint verdict (HIGH|MEDIUM|LOW)' },
    trgEventsWritten: { type: 'array', items: { type: 'string' }, description: 'the TRG-* ledger event ids you appended' },
    k3NumstatScope: { type: 'string', description: 'HONEST INSTRUMENTATION NOTE: exactly what the K3 numstat covered (which paths were included/excluded and the command you used to produce it)' },
    stoppedAtFrame: { type: 'boolean', description: 'V1 seed only: true if you stopped after FRAME without delivering' },
    escalationLegacyUsed: { type: 'boolean', description: 'HONESTY FIELD: true if you wrote any ESC-* entry, escalatedFrom frontmatter, or "⚠ escalated" line (legacy pre-C behaviour — should be false under Stage C)' },
  },
  required: ['arm', 'summary', 'codeFilesChanged', 'testsPassed', 'testsFailed', 'testsGreen', 'wallTimeSeconds', 'buildOk'],
}

// ---- Plain arm: byte-identical to the Stage-A/Stage-B Cost-B rows. Do not drift. ----
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

// ---- Shared preamble: what the Stage-C governed arm must read + how it runs the classifier. ----
function stageCPreamble(p, wt, changeId) {
  return `You are executing the real CHAOS governed lifecycle (Controlled, Human-led,
Agent-Orchestrated software delivery) on a change in this repository, under **Stage-C progressive
rigor**. There is **NO preset flag** on this run — **zero floors** — so the *classifier's* fired
triggers alone decide how much rigor this change owes. Work ONLY inside the git worktree at:
  ${wt}

Stage C kills modes-as-paths. Every change starts at the collapsed universal base
(FRAME → human answers → DELIVER). A trigger fires → specific rigor **dimensions** raise →
obligations grow, monotonically within the change. You never pick a mode, and you never lower a
fired dimension.

READ FIRST — this is the toolkit under test; do not paraphrase it from memory:
- \`docs/design/2026-08-02-stage-c-progressive-rigor.md\` — §4 rigor dimensions, §5 trigger
  taxonomy + combination laws, §8 floors, §9 OpenSpec under C, §10 the floor stop.
- \`tools/chaos-classify/README.md\` — the wiring adapter and the **two-call pattern** per checkpoint.
- \`tools/chaos-classify/adjudication-prompt.md\` — the **pinned** semantic contract (raise-only,
  citations mandatory). YOU perform this pass, at **K1 and K3 only** (C-12).
- \`.claude/skills/chaos-propose/SKILL.md\` — K1 + the OpenSpec gate at the classified depth.
- \`.claude/skills/chaos-apply/SKILL.md\` — "Stage-C checkpoints" (K2 at entry, K3 at DELIVER end).
- \`.claude/skills/chaos-verify/SKILL.md\` — "Stage-C enforcement" (K4 + the obligation audit).
- \`.claude/skills/chaos-shared/reference/record-emission.md\` — the writer protocol: you emit
  RECORDS; the renderer writes \`change.md\` and \`lifecycle.md\`. You NEVER hand-write those two.
- \`.claude/skills/chaos-shared/reference/change-template.md\` §2 (decision-entry format **and the
  \`TRG-*\` trigger-event shape**) and §5 (record files + per-phase verdict enums).
- \`tools/chaos-render/schema/phase-facts.schema.json\` + \`contract.schema.json\` — strict
  (\`additionalProperties: false\`). Read them BEFORE authoring records.

Governance to read, SCOPED (the base is a scoped scan; \`evidence.targeted 1\` adds only the docs a
fired trigger actually cites):
- \`AGENTS.md\` (entrypoint, protected files)
- \`.chaos/constitution.md\` (FACT/INFERENCE/ASSUMPTION/UNKNOWN + HIGH/MEDIUM/LOW doctrine)
- \`.chaos/rules/index.md\` (R-001..R-007 — R-003 keep tests green, R-004 domain must not depend on
  the HTTP layer, R-005 keep \`TaskState\` naming, R-006 protected files)
- \`.chaos/architecture.md\` — the boundary model and the NON-GOALS section
FORBIDDEN: repo-wide discovery sweeps (find/grep walks over the whole tree); reading
\`.chaos/changes/secure-task-api/\` or \`.chaos/changes/add-task-query-filters/\` (unrelated changes;
the latter is a retired pre-Stage-B shape).

--- HOW TO RUN A CHECKPOINT (the two-call pattern) ---
Write a payload JSON (UTF-8, no BOM) — put scratch payloads in the worktree's \`.tmp/\` folder, NOT
in the change folder:
    {"checkpoint": "K1", "mode": null, "declaredTriggers": [],
     "intent": "<the change intent, plain text>",
     "scope": "scope: <comma-separated predicted paths — MUST list planned NEW paths, or M5
               false-fires at K3>",
     "postureFiles": [".chaos/architecture.md"],
     "mapFile": ".chaos/path-class-map.json"}
(K2/K3/K4 additionally take \`"ledgerFile"\`, \`"numstatFile"\`, \`"patchFile"\`, \`"selfReview"\` per the
skills.) Then, from the worktree root:
1. **Scan call:**  \`python tools/chaos-classify/classify.py --inline .tmp/<cp>.json --state .chaos/changes/${changeId}/classification-state.json\`
2. **At K1 and K3 only:** perform the adjudication pass yourself per the pinned
   \`adjudication-prompt.md\` over the verdict's candidate/demoted surface plus the full inputs.
   You may only **RAISE materiality triggers** (M1..M5) and every raise MUST cite the input line
   that justifies it. You may never suppress a scan firing, never touch mechanical triggers
   (X1/X2/X3), never lower a dimension. Write \`{"raises": [{"trigger":"M1","surface":"auth","cite":"..."}]}\`
   to \`.tmp/<cp>-raises.json\` (an EMPTY raises list is a valid, expected outcome — declining is
   the common case), then **re-run the same checkpoint** with \`--adjudication .tmp/<cp>-raises.json\`.
   Re-running a checkpoint is safe: firings dedupe and the second verdict is authoritative.
3. Append one \`TRG-*\` event to \`.chaos/changes/${changeId}/decision-events.md\` per NEWLY fired
   trigger, in the change-template §2 \`TRG-\` shape (status / trigger · by · surface / cite /
   dimensions-after). \`TRG-\` headings are deliberately NOT decision entries — they must not
   inflate the decision count.
4. The resulting **dimension vector drives every obligation**. Under Stage C there is **no mode
   escalation**: do NOT write \`ESC-*\` entries, \`escalatedFrom\` frontmatter, or "⚠ escalated"
   lines — those are legacy pre-C behaviour and would be a regression here.

FIRST, run \`date +%s\` and remember the number as START.

=== TASK (the change to deliver) ===
${p.statement}
=== END TASK ===
`
}

// ---- Governed arm: full Stage-C lifecycle, K1..K4, no preset flag. ----
function stageCGovernedPrompt(p) {
  const changeId = p.changeId
  return `${stageCPreamble(p, p.wtA, changeId)}
Execute the change under change id "${changeId}".

--- FRAME (chaos:propose, NO preset flag) ---
1. Scoped evidence scan (as above). Derive the intent and the **predicted scope** (list planned NEW
   paths explicitly).
2. **Checkpoint K1** via the two-call pattern above (scan → your adjudication pass → merge).
   Record the \`TRG-*\` events.
3. **OpenSpec gate at the CLASSIFIED DEPTH** (design §9; propose skill step 9) — this is the
   measured lever, so honor the dimension exactly:
   - \`openspec 0\` → **skip OpenSpec entirely**; the contract lives in \`change.md\` §Contract.
     Record the skip and the zero-trigger classification in the frame facts.
   - \`openspec 1\` → a **delta spec only** under \`openspec/changes/${changeId}/\`.
   - \`openspec 2\` → the **full set** (proposal.md, tasks.md, design.md, specs/ delta).
   The \`openspec\` CLI may be absent in this worktree; hand-authoring stands in for it exactly as
   the frozen baseline did. CLI-absence is NOT degraded mode and NOT a trigger.
4. Surface every MATERIAL decision as a lean append-only entry in
   \`.chaos/changes/${changeId}/decision-events.md\` (template §2: status/options/recommendation/
   answer/why-material/knowledge/confidence). Exactly ONE entry carries \`approves-change: true\`
   (that is the C-11 floor stop). K1-fired materiality **folds its named questions into that
   approval decision's presentation** — it never creates a second stop at K1.
5. Emit \`.chaos/changes/${changeId}/records/contract.json\` — testable statements as DATA: stable
   ids \`C-001\`…, optional \`group\`, \`text\`, \`source\` = the shaping decision ids. NO checkbox state.
6. Inline self-review (scope sane / rules mapped / contract testable / decisions complete). Its
   outcome IS the frame record's verdict.
7. Emit \`.chaos/changes/${changeId}/records/frame.pass-01.facts.json\`: envelope
   (\`phase\`:"frame", \`pass\`:1, \`changeId\`, \`sourceCommand\`:"chaos:propose",
   \`run\`:\`RUN-<YYYY-MM-DD>-chaos-propose-${changeId}-<6hex>\`, \`mode\`, \`verdict\`:"READY_FOR_REVIEW",
   \`at\`: ISO-8601 Z, \`assessment\`) and \`facts\`: \`title\`, \`intent\` (≤3 single lines), \`openspec\`
   (the invocation proof — including an honest "skipped, openspec dimension 0" status if that is
   what the classifier produced). Depth follows the dimensions, not a mode word.
8. RENDER: \`python tools/chaos-render/render.py ${changeId} --write\`. **Exit 2 means your RECORD
   is wrong — fix the record, never the rendered file — and re-run.** Count every invocation and
   every non-zero exit.

--- HUMAN STOP (mechanized) ---
No live human is available in this measurement. Record each decision AND resolve it with an
explicit, documented maintainer-style rationale, editing the entry's \`status:\` line to
\`RESOLVED-IN-ARM\` and tagging "resolved-in-arm (no live human; Stage-C step-5 mechanized run)".
Answering the \`approves-change\` decision IS the approval. State this documented deviation in the
frame record's \`commentary\`. If a checkpoint reports \`newStops > 0\`, still record the stop as a
real decision entry and resolve it the same way — and count it in \`newStopsTotal\`.

--- DELIVER (chaos:apply) ---
9. **Checkpoint K2** (entry, **scan-only** — C-12; no adjudication pass): payload with
   \`"ledgerFile": ".chaos/changes/${changeId}/decision-events.md"\`. An M4 firing here raises
   review/openspec/evidence.targeted — **apply the new obligations BEFORE implementing** (if
   \`openspec\` rises to 2, the full set is owed before DELIVER completes; design §5.3 law 5).
   Record its \`TRG-*\` event.
10. Implement to the approved contract in \`src/TaskTracker.Api\`, honoring the decisions verbatim
    and updating \`tests/TaskTracker.Tests\` to keep the baseline green. Honor R-003/R-004/R-005/
    R-006. Implement exactly the contract in the task (params, status codes, field names) so
    behaviour is testable.
11. Validate: \`dotnet build\` and \`dotnet test tests/TaskTracker.Tests/TaskTracker.Tests.csproj\`.
12. **Checkpoint K3** (DELIVER end): regenerate the payload with \`numstatFile\` + \`patchFile\`
    produced from the actual diff of this change against the pre-apply base. **The diff must
    include newly created files** — a bare \`git diff\` is blind to untracked files, so stage
    intent-to-add first (\`git add -N .\`) or otherwise ensure new files appear in the numstat.
    Then run the full two-call pattern (scan → adjudication → merge) and record \`TRG-*\` events.
    In your telemetry field \`k3NumstatScope\`, state **honestly and exactly** which paths the
    numstat covered (did you include \`.chaos/\` and \`openspec/\` artifacts, or only \`src/\`+\`tests/\`?)
    and the command you used. This is instrumentation we are measuring — do not tidy it up.
13. **New-stop protocol:** if the K3 verdict reports \`newStops > 0\`, surface ONE decision carrying
    every folded question and resolve it per the mechanized-stop clause. A \`stopSatisfiedBy\` field
    means no new stop — cite the covering decision in the delivery facts instead.
14. Emit \`.chaos/changes/${changeId}/records/deliver.pass-01.facts.json\`: envelope
    (\`phase\`:"deliver", \`sourceCommand\`:"chaos:apply", a \`chaos-apply\` run id, \`verdict\`
    APPLIED|PARTIALLY_APPLIED, \`at\`, \`assessment\`) and \`facts\`: \`build\`, \`tests\`, \`coverage\`
    (**one row per contract statement id**, \`evidence\` test|code|doc, \`whyNotTest\` whenever
    evidence is not "test"), \`rules\`, \`files\`, \`deviations\` (each with a backing decision id),
    \`scopeDrift\`. RENDER again.

--- VERIFY (chaos:verify) — run this when the classified \`verify\` dimension is ≥ 1 ---
15. **Checkpoint K4** (scan-only — C-12): payload with \`ledgerFile\` and
    \`"selfReview": "fail"\` **only if** your recorded self-review/review verdict was not clean.
    An X2 firing demands an independent review pass and deeper verify — **never a stop** (C-3).
16. **Obligation audit — the dimension vector is your checklist:** \`adr 2\` ⇒ no READY until the
    ADR exists (READY_WITH_DEBT at most, debt named); \`openspec 1|2\` ⇒ the delta|full set owed by
    K1–K3 firings exists; \`verify 1\` ⇒ the trigger-relevant safeguard checks were run (the
    trigger id says which surface); every \`newStops\` stop was surfaced and answered; dimensions
    never decreased without a recorded human override.
17. Re-run build + tests independently. Emit
    \`.chaos/changes/${changeId}/records/verify.pass-01.facts.json\`: \`verdict\`
    READY|READY_WITH_DEBT|NOT_READY, \`facts\`: \`archiveReadiness\`, \`checks\`, \`findings\`
    (\`VFY-###\`, carrying their \`TRG-*\` refs in \`detail\`). "Why this verdict" goes in
    \`verdictRationale\`. RENDER again.

STRICT ARTIFACT SET (this is being measured): the ONLY governance files you may create are
\`openspec/changes/${changeId}/*\` (at the classified depth — **none at all if \`openspec\` is 0**),
\`.chaos/changes/${changeId}/decision-events.md\`, \`.chaos/changes/${changeId}/records/*.json\`,
\`.chaos/changes/${changeId}/classification-state.json\`, and (if \`adr 2\` fires) the ADR the
obligation audit demands. \`change.md\` and \`lifecycle.md\` must exist ONLY as renderer output. Do
NOT create proposal-report.md, proposal-review.md, apply-report.md, verification.md or approval.md
— those are retired. Scratch payloads live in \`.tmp/\` and are not governance artifacts.

Rules of engagement:
- Honor the rules. Keep \`dotnet test\` green. Domain (\`Domain/**\`) must not reference ASP.NET types
  (R-004). Keep \`TaskState\` naming (R-005). Do NOT silently edit AGENTS.md or root README (R-006).
- Do NOT spawn subagents. Do the work yourself. Do NOT git commit — leave changes in the working tree.
- **Do NOT hand-write or hand-edit \`change.md\` / \`lifecycle.md\`.** If the rendered output looks
  wrong, the fix is in the record or the ledger. If you ever do edit them by hand you MUST report
  handWroteRenderedArtifact=true.
- Report the classification telemetry from the **classifier verdicts and
  \`classification-state.json\`**, not from memory.

WHEN DONE: run \`date +%s\` as END, compute wallTimeSeconds = END - START. Run the final
\`dotnet test\` and record passed/failed counts. Return the structured result with
arm="chaos-stage-c", filling every governance and classification telemetry field, plus
\`k3NumstatScope\`, \`escalationLegacyUsed\` and \`stoppedAtFrame\`=false.`
}


// Task statements lifted VERBATIM from ea-x2-stage-a-light/harness/stage-a-arms.workflow.js -
// the same pinned contracts the Stage-A and Stage-B Cost-B rows measured.
const STATEMENTS = {
  "task-count": "# Task B1 — Active-task count endpoint\n\nAdd a lightweight aggregate endpoint that reports how many tasks exist. This is a read-only\nconvenience for the dashboard; it introduces no authentication and no persistence-model change.\n\n## Contract (implement exactly this — behaviour is checked against it)\n\n- Add **`GET /tasks/count`**. It returns **HTTP 200** with a JSON object\n  **`{ \"count\": <integer> }`** where `count` is the total number of tasks currently in the store.\n- `count` must always equal the number of items returned by `GET /tasks` (same store, same moment).\n- Creating a task (`POST /tasks`, 201) increases `count` by exactly 1; deleting a task\n  (`DELETE /tasks/{id}`, 204) decreases `count` by exactly 1.\n- The root health endpoint **`GET /`** and all existing `/tasks` CRUD behaviour are unchanged.\n\n## Constraints\n\n- Keep `dotnet build` and `dotnet test` green (the existing 5 tests must still pass).\n- Do not change unrelated behaviour of the CRUD endpoints.\n- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).\n",
  "filter-tasks-by-status": "# Task B2 — Filter GET /tasks by status\n\n`GET /tasks` currently returns every task. Add an optional query-parameter filter on task status.\nThis is a query-shaping convenience: no authentication, no persistence-model change.\n\n## Contract (implement exactly this — behaviour is checked against it)\n\n- `GET /tasks?status=<state>` returns only tasks whose status equals `<state>`, where `<state>`\n  is one of the `TaskState` names: **`Open`**, **`InProgress`**, **`Done`**.\n- The match is **case-insensitive**: `?status=open` behaves identically to `?status=Open`.\n- `GET /tasks` with **no** `status` parameter returns **all** tasks (unchanged behaviour).\n- An **unrecognised** status value (e.g. `?status=Bogus`) returns **HTTP 400 Bad Request** and\n  returns no task list.\n- Existing seeded data: of the four seeded tasks, exactly **two** are `Open`, **one** is\n  `InProgress`, and **one** is `Done`. A filtered response must contain only tasks of the\n  requested status.\n\n## Constraints\n\n- Keep `dotnet build` and `dotnet test` green (the existing 5 tests must still pass; the\n  unfiltered `GET /tasks` test must keep working).\n- Do not change unrelated behaviour of the other CRUD endpoints.\n- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).\n",
  "enforce-title-max-length": "# Task B3 — Enforce a maximum title length\n\nTask titles are currently unbounded. Add an upper bound on title length as input validation.\nThis is a request-validation convenience: no authentication, no persistence-model change.\n\n## Contract (implement exactly this — behaviour is checked against it)\n\n- A task **title** may be at most **200 characters** long.\n- `POST /tasks` with a title **longer than 200 characters** must be rejected with\n  **HTTP 400 Bad Request** and must not create a task.\n- `PUT /tasks/{id}` with a title **longer than 200 characters** must be rejected with\n  **HTTP 400 Bad Request** and must not modify the task.\n- A title of **exactly 200 characters** is accepted (`POST` → 201, `PUT` → 200).\n- The existing **blank/whitespace title → 400** behaviour is preserved for both `POST` and `PUT`.\n- Titles of normal length continue to work exactly as before.\n\n## Constraints\n\n- Keep `dotnet build` and `dotnet test` green (the existing 5 tests must still pass).\n- Do not change unrelated behaviour of the other CRUD endpoints.\n- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).\n",
}

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args
const pairs = (parsedArgs.pairs || []).map((p) => ({ ...p, statement: STATEMENTS[p.changeId] }))
const PHASE_TITLES = ['B1 - task count', 'B2 - filter by status', 'B3 - title max length']
const out = []

for (let i = 0; i < pairs.length; i++) {
  const p = pairs[i]
  const phaseTitle = PHASE_TITLES[i] || ('B' + (i + 1))
  phase(phaseTitle)
  log(phaseTitle + ' (' + p.changeId + '): Arm A (CHAOS Stage-C, no preset flag) starting')

  const a0 = budget.spent()
  const chaos = await agent(stageCGovernedPrompt(p), {
    label: 'B' + (i + 1) + ':armA-stageC', phase: phaseTitle, schema: ARM_SCHEMA, agentType: 'general-purpose',
  })
  const a1 = budget.spent()

  log(phaseTitle + ' (' + p.changeId + '): Arm B (plain) starting')
  const plain = await agent(plainPrompt(p), {
    label: 'B' + (i + 1) + ':armB-plain', phase: phaseTitle, schema: ARM_SCHEMA, agentType: 'general-purpose',
  })
  const a2 = budget.spent()

  out.push({
    pair: 'B' + (i + 1),
    changeId: p.changeId,
    armA_chaos: chaos,
    armB_plain: plain,
    tokens: {
      method: 'budget.spent() output-token delta around each sequential agent; output-only proxy, no budget cap set',
      armA_output_tokens: a1 - a0,
      armB_output_tokens: a2 - a1,
    },
  })
  const trg = (chaos && chaos.firedTriggers && chaos.firedTriggers.length) ? chaos.firedTriggers.join(',') : 'NONE'
  log(phaseTitle + ' done: armA tests=' + (chaos ? chaos.testsPassed : 'NULL') + ' openspec=' + (chaos ? chaos.openspecDepth : '?') + ' triggers=' + trg + ' tok=' + (a1 - a0) + '; armB tests=' + (plain ? plain.testsPassed : 'NULL') + ' tok=' + (a2 - a1))
}

return { pairs: out, totalOutputTokens: budget.spent() }
