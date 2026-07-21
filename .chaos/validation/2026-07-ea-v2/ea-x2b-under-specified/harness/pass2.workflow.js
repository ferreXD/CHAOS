export const meta = {
  name: 'ea-x2b-pass2',
  description: 'EA-X2b under-specified pass 2: CHAOS arm resumes each change with the human-answered decision (hidden intent) and implements it',
  phases: [
    { title: 'Task A — secure' },
    { title: 'Task B — delete' },
    { title: 'Task C — concurrency' },
  ],
}

const RESUME_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    arm: { type: 'string' },
    changeId: { type: 'string' },
    summary: { type: 'string' },
    decisionAnswered: { type: 'string', description: 'restate the human answer you implemented' },
    implementedMatchesAnswer: { type: 'boolean' },
    codeFilesChanged: { type: 'array', items: { type: 'string' } },
    governanceArtifactsProduced: { type: 'array', items: { type: 'string' } },
    testsPassed: { type: 'integer' }, testsFailed: { type: 'integer' },
    testsGreen: { type: 'boolean' }, buildOk: { type: 'boolean' },
    wallTimeSeconds: { type: 'integer' },
    selfAssessment: { type: 'string' },
  },
  required: ['arm', 'changeId', 'summary', 'decisionAnswered', 'implementedMatchesAnswer', 'codeFilesChanged', 'testsPassed', 'testsFailed', 'testsGreen', 'buildOk', 'wallTimeSeconds'],
}

function resumePrompt(t) {
  return `You are resuming a paused CHAOS governed change. In an earlier step (propose/review) you surfaced a BLOCKING material decision for change id "${t.changeId}" in this worktree and stopped, per R-001 (a human owns material decisions). Work ONLY inside:
  ${t.wtChaos}
The pass-1 artifacts are already there under \`.chaos/changes/${t.changeId}/\` (proposal-report.md, decision-events.md marked OPEN, proposal-review.md BLOCKED_ON_DECISION).

FIRST run \`date +%s\` and remember it as START.

The human (repo maintainer) has now ANSWERED the decision in the Decision Center. **The answer is authoritative — implement it even if it differs from the recommendation you made in pass 1:**

=== HUMAN DECISION ANSWER ===
${t.answer}
=== END ANSWER ===

Resume the governed lifecycle (apply → verify):
1. Update \`.chaos/changes/${t.changeId}/decision-events.md\`: mark the decision **RESOLVED (human-answered)** with the answer above, knowledge-type + confidence labelled.
2. APPLY: implement the change in \`src/TaskTracker.Api\` (+ update \`tests/TaskTracker.Tests\`) to match the human answer **exactly**. Honor R-003 (tests green), R-004 (domain must not depend on the HTTP layer), R-005 (keep TaskState naming). Write \`.chaos/changes/${t.changeId}/apply-report.md\`.
3. VERIFY: write \`.chaos/changes/${t.changeId}/verification.md\` (build/tests/rules/scope dashboard, confidence-labelled). Run \`dotnet build\` and \`dotnet test tests/TaskTracker.Tests/TaskTracker.Tests.csproj\`.

Do NOT spawn subagents. Do NOT git commit — leave changes in the working tree.

WHEN DONE: run \`date +%s\` as END, wallTimeSeconds = END-START. Return the structured result with arm="chaos". implementedMatchesAnswer must reflect the truth.`
}

const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args
const tasks = parsedArgs.tasks
const PHASE_TITLES = ['Task A — secure', 'Task B — delete', 'Task C — concurrency']
const out = []

for (let i = 0; i < tasks.length; i++) {
  const t = tasks[i]
  const phaseTitle = PHASE_TITLES[i] || `Task ${i + 1}`
  phase(phaseTitle)
  log(`${t.changeId}: CHAOS pass-2 resume (implement human answer) starting`)
  const b0 = budget.spent()
  const res = await agent(resumePrompt(t), { label: `${t.id}:chaos-p2`, phase: phaseTitle, schema: RESUME_SCHEMA, agentType: 'general-purpose' })
  const b1 = budget.spent()
  out.push({ task: t.id, changeId: t.changeId, chaos_pass2: res, chaos_p2_output_tokens: b1 - b0 })
  log(`${t.changeId} pass-2 done: green=${res ? res.testsGreen : 'NULL'} matches=${res ? res.implementedMatchesAnswer : '?'} tok=${b1 - b0}`)
}

return { tasks: out }
