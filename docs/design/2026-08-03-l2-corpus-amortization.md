# L2 — Amortize the fixed governance corpus (design of record)

> Toolkit meta-work (no CHAOS governance), per [[chaos-develop-toolkit-without-governance]].
> Written 2026-08-03, **before any L2 code**. Execution brief:
> [`2026-08-03-performance-levers-handoff.md`](2026-08-03-performance-levers-handoff.md) §3/L2.
> Measured basis: Stage-D transcript decomposition (`9a3d08a`), §5b of
> [`2026-08-03-cost-bar-and-run-collapse.md`](2026-08-03-cost-bar-and-run-collapse.md).
> Creator decisions of 2026-08-03 are marked **(creator)**; the rest is the assistant's design,
> registered in §5e of the cost-bar doc.

## 0. The problem, in measured numbers

**93.4% of everything a governed arm reads is the identical fixed corpus** — ~147,600 chars
(~42k tokens) per change; only 6.6% concerns the change itself. Reading the governance surface
also accounts for **17.4% of all deliberation bursts**. This is the only cost center that is
*pure overhead at N>1*: the same bytes, re-read on every change, forever. Savings approach
(N−1)/N over N changes — the one lever that compounds.

### The corpus, itemized (measured 2026-08-03, `main` working tree)

The fixed corpus is exactly what `chaos-run`'s **Required references** section demands plus the
schemas those references point into:

| Source | bytes | consumed today |
|---|---:|---|
| `tools/chaos-render/schema/phase-facts.schema.json` | 48,954 | read in full to author records |
| `.claude/skills/chaos-shared/reference/change-template.md` | 16,970 | ledger/artifact formats |
| `.claude/skills/chaos-run/SKILL.md` | 12,448 | the loop itself (skill entry — stays) |
| `.claude/skills/chaos-propose/reference/openspec-integration-contract.md` | 8,891 | OpenSpec gate |
| `tools/chaos-classify/README.md` | 8,706 | classifier contract (**pinned**) |
| `.claude/skills/chaos-shared/reference/interactive-decision-protocol.md` | 7,113 | runtime protocol |
| `tools/chaos-render/schema/decision-entry.schema.json` | 6,150 | ledger validation shape |
| `tools/chaos-classify/adjudication-prompt.md` | 5,677 | adjudication contract (**pinned**) |
| `.claude/skills/chaos-shared/reference/model-robustness-policy.md` | 4,669 | execution contract |
| `.claude/skills/chaos-shared/reference/record-emission.md` | 4,358 | writer protocol |
| `.claude/skills/chaos-propose/reference/change-artifacts-layout.md` | 4,053 | folder layout |
| `tools/chaos-render/schema/contract.schema.json` | 2,729 | contract record shape |
| `.claude/skills/chaos-apply/reference/csharp-implementation-specialist-contract.md` | 2,371 | delegation |
| `.claude/skills/chaos-resume/reference/resume-capsule-contract.md` | 2,136 | capsule schema |
| `.claude/skills/chaos-apply/reference/task-delegation-contract.md` | 1,954 | delegation |
| `tools/chaos-render/schema/escalation-event.schema.json` | 1,918 | escalation shape |
| `.claude/skills/chaos-apply/reference/scope-drift-policy.md` | 1,655 | scope discipline |
| *(per-repo, small, not the problem)* `path-class-map.json` + posture doc | ~5,000 | classifier inputs |
| **Total** | **~146,700** | matches the measured ~147.6k |

Two facts fall out of the table:

1. **One schema is a third of the corpus.** `phase-facts.schema.json` at ~49k chars is consumed
   in full so the agent can author a ~2k-char record. That is the design smell the handoff named.
2. **The rest is 13 prose references** averaging ~5k chars each, read so the agent can follow
   protocols that are mostly checklists wearing prose.

## 1. The two moves

**Move 1 — compile the corpus into a governance digest.** One curated file replaces the 13
reference reads and the schema deep-reads for the delivery loop. Target size ≤ ~25k chars.

