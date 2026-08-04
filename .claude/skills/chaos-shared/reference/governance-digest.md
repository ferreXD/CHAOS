---
digest: governance-digest
generated-by: chaos:sync
sections:
  - id: model-robustness
    mode: compiled
    source: .claude/skills/chaos-shared/reference/model-robustness-policy.md
    sha256: f64357227559f9b869bb4b111eac50200de3d6fc9fa933c75e328b1ac37895cf
  - id: model-tier-map
    mode: verbatim
    source: .claude/skills/chaos-shared/reference/model-tier-map.md
    sha256: ce0cd1db8776a767c562d9afd58bd30e9d9f20756e941424b202f59bdfd45d34
  - id: decision-protocol
    mode: compiled
    source: .claude/skills/chaos-shared/reference/interactive-decision-protocol.md
    sha256: 7087008b4f4b97f0ef5f0557dbb6d5c9ea77a5352354496c467d1507d59bd001
  - id: decision-entry-format
    mode: verbatim
    source: .claude/skills/chaos-shared/reference/change-template.md
    span: "## 2. Decision entry format (`decision-events.md`, append-only)"
    sha256: 657451d88f21e27800f9bf10151f6a5c76a0a102a7169d04f7bbb6b045336aa2
  - id: classifier-wiring
    mode: verbatim
    source: tools/chaos-classify/README.md
    span: "## Wiring adapter (step 4 — commands call this)"
    sha256: eac32a61adf17507bf628995611d780738bd3fda022e2ccca9ffc55fe2fbf439
  - id: classifier-continuous-mode
    mode: verbatim
    source: tools/chaos-classify/README.md
    span: "## Continuous mode (Stage D — `chaos:run`)"
    sha256: eac32a61adf17507bf628995611d780738bd3fda022e2ccca9ffc55fe2fbf439
  - id: adjudication-contract
    mode: verbatim
    source: tools/chaos-classify/adjudication-prompt.md
    sha256: 9c0a707faefad11850894fb27fb146c352130e7951c4c6493a770f63eda37a19
  - id: record-emission
    mode: compiled
    source: .claude/skills/chaos-shared/reference/record-emission.md
    sha256: efcb34bbcfb0866e7b8c2f2264a2f565e1ee8d48f7e55651a91d1c8dce60c8cd
  - id: change-folder-layout
    mode: compiled
    source: .claude/skills/chaos-propose/reference/change-artifacts-layout.md
    sha256: 7cc8e4b714484a5345167a5b14591975409f432e46c6b715f1463dd18c378b51
  - id: openspec-gate
    mode: compiled
    source: .claude/skills/chaos-propose/reference/openspec-integration-contract.md
    sha256: 901595c4cd90ddbd974f1e81696a418698c2c06b24ef9bc25abd3e7ca182f7d7
  - id: scope-drift
    mode: compiled
    source: .claude/skills/chaos-apply/reference/scope-drift-policy.md
    sha256: 76561bc334157b97872ac61cd60d3bb95679bf2f0e4566acc97751c033646ed6
  - id: delegation
    mode: compiled
    source: .claude/skills/chaos-apply/reference/task-delegation-contract.md
    sha256: 8a359072ca905fa20611a64db10cceea1fd42eb44ea4ecb194e380b2a069c87a
  - id: csharp-specialist
    mode: compiled
    source: .claude/skills/chaos-apply/reference/csharp-implementation-specialist-contract.md
    sha256: 282dd9a0a4e9f0d490094527425e2653deb5e5408fa5996796ba472cf1541b9f
  - id: resume-capsule-contract
    mode: verbatim
    source: .claude/skills/chaos-resume/reference/resume-capsule-contract.md
    sha256: 2415dbf09337ceb6b468fd55ebfebe457c328048496cef0e1e5d457901c032de
---

# Governance digest

> **PROJECTION — never a source of truth.** Compiled from the sources in the manifest above
> (design: `docs/design/2026-08-03-l2-corpus-amortization.md`). Verify before reading:
> `python tools/chaos-digest/digest.py --check` — exit 0 means read THIS file and none of the
> sources; any other exit means fall back to the full source list in the consuming skill and
> recommend `chaos:sync`. Never edit this file by hand; on any conflict the source wins and
> the conflict is a digest defect. `verbatim` sections are byte-copies of their source span;
> `compiled` sections are curated compressions maintained by `chaos:sync`.

<!-- digest:begin model-robustness -->
## Model robustness (compiled)

- CHAOS must work with the **weakest supported model** — pinned: **Haiku 4.5**, also the L1
  mechanical tier (see the tier map below): no behaviour may depend on the model inferring
  governance intent. Critical behaviour is explicit, gated, checklist-shaped.
- **A recommendation is not a decision. A displayed plan is not approval.** Approval is an
  explicit user selection. Stop immediately after asking a material question; never continue
  until the user chooses. Native selection UI first; numbered chat options as fallback.
- **No silent inferred decisions.** Material inferences are surfaced via the decision
  protocol. Label assumptions: knowledge `FACT|INFERENCE|ASSUMPTION|UNKNOWN|CONFLICT`,
  confidence `HIGH|MEDIUM|LOW`.
