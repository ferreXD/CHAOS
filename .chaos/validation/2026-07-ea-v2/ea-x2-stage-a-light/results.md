# Stage-A `--light` measurement — results

> Run 2026-07-24, model `claude-opus-4-8[1m]`, workflow `wf_2dee9ef0-d34` (13 arms, sequential,
> 0 errors, ~41 min, 660k subagent output tokens). Method + caveats: see `README.md`. Toolkit
> meta-work (no CHAOS governance). Measures the **cost of producing the traceability** under the
> collapsed light path, not governance **value** (that is EA-X2b / EA-D3).

## Headline

**The collapsed `--light` path roughly halves the governed arm's cost (−58% output tokens on the
identical frozen tasks) and eliminates the prose cost center (artifact prose 45.5% → 4.7% of
governed output). Oracle stays clean both arms (35/35 light, 35/35 plain). The auto-escalation
valve is correct in both directions. It does NOT reach the ~1× dream — the residual ~3.4× premium
is now the OpenSpec set + governance reading + decision records, not prose — confirming the
roadmap's prediction that only Stage B (ledger-first renderer) can approach 1×.**

## Scorecard vs the Stage-A definition of done

| DoD target | Result | Verdict |
|---|---|---|
| **artifact-prose ≤ 15%** of governed output | **4.7%** (file-size proxy; from baseline 45.5%) | ✅ **MET, decisively** |
| **oracle still clean** (no defect either arm) | Cost A **19/19** both arms; Cost B **16/16** both arms | ✅ **MET** |
| **zero decision loss** | material decisions **consolidated, not lost** — posture-crossing crown-jewels intact, exactly one `approves-change` per change | ✅ **MET** |
| **valve fidelity, both directions** | escalate seed → escalated to standard; 3 light-eligible tasks → stayed light | ✅ **MET** |
| **≤ 2× time** vs plain | governed arm **−58%** absolute; **1.64× time / 2.01× tok** vs frozen plain; **3.35× / 3.47×** vs this session's (cheaper) plain | ⚠️ **MIXED** — met vs the stable baseline, missed within-session (plain-arm variance) |

## Cost A — frozen 3 tasks, forced light (valve OFF), comparable to the frozen baseline

| Pair | task | light time | plain time | time ratio | light out-tok | plain out-tok | tok ratio | oracle (both arms) |
|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | auth gate | 258 s | 78 s | 3.31× | 27,652 | 5,868 | 4.71× | 9/9 clean |
| 2 | soft-delete | 302 s | 97 s | 3.11× | 23,418 | 8,264 | 2.83× | 5/5 clean |
| 3 | concurrency | 335 s | 92 s | 3.64× | 27,240 | 8,425 | 3.23× | 5/5 clean |
| **Σ** | | **895 s** | **267 s** | **3.35×** | **78,310** | **22,557** | **3.47×** | **19/19 both** |

**The robust signal is the governed arm across runs (the only thing the light change touched):**
standard → light on the *same 3 tasks* cut wall-time **2,149 s → 895 s (−58%)** and output tokens
**185,376 → 78,310 (−58%)**.

**Why the within-session ratio (3.35×) looks worse than "≤2×":** this session's plain arm was
anomalously cheap (267 s / 22,557 tok) versus the frozen plain baseline (546 s / 38,996 tok — ~2×
more). Against that stable frozen-plain baseline the light governed arm is **1.64× time / 2.01×
tokens** — i.e. it *meets* ≤2×. The ratio target is dominated by plain-arm variance at n=3; the
−58% absolute governed cut is the confound-free number. (Tokens are an output-only proxy; time is
arm-self-reported — both noisy, per the RUNKIT invariants.)

## Cost B — 3 new light-eligible tasks, valve LIVE (representative + should-stay-light)

| Pair | task | light time | plain time | time ratio | light out-tok | plain out-tok | tok ratio | oracle (both) | escalated? |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| B1 | task-count | 199 s | 50 s | 3.98× | 16,034 | 4,256 | 3.77× | 5/5 | no (2 dec) |
| B2 | filter-by-status | 241 s | 78 s | 3.09× | 20,014 | 5,829 | 3.43× | 6/6 | no (2 dec) |
| B3 | title-max-length | 227 s | 64 s | 3.55× | 18,261 | 4,792 | 3.81× | 5/5 | no (1 dec) |
| **Σ** | | **667 s** | **192 s** | **3.47×** | **54,309** | **14,877** | **3.65×** | **16/16 both** | none |

