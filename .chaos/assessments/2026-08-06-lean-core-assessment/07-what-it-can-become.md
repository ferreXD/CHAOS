# 07 — What it can become

Three coherent futures. They are not mutually exclusive, but the next quarter can fund
exactly one as the primary bet.

## Future A — The distributable discipline (recommended)

**Thesis:** package the lean core as a one-command install for Claude Code users — plugin
or installer that ships the 5 commands, the runtime + MCP server, and the Decision Center,
with `chaos:init` as the only setup step. The product is the *loop*; the pitch is the
positioning sentence in 05.

- Why it wins: the product is finally small enough to package (5 commands, 246 lines of
  core prose); the measured numbers are launch-grade with caveats; the record→future-stop
  loop is unoccupied ground; and R1/R2 are only curable by *other people running it* —
  distribution is also the evidence strategy.
- Cost: packaging + upgrade path, a rewritten quickstart (the docs hole), a non-PowerShell
  build path, and a triage burden the bus-factor-1 maintainer must budget for.
- Kill criterion (state it now, in the project's own style): if, six months after a real
  release, no external user has produced one record-caught crossing or one override-catch
  of their own, Future A is falsified and CHAOS is honestly a personal tool.

## Future B — The team decision-memory product

**Thesis:** the Decision Center grows beyond VS Code (web view, PR annotations, Slack
notification), decisions get multi-user answering and roles, records link to PRs, the
dormant runner powers answer-from-anywhere auto-resume. CHAOS becomes team infrastructure:
"the place where agent-era architecture decisions live and argue back."

- Why it tempts: it is the only future with a commercial shape, and the runner + lease
  machinery already half-exists.
- Why not now: it multiplies every unfixed risk — R1 (one maintainer building team infra),
  R6 (more surfaces), R3 (more artifact classes) — before a single external user exists.
  The July assessment's "Decision Center v2" roadmap item died with the apparatus for the
  same reason. Revisit only after Future A produces real multi-person demand (Inferred,
  HIGH).

## Future C — The measurement kit

**Thesis:** the most original thing in this repo is the method — pre-registration, frozen
denominators, independent stopwatch, archive-before-revert, kill criteria, falsified
predictions published. Package *that*: a harness for anyone to A/B their own agent
workflow, with CHAOS as the worked example.

- Why it tempts: zero competition; the 18k-line validation record is the moat; it converts
  R7 (evidence discipline) into the product itself; the AI-DX research community would cite
  it (Inferred, MEDIUM).
- Why it's the co-bet, not the bet: it grows credibility and answers R2 (a plain+ask kit
  row anyone can run), but nobody adopts a workflow because its benchmark kit is good.

**Recommendation: A as the bet, C as the credibility engine inside it, B parked.** Ship the
kit's plain+ask experiment as part of A's launch material — "here is the cheapest rival;
here is how to run it against us in your repo" is the most disarming launch line an
evidence-driven project can write.

## The ordered 90-day list (assuming A)

1. **Close the arena:** B2 re-run on-clause with the spec gate demoted (settles the last
   shippability criterion + P2), then the **plain+ask arm** on one task (R2). ~2 sessions.
2. **Fix the workspace debt:** lean AGENTS.md + decisions-index format in the arena
   workspaces; re-run one lean row to confirm artifact volume drops to the skill's own
   floor (closes the B1-filed alignment defect).
3. **Cheap risk mitigations from 06:** require rationale on non-recommended picks and
   all-defaults ratifications (R4); verify-step diff of shipped files vs the stop's plan
   (R5). Both are skill-prose + one runtime flag, days not weeks.
4. **Packaging:** installer/plugin, versioned releases, non-PowerShell build, upgrade
   path. The single largest work item; nothing else on this list matters externally
   without it.
5. **Docs rebirth, small:** one quickstart, one "the loop" page with the mermaid diagram,
   one honest evidence page (the 02 caveats verbatim). The old guides stay dead.
6. **Runner decision:** state Future B's bet explicitly or delete 4.6k LOC under the
   project's own ethic (R8). Either is defensible; drift is not.
7. **Second operator pilot:** one external repo, one real user, their stops answered by
   them. The first datum that isn't self-adjudicated (R1). Everything before this is
   preparation; this is the actual milestone.

## The sentence for the next verdict file

The apparatus era ended with "it is clear that all the machinery isn't worth it." The lean
era's question is narrower and better: **is one measured stop, with memory, worth 1.1× to
anyone who didn't build it?** The repo finally deserves to ask that question in public;
it should be asked before the next line of mechanism code is written.