- **Mode inference:** show the inferred mode + reasons; ask only when it materially changes
  risk or strict would block; downgrade only with recorded rationale; never silently
  downgrade strict or silently upgrade-then-block.
- **Config:** read `.chaos/config.yaml` (if present) before discovering sources or planning
  writes; configured paths beat defaults; never edit config outside `chaos:init`/`chaos:sync`
  /confirmed `chaos:status` remediation. Missing config — light: infer defaults + warn ·
  standard: also recommend `chaos:status`/`chaos:init` repair · strict: ask
  continue-or-stop when it affects safety, then stop after asking.
<!-- digest:end model-robustness -->

<!-- digest:begin model-tier-map -->
# Model tier map (L1)

Design of record: `docs/design/2026-08-03-l1-model-tiering.md` (L1-D1..D11; §7 ceiling
amendment). Changing a tier assignment is a **registered design change** (cost-bar doc §5e),
never silent drift.

**The ladder (L1-D3):** *deterministic tool > cheaper model > stronger model.* Work moves as
far down as it can; model tiers exist only for what no tool covers.

## Tiers are relative — the ceiling rule (L1-D9/D10)

**The session model IS the orchestrator and the tier ceiling.** The user's model choice is a
cost-consent boundary: **never spawn a subagent on a stronger model than the session** — a
strict change on a low ceiling runs at that ceiling and records a `confidenceLimiter` naming
it; it never blocks and never silently upgrades. Tiers resolve downward:

| Session (ceiling) | ceiling | mid | floor |
|---|---|---|---|
| Opus-class | opus | sonnet | haiku |
| Sonnet | sonnet | sonnet | haiku |
| Haiku | haiku | haiku | haiku |

A Haiku-only run must still work — that is the robustness policy, not an edge case. The
floor is pinned in the `chaos-mechanical-executor` agent (`model: haiku` — Haiku 4.5, the
**weakest supported model**); the implementation specialist inherits the session (= ceiling);
mid is passed explicitly at spawn time.

## Assignments

**Floor / T0 (delegate to the mechanical executor; it never decides):**

- Render repair loop (fix record **facts** per `render.py --check` errors)
- Mechanical audit repairs (re-run the `chaos-record` emitter, re-render — never stops)
- **Mechanical implementation units** — see the band below (L1-D16)

(`TRG-*` transcription moved down-ladder to `chaos-scan` itself — L3-D6, tool beats cheap
model. Harness telemetry is **not** delegable: the arm's schema-validated return value must
come from the arm. Both supersede parts of the original L1-D4 floor assignment; registered
in §5e.)

## The unit band — T0 / T1 / T2 (L1 §8; ask the tool, do not judge it yourself)

**L1-D11's "easy gate" is superseded** — it was change-scoped and latched on the first firing,
so it measured **inert** (0 delegations on 6/6 arms). The band applies **per work unit** and
is recomputed every unit:

```bash
python tools/chaos-scan/scan.py tier --change-dir <dir> \
    --unit-path <file> [--unit-path <file>...] \
    [--covers C-001,C-002] [--acceptance-check "<cmd that must already FAIL>"]
```

It returns `T0` | `T1` | `T2` with the **deciding gate** and a citation. **T2 (ceiling) is the
default and the fallback** — a unit reaches a cheaper tier only by passing every gate.

| Band | Runs at | Reached when |
|---|---|---|
| **T2** | ceiling (you) | anything else — and every judgement step, always |
| **T1** | mid | no fired-trigger surface · no sensitive class at all · no evidence for a statement coupled to a fired surface · budget intact |
| **T0** | floor | all of T1, **plus** file-level paths, under 8 declared files, **plus** Route **A** — an executable acceptance check that already FAILS; turn it green |

> **Route B is closed (creator, 2026-08-04).** It banded a unit T0 when the unit mapped 1:1 onto
> pinned contract statements, with no pre-existing validator. Its first real test failed: the
> floor tier implemented a `?priority=` guard with `Enum.TryParse`, which accepts comma-separated
> lists, so `?priority=Low,High` returned 200 where the pinned statement required 400 — reported
> as `COMPLETE`, 1 attempt, 41/41 green. **"Suite green" counted tests the executor itself wrote**,
> so it authored both the implementation and the evidence for it, and one misreading produced
> both. A self-written validator is not a validator; a stronger model lowers the probability
> without closing the hole. Route A survives precisely because its check **pre-exists the unit and
> cannot be authored by the executor**. Applied per L1-D11's pre-registered rule: a correctness
> failure on a cheap tier closes that route rather than being tuned.
>
> **Consequence, stated rather than buried:** Route A has never fired in any measured run, because
> it needs a failing check to pre-exist and the collapsed loop writes tests and code in one unit.
> **T0 is therefore dormant in practice** until the loop is restructured so a ceiling-authored
> failing acceptance check precedes the implementation unit.