**Move 2 — make the remaining reads cache-shaped.** The digest is read **first, once, in one
step**, before any change-specific file, and never re-read. There is no API-level cache knob
available from the skill layer; within a session, Anthropic prompt caching makes a *stable early
prefix* nearly free on later turns — so the lever is (a) volume, via move 1, and (b) ordering
and no-re-reads, encoded in the loop's reading protocol. The handoff's "cache hits cut that
input ~90%" is realized as: one small read early instead of 13+ large reads interleaved with
work.

## 2. The digest (move 1)

### 2.1 Decisions

- **L2-D1 (creator).** The digest is **curated + sync-maintained**: authored once as a
  deliberate compression (checklists, not prose), then maintained by `chaos:sync` — which
  re-authors only the sections whose source hash moved and re-stamps the manifest. Not
  marker-extraction, not model-free.
- **L2-D2 (creator).** **Pinned surfaces are embedded verbatim** — byte-for-byte copies whose
  equality with the source is machine-checked. Pinned today: `adjudication-prompt.md` (whole
  file) and the classifier invocation + continuous-mode contract sections of
  `tools/chaos-classify/README.md`. A pinned byte that drifts is a `--check` failure, not a
  paraphrase.
- **L2-D3 (creator).** Scope: **the `chaos:run` loop only** consumes the digest before the
  re-measure. `propose`/`review`/`apply`/`verify` keep their current references and adopt only
  after the measurement validates the digest. `init`, `status`, `sync`, `archive`, etc. are
  untouched.
- **L2-D5.** Location: `.claude/skills/chaos-shared/reference/governance-digest.md` — toolkit-
  owned, versioned with its sources, staged into worktrees together with them (hashes and
  sources always travel in the same commit, so a worktree can never see a half-updated pair).
- **L2-D6.** The tool is `tools/chaos-digest/digest.py` — stdlib-only, own unit tests, house
  style per `chaos-render`/`chaos-classify`. Verbs:
  - `--check` (default): recompute every source sha256 against the manifest; byte-compare
    verbatim blocks against their source spans. Exit **0** fresh · **1** stale (each failure
    names the section and its source) · **2** could not run. Deterministic, no network, no model.
  - `--stamp`: recompute and rewrite the manifest hashes for sections whose content was just
    deliberately re-authored (the `chaos:sync` completion step). Never invoked casually.
- **L2-D8.** **Fail closed, fall back open.** At loop start `chaos:run` runs `digest.py --check`.
  On exit 0 it reads the digest and does **not** read the sources. On stale/missing digest it
  **falls back to the full source list** (the current Required references table survives in the
  skill as the fallback), records the degradation in the frame facts, and recommends
  `chaos:sync`. A stale digest is never read for content — correctness never depends on
  freshness.

### 2.2 Structure

```markdown
---
digest: governance-digest
generated-by: chaos:sync            # maintenance owner, not source of truth
sections:
  - id: decision-entry-format
    mode: verbatim                  # byte-equal to source span
    source: .claude/skills/chaos-shared/reference/change-template.md
    span: "## 2. Decision entry format"     # heading-delimited
    sha256: <source-file hash>
  - id: record-emission
    mode: compiled                  # curated compression; hash detects staleness only
    source: .claude/skills/chaos-shared/reference/record-emission.md
    sha256: <source-file hash>
  ...
---
> PROJECTION — compiled from the sources in the manifest above. Never edit by hand;
> never cite as source of truth. Stale? Run chaos:sync. (Like change.md, this is a view.)
```

Section plan (source → mode):

| Digest section | From | Mode |
|---|---|---|
| Decision-entry + TRG/ESC entry formats | change-template §2 | **verbatim** |
| Adjudication contract | adjudication-prompt.md (whole file) | **verbatim** |
| Classifier invocation, payload shape, continuous-mode verdict fields | chaos-classify README | **verbatim** (contract sections) |
| Resume-capsule schema | resume-capsule-contract.md | **verbatim** |
| Writer rules + record envelope field list + per-phase record table | record-emission.md | compiled |
| Record authoring: pointer to example records + `render.py --check` as validator | *(replaces the schema reads — §3)* | compiled |
| Runtime decision protocol checklist | interactive-decision-protocol.md | compiled |
| Model-robustness rules | model-robustness-policy.md | compiled |
| OpenSpec gate at each depth (0/1/2), authoring-timing rule | openspec-integration-contract.md | compiled |
| Change-folder layout | change-artifacts-layout.md | compiled |
| Scope discipline + delegation checklists | scope-drift/task-delegation/csharp contracts | compiled |

