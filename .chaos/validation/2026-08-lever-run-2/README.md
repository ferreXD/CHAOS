# Lever run 2 — the repairs + the unit tier band, priced once

> **Toolkit meta-work: this measurement runs WITHOUT CHAOS governance.** CHAOS runs only
> *inside* the governed arms.
>
> **Pre-registration.** §3, §4 and §5 are frozen **before any arm launches** and are **never
> edited to match results**. Six cost hypotheses have died in this program, the most recent
> being run 1 — which **regressed**. A negative result is a valid outcome and gets written up
> as one.

Predecessor: [`../2026-08-lever-run/`](../2026-08-lever-run/) (`95d508b` → `6bfd319`). Its
result: band A **8.34×**, band B **7.37×**, governed absolute **+45.7%** vs Stage D, with
**L1 measured inert** (0 delegations on 6/6) and three of its own defects inflating every arm.

## 1. What changed since run 1 — the two variables

Run 1 was one variable (the four levers). This run has **two**, deliberately bundled because
neither is worth a 12-arm run alone:

1. **The D1–D5 defect repairs** (`6d17fe8`, `ed4d8b7`, `fe63ce4`). D1 `render.py` did not know
   the `RUN-DEC-*` prefix → parsed **zero** decisions, blocked close on 6/6; D2 `mode: null`
   rejected by a closed enum; D3 `--self-review` free text → **X2 fired on 6/6**, buying an
   unowed review + verify pass. D4/D5 (a typo'd preset silently giving **zero floors**; a
   typo'd declared trigger firing a **phantom**) were found by rechecking, not by an arm.
2. **The T0/T1/T2 unit tier band** (`34ebb3c`, design §8, L1-D12..D17) replacing the inert
   L1-D11 easy gate. Banding moves from **change-scoped and latching** to **per work unit,
   recomputed every unit**, decided by `scan.py tier` — a deterministic verdict, never a model
   judgement.

**Consequence for attribution, stated up front:** a cost change cannot be split cleanly
between the two. The fidelity table (§3) separates them — the X2-on-6/6 row is the repair's
signature, the tier counts (§5) are the band's — but the *token* delta is joint. Held constant
otherwise: base `d27600f`, the same 6 tasks, bands, oracles and pairs, plain prompts
**byte-identical** (`d28ced5572833c47` / `799be1dd6fefc2a5` / `d058e37b89ffaa89`, unchanged
since Stage D), arm model **Opus 5** (the RUNKIT invariant and the L1 ceiling).

## 2. Arms (12, sequential)

Identical to run 1: P1 `require-api-key-auth` · P2 `soft-delete-tasks` ·
P3 `optimistic-concurrency-updates` · B1 `task-count` (band B) · B2 `filter-tasks-by-status` ·
B3 `enforce-title-max-length` (band A).

**To beat:** run 1 band A **8.34×** / band B **7.37×**; Stage D band A **4.81×** / band B
**5.51×**. Bars remain ≤2.0× (A) and ≤3.0× (B).

## 3. Pre-registered fidelity expectations (frozen)

The repairs should **remove** work that run 1 paid for; the band should **not** change what
fires at all.

| Pair | Expected triggers | Expected vector (`stops·ev.t·ev.b·review·verify·openspec·adr`) | vs run 1 |
|---|---|---|---|
| P1 | M1 + M2 (auth) + M4 | `1·1·0·1·1·1·2` | **review 2 → 1**: X2 must NOT fire |
| P2 | M1 + M2 (data-store) + M4 | `1·1·0·1·1·1·2` | review 2 → 1 |
| P3 | M1 + M2 (data-store) + M4 | `1·1·0·1·1·1·2` | review 2 → 1 |
| B1 | M2 + M3 + M4 | `1·1·0·1·1·1·1` | review 2 → 1; **openspec 2 → 1** |
| B2 | M4 only | `1·1·0·1·0·1·0` | **X2 must NOT fire; verify must NOT run** |
| B3 | **none** | `1·0·0·0·0·0·0` | **X2 must NOT fire; nothing owed** |

- **X2 = 0 on 6/6 is the single sharpest prediction in this kit.** It fired 6/6 in run 1 purely
  because `--self-review` took free text. If X2 fires again, the D3 repair did not take.
- B2's M4 and B1's `openspec 2` are carried forward from run 1's **measured** result, not from
  the older registration — the Stage-D lesson about carrying verdicts forward blindly.
- Stops: `newStopsTotal` = 0 on 6/6; absorption 0 (still **UNVALIDATED**); audit exit 0 on 6/6.
- C-15 must hold again: B3 clean of X1.

## 4. Pre-registered cost predictions (frozen)

- **Band A 4.0–6.5× · Band B 4.5–6.5×.** An improvement on run 1 (8.34×/7.37×) that
  **still misses both bars**, and most likely still sits **above Stage D** (4.81×/5.51×).
  Predicting a miss, again, and saying so before the arms run.
- **Governed absolute falls 15–30%** vs run 1's 398,494 — the repairs remove the unowed
  review+verify passes and the D1 diagnosis loops.
- **Direction test:** if governed absolute does **not** fall at least 10%, the D1–D3 repairs
  were not the main cost of run 1's regression and the residual is somewhere else entirely.

## 5. The tier band — what this run exists to measure (L1-D12..D17)

Run 1 measured `ceiling:1 mid:0 floor:0` on 6/6. Frozen predictions:

- **T0 fires ≥1× on each band-A arm.** These tasks pin exact wire contracts, so Route B should
  qualify on B2/B3; Route A qualifies wherever tests are written first. **Any non-zero T0 count
  is the amendment working** — it was zero in run 1.
- **T1 opens on essentially all band-A implementation units**, partially on band B (units away
  from the fired surface).
- **Floor+mid share of governed output: 20–40%** (band A), **5–15%** (band B).
- **Escalations ≤1 per arm**, with **Route B escalating more often than Route A** — the signal
  for whether Route B survives.
- **Model-invocation accounting** (creator requirement, carried from run 1 §5): every arm
  reports `ceiling:n mid:n floor:n`; `harness/count-invocations.py` derives the authoritative
  counts from transcripts; **disagreement between the two is itself reported.**

**Quality is a stop-the-analysis gate.** Oracle 19/19 (P1–P3) and 16/16 (B1–B3), both arms.
**An oracle failure on an arm that used a cheap tier closes that route/band** (Route B first)
rather than being tuned — L1-D11's rule, carried forward verbatim.

## 6. Files

Harness mirrors run 1 (`build-workflow.py` lifter, `count-invocations.py`, `read-volume.py`,
`decompose-output.py` with the L3/L4 labels, `setup-lever2-worktrees.sh`). Oracles, task
statements and `score-arm.sh` are referenced from the earlier kits, never duplicated.

## 7. Procedure log

Filled in as the run proceeds; never back-dated.

- 2026-08-04 — kit authored; §3/§4/§5 frozen **before** any worktree was created. Telemetry
  schema measured at **2,990 bytes** serialized (the Stage-D ceiling trap: 6.3 KB was
  rejected); plain-prompt hashes verified unchanged.
- 2026-08-04 — 12 worktrees created on `d27600f` at `C:/lr2`; post-repair toolkit + tier band
  staged into the 6 `*-armA` only; **21/21 sanity checks pass** (incl. digest fresh inside the
  worktree and `classify.py` byte-identical to the repo copy). End-to-end smoke in `B2-armA`:
  `scan.py tier` returned **T1** for an unrelated DTO file and **T0/route-A** for the same file
  with a failing acceptance check, and `k4 --self-review pass` was **rejected at the argparse
  boundary** — the D3 repair confirmed in situ. Smoke artifacts removed; subject paths pristine.
  **This commit is the pre-registration: it lands before any arm runs.**