**After every cheap-tier unit, verify:** full test suite green, build clean, the actual diff
inside the declared files, and the rescan attributes no new firing. On any failure:

```bash
python tools/chaos-scan/scan.py tier --change-dir <dir> --escalate T0|T1
```

which climbs **one rung** (T0→T1→T2), spends one of the budget of **2**, and latches
implementation to ceiling once spent. Escalation is never a stop and never a governance event
— note it in the final response.

**Ceiling — the grader invariant (never below ceiling, never modulated):**

- Classifier + audit invocation and verdict reading · adjudication pass
- Every stop; ledger `RUN-DEC-*` presentation and answers; audit failures naming a stop
- Judgement prose in records (`assessment`, `whyNotTest`, `verdictRationale`, deviations)
- OpenSpec artifact authoring · self-review verdict (K4) · in-loop verify

The steps that measure difficulty are never downgraded by the difficulty they measure.

**Implementation — ceiling by default; mid while the easy gate is open (L1-D11):**

- **Easy gate open** = zero triggers fired so far AND no preset floor. While open,
  implementation units MAY be delegated at **mid**.
- The gate **closes for the rest of the run** on: any trigger firing (materiality or
  mechanical), an X2 self-review fail, or two failed test cycles. Closed = ceiling; a
  mid-tier unit that hits a failure signal is **redone at ceiling**.
- A mid-tier implementer keeps the full specialist stop-conditions contract — discordance
  (S3) is surfaced to the orchestrator, which owns every decision at ceiling.

**Tool (no model; L3/L4 surfaces):** scan prep, diff scoping, payload assembly, classifier +
audit invocation mechanics, record facts derivation, build/test execution.

## Rules

- **Overhead guard (L1-D7).** Delegate only steps that are (a) validator-gated and (b)
  self-contained as paths + short instructions. If assembling the delegation prompt costs
  more than the step, do it inline — a delegation that inflates total tokens is a map
  defect, not a saving.
- **Escalation (L1-D6, within the ceiling).** Floor: two executor attempts, then the
  orchestrator finishes inline. Mid: a failure signal redoes the unit at ceiling. Never a
  stop, never a governance event; note every escalation in the run's final response. A step
  that escalates persistently across changes is a todo candidate to become a tool.
- **Fidelity is invariant.** Tiering moves *who performs* steps, never what fires, what
  stops, or what is owed. Any fidelity movement is a defect that stops the analysis; an
  oracle regression on a mid-tier arm closes L1-D11 rather than tuning it (L1-D8/§7).
<!-- digest:end model-tier-map -->

<!-- digest:begin decision-protocol -->
## Interactive decision protocol (compiled)

A **material decision** changes scope, mode/risk, governance, source-of-truth artifacts,
protected files, or correctness (approvals, waivers, degraded modes, protected-file updates,
conflict resolutions, materially-missing context).

**Routing — interaction runtime first.** When `policies.interactionRuntime.commands.enabled`
(default true) and the runtime is available: create the decision through the runtime with
title/context/`interactionType`(`single-choice-decision` default · `confirmation` ·
`multi-choice-decision` · `freeform-input`)/options/`recommendedOptionId`, receive
`mustStop: true`, and **STOP**. The human answers in the Decision Center; `chaos:resume`
continues. Batch independent decisions per the decision-batching policy. Two writers, same
file-backed state: **MCP tools preferred** (`chaos_begin_command`, `chaos_create_decision`,
`chaos_get_active_decision`, `chaos_get_decision_response`, `chaos_mark_decision_consumed`,
`chaos_complete_command`); fallback is the runtime CLI
(`node tools/chaos-interaction-runtime/src/cli/chaos-interaction-runtime.ts begin-command|create-decision|get-response|mark-consumed|complete-command ...`).
**Chat fallback only** when the runtime is disabled or unavailable — a configured fallback,
never a silent bypass.

**Presentation (chat fallback / the literal Decision Center content):** one decision at a
time · brief context · numbered options · recommended option marked, with reasons ·
consequence per option · a "Stop / defer" option · **stop immediately after presenting**.

**Forbidden:** silently choosing · burying decisions in paragraphs · several unrelated
decisions at once · continuing after asking · treating a recommendation as accepted ·
treating no response as approval · treating inferred intent as confirmation.

**Recording:** material outcomes → a Decision Event in the change ledger
(`decision-events.md`), with decision type, status, knowledge, confidence, evidence, impact,
sync action. Lower-materiality → a Context Note in the command report.

**Specialist boundary:** the orchestrator owns user-facing decisions. Specialists return
findings/options/confidence/evidence and never ask final user decisions unless explicitly
delegated.
<!-- digest:end decision-protocol -->

<!-- digest:begin decision-entry-format -->
## 2. Decision entry format (`decision-events.md`, append-only)

Same file name and anatomy as always; entries are **appended, never rewritten** — a state change
edits the `status:` line only. No narrative retelling of the question.

**Canonical scan rule — what counts as a decision entry.** A decision entry is a level-2 heading
matching:

```text
^## (<PREFIX>-DEC-<nnn>|ESC-<nnn>)
```

