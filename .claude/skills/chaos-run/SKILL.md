---
name: chaos-run
description: "The collapsed CHAOS delivery loop (Stage D): one continuous command from intent to close — classification on evidence birth/growth, stops only where materiality or discordance demands one, deterministic obligation audit at close."
---

# CHAOS Run

Use this skill when the user invokes:

```text
/chaos-run "<change intent>" [--standard|--strict]
```

or asks to deliver a change under CHAOS without the phase march.

## What this replaces — and what it does not

`chaos:run` replaces the **mandatory** `propose → review → apply → verify` sequence with one
continuous loop (design of record:
`docs/design/2026-08-03-cost-bar-and-run-collapse.md` §4.1, building on
`docs/design/2026-08-02-stage-c-progressive-rigor.md`). It changes **when things happen**,
never **what is owed**:

- The **artifact set is unchanged**: `change.md`, `lifecycle.md`, `decision-events.md`,
  `records/*.facts.json`, OpenSpec deltas, ADRs. Records are emitted per
  `chaos-shared/reference/record-emission.md`; `change.md`/`lifecycle.md` are rendered
  (`tools/chaos-render/render.py`), never hand-written.
- The **classifier is unchanged** (`tools/chaos-classify`); only its cadence moves: checkpoints
  are **evidence classes**, not phases — K1 = intent exists, K2 = an answered decision exists,
  K3 = the diff exists *and grows* (repeatable, once per work unit), K4 = the self-review
  verdict exists. Model adjudication runs only when the verdict says `adjudicationDue: true`
  (first K1 call; a K3 scan whose `newSurfacePaths` is non-empty) — the continuous form of C-12.
- **Verification stays in the loop**, driven by the `verify` dimension. Only the *command*
  `chaos:verify` becomes the human's opt-in **extra** pass over an already-verified change.
- `chaos:propose` / `chaos:review` / `chaos:apply` / `chaos:verify` remain individually
  invocable; `init`, `status`, `todo`, `doctor`, `code-review`, `sync`, `archive`, `help`,
  `resume` are untouched.

## Required references — the digest, then (only on failure) the sources

Reading protocol (L2, design `docs/design/2026-08-03-l2-corpus-amortization.md`): the
staleness check runs **inside `loop frame`** (below) — do not invoke
`digest.py --check` separately. The frame packet's first line reports which branch you
are on:

- **FRESH** → read `.claude/skills/chaos-shared/reference/governance-digest.md` **now, once,
  in one step**. It carries everything in the fallback list below — the pinned classifier and
  adjudication contracts embedded **verbatim**, the rest compiled. Do **not** open the source
  references, and never re-read a file already in context this session.
- **STALE/MISSING** → never read a stale digest for content: fall back to the full source
  list below, record the degradation in the frame judgement, and recommend `chaos:sync` at
  close.

Fallback source list (used ONLY when the check fails):

- `.claude/skills/chaos-shared/reference/model-robustness-policy.md` and
  `interactive-decision-protocol.md` (non-negotiable execution contract)
- `.claude/skills/chaos-shared/reference/change-template.md` +
  `record-emission.md` (artifacts and records)
- `tools/chaos-classify/README.md` + `tools/chaos-classify/adjudication-prompt.md` (the pinned
  classifier and adjudication contracts — read, do not paraphrase)
- `.claude/skills/chaos-propose/reference/openspec-integration-contract.md` +
  `change-artifacts-layout.md` (OpenSpec gate mechanics at the classified depth)
- `.claude/skills/chaos-apply/reference/scope-drift-policy.md`,
  `task-delegation-contract.md`, `csharp-implementation-specialist-contract.md` (delivery
  mechanics inside the work loop)
- `.claude/skills/chaos-resume/reference/resume-capsule-contract.md` (capsule schema)

Record authoring in either path: records are emitted and their judgement fields filled by
the loop composites from **your input file** (facts derived by the tool, judgement authored
by you — the tool only moves your bytes and fails closed on anything empty).
Pattern-match `tools/chaos-render/examples/` for the filled shape — never read the schemas.

