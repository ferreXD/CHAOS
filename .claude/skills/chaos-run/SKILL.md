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

Reading protocol (L2, design `docs/design/2026-08-03-l2-corpus-amortization.md`): run

```bash
python tools/chaos-digest/digest.py --check
```

**before reading any change-specific file**.

- **Exit 0** → read `.claude/skills/chaos-shared/reference/governance-digest.md` **now, once,
  in one step**. It carries everything in the fallback list below — the pinned classifier and
  adjudication contracts embedded **verbatim**, the rest compiled. Do **not** open the source
  references, and never re-read a file already in context this session.
- **Any other exit** → the digest is stale or missing. Never read a stale digest for content:
  fall back to the full source list below, record the degradation in the frame facts, and
  recommend `chaos:sync` at close.

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

Record authoring in either path: copy the matching example from
`tools/chaos-render/examples/`, adapt, validate with `render.py --check` — never read the
schemas.

## The loop

Floors: parse the preset flag as a **floor vector** (design §8; no flag = zero floors). Floors
only raise; classification is the inference. Pass `mode` into every classifier payload.

Classifier invocation, all steps:
`python tools/chaos-classify/classify.py --inline <payload.json> --state .chaos/changes/<change-id>/classification-state.json`
with `mapFile` = `.chaos/path-class-map.json` and `postureFiles` = the repo's
architecture/posture docs (absent map ⇒ path-class scans are blind: say so, lean on
adjudication, and record the gap). When the verdict says `adjudicationDue: true`, perform the
adjudication pass yourself per the pinned contract (raise-only, cites mandatory) and merge via
`--adjudication`; otherwise do not run it. Record one `TRG-*` ledger event per fired trigger.

**Tiering (L1, `chaos-shared/reference/model-tier-map.md`):** your session model is the
**ceiling** — never spawn a subagent on a stronger model than your own; a demanding change
on a low ceiling proceeds at ceiling and records a `confidenceLimiter`, never upgrades.
Delegate exactly three mechanical steps to the `chaos-mechanical-executor` subagent (floor
tier) — `TRG-*` event transcription, the render repair loop, and mechanical audit repairs.
It never decides; after two failed validator attempts it returns `ESCALATE` and you finish
the step yourself. Implementation runs at ceiling by default; while the **easy gate** is
open (zero triggers fired, no preset floor) you MAY delegate implementation units at mid
tier — the gate closes for the rest of the run on any firing, an X2, or two failed test
cycles, and a mid-tier unit that hits a failure signal is redone at ceiling. Classifier,
adjudication, stops, and ledger answers are **never** below ceiling. Apply the overhead
guard (inline beats a delegation that costs more than the step) and note every escalation
in the final response.

### 0 · Open

`chaos_begin_command` (`chaos:run`, the change intent as context). Derive the change id;
initialize `.chaos/changes/<change-id>/` per `change-artifacts-layout.md`. Capture the intent
**verbatim** in the frame facts.

### 1 · Classify at intent (K1), author what it owes, then S1

Build the K1 payload — intent, predicted scope (including planned NEW paths, or M5
false-fires later), `declaredTriggers`, the preset — scan, adjudicate if due, merge.

**OpenSpec authoring timing (creator rule, 2026-08-03):** artifacts owed by a classification
are authored **when the obligation fires, always before the surface they govern is
implemented further**. So: `openspec 1` → author the delta spec NOW, before S1; `openspec 2` →
run the full hard invocation gate NOW; `openspec 0` → skip, the contract lives in `change.md`
§Contract (record the skip in the frame facts). The human approves intent + classification +
the contract artifact **together, in one stop**.