Known prefixes: `PROP-` · `RUN-` (chaos:run — one continuous command, so its decisions sort at
the same stage as `PROP-`) · `REV-` · `APP-`/`APPLY-` · `VFY-`/`VER-` · `CR-` · `SYNC-` ·
`ARC-` · `RETRO-` (plus `ESC-` for escalation events). **Any other `##` heading in `decision-events.md` —
narrative or grouping sections such as "Dependent decisions" or "Runtime note" — is NOT an entry.**
This single rule governs everywhere decisions are enumerated or counted:
`lifecycle.current.decisions`, the `chaos:archive` closure matrix, sync reconciliation, and audits.
Enumerate with it; never eyeball a heading count.

**Scope:** the rule addresses the **ledger** — `.chaos/changes/<change-id>/decision-events.md`. Legacy
narrative reports embed their decision events as `###` subsections nested under a `## … Decision
Events` heading; that nesting is correct *inside a report* and is not the ledger. A command writing
to the ledger always uses the `##` entry shape above, whatever shape a report template shows.

```markdown
## <PREFIX>-DEC-<nnn> — <question, one line>

- status: OPEN | ANSWERED (<who>, <date>) [· CONSUMED] | RESOLVED-IN-ARM | RECORDED (<date>) [· run: <commandRunId>]
- approves-change: true            # exactly one entry per light change carries this marker
- options: A <one line> · B <one line> · C <one line>   # confirmation-type entries list unlettered option labels
- recommendation: <letter> — <one clause>
- answer: <letter or verbatim short answer>
- why-material: <one line>
- folds: <n> — <label> · <label> · <label>
                                   # OPTIONAL. Present when this ONE stop carries N material
                                   # questions folded into it (design section 5.3 law 2). The
                                   # integer is machine-read by the M4 decision-density detector;
                                   # omit it and the entry counts as exactly 1 question.
- sync-action: NONE | CREATE_ADR | UPDATE_CHAOS_RULES | AMEND_OPENSPEC_SPEC | RECORD_ACCEPTED_RISK
                                   # "+"-combined when several apply; optional trailing "— <note>"
- escalates: <from> → <to>         # ONLY when this entry's answer changed the mode (human escalation);
                                   # auto-escalations use ESC- events. Feeds the H1 warning chain.
- knowledge: FACT | INFERENCE | ASSUMPTION | UNKNOWN · confidence: HIGH | MEDIUM | LOW
```

Escalation events use the same shape with the `ESC-` prefix:

```markdown
## ESC-001 — auto-escalated: <trigger>

- status: RECORDED (<date>)
- from: light · to: standard
- trigger: <posture-crossing | decision-count | scope-spill | self-review-fail | openspec-degraded | answer-widened-scope>
- kept-work: <one line — what FRAME output seeds the standard path>
```

**Stage-C trigger events** (progressive rigor; design
`docs/design/2026-08-02-stage-c-progressive-rigor.md`; commands wired to the classifier record
one per fired trigger — under C these replace mode escalation):

```markdown
## TRG-001 — trigger fired: M2 sensitive-surface

- status: RECORDED (<date>) [· run: <commandRunId>]
- trigger: M1|M2|M3|M4|M5|X1|X2|X3 · by: scan|adjudication|declared · surface: <class or none>
- cite: <the input line/section pair that justified the firing>
- dimensions-after: stops <n> · evidence.targeted <n> · evidence.breadth <n> · review <n> · verify <n> · openspec <n> · adr <n>
```

`TRG-` headings are **deliberately NOT decision entries** under the §2 scan rule (they must not
inflate `lifecycle.current.decisions` or the M4 decision-density count). The classifier's
machine state lives in `.chaos/changes/<change-id>/classification-state.json` (the
`tools/chaos-classify --state` file — the classifier's own working state, not a Stage-B
`records/` artifact; the frontmatter classification block is deferred until Stage-B's writer
fate is decided, so C stays unwelded from B).
<!-- digest:end decision-entry-format -->

<!-- digest:begin classifier-wiring -->
## Wiring adapter (step 4 — commands call this)

```text
python tools/chaos-classify/classify.py --inline payload.json \
    --state .chaos/changes/<id>/classification-state.json [--adjudication raises.json]
```

`payload.json`: `{checkpoint, intent, scope, declaredTriggers, mode, postureFiles[],
mapFile, ledgerFile?, numstatFile?, patchFile?}` — the command reads nothing itself; the
adapter reads the named files, the core stays pure.

**`numstatFile`/`patchFile` scope (mandatory):** the diff describes the **governed subject only**.
Exclude `.chaos/**`, `openspec/**` and any ADR the change authored, and stage new files first
(`git add -N <subject paths>`) or the diff cannot see them. Counting a change's own governance
output makes governance self-amplifying: measured 2026-08-03, six of six governed arms crossed
X1's blast-radius threshold on their own paperwork
(`.chaos/validation/2026-08-stage-c-step5-rerun/results.md` §3). Blast radius is a property of the
subject, never of the bookkeeping. The **two-call pattern per checkpoint**:
(1) scan call → read the verdict's candidates/demoted list; (2) the command performs the
adjudication pass per `adjudication-prompt.md` and calls again with `--adjudication`
(`{"raises": [...]}` form). Running the same checkpoint twice is safe — firings dedupe; the
second verdict is authoritative. `--state` is the classifier's working state
(`classification-state.json` in the change folder — deliberately NOT a Stage-B `records/`
artifact).
<!-- digest:end classifier-wiring -->

