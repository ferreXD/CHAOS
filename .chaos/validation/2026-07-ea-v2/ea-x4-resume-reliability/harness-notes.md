# EA-X4 — Harness notes (where it lives, how to run it, IL-RT9 CI wiring)

## Where the harness lives

Grown inside the runtime test tree so it is CI-wireable and advances **IL-RT9** (abuse-suite
skeleton in CI):

```
tools/chaos-interaction-runtime/test/abuse/
  prng.ts                    seedable LCG (reproducible kill points; recorded per run)
  harness.ts                 shared lib: deterministic runtime, corruption audit, resume oracle,
                             worker spawn + SIGKILL orchestration, runIteration()
  worker.ts                  child process: drives begin->decision->capsule->answer via the REAL
                             runtime, announces checkpoints, is hard-killed mid-write
  run.ts                     runnable driver: N iterations -> abuse-run.json + human summary
  killResume.abuse.test.ts   node --test smoke gate (reduced-N; the IL-RT9 CI seed)
```

Self-contained: every iteration uses its own `os.tmpdir()` store; the repo's real
`.chaos/interactions/` is never touched. Requires Node ≥ 22.6 (native `.ts` type stripping);
validated on Node v24.18.0.

## How to run it

```bash
cd tools/chaos-interaction-runtime

# Full abuse suite (default 20 runs; runs 15+ are the concurrent panel+runner variant).
# Exits non-zero iff the thresholds are missed (>=95% correct AND 0 corruption).
node test/abuse/run.ts --runs 20 --out ../../.chaos/validation/2026-07-ea-v2/ea-x4-resume-reliability/abuse-run.json
# or, via package script:
npm run test:abuse -- --runs 20

# CI smoke gate (reduced-N invariants: 0 torn state, exactly-once consume, known shape):
npm test                                  # runs test/**/*.test.ts, incl. the abuse smoke
node --test test/abuse/killResume.abuse.test.ts   # just the abuse smoke
```

`run.ts` flags: `--runs N` (default 20), `--out <path>` (default `test/abuse/abuse-run.json`).

### Reproducibility caveat (read before trusting a single number)
The seed (`seed = iteration index`) fixes the *stimulus* — variant, checkpoint, kill mechanism,
jitter — reproducibly and records it per run. But **where a hard kill lands** relative to a
fast synchronous write depends on OS scheduling, so the exact per-run classification and the
exact rate vary between passes. Across four 20-run passes here: **60/70/75/80% correct, 0
corruption every pass, both failure classes every pass.** Treat the 0-corruption result and the
failure *classes* as the stable findings; treat the precise percentage as one Observed sample.

## What it checks

- **Corruption audit** (`corruptionAudit`): walks the on-disk store — every `.json` must parse;
  every `audit.jsonl` line must parse with no partial trailing line; every persisted record is
  schema-validated against the authoritative Iteration-0 schemas
  (`.chaos/interactions/schema/*.schema.json`); orphan `.tmp` files and the null-capsule-hash
  gap are recorded.
- **Resume oracle** (`resumeOracle`): from a clean in-process runtime, classifies the committed
  state, drives the documented resume path (`findResumeCandidates` + `resumeCommand`, answering
  any pending decision), and verifies correct continuation, `nextStep` match, exactly-once
  consume, and lock coherence. See `results.md` for the classification table.

## IL-RT9 — CI wiring proposal

**Good news: the smoke gate is already wired.** `.github/workflows/ci.yml` runs `npm test` for
`tools/chaos-interaction-runtime` in its Node matrix. Because the smoke lives at
`test/abuse/killResume.abuse.test.ts` and the package `test` script matches `test/**/*.test.ts`,
committing this harness makes the abuse smoke run in CI on every push/PR — **closing IL-RT9's
criterion "abuse-suite skeleton exists and runs in CI"** with no workflow edit required.

One required packaging change travels with the harness (already applied to
`tools/chaos-interaction-runtime/package.json`):

```jsonc
// was:  "test": "node --test"
"test": "node --test \"test/**/*.test.ts\"",   // scope discovery to *.test.ts so the driver/
"test:abuse": "node test/abuse/run.ts"          // worker/harness files are not run as tests
```
(`node --test` with no path treats *every* file under `test/` as a test file, which would
execute `run.ts`/`worker.ts`. Scoping to `*.test.ts` keeps `npm test` green — verified: 48/48.)

**Optional** — add a dedicated reduced-N driver step as a non-blocking smoke (kept small; the
full 20-run distribution is timing-sensitive and better run on demand than gated):

```yaml
# in ci.yml, node job, after the existing "Test" step, guarded to the runtime package:
- name: Abuse suite (reduced-N smoke)
  if: matrix.package == 'tools/chaos-interaction-runtime'
  working-directory: tools/chaos-interaction-runtime
  run: node test/abuse/run.ts --runs 6 || true   # informational; do not gate on the rate
```
Rationale: the *invariants* (0 torn state, exactly-once consume) are the hard gate and live in
the `node --test` smoke; the *rate* is distributional and, until EA-V3 lands, expected to fail
≥95% — so gating CI on it would wedge the pipeline. Run the full driver on demand / in EA-V3.

## Tracked-source flag (per the brief: "a separate commit decision")

**Recommendation: commit the harness as tracked source.** It is genuine test infrastructure,
it is the seed IL-RT9 asks for, and EA-V3's "concurrent-writer test suite" is exactly this
suite's concurrent variant — so EA-V3 should grow it, not re-invent it. Committing includes:

- `tools/chaos-interaction-runtime/test/abuse/**` (5 files above)
- the one-line `package.json` `test`-script scoping + `test:abuse` script

The **results** (`results.md`, `abuse-run.json`, `failures.md`, this file) are committed
regardless — they are EA-X4's closure evidence. The harness commit is separable; if the team
prefers to keep it out of tracked source for now, revert the `package.json` change and move
`test/abuse/` out of the package — the published results stand on their own.