`change-template.md` sections other than §2 are **not** digested: `change.md`/`lifecycle.md`
are renderer output (Stage B), so the loop never needs their authoring spec — the renderer does.

**Rules the digest lives under** (same class as rendered artifacts):

- It is a **projection**. The sources remain the only truth; any conflict is resolved by the
  source, and a discovered conflict is a defect in the digest (fix via sync + `--stamp`).
- Hand-editing is prohibited except through the sync flow. The banner says so.
- Hash-keying detects **staleness, not wrongness** — a compiled section can be stale-correct or
  fresh-wrong. Fresh-wrong is what review of the sync diff is for; this is the same trust model
  as every rendered artifact.

## 3. Killing the schema deep-read

- **L2-D7.** `phase-facts.schema.json` (and `contract.schema.json`) stop being read by agents.
  Replacement: **curated example records + the existing validator.**
  - `tools/chaos-render/examples/` gains one canonical example per record type the loop emits:
    `contract.json`, `frame`, `deliver`, `verify` (+ `review` for completeness), each ~1–2k
    chars, showing every field the loop actually uses — including the honesty fields
    (`whyNotTest`, `assessment`, `confidenceLimiters`).
  - A unit test in `test_chaos_render.py` validates every example against the schema — an
    example that drifts fails CI, so the examples cannot lie. (Curated over generated: a
    schema-walking generator fights `oneOf`-per-phase complexity for no honesty gain the test
    doesn't already provide. Revisit only if example maintenance becomes churn.)
  - The digest's record-authoring section points at the examples and names
    `python tools/chaos-render/render.py <id> --check` as the authority: **pattern-match the
    example, let the validator catch you**. The schemas remain the machine truth for the
    renderer — unchanged, unread by agents.
  - Composition with L4: when the `chaos-record` emitter lands, it derives the facts and the
    examples remain the reference for the judgement-prose fields the agent still writes. The
    two designs share the examples surface deliberately.

## 4. The reading protocol in `chaos:run` (move 2)

`chaos-run/SKILL.md` changes only its **Required references** section and gains three lines of
protocol; the loop itself (steps 0–6, stops, capsule rule, golden rules) is untouched:

1. **Step 0 addition:** run `python tools/chaos-digest/digest.py --check`. Exit 0 → read
   `governance-digest.md` **now, once**; do not open the source references at all. Exit ≠ 0 →
   fall back to the full reference list (kept in the skill as the fallback table), record the
   degradation in the frame facts, recommend `chaos:sync`.
2. **No re-reads:** a file already read this session is never re-opened; the digest is the
   single stable governance read, placed before any change-specific content.
3. Per-repo inputs (`path-class-map.json`, posture docs) are unchanged — they are the governed
   repo's, small, and genuinely per-change context.

## 5. Maintenance: the `chaos:sync` duty

`chaos:sync` gains one reconciliation target (new reference:
`chaos-sync/reference/governance-digest-maintenance.md`):

1. Run `digest.py --check`. Fresh → report and done.
2. Stale → for each named section: **verbatim** → re-copy the source span byte-for-byte;
   **compiled** → re-author the compression from the changed source (this is the model step,
   and the sync report shows the section diff for review).
3. `digest.py --stamp`, re-run `--check` (must exit 0), record the sections touched in the sync
   report.

The digest is deliberately **not** regenerated by a hook or by `chaos:run` itself: regeneration
involves judgement (compiled sections) and belongs to the command whose job is reconciling
governance surfaces, with a human-reviewable report.

## 6. Measurement (creator, L2-D4)

**The output-token bar stays as-is.** The bar re-base question (§7 of the handoff) remains open
and is *not* silently decided here.

L2 is priced by extending the existing decomposition, not by new claims:

- `decompose-output.py` (or a sibling) additionally reports per arm: **total read volume**
  (chars of file-read tool results), its **fixed-corpus share** (reads matching the §0 file
  list + digest), and input-token usage split cached/uncached as the transcripts carry it —
  reported as named diagnostics next to every ratio, never as the pass/fail.
- Pre-registered predictions (frozen here, scored in the eventual all-levers run):
  - fixed-corpus read volume per governed arm: **~147.6k → ≤ 40k chars** (digest ≤25k + map +
    posture + on-demand examples);
  - reading-the-governance-surface deliberation share: **17.4% → single digits**;
  - output tokens: **roughly unchanged** (L2 attacks input; any output change is incidental);
  - **fidelity unchanged** — same triggers, same vector, same stops on the Stage-D task set.
    The classifier, corpus, and adjudication contract are byte-identical; L2 changes what the
    agent *reads*, never what fires. Any fidelity movement is a defect in the digest's
    compression and stops the analysis.

## 7. Risks

| Risk | Mitigation |
|---|---|
| Compiled section paraphrases a rule subtly wrong | Verbatim mode for every pinned/format-bearing surface; compiled sections reviewed via the sync report diff; sources always win on conflict |
| Digest goes stale in a worktree | Impossible to *silently*: `--check` runs at loop start, fail-closed; digest + sources are committed together (L2-D5) |
| Digest becomes de-facto source of truth | Projection banner, hand-edit prohibition, `--check` in the loop, and the fallback path keeps the sources exercised |
| Weakest supported model can't act on a checklist digest | The digest is *simpler* than the prose it replaces; model-robustness rules are themselves a digest section; fallback to full sources always available |
| Examples drift from schema | Unit test validates every example against the schema on every CI run |
| The +19.7% Stage-D absolute regression gets attributed to L2 | Read-volume diagnostic separates input effects from output effects per arm |

## 8. Build plan (order within L2)

1. `tools/chaos-digest/digest.py` + `test_chaos_digest.py` — manifest parsing, hashing,
   verbatim byte-compare, `--check`/`--stamp`, exit codes. Pure stdlib.
2. Example records in `tools/chaos-render/examples/` + schema-validation test in
   `test_chaos_render.py`.
3. Author `governance-digest.md` v1 (curated; verbatim blocks copied mechanically) and stamp.
4. `chaos-run/SKILL.md`: reading protocol + fallback table (§4).
5. `chaos-sync`: `governance-digest-maintenance.md` reference + one line in its SKILL.md.
6. Register table row in the cost-bar doc §5e; RUNKIT untouched (nothing measured yet).

Acceptance: digest `--check` exit 0 on a clean tree · all unit suites green (digest, render,
classify untouched) · zero classifier/corpus changes · `chaos-run` fallback path present ·
`.github/skills` mirror deliberately not synced (standing rule — decide at landing, not by
accident).

## 9. As built (2026-08-03, same day)

All of §8 landed. Deviations from the registered design, reported as found:

- **Digest v1 measures 32.4 KB**, above the ≤~25k aim in §1 but inside the §6 prediction
  band (fixed reads ≤40k: digest 32.4k + map ~3k + posture ~2.3k, examples on demand). The
  verbatim blocks (pinned contracts + ledger format + capsule schema, ~14k) are the floor;
  compressing them is forbidden by L2-D2. Not re-predicted — §6 stands as frozen.
- **A latent schema defect surfaced and was fixed en route:** both render schemas'
  `decisionRef` pattern lacked the `RUN` prefix, so any `chaos:run` record citing a
  `RUN-DEC-*` decision (deviations, `addedBy`, debt refs) failed validation. Stage-D arms
  never hit it only because all six had empty `deviations`. Widened (backward-compatible) in
  `phase-facts.schema.json` + `contract.schema.json`; the deliver/contract examples now
  exercise `RUN-DEC` refs, so the regression is test-covered.
- **`record-emission.md` (a source) gained the examples-first authoring protocol** so the
  fallback path stops re-opening the 49k schema too — then the digest section was restamped.
- No `review` example: `chaos:run` never emits a review record; deferred until a command
  needs one (noted in `test_chaos_render.py`).