<!-- digest:begin classifier-continuous-mode -->
## Continuous mode (Stage D — `chaos:run`)

Design: `docs/design/2026-08-03-cost-bar-and-run-collapse.md` §4.1. Checkpoints are **evidence
classes, not phases**: K1 = intent exists · K2 = an answered decision exists · K3 = the diff
exists *and grows* · K4 = the self-review verdict exists. The loop calls the same CLI; what
changes is cadence — **K3 repeats once per work unit** with the grown (C-15-scoped) diff.
Firings still dedupe, dimensions stay monotone (P4), re-detections still report as `scanEcho`.

Continuous verdict fields:

- `adjudicationDue` — the loop runs the model adjudication pass **only when this is true**
  (first K1 call, or a K3 scan whose diff grew new paths). The continuous form of C-12; K2/K4
  never set it.
- `newSurfacePaths` (K3 only) — paths this scan saw for the first time (state `seenPaths`
  accumulates them; the two-call merge replay sees an empty delta).
- `scanSeq` — call counter (state `scanCount`); the loop cursor for resume capsules.
- `stopAbsorbedBy` — **pending-stop absorption**: a stop demand fired while an earlier ledger
  entry is still unanswered. `newStops` stays 0; the caller's duty is to AMEND the pending
  entry (append the folded question, increment `folds:`) — never to surface a second
  interruption. MR-3 satisfaction (ANSWERED same-surface coverage) beats absorption.
  Corpus seed: SC-23.

**The loop drives this CLI through `tools/chaos-scan/scan.py` (L3):** the wrapper owns the
C-15 diff generation, section/payload assembly, the two-call merge sequence, `TRG-*` ledger
transcription, and the verdict digest + sanitized packet files under the change's `scan/`
folder. It imports `classify()` as a library and changes NOTHING about classification —
this adapter contract stays authoritative for what the core consumes; `--inline` remains
first-class for direct invocation.

**The obligation audit** (`audit.py`) is the deterministic close gate: it recomputes the owed
vector from `classification-state.json` via the same `compute_dimensions` and asserts the owed
artifacts exist (stops all answered + surfaced, ADR at `adr 2`, OpenSpec at depth, verify
record at `verify ≥ 1`, frame/deliver records, vector ≥ floors). Exit 0 = the run may close;
1 = failures, each naming the owed artifact; 2 = audit could not run. It reads `records/`
**by design** — the never-read-records constraint is about *classification inputs*, and the
audit is a gate, not a classifier. It never authors anything.

```text
python tools/chaos-classify/audit.py --state <classification-state.json> \
    --ledger <decision-events.md> --change-dir .chaos/changes/<id> \
    [--openspec-dir openspec/changes/<id>] [--adr-dir <dir>]
```
<!-- digest:end classifier-continuous-mode -->

<!-- digest:begin adjudication-contract -->
# Pinned adjudication prompt — Stage-C classifier, semantic layer (C-6/C-7/C-12)

You are the adjudication layer of a change classifier. A deterministic scanner has already
processed a change's inputs; your ONLY job is to decide whether any **materiality trigger** the
scan cannot see should be RAISED. You judge texts; you never run tools.

## Inputs you receive (a JSON packet)

- `inputs.intent` — what the change claims to do
- `inputs.scope` — the approved/predicted paths
- `inputs.frontmatter` — mode, declared triggers
- `inputs.posture` — the governed subject's architecture posture excerpts (sections, non-goals)
- `inputs.ledger` / `inputs.numstat` / `inputs.patch` — when present
- `scanState.firedSoFar` — triggers the deterministic layer already fired (beyond argument)
- `scanState.demotedCandidates` — class-path hits demoted by the rename-shape guard: decide
  whether a real semantic change hides inside the rename; a pure rename is DECLINED

## Triggers you may raise (materiality only — you may NEVER touch X1/X2/X3)

| id | raise when |
|---|---|
| M1 posture-crossing | the intent/diff contradicts an explicit posture statement or non-goal |
| M2 sensitive-surface | credentials/keys/auth enforcement/persistence-semantics/PII/deploy material appears where the scan's path map missed it |
| M3 contract-surface | a new/changed public contract or a new direct dependency is evident from the texts before the scan can see it |
| M4 decision-density | (rare) the ledger clearly shows >= 2 material decisions the scan misparsed |
| M5 scope-spill | (rare) the diff plainly leaves the approved scope and the scan misparsed it |

## Hard rules

1. **Raise-only.** You may add firings. You may not remove, downgrade, or dispute anything in
   `firedSoFar`. Declining to raise is a first-class, common, correct outcome.