## The loop

Floors: parse the preset flag as a **floor vector** (design §8; no flag = zero floors). Floors
only raise; classification is the inference. Pass `mode` into every classifier payload.

Command surface (option 1, `docs/design/2026-08-04-wall-clock-lever-plan.md`): the two
dense clusters run through the **`chaos-loop` composites** — framing is `loop frame` →
`loop frame-commit`, the close is `loop close` → `loop close-commit`. Each composite pair
is: ONE tool call returning a consolidated packet, ONE deliberation authoring a single
input file, ONE commit call. The composites import the granular tools and change the call
surface only — every verdict, packet, TRG-* event and record is still persisted
identically (artifact parity is enforced by `tools/chaos-loop/test_chaos_loop.py`).

**Inside the work loop** the granular classifier commands remain the surface (L3 —
`chaos-scan` owns diff scoping, payload assembly, the two-call sequence, and `TRG-*`
transcription):

```bash
python tools/chaos-scan/scan.py <rescan|k2|merge> --change-dir .chaos/changes/<id> [--run <runId>]
```

Each scan — composite-wrapped or granular — prints a **verdict digest** (also persisted at
`scan/verdict-<seq>.md`) carrying the firings with verbatim cites, demoted candidates, the
stop duty, the vector, and whether adjudication is due. Read the digest, not raw JSON.
When a granular call says `adjudication: DUE`, judge the named `scan/packet-<seq>.json`
yourself **at ceiling** per the pinned contract (raise-only, cites mandatory) and apply via
`merge --raises <file>` — it fails closed on any cite-less raise. (At the frame, the raises
travel in the `frame-commit` input file instead — same contract, same fail-closed
validation.) `TRG-*` ledger events are appended by the tool (writer rule 2 as amended:
decision entries stay yours). Absent path-class map ⇒ path-class scans are blind: say so,
lean on adjudication, record the gap.

**Tiering (L1, `chaos-shared/reference/model-tier-map.md`):** your session model is the
**ceiling** — never spawn a subagent on a stronger model than your own; a demanding change
on a low ceiling proceeds at ceiling and records a `confidenceLimiter`, never upgrades.
Delegate the render repair loop and mechanical audit repairs to the
`chaos-mechanical-executor` subagent (floor); it never decides, and after two failed
validator attempts it returns `ESCALATE` and you finish the step yourself.

**Every implementation unit is banded by the tool — never by your own judgement:**

```bash
python tools/chaos-scan/scan.py tier --change-dir .chaos/changes/<id> \
    --unit-path <file> [--unit-path <file>...] \
    [--covers C-001,C-002] [--acceptance-check "<cmd that must already FAIL>"]
```

`T2` → implement it yourself. `T1` → delegate to a general-purpose subagent at
`model: 'sonnet'`. `T0` → delegate to `chaos-mechanical-executor` (floor) with the unit's
contract and stop conditions; **T0 is now reachable only by route A** (an acceptance check that
already fails), since **route B was closed 2026-08-04** after a floor-tier unit shipped a
contract violation and certified it green off its own self-written tests — see the tier map.

**A delegated unit's report is a claim, not evidence.** Verify it yourself at ceiling before
accepting it: read the diff, not just the exit codes. In the run that closed route B the
executor reported `COMPLETE`, 1 attempt, "all 41 passing" — and had violated one of the pinned
statements that authorized the delegation. Green tests written by the same agent that wrote the
code prove only self-consistency.

**After any T0/T1 unit verify**: full suite green, build clean,
diff inside the declared files, and the next rescan attributes no new firing. On failure run
`scan.py tier --escalate T0|T1` (climbs one rung, spends one of the budget of 2) and redo the
unit at the returned tier. Classifier, adjudication, stops, ledger answers, judgement prose,
OpenSpec and verify are **never** below ceiling. Apply the overhead guard (inline beats a
delegation that costs more than the step) and report every escalation.

### 0 · Open

