export const meta = {
  name: 'effort-medium-arms',
  description: 'Option-3 effort trial: the composite toolkit (options 1+2) at a parameterized reasoning effort, governed vs plain, over P1 (band B, trigger-rich) + B2/B3 (band A, zero-trigger short-circuit). Effort is set explicitly per agent and recorded — the lever-run-2 unrecorded-xhigh confound is closed by construction. Sequential for clean per-arm output-token deltas.',
  phases: [
    { title: 'P1 — auth gate' },
    { title: 'B2 — filter by status' },
    { title: 'B3 — title max length' },
  ],
}

// SCHEMA SIZE IS A HARD GATE (Stage-D lesson: 6.3 KB rejected, 3.6 KB works). Lever-run schema
// kept field-for-field for comparability, plus three composite-era fields at the end.
const S = { type: 'string' }
const I = { type: 'integer' }
const B = { type: 'boolean' }
const ARM_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    arm: S,
    summary: { type: 'string', description: '2-4 sentences on what you did' },
    codeFilesChanged: { type: 'array', items: { type: 'string' }, description: 'src/ and tests/ files changed' },
    testsPassed: I,
    testsFailed: I,
    testsGreen: B,
    wallTimeSeconds: { type: 'integer', description: 'END-START via date +%s' },
    buildOk: B,
    selfAssessment: { type: 'string', description: 'honest note on confidence and gaps' },
    governanceArtifactsProduced: { type: 'array', items: { type: 'string' }, description: 'CHAOS artifacts now existing; empty for plain' },
    finalDimensions: { type: 'string', description: '"stops N · ev.t N · ev.b N · review N · verify N · openspec N · adr N"' },
    openspecDepth: { type: 'integer', description: '0 skip / 1 delta / 2 full' },
    newStopsTotal: { type: 'integer', description: 'trigger-created stops; S1 floor NOT counted' },
    stopCounts: { type: 'string', description: 'format "S1:n S2:n S3:n S4:n"' },
    absorptionEvents: I,
    verifyRanInLoop: B,
    auditRuns: I,
    auditFinalExit: { type: 'integer', description: 'exit of the FINAL audit run; must be 0' },
    handWroteRenderedArtifact: { type: 'boolean', description: 'HONESTY: hand-wrote change.md/lifecycle.md?' },
    loopDeviations: { type: 'string', description: 'HONESTY: departures from the chaos-run loop' },
    modelInvocations: { type: 'string', description: 'REQUIRED: "ceiling:n mid:n floor:n" agent invocations incl. your own run as ceiling:1' },
    tierDelegations: { type: 'string', description: 'one line per delegation: "step->tier->DONE|ESCALATE"; "none" if none' },
    easyGateClosedAt: { type: 'string', description: 'what closed the L1-D11 easy gate ("never opened" | "firing M3 @scan 2" | ...)' },
    tierEscalations: { type: 'integer', description: 'times a delegated step came back ESCALATE/NEEDS_ORCHESTRATOR' },
    digestCheckExit: { type: 'integer', description: 'digest freshness the loop frame packet reported (0 fresh)' },
    digestUsed: { type: 'boolean', description: 'read the digest (true) or fell back to full sources (false)' },
    governanceFilesRead: { type: 'integer', description: 'distinct governance/reference files you opened' },
    scanInvocations: { type: 'integer', description: 'direct scan.py calls (work-loop rescan/k2/merge/tier only under composites)' },
    recordInvocations: { type: 'integer', description: 'direct record.py calls — the composites make this 0' },
    adjudicationPasses: { type: 'integer', description: 'adjudication passes YOU performed' },
    toolFailures: { type: 'string', description: 'HONESTY: any loop/scan/record/render/audit failure + what you did; "none" if none' },
    judgementAutoFilled: { type: 'boolean', description: 'HONESTY: did any tool output arrive with a judgement field pre-filled?' },
    // --- composite-era telemetry (options 1+2) ---
    loopInvocations: { type: 'integer', description: 'chaos-loop calls (frame/frame-commit/materialize/close/close-commit)' },
    shortCircuited: { type: 'boolean', description: 'did frame-commit defer the frame writes (short-circuit.json created)?' },
    closeAborts: { type: 'integer', description: 'times `loop close` aborted back to the work loop' },
  },
  required: ['arm', 'summary', 'codeFilesChanged', 'testsPassed', 'testsFailed', 'testsGreen', 'wallTimeSeconds', 'buildOk'],
}

/*__PLAIN_FROZEN__*/

/*__PLAIN_LIGHT__*/