2. **Cite or it didn't happen.** Every raise carries a `cite` naming the exact input line/section
   pair that justifies it (e.g. `intent 'remember the task list between requests' x posture
   'store is the single source of truth'`). No cite, no raise.
3. **`[UNKNOWN]` posture areas are NOT crossings.** A posture line marked `[UNKNOWN] for future
   intent` expresses an open question, not a commitment. Only explicit statements and non-goals
   can be crossed.
4. **Cross-cutting is not risky.** Breadth (many files, middleware, renames) alone never
   justifies a materiality raise — that is the mechanical family's business, not yours.
5. **Surface classes.** Every raise names one surface: `auth` · `data-store` ·
   `contract-dependency` · `integration` · `deploy-ops` · `process`. Pick the class the cited
   posture section / content belongs to.
6. **Pure renames are declined.** For demoted candidates, raise only if the patch shows a
   semantic change (behavior, shape, semantics) beyond identifier renaming.
7. Mark `"breaking": true` on an M3 raise only when the texts show removal/rename of public
   surface or a major dependency bump.
8. **Hedged posture is still posture.** Statements tagged `[INFERENCE]` or guarded by phrases
   like "unless a decision says otherwise" ARE crossable posture — if the change moves against
   them, RAISE M1 and cite the line. Whether a recorded decision *authorizes* the crossing is
   the classifier's stop-satisfaction logic, not yours: never decline an M1 because the ledger
   shows an authorizing decision.
9. **M3's domain is routes, contract artifacts, and dependency manifests.** Adding a field to
   an existing response or model is not, by itself, M3 — judge shape changes under M1 when a
   posture line guards the shape.
10. **Evidence is checkpoint-gated.** Your packet contains everything that exists at its
    checkpoint; judge only from it, and do not speculate about evidence not present.
11. Do not re-raise triggers already listed in `firedThisCheckpoint` or `firedEarlier` — they
    are fired; repeating them is noise.
12. **Never pre-empt the deterministic scan on additive contract changes.** A new route or an
    added parameter that the intent merely announces is the K3 route-delta scan's job. M3
    raises are for what the scan structurally cannot see: a new direct dependency named in the
    texts, or a breaking change evident before the diff exists.
13. **Problem-statement intents don't cross posture.** When the intent states a problem to
    solve (an incident, a symptom, a wish) without committing to a mechanism, the crossing
    depends on an approach nobody has chosen yet — do NOT raise M1. Ambiguity is the
    confirmation/decision machinery's job. Raise M1 only when the texts commit to a direction
    that moves against posture ("add deletedAt to the model" commits; "stop losing edits"
    does not).
14. **M2 needs evidenced material, not capability words.** Raise M2 when the texts evidence
    sensitive material or its handling — a committed value, key material, credential
    enforcement as the change's stated purpose. Capability-adjacent vocabulary alone
    ("signing", "security-related tooling") is not evidence; wait for the checkpoint where
    the material actually appears.

> v2 (2026-08-02): rules 8–11 added after the round-1 blind corpus run — judges read the
> boundary-posture hedge as an exemption (under-detection on store-shape crossings) and one
> judge stretched M3 to response fields. Recorded per the corpus iteration discipline.

## Output — JSON only, nothing else

```json
{ "raises": [ { "trigger": "M1", "surface": "data-store", "cite": "...", "breaking": false } ] }
```

An empty `{"raises": []}` is a normal answer. Do not explain, do not hedge, do not add fields.
<!-- digest:end adjudication-contract -->

<!-- digest:begin record-emission -->
## Record emission (compiled)

Commands **emit structured records**; the renderer projects `change.md`, `lifecycle.md`,
`sync-report.md`, `archive-report.md`, `appendix/*` from them.

**The three writer rules (hard):**

1. **Never hand-write or hand-edit a rendered artifact.** Fix direction is source-first:
   fix the record (or ledger entry), re-render.
2. **Decision entries stay hand-appended.** `decision-events.md` is a SOURCE — append-only,
   per the decision-entry format above; a state change edits the `status:` line only. An
   answer that changes the mode carries `- escalates: <from> → <to>`. Exception (L3-D6):
   `TRG-*` trigger events are appended by `chaos-scan` mechanically — never hand-write or
   edit one.
3. **A record is emitted only for a COMPLETED pass.** Deferred/aborted attempts write no
   record; re-runs append the next pass number; a pass file is never rewritten.

**Loop records** (`.chaos/changes/<change-id>/records/`): FRAME → `contract.json` +
`frame.pass-NN.facts.json` (`READY_FOR_REVIEW`·`BLOCKED`) · DELIVER →
`deliver.pass-NN.facts.json` (`APPLIED`·`PARTIALLY_APPLIED`) · VERIFY →
`verify.pass-NN.facts.json` (`READY`·`READY_WITH_DEBT`·`NOT_READY`). (`review`/`sync`/
`archive` records belong to their own commands.)

