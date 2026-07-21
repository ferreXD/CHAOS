# CHAOS cost-attribution — where the governed lifecycle's ~4–5× goes

> Toolkit meta-work (developed **without** CHAOS governance, per the creator's standing preference).
> Plain analysis doc; durable so a fresh session can resume the performance work. Source evidence:
> the EA-X2 / EA-X2b run transcripts under
> `~/.claude/projects/.../subagents/workflows/{wf_7fb294b1-cb8, wf_9edd0fe0-713, wf_5ce8b2f5-f26}/agent-*.jsonl`.
> Parser: `scratchpad/cost-attribution.py` (session-local; re-derivable). Date: 2026-07-22.

## Method

Parsed all 15 arm transcripts (9 CHAOS governed agents across X2 + X2b pass1/pass2; 6 plain agents).
Grouped assistant turns by `requestId`, read real per-turn `usage` (output / input / cache-creation /
cache-read), and categorized each turn by its tool use (write→gov-artifact vs code; read→gov-doc vs
code; bash→dotnet vs shell; runtime MCP; reasoning). Cross-check: summed transcript output = **371k
CHAOS / 93k plain = 3.98×**, matching the independent `budget.spent()` proxy (~4.3–4.8×) — attribution
is sound directionally.

## Headline finding — the 4× is the **traceability layer, not the code**

| Output-token category (9 CHAOS agents) | tokens | % of CHAOS output |
|---|---:|---:|
| **write governance artifacts (prose)** | **168,937** | **45.5%** |
| shell / discovery (git, find, ls, grep) | 53,150 | 14.3% |
| write code + tests | 48,787 | 13.1% |
| reasoning | 33,357 | 9.0% |
| build/test (dotnet) | 18,129 | 4.9% |
| reads (gov-doc 0.9% + code 3.5% + other 4.7%) | 34,020 | 9.2% |
| runtime MCP | 14,965 | 4.0% |

Plain arm for contrast: `write_code` **41,376 (44.4%)**, almost zero artifact prose.

**Key facts:**
1. **Code costs ~the same in both arms** — CHAOS `write_code` 48.8k ≈ plain 41.4k. Governance does not
   make the engineering more expensive; it adds a ~equal-sized *second* workload of prose about the
   engineering. The value (traceability) and the cost are the same, separable ~4× layer.
2. **~46% of the governed arm's (most expensive) output tokens is artifact prose** — proposal-report,
   proposal-review, apply-report, verification, lifecycle, and 5 `openspec/*` files per change.
3. **Turn count 2.8×** (273 vs 96 turns) drives a large cache-read volume and more discovery shell.

### Input / context cost (honest split)

| | output | cache-creation (expensive) | cache-read (cheap) |
|---|---:|---:|---:|
| CHAOS (9) | 371,345 | 984,532 | 20,672,786 |
| plain (6) | 93,255 | 241,153 | 3,421,738 |
| **ratio** | **3.98×** | **4.08×** | 6.04× |

The 20.7M "context" is **95% cheap cache-read** (re-reading the accumulated conversation each turn —
inherent to agent loops), so do **not** over-weight it. The expensive, controllable classes both track
~4×: **output** (dominated by artifact prose) and **cache-creation** (fresh context = reading governance
docs + writing-then-re-reading artifacts).

## Ranked levers (all preserve every decision + the human's decision weight)

1. **Lean artifact templates + a *true* `--light` path — highest $ impact, lowest risk.** Attacks the
   45.5%-of-output prose. Low blast-radius: emit the **decision record** (the value) + a compact
   apply/verify **dashboard**; drop narrative proposal-report/review, lifecycle, and the 5 openspec
   files. Halving artifact prose ≈ **−23% of total CHAOS output**; all decisions + traceability intact.
2. **Append-only / structured decision records** over narrative reports — cuts output prose *and* the
   write-then-re-read cache-creation.
3. **Blast-radius auto-classifier + cached governance digest** — auto-route trivial changes to light;
   hand the agent a precompiled digest so it stops `find`/`ls`/`grep` re-discovery and full-doc re-reads
   → fewer turns → less cache. Attacks the 14.3% shell + the 2.8× turn multiplier. (See "Knowledge
   capsules" below — this is the mechanism.)
4. **Capsule-based resume** (the X2b two-pass) — resume from the answered capsule straight to implement,
   skipping re-propose/re-read.

## Knowledge / step-context capsules (creator's idea, 2026-07-22) — assessment: **sound**

**Idea:** invoking a CHAOS command calls an MCP method to retrieve the latest *knowledge capsule* for the
change's lifecycle position; the capsule either points to the specific artifacts this step needs, or
inlines the needed info — so the agent stops re-discovering + re-reading the whole `.chaos/` surface.

**Verdict: good, not shitty — and it fits CHAOS's existing architecture unusually well.** But it is
Lever 3 (input/context/turns), a **complement** to Lever 1 (output prose), not a substitute — pair them.

Why it works / fits:
- **Reuses existing infra:** resume capsules (`.chaos/interactions/capsules/`) + per-artifact `bodyHash`
  already exist. This extends "resume state" → "scoped step-context manifest" — incremental, not a rewrite.
- **Targets the measured re-derivation tax:** shell discovery (14.3% output), 2.8× turns, 4× cache-creation.
- **Scoped by lifecycle step is the right axis:** `apply` needs the approved decisions + the proposal's
  scope + rules R-003/4/5 — not the whole assessment/archaeology. The runtime knows the lifecycle
  position and can scope the manifest to exactly that.
- **Coherence for free:** the capsule carries the expected `bodyHash`; the agent re-reads a pointed-to
  artifact only on mismatch. Uses existing hashing.

Make-or-break design constraints:
- **The capsule must be assembled MECHANICALLY by the runtime** from lifecycle state (decisions, locks,
  artifact index, hashes) — **not** LLM-generated. If an agent builds it, you just move the cost. A
  deterministic assembler is cheap, reliable, and dogfoods "runtime is source of truth."
- **Hybrid inline/pointer:** inline the small structured facts (answered decisions, the step's contract,
  the handful of in-scope rule statements); pointer-with-hash to the big blobs (full diffs, long reports).
- **Keep it ephemeral/derived** (like resume capsules: gitignored, regenerated from source of truth,
  never hand-edited) so it doesn't become another artifact to maintain.
- **Estimated impact:** cuts a meaningful share of the input/cache + turn cost, but leaves the 45.5%
  output-prose largely intact → must be paired with Lever 1/2 for the full win.

Proposed MCP shape (sketch): `chaos_get_step_context({ changeId, step }) → { decisions[], contract,
inScopeRules[], artifactRefs:[{path, bodyHash, whyNeeded}], inlineFacts }`.

## Next step

Build **Lever 1** first (biggest $, lowest risk): a real `--light` path with lean, decision-first
artifacts + templates, implemented directly (no governance on the toolkit). Then A/B it against the frozen
`.chaos/validation/2026-07-ea-v2/ea-x2-with-without/harness/` baseline (3.94× time / 4.75× tokens) to
measure the actual cut. Capsules (Lever 3) land as the follow-on for the input/turn cost.