// ---- Governed arm: the COMPOSITE toolkit (options 1+2), effort parameterized. ----
function governedPrompt(p) {
  const changeId = p.changeId
  return `You are executing the real CHAOS governed lifecycle (Controlled, Human-led,
Agent-Orchestrated software delivery) on a change in this repository, using the **composite
toolkit**: the \`chaos-loop\` frame/close composites over the governance digest (L2), model
tiering under the ceiling rule (L1), \`chaos-scan\` (L3) and \`chaos-record\` (L4). There is
**NO preset flag** on this run — **zero floors** — so the classifier's fired triggers alone
decide how much rigor this change owes. Work ONLY inside the git worktree at:
  ${p.wtA}

**There are no phases.** ONE continuous loop replaces \`propose → review → apply → verify\`.
Checkpoints are **evidence classes**: K1 when the intent exists, K2 when a decision is answered,
K3 **every time the diff grows**, K4 when the self-review verdict exists. You stop only where
materiality or your own discordance demands it.

--- READ THIS FIRST ---
1. Read \`.claude/skills/chaos-run/SKILL.md\` — **the command you are executing**; its loop,
   stop table, absorption duty and golden rules are binding. The digest staleness check runs
   INSIDE \`loop frame\` (below): when its packet says FRESH, read
   \`.claude/skills/chaos-shared/reference/governance-digest.md\` **once, now, in one step** and
   do NOT open the individual reference files it carries; when STALE, fall back to the skill's
   source list and report the degradation. Never re-read a file already in context. Report
   \`digestCheckExit\`, \`digestUsed\`, \`governanceFilesRead\` honestly.
**Do NOT read \`tools/chaos-render/schema/*.json\`** — pattern-match
\`tools/chaos-render/examples/\` for filled record shapes.

--- THE FRAME (ONE packet, ONE deliberation, ONE commit) ---
    python tools/chaos-loop/loop.py frame --change-dir .chaos/changes/${changeId} --run <runId> \\
      --intent "<the change intent, plain text>" \\
      --scope "scope: <comma-separated predicted paths — MUST list planned NEW paths, or M5
               false-fires on the first diff scan>" \\
      --subject src --subject tests --posture .chaos/architecture.md
The packet carries the digest freshness, the K1 verdict digest, the adjudication packet path
(the first K1 call is always due), and what the vector owes before S1. Then author ONE JSON
input file — the packet prints the exact shape — carrying your adjudication **raises** (judged
at ceiling per \`tools/chaos-classify/adjudication-prompt.md\`, raise-only, M1..M5 only, every
raise carries a cite; \`[]\` is valid and common), the **contract statements** (stable ids
\`C-001\`…, yours end-to-end), and the **frame record judgement** (verdict, assessment,
verdictRationale, sourceManifest/risk/framingTraceability facts). Then:
    python tools/chaos-loop/loop.py frame-commit --change-dir .chaos/changes/${changeId} \\
      --run <runId> --input <file> --title "<title>"
It merges, writes the artifacts, renders, and prints the S1 presentation.
**Zero-trigger short-circuit (tool-decided):** if the post-merge frame fired nothing and sits
at floors, frame-commit DEFERS the artifact writes to close and presents the contract inline —
that is correct behavior, not a defect. S1 still stops. Report \`shortCircuited\` honestly. If
ANY trigger fires later, run \`loop materialize\` AT THE FIRING, before that surface is
implemented further. OpenSpec artifacts owed by the vector are authored at the obligation's
firing, BEFORE S1 when K1 owes them: \`0\` → skip entirely (contract lives in \`change.md\`
§Contract); \`1\` → delta spec under \`openspec/changes/${changeId}/\`; \`2\` → the full set. The
\`openspec\` CLI may be absent; hand-authoring stands in for it — that is NOT degraded mode.
**S1**: exactly ONE decision entry with \`approves-change: true\`, folding every K1-fired
question into its presentation with \`folds: <n>\`.

--- THE WORK LOOP (granular scans, unchanged) ---
For each task-sized unit: implement it in \`src/TaskTracker.Api\` (keeping
\`tests/TaskTracker.Tests\` green), then:
    python tools/chaos-scan/scan.py rescan --change-dir .chaos/changes/${changeId}   # after each unit
    python tools/chaos-scan/scan.py k2     --change-dir .chaos/changes/${changeId}   # after an answered decision
Read each verdict digest, not raw JSON. \`adjudication: DUE\` → judge the named packet yourself,
write \`{"raises":[...]}\`, apply via \`scan.py merge --raises <file>\`; \`not due\` → do NOT run
the pass. Never suppress a firing, never touch X1/X2/X3, never lower a dimension, no \`ESC-*\`
entries. Stops: \`+N placed\` → **S2**, ONE decision folding every question from that scan;
\`ABSORBED\` → amend the named pending entry, increment its \`folds:\` (report in
\`absorptionEvents\`); \`SATISFIED\` → cite the covering decision in the delivery facts; **S3**
whenever YOU hit ambiguity the repo does not answer. Late-fired artifact obligations (OpenSpec
delta/full, an ADR — and on a short-circuited run the deferred frame artifacts via
\`loop materialize\`) are authored **at the firing**, never at close.

--- MODEL TIERING (L1) ---
Your session model is the **ceiling**; never spawn a subagent on a stronger model. Floor
(haiku, \`chaos-mechanical-executor\`): render repair loop, mechanical audit repairs only. Mid
(sonnet, general-purpose): an implementation unit ONLY while the easy gate is open (zero
triggers fired AND no preset floor); the gate closes for the run on any firing, X2, or two
failed test cycles. Ceiling (you): adjudication, stops, ledger entries, judgement prose,
OpenSpec, self-review, verify. Overhead guard applies. REQUIRED TELEMETRY: \`modelInvocations\`
("ceiling:n mid:n floor:n", your own run counts as ceiling:1), \`tierDelegations\`,
\`tierEscalations\`, \`easyGateClosedAt\`.

Governance to read, SCOPED: \`AGENTS.md\`, \`.chaos/constitution.md\`, \`.chaos/rules/index.md\`
(R-003 keep tests green, R-004 domain must not depend on the HTTP layer, R-005 keep
\`TaskState\` naming, R-006 protected files), \`.chaos/architecture.md\`. FORBIDDEN: repo-wide
discovery sweeps; reading \`.chaos/changes/secure-task-api/\` or
\`.chaos/changes/add-task-query-filters/\`.

FIRST, run \`date +%s\` and remember the number as START.

=== TASK (the change to deliver) ===
${p.statement}
=== END TASK ===

Execute it as ONE \`chaos:run\` under change id "${changeId}".

--- THE CLOSE (ONE packet, ONE deliberation, ONE commit) ---
When the contract is delivered: inline self-review (scope sane / rules mapped / contract
testable / decisions complete), form the constrained verdict, then:
    python tools/chaos-loop/loop.py close --change-dir .chaos/changes/${changeId} --run <runId> \\
      --self-review clean|fail --build-log <file> --test-log <file>
It runs the final rescan + K4, materializes a still-deferred short-circuit (zero-trigger happy
path), emits the verify record when \`verify\` ≥ 1 (independent re-run — at \`verify 0\` nothing
runs and that is the correct outcome), emits the deliver record, and prints ONE close packet
including the advisory obligation audit. **It ABORTS on new evidence** (a firing, a stop, new
surface, a fired-while-deferred marker, self-review \`fail\`): repair via the work loop and run
it again — report each abort in \`closeAborts\`. Then author ONE JSON input file (the packet
prints the shape): deliver judgement + every coverage row (\`covered\`/\`evidence\`/\`whyNotTest\`
— non-test evidence always carries \`whyNotTest\`), deviations (each with a backing decision
id), scope-drift judgement if M5 fired, verify judgement if that record exists. Then:
    python tools/chaos-loop/loop.py close-commit --change-dir .chaos/changes/${changeId} \\
      --run <runId> --input <file>
The obligation audit is the hard gate (a failure names the owed artifact — author it or
surface the unanswered stop, then re-run; record \`auditRuns\`, \`auditFinalExit\`), then it
renders and prints the close summary. Do NOT call \`record.py\` or \`audit.py\` directly — the
composites own those steps now; report \`recordInvocations\` honestly (expected 0) and count
every \`loop\` call in \`loopInvocations\`.

--- HUMAN STOP (mechanized) ---
No live human is available in this measurement. Record each decision AND resolve it with an
explicit, documented maintainer-style rationale, setting the entry's \`status:\` line to
\`RESOLVED-IN-ARM\` and tagging "resolved-in-arm (no live human; effort-trial mechanized run)".
Answering the \`approves-change\` decision IS the approval. State this documented deviation in
the frame record's \`commentary\`. Resolve each stop **when you reach it**, in order — never
batch them.

STRICT ARTIFACT SET (this is being measured): the ONLY governance files you may create are
\`openspec/changes/${changeId}/*\` (at the classified depth — **none at all if \`openspec\` is
0**), \`.chaos/changes/${changeId}/decision-events.md\`, your \`loop\` input files (put them in
the change dir), and (if \`adr\` ≥ 2) the ADR the audit demands. The tools own everything else:
\`records/*\`, \`classification-state.json\`, \`scan-inputs.json\`, \`scan/*\`,
\`short-circuit.json\`, \`change.md\`/\`lifecycle.md\` (renderer output ONLY — hand-editing them is
reported via \`handWroteRenderedArtifact\`). Do NOT create proposal-report.md,
proposal-review.md, apply-report.md, verification.md or approval.md — retired.

Rules of engagement:
- Honor the rules. Keep \`dotnet test\` green. Domain (\`Domain/**\`) must not reference ASP.NET
  types (R-004). Keep \`TaskState\` naming (R-005). Do NOT silently edit AGENTS.md or root
  README (R-006).
- Implement exactly the contract in the task (headers, params, status codes, field names).
- Subagents: ONLY the two tiered uses above. No other delegation. Do NOT git commit.
- Report telemetry from the tools' own output and \`classification-state.json\`, not memory.
- Departures from the loop go in \`loopDeviations\`; tool failures in \`toolFailures\`. An honest
  deviation is data; a hidden one corrupts the measurement.

WHEN DONE: run \`date +%s\` as END, compute wallTimeSeconds = END - START. Run the final
\`dotnet test\` and record passed/failed counts. Return the structured result with
arm="chaos-composite-effort", filling every governance and telemetry field.`
}