**Envelope** (every phase record): `schemaVersion: 1`, `recordType: "phase-facts"`, `phase`,
`pass`, `changeId`, `sourceCommand`, `run` (**the completing run id**), `mode`, `verdict`,
`at` (ISO-8601 Z), `assessment` {`confidence`, `evidenceCoverage`, `assumptionLoad`}, plus
optional `confidenceLimiters`, `verdictRationale`, `commentary`, `todoCandidates`, and the
phase-specific `facts`. **Authored voice goes ONLY in** `commentary`, per-finding `detail`,
and `verdictRationale` — everything else is data.

**Contract statements** carry stable ids (`C-001`…), never renumbered; later additions carry
`addedBy: <decision-ref>`. Deliver's `facts.coverage` enumerates **every** statement id
exactly once with its evidence (`test`|`code`|`doc`); **non-test evidence requires
`whyNotTest`** — that is what keeps weak evidence visible. The renderer ticks mechanically.

**Authoring protocol (do NOT read the schemas):** for frame/deliver/verify, start from the
emitter — `python tools/chaos-record/record.py <phase> --change-dir <dir> --run <runId> ...`
writes the partial record at the real path (facts derived, judgement fields empty; an
underivable fact stays empty, never guessed; an aborted pass deletes its partial). You fill
the judgement; `contract.json` is yours end-to-end (copy
`tools/chaos-render/examples/contract.example.json`; the other examples show the filled
shape). Then validate:

```bash
python tools/chaos-render/render.py <change-id> --write   # --check first when unsure
```

A non-zero exit is a blocking defect **in the records** — fix the record, never the rendered
file. The schemas (`tools/chaos-render/schema/*.schema.json`) remain the machine truth the
validator enforces; agents pattern-match the example and let the validator catch them.
Fallback when the renderer cannot run (no `python`): write artifacts by hand per
`change-template.md` §1–§3 exactly, record the degradation, leave the records in place.
<!-- digest:end record-emission -->

<!-- digest:begin change-folder-layout -->
## Change folder layout (compiled)

`.chaos/changes/<change-id>/` — standard/strict (light: same set, lean payloads, no
`appendix/`):

```text
decision-events.md               # hand-appended SOURCE (one light entry carries approves-change: true)
records/contract.json            # stable-id statements, emitted at FRAME
records/<phase>.pass-NN.facts.json
change.md · lifecycle.md · appendix/*.md   # RENDERED — never hand-written
pre-proposal-brief.md            # ONLY decision-gated degraded mode (standard/strict)
```

- **No `proposal-report.md` / `proposal-review.md` / `apply-report.md` / `verification.md`
  in any mode.** After emitting records: `python tools/chaos-render/render.py <id> --write`.
- OpenSpec owns `proposal.md`/`design.md`/`specs/`/`tasks.md` under
  `openspec/changes/<change-id>/` — never duplicate them into `.chaos/`.
- Recommended decision-log/ADR drafts use **date-prefixed slug filenames**
  (`docs/adr/YYYY-MM-DD-<slug>.md`); sequential display IDs are assigned later by
  `chaos:sync`. Read legacy `.chaos/proposals/` for context; never write there.
<!-- digest:end change-folder-layout -->

<!-- digest:begin openspec-gate -->
## OpenSpec gate (compiled)

OpenSpec is the spec motor; CHAOS is an overlay. At owed depth ≥ 1 the gate is **hard and
ordered**: 1 detect availability (`.chaos/config.yaml` `project.specEngine`/`toolchain`, or
conventions) → 2 invoke via a first-class path — `/opsx:propose` · the `openspec-propose`
skill · **or driving the `openspec` CLI** (`openspec new change` → `openspec status --change
<name> --json`, use its returned paths, write each ready artifact per
`openspec instructions <artifact-id> --json`, re-run status until `applyRequires` are done;
this is NOT a degraded fallback) → 3 confirm `openspec/changes/<change-id>/` exists →
4 confirm artifacts → 5 `openspec validate <change-id> --strict` → 6 only then CHAOS
wrapping. **Use the paths `openspec status --json` returns; never assume repo-local paths.**

**Forbidden:** manually replacing OpenSpec generation · ad-hoc proposal/design/tasks files ·
proceeding as if OpenSpec ran when it did not · hiding an OpenSpec failure.

**Degraded mode is decision-gated and recorded** (a `*-DEC-*` event + the Invocation Proof):
strict → **block** · standard → ask (init OpenSpec first / pre-proposal brief only /
authorized draft artifacts / stop), **STOP** for the choice, cap confidence MEDIUM · light →
**auto-escalate to standard** first (announce, record `ESC-*`, `escalatedFrom: light`; light
never skips the spec silently). Never fabricate validation results — record
PASSED/FAILED/NOT_RUN/UNAVAILABLE honestly.

**Decision needs returned by OpenSpec surfaces** are resolved by THIS orchestrator via the
decision protocol (one decision, STOP), recorded, then generation resumes — the OpenSpec
surface never "keeps momentum" on material choices.

