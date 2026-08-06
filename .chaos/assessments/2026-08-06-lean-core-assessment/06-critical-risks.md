# 06 — Critical risks (the hostile reviewer's file)

Ranked by expected damage. "Kill" = ends the project's claim to be more than a personal tool.

## R1 — Bus factor 1, everywhere (kill-class; Observed, HIGH)

One person is the author, operator, adjudicator, maintainer, and sole user. Every measured
catch is that person overriding a recommendation aimed at that person's own repo knowledge.
The July assessment flagged this; since then the evidence got deeper but not wider. No
replication with a second operator = no externally credible value claim, period. Everything
in 07 is downstream of this risk.

## R2 — The plain+ask hole (kill-class for the machinery; Observed, HIGH)

The cheapest rival — a standing "ask before deciding anything material" instruction, zero
runtime, zero panel — was pre-registered and never run. If it matches the lean core's catch
rate at ~1.0×, the honest residue is a paragraph of prompt, and the 14k-LOC machine is
defensible only on durability/resume/audit grounds. That may still be enough — but today
the project *does not know*, and it is the one experiment a skeptic will name first.

## R3 — Prose regrowth, now unguarded (high; Observed setup, Inferred trajectory)

The program's own data: prose targets were exceeded 3-for-3 whenever they were advisory,
and the only budget ever obeyed was the one the runtime enforced. The operator then removed
every ceiling. That is a coherent bet — information over budget, ceremony-not-length as the
named failure mode — but it is a bet placed *against* the local data, with no measurement
scheduled. The apparatus grew back once already, as prose nobody objected to. Watch item:
record length and stop length, five changes from now. If records trend past ~150 lines, the
lean core is quietly rebuilding `change.md` (MEDIUM probability within a quarter).

## R4 — The stop's power to steer (high; Observed twice)

The ladder extracts decisions — and shapes them. Two rows in a row, the human took a
cheaper rung than the recommendation; both times with stated, defensible reasons. The same
mechanism, in front of a hurried or deferential user, manufactures under-building with an
audit trail that says "human approved". The B1 row shows the inverse: 7 defaults ratified
in 106 seconds with an empty rationale. CHAOS currently has no way to distinguish a
considered override from a reflexive click, yet its value story treats every override as a
catch (Inferred, HIGH). Mitigation exists and is cheap: require rationale on non-recommended
picks and on all-defaults ratification.

## R5 — Detection regressed and nothing watches the gap (medium-high; Observed once)

The strip traded the deterministic classifier for judgment. Crossings survived 3/3; the
sealed-sheet *convention* axis (file placement) was missed silently where the apparatus's
M5 had forced an explicit approval. One measured cost, zero mitigations since. The lean
loop has no concept of "where new files land" and no post-build check against the approved
plan beyond scope-capability drift. Cheap partial fix: the stop's plan already names
intended files; verify could diff actuals against it and surface additions in the record.

## R6 — Single-vendor, single-surface coupling (medium; Observed)

Claude Code (hard), VS Code (hard for the human side), Opus-class models (all evidence).
The robustness policy pins Haiku 4.5 as the weakest supported model — untested against the
lean skill (the policy predates it). A Claude Code pricing/behaviour shift or a plan-mode
feature that half-covers the stop story compresses CHAOS's air supply in a week.

## R7 — Evidence misuse temptation (medium; Inferred)

"9.6× less prose" and "1.05×" are apparatus-relative and n=3 numbers. They are honest in
context and misleading on a landing page without it. The project's differentiation *is*
its honesty (05); one over-claimed README paragraph converts the crown asset into a
liability. The current README's claims were checked today and are within evidence — keep
the discipline under launch pressure.

## R8 — The dormant runner (low-medium; Observed)

4.6k LOC of auto-resume that no measured run has ever used, whose semantics already
collided once with the live protocol (today's deadlock). Under the project's own ethic —
delete what measurement doesn't defend — it is the next falsification candidate. Keeping
it needs a stated bet (07's future B uses it; futures A and C do not).

## R9 — Governance-of-the-governor gap (low; Observed)

CHAOS is developed without CHAOS (a deliberate, recorded rule). Defensible for meta-work —
but it means the product's own repo will never generate the dogfood evidence that its
records catch crossings over time (R2's cousin). The demo branches or a pilot repo must
carry that burden instead.

## What is *not* a risk anymore

Cost (measured, small), duplicate-decision defects (fixed, live-validated twice), runtime
integrity under crashes (abuse-tested), the old apparatus lingering half-alive (purged
today), and honest-verification culture (five rows of labeled limits with zero observed
ticked-but-unverified claims).
