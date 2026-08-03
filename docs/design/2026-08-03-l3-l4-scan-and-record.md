# L3 + L4 — `chaos-scan` and `chaos-record` (joint design of record)

> Toolkit meta-work (no CHAOS governance), per [[chaos-develop-toolkit-without-governance]].
> Written 2026-08-03, **before any L3/L4 code**. Execution brief:
> [`2026-08-03-performance-levers-handoff.md`](2026-08-03-performance-levers-handoff.md) §3.
> Siblings: L2 (`7d05572`), L1 (`3bd1700`/`8dc3f5e`). Creator decisions marked **(creator)**;
> all decisions registered in §5e of
> [`2026-08-03-cost-bar-and-run-collapse.md`](2026-08-03-cost-bar-and-run-collapse.md).
>
> **The L3 prediction is already frozen** in §5c of the cost-bar doc (pre-registered as
> Stage E, before any build): classification machinery is 48.3% of deliberation and
> deliberation ~61% of output ⇒ up to ~29% of governed output addressable; if the wrapper
> captures two-thirds, band B 5.51× → ~4.4× and band A 4.81× → ~3.9× — **both still missing
> their bars**. That prediction is restated here and NOT re-opened.

## 0. Why one design

L3 attacks the **thinking** (scan prep 22.7% + running the classifier 18.4% + payload
authoring 7.2% of deliberation); L4 attacks the **writing** (records = 49% of authoring
bytes, ~29.6% of visible output). They meet in the same loop steps and share artifacts: the
C-15-scoped diff L3 produces is exactly the `files` evidence L4 derives from, and both
replace agent transcription with derivation. Designing them apart would invent two diff
conventions and two payload paths.

Both levers move **who performs mechanical steps, never what is decided** — same triggers,
same dimensions, same stops, same audit, same artifact set. The classifier core
(`classify.py`) is **not modified**; zero corpus movement.

## 1. L3 — `chaos-scan` (the protocol, mechanized)

- **L3-D1.** `tools/chaos-scan/scan.py` — stdlib-only, own unit tests, house style. It
  **imports `classify()` as a library** (the pattern `audit.py` set); no subprocess, no
  classifier changes.
- **L3-D2.** Subcommands mirror the evidence classes: `k1` · `rescan` (K3) · `k2` (after an
  answered decision) · `k4 --self-review <verdict>` · `merge --raises <file>`. At `k1` the
  orchestrator passes intent (verbatim), predicted scope, `declaredTriggers`, mode, and
  **`subjectPaths`** (the C-15 subject roots); scan persists them to
  `.chaos/changes/<id>/scan-inputs.json` — same class as `classification-state.json`
  (working state, deliberately NOT a `records/` artifact) — so every later call needs only
  the change id. An approved scope change updates it via an explicit
  `scan.py update-scope` call citing the decision; never silently.
- **L3-D3.** The diff mechanics live inside `rescan`: `git add -N <subjectPaths>` +
  `git diff --numstat` / patch scoped `-- <subjectPaths>` (C-15 by construction: inclusion
  of the subject, not enumeration of exclusions), persisted under
  `.chaos/changes/<id>/scan/` where L4 reuses them.
- **L3-D4 — the verdict digest** (the hard constraint made concrete). Every call appends
  `scan/verdict-<seq>.md`, and it MUST carry: newly fired triggers with **verbatim cites**,
  `scanEcho`, **demoted candidates with reasons** (the raise-only adjudication surface,
  C-6/C-12 — non-negotiable), stop outcome with the duty spelled out (`newStops` → surface
  one folded decision · `stopAbsorbedBy` → amend the pending entry, increment `folds:` ·
  `stopSatisfiedBy` → cite the covering decision), the 7-dimension vector, confidence,
  `scanSeq`, and `adjudicationDue` with the packet pointer. The agent reads ~20 lines
  instead of raw JSON; nothing evidential is dropped.
