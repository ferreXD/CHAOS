export const meta = {
  name: 'stage-c-step5-arms',
  description: 'Stage-C step-5 frozen-kit re-run (CORE tier): progressive-rigor governed arm (no preset flag, zero floors — triggers alone set rigor) vs plain, over the 3 frozen brownfield tasks, plus the FRAME-only ratchet-fidelity seed. Plain-arm prompt byte-identical to the frozen baseline. Sequential for clean per-arm output-token deltas.',
  phases: [
    { title: 'Pair 1 — auth gate' },
    { title: 'Pair 2 — soft-delete' },
    { title: 'Pair 3 — optimistic concurrency' },
    { title: 'V1 — ratchet fidelity seed' },
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

// ---- V1: FRAME-only ratchet-fidelity seed on the under-specified auth task. ----
function ratchetSeedPrompt(p) {
  const changeId = p.changeId
  return `${stageCPreamble(p, p.wtA, changeId)}
This is a **RATCHET-FIDELITY** test, not a cost pair: we are checking whether Stage-C's classifier
correctly detects a posture-crossing, under-specified change at FRAME. Do the FRAME reasoning
faithfully, run checkpoint K1 properly, then **STOP** — do NOT implement production code, do NOT
run DELIVER, do NOT run K2/K3/K4.

Change id: "${changeId}".

1. Scoped evidence scan; derive intent + predicted scope from the (deliberately vague) task.
2. **Checkpoint K1** via the full two-call pattern (scan → your adjudication pass per the pinned
   contract → merge raises). Record one \`TRG-*\` ledger event per fired trigger with its
   \`dimensions-after\` line.
3. Surface the material decisions this under-specified ask forces, as ledger entries (template §2).
   Exactly one carries \`approves-change: true\`. Resolve them per the mechanized-stop clause below.
4. Apply the OpenSpec gate at the classified depth (skip / delta / full) — writing whatever depth
   the \`openspec\` dimension demands, and nothing more.
5. Emit \`records/contract.json\` + \`records/frame.pass-01.facts.json\` and RENDER
   (\`python tools/chaos-render/render.py ${changeId} --write\`).
6. **STOP** after FRAME. Set stoppedAtFrame=true.

Under Stage C there is **no mode escalation** — the correct behaviour is that the *ratchet* fires
(triggers recorded, dimensions raised), NOT that a "light → standard" escalation is announced.
Writing an \`ESC-*\` entry, an \`escalatedFrom\` frontmatter key, or a "⚠ escalated" line would be
legacy behaviour: if you do it anyway, report escalationLegacyUsed=true honestly.

--- HUMAN STOP (mechanized) ---
No live human is available. Record each decision AND resolve it with an explicit maintainer-style
rationale, setting \`status:\` to \`RESOLVED-IN-ARM\` and tagging "resolved-in-arm (no live human;
Stage-C step-5 mechanized run)". Answering the \`approves-change\` decision IS the approval.

WHEN DONE: run \`date +%s\` as END, wallTimeSeconds = END - START. You will NOT run dotnet here:
report testsPassed=0, testsFailed=0, testsGreen=true, buildOk=true (not applicable — frame only).
Return the structured result with arm="chaos-stage-c-ratchet-seed", stoppedAtFrame=true, and every
classification telemetry field filled from the classifier verdicts.`
}

// Task statements embedded so the kit is self-contained; byte-identical to the frozen args.example.json.
const STATEMENTS = {
  "require-api-key-auth": "# Task 1 — Require API-key authentication on the task endpoints\n\nThe Task Tracker API is currently open (no authentication). Add API-key authentication to\nthe `/tasks` endpoints.\n\n## Contract (implement exactly this — behaviour is checked against it)\n\n- Every request to any `/tasks` route — `GET /tasks`, `GET /tasks/{id}`, `POST /tasks`,\n  `PUT /tasks/{id}`, `DELETE /tasks/{id}` — must present a valid API key in the\n  **`X-Api-Key`** request header.\n- The valid API key is the string value of configuration key **`ApiKey`**, defaulting to\n  **`test-secret-key`** when that configuration value is not set.\n- A request to a `/tasks` route with a **missing or incorrect** `X-Api-Key` header must be\n  rejected with **HTTP 401 Unauthorized**, and must not read or mutate any task (the auth\n  check happens before existence/validation checks).\n- The root health endpoint **`GET /`** must stay **public** (no key required).\n- Update the existing visible test suite as needed so it supplies the key and stays green.\n\n## Constraints\n\n- Keep `dotnet build` and `dotnet test` green.\n- Do not change unrelated behaviour of the CRUD endpoints.\n- Work only inside this repository's Task Tracker API (`src/TaskTracker.Api`) and its tests\n  (`tests/TaskTracker.Tests`).\n",
  "soft-delete-tasks": "# Task 2 — Soft-delete for tasks (schema change + backward-compatible migration)\n\nToday `DELETE /tasks/{id}` permanently removes a task. Change deletion to a **soft delete**\nso deleted tasks are retained but hidden by default.\n\n## Contract (implement exactly this — behaviour is checked against it)\n\n- Add a nullable **`deletedAt`** timestamp to the task model, serialized in JSON as\n  `deletedAt` (an ISO-8601 string when set, **`null`** when the task is active).\n- `DELETE /tasks/{id}` must **soft-delete**: set `deletedAt` to the current time and return\n  **204 No Content**. It must **not** permanently remove the task. Deleting an unknown id\n  still returns 404.\n- `GET /tasks` returns only **active** (not soft-deleted) tasks by default.\n- `GET /tasks?includeDeleted=true` returns **all** tasks including soft-deleted ones (whose\n  `deletedAt` is non-null).\n- `GET /tasks/{id}` returns **404 Not Found** for a soft-deleted task.\n- The four seeded tasks remain active (`deletedAt` = null) after startup — existing rows must\n  keep working (backward-compatible migration).\n\n## Constraints\n\n- Keep `dotnet build` and `dotnet test` green (the existing 5 tests must still pass).\n- Do not change unrelated behaviour of the other CRUD endpoints.\n- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).\n",
  "optimistic-concurrency-updates": "# Task 3 — Optimistic concurrency on task updates\n\n`PUT /tasks/{id}` currently overwrites a task unconditionally, so a client working from a\nstale copy can silently clobber someone else's update (lost-update race). Add **optimistic\nconcurrency control**.\n\n## Contract (implement exactly this — behaviour is checked against it)\n\n- Add an integer **`version`** to the task, serialized as `version`. New and seeded tasks\n  start at version **1**.\n- Every **successful** `PUT /tasks/{id}` increments the task's `version` by 1 (1 → 2 → 3 …).\n- `UpdateTaskRequest` gains an **optional** integer field **`expectedVersion`**:\n  - When `expectedVersion` is **provided** and does **not** equal the task's current\n    `version`, the update must be **rejected with HTTP 409 Conflict** and the task must be\n    left **unchanged** (no field updated, version not bumped).\n  - When `expectedVersion` is **provided** and **matches**, the update succeeds (200) and the\n    version increments.\n  - When `expectedVersion` is **omitted** (null), the update proceeds unconditionally\n    (backward-compatible last-writer-wins) and the version increments.\n- `POST /tasks` returns a task with `version` = 1.\n\n## Constraints\n\n- Keep `dotnet build` and `dotnet test` green — the existing PUT test omits `expectedVersion`\n  and must keep working.\n- Do not change unrelated behaviour of the other CRUD endpoints.\n- Work only inside `src/TaskTracker.Api` and its tests (`tests/TaskTracker.Tests`).\n",
  "secure-api-underspecified": "# Task A — Secure the API before we expose it\n\nWe're about to put the Task Tracker API on the public internet and it's wide open right now.\nPlease secure it with an API key so it's not just anyone hitting it. Keep the build and tests\ngreen.\n\n(That's the whole ask — do what you think is right.)\n"
}

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args
const withStmt = (p) => ({ ...p, statement: STATEMENTS[p.changeId] })
const pairs = (parsedArgs.pairs || []).map(withStmt)
const seeds = (parsedArgs.ratchetSeeds || []).map(withStmt)
const PHASE_TITLES = ['Pair 1 — auth gate', 'Pair 2 — soft-delete', 'Pair 3 — optimistic concurrency']
const out = { pairs: [], ratchetSeeds: [] }

for (let i = 0; i < pairs.length; i++) {
  const p = pairs[i]
  const phaseTitle = PHASE_TITLES[i] || `Pair ${i + 1}`
  phase(phaseTitle)
  log(`Pair ${i + 1} (${p.changeId}): Arm A (CHAOS Stage-C, no preset flag) starting`)

  const a0 = budget.spent()
  const chaos = await agent(stageCGovernedPrompt(p), {
    label: `pair${i + 1}:armA-stageC`, phase: phaseTitle, schema: ARM_SCHEMA, agentType: 'general-purpose',
  })
  const a1 = budget.spent()

  log(`Pair ${i + 1} (${p.changeId}): Arm B (plain) starting`)
  const plain = await agent(plainPrompt(p), {
    label: `pair${i + 1}:armB-plain`, phase: phaseTitle, schema: ARM_SCHEMA, agentType: 'general-purpose',
  })
  const a2 = budget.spent()

  out.pairs.push({
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
  log(`Pair ${i + 1} done: armA=${chaos ? chaos.testsPassed + '/' + (chaos.testsPassed + chaos.testsFailed) : 'NULL'} openspec=${chaos ? chaos.openspecDepth : '?'} triggers=${chaos && chaos.firedTriggers ? chaos.firedTriggers.join(',') : '?'} tok=${a1 - a0}; armB=${plain ? plain.testsPassed + '/' + (plain.testsPassed + plain.testsFailed) : 'NULL'} tok=${a2 - a1}`)
}

for (let i = 0; i < seeds.length; i++) {
  const p = seeds[i]
  phase('V1 — ratchet fidelity seed')
  log(`Ratchet seed (${p.changeId}) starting`)
  const s0 = budget.spent()
  const seed = await agent(ratchetSeedPrompt(p), {
    label: `${p.changeId}:ratchet-seed`, phase: 'V1 — ratchet fidelity seed', schema: ARM_SCHEMA, agentType: 'general-purpose',
  })
  const s1 = budget.spent()
  out.ratchetSeeds.push({
    changeId: p.changeId,
    expected: 'M1+M2 fire on surface auth; openspec 1; 0 new stops; no ESC-* legacy escalation',
    result: seed,
    tokens: { output_tokens: s1 - s0 },
  })
  log(`Ratchet seed ${p.changeId}: triggers=${seed && seed.firedTriggers ? seed.firedTriggers.join(',') : 'NULL'} openspec=${seed ? seed.openspecDepth : '?'} legacyEsc=${seed ? seed.escalationLegacyUsed : '?'}`)
}

return { ...out, totalOutputTokens: budget.spent() }
