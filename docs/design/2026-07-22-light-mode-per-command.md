# True `--light` mode — per-command design

> Companion to [`2026-07-22-light-mode-workflow.md`](2026-07-22-light-mode-workflow.md) (the workflow
> design). Toolkit meta-work, developed without CHAOS governance. This pass specifies what each
> command/skill does inside the light path, the ownership chain, and exactly which skill files change.

> **Amendment (2026-07-22, creator-approved):** `change.md` is promoted to the **universal core
> narrative for all modes** — modes scale section *depth*, not file *count*; `lifecycle.md` is
> **kept** and reframed as a pure state manifest (phase table + pointers, no narrative). See the
> workflow doc §4 amendment for the full model (four artifacts: story / state / decisions / spec),
> the overflow rule, and migration staging. Consequence here: the `artifactType: light-change`
> special-casing below is **transitional only** — end-state, every command reads `change.md` for
> every mode, with legacy-report fallback for old changes.

## 0. Ownership chain (creator-corrected 2026-07-24)

**`chaos:propose --light` (FRAME owner — never writes production code) → mustStop → human answers
(Decision Center) → `chaos:apply` (DELIVER owner, own command identity, mode inferred from
`change.md`) → done.** See the [artifact-model roadmap](2026-07-24-artifact-model-roadmap.md)
decisions register.

- **Entry points:** no new top-level command. `chaos:propose --light` opens the lifecycle; **vanilla
  `chaos:apply` is the DELIVER entry** — it infers the mode from `change.md` frontmatter (explicit
  `--light` optional). This keeps command names honest: propose proposes, apply implements.
- **`chaos-verify` is out of the light critical path** — DELIVER's dashboard covers it; standalone
  post-hoc verify remains available.
- **Two linked runs, one changeId — today's session model unchanged:** the propose run pauses at the
  stop; once its decisions are answered and consumed it is **administratively terminalized** (at
  apply preflight, or via normal `chaos:resume`). Apply begins its own run, re-acquires the
  change-scoped lock, and executes DELIVER. `chaos:resume` keeps its normal mid-flight job only —
  it is **not** a deliver-router.

| Phase | Owner | Invoked as | Emits |
|---|---|---|---|
| FRAME | `chaos-propose` | `chaos:propose --light "<intent>"` | OpenSpec full set · `change.md` (intent+contract+review line) · lean decision entries · lifecycle stub (open) · capsule `nextStep: deliver` |
| — stop — | runtime / Decision Center | human answers; answering **is** approval (`approves-change: true`) | decision `status:` line updated |
| DELIVER | `chaos-apply` | `chaos:apply` (mode inferred; `--light` optional) | code+tests · `change.md` §Delivery dashboard · lifecycle stub (closed) · propose run closed, apply run completed, lock released |

## 1. `chaos-propose` — FRAME owner

### Light behavior (replaces the current "same path, looser checks")

1. **Preflight once** (runtime, config, session context) — the only preflight of the lifecycle.
2. **Scoped evidence scan:** read the files/modules the intent names + the rules index + the
   architecture posture section. Explicitly forbidden on light: repo-wide discovery sweeps
   (`find`/`grep` walks), reading assessments/archaeology/history unless the change touches them.
   (Attacks the measured 14.3% shell/discovery cost.)
3. **OpenSpec artifacts:** full set via the normal integration contract — unchanged in every mode.
4. **`change.md`:** intent (≤3 lines) + contract (testable statements) + review verdict line, per the
   shared template (§8). One frontmatter stamp, `artifactType: light-change`.
5. **Surface material decisions** to the runtime — same materiality bar as standard, lean entry format
   (§8). Exactly one decision carries `approves-change: true` (the approving gate). Zero-decision
   changes surface the explicit "Approve contract as framed?" gate — light's floor is one human stop.
6. **Inline self-review** (checklist: scope sane / rules mapped / contract testable / decisions
   complete) → verdict line in `change.md`. **No `proposal-report.md`, no `proposal-review.md`, no
   separate review invocation.** Checklist failure ⇒ escalate (§7), don't iterate prose.
7. **Create the resume capsule:** `nextStep: deliver`, executor contract `chaos-apply/light-deliver`,
   contract hash, scope (files/modules) list, in-scope rule ids. Then **mustStop**.

### Skill-file changes

