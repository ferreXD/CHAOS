export const meta = {
  name: 'lever-run-arms',
  description: 'Lever-run measurement: the post-lever toolkit (L1 tiering + ceiling, L2 governance digest, L3 chaos-scan, L4 chaos-record) vs plain, over the 6 Stage-D tasks spanning band B and band A. Plain-arm prompts byte-identical to the step-5/Stage-D tiers. Sequential for clean per-arm output-token deltas.',
  phases: [
    { title: 'P1 — auth gate' },
    { title: 'P2 — soft-delete' },
    { title: 'P3 — optimistic concurrency' },
    { title: 'B1 — task count' },
    { title: 'B2 — filter by status' },
    { title: 'B3 — title max length' },
  ],
}

// SCHEMA SIZE IS A HARD GATE: Stage-D's first launch was rejected outright ("output schema too
// large to classify safely") at 6.3 KB serialized; 3.6 KB works. Descriptions are LABELS, not
// documentation — the prompt explains every field at length. Anything recoverable from archived
// evidence (classification-state.json, the ledger, records/) is NOT self-reported: fired
// triggers, checkpoints, raises, TRG ids, decision ids, openspec artifact paths all live there.
// Self-report is reserved for honesty fields and process counts evidence cannot show.
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
    // --- governance outcome (counts + honesty; ids live in the archived evidence) ---
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
    // --- L1 tiering + the creator model-invocation requirement ---
    modelInvocations: { type: 'string', description: 'REQUIRED: "ceiling:n mid:n floor:n" agent invocations incl. your own run as ceiling:1' },
    tierDelegations: { type: 'string', description: 'one line per delegation: "step->tier->DONE|ESCALATE"; "none" if none' },
    easyGateClosedAt: { type: 'string', description: 'what closed the L1-D11 easy gate ("never opened" | "firing M3 @scan 2" | ...)' },
    tierEscalations: { type: 'integer', description: 'times a delegated step came back ESCALATE/NEEDS_ORCHESTRATOR' },
    // --- L2 digest ---
    digestCheckExit: { type: 'integer', description: 'exit of digest.py --check at loop start' },
    digestUsed: { type: 'boolean', description: 'read the digest (true) or fell back to full sources (false)' },
    governanceFilesRead: { type: 'integer', description: 'distinct governance/reference files you opened' },
    // --- L3/L4 tools ---
    scanInvocations: { type: 'integer', description: 'chaos-scan calls (all subcommands)' },
    recordInvocations: { type: 'integer', description: 'chaos-record calls' },
    adjudicationPasses: { type: 'integer', description: 'adjudication passes YOU performed' },
    toolFailures: { type: 'string', description: 'HONESTY: any scan/record/render/audit failure + what you did; "none" if none' },
    judgementAutoFilled: { type: 'boolean', description: 'HONESTY: did any emitter output arrive with a judgement field pre-filled?' },
  },
  required: ['arm', 'summary', 'codeFilesChanged', 'testsPassed', 'testsFailed', 'testsGreen', 'wallTimeSeconds', 'buildOk'],
}

/*__PLAIN_FROZEN__*/

/*__PLAIN_LIGHT__*/

