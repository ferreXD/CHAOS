# CHAOS Retro Question Bank

Use these questions selectively. Do not ask all of them blindly.

## Proposal / spec quality

- Did the proposal ask the right questions before generating OpenSpec artifacts?
- Were acceptance criteria testable?
- Were tasks specific enough for implementation?
- Did review need to amend too much that propose could have captured earlier?

## Review quality

- Did `chaos:review` catch issues early enough?
- Did it produce actionable findings?
- Did it over-report advisory noise?
- Did it miss test, scope, or architecture issues?

## Apply quality

- Did `chaos:apply` stay inside approved scope?
- Were runtime decisions expected or a sign of under-specified proposal/tasks?
- Was the C# specialist useful and constrained?
- Did implementation require stop/continue decisions?

## Verification quality

- Were build/tests/OpenSpec validation run?
- Were confidence caps accurate?
- Was spec-to-implementation traceability useful?
- Did verification identify missing decision events or drift?

## Archive/sync quality

- Was archive readiness clear?
- Was debt classified correctly?
- Did sync promote decisions into appropriate governance artifacts?
- Were rules/gates indexes updated accurately?

## Human friction

- Which step felt most useful?
- Which step felt too heavy?
- Which question was unclear?
- Did the workflow prevent a real mistake?
- What should be smoother next time?

## Action decision prompts

- Should this become a default behaviour?
- Is this a one-off lesson or repeated pattern?
- Should this become a rule, gate, prompt update, question-bank update, or no action?
- Should `chaos:sync` promote this recommendation now?
