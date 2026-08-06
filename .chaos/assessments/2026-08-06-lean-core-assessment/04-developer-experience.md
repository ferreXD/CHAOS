# 04 — Developer experience

Caveat up front: **no user other than the author has ever run the lean core** (Observed,
HIGH), so this is a DX researcher's structured prediction, not usability data.

## Time-to-first-stop (cold start, today)

1. Clone; `npm install && npm run build` in `tools/chaos-interaction-mcp`.
2. Build and install the Decision Center VSIX (`build-decision-center-vsix.ps1` — PowerShell).
3. Wire `.mcp.json`; copy `.claude/` into the target repo (no installer — literally copy).
4. `chaos:init` (10–15 min guided), then the first `chaos:run`.

Estimate: **60–90 minutes for an expert who hits zero traps** (Inferred, MEDIUM), on
Windows with VS Code and Claude Code already present. The July assessment said 1–2 hours
for the same journey; the surface shrank by ~90% but the setup didn't shrink at all —
because setup cost lives in packaging, not in command count (Inferred, HIGH). Worse than
July in one respect: the installation guide that existed then is deleted, and README +
`chaos:help` assume the machinery is already in place.

## The stop, as an interaction (the core UX)

What the three lean rows actually put in front of the human (Observed, HIGH):

- A 4.4–4.7k-character context: verbatim intent, cited facts with `file:line`, named
  crossings, folded questions with defaults, size + gate result, plan. Read time measured
  at ~2–3 min.
- 4 options with costs/consequences, one recommended; a rationale field.
- One click resumes the run; answers with empty rationale carried all defaults (B1: 7
  defaults ratified in 1 m 46 s).

Strengths: this is a genuinely better decision artifact than any chat scroll — cited,
durable, resumable, and the option-ladder design measurably extracts real decisions (02).
Weaknesses, in order of harm:

1. **Ratification is one click; deliberation is optional.** The B1 row is the warning:
   material defaults (two new server-provisioned label keys the other arms refused) shipped
   under an empty rationale. The UI makes the cheap path the easy path. A "confirm each
   fold" affordance — or even displaying folds as checkboxes — would price the click
   honestly (Inferred, HIGH).
2. **No reach.** No notification beyond the panel badge; the human must be in VS Code. The
   product's own data says machine time is minutes while human availability is the real
   variable (B2-apparatus: 70 min humanWait).
3. **Ladder steering.** A menu that always contains a cheaper rung invites the cheaper
   rung. Twice the operator took it and was arguably right; a less engaged operator takes
   it by default. The stop's power to *change* outcomes is also power to *bias* them (06).

## The record, as UX

The three lean decision records (94–109 lines) are the best artifacts this project has ever
produced — a maintainer would actually read them (Observed; contrast: the apparatus's
scan-verdict files were 23 lines of YAML frontmatter over 8 lines of content). Two frictions:
size accounting mixes units silently (LOC vs insertions), and the init-era index format
turns "add one line" into 14–37 (the owed workspace fix). With ceilings gone, record
quality now rests entirely on the skill's "ceremony, not length" framing — untested (02.4).

## Papercuts a second user hits in week one (predicted)

- `openspec` CLI absent → the spec gate's owed path degrades; doctor flags it but init's
  auto-scaffold only covers project init, not CLI install.
- The `bodyHash` frontmatter staleness on every amended artifact — reported honestly by
  runs, computed by nothing; reads as broken.
- CRLF/LF churn warnings on every commit on Windows.
- Answering a stop in chat instead of the Decision Center (the runtime-first rule lives in
  a skill the *user* never reads); the model recovers, the user is confused.
- No uninstall/upgrade story whatsoever.

## Verdict

For its one user, the lean core's DX is now excellent — the measured loop is minutes, the
artifacts are readable, the machinery is invisible when it works. For a second user it is
a research prototype with a 90-minute, guide-less, copy-files install. The gap between
those two sentences is the whole adoption problem, and it is a packaging problem, not a
product-design problem (Inferred, HIGH).