// ---- Governed arm: the post-lever toolkit (the variable under test). ----
function leverGovernedPrompt(p) {
  const changeId = p.changeId
  return `You are executing the real CHAOS governed lifecycle (Controlled, Human-led,
Agent-Orchestrated software delivery) on a change in this repository, using the **post-lever
toolkit**: the governance digest (L2), model tiering under the ceiling rule (L1), \`chaos-scan\`
(L3) and \`chaos-record\` (L4). There is **NO preset flag** on this run — **zero floors** — so the
classifier's fired triggers alone decide how much rigor this change owes. Work ONLY inside the
git worktree at:
  ${p.wtA}

**There are no phases.** ONE continuous loop replaces \`propose → review → apply → verify\`.
Checkpoints are **evidence classes**: K1 when the intent exists, K2 when a decision is answered,
K3 **every time the diff grows**, K4 when the self-review verdict exists. You stop only where
materiality or your own discordance demands it.

--- READ THIS FIRST, IN THIS ORDER (the L2 reading protocol) ---
1. From the worktree root: \`python tools/chaos-digest/digest.py --check\`
2. **Exit 0** → read \`.claude/skills/chaos-shared/reference/governance-digest.md\` **once, now,
   in one step**, and then do **NOT** open the individual governance reference files it carries
   (record protocol, decision protocol, ledger format, classifier + adjudication contracts,
   OpenSpec gate, layout, scope/delegation, tier map). Never re-read a file already in context.
   **Any other exit** → the digest is stale: fall back to the full reference list in
   \`.claude/skills/chaos-run/SKILL.md\`, and report the degradation.
3. Read \`.claude/skills/chaos-run/SKILL.md\` — **the command you are executing**; its loop
   (steps 0–6), stop table, absorption duty and golden rules are binding.
Report \`digestCheckExit\`, \`digestUsed\` and \`governanceFilesRead\` (distinct governance/reference
files you opened) honestly.
**Do NOT read \`tools/chaos-render/schema/*.json\`** — records are emitted by the L4 tool and
pattern-matched against \`tools/chaos-render/examples/\`; \`render.py --check\` is the validator.

--- HOW TO RUN A SCAN (L3 — the tool owns the protocol) ---
The classifier is driven through \`tools/chaos-scan/scan.py\`; do NOT hand-build payloads, do NOT
run \`git diff\` for scans yourself, do NOT hand-write \`TRG-*\` events (the tool appends them).
    python tools/chaos-scan/scan.py k1 --change-dir .chaos/changes/${changeId} --run <runId> \\
      --intent "<the change intent, plain text>" \\
      --scope "scope: <comma-separated predicted paths — MUST list planned NEW paths, or M5
               false-fires on the first diff scan>" \\
      --subject src --subject tests --posture .chaos/architecture.md
    python tools/chaos-scan/scan.py rescan --change-dir .chaos/changes/${changeId}   # after each work unit
    python tools/chaos-scan/scan.py k2     --change-dir .chaos/changes/${changeId}   # after an answered decision
    python tools/chaos-scan/scan.py k4     --change-dir .chaos/changes/${changeId} --self-review <verdict>
Each call prints a **verdict digest**: firings with cites, demoted candidates, the stop duty, the
vector, and whether adjudication is due. **Read the digest, not raw JSON.** When it says
\`adjudication: DUE\`, perform the adjudication pass **yourself** over the named
\`scan/packet-N.json\` per \`tools/chaos-classify/adjudication-prompt.md\` (raise-only, M1..M5 only,
**every raise carries a cite**), write \`{"raises":[...]}\` (an EMPTY list is valid and common)
and apply it:
    python tools/chaos-scan/scan.py merge --change-dir .chaos/changes/${changeId} --raises <file>
When it says \`not due\`, **do not run the pass** — that is the cadence rule. Never suppress a scan
firing, never touch X1/X2/X3, never lower a dimension. The tool scopes the diff per C-15 (subject
only, never the change's own bookkeeping) — that is why you pass \`--subject\`.
Under Stage C/D there is **no mode escalation**: do NOT write \`ESC-*\` entries or
\`escalatedFrom\` frontmatter.

--- HOW TO WRITE RECORDS (L4 — facts derived, judgement yours) ---
    python tools/chaos-record/record.py frame   --change-dir <dir> --run <runId> --title "<title>"
    python tools/chaos-record/record.py deliver --change-dir <dir> --run <runId> \\
      --build-log <file> --test-log <file> [--rule R-003]...
    python tools/chaos-record/record.py verify  --change-dir <dir> --run <runId> --run-checks
The emitter writes the record with **facts derived and judgement fields empty**. You then fill
ONLY the judgement: \`verdict\`, \`assessment\`, \`verdictRationale\`, \`commentary\`, coverage
\`covered\`/\`evidence\`/\`whyNotTest\`, \`deviations\` (each with a backing decision id), \`rules\`
status+evidence, verify \`findings\`/\`traceability\`/\`archiveReadiness\`. \`records/contract.json\`
is yours end-to-end (stable ids \`C-001\`…, no checkbox state). If any emitter output arrives with
a judgement field ALREADY filled, that is a defect — report \`judgementAutoFilled: true\` and say
which. Then render: \`python tools/chaos-render/render.py ${changeId} --write\` — **a non-zero
exit means your RECORD is wrong; fix the record, never the rendered file.**

--- MODEL TIERING (L1) — and the accounting this run requires ---
Your own session model is the **ceiling**. **Never spawn a subagent on a stronger model than
your own.** Per \`.claude/skills/chaos-shared/reference/model-tier-map.md\`:
- **Floor (haiku)** — you MAY delegate to the \`chaos-mechanical-executor\` subagent: the render
  repair loop and mechanical audit repairs. It never decides; if it returns ESCALATE or
  NEEDS_ORCHESTRATOR, finish the step yourself.
- **Mid (sonnet)** — while the **easy gate** is open (zero triggers fired so far AND no preset
  floor) you MAY delegate an implementation unit to a general-purpose subagent at
  \`model: 'sonnet'\`, giving it the full task contract and stop conditions. The gate **closes for
  the rest of the run** on any trigger firing, an X2, or two failed test cycles — after that,
  implementation is yours at ceiling, and any mid-tier unit that hit a failure is redone by you.
- **Ceiling (you)** — adjudication, every stop, ledger decision entries, judgement prose,
  OpenSpec authoring, self-review, verify. Never delegated.
Apply the overhead guard: if writing the delegation prompt costs more than doing the step, do it
inline. **REQUIRED TELEMETRY:** \`modelInvocations\` as \`"ceiling:n mid:n floor:n"\` — count every
agent invocation, including your own top-level run as one ceiling invocation — plus
\`tierDelegations\`, \`tierEscalations\` and \`easyGateClosedAt\`. Count honestly; a transcript-derived
count is compared against yours.

Governance to read, SCOPED: \`AGENTS.md\`, \`.chaos/constitution.md\`, \`.chaos/rules/index.md\`
(R-001..R-007 — R-003 keep tests green, R-004 domain must not depend on the HTTP layer, R-005
keep \`TaskState\` naming, R-006 protected files), \`.chaos/architecture.md\` (boundary model +
NON-GOALS). FORBIDDEN: repo-wide discovery sweeps; reading \`.chaos/changes/secure-task-api/\` or
\`.chaos/changes/add-task-query-filters/\` (unrelated changes).

FIRST, run \`date +%s\` and remember the number as START.

=== TASK (the change to deliver) ===
${p.statement}
=== END TASK ===

Execute it as ONE \`chaos:run\` under change id "${changeId}", following the loop in
\`.claude/skills/chaos-run/SKILL.md\`:

**0 · Open.** Initialize \`.chaos/changes/${changeId}/\`. Capture the intent verbatim.

**1 · Classify at intent (K1), author what it owes, then S1.** Run \`scan.py k1\` (the first call
always reports adjudication due). Author the OpenSpec artifacts the \`openspec\` dimension owes
**BEFORE the stop**: \`0\` → skip entirely, contract lives in \`change.md\` §Contract (record the
skip); \`1\` → delta spec only under \`openspec/changes/${changeId}/\`; \`2\` → the full set. The
\`openspec\` CLI may be absent; hand-authoring stands in for it exactly as every prior row did —
CLI-absence is NOT degraded mode and NOT a trigger. Author \`records/contract.json\`, emit the
frame record via \`record.py frame\`, fill its judgement, render \`--write\`, then surface **S1**:
exactly ONE decision entry with \`approves-change: true\`, folding every K1-fired question into
its presentation with \`folds: <n>\`.

**2 · Work loop.** For each task-sized unit: implement it in \`src/TaskTracker.Api\` (keeping
\`tests/TaskTracker.Tests\` green), then \`scan.py rescan\`. Adjudicate only when due. Then:
  - \`stops: +N placed\` → **S2**: ONE decision carrying every question folded at this scan.
  - \`stops: ABSORBED\` → do NOT create a second decision; amend the named pending entry and
    increment its \`folds:\`. Report it in \`absorptionEvents\`.
  - \`stops: SATISFIED\` → no stop; cite the covering decision in the delivery facts.
  - **S3 — discordance:** whenever YOU hit ambiguity, a contradiction, or a material choice the
    repo does not answer, surface a decision (\`folds: <n>\`) and stop. Do not ask questions the
    repository already answers.
  - After any answered decision, \`scan.py k2\`. New obligations apply before further work.
Late-fired artifact obligations (OpenSpec delta/full, an ADR) are authored **at the firing**,
before that surface is implemented further — **never at close**.

**3 · Self-review (mechanical, never stops).** Inline self-review, then \`scan.py k4\` with your
verdict. An X2 firing raises review→2 and verify→1 mechanically — never a stop.

**4 · In-loop verify (vector-driven).** If \`verify\` ≥ 1, run it NOW via
\`record.py verify --run-checks\` (it re-runs build+tests independently), then fill
\`archiveReadiness\`, \`findings\` (\`VFY-###\`, carrying their \`TRG-*\` refs in \`detail\`),
\`traceability\` and \`verdictRationale\`. A failing verify **re-enters the work loop**. **At
\`verify 0\` nothing runs — that is the correct outcome, not an omission.**

**5 · Obligation audit (a gate, not a stop).** Emit the deliver record via \`record.py deliver\`,
fill its judgement, then:
    python tools/chaos-classify/audit.py --state .chaos/changes/${changeId}/classification-state.json \\
      --ledger .chaos/changes/${changeId}/decision-events.md --change-dir .chaos/changes/${changeId} \\
      [--openspec-dir openspec/changes/${changeId}] [--adr-dir .chaos/changes/${changeId}/adr]
    python tools/chaos-render/render.py ${changeId} --check
**A non-zero audit exit names the owed artifact: author it (or surface the unanswered stop) and
re-run.** Mechanical repairs are floor-delegable; a failure naming a stop is yours. You may not
close while it fails. Record \`auditRuns\` and \`auditFinalExit\`.

**6 · Close.** Render \`--write\`. (S4 applies only under a preset floor ≥ 2 — none here.)

--- HUMAN STOP (mechanized) ---
No live human is available in this measurement. Record each decision AND resolve it with an
explicit, documented maintainer-style rationale, setting the entry's \`status:\` line to
\`RESOLVED-IN-ARM\` and tagging "resolved-in-arm (no live human; lever-run mechanized run)".
Answering the \`approves-change\` decision IS the approval. State this documented deviation in the
frame record's \`commentary\`. Resolve each stop **when you reach it**, in order — never batch them.

STRICT ARTIFACT SET (this is being measured): the ONLY governance files you may create are
\`openspec/changes/${changeId}/*\` (at the classified depth — **none at all if \`openspec\` is 0**),
\`.chaos/changes/${changeId}/decision-events.md\`, \`.chaos/changes/${changeId}/records/*.json\`,
the scan working files the tool writes (\`classification-state.json\`, \`scan-inputs.json\`,
\`scan/*\`), and (if \`adr\` ≥ 2) the ADR the audit demands. \`change.md\` and \`lifecycle.md\` must
exist ONLY as renderer output. Do NOT create proposal-report.md, proposal-review.md,
apply-report.md, verification.md or approval.md — retired.

Rules of engagement:
- Honor the rules. Keep \`dotnet test\` green. Domain (\`Domain/**\`) must not reference ASP.NET
  types (R-004). Keep \`TaskState\` naming (R-005). Do NOT silently edit AGENTS.md or root README
  (R-006).
- Implement exactly the contract in the task (headers, params, status codes, field names).
- Subagents: ONLY the two tiered uses above (floor mechanical executor, mid implementation while
  the easy gate is open). No other delegation. Do NOT git commit — leave changes in the tree.
- **Do NOT hand-write or hand-edit \`change.md\` / \`lifecycle.md\`.** If the rendered output looks
  wrong, fix the record or ledger. If you ever do edit them by hand, report
  handWroteRenderedArtifact=true.
- Report telemetry from the tools' own output and \`classification-state.json\`, not from memory.
- If you departed from the loop in any way, say so in \`loopDeviations\`; if any tool failed, say
  so in \`toolFailures\`. An honest deviation is data; a hidden one corrupts the measurement.

WHEN DONE: run \`date +%s\` as END, compute wallTimeSeconds = END - START. Run the final
\`dotnet test\` and record passed/failed counts. Return the structured result with
arm="chaos-lever-run", filling every governance, tiering and lever telemetry field.`
}

