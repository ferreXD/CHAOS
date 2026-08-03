export const meta = {
  name: 'stage-d-run-collapse-arms',
  description: 'Stage-D measurement: the collapsed chaos:run (one continuous loop, no phase march) vs plain, over 6 tasks spanning band B (frozen-3 + task-count) and band A (filter-by-status, title-max-length). Plain-arm prompts byte-identical to the step-5 tiers. Sequential for clean per-arm output-token deltas.',
  phases: [
    { title: 'P1 — auth gate' },
    { title: 'P2 — soft-delete' },
    { title: 'P3 — optimistic concurrency' },
    { title: 'B1 — task count' },
    { title: 'B2 — filter by status' },
    { title: 'B3 — title max length' },
  ],
}

// Step-5 telemetry fields (so rows line up field-for-field) + Stage-D loop telemetry.
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
    // --- render telemetry (Stage-B, unchanged) ---
    recordsEmitted: { type: 'array', items: { type: 'string' }, description: 'record files written under .chaos/changes/<id>/records/' },
    renderInvocations: { type: 'integer' },
    renderFailures: { type: 'integer' },
    renderFailureNotes: { type: 'string' },
    handWroteRenderedArtifact: { type: 'boolean', description: 'HONESTY FIELD: true if you ever hand-wrote or hand-edited change.md / lifecycle.md' },
    // --- classification telemetry (Stage-C, unchanged) ---
    checkpointsRun: { type: 'array', items: { type: 'string' }, description: 'the DISTINCT checkpoint classes you ran, e.g. ["K1","K3","K4"] (read classification-state.json checkpointsRun)' },
    firedTriggers: { type: 'array', items: { type: 'string' }, description: 'one entry per FIRED trigger, format "M2@K1 by=scan surface=auth" (use the classifier verdict, not your memory)' },
    finalDimensions: { type: 'string', description: 'the final dimension vector, format "stops N · evidence.targeted N · evidence.breadth N · review N · verify N · openspec N · adr N"' },
    openspecDepth: { type: 'integer', description: 'the final `openspec` dimension: 0 skip / 1 delta / 2 full set' },
    openspecArtifactsWritten: { type: 'array', items: { type: 'string' }, description: 'files written under openspec/changes/<id>/ (empty if openspec 0)' },
    openspecAuthoredAtStep: { type: 'string', description: 'STAGE-D TIMING: at which loop step you authored the OpenSpec artifact(s) — "before S1" / "at the raising scan (work unit N)" / "not owed". The rule is: at the firing, never at close.' },
    newStopsTotal: { type: 'integer', description: 'total trigger-CREATED stops across all scans (the S1 floor approval stop is NOT counted)' },
    classifierInvocations: { type: 'integer', description: 'how many times you ran tools/chaos-classify/classify.py' },
    classifierFailures: { type: 'integer' },
    classifierFailureNotes: { type: 'string' },
    adjudicationPasses: { type: 'integer', description: 'how many semantic adjudication passes you actually performed' },
    adjudicationDueCount: { type: 'integer', description: 'how many verdicts reported adjudicationDue=true (should equal adjudicationPasses)' },
    adjudicationRaises: { type: 'array', items: { type: 'string' }, description: 'each raise you made, format "M1@K1 surface=auth cite=<short>"' },
    finalConfidence: { type: 'string', description: 'the classification confidence from the LAST verdict (HIGH|MEDIUM|LOW)' },
    trgEventsWritten: { type: 'array', items: { type: 'string' }, description: 'the TRG-* ledger event ids you appended' },
    k3NumstatScope: { type: 'string', description: 'HONEST INSTRUMENTATION NOTE: exactly what the diff scans covered (which paths included/excluded, and the command). C-15 says .chaos/** and openspec/** are excluded — report what you actually did.' },
    escalationLegacyUsed: { type: 'boolean', description: 'HONESTY FIELD: true if you wrote any ESC-* entry, escalatedFrom frontmatter, or "⚠ escalated" line (legacy pre-C behaviour)' },
    // --- Stage-D loop telemetry ---
    workUnits: { type: 'integer', description: 'how many task-sized work units the loop ran (each followed by a diff rescan)' },
    diffScansRun: { type: 'integer', description: 'how many K3 (diff-class) scans you ran across the whole loop' },
    stopsS1: { type: 'integer', description: 'frame approval stops (must be exactly 1)' },
    stopsS2: { type: 'integer', description: 'materiality stops created by a work-loop scan reporting newStops > 0' },
    stopsS3: { type: 'integer', description: 'discordance stops YOU judged necessary (ambiguity/contradiction the repo does not answer)' },
    stopsS4: { type: 'integer', description: 'verify sign-off stops at close (only under a preset floor >= 2; expected 0 here)' },
    absorptionEvents: { type: 'integer', description: 'how many verdicts reported stopAbsorbedBy (a demand attached to an already-pending stop)' },
    absorptionNotes: { type: 'string', description: 'if absorptionEvents > 0: which entry absorbed what, and why a stop was pending at that moment. Empty otherwise.' },
    verifyRanInLoop: { type: 'boolean', description: 'true if the loop ran verification internally because the vector owed it (verify >= 1); false when verify 0 (not owed, not run)' },
    auditRuns: { type: 'integer', description: 'how many times you ran tools/chaos-classify/audit.py' },
    auditFinalExit: { type: 'integer', description: 'the exit code of the FINAL audit run (must be 0 to close)' },
    auditFailuresRepaired: { type: 'array', items: { type: 'string' }, description: 'each assertion that failed and what you did about it, format "openspec.delta-spec -> authored openspec/changes/<id>/specs/..."' },
    loopDeviations: { type: 'string', description: 'HONESTY FIELD: anything you did that departed from the chaos-run SKILL.md loop, and why. Empty if none.' },
  },
  required: ['arm', 'summary', 'codeFilesChanged', 'testsPassed', 'testsFailed', 'testsGreen', 'wallTimeSeconds', 'buildOk'],
}

