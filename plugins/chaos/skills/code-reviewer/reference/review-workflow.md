# Code Review Workflow

## 1. Establish review scope

Identify what the user wants reviewed:

- entire repository
- PR/diff
- specific files
- feature/module
- architecture compliance
- skill usage
- quality/security/performance

If scope is too broad, ask one narrowing question and stop.

## 2. Load project authority

Before reviewing code:

1. Locate `AGENTS.md` at the project root or nearest applicable root.
2. Read it fully.
3. Extract architecture, stack, conventions, dependency rules, and skills.
4. Locate skills referenced by `AGENTS.md`.
5. Read applicable skill instructions.

If `AGENTS.md` or mandatory skills are missing, follow the missing authority behaviour in `SKILL.md`.

## 3. Inspect code evidence

Depending on the review scope, inspect:

- changed files or target files
- nearby tests
- interfaces/contracts
- dependency registration
- persistence/configuration code
- callers/callees when needed
- error handling paths
- external side-effect boundaries

For PR reviews, prefer inspecting the diff first, then surrounding code only as needed.

## 4. Classify findings

For each issue, record:

- severity
- category
- file/location
- evidence
- violated authority
- impact
- suggested remediation
- confidence

Use the severity model.

## 5. Avoid over-reviewing

Do not flood the user with style nits if there are architectural or correctness issues.

Group repeated instances under one finding when the root cause is the same.

## 6. Validate skill usage

For each applicable skill:

- state whether it was applicable
- state whether it was loaded/read
- identify relevant rules
- review code against those rules
- do not penalize non-use outside the domain

## 7. Produce structured output

Use `output-format.md`.

## 8. Complete checklist

Before finalizing, run the completion checklist.