/*__STATEMENTS__*/

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args
const PLAIN_VARIANT = { P1: 'frozen', P2: 'frozen', P3: 'frozen', B1: 'light', B2: 'light', B3: 'light' }
const PHASE_TITLES = {
  P1: 'P1 — auth gate', P2: 'P2 — soft-delete', P3: 'P3 — optimistic concurrency',
  B1: 'B1 — task count', B2: 'B2 — filter by status', B3: 'B3 — title max length',
}
// RUNKIT invariant: arms run on Opus 5, as in step 5 and Stage D, so ratios AND absolutes stay
// comparable. This is also the L1 CEILING for the governed arm — mid/floor resolve below it.
const ARM_MODEL = 'opus'
const pairs = (parsedArgs.pairs || []).map((p) => ({ ...p, statement: STATEMENTS[p.changeId] }))
const out = { pairs: [] }

for (let i = 0; i < pairs.length; i++) {
  const p = pairs[i]
  const key = p.key
  const phaseTitle = PHASE_TITLES[key] || `Pair ${key}`
  phase(phaseTitle)
  log(`${key} (${p.changeId}): Arm A (CHAOS post-lever) starting`)

  const a0 = budget.spent()
  const chaos = await agent(leverGovernedPrompt(p), {
    label: `${key}:armA-levers`, phase: phaseTitle, schema: ARM_SCHEMA,
    agentType: 'general-purpose', model: ARM_MODEL,
  })
  const a1 = budget.spent()

  // Plain prompt variant is pinned per task band so each governed arm is compared against the
  // SAME plain prompt its Stage-D denominator used. Byte-identity is the invariant.
  const plainPrompt = PLAIN_VARIANT[key] === 'light' ? plainPromptLight : plainPromptFrozen
  log(`${key} (${p.changeId}): Arm B (plain, ${PLAIN_VARIANT[key]} variant) starting`)
  const plain = await agent(plainPrompt(p), {
    label: `${key}:armB-plain`, phase: phaseTitle, schema: ARM_SCHEMA,
    agentType: 'general-purpose', model: ARM_MODEL,
  })
  const a2 = budget.spent()

  out.pairs.push({
    key,
    changeId: p.changeId,
    plainVariant: PLAIN_VARIANT[key],
    armModel: ARM_MODEL,
    armA_chaos: chaos,
    armB_plain: plain,
    tokens: {
      method: 'budget.spent() output-token delta around each sequential agent; output-only proxy, no budget cap set',
      armA_output_tokens: a1 - a0,
      armB_output_tokens: a2 - a1,
    },
  })
  log(`${key} done: armA=${chaos ? chaos.testsPassed + '/' + (chaos.testsPassed + chaos.testsFailed) : 'NULL'} openspec=${chaos ? chaos.openspecDepth : '?'} dims=${chaos ? chaos.finalDimensions : '?'} models=${chaos ? chaos.modelInvocations : '?'} digest=${chaos ? chaos.digestUsed : '?'} scans=${chaos ? chaos.scanInvocations : '?'} audit=${chaos ? chaos.auditFinalExit : '?'} tok=${a1 - a0}; armB=${plain ? plain.testsPassed + '/' + (plain.testsPassed + plain.testsFailed) : 'NULL'} tok=${a2 - a1}`)
}

return { ...out, totalOutputTokens: budget.spent() }