`chaos_begin_command` (`chaos:run`, the change intent as context). Derive the change id;
initialize `.chaos/changes/<change-id>/` per `change-artifacts-layout.md`. Capture the intent
**verbatim** in the frame facts.

### 1 · Frame: one packet, one deliberation, one commit, then S1

```bash
python tools/chaos-loop/loop.py frame --change-dir .chaos/changes/<id> --run <runId> \
  --intent "<verbatim>" --scope "<predicted scope, incl. planned NEW paths or M5 false-fires later>" \
  --subject src --subject tests [--declared ...] [--mode <preset>] [--posture <doc>]...
```

This runs the digest staleness check and the K1 scan, captures `scan-inputs.json`
(subjects = the C-15 diff roots; scope changes later only via
`scan.py update-scope --decision <RUN-DEC-*>`), and returns **one frame packet**: digest
freshness, the K1 verdict digest, the adjudication packet path when due (the first K1 call
always is), and the artifacts the vector owes before S1.

**Then deliberate ONCE** and author a single JSON input file carrying everything the frame
owes (the packet prints the exact shape): your adjudication **raises** (judged at ceiling,
raise-only, cites mandatory; `[]` records that you judged and raised nothing), the
**contract statements** (judgement — yours end-to-end), and the **frame record judgement**
(verdict, assessment, rationale, sourceManifest/risk/traceability facts).

**OpenSpec authoring timing (creator rule, 2026-08-03):** artifacts owed by a classification
are authored **when the obligation fires, always before the surface they govern is
implemented further**. So: `openspec 1` → author the delta spec NOW, before S1; `openspec 2` →
run the full hard invocation gate NOW; `openspec 0` → skip, the contract lives in `change.md`
§Contract (record the skip in the frame facts). The human approves intent + classification +
the contract artifact **together, in one stop**.

```bash
python tools/chaos-loop/loop.py frame-commit --change-dir <dir> --run <runId> \
  --input <file> --title "<change title>"
```

merges the raises (fails closed on any cite-less raise), writes `records/contract.json`,
emits the frame record and fills your judgement into it (fails closed on anything empty; it
can never touch a derived fact), renders `--write`, and prints the **S1 presentation**.

**Zero-trigger short-circuit (tool-decided; creator-approved S1 authoring amendment,
2026-08-04).** When the post-merge frame is strictly zero-trigger — nothing fired, every
dimension at its floor, no preset, path-class map present — `frame-commit` **defers the
artifact writes to close** and presents the contract **inline** in the S1 text instead. You
never request this and cannot: the tool decides from the verdict (a fired verdict can never
short-circuit; `--no-short-circuit` is the only knob, and it opts *out*). Your input file
is validated fail-closed exactly as on the normal path — deferral moves the writes, never
the validation, and **S1 still stops unconditionally** with its decision, ledger entry and
capsule owed as always. The deferred content lives in `<change-dir>/short-circuit.json`;
the obligation audit will not let a still-deferred run close.

