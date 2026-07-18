# 05 — Command portfolio review

Part of the CHAOS improvement-landscape assessment · commit `6421feb` · 2026-07-18 · [Index](README.md)
Premise applied throughout: **more commands do not make CHAOS better.** Every command is a concept the user must hold; the portfolio should shrink where possible.

## 5.1 Verdict per command

| Command | Essential? | Finding | Disposition |
|---|---|---|---|
| `chaos:propose` | **Yes** | Core spine; OpenSpec hard gate is its best part | Keep |
| `chaos:apply` | **Yes** | Core spine | Keep; add `--emergency` (IL-WF5), `--task` re-entry (IL-WF8) |
| `chaos:verify` | **Yes** | Core spine; overlaps code-review | Keep; absorbs code-review at compact profile (IL-WF3) |
| `chaos:resume` | **Yes** | Core to the thesis | Keep; also becomes a DC one-click action (IL-DX4) |
| `chaos:init` | **Yes** | Necessary; becomes the foundation entrypoint (IL-AG1) | Keep, evolve |
| `chaos:doctor` | **Yes** | Cheapest, most useful | Keep; **absorbs status** (IL-WF3); gains `--fix` onboarding (IL-DX3) and janitor (IL-RT4) |
| `chaos:review` | Standard+ | Real pre-build gate | Keep; optional below strict |
| `chaos:archive` | Standard+ | Necessary closure; re-audits verify's work | Keep, slim; **absorbs change-scoped sync** |
| `chaos:archaeology` | Standard+ (brownfield) | The brownfield differentiator | Keep; add snapshots (IL-PF6), observed-posture mode (IL-AG5), finding IDs (IL-TR9) |
| `chaos:code-review` | Full profile only | Overlaps verify (both post-impl gates) | Merge at compact; separate at full |
| `chaos:sync` | Split | Change-scoped part duplicates archive; repo-wide part is real | Change-scoped → archive; keep `chaos:sync --all` (maintainer) |
| `chaos:status` | No (as separate) | Heaviest command (29.6k tokens); mostly deterministic checks in prose | **Merge into doctor**; checks → diagnostics (IL-PF4) |
| `chaos:retro` | Periodic | Third full re-read per change | Keep; periodic + trigger-based default (IL-WF7) |
| `chaos:todo` | Slim | Second-heaviest; largely mechanical | Keep as thin wrapper over deterministic curation (IL-WF6) |
| `chaos:help` | Yes (cheap) | Fine; next-step duty moves to deterministic hinting (IL-DX6) | Keep |
| `chaos:gate` (phantom) | No | Undecided concept in backlog | **Never build** — gates are data (IL-WF9/IL-AG4) |
| aliases (`archeology`, `proposal`) | — | Harmless self-documenting shims | Keep |
| `opsx/*` (vendored) | — | Upstream surface | Keep, pin version (IL-EX3) |

**Too broad:** status (audit-everything → deterministic checks + narrative), todo (scan+dedupe+views+imports → tool with model assist). **Too narrow:** none problematic. **Should become internal implementation details:** capsule creation (already runtime-side), lifecycle-row bookkeeping (should become deterministic index updates — IL-PF3 — not model prose duties). **Should become UI actions:** resume (DC one-click), stale-lock release, decision re-open/expiry handling. **Removed:** `chaos:gate` (pre-emptively).

## 5.2 New-command candidates under the 7-question test

Only two candidates survived brainstorming; the test kills or reshapes both-but-one.

### `chaos:run` (consolidated lifecycle driver — IL-WF2)

1. *Why not an existing command?* It sequences several; no single command owns the whole change journey. 2. *Understood when to invoke?* Yes — "drive this change" is the most natural user intent of all. 3. *Frequent enough?* At compact profile it would be the default entrypoint. 4. *Durable artifact/state transition?* Yes — the whole change trail. 5. *Deterministic implementable?* No — it is orchestration of governed model work (phase gating can be deterministic). 6. *Cognitive load?* Net ↓ if it *replaces* remembering the sequence; net ↑ if it merely joins the list — mitigation: market it as the front door, demote individual commands to advanced usage. 7. *DC action/runtime/doctor instead?* No — it is the primary human intent. **Verdict: explore** — the only new command candidate worth prototyping, and only after IL-WF1 defines the profiles it would drive.

### `chaos:foundation` (manage project foundation)

1. *Why not existing?* It can be: creation is an init phase; revision is a propose template (`revise-foundation-<area>`); inspection is a status/doctor section + DC view. 2. Understood? Marginal. 3. Frequency? Rare after init — fails the bar. 4–7: revision already produces its durable artifacts through the normal lifecycle. **Verdict: rejected as a command.** Foundation ships with **zero new commands** ([09 §13](09-greenfield-foundation-design.md)).

Other ideas pre-killed by the test: `chaos:hotfix` (→ `apply --emergency` flag); `chaos:next` (→ deterministic hint, IL-DX6); `chaos:conform` (→ verify/code-review + deterministic rules, IL-AG4); `chaos:clean` (→ `doctor --fix` janitor, IL-RT4).

## 5.3 Recommended target portfolios

| Tier | Commands (user-facing) | Count |
|---|---|---|
| **Minimal CHAOS** | init · propose · apply · verify · resume · doctor · help | **7** |
| **Standard CHAOS** | + review · archive (incl. change-sync) · archaeology · todo (slim) · retro (periodic) | **12** |
| **Advanced/full** | + code-review (separate) · sync --all · runner operation · `chaos:run` (if adopted) · foundation revision via propose template | **14–15** |

Today's surface is 17 + 5 vendored. The target standard tier of **12** is reached almost entirely by *merging and demoting*, not deleting capability — consistent with the finding that the surface needs subtraction (first assessment §18-reject).

## 5.4 Portfolio principles going forward

1. A new command must pass all seven questions; default answer is "no — flag, phase, DC action, or deterministic tool."
2. Commands own **state transitions of a change**; diagnostics own **facts**; the DC owns **human actions on runtime state**.
3. Every merge keeps an alias shim for one minor version with a deprecation note (the existing alias pattern, Observed, is the right mechanism).