| File | Change |
|---|---|
| `chaos-propose/SKILL.md` | light branch: the FRAME step list above |
| `reference/mode-reference.md` | light column rewritten: collapsed path, not relaxed validation |
| `reference/output-contract.md` | light output set = OpenSpec + `change.md` + lean decisions + stub + capsule |
| `reference/change-artifacts-layout.md` | add the light layout variant |
| (new, shared) `chaos-shared/reference/change-template.md` | the universal `change.md` + lean-decision-entry + lifecycle-manifest formats (§8) |

## 2. `chaos-resume` — normal job only (revised 2026-07-24: NOT a deliver-router)

Resume's mechanics are untouched, and — per the creator's correction — it gets **no** deliver-routing
row. Its only light-path involvement: resuming a light **propose** run whose decisions were answered
completes FRAME as an **administrative terminalization** (consume decisions, mark ready-for-apply,
close the run, release the lock) and points at `chaos:apply` as the next command. It never writes
production files on a light run. (Apply's preflight can perform the same administrative close if the
user goes straight to `chaos:apply` — see §3 — so resume is optional in the happy path.)

## 3. `chaos-apply` — DELIVER owner (the write entry, own command identity)

**Entry (revised 2026-07-24):** vanilla `chaos:apply --change <id>` (or bare `chaos:apply` with
change inference) — the mode is **inferred from `change.md` frontmatter** (`mode: light`); explicit
`--light` is optional and merely asserts the expectation. Preflight: verify the FRAME capsule +
contract hash; verify all decisions are **answered** (any OPEN ⇒ point at the Decision Center and
stop — no bypass); administratively close the answered propose run if still open; begin the apply
run; re-acquire the change lock.

### New `light-deliver` section in `reference/apply-contract.md`

**Inputs:** `change.md` contract (verified against capsule hash) + answered decisions + capsule scope.

1. **Implement to the approved contract, honoring the human's answers verbatim.** C# specialist
   delegation stays available exactly as today (the delegation contract is mode-independent).
2. **Scope control:** work stays inside the capsule's scope list. Spill ⇒ escalation valve (§7),
   never silent widening. Contract-unmeetable (a test proves the contract wrong, an answer is
   unimplementable) ⇒ surface a new decision + stop — never ship red (R-003), never silently narrow.
3. **Validate:** build + full tests + **contract coverage** — each contract statement covered by a
   test or directly checked; tick the checkboxes in `change.md` §Contract.
4. **Report = dashboard, not prose:** append `change.md` §Delivery (build/tests/contract/rules table,
   files list, deviations line). **No `apply-report.md`, no `verification.md`.**
5. **Terminalize:** lifecycle stub → `Delivered` (second and last edit), complete the run, release the
   lock. Archive is a terminal state, not a command run.

(The entry is idempotent by construction — re-invoking `chaos:apply` on an already-delivered light
change reports the dashboard and exits; on a framed-but-unanswered change it points at the Decision
Center and stops.)

### Skill-file changes

`chaos-apply/SKILL.md` (light branch) · `reference/apply-contract.md` (light-deliver section) ·
`reference/mode-reference.md` · `reference/output-contract.md` + `generated-artifacts-contract.md`
(light: dashboard-in-`change.md` instead of reports) · `reference/report-template.md` (light variant =
the dashboard block).

## 4. `chaos-verify` — out of the critical path, light-aware standalone

- Light needs **no** verify invocation: DELIVER's dashboard is the verification record.
- Standalone `chaos:verify --change <id>`: read `change.md` (§Contract+§Delivery) +
  `decision-events.md` + `lifecycle.md` (state manifest); **never** demand
  `apply-report.md`/`verification.md` on a `change.md`-based change; append a compact
  `## Post-hoc verification` table to `change.md` (it does not create the legacy report set).
- File change: verify's artifact-expectations section reads `change.md` first, with legacy-report
  fallback for old changes (per the universal-`change.md` amendment — no per-mode branching).

## 5. `chaos-archive`, `chaos-sync`, `chaos-todo` — light-awareness only

| Command | Light-awareness change |
|---|---|
| **archive** | `status: Delivered/Rejected` in `change.md` is terminal; the lifecycle stub satisfies the existence contract; no per-change archive run on light (repo housekeeping may still index it). |
| **sync** | keys on `decision-events.md` (anatomy unchanged) + `change.md` status/verdict fields (same field names as the standard reports); syncing a light change updates indexes only — it must **not** regenerate the dropped narrative reports. |
| **todo** | scanner adds two light sources: `change.md` §Delivery `deviations:` lines and `⚠ escalated` lines → todo candidates. |