- **L3-D5 — the adjudication flow.** When `adjudicationDue`, scan writes the **sanitized
  packet** (`classify.sanitized_packet`, the same blindness contract the corpus validated)
  to `scan/packet-<seq>.json`. The orchestrator judges it **at ceiling** per the pinned
  prompt, then `scan.py merge --raises` applies the result — and **fails closed (exit 2) on
  any raise missing a cite** or naming a non-materiality trigger. The two-call dance is now
  a tool sequence; the only model work left at a scan is the judgement itself.
- **L3-D6 (creator) — TRG events are tool-appended.** Writer rule 2 is amended: **decision
  entries (`*-DEC-*`, `ESC-*`) stay agent-appended; `TRG-*` events are appended by
  `chaos-scan`** at each firing, byte-derived from the verdict (they were already
  RECORDED/command-made). This supersedes L1's floor assignment for TRG transcription —
  the ladder says tool beats cheap model. (`record-emission.md`, the tier map, and the
  digest update accordingly at build.)

## 2. L4 — `chaos-record` (facts derived, judgement kept)

- **L4-D1.** `tools/chaos-record/record.py` — stdlib-only, own tests; imports
  `validate_schema`/`load_schema` from `chaos-render` (which stays the artifact projector;
  `chaos-record` is the record emitter — emission and projection remain separate tools).
  Emits `frame`, `deliver`, `verify`. `contract.json` stays agent-authored: statements are
  judgement end-to-end.
- **L4-D2 (creator) — partial record at the real path.** The emitter writes
  `records/<phase>.pass-NN.facts.json` directly (auto-incrementing `NN` from the folder),
  with derived facts filled and **judgement fields empty**. The agent fills them;
  `render.py --check` is the completion gate (required-but-empty fields keep it red). An
  aborted pass **deletes the file** — writer rule 3's intent (no records for abandoned
  attempts) is preserved and documented.
- **L4-D3 — what is derived, per phase.**
  - *Envelope (all phases):* `schemaVersion`, `recordType`, `phase`, auto `pass`,
    `changeId`, `sourceCommand`, `run`, `mode`, `at` — mechanical. `verdict`,
    `assessment`, `verdictRationale`, `commentary`: **empty**.
  - *deliver:* `build`/`tests` **parsed from the orchestrator's own logs** (no double
    execution mid-loop); `files` from the L3 diff numstat; `coverage` **scaffolded** — one
    row per `contract.json` statement id, exactly once, with `covered`/`evidence`/`refs`/
    `whyNotTest` empty; `rules` scaffolded by id; `deviations` empty (agent-only);
    `scopeDrift` derived from scan state (M5 never fired ⇒ `NO_DRIFT` is a fact).
  - *verify (creator, L4-D4):* **the tool re-runs the checks itself** — build, tests,
    `openspec validate` — so the independent re-run that gives verify its meaning becomes
    mechanical and untranscribable-wrong. Contract `ticked/total` computed by the same
    join the renderer uses; `scopeDrift` from scan state; `rules` scaffolded.
    `traceability` and `findings`: **empty** (judgement).
  - *frame:* envelope + intent verbatim from `scan-inputs.json` + the OpenSpec proof block
    from a real `openspec status` invocation. `sourceManifest`, `risk`,
    `framingTraceability`: empty (judgement).
- **L4-D5 — the honesty guard, tested.** The emitter **never fills a judgement field**:
  `verdict`, `assessment`, `verdictRationale`, `commentary`, `coverage.covered/evidence/
  whyNotTest`, `deviations`, `rules[].status/evidence`, `findings`, `traceability`. A unit
  test asserts emitter output contains none of them non-empty — deriving a fact it cannot
  actually derive (guessing) is the defect class this lever must never ship.

## 3. The loop, after L3+L4 (what `chaos-run` steps become)

- **K1:** `scan.py k1 …` → read `verdict-1.md` → judge `packet-1.json` at ceiling →
  `scan.py merge` → `record.py frame` + author contract + fill judgement → render → S1.
- **Work unit:** implement (tier per L1 easy gate) → `scan.py rescan` → digest tells the
  duty; adjudicate only when due. TRG entries already in the ledger.
