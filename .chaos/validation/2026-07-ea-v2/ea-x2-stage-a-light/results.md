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
