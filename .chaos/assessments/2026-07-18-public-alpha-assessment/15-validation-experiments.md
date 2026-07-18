# 15 — Validation experiments and evidence plan

Part of the CHAOS public-alpha external assessment · assessed commit `6421feb` · 2026-07-18 · [Index](README.md)
Labels: Observed / Reported (author) / Inferred / Hypothesis / Recommendation / Unknown

## 15.1 Why experiments are still required after the author's clarification

The workflow's private validation (on CHAOS itself, the demo, and one real company brownfield project — Reported) is a real signal, and it moves the burden of proof. It cannot, structurally, answer three questions:

1. **Cold-start usability** — the creator cannot un-know the workflow (EA-X1).
2. **Counterfactual value** — the creator cannot run an unbiased with/without comparison on themself (EA-X2).
3. **Adversarial trust** — normal use avoids the failure conditions that matter (EA-X4).

No metrics currently exist for any claim below (Observed: no adoption/outcome data anywhere in the repo). Nothing should be claimed publicly until they do.

## 15.2 Experiment set

| ID | Hypothesis | Design | Metrics | Success threshold | Failure interpretation |
|---|---|---|---|---|---|
| **EA-X1 Cold-start** | A stranger reaches first value unaided | 3 devs unfamiliar with CHAOS, fresh machines: install → doctor → demo change | time-to-first-value; blockers; abandonment point | ≤60 min now; ≤15 min post-plugin (EA-B4); 0 silent failures | Fix onboarding before any promotion |
| **EA-X2 With/without** | CHAOS improves outcomes on strict-risk work | Same brownfield task (auth/schema change on task-tracker) with CHAOS vs plain Claude Code; ≥3 pairs | later-found defects; architecture conformance; time; tokens; artifacts actually read | ≥1 material defect/conformance catch per CHAOS run; ≤2× time | Value claim unsupported → shift weight to EA-D3 |
| **EA-X3 Small-change tax** | strict-compact removes the ceremony penalty | 20-line cross-cutting change: full vs compact profile | sessions; stops; tokens; wall time; user rating | ≤2 sessions, ≤4 stops, ≤35k tokens with all strict gates intact | Redesign the profile model |
| **EA-X4 Resume reliability** | Pause/resume is trustworthy under abuse | 20 runs killed at random points, incl. concurrent panel+runner writes; resume all | correct-continuation rate; state corruption; capsule usefulness | ≥95% correct; 0 corruption | Harden (EA-V3/EA-I09) before promoting auto-resume |
| **EA-X5 Decision fatigue** | Stops are material, not noise | 2 weeks of real use; rate each stop "needed my judgment?" | stops/change; % material; answer latency | ≥70% rated material | Tighten materiality doctrine + batching |
| **EA-X6 Retention** | Someone keeps using it voluntarily | Author + 2 externals, 2 weeks post-EA-X1 | commands/week; % full-lifecycle; unprompted use | sustained non-zero full-lifecycle use | Kill-criteria input ([12](12-risk-register.md) §12.3) |

Additional candidates (later): brownfield vs greenfield differential; Claude vs Copilot adapter comparison (once EA-B3 exists); multi-repository trial; report-usefulness rating per artifact type (directly informs EA-B1's consolidated report design).

## 15.3 Smallest set that most reduces uncertainty

**EA-X1 + EA-X2 + EA-X4** — they test the three load-bearing claims (*usable, valuable, trustworthy*). Everything else can wait. Publish results — including failures — in the repo; the confidence doctrine applies to the project itself.