## 6. Sessions, runtime, and the metadata hook

- **Runtime protocol untouched:** begin → decisions → mustStop → resume → complete; change lock held
  across the stop (EA-X4-hardened reconcile/capsule-hash/write-lock all apply).
- **Metadata hook:** add `.chaos/changes/*/change.md` to the managed **include** set (keep the set
  narrow — the a3229c6 lesson: explicit include + exclude, no broad globs). Light also mechanically
  cuts hook churn: 2 stamps of a stub instead of 16 lifecycle re-stamps.

## 7. Escalation valve — per-command ownership

| Trigger | Fires in | Owner behavior |
|---|---|---|
| posture/non-goal crossing (auth, persistence, …) | FRAME (usually) or DELIVER | switch to standard flow **without asking**; announce; reuse all outputs (OpenSpec + contract + decisions seed the standard proposal) |
| > `lightMode.maxMaterialDecisions` (default 2) | FRAME | same |
| self-review checklist fails | FRAME | same |
| OpenSpec unavailable | FRAME | standard degraded-mode handling (light never skips the spec silently) |
| scope spill beyond capsule scope | DELIVER | escalate **or** surface a scope decision + stop (owner's judgment; never silent) |
| contract unmeetable / tests can't go green within contract | DELIVER | surface decision + stop (fix-forward / narrow / abandon) |
| human's answer widens the change beyond the framed contract | apply (preflight) | run standard apply instead of light-deliver; record |

Recording, in every case (creator-confirmed): `⚠ escalated: light → standard — <reason>` on the
`change.md` dashboard + `escalatedFrom: light` in its metadata + an `ESC-…` structured entry in
`decision-events.md`. Downgrade is never automatic.

## 8. Shared templates (new reference file)

`chaos-shared/reference/change-template.md` (renamed from light-specific — it is now the
**universal** skeleton) holds three formats:

1. the `change.md` skeleton with **per-mode depth guidance** — light: tables/checklists/single lines
   only (hard rule: no paragraphs); standard: short prose allowed per section; strict: fuller
   analysis + extra sections (risk, traceability matrix) + the **overflow rule** (section > ~80
   lines → `appendix/<section>.md`, summary + link stays);
2. the lean append-only decision-entry format (fields: status/options/recommendation/answer/
   why-material + `approves-change` marker; entries appended, only `status:` lines edited);
3. the `lifecycle.md` **state view** format (revised 2026-07-24): authoritative state lives in
   `change.md` **frontmatter** (YAML phase block); `lifecycle.md` is a **generated view** of it —
   pure phase table (phase · status · date · pointer) + header pointers (commandRunId, OpenSpec
   path, `change.md` anchors). Rendered by the Stage-B renderer; until then a hand-written 10-line
   stub edited only at phase transitions. Hard rule: no narrative, never a second source of truth.

Propose, apply, resume, verify all reference this one file instead of carrying their own copies.

## 9. Config additions (`.chaos/config.yaml`)

```yaml
modes:
  light:
    collapsedWorkflow: true          # FRAME → DELIVER
    maxMaterialDecisions: 2          # escalation trigger (tune after measurement)
    autoEscalate: true               # never ask; always record + warn
    allowStandaloneApplyEntry: true  # chaos:apply --light --change <id> idempotent entry
```

`defaultMode` stays `standard`; `inferModeWhenMissing` untouched (the blast-radius classifier may
later *suggest* light — deferred).

## 10. Implementation order

1. `chaos-shared/reference/change-template.md` (universal skeleton + decision-entry + lifecycle-manifest formats) — everything else references it.
2. `chaos-propose` light branch (FRAME) + capsule `nextStep: deliver`.
3. `chaos-resume` routing row + safety-policy line.
4. `chaos-apply` light-deliver contract + standalone idempotent entry.
5. Light-awareness one-liners: verify / archive / sync / todo + metadata-hook include.
6. Config block.
7. **Measure** against the frozen EA-X2 harness baseline (workflow doc §10 targets: ≤2× time,
   artifact-prose ≤15% of output, oracle 19/19, zero decision loss) — new dated `RUNKIT.md` row.