Every report carries the **OpenSpec Invocation Proof**: status
(INVOKED/UNAVAILABLE/FAILED/DEGRADED_WITH_USER_APPROVAL), actual invocation used, artifacts
touched, validation command + result, confidence impact.
<!-- digest:end openspec-gate -->

<!-- digest:begin scope-drift -->
## Scope drift (compiled)

Boundary sources: OpenSpec proposal/design/specs/tasks · the review · CHAOS
decisions/rules/architecture · user constraints. Classes:

- **NO_DRIFT** — matches approved tasks and boundary.
- **BOUNDED_DRIFT** — small local change to complete an approved task (missing test helper,
  approved-persistence migration, convention rename). Light/standard: allowed **with a
  decision event**; strict: confirmation + usually an OpenSpec task amendment.
- **SPEC_DRIFT** — requirements/acceptance/public contracts/tasks must change. Needs an
  OpenSpec amendment or explicit user-approved risk (light/standard); **blocks in strict**
  unless amended.
- **ARCHITECTURE_DRIFT** — ADR posture, module boundaries, integration/auth/deploy/
  persistence model must change. **Blocks in strict**; light/standard only after an explicit
  decision with `sync_action: CREATE_ADR`/`CREATE_DECISION_LOG`.
- **OUT_OF_SCOPE** — unrelated to the change: stop or defer.
<!-- digest:end scope-drift -->

<!-- digest:begin delegation -->
## Task delegation (compiled)

Delegate **per task/work package, never "the feature"**; the orchestrator keeps scope and
workflow control. The delegation prompt must carry: change id · mode · task id + text ·
source-of-truth paths (OpenSpec artifacts + `change.md` §Contract/§Review) · relevant
rule/decision excerpts · allowed scope · non-goals · stop conditions (scope exceeded, new
architectural decision, uncovered side effect, unclear behaviour with thin evidence,
unavailable test infrastructure) · the required response shape (files inspected/changed,
tests, assumptions, unknowns, decisions needed, validation, status).

Classify every specialist response — completed · partial · discovered amendment · new
decision required · scope drift · validation gap · blocker — and **never continue to the
next task past a blocker or an unresolved required decision**.
<!-- digest:end delegation -->

<!-- digest:begin csharp-specialist -->
## C# specialist boundary (compiled)

The specialist (`.claude/agents/chaos-csharp-implementation-specialist.md`) is the technical
executor for bounded C#/.NET tasks. It owns **no** scope, product decisions, OpenSpec
changes, ADRs, or governance. It inspects repo conventions first and follows ADR-aligned
defaults only where repo evidence supports them. It must **stop and report** when a task
needs architecture beyond the approved proposal, a new ADR/decision, uncovered external side
effects, unclear existing behaviour, unavailable infrastructure/secrets, an ADR/rule
conflict, out-of-boundary files, or a public-contract change beyond the approved spec. Its
result reports: status (COMPLETE|PARTIAL|BLOCKED|NEEDS_DECISION), files inspected/changed,
tests, validation, assumptions, unknowns, decisions needed, scope concerns.
<!-- digest:end csharp-specialist -->

<!-- digest:begin resume-capsule-contract -->
# Resume Capsule Contract (consumer view)

The resume capsule is the compact handoff that lets CHAOS continue without chat
memory. Schema: `.chaos/interactions/schema/resume-capsule.schema.json`.
Authoring contract: `.chaos/interactions/contracts/resume-capsule-contract.md`.

## Required fields (STOP if any are missing)

A valid capsule for resume must include:

- `commandRunId`
- `sourceCommand`
- `changeId` (unless a repository-global command)
- `state` — `ready-to-resume` (or a resumed-compatible state)
- `lastCompletedStep`
- `nextStep`
- `answeredDecisionIds`
- `contextCapsule` (intent, approvedScope, constraints, openRisks; optionally
  selectedPath, assumptions, confidenceCaps, forbiddenActions)
- `requiredArtifacts` (if applicable)
- `confidence`, `knowledgeType`

If a required field is missing or empty, **STOP and report exactly which fields
are missing**. Do not invent values.

## Validation checklist

Before continuing, verify:

- session exists and is `ready-to-resume` (or resumed-compatible);
- every `answeredDecisionIds` entry exists as a decision;
- those decisions are `answered` (or already `consumed`) with valid responses;
- the selected option in each response exists in the decision's options;
- required rationale is present where the decision demanded it;
- `requiredArtifacts` exist on disk — in `--strict`, a missing artifact is a
  STOP; in `--standard`, disclose the missing artifact and proceed only if safe;
- a lock exists for the change, or its absence is explainable;
- `sourceCommand` is a known CHAOS command;
- `nextStep` is present and non-empty.

## Compactness

Capsules reference artifacts by path and must not embed large report bodies. Read
`requiredArtifacts` only when needed for correctness (token economy). Read the
capsule before reading full reports.

## Confidence handling

- `--strict`: if `confidence` is LOW or any required artifact is missing, require
  explicit user confirmation before resuming.
- File-fallback (MCP unavailable): cap effective confidence to MEDIUM unless
  direct file validation is strong.
<!-- digest:end resume-capsule-contract -->
