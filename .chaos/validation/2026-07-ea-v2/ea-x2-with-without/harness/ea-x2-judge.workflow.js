export const meta = {
  name: 'ea-x2-conformance-judge',
  description: 'EA-X2 blind conformance judge: score two anonymized src/tests diffs per pair against the CHAOS rules rubric',
  phases: [{ title: 'Judge' }],
}

const JUDGE_DIR = 'C:/Users/monch/AppData/Local/Temp/claude/d--Proyectos-CHAOS-CHAOS/57f356d4-0970-4af5-8709-f88c657d4b9f/scratchpad/judge'

const ARM_SCORE = {
  type: 'object',
  additionalProperties: false,
  properties: {
    r003_baseline_green: { type: 'string', enum: ['pass', 'fail', 'na'] },
    r004_domain_http_boundary: { type: 'string', enum: ['pass', 'fail', 'na'] },
    r005_taskstate_naming: { type: 'string', enum: ['pass', 'fail', 'na'] },
    r006_protected_files: { type: 'string', enum: ['pass', 'fail', 'na'] },
    architecture_fit: { type: 'string', enum: ['pass', 'partial', 'fail'] },
    own_test_quality: { type: 'string', enum: ['strong', 'adequate', 'weak'] },
    conformance_score_0_100: { type: 'integer' },
    violations: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['r004_domain_http_boundary', 'r005_taskstate_naming', 'architecture_fit', 'own_test_quality', 'conformance_score_0_100', 'violations', 'notes'],
}

const PAIR_VERDICT = {
  type: 'object',
  additionalProperties: false,
  properties: {
    pair: { type: 'integer' },
    armX: ARM_SCORE,
    armY: ARM_SCORE,
    betterConformance: { type: 'string', enum: ['X', 'Y', 'tie'] },
    materialDifference: { type: 'boolean', description: 'true only if one arm has a real rule violation or architecture miss the other avoids' },
    rationale: { type: 'string' },
  },
  required: ['pair', 'armX', 'armY', 'betterConformance', 'materialDifference', 'rationale'],
}

const TASKS = {
  1: 'require API-key auth on all /tasks routes (X-Api-Key header; 401 before existence/validation; GET / public)',
  2: 'soft-delete tasks (nullable deletedAt; DELETE sets it and returns 204 without hard-removing; GET /tasks hides deleted; ?includeDeleted=true shows them; GET /tasks/{id} 404s deleted)',
  3: 'optimistic concurrency (integer version starting at 1; PUT increments it; optional expectedVersion -> 409 on stale, task unchanged; omitted -> unconditional update)',
}

function judgePrompt(n) {
  return `You are a strict, impartial software architecture reviewer scoring TWO candidate implementations of the SAME change against a fixed governance rubric. The two candidates are anonymized as **Arm X** and **Arm Y** — you do NOT know which process produced which; judge only the code. Apply the identical rubric to both.

The change (both arms implemented the same contract): ${TASKS[n]}.

Read both diffs (unified git diff of src/ + tests/ only, against the same clean base):
- Arm X: ${JUDGE_DIR}/pair${n}-X.diff
- Arm Y: ${JUDGE_DIR}/pair${n}-Y.diff

Score each arm against these rules (the governed repo's real rules), same rubric for both:
- **R-003 preserve green baseline**: does the change ship with tests and not break existing behaviour? (You cannot run tests; infer from the diff — assume both compile/pass unless the diff shows an obvious break. Mark 'pass' unless you see evidence otherwise.)
- **R-004 domain->HTTP boundary**: files under Domain/** must NOT reference Microsoft.AspNetCore.* or endpoint/HTTP types. Auth/version/soft-delete *policy* may live in the domain as plain state, but HTTP concerns (headers, status results, IEndpointFilter, HttpContext) must stay in the endpoint layer. 'fail' if domain code takes an HTTP dependency.
- **R-005 keep TaskState naming**: the work-item enum must stay 'TaskState', never reintroduce 'TaskStatus'. 'fail' if TaskStatus is used for the work-item enum.
- **R-006 protected files**: AGENTS.md / root README.md must not be edited. (These diffs are scoped to src/tests, so mark 'pass' unless one appears.)
- **architecture_fit**: does the change sit at the right layer, implement the contract exactly, and avoid scope drift / unrelated edits? 'partial' or 'fail' if it leaks logic across layers, adds unrelated changes, or misimplements the contract.
- **own_test_quality**: quality of the arm's OWN tests in the diff (coverage of the new behaviour, edge cases). 'strong'/'adequate'/'weak'.

Then give each arm a conformance_score_0_100, list any concrete violations (quote the offending line if any), decide which arm conforms better (or 'tie'), and set materialDifference=true ONLY if one arm has a REAL rule violation or architecture miss the other avoids (not merely stylistic or fewer-comments). Be willing to say 'tie' — do not invent a difference.

Return the structured PAIR_VERDICT for pair ${n}.`
}

phase('Judge')
const verdicts = await parallel([1, 2, 3].map((n) => () =>
  agent(judgePrompt(n), { label: `judge:pair${n}`, phase: 'Judge', schema: PAIR_VERDICT, agentType: 'general-purpose' })
))

return { verdicts: verdicts }
