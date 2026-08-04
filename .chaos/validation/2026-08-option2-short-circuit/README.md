# Option-2 zero-trigger short-circuit — pre-registered measurement kit

> **Toolkit meta-work: this measurement runs WITHOUT CHAOS governance.** CHAOS runs only
> *inside* the governed arms.
>
> **Pre-registration.** §3 and §4 are frozen **at the commit that lands this kit, before any
> arm runs**, and are **never edited to match results**. The program is 0-for-7 on plausible
> cost levers.

## 1. What is under test, and the authority for it

The **zero-trigger short-circuit** (design of record
[wall-clock lever plan §Option 2](../../../docs/design/2026-08-04-wall-clock-lever-plan.md)):
when — and only when — the tool decides the post-merge frame is strictly zero-trigger
(nothing fired, every dimension at its floor, no preset, path-class map present),
`frame-commit` defers the frame's artifact **writes** to close and presents the contract
**inline** at S1. S1 itself is untouched: it still stops unconditionally (C-11) and still
owes its decision, ledger entry and capsule.

**Creator sign-off, recorded:** the plan gated this option on a creator decision because it
amends the S1 authoring rule ("author contract.json + frame record, render, then stop") for
the zero-trigger case. The creator directed the build in-session on **2026-08-04**
("Let's start with Option 2"); the design shipped is the plan's proposal unchanged.

**Fail-closed inventory (all unit-tested, `tools/chaos-loop/test_chaos_loop.py`):**

- Eligibility is tool-decided from the verdict; there is **no opt-in surface** — a fired
  verdict can never short-circuit; `--no-short-circuit` opts out, conservatively.
- A `--no-map` run can never short-circuit (M2 was structurally blind — the D4/D5 lesson).
- Deferral moves the writes, never the validation: the input file fails closed at
  `frame-commit` exactly as on the normal path.
- Any later firing makes the deferred artifacts owed **at the firing** (`loop materialize`);
  `loop close` aborts a fired-while-still-deferred run; the obligation audit gained the
  deterministic assertion `shortCircuit.materialized` — a still-deferred run cannot close.
- The parity gate holds **through** deferral: the short-circuited composite path and the
  granular path leave byte-identical `.chaos/changes/<id>` trees (marker file excluded as
  working state).

## 2. Setup

Identical to the [option-1 kit](../2026-08-option1-composites/README.md) §2 — same arms,
base, oracles, model ceiling, `effort: high` recorded per arm, `speed: standard`,
lever run 1 as comparator. **Options 1 and 2 are measured jointly** (see §5).

## 3. Frozen fidelity gates (stop-the-analysis)

1. Option-1 kit §3 gates all apply (oracle green, verdict equality vs lever run 1,
   artifact-set equivalence, invocation ceiling ≤ 4 + 2×units).
2. **Every zero-trigger arm short-circuits; no fired arm does.** The marker file is the
   evidence: present + `materialized` on band-A zero-trigger arms, absent on arms whose
   frame fired. A marker on a fired frame is a defect, full stop.
3. **Obligation audit passes at every close, including `shortCircuit.materialized`.**
4. **Any arm where a trigger fires after a short-circuited frame** must show
   materialization at the firing (marker `materializedAtScanSeq` ≤ the firing's scan seq);
   a close-time materialization on such an arm is a timing violation and is reported as
   one, never smoothed over.

## 4. Frozen direction tests (the falsification)

- **Band-A mean falls by ≥ 2 min** vs lever run 1 (run-1 band A: 15.0 min).
- **The band-A/band-B gap widens.** This is the one lever aimed at the flat cost curve
  (band A 15.0 vs band B 18.8 under product-relevant arms) — zero-trigger changes shed the
  frame-authoring cost that fired changes keep, so the curve is the metric, not just the
  mean. A band-A drop matched by an equal band-B drop means the saving came from something
  other than the short-circuit (option 1 alone) and this option's specific claim fails.
- **T1 frame-phase decomposition** (product-conditions comparison, when the re-run
  happens): time from prompt to S1 presentation on a zero-trigger change, previously
  9.3 min with 39% of the run before any code — predicted to drop to **1.5–2 min**, with
  ~1 min of deferred writes reappearing inside the close.

Expected combined effect of options 1+2 on a band-A change, honestly stated:
**−4–6 min** (15.0 → ~9–11). That does not reach the ≤5 min bar; the remainder is
generated volume (the resolved token-dominance finding).

## 5. Joint measurement, and the re-run decision (creator, 2026-08-04)

- Option 2 landed **after** the option-1 kit froze. The lever-run arms execute once, on the
  toolkit tip, and therefore price **options 1+2 jointly** against lever run 1. Attribution
  between them, if wanted later, uses the marker file (present ⇔ short-circuit active) and
  an optional pinned-to-`1c1e707` arm — pre-registered here as optional, not owed.
- **The product-conditions T1 re-run is blocked until options 2 and 3 complete** (creator
  directive, 2026-08-04). It will run on the tip and therefore measures the two defect
  repairs + composites + short-circuit **jointly**; its frozen 16–21 min prediction
  (product-conditions kit §9) was scoped to the defect repairs alone and must be read with
  that in mind. The joint prediction for the re-run, frozen here: **10–16 min** (16–21
  minus the frame-phase drop §4 predicts, minus composite trims), still likely above the
  ≤5 band-A bar because M4 probably still fires (§9's own reasoning).

## 6. Status log (never back-dated)

- 2026-08-04 — built (`loop.py` short-circuit + `materialize`, audit assertion, skill
  routing), 17 loop tests green incl. parity-through-deferral, sibling suites unregressed.
  §3/§4 frozen at the landing commit. **No arm has run.**
