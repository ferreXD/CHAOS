# 12 — Risk register and failure modes

Part of the CHAOS public-alpha external assessment · assessed commit `6421feb` · 2026-07-18 · [Index](README.md)
Labels: Observed / Reported (author) / Inferred / Hypothesis / Recommendation / Unknown

## 12.1 Register

| ID | Risk | Prob. | Impact | Evidence | Mitigation | Early warning signal | Decide by |
|---|---|---|---|---|---|---|---|
| EA-R1 | **Documentation generator, not accelerator** — artifacts nobody reads | High | Fatal to identity | 17–19 artifacts/change (Observed); creator's own instinct to keep the repo artifact-free (Reported) | Compact profile + consolidated report (EA-B1); measure artifact-read-rate (EA-X2/X6) | Users cite only `decision-events.md`; reports unopened | Before beta |
| EA-R2 | **Ceremony → bypass** — users route around the workflow | High | High | ~11–14 stops/change (Observed); public dogfood used only todo/apply/archive — *partially amended*: full lifecycle exercised privately (Reported) | risk × profile split (EA-B1); decision batching; stop-count budgets | Dogfood/showcase usage avoids the full chain again | Now |
| EA-R3 | **Token cost unacceptable** | Med-High | High | ~196k/lifecycle measured (Observed) | EA-B2 program; publish per-command costs | Users cite cost in issues; own usage drops modes | Beta |
| EA-R4 | **Prompt/behavior drift** — commands drift from contracts; twin trees diverge semantically | High | Medium, compounding | 79/204 divergent files; structure-only parity; two stale-docs incidents already (Observed) | Single-sourcing + generated Copilot surface + content-aware parity (EA-B3); real CI (EA-S3) | Next stale-doc incident; parity exceptions file grows | Design now, execute pre-v1 |
| EA-R5 | **Substrate drift** — OpenSpec's OPSX rewrite breaks the hard gate | Medium | High | OpenSpec v1.6.0 rebuilt around OPSX (researched 2026-07-18) | Pin supported versions; vendored opsx skills; abstract the spec-engine seam (EA-A3) | CHAOS propose fails against a new OpenSpec release | Within 2 releases |
| EA-R6 | **Platform absorption** — Agent HQ / Claude Code ship decision inboxes | Medium | High | Mission control exists; checkpoints exist (researched) | Own the git-native ledger **format**; extract runtime (EA-A1/EA-D3); provider portability | Platform announces durable approvals | 6–12 months |
| EA-R7 | **Single-maintainer bus factor / creator-tailoring** | High | Medium | 1 author (4 git identities); 30-hour public history (Observed) | CI + CONTRIBUTING (exist); recruit 2–3 users as co-owners (EA-A4) | Zero external issues/PRs by +3 months | +3 months |
| EA-R8 | **False confidence** — labels laundered by a sloppy run | Medium | High (trust) | Enforcement textual; no mechanical check on evidence claims (Observed) | Deterministic validators (EA-I14); verify cross-checks | First fabricated-report incident | Beta |
| EA-R9 | **Resume produces wrong continuation** — thin capsules, stale workspace | Medium | Med-High | All 7 public capsules have empty context arrays; integrity hash never written (Observed) | Wire hash + capsule-quality gate (EA-I09); resume reliability experiment (EA-X4) | A resumed run contradicts its recorded answer | Beta |
| EA-R10 | **Claude-only dependence** | Medium | Medium | Everything meaningful requires Claude Code (Observed) | Keep Copilot experimental-but-honest (CLI writer path exists); don't chase parity now | Claude Code pricing/policy shift strands users | v1 |
| EA-R11 | **Multi-process state corruption** | Low-Med | Medium | No mutex (verified); self-healing indexes reduce blast | Advisory lockfile (EA-I08) | Lost lock entries / interleaved audit lines in the wild | Beta |

## 12.2 Failure shapes worth naming

- **The framework becomes tailored only to its creator** — every prompt tuned to one person's style; EA-X1/X6 are the antidote.
- **Stale artifacts poison trust** — a `lifecycle.md` that disagrees with reality is worse than none; deterministic consistency checks (EA-I14) are the antidote.
- **Enterprise-too-early** — building attestation/roles/telemetry before 3 external users exist; the roadmap's defer list is the antidote.
- **Proof stays private** — validation exists (Reported) but remains unverifiable; EA-V1 is the antidote and is now decided.

## 12.3 Kill / pivot criteria (Recommendation)

Run after the Horizon-1 experiments ([15-validation-experiments.md](15-validation-experiments.md)):

- If (a) no external user completes the lifecycle unassisted (EA-X1), **and** (b) with/without-CHAOS shows no defect/conformance advantage on strict-risk tasks (EA-X2), **and** (c) usage — including the author's — stays confined to a few commands (EA-X6): **pivot to EA-D3** (extract the interaction runtime as the product) rather than continuing the full methodology.
- If the runtime itself also shows no retention: keep CHAOS as an internal workflow and stop public investment.
- Absorption tripwire: if a platform ships durable, repo-local decision records before EA-A1 lands, re-evaluate EA-D3's window immediately.
