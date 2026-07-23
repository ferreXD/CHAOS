# CHAOS command support matrix

The stable per-command reference: for **every implemented CHAOS command**, what **modes** it
accepts, whether it emits **confidence / knowledge labels**, its **GitHub Copilot** adapter
status, and the **next command** it hands off to.

If you want the *why* — the lifecycle, what each command is for, and where artifacts get written —
read [the five-minute overview](overview.md) first. For the **full flag surface** of each command,
see the [command flags quick reference](command-flags.md). This page is the reference you come
back to.

> **Two surfaces.** The **Claude Code** command set under `.claude/` is the reference
> implementation. The **GitHub Copilot** adapter under `.github/` mirrors it but is
> **experimental** — see [Copilot adapter status](#copilot-adapter-status) below.

---

## How to read the matrix

- **Modes** — the mode vocabulary the command accepts. Most commands use the
  `--light` / `--standard` / `--strict` rigor triad; a few use their own vocabulary (noted).
  - **Bold** = the default when you omit a mode.
  - `†` = when you omit the mode the command **infers** it from the change's risk and asks you to
    confirm — there is no silent hard default.
  - `+flags` = the command also accepts an additional scope/action flag surface beyond the mode
    triad (see the command's own doc for the full list).
- **Confidence** — does the command label material findings/verdicts with a **knowledge type**
  (`FACT` / `INFERENCE` / `ASSUMPTION` / `UNKNOWN` / `CONFLICT`) and a **confidence** level
  (`HIGH` / `MEDIUM` / `LOW`)?
  - `✅` emits both on findings and/or its verdict · `◐` partial · `✖` none (purely explanatory).
- **Copilot** — is there a `.github/prompts/chaos-<name>.prompt.md` mirror? `✅` = full mirror
  present (experimental). All mirrors are hand-maintained; there is no automated parity check yet.
- **Next** — the golden-path command this one recommends when it finishes. `context` means the
  recommendation depends on workspace state rather than a fixed successor.

---

## Lifecycle — drive a change from intent to closed

| Command | Modes | Confidence | Copilot | Next | Primary output |
|---|---|---|---|---|---|
| `chaos:propose` | light / standard / strict `†` | ✅ findings + confidence summary | ✅ mirror | `chaos:review` | `proposal-report.md` |
| `chaos:review` | light / **standard** / strict `†` | ✅ findings + gated verdict | ✅ mirror | `chaos:apply` *(after approval)* | `proposal-review.md` (+ `approval.md`) |
| `chaos:apply` | light / standard / strict `†` `+flags` | ✅ findings + execution confidence | ✅ mirror | `chaos:verify` | `apply-report.md` |
| `chaos:verify` | light / standard / strict `†` `+flags` | ✅ verdict + labels (no confidence-less verdicts) | ✅ mirror | `chaos:archive` | `verification.md` |
| `chaos:archive` | light / standard / strict `†` `+flags` | ✅ verdict + decision-event types | ✅ mirror | `chaos:sync` (+ `chaos:retro`) | `archive-report.md` (+ `waivers.md`) |
| `chaos:sync` | light / **standard** / strict `+flags` | ✅ drift findings + verdict | ✅ mirror | `context` (closure summary) | `sync-report.md` / repo `sync-reports/` |

**`--light` collapses this lifecycle** (Primary-output column above describes standard/strict):
`chaos:propose --light` = FRAME (`change.md` + decisions + full OpenSpec, one human stop) →
`chaos:apply` (mode inferred) = DELIVER (`change.md` §Delivery dashboard). No review / verify /
archive runs; auto-escalates to standard on risk. Formats:
`.claude/skills/chaos-shared/reference/change-template.md`.

## Investigate — understand before (or after) you change

| Command | Modes | Confidence | Copilot | Next | Primary output |
|---|---|---|---|---|---|
| `chaos:archaeology` | light / **standard** / strict `†` `+flags` | ✅ per-finding labels + caps | ✅ mirror | `chaos:propose` | archaeology report (+ index) |
| `chaos:code-review` | light / **standard** / strict `†` `+flags` | ✅ findings + verdict | ✅ mirror | `chaos:verify` (ready) / `chaos:apply` (remediate) | `code-review.md` |
| `chaos:retro` | light / **standard** / strict `†` `+flags` | ◐ classified action register (no FACT/…/confidence labels) | ✅ mirror | `chaos:sync` (+ propose/apply follow-up) | `retro.md` / periodic `retros/` |

## Set up & operate — the workspace itself

| Command | Modes | Confidence | Copilot | Next | Primary output |
|---|---|---|---|---|---|
| `chaos:init` | **guided-confirmation** / auto / guided | ✅ seeds doctrine + labels own assumptions | ✅ mirror | `chaos:status` | `bootstrap-report.md` + `config.yaml` (+ `AGENTS.md`, `constitution.md`, …) |
| `chaos:doctor` | light / **standard** / strict `+flags` | ✅ per-check confidence + verdict | ✅ mirror | `context` (routes to `chaos:status` / `chaos:sync`) | `doctor/doctor-report-YYYY-MM-DD.md` |
| `chaos:status` | **standard** / strict `+flags` | ✅ findings + verdict | ✅ mirror | `context` (`nextRecommendedCommand`) | `status-report.md` |
| `chaos:todo` | light / **standard** / strict `+flags` | ✅ per-item `knowledgeType` + `confidence` | ✅ mirror | `context` (dashboard recommends) | `todo/items/` + `todo/index.md` (+ HTML views) |
| `chaos:resume` | light / **standard** / strict `+selectors` | ✅ capsule confidence gating | ✅ mirror | continues the **source command** from its `nextStep` | resume report *(standard/strict or `--write-report`)* |
| `chaos:help` | subcommands only — no `--light/--standard/--strict` | ✖ explanatory only | ✅ mirror | `context` (`chaos:help next` recommends from state) | none *(optional workflow README via `--readme`)* |

---

## Mode semantics

The `--light` / `--standard` / `--strict` triad is the same idea everywhere — **rigor scales with
risk** — even though each command applies it to its own work:

| Mode | Intent | What it generally demands |
|---|---|---|
| `--light` | docs, tests, small no-behaviour cleanups | Reports/evidence recommended, not required; only high-impact issues prompt action; accepted risk allowed for non-critical gaps. |
| `--standard` | normal feature work, bounded changes | Full evidence/traceability required; blockers block; skipped validation needs a rationale. |
| `--strict` | migrations, auth/security, data & schema, API contracts, production-critical work | Prior reports + OpenSpec validation required; no unresolved blocking/major findings; material decisions required; missing tests for behavioural change **block** unless explicitly downgraded. |

Two commands use a **different vocabulary** rather than the rigor triad:

- **`chaos:init`** — `guided-confirmation` (default) / `auto` / `guided`. These govern *how much it
  pauses to confirm* while bootstrapping governance, not review rigor.
- **`chaos:help`** — takes subcommands (`workflow`, `commands`, `modes`, `artifacts`, `next`,
  `<command>`) and `--readme`, not a rigor mode.

`chaos:status` accepts `--strict` (and `--no-write` / `--json` / `--scope`); its `--light` appears
only as a per-check *severity modifier*, not as a first-class run mode.

Where a row is marked `†`, omitting the mode makes the command infer one from the change's blast
radius and confirm it with you before proceeding — it never silently picks strict or light for a
material change.

---

## Confidence & knowledge labels

CHAOS refuses to launder guesses as facts. Commands that produce **findings or a verdict** label
each material claim with a knowledge type (`FACT` / `INFERENCE` / `ASSUMPTION` / `UNKNOWN` /
`CONFLICT`) and a confidence level (`HIGH` / `MEDIUM` / `LOW`), and apply **confidence caps**
(e.g. no test coverage → at most `MEDIUM`; an unresolved conflict → `LOW`).

- **Full label doctrine (`✅`)** — `chaos:propose`, `chaos:review`, `chaos:apply`, `chaos:verify`,
  `chaos:archive`, `chaos:sync`, `chaos:archaeology`, `chaos:code-review`, `chaos:doctor`,
  `chaos:status`, `chaos:todo`, `chaos:resume`. `chaos:init` seeds the doctrine into the
  constitution and labels its own assumptions/conflicts.
- **Partial (`◐`)** — `chaos:retro` produces a classified *action register* with over-fitting
  guardrails, but does not attach the per-finding knowledge-type/confidence taxonomy the others do.
- **None (`✖`)** — `chaos:help` explains the model but emits no labeled verdicts of its own.

---

## Copilot adapter status

Every command above now has a **full** GitHub Copilot mirror under `.github/prompts/` — including
`chaos:doctor`, which earlier readiness notes recorded as missing. Each `.prompt.md` is a real
wrapper (not a stub) that loads the mirrored `.github/skills/…` and `.github/agents/…` surface and
carries the same decision-stop and read-only contracts as the Claude side.

**Caveats that keep this an experimental adapter:**

- The Copilot surface is **hand-maintained** — there is **no automated Claude↔Copilot parity
  check** yet, so drift is possible.
- Copilot-runtime **hook checks** (`chaos:doctor`) are advisory only; GitHub Copilot does not
  execute Claude hooks natively.
- Treat the Copilot adapter as **experimental** and prefer the Claude Code surface where fidelity
  matters.

---

## Not in the matrix

- **Aliases** — `chaos:archeology` is an alias of `chaos:archaeology`, and `chaos:proposal` is an
  alias of `chaos:propose`. Each delegates to the canonical command and adds no behaviour of its
  own; use the canonical spelling.
- **`opsx:*` (OpenSpec experimental)** — `opsx:apply`, `opsx:archive`, `opsx:explore`,
  `opsx:propose`, `opsx:sync` drive the native OpenSpec experimental workflow directly. They are
  **not CHAOS-governed** commands — no CHAOS modes, confidence labels, or decision-event
  obligations — and are intentionally excluded from this matrix.

---

*Derived from the current `.claude/skills/`, `.claude/commands/`, and `.github/prompts/` sources.
Fulfils roadmap item **RM-009** / audit finding **F-06** (command stability matrix — mode,
confidence, Copilot status, and next-command per command). Last updated 2026-07-18.*