- **Close:** `record.py deliver --build-log … --test-log …` → fill judgement → (verify owed:
  `record.py verify --run-checks` → fill findings) → `audit.py` → render → S4/complete.

The digest's two classifier sections (`classifier-wiring`, `classifier-continuous-mode`)
follow the README when it documents the wrapper at build time (source edit ⇒ restamp).
Tier-map supersessions at build: TRG floor→tool (L3-D6); mechanical audit repairs shrink to
"re-run the emitter" — still floor-delegable, now trivial.

## 4. Measurement

**L3: the §5c prediction stands, verbatim, un-reopened.** Scored in the all-levers run.

**L4 predictions (frozen here):**

- records' share of visible output: **29.6% → ≤ 15%** of a now-smaller visible total;
- payload/record-authoring deliberation (7.2% payload + the record share of the 60.2%
  authoring block): **falls by more than half**;
- fidelity, oracle, artifact set: **unchanged** — any movement stops the analysis;
- **zero judgement fields auto-filled** across all measured arms (checked mechanically by
  the L4-D5 test + spot-audited in evidence).

## 5. Risks

| Risk | Mitigation |
|---|---|
| The digest hides evidence the adjudication needs | L3-D4 mandatory content: verbatim cites + demoted candidates; the sanitized packet carries the full allowed inputs, unchanged from the corpus-validated contract |
| A raise sneaks in without a cite | `merge` fails closed, exit 2 (C-6 mechanized) |
| `scan-inputs.json` drifts from the approved scope | Single capture at k1; changes only via explicit `update-scope` citing a decision |
| Emitter guesses a fact it cannot derive | L4-D5 unit test: no judgement field ever non-empty in emitter output; underivable facts stay empty for the agent |
| Crash between emit and fill leaves an invalid record | `render.py --check` names it; resume re-derives obligations from state; abort path deletes the partial |
| Verify double-execution cost | Bounded and deliberate — the independent re-run IS the check (creator L4-D4) |
| Classifier drift via the wrapper | `classify.py` untouched; scan imports it; corpus scan-only must stay 9/9 as an acceptance gate |

## 6. Build plan

1. `tools/chaos-scan/scan.py` + `test_chaos_scan.py` (subcommands, scan-inputs, diff
   mechanics against a fixture git repo, digest content assertions, merge fail-closed,
   TRG append).
2. `tools/chaos-record/record.py` + `test_chaos_record.py` (derivation per phase, auto-NN,
   log parsing, the L4-D5 honesty-guard test, schema validity of emitted partials
   modulo required-judgement fields).
3. `chaos-run/SKILL.md` loop rewrite (§3 shape) + `record-emission.md` writer-rule-2/3
   amendments + `tools/chaos-classify/README.md` wrapper note in continuous-mode.
4. Digest restamps (classifier sections verbatim, record-emission compiled re-author);
   tier-map TRG supersession (registered change); `--check` exit 0.
5. Register rows (§5e) + RUNKIT untouched (nothing measured yet).

Acceptance: all suites green (scan, record, digest, render, classify) · corpus scan-only
9/9 over 29 seeds · digest `--check` exit 0 · `classify.py`/`audit.py` diffs empty ·
adjudication-prompt.md byte-identical (changing it re-opens the corpus run) ·
`.github/skills` mirror untouched.

## 7. As built (2026-08-03, same day)

All of §6 landed; every acceptance gate passed (129 tests across the five suites: scan 11 ·
record 8 · digest 13 · render 58 · classify 39; corpus all-PASS; frozen surfaces untouched;
digest exit 0 after four section restamps). Deviations from the registered design, reported
as found: none of substance — two notes:

- The `merge` subcommand replays the **last checkpoint** recorded in `scan-inputs.json`
  (its `lastCheckpoint` cursor) rather than taking a checkpoint argument; the two-call
  pattern's dedupe makes the replay safe, and the cursor removes an agent-suppliable wrong
  input.
- `record.py verify --run-checks` records openspec validation only when
  `--openspec-validate-cmd` is passed — the orchestrator knows CLI availability; the tool
  does not probe PATH and guess (L4-D5 posture applied to environment facts too).