/*__PLAIN_FROZEN__*/

/*__PLAIN_LIGHT__*/

// ---- Governed arm: the collapsed chaos:run loop (the Stage-D variable). ----
function stageDGovernedPrompt(p) {
  const changeId = p.changeId
  return `You are executing the real CHAOS governed lifecycle (Controlled, Human-led,
Agent-Orchestrated software delivery) on a change in this repository, under **Stage D — the
collapsed \`chaos:run\`**. There is **NO preset flag** on this run — **zero floors** — so the
classifier's fired triggers alone decide how much rigor this change owes. Work ONLY inside the
git worktree at:
  ${p.wtA}

**There are no phases.** Stage D replaces the mandatory \`propose → review → apply → verify\`
march with ONE continuous loop. Checkpoints are **evidence classes, not phases**: the classifier
runs whenever evidence is born or grows — K1 when the intent exists, K2 when a decision is
answered, K3 **every time the diff grows** (once per work unit), K4 when the self-review verdict
exists. You stop only where materiality or your own discordance demands it.

READ FIRST — this is the toolkit under test; do not paraphrase it from memory:
- \`.claude/skills/chaos-run/SKILL.md\` — **the command you are executing.** Its "The loop"
  section (steps 0–6), its stop table (S1–S4), the absorption duty, the capsule rule, and its
  golden rules are binding. Follow it; do not improvise a different shape.
- \`docs/design/2026-08-03-cost-bar-and-run-collapse.md\` §4.1 — what the collapse is.
- \`docs/design/2026-08-02-stage-c-progressive-rigor.md\` — §4 rigor dimensions, §5 trigger
  taxonomy + combination laws, §8 floors, §9 OpenSpec under C, §10 the floor stop.
- \`tools/chaos-classify/README.md\` — the wiring adapter, the **two-call pattern**, and the
  **Continuous mode (Stage D)** section: \`adjudicationDue\`, \`newSurfacePaths\`, \`scanSeq\`,
  \`stopAbsorbedBy\`, and the obligation audit.
- \`tools/chaos-classify/adjudication-prompt.md\` — the **pinned** semantic contract (raise-only,
  citations mandatory). YOU perform this pass, and **only when a verdict reports
  \`adjudicationDue: true\`**.
- \`.claude/skills/chaos-shared/reference/record-emission.md\` — the writer protocol: you emit
  RECORDS; the renderer writes \`change.md\` and \`lifecycle.md\`. You NEVER hand-write those two.
- \`.claude/skills/chaos-shared/reference/change-template.md\` §2 (decision-entry format, the
  \`folds: <n>\` field, and the \`TRG-*\` trigger-event shape) and §5 (record files + verdict enums).
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
\`.chaos/changes/secure-task-api/\` or \`.chaos/changes/add-task-query-filters/\` (unrelated changes).

--- HOW TO RUN A SCAN (the two-call pattern, now continuous) ---
Write a payload JSON (UTF-8, no BOM) into the worktree's \`.tmp/\` folder, NOT the change folder:
    {"checkpoint": "K1", "mode": null, "declaredTriggers": [],
     "intent": "<the change intent, plain text>",
     "scope": "scope: <comma-separated predicted paths — MUST list planned NEW paths, or M5
               false-fires on the first diff scan>",
     "postureFiles": [".chaos/architecture.md"],
     "mapFile": ".chaos/path-class-map.json"}
(K2/K3/K4 additionally take \`"ledgerFile"\`, \`"numstatFile"\`, \`"patchFile"\`, \`"selfReview"\`.)
From the worktree root:
1. **Scan call:** \`python tools/chaos-classify/classify.py --inline .tmp/<name>.json --state .chaos/changes/${changeId}/classification-state.json\`
2. **Read \`adjudicationDue\` in the verdict.** If TRUE, perform the adjudication pass yourself per
   the pinned contract, over the verdict's candidate/demoted surface plus the full inputs. You may
   only **RAISE materiality triggers** (M1..M5); every raise MUST cite the input line justifying
   it. Never suppress a scan firing, never touch mechanical triggers (X1/X2/X3), never lower a
   dimension. Write \`{"raises":[...]}\` to \`.tmp/<name>-raises.json\` (an EMPTY list is a valid and
   common outcome) and re-run the same payload with \`--adjudication\`. If \`adjudicationDue\` is
   FALSE, **do not run the pass** — that is the cadence rule (C-12) in its continuous form.
3. Append one \`TRG-*\` event to \`.chaos/changes/${changeId}/decision-events.md\` per NEWLY fired
   trigger (change-template §2 \`TRG-\` shape). \`TRG-\` headings are NOT decision entries and must
   not inflate the decision count.
4. Under Stage C/D there is **no mode escalation**: do NOT write \`ESC-*\` entries,
   \`escalatedFrom\` frontmatter, or "⚠ escalated" lines — legacy pre-C behaviour, a regression here.

--- THE DIFF-SCOPE RULE (C-15, mandatory) ---
Every diff scan describes the **governed subject only**. Exclude the change's own bookkeeping —
\`.chaos/**\`, \`openspec/**\`, and any ADR this change authored. Stage new files first or the diff
is blind to them:
    git add -N src tests
    git diff --numstat -- src tests > .tmp/scan<N>.numstat
    git diff          -- src tests > .tmp/scan<N>.patch
Blast radius is a property of the subject, never of the paperwork. Report exactly what you did in
\`k3NumstatScope\`.

FIRST, run \`date +%s\` and remember the number as START.

=== TASK (the change to deliver) ===
${p.statement}
=== END TASK ===

Execute it as ONE \`chaos:run\` under change id "${changeId}", following the loop in
\`.claude/skills/chaos-run/SKILL.md\`:

**0 · Open.** Initialize \`.chaos/changes/${changeId}/\`. Capture the intent verbatim.

**1 · Classify at intent (K1), author what it owes, then S1.** Run the scan (adjudicate — the
first K1 call always reports \`adjudicationDue: true\`). Then author the OpenSpec artifacts the
\`openspec\` dimension owes, **BEFORE the stop**:
  - \`openspec 0\` → **skip entirely**; the contract lives in \`change.md\` §Contract. Record the
    skip in the frame facts.
  - \`openspec 1\` → a **delta spec only** under \`openspec/changes/${changeId}/\`.
  - \`openspec 2\` → the **full set** (proposal.md, tasks.md, design.md, specs/ delta).
  The \`openspec\` CLI may be absent here; hand-authoring stands in for it exactly as every prior
  row did. CLI-absence is NOT degraded mode and NOT a trigger.
Emit \`records/contract.json\` (testable statements as DATA: stable ids \`C-001\`…, optional
\`group\`, \`text\`, \`source\` = shaping decision ids; NO checkbox state) and
\`records/frame.pass-01.facts.json\` (envelope: \`phase\`:"frame", \`pass\`:1, \`changeId\`,
\`sourceCommand\`:"chaos:run", \`run\`:\`RUN-<YYYY-MM-DD>-chaos-run-${changeId}-<6hex>\`, \`mode\`,
\`verdict\`:"READY_FOR_REVIEW", \`at\`: ISO-8601 Z, \`assessment\`; \`facts\`: \`title\`, \`intent\`
(≤3 single lines), \`openspec\` invocation proof including an honest "skipped, openspec dimension 0"
when that is what the classifier produced). RENDER:
\`python tools/chaos-render/render.py ${changeId} --write\` — **exit 2 means your RECORD is wrong;
fix the record, never the rendered file.** Then surface **S1**: exactly ONE decision entry with
\`approves-change: true\`, folding every K1-fired question into its presentation and declaring
\`folds: <n>\`.

**2 · Work loop.** For each task-sized unit: implement it in \`src/TaskTracker.Api\` (updating
\`tests/TaskTracker.Tests\` to stay green), then run a **diff scan** over the grown, C-15-scoped
diff. Adjudicate only when \`adjudicationDue\` is true. Then:
  - \`newStops > 0\` → **S2**: ONE decision carrying every question folded at this scan, with
    \`folds: <n>\`.
  - \`stopAbsorbedBy\` present → **do NOT create a second decision.** Amend the named pending entry:
    append the new folded question(s) and increment its \`folds:\` count. Report this in
    \`absorptionEvents\`/\`absorptionNotes\`.
  - \`stopSatisfiedBy\` present → no stop; cite the covering decision in the delivery facts.
  - **S3 — discordance:** whenever YOU hit ambiguity, a contradiction with the docs, or a material
    choice the repo does not answer, surface a decision (\`folds: <n>\`) and stop. Do not ask
    questions the repository already answers.
  - After any answered decision, run a **K2** scan (scan-only; M4 counts questions via \`folds:\`).
    New obligations apply before further implementation.
Late-fired artifact obligations (an OpenSpec delta/full set, an ADR) are authored **at the
firing**, before that surface is implemented further — **never at close**.

**3 · Self-review (mechanical, never stops).** Inline self-review (scope sane / rules mapped /
contract testable / decisions complete). Run **K4** with \`"selfReview": "fail"\` ONLY if your
verdict was not clean. An X2 firing raises review→2 and verify→1 mechanically — never a stop.

**4 · In-loop verify (vector-driven).** If the vector's \`verify\` ≥ 1, run it NOW, inside the run:
\`verify 1\` = the trigger-attributed safeguard checks (the firing's surface says which: auth →
credential/enforcement; data-store → persistence/migration; contract-dependency → contract
checks); \`verify 2\` = full orchestration. Re-run build + tests independently. Emit
\`records/verify.pass-01.facts.json\` (\`verdict\` READY|READY_WITH_DEBT|NOT_READY; \`facts\`:
\`archiveReadiness\`, \`checks\`, \`findings\` as \`VFY-###\` carrying their \`TRG-*\` refs in \`detail\`;
"why this verdict" in \`verdictRationale\`). A failing verify **re-enters the work loop**. **At
\`verify 0\` nothing runs — that is the correct outcome, not an omission.** Set \`verifyRanInLoop\`
honestly.

**5 · Obligation audit (a gate, not a stop).** Emit \`records/deliver.pass-01.facts.json\`
(envelope \`phase\`:"deliver", \`sourceCommand\`:"chaos:run", a run id, \`verdict\`
APPLIED|PARTIALLY_APPLIED, \`at\`, \`assessment\`; \`facts\`: \`build\`, \`tests\`, \`coverage\` — **one row
per contract statement id**, \`evidence\` test|code|doc, \`whyNotTest\` whenever evidence is not
"test" — \`rules\`, \`files\`, \`deviations\` each with a backing decision id, \`scopeDrift\`). Then:
    python tools/chaos-classify/audit.py --state .chaos/changes/${changeId}/classification-state.json \\
      --ledger .chaos/changes/${changeId}/decision-events.md --change-dir .chaos/changes/${changeId} \\
      [--openspec-dir openspec/changes/${changeId}] [--adr-dir .chaos/changes/${changeId}/adr]
    python tools/chaos-render/render.py ${changeId} --check
**A non-zero audit exit names the owed artifact: author it (or surface the unanswered stop) and
re-run.** The audit never authors anything, and you may not close while it fails. Record every
run in \`auditRuns\`, the final exit in \`auditFinalExit\`, and each repair in
\`auditFailuresRepaired\`.

**6 · Close.** RENDER \`--write\`. (S4 verify sign-off applies only under a preset floor ≥ 2 —
there is no preset here, so expect 0.)

--- HUMAN STOP (mechanized) ---
No live human is available in this measurement. Record each decision AND resolve it with an
explicit, documented maintainer-style rationale, editing the entry's \`status:\` line to
\`RESOLVED-IN-ARM\` and tagging "resolved-in-arm (no live human; Stage-D mechanized run)".
Answering the \`approves-change\` decision IS the approval. State this documented deviation in the
frame record's \`commentary\`. Resolve each stop **when you reach it**, in order — do not batch
them at the end.

STRICT ARTIFACT SET (this is being measured): the ONLY governance files you may create are
\`openspec/changes/${changeId}/*\` (at the classified depth — **none at all if \`openspec\` is 0**),
\`.chaos/changes/${changeId}/decision-events.md\`, \`.chaos/changes/${changeId}/records/*.json\`,
\`.chaos/changes/${changeId}/classification-state.json\`, and (if \`adr\` ≥ 2) the ADR the audit
demands. \`change.md\` and \`lifecycle.md\` must exist ONLY as renderer output. Do NOT create
proposal-report.md, proposal-review.md, apply-report.md, verification.md or approval.md — retired.
Scratch payloads live in \`.tmp/\` and are not governance artifacts.

Rules of engagement:
- Honor the rules. Keep \`dotnet test\` green. Domain (\`Domain/**\`) must not reference ASP.NET types
  (R-004). Keep \`TaskState\` naming (R-005). Do NOT silently edit AGENTS.md or root README (R-006).
- Implement exactly the contract in the task (headers, params, status codes, field names) so
  behaviour is testable.
- Do NOT spawn subagents. Do the work yourself. Do NOT git commit — leave changes in the working tree.
- **Do NOT hand-write or hand-edit \`change.md\` / \`lifecycle.md\`.** If the rendered output looks
  wrong, the fix is in the record or the ledger. If you ever do edit them by hand you MUST report
  handWroteRenderedArtifact=true.
- Report classification telemetry from the **classifier verdicts and \`classification-state.json\`**,
  not from memory.
- If you departed from the \`chaos-run\` loop in any way, say so in \`loopDeviations\`. An honest
  deviation is data; a hidden one corrupts the measurement.

WHEN DONE: run \`date +%s\` as END, compute wallTimeSeconds = END - START. Run the final
\`dotnet test\` and record passed/failed counts. Return the structured result with
arm="chaos-stage-d", filling every governance, classification and loop telemetry field.`
}