**S1 — the frame approval stop (always; the run's one unconditional stop, C-11).** Surface
exactly one runtime decision with `approves-change: true`, folding every K1-fired question
into its presentation with `folds: <n>` declared on the ledger entry. The decision, the
`RUN-DEC-*` ledger entry, and the **resume capsule at stop creation** (rule below) stay
yours — no tool authors them. Then STOP (`mustStop`). Never proceed on a recommendation the
human has not answered.

### 2 · Work loop (per task-sized unit)

Repeat until the contract is delivered:

1. **Implement one unit** (preflight, boundary construction, delegation and scope discipline
   per the apply references; specialists implement, they never decide scope).
2. **Rescan (K3).** `python tools/chaos-scan/scan.py rescan --change-dir <dir>` — the tool
   does `git add -N` + the C-15-scoped diff itself (the diff describes the governed subject
   only, never the change's own bookkeeping) and persists it under `scan/`. Digest says
   `adjudication: DUE` (new surface paths) → judge the packet, merge raises. Late-fired
   artifact obligations (openspec delta/full, ADR) are authored **at the firing**, before
   that surface is implemented further — never at close. **On a short-circuited run this
   includes the deferred frame artifacts**: any firing means the zero-trigger premise is
   gone, so run `python tools/chaos-loop/loop.py materialize --change-dir <dir> --run
   <runId>` at the firing, then author what the firing itself owes. `loop close` refuses a
   fired-while-still-deferred run.
3. **Stops.**
   - `newStops > 0` → **S2**: surface **one** runtime decision carrying every question folded
     at this scan (`folds: <n>` on the entry), write the resume capsule, STOP (`mustStop`).
   - `stopAbsorbedBy` → **absorption duty**: a stop is already pending unanswered. Do NOT
     create a second decision. Amend the pending ledger entry — append the new folded
     question(s), increment its `folds:` count — so the eventual answer covers everything
     attached, and M4 keeps counting questions honestly. The runtime decision already exists;
     when its answer arrives, apply it against **all** questions listed on the entry.
   - `stopSatisfiedBy` → no stop; cite the covering ANSWERED decision in the delivery facts.
   - **S3 — discordance (agent-judged):** whenever you hit ambiguity, a contradiction with the
     docs, or a material choice the repo does not answer, surface a runtime decision
     (`folds: <n>`), write the capsule, STOP. This is the product's core loop: intent → agent
     drives → finds a decision → records it → the human answers → continue. Do not ask
     questions the repository already answers.
4. **After any answered decision:** `scan.py k2 --change-dir <dir>` (scan-only; M4 counts
   questions via `folds:`). New obligations from an M4 firing apply before further
   implementation.

### 3 · Close: self-review verdict, one packet, one deliberation, one commit

Inline self-review of the delivered work (scope sane / rules mapped / contract testable /
decisions complete) — form the constrained verdict `clean|fail`, then:

```bash
python tools/chaos-loop/loop.py close --change-dir .chaos/changes/<id> --run <runId> \
  --self-review clean|fail --build-log <file> --test-log <file> \
  [--rule R-...]... [--openspec-dir openspec/changes/<id>] [--adr-dir <dir>]
```

This runs, in order, **failing closed at each step**:

- **The final rescan (K3).** If it fires anything, demands or absorbs a stop, or finds new
  surface, close **aborts** — that is new evidence: re-enter the work loop (§2) and run
  `loop close` again when it is delivered.
- **Short-circuit resolution.** A run still carrying deferred frame artifacts either
  **materializes them here automatically** (zero-trigger held end to end — the deferred
  writes reappear inside the close) or, if anything fired while deferred, close **aborts**:
  they were owed at the firing — materialize now and record the timing deviation with a
  `RUN-DEC-*` ref in the deliver judgement.
- **K4** with your verdict. `fail` ⇒ X2 fires, raising `review → 2` and `verify → 1`
  mechanically (C-3), and close aborts: route to the independent review pass — never a stop.
- **The verify record, when the vector's `verify` ≥ 1** — emitted with the independent
  re-run (L4-D4: the tool re-executes build/tests/openspec itself). `verify 1` =
  trigger-attributed safeguard checks (the firing's surface says which: auth →
  credential/enforcement; data-store → persistence/migration; contract-dependency →
  contract checks); `verify 2` = full verify orchestration. A failing re-run **re-enters
  the work loop** with the failure as new evidence — never close-commit over a red check.
  At `verify 0` nothing runs — and that is the correct, measured outcome.
- **The deliver record** — build/tests/files/scopeDrift derived from your logs, coverage
  rows scaffolded one per contract statement.
- **The advisory obligation audit** — any failure is named in the packet so you repair it
  BEFORE the commit call (author the owed artifact, surface the unanswered stop);
  mechanical repair classes are delegable per the tier map, a failure naming a stop is
  governance and stays yours.

**Then deliberate ONCE** and author a single JSON input file (the packet prints the exact
shape): deliver judgement (verdict, assessment, rationale), every coverage row
(`covered`/`evidence`/`whyNotTest` — non-test evidence always carries `whyNotTest`),
scaffolded rules, deviations with `RUN-DEC-*` refs, scope-drift judgement when M5 fired,
and the verify judgement (`archiveReadiness`, `traceability`, `findings`) when that record
exists.

```bash
python tools/chaos-loop/loop.py close-commit --change-dir <dir> --run <runId> --input <file> \
  [--openspec-dir openspec/changes/<id>] [--adr-dir <dir>]
```

fills your judgement into the records (fails closed on empty fields, missing coverage rows,
or any attempt to overwrite a derived fact), then asserts the **obligation audit as the
hard gate**: every stop answered, every placed stop surfaced, owed ADR/OpenSpec/verify
artifacts exist, frame + deliver records present, vector ≥ floors. The audit recomputes the
owed vector from state, never authors anything, and the run cannot close while it fails —
deterministic and ~free, a checklist, not a model pass. On pass it renders `--write`
(`change.md` §Delivery, `lifecycle.md`, frontmatter — all mechanical) and prints the close
summary. **S4 — verify sign-off:** only when the stops floor ≥ 2 (`--strict` preset; the
summary flags it), surface the sign-off decision before terminalizing.
`chaos_complete_command`. Recommend `chaos:verify` only as the optional extra pass;
recommend `chaos:archive` when ready.

## Stop points (the complete set)

| Stop | When | Fires |
|---|---|---|
| **S1** frame approval | after classify-at-intent | **always** — the C-11 floor; the one unconditional stop |
| **S2** materiality | a work-loop scan with `newStops > 0` | conditional; folds per scan; absorbed while another stop is pending |
| **S3** discordance | agent hits ambiguity/contradiction | agent-judged; carries `folds: <n>` |
| **S4** verify sign-off | at close | only under preset floor ≥ 2 |

## Capsule at stop creation (mandatory)

**Every stop writes its resume capsule when the stop is created — never on demand.**
Auto-continuation is a harness convenience, not a guarantee; the session that created a stop
may be gone when the answer arrives. Use the standard schema
(`chaos-resume/reference/resume-capsule-contract.md`) with the **loop cursor**:
`nextStep` = the loop step to re-enter (`work-unit <n>` / `self-review` / `verify` / `close`);
`contextCapsule` carries the change intent, approved scope, the pending decision id(s), and
the classifier's `scanSeq` (the state file's `scanCount`). `chaos:resume` trusts the capsule
for **position only** — obligations are re-derived deterministically from
`classification-state.json` on disk, and the audit gate re-asserts them at close regardless
of what any capsule says.

## Golden rules

- The dimension vector — never mode words — sets the rigor; floors only raise; the system
  never lowers a fired dimension (human override only, recorded).
- C-15 always: the K3 diff excludes `.chaos/**`, `openspec/**`, and any ADR the change
  authored. Blast radius is a property of the subject, never of the paperwork.
- Adjudication is raise-only, cites mandatory, and runs only when `adjudicationDue` says so.
- One decision at a time; STOP after presenting it. A recommendation is not a decision.
- Artifacts owed are authored at the firing, never at close; the audit asserts, never authors.
- OpenSpec owns proposal/design/spec/tasks at depth ≥ 1; `openspec status` completeness at
  depth 0/1 reads `isComplete: false` and that is the expected answer, not degraded mode.
- Never emit `proposal-report.md`, `proposal-review.md`, `apply-report.md`, or
  `verification.md`; never hand-write or hand-edit rendered files.
- Every material answer is a `RUN-DEC-*` ledger entry (change-template §2), yours to write;
  `TRG-*` events are appended by `chaos-scan` (L3-D6); deviations carry their decision refs.

## Final response

Summarize: change id · the classification verdict (fired triggers + the 7-dimension vector) ·
stops surfaced (and what folded/absorbed where) · OpenSpec/ADR artifacts authored and at what
depth · verify outcome (or `verify 0`, honestly) · the audit result · confidence · next
command. Optional `## Todo Candidates` per the shared contract.