/*__STATEMENTS__*/

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args
const PLAIN_VARIANT = { P1: 'frozen', P2: 'frozen', P3: 'frozen', B1: 'light', B2: 'light', B3: 'light' }
const PHASE_TITLES = {
  P1: 'P1 — auth gate', P2: 'P2 — soft-delete', P3: 'P3 — optimistic concurrency',
  B1: 'B1 — task count', B2: 'B2 — filter by status', B3: 'B3 — title max length',
}
// RUNKIT invariant: arms run on Opus 5 (the L1 ceiling), as every measured row has.
const ARM_MODEL = 'opus'
// THE VARIABLE UNDER TEST: reasoning effort, set explicitly per agent call and echoed into the
// output — the lever-run-2 unrecorded-xhigh confound is closed by construction, not by memory.
const EFFORT = parsedArgs.effort
if (EFFORT !== 'high' && EFFORT !== 'medium') {
  throw new Error('args.effort must be "high" or "medium" — explicit, never inherited')
}
const pairs = (parsedArgs.pairs || []).map((p) => ({ ...p, statement: STATEMENTS[p.changeId] }))
const out = { effort: EFFORT, armModel: ARM_MODEL, pairs: [] }

for (let i = 0; i < pairs.length; i++) {
  const p = pairs[i]
  const key = p.key
  const phaseTitle = PHASE_TITLES[key] || `Pair ${key}`
  phase(phaseTitle)
  log(`${key} (${p.changeId}): Arm A (CHAOS composite, effort=${EFFORT}) starting`)

  const a0 = budget.spent()
  const chaos = await agent(governedPrompt(p), {
    label: `${key}:armA-effort-${EFFORT}`, phase: phaseTitle, schema: ARM_SCHEMA,
    agentType: 'general-purpose', model: ARM_MODEL, effort: EFFORT,
  })
  const a1 = budget.spent()

  const plainPrompt = PLAIN_VARIANT[key] === 'light' ? plainPromptLight : plainPromptFrozen
  log(`${key} (${p.changeId}): Arm B (plain, ${PLAIN_VARIANT[key]} variant, effort=${EFFORT}) starting`)
  const plain = await agent(plainPrompt(p), {
    label: `${key}:armB-plain-${EFFORT}`, phase: phaseTitle, schema: ARM_SCHEMA,
    agentType: 'general-purpose', model: ARM_MODEL, effort: EFFORT,
  })
  const a2 = budget.spent()

  out.pairs.push({
    key,
    changeId: p.changeId,
    plainVariant: PLAIN_VARIANT[key],
    effort: EFFORT,
    armModel: ARM_MODEL,
    armA_chaos: chaos,
    armB_plain: plain,
    tokens: {
      method: 'budget.spent() output-token delta around each sequential agent; output-only proxy, no budget cap set',
      armA_output_tokens: a1 - a0,
      armB_output_tokens: a2 - a1,
    },
  })
  log(`${key} done: armA=${chaos ? chaos.testsPassed + '/' + (chaos.testsPassed + chaos.testsFailed) : 'NULL'} sc=${chaos ? chaos.shortCircuited : '?'} dims=${chaos ? chaos.finalDimensions : '?'} loops=${chaos ? chaos.loopInvocations : '?'} scans=${chaos ? chaos.scanInvocations : '?'} audit=${chaos ? chaos.auditFinalExit : '?'} tok=${a1 - a0}; armB=${plain ? plain.testsPassed + '/' + (plain.testsPassed + plain.testsFailed) : 'NULL'} tok=${a2 - a1}`)
}

return { ...out, totalOutputTokens: budget.spent() }
