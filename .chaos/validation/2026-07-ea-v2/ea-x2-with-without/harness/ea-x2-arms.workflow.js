export const meta = {
  name: 'ea-x2-with-without-arms',
  description: 'EA-X2 mechanized counterfactual: run CHAOS-governed (Arm A) vs plain (Arm B) for 3 brownfield tasks in isolated worktrees, sequential for clean per-arm token deltas',
  phases: [
    { title: 'Pair 1 — auth gate' },
    { title: 'Pair 2 — soft-delete' },
    { title: 'Pair 3 — optimistic concurrency' },
  ],
}

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
    governanceArtifactsProduced: { type: 'array', items: { type: 'string' }, description: 'CHAOS artifacts you WROTE (empty for the plain arm)' },
    materialDecisionsRecorded: { type: 'array', items: { type: 'string' }, description: 'material decisions you recorded (empty for the plain arm)' },
    governanceArtifactsReadAndUsed: { type: 'array', items: { type: 'string' }, description: 'governance artifacts you actually READ and that changed a choice you made (empty for the plain arm)' },
    selfAssessment: { type: 'string', description: 'honest note on confidence, gaps, anything you were unsure about' },
  },
  required: ['arm', 'summary', 'codeFilesChanged', 'testsPassed', 'testsFailed', 'testsGreen', 'wallTimeSeconds', 'buildOk'],
}

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

function chaosPrompt(p) {
  return `You are executing the real CHAOS governed lifecycle (Controlled, Human-led, Agent-Orchestrated software delivery) on a change in this repository. Work ONLY inside the git worktree at:
  ${p.wtA}

This repo is CHAOS-governed. Before deciding anything, DISCOVER and READ the governance:
- \`AGENTS.md\` (entrypoint, minimum pre-edit behaviour, protected files)
- \`.chaos/constitution.md\` (principles + the confidence/knowledge doctrine: FACT/INFERENCE/ASSUMPTION/UNKNOWN + HIGH/MEDIUM/LOW)
- \`.chaos/rules/index.md\` (executable rules R-001..R-007 — especially R-003 keep tests green, R-004 domain must not depend on the HTTP layer, R-005 keep \`TaskState\` naming, R-006 protected files)
- \`.chaos/architecture.md\` (boundary model, testing posture, and the NON-GOALS: auth / persistence are called out as out-of-scope, strict, decision-bearing work)
- the reference lifecycle at \`.chaos/changes/add-task-query-filters/\` for the exact artifact shapes (proposal-report.md, proposal-review.md, apply-report.md, verification.md, decision-events.md).

FIRST, run \`date +%s\` and remember the number as START.

=== TASK (the change to deliver) ===
${p.statement}
=== END TASK ===

Execute the governed lifecycle for change id "${p.changeId}", producing the real artifact set under \`.chaos/changes/${p.changeId}/\`:
1. PROPOSE — write \`.chaos/changes/${p.changeId}/proposal-report.md\`: intent, evidence inspected, blast radius, affected rules, and any MATERIAL DECISION this change forces. Note that this task touches an architecture NON-GOAL / decision-bearing area — surface that explicitly. (An \`openspec/changes/${p.changeId}/proposal.md\` sketch is welcome; \`openspec validate\` is best-effort — note if the CLI is absent.)
2. DECISIONS — write \`.chaos/changes/${p.changeId}/decision-events.md\`: every material decision with a knowledge-type + confidence label. IMPORTANT: no human is available to answer runtime decisions in this mechanized EA-X2 run. Record each decision AND resolve it with an explicit, documented maintainer-style rationale, tagged "resolved-in-arm (no live human; EA-X2 mechanized run)". This is a documented deviation from the normal Decision-Center stop-and-resume — state it.
3. REVIEW — write \`.chaos/changes/${p.changeId}/proposal-review.md\`: a verdict (e.g. READY_FOR_APPROVAL) with confidence, evidence_coverage, assumption_load.
4. APPLY — implement the code in \`src/TaskTracker.Api\`, updating \`tests/TaskTracker.Tests\` to keep the baseline green, honoring R-003/R-004/R-005. Write \`.chaos/changes/${p.changeId}/apply-report.md\`. Run \`dotnet build\` and \`dotnet test tests/TaskTracker.Tests/TaskTracker.Tests.csproj\`.
5. VERIFY — write \`.chaos/changes/${p.changeId}/verification.md\` with a dashboard (build, tests, rules honored, scope drift) and a confidence-labelled verdict. Run \`dotnet test\` again to evidence green.

Rules of engagement:
- Honor the rules. Keep \`dotnet test\` green. Domain (\`Domain/**\`) must not reference ASP.NET types (R-004). Keep \`TaskState\` naming (R-005). Do NOT silently edit AGENTS.md or root README (R-006).
- Implement exactly the contract in the task (headers, params, status codes, field names) so behaviour is testable.
- Do NOT spawn subagents. Do the work yourself. Do NOT git commit — leave changes in the working tree.
- For the "artifacts actually read" metric: track which governance artifacts you genuinely READ and that CHANGED a choice you made (not merely files you produced).

WHEN DONE: run \`date +%s\` as END, compute wallTimeSeconds = END - START. Run the final \`dotnet test\` and record passed/failed counts. Return the structured result with arm="chaos", listing governanceArtifactsProduced, materialDecisionsRecorded, and governanceArtifactsReadAndUsed.`
}

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args
const pairs = parsedArgs.pairs
const PHASE_TITLES = ['Pair 1 — auth gate', 'Pair 2 — soft-delete', 'Pair 3 — optimistic concurrency']
const out = []

for (let i = 0; i < pairs.length; i++) {
  const p = pairs[i]
  const phaseTitle = PHASE_TITLES[i] || `Pair ${i + 1}`
  phase(phaseTitle)
  log(`Pair ${i + 1} (${p.changeId}): Arm A (CHAOS governed) starting`)

  const a0 = budget.spent()
  const chaos = await agent(chaosPrompt(p), {
    label: `pair${i + 1}:armA-chaos`, phase: phaseTitle, schema: ARM_SCHEMA, agentType: 'general-purpose',
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
  log(`Pair ${i + 1} done: armA=${chaos ? chaos.testsPassed + '/' + (chaos.testsPassed + chaos.testsFailed) : 'NULL'} tokens=${a1 - a0}; armB=${plain ? plain.testsPassed + '/' + (plain.testsPassed + plain.testsFailed) : 'NULL'} tokens=${a2 - a1}`)
}

return { pairs: out, totalOutputTokens: budget.spent() }
