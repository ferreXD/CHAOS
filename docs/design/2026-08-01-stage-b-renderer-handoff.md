# Stage B — renderer handoff brief

> **Purpose:** everything a fresh session needs to start Stage B without re-deriving the last three
> weeks. Stage A is complete, measured, and validated on a real end-to-end run. This is the entry
> point; the design of record is
> [`2026-07-24-artifact-model-roadmap.md`](2026-07-24-artifact-model-roadmap.md) §Stage B.
> Toolkit meta-work — build CHAOS **without** CHAOS governance (creator's standing preference).

## 1. Where things stand

| | State |
|---|---|
| **Stage A** | Shipped + measured. Collapsed `--light` lifecycle; artifact prose 45.5% → 4.7% of governed output; governed arm −58% on identical tasks; oracle clean; escalation valve correct both directions. |
| **Universal `change.md`** | All modes. The four narrative reports + `approval.md` are retired as outputs everywhere (kept only as read-fallbacks for old/archived changes). |
| **Frontmatter state** | `chaosMetadata.lifecycle` is authoritative: `phases` (frame→review→deliver→verify→sync→archive, plus optional codeReview/retro), each with `status/at/run/mode/verdict`, plus a `current` cumulative rollup. `lifecycle.md` is a **projection** of it. |
| **Validation** | 3 artifact quality-grade review rounds over real runs; final round graded **A**, all targeted fixes verified natively. |
| **Branches** | `main` @ `db593fc` (**ahead 3, not pushed**) · `demo/dotnet` @ `df26104` (**not pushed**; `origin` still at `d27600f`). |
| **Golden reference** | `demo/dotnet` `df26104` — a full strict lifecycle (`secure-task-api`) with all five artifacts. Worktree: `D:/Proyectos/CHAOS/demo-light`. |

## 2. What Stage B is (recap)

**The inversion:** agents stop *writing* narrative artifacts. Agents emit **structured records**;
every human-readable artifact is **rendered mechanically** from the sources of truth.

- **Agents write:** decision entries · contract statements · delivery-facts (files, tests, checks,
  deviations) · escalation events — data, not prose.
- **The renderer produces:** `chaos:render <changeId>` → `change.md`, `lifecycle.md`, index/dashboard
  views, from runtime session + decision state + ledger + git diff stats + delivery-facts.
  Deterministic, idempotent, regenerable at any commit, stamps `chaosMetadata` mechanically.
- **Migration A→B:** A's skills already write `change.md` to strict formats → B swaps the *writer*.
  Skill prompts shrink (no artifact-authoring instructions). `lifecycle.md` flips from hand-stub to
  rendered view — already the agreed end-state. **No layout change for readers**: verify/sync/todo/
  archive parse the same file they parse today.

Full rationale + honest costs: roadmap §Stage B (44 lines).

## 3. The measured case for B — three review rounds are the renderer's spec

This is the part that does not exist anywhere else. Every defect found across three rounds of
reviewing **real generated artifacts** is a writer-discipline failure that a deterministic renderer
eliminates *by construction*. Treat this list as B's acceptance criteria.

| Round | Defect observed | What the renderer must do |
|---|---|---|
| 1 | Stale cumulative count in a prose dashboard (`15 entries` vs actual) | Derive all counts at render time; snapshots are dated, never stale-by-accident |
| 1 | `phases` omitted `verify` although verify ran twice | Phases come from runtime session state — a step that ran cannot be missing |
| 1 | Cross-ref cited the wrong decision entry | Resolve `*-DEC-*` references against the ledger; unresolvable ref = render error |
| 1 | Mixed rigor invisible (framing mode only) | Per-phase `mode` is data, rendered not narrated |
| 2 | Archive claimed `UNCLASSIFIED: none` while classifying **12 of 14** | Enumerate mechanically; row count == entry count is an assertion, not a habit |
| 2 | `lifecycle.md` rendered a verdict its source never had | A projection cannot invent a cell — absent key ⇒ `—` |
| 2 | `archiveReadiness` held an out-of-enum value | Validate every field against the schema before writing |
| 2 | `repositoryContext` written as a Python dict repr | Deterministic serialization + a test (this one is already fixed and guarded) |
| 3 | **All 8 generated artifacts fail the metadata validator** (0/4 provenance fields) | The renderer stamps provenance mechanically — this defect becomes impossible |
| 3 | A `run` id in frontmatter disagreed with prose *and* the view | One source, one render — divergence is structurally unrepresentable |
| 3 | Overflow rule (>~80 lines → `appendix/`) breached in **all three** rounds | Section length is measured, not eyeballed; overflow is automatic |

**Read this as:** the residual artifact defects are no longer about *what* to record — the schema is
right and the content quality is genuinely high (round 3 graded **A**, with self-caught spec tensions
and honest "code-evidenced, not test-covered" disclosures). They are about *mechanical consistency*,
which is exactly what an LLM writer cannot guarantee and a renderer gives for free.

## 4. What already exists to build on

- **Schemas** — `chaos-shared/reference/change-template.md` is the canonical format spec (§1
  `change.md` + frontmatter, §2 decision entries **+ the canonical scan rule**
  `^## (<PREFIX>-DEC-<nnn>|ESC-<nnn>)` scoped to the ledger, §3 `lifecycle.md` view + purity rule).
  Per the roadmap, **A's formats *are* B's schemas** — this file is the renderer's input contract.
- **A real corpus to render against** — the golden reference (`demo/dotnet` `df26104`) plus the
  earlier runs. Render it and diff against the committed artifacts: that is the acceptance test.
- **Runtime state** — `tools/chaos-interaction-runtime` + the MCP server already hold sessions,
  decisions, capsules, locks (the renderer's primary source).
- **A stamping precedent** — `.claude/hooks/scripts/chaos-artifact-metadata-hook.py` already parses
  frontmatter, renders a `chaosMetadata` block deterministically (`render_chaos_metadata_block`,
  `_yaml_scalar`, `_scalarize_*`), and self-heals malformed values. Reuse it rather than re-inventing;
  it also solves round-3's provenance finding.
- **A test precedent** — `test_chaos_artifact_metadata_hook.py` (13 tests) and
  `test_chaos_auto_resume.py`. The renderer is correctness-critical and needs its own suite; these
  show the house style (stdlib only, dynamic module load, register in `sys.modules` before exec).
- **A parity ratchet** — `node tools/chaos-parity-check/check.mjs` must stay `PARITY OK`
  (baseline currently 76 entries). Any skill edit lands in both `.claude/` and `.github/` trees.

## 5. Suggested build order

1. **Record schemas** — pin the JSON/YAML shape of the four records (decision entry, contract
   statement, delivery-facts, escalation event) against the existing formats. No behaviour change yet.
2. **Renderer, read-only** — `chaos:render <changeId> --check`: read runtime + ledger + records,
   render `change.md`/`lifecycle.md` **to stdout**, diff against what is on disk. Run it over the
   golden reference until the diff is explainable. Zero risk, maximum learning.
3. **Renderer, writing** — `--write`, idempotent, provenance stamped mechanically; `lifecycle.md`
   becomes generated rather than hand-stubbed.
4. **Swap the writers** — skills emit records; delete artifact-authoring prose from the prompts
   (this is where the token win lands). One command at a time, `chaos:verify` last.
5. **Re-measure** — re-run the EA-X2 harness kit at
   `.chaos/validation/2026-07-ea-v2/ea-x2-stage-a-light/` and add a dated row to the frozen
   `RUNKIT.md`. Stage A got ~4× → ~2×; B is the path toward ~1×.

## 6. Open questions carried (do not relitigate silently)

- **OpenSpec on light/all modes** — creator kept the full set "at least for the moment"; the roadmap
  flags Stage B as the point to revisit whether spec deltas also become records+projection. The
  Stage-A measurement gives the evidence: with prose at 4.7%, OpenSpec + governance reads are now the
  dominant residual cost.
- **Generated prose is drier than authored prose.** Accepted trade in the roadmap. The round-3 artifacts
  are unusually *good* writing (see §3) — decide deliberately how much of that voice a renderer keeps,
  and where authored commentary is still allowed to sit.
- **The renderer becomes correctness-critical** — a rendering bug corrupts every artifact at once.
  Hence read-only first, and its own test suite.
- **`maxMaterialDecisions: 2`** held across runs; no retune indicated.

## 7. Map — where things live

```text
docs/design/2026-07-24-artifact-model-roadmap.md      A → B → C, decisions register
docs/design/2026-07-22-light-mode-{workflow,per-command}.md
docs/design/2026-07-26-standard-strict-change-md-migration.md   + 2 addenda (schema, round 2)
docs/perf/2026-07-22-ea-v2-cost-attribution.md       where the ~4× goes
.claude/skills/chaos-shared/reference/change-template.md        THE format spec (= B's schemas)
.claude/hooks/scripts/chaos-artifact-metadata-hook.py           stamping + serialization precedent
tools/chaos-interaction-runtime/                                runtime state (renderer input)
tools/chaos-parity-check/check.mjs                              must stay PARITY OK
.chaos/validation/2026-07-ea-v2/ea-x2-stage-a-light/            re-runnable measurement kit
D:/Proyectos/CHAOS/demo-light  (branch demo/dotnet)             golden reference to render against
```

**First action for the next session:** read the roadmap §Stage B, then §3 above, then run the
renderer-shaped thought experiment against `demo-light`'s `change.md` — every field in it should be
traceable to runtime state, the ledger, or git. Anything that is not is either a record you still need
to define, or prose that Stage B deliberately drops.