/*__STATEMENTS__*/

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args
const PLAIN_VARIANT = { P1: 'frozen', P2: 'frozen', P3: 'frozen', B1: 'light', B2: 'light', B3: 'light' }
const PHASE_TITLES = {
  P1: 'P1 — auth gate', P2: 'P2 — soft-delete', P3: 'P3 — optimistic concurrency',
  B1: 'B1 — task count', B2: 'B2 — filter by status', B3: 'B3 — title max length',
}
const pairs = (parsedArgs.pairs || []).map((p) => ({ ...p, statement: STATEMENTS[p.changeId] }))
const out = { pairs: [] }

for (let i = 0; i < pairs.length; i++) {
  const p = pairs[i]
  const key = p.key
  const phaseTitle = PHASE_TITLES[key] || `Pair ${key}`
  phase(phaseTitle)
  log(`${key} (${p.changeId}): Arm A (CHAOS Stage-D chaos:run) starting`)

  const a0 = budget.spent()
  const chaos = await agent(stageDGovernedPrompt(p), {
    label: `${key}:armA-stageD`, phase: phaseTitle, schema: ARM_SCHEMA, agentType: 'general-purpose',
  })
  const a1 = budget.spent()

  // Plain prompt variant is pinned per task band so each governed arm is compared against the
  // SAME plain prompt its step-5 denominator used. Byte-identity is the invariant.
  const plainPrompt = PLAIN_VARIANT[key] === 'light' ? plainPromptLight : plainPromptFrozen
  log(`${key} (${p.changeId}): Arm B (plain, ${PLAIN_VARIANT[key]} variant) starting`)
  const plain = await agent(plainPrompt(p), {
    label: `${key}:armB-plain`, phase: phaseTitle, schema: ARM_SCHEMA, agentType: 'general-purpose',
  })
  const a2 = budget.spent()

  out.pairs.push({
    key,
    changeId: p.changeId,
    plainVariant: PLAIN_VARIANT[key],
    armA_chaos: chaos,
    armB_plain: plain,
    tokens: {
      method: 'budget.spent() output-token delta around each sequential agent; output-only proxy, no budget cap set',
      armA_output_tokens: a1 - a0,
      armB_output_tokens: a2 - a1,
    },
  })
  log(`${key} done: armA=${chaos ? chaos.testsPassed + '/' + (chaos.testsPassed + chaos.testsFailed) : 'NULL'} openspec=${chaos ? chaos.openspecDepth : '?'} triggers=${chaos && chaos.firedTriggers ? chaos.firedTriggers.join(',') : '?'} stopsS2=${chaos ? chaos.stopsS2 : '?'} absorb=${chaos ? chaos.absorptionEvents : '?'} audit=${chaos ? chaos.auditFinalExit : '?'} tok=${a1 - a0}; armB=${plain ? plain.testsPassed + '/' + (plain.testsPassed + plain.testsFailed) : 'NULL'} tok=${a2 - a1}`)
}

return { ...out, totalOutputTokens: budget.spent() }