Even on genuinely light-eligible, in-boundary tasks the governed premium stays ~3.5×. With prose at
~4.7%, that premium is **not** narrative ceremony — it is the OpenSpec full set (kept in every mode,
creator's overrule), scoped governance reading, decision records, and reasoning/discovery. This is
the concrete evidence to reopen "OpenSpec-on-light" at Stage B (roadmap flagged it for revisit).

## Artifact-prose share — the core win

File-size proxy (prose ≈ `change.md` + `decision-events.md` bytes ÷ 4), over all 6 light arms:

| | change.md | decision-events.md | lifecycle stub | OpenSpec set | prose share of governed output |
|---|---:|---:|---:|---:|---:|
| range per change | 2.2–3.1 KB | 0.9–2.0 KB | 0.35–0.43 KB | 4.9–8.8 KB | 4.1–5.7% |
| **aggregate** | | | | | **4.7%** |

Baseline (EA-V2 cost-attribution): artifact prose = **45.5%** of governed output, dominated by the
four narrative reports (proposal-report / proposal-review / apply-report / verification). Those are
**gone** on light — collapsed into one ~2.5 KB `change.md` dashboard + lean append-only decisions.
Design prediction was ~53k→~9–10k prose tokens (−80%); observed is stronger because append-only
also kills the rewrite churn (frozen decision-events alone was 49k over 24 turns).

## Fidelity boundary — decisions were self-resolved, NOT run through the runtime

Verified from the 13 arm transcripts: **zero** real interaction-runtime calls
(`chaos_create_decision`/`begin_command`/`answer_decision`) — the tool names appear only in each
subagent's available-tools catalog, never as invocations. Each arm recorded every material decision
in `decision-events.md` and stamped it `RESOLVED-IN-ARM` (no live human), exactly the documented
EA-X2 deviation; the live Decision Center shows `NO_ACTIVE_DECISION`. Consequence: this run measures
the light path's **cost + artifact set** faithfully, but does **not** exercise the shipped skill's
live runtime surface (blocking `chaos_create_decision` with the `approves-change` marker → `mustStop`
→ human answers in the Decision Center). No popup appeared because none was ever created — by design,
so 13 unattended arms don't deadlock. The valve result below is therefore **routing-reasoning**
fidelity (the arm correctly *judged* escalate-vs-stay), not proof the runtime plumbing fires. To
close that gap: a real interactive `--light` run, or a harness with a mock auto-answering runtime.

## Valve fidelity (both directions — routing reasoning)

| Seed | expected | escalated? | to | trigger | verdict |
|---|---|---|---|---|---|
| `secure-api-underspecified` (under-specified auth) | escalate | **yes** | standard | posture-boundary crossing (auth non-goal) + >2 material decisions (5 surfaced) | ✅ correct |
| `task-count`, `filter-by-status`, `title-max-length` (Cost B) | stay light | **no** (all 3) | — | ≤2 decisions, in-boundary | ✅ correct |

No under-detection (governance bypass) and no over-detection ("light is a lie"). The escalate seed
stopped at FRAME as instructed and wrote the `⚠ escalated` line + `ESC-001`. Valve fidelity is
established for the A gate into Stage C.

## Decision integrity (not lost — consolidated)

On soft-delete the light arm recorded **3** decisions vs the frozen standard arm's **6**. Inspection
shows consolidation, not loss: light `SD-DEC-001` (deletion state on the domain record — the
persistence-non-goal crossing) captures what the frozen arm split across `MDEC-001/002/003`;
`SD-DEC-002` (idempotent re-delete 204) = frozen `APP-DEC-002`; `SD-DEC-003` is the `approves-change`
gate. The frozen arm's `APP-DEC-001` (404 for soft-deleted) and `APP-DEC-003` (JSON serialization)
became **Contract checkboxes** on light rather than decisions — contract-pinned specifics, not
material human choices. Every posture-crossing decision (the governance crown jewel) is present;
exactly one `approves-change: true` per change; format is clean (lean fields, no paragraphs).

## Verdict & routing

- **Stage-A is functionally validated:** prose eliminated, oracle clean, decisions intact, valve
  correct both ways, artifact formats strict (Stage-B-renderer-ready). The collapsed path works.
- **The ≤2× cost bar is realistically ~1.6–2× vs a stable plain baseline, ~3.4× within-session** —
  Stage A does not by itself deliver a clean ≤2×; it delivers a ~58% governed-cost cut and moves the
  bottleneck off prose.
- **Next lever is now measured, not assumed:** with prose at 4.7%, the dominant residual is the
  OpenSpec set + governance reading + decision records. → Build **Stage B** (ledger-first renderer:
  agents emit records, artifacts are projected) and **reopen OpenSpec-on-light** with this evidence.
  `maxMaterialDecisions = 2` held up (Cost B stayed ≤2 and stayed light); no retune needed yet.

---

# Stage-B `--light` re-measurement — results (ledger-first renderer)

> Run 2026-08-02, model `claude-opus-5[1m]`, workflow `wf_17e583c3-a31` (13 arms, sequential,
> 0 errors, ~73 min, 1.04M subagent tokens). Harness: `harness/stage-b-arms.workflow.js`
> (governed arm rewritten for record emission; **plain-arm prompt byte-identical to Stage A**;
> tasks, oracles and scoring frozen). Worktrees pinned to base commit `d27600f`.
> **Model differs from the Stage-A row (Opus 5 vs Opus 4.8) — compare ratios, not absolutes.**

## Headline

**Stage B does not pay for itself on the light path — it costs more.** The governed premium widened
from **3.47× → 4.15×** output tokens (Cost A, within-session), and authored governance bytes rose
from **4.7% → 12.5%** of governed output. The cause is not a defect: Stage A had already collapsed
light-mode prose to ~nothing, so B swapped ~3–5 KB of lean prose for ~13–15 KB of strict JSON
records plus schema-reading. **On light, the ledger-first inversion removes prose that was no longer
there and adds record verbosity.** Every *mechanical* claim B was built for did hold: zero render
failures, zero hand-written artifacts, idempotent re-renders, provenance stamped by construction,
valve fidelity both directions, oracle unregressed.

## Cost A — frozen 3, forced light (valve OFF)

| Pair | task | Stage-B time | plain time | time ratio | Stage-B out-tok | plain out-tok | tok ratio | oracle (both) |
|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | auth gate | 521 s | 146 s | 3.57× | 40,509 | 7,848 | 5.16× | 9/9 clean |
| 2 | soft-delete | 586 s | 164 s | 3.57× | 38,601 | 10,044 | 3.84× | 5/5 clean |
| 3 | concurrency | 513 s | 118 s | 4.35× | 37,260 | 10,139 | 3.68× | 5/5 clean |
| **Σ** | | **1,620 s** | **428 s** | **3.79×** | **116,370** | **28,031** | **4.15×** | **19/19 both** |

Against Stage A on the identical tasks: governed **895 s → 1,620 s (+81%)**, **78,310 → 116,370 tok
(+49%)**. The plain arm also rose (267 s → 428 s, 22,557 → 28,031 tok) — hence ratios, not absolutes.

## Cost B — 3 light-eligible tasks, valve LIVE

| Pair | task | Stage-B time | plain time | time ratio | Stage-B out-tok | plain out-tok | tok ratio | oracle (both) | escalated? |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| B1 | task-count | 340 s | 89 s | 3.82× | 22,500 | 9,139 | 2.46× | 5/5 | no (2 dec) |
| B2 | filter-by-status | 521 s | 258 s | 2.02× | 35,567 | 10,410 | 3.42× | 6/6 | no (2 dec) |
| B3 | title-max-length | 386 s | 78 s | 4.95× | 27,575 | 5,789 | 4.76× | 5/5 | no (2 dec) |
| **Σ** | | **1,247 s** | **425 s** | **2.93×** | **85,642** | **25,338** | **3.38×** | **16/16 both** | none |

## Where the bytes went — the inversion of the Stage-A win

File-size proxy (bytes ÷ 4 as tokens), 6 governed arms. "Authored" = what the **agent** writes;
the rendered artifacts cost the agent nothing.

| | records (JSON) | ledger | rendered change.md | rendered lifecycle.md | OpenSpec set | authored share |
|---|---:|---:|---:|---:|---:|---:|
| range per change | 10.4–15.0 KB | 2.3–6.8 KB | 7.8–10.6 KB | 1.0–1.1 KB | 5.6–11.6 KB | 10.1–16.2% |
| **aggregate** | **77.8 KB** | **23.5 KB** | **53.0 KB** | **6.3 KB** | **55.7 KB** | **12.5%** |

Stage A authored 4.7% (change.md + decision-events.md). Stage B authors **12.5%** — records are
**~2.7× more verbose** than the prose they replace. The 59 KB of rendered artifacts *are* free
(mechanically produced), and they are richer than Stage A's hand-written ones (8–10 KB vs 2–3 KB) —
but a reader-facing file being 3× longer is a cost too, not automatically a win.

## What Stage B provably delivered (mechanical claims — all held)

| Claim | Evidence |
|---|---|
| Agents can emit schema-valid records unaided | **14 render invocations, 0 failures** across 6 arms — no fix-the-record cycles, from the schemas + `record-emission.md` alone, with no worked example |
| Writer discipline holds | `handWroteRenderedArtifact = false` on **6/6** arms; no `change.md`/`lifecycle.md` authored by hand |
| Renders are idempotent | `--check` after the fact: **CLEAN on 12/12** rendered artifacts |
| Provenance by construction | all 12 artifacts carry `lastWrittenAt/By`, `lastAuditedAt/By`, `bodyHash`, `timestampSource: records` — the round-3 "0/4 provenance on all 8 artifacts" defect is now unrepresentable |
| Valve fidelity, both directions | escalate seed → **escalated to standard** (`posture-crossing`, stopped at FRAME); all 3 light-eligible tasks **stayed light** (2 material decisions each) |
| No quality regression | oracle **35/35 per arm** (19/19 Cost A + 16/16 Cost B), both arms, unchanged from Stage A |

## Defects this run surfaced

1. **Renderer drops `commentary` / `verdictRationale` on the deliver phase.** Both fields render for
   frame/review/sync/archive (and `verdictRationale` for verify), but `render_deliver` has no slot —
   schema-valid input, exit 0, silently discarded. Found by the A1 governed agent, confirmed in
   `render.py`. Authored voice on DELIVER currently has no home. **Fix before the strict run.**
2. **`score-arm.sh` reports oracle results as empty under .NET 10.** Its grep expects `Passed!` /
   `Total:`; this SDK prints `Test Run Successful.` / `Total tests:` at `-v n`, so the oracle section
   printed **nothing** — which reads as "no failures" but proves nothing. The first scoring pass of
   this run was vacuous; re-scored with robust extraction (results above are the real ones).
   **A silent-empty oracle is worse than a failing one — fixed in the script.**
3. **The renderer has no legacy-change guard.** Running `--check` on a pre-Stage-B change
   (`add-task-query-filters`, hand-written phase-per-artifact `lifecycle.md`, no `records/`) renders
   a full `Pending` skeleton and reports an 84-line diff — meaning `--write` there would **destroy a
   legacy artifact**. Readers fall back to legacy by design; the renderer must refuse to write when
   a change has no `records/`.

## Verdict & routing

- **The light path should stay Stage-A-shaped.** B's cost case fails here and the evidence is
  unambiguous: with prose already at 4.7%, there is nothing left for a renderer to remove.
- **B's value on light is correctness, not cost** — and that part is now measured, not asserted:
  drift is structurally impossible, provenance is automatic, counts are derived, and the valve and
  oracle are unregressed. Whether that is worth +49% tokens on small changes is a **creator call**.
- **The real test is standard/strict**, where the 45.5% prose cost center still exists and four
  narrative reports collapse into one rendered file. Run `ea-x2-with-without` next — that is the
  arm where B's structural claim can actually pay.
- Fix the three defects above (deliver commentary slot, `score-arm.sh` grep, legacy-write guard)
  **before** the strict run, since the last two affect its validity.