**S1 — the frame approval stop (always; the run's one unconditional stop, C-11).** Emit
`records/contract.json` + `records/frame.pass-01.facts.json`, render `--write`, then surface
exactly one runtime decision with `approves-change: true`, folding every K1-fired question
into its presentation with `folds: <n>` declared on the ledger entry. **Write the resume
capsule at stop creation** (rule below), then STOP (`mustStop`). Never proceed on a
recommendation the human has not answered.

### 2 · Work loop (per task-sized unit)

Repeat until the contract is delivered:

1. **Implement one unit** (preflight, boundary construction, delegation and scope discipline
   per the apply references; specialists implement, they never decide scope).
2. **Rescan (K3).** Regenerate numstat/patch **scoped per C-15** — the diff describes the
   governed subject only, never the change's own bookkeeping:

   ```bash
   git add -N src tests                      # subject paths; new files must be visible
   git diff --numstat -- src tests > .tmp/k3.numstat
   git diff          -- src tests > .tmp/k3.patch
   ```

   Run K3 with the grown diff. `adjudicationDue: true` (new surface paths) → adjudication over
   the full inputs, merge raises. Late-fired artifact obligations (openspec delta/full, ADR)
   are authored **at the firing**, before that surface is implemented further — never at close.
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
4. **After any answered decision:** run a K2 scan (scan-only; M4 counts questions via
   `folds:`). New obligations from an M4 firing apply before further implementation.

### 3 · Self-review (mechanical, never stops)

Inline self-review of the delivered work (scope sane / rules mapped / contract testable /
decisions complete). Run K4 with `selfReview:` = the verdict. An X2 firing raises
`review → 2` and `verify → 1` mechanically (C-3): route to an independent review pass — never
a stop.

### 4 · In-loop verify (vector-driven)

If the vector's `verify` ≥ 1: run it NOW, inside the run — `verify 1` = trigger-attributed
safeguard checks (the firing's surface says which: auth → credential/enforcement checks;
data-store → persistence/migration checks; contract-dependency → contract checks);
`verify 2` = full verify orchestration. Emit `records/verify.pass-NN.facts.json`. A failing
verify **re-enters the work loop** with the failure as new evidence (the next K3 scan sees the
repair diff). At `verify 0` nothing runs — and that is the correct, measured outcome.

### 5 · Obligation audit (a gate, not a stop)

Emit `records/deliver.pass-NN.facts.json` (coverage per contract statement, files, deviations
with `RUN-DEC-*` refs, scope drift), then assert:

```bash
python tools/chaos-classify/audit.py --state .chaos/changes/<id>/classification-state.json \
  --ledger .chaos/changes/<id>/decision-events.md --change-dir .chaos/changes/<id> \
  [--openspec-dir openspec/changes/<id>] [--adr-dir <dir>]
python tools/chaos-render/render.py <id> --check
```

The audit recomputes the owed vector from state and asserts: every stop answered, every
placed stop surfaced, owed ADR exists, owed OpenSpec depth exists, owed verify record exists,
frame + deliver records present, vector ≥ floors. **A failure names the owed artifact: repair
it (author the artifact, surface the unanswered stop) and re-assert** — mechanical repair
classes are delegable per the tier map; a failure naming a stop is governance and stays
yours. The audit never
authors anything, and the run cannot close while it fails. It is deterministic and ~free — a
checklist, not a model pass.

### 6 · Close

Render `--write` (`change.md` §Delivery, `lifecycle.md`, frontmatter — all mechanical).
**S4 — verify sign-off:** only when the stops floor ≥ 2 (`--strict` preset), surface the
sign-off decision before terminalizing. `chaos_complete_command`. Recommend `chaos:verify`
only as the optional extra pass; recommend `chaos:archive` when ready.

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
- Every material answer is a `RUN-DEC-*` ledger entry (change-template §2); `TRG-*` events for
  firings; deviations carry their decision refs.

## Final response

Summarize: change id · the classification verdict (fired triggers + the 7-dimension vector) ·
stops surfaced (and what folded/absorbed where) · OpenSpec/ADR artifacts authored and at what
depth · verify outcome (or `verify 0`, honestly) · the audit result · confidence · next
command. Optional `## Todo Candidates` per the shared contract.
