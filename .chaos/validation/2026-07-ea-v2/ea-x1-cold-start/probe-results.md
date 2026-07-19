# EA-X1 — Instrumented cold-start probe results (baseline + post-fix re-validation)

> **Honesty legend (used on every line):** **Observed** = directly measured this run ·
> **Inferred** = reasoned from evidence, not measured · **Unknown** = not determined.
> **Agent-vs-human caveat:** this is a *machine* probe run by an agent. It validates the
> **mechanical onboarding path** and the **0-silent-failures** sub-threshold. It does **not**
> and **cannot** measure human time-to-first-value — see [`README.md`](README.md) and
> [`recruitment-protocol.md`](recruitment-protocol.md).

- **Date:** 2026-07-19 (Observed) — two runs, same day.
- **Run 1 (baseline):** clean detached worktree of `main` @ `8b751b7`.
- **Fixes applied:** commit `88954b8` on `main` — F1 (`py -3` → `python` hook interpreter),
  F3 (untrack `.claude/settings.local.json`).
- **Run 2 (re-validation):** clean detached worktree of fixed `main` @ `88954b8`.
- **Experiment:** EA-X1 (gates EA-X2). Brief: `ea-v2-kickoff/ea-x1-cold-start.md` (gitignored).
  Spec: `15-validation-experiments.md` §15.2. In-scope threshold: **0 silent failures**.

---

## Current status (after the fix) — headline

| Question | Run 1 (baseline `8b751b7`) | Run 2 (fixed `88954b8`) | Basis |
|---|---|---|---|
| Mechanical onboarding path completes end-to-end? | **YES**, 0 abandonment | **YES**, 0 abandonment | Observed |
| `chaos:doctor` verdict | `READY_WITH_WARNINGS` | `READY_WITH_WARNINGS` | Observed (real command) |
| CD-HOOK-05 (wired hook interpreter runs) | **WARN** — `py -3` exits 101, hooks silently no-op | **PASS** — `python` 3.12.3 exit 0, hook dry-runs clean | Observed |
| **Silent-failure count vs target 0** | **1** (the `py -3` hooks; doctor-detectable) | **0** ✅ | Observed |
| Undetected silent failures | 0 | 0 | Observed |
| `settings.local.json` in clean env (F3) | **present** (committed) | **absent** (untracked) ✅ | Observed |
| Demo first value (`curl /tasks`) | 200, seeded 4-task list | 200, seeded 4-task list | Observed |
| Baseline tests | 5/5 pass | 5/5 pass | Observed |
| Human time-to-first-value ≤ 60 min | NOT CLAIMED — pending 3-dev trial | NOT CLAIMED — pending | (by design) |

**Bottom line (Observed):** the two requested fixes land the **`0 silent failures` sub-threshold
clean** on the fixed `main`. The mechanical onboarding path completed in both runs; the only
silent-failure condition (F1, the `py -3` hooks) is now gone. **Two findings remain open and are
*not* silent failures:** F2 (`openspec init` dirties 20 tracked files) and F4 (a declared-but-unwired
protected-file guard). **F5** — a *side-effect of the F1 fix* (the artifact-metadata hook's over-broad
managed set caused a one-time repo-wide stamp) — has since been **fixed** (see the F5 entry below).

---

## Re-validation (Run 2, fixed `main` @ `88954b8`) — Observed

Fixes confirmed present in a clean checkout **before** re-running: 0 `py -3` tokens in
`.claude/settings.json`; `.claude/settings.local.json` absent and `git ls-files` returns nothing
for it.

| Check | Result | Evidence |
|---|---|---|
| **F1 — hook interpreter** | **FIXED** | Wired token is now `python`. `python --version` → 3.12.3 exit 0; wired hook `chaos-session-context.py --dry-run --print` → exit 0, valid JSON. `grep -c 'py -3' settings.json` → 0. `chaos:doctor` **CD-HOOK-05 = PASS**. |
| **F3 — committed local settings** | **FIXED** | `settings.local.json` absent from clean checkout; untracked; still `.gitignore`d (line 287). `chaos:doctor` confirms absent. |
| Silent-failure count | **0** | The only prior silent-failure condition (F1) is resolved; no new ones. |
| `chaos:doctor` verdict | `READY_WITH_WARNINGS`, **no FAILs** | Real command, read-only, against the fixed worktree. |
| Mechanical path | completes; demo first value 200 (4 tasks), health `{"service":"task-tracker","status":"ok"}`; runtime diagnostics **healthy**; dotnet **5/5** pass | Observed |
| **F2 — `openspec init` dirties tree** | **STILL OPEN** | Re-run: 20 tracked files modified again (out of scope of the requested fixes). |
| **F4 — protectedFiles no guard hook** | **STILL OPEN** | `chaos:doctor` CD-HOOK-02 WARN (by-design per patch-preview enforcement). |

**Live corroboration (Observed, this session):** after committing the fix, the previously-silent
`UserPromptSubmit` hooks (`chaos-active-command`, `chaos-session-context`) began reporting
**success** in the running session — direct confirmation the hooks now execute under `python`.
(Activating the hooks also surfaced **F5** — the artifact-metadata hook's over-broad managed set,
which briefly stamped hand-authored `.chaos` docs — since **fixed** by narrowing the set; see below.)

Remaining `chaos:doctor` WARNs in Run 2 are optional/expected or probe artifacts: no provider
(GitHub) MCP configured (optional; `gh` authed covers context), detached HEAD (worktree artifact),
dirty tree (F2), sync-authority MEDIUM (standard-mode `REQUIRES_CONFIRMATION`, expected), and F4.
**No FAILs.**

> **Probe-artifact caveat (Inferred):** in both runs the worktree was seeded with `node_modules`
> and (via `openspec init`) an `openspec/` project, so `chaos:doctor` scored **CD-MCP-03** and
> **CD-RT-07** as PASS. A *truly pristine* `git clone` has neither yet, so a first-time newcomer
> would instead see those as **WARNs** with remediations (`npm install`, `openspec init`) — still
> `READY_WITH_WARNINGS`, per the doctor contract. Not a regression; just the honest fresh-clone shape.

---

## Environment (Observed, both runs)

| Component | Value |
|---|---|
| OS | Windows 11 Pro 10.0.26200 (win32) |
| Node.js | v24.18.0 (≥ 22.6.0 required ✓) · npm 10.5.1 |
| git | 2.45.0.windows.1 |
| OpenSpec CLI | 1.6.0 · **.NET SDK** 10.0.300 (demo targets `net8.0`) |
| `python` | 3.12.3 — **works** (now the wired hook interpreter) |
| `python3` | MS Store stub — exits 49 |
| `py -3` | broken — exits 101, stale CI path `C:\Agents\_work\_tool\Python\3.13.0\x64\python.exe` (this is *why* F1 mattered) |

---

## Per-step instrumentation (Run 1 baseline — Observed)

Every step run in a clean worktree with **closed stdin** (to expose interactive hangs) and full
output capture. Run 2 reproduced S1–S6 with equivalent timings; only CD-HOOK-05 flipped WARN→PASS.

| # | Documented step | Command | Exit | Wall (s) | Artifact promised → produced? | Verdict |
|---|---|---|---|---|---|---|
| S1 | Prereqs (installation.md) | `node`/`npm`/`git`/`openspec`/`dotnet --version` | 0 | 0.1–0.9 ea | all ≥ required ✓ | Observed PASS |
| S2 | "Initialize the OpenSpec project" (Path A) | `openspec init` | 0 | 1.55 | `openspec/` created ✓ — **but also modified 20 tracked files (F2)** | Observed PASS **+ side-effect** |
| S3 | Path A step 1 | `npm install` (`tools/chaos-interaction-mcp`) | 0 | 3.41 | `node_modules` (96 pkgs) ✓ | Observed PASS |
| S4a | Path A step 2 | `npm install` (`extensions/chaos-decision-center`) | 0 | 1.63 | `node_modules` (4 pkgs) ✓ | Observed PASS |
| S4b | Path A step 2 | `npm run build` (Decision Center) | 0 | 2.28 | `dist/…/extension.js` (the `main` entry) ✓ | Observed PASS |
| S5 | "Verify" — `chaos:doctor` (real, read-only) | *(agent-run)* | — | ~192 | doctor report ✓; **`READY_WITH_WARNINGS`** | Observed PASS **+ WARNs** |
| S5·CD-HOOK-05 | doctor check | `py -3 --version` (Run 1 wired token) | **101** | 0.14 | interpreter fails → **WARN (F1)** | Observed WARN → **PASS in Run 2** |
| S5·CD-MCP-03 | doctor check | entry file + `node_modules` present | 0 | <0.1 | wiring resolves ✓ (probe artifact — see caveat) | Observed PASS |
| S5·CD-RT-07 | doctor check | `openspec/` marker exists | 0 | <0.1 | present (after S2) ✓ (probe artifact) | Observed PASS |
| S5·runtime | doctor check | interaction-runtime diagnostics `doctor --section` | 0 | 0.28 | **healthy** ✓ | Observed PASS |
| S6 | Baseline | `dotnet test` (demo) | 0 | 9.73 | **5/5 tests pass** (cold) ✓ | Observed PASS |
| S7 | "Run the demo — first value" | `dotnet run` + `curl /tasks` | HTTP **200** | **3.76** (warm) | seeded 4-task JSON ✓; `GET /` → `{"service":"task-tracker","status":"ok"}` ✓ | Observed PASS |

**S7 timing caveat (Observed→Inferred):** 3.76 s to first `200` is a **warm** start (S6 already
built the project). Cold `dotnet run` adds restore+build; the whole cold cycle (S6) is 9.73 s, so
cold baseline-first-value (T0) ≈ **10–13 s** (Inferred).

---

## Silent-failure analysis (target: 0)

**Definition (brief):** a step that appears to succeed but didn't do what the docs claim; OR a
non-zero exit the onboarding flow swallows/ignores; OR a hang with no guidance.

| Candidate | Silent failure? | Run 1 | Run 2 (post-fix) |
|---|---|---|---|
| **F1 — `py -3` hooks** — all hooks in `.claude/settings.json` wired to `py -3`, which exits 101; Claude Code swallows hook failures → CHAOS session-context / artifact-metadata / auto-resume hooks silently no-op. | **YES** (a swallowed non-zero exit). Doctor-detectable via CD-HOOK-05. | **count 1** | **count 0** — interpreter now `python`, CD-HOOK-05 PASS |
| F2 — `openspec init` dirties 20 tracked files | **NO** — exits 0, does what it says; undocumented *side-effect* → friction/doc gap | 0 | 0 (finding still open) |
| Interactive hang on `openspec init` | **NO** — 1.55 s with stdin closed | 0 | 0 |
| Build produced no artifact | **NO** — Decision Center `dist/` + `main` entry produced; MCP `dist` correctly absent (build-free path) | 0 | 0 |

- **Silent-failure conditions — Run 1: 1 (F1). Run 2 (post-fix): 0.** — Observed.
- **Undetected silent failures: 0 in both runs** — Observed.

---

## Findings

### F1 — Shipped hook interpreter `py -3` silently no-ops — **RESOLVED (commit `88954b8`)**
- **Was:** `.claude/settings.json` wired all hooks to `py -3` (exit 101 here / MS-Store stub /
  non-Windows), silently no-opping runtime-context, artifact-metadata, and auto-resume hooks.
- **Fix:** interpreter token changed `py -3` → `python` (3.12.3). CD-HOOK-05 now PASS; hooks
  execute. Matches repo memory *"env: py -3 launcher broken."*
- **Residual:** the illustrative template `.claude/hooks/settings.runtime-observability.example.json`
  still shows `py -3` (left as a reference to adapt) — Observed, low severity.
- **Cross-link:** first-run integrity → **EA-S2**; hardening → **EA-V3**.

### F2 — `openspec init` (documented Path A step) mutates 20 tracked files — **OPEN** — Observed
- Running the documented `openspec init` modified **20 tracked files** (`.claude/commands/opsx/*.md`
  ×5, `.claude/skills/openspec-*/SKILL.md` ×5, `.github/prompts/opsx-*.prompt.md` ×5,
  `.github/skills/openspec-*/SKILL.md` ×5) and created untracked `openspec/` (+ new opsx artifacts).
  Reproduced identically in Run 2.
- **Impact (Inferred):** a newcomer running `git status` after the documented step sees 20 modified
  tracked files they never touched — plausibly alarming. Not a blocker (doctor stays
  `READY_WITH_WARNINGS`; demo runs), but real friction + a **doc gap** (installation.md's
  "Initialize the OpenSpec project" step doesn't warn that `openspec init` refreshes managed skills).
- **Remediation (proposed):** doc note that `openspec init` refreshes OpenSpec-managed skill/command
  files and dirties the tree; or scope the eval to avoid it. **Cross-link → EA-S2.**

### F3 — `.claude/settings.local.json` was committed — **RESOLVED (commit `88954b8`)**
- **Was:** tracked despite being in `.gitignore` (committed before the ignore rule), so a fresh
  clone inherited machine-local MCP toggles (`ado-remote-mcp`, `enableAllProjectMcpServers`).
- **Fix:** `git rm --cached .claude/settings.local.json` (kept on disk, still gitignored). Confirmed
  absent from the clean Run 2 checkout.

### F4 — `protectedFiles` policy declared but no guard hook wired — **OPEN** — Observed (via doctor)
- `chaos:doctor` CD-HOOK-02 WARNs that `.chaos/config.yaml` declares `policies.protectedFiles`
  but no PreToolUse guard hook is wired. Reported by-design (command-level patch-preview
  enforcement), but the declared protection is not enforced at the hook layer. Low severity;
  governance-integrity backlog note.

### F5 — Fixing F1 activated never-before-run repo-wide artifact-metadata stamping — **RESOLVED** — Observed
- Because the hooks never ran under `py -3`, `chaos-artifact-metadata-hook.py` had **never stamped**
  any managed markdown. Fixing F1 (hooks now run under `python`) activated it, and with the shipped
  `include: ".chaos/**/*.md"` the first `--stamp` sweep **prepended `chaosMetadata` frontmatter to
  ~40 hand-authored `.chaos` files** (assessments etc.) as `artifactType: unknown` (frontmatter-only,
  +24 lines each, no body change).
- **Two sub-issues:** (a) the managed set was over-broad — `.chaos/**/*.md` swept every hand-authored
  doc (all 128 `.chaos/*.md` on `main`), none of which has an inferable artifact type; (b) the stamped
  `repositoryContext.branch` / `reviewRequest` were written as **stringified Python dicts**
  (`"{'name': 'main', ...}"`) instead of scalars.
- **Fix:** narrowed `policies.artifactMetadataManagedFiles.include` (and the hook's `DEFAULT_MANAGED`)
  to the command-generated artifact paths `infer_artifact()` recognizes, with an explicit `exclude`
  for the hand-authored trees (`assessments`, `validation`, `todo`, `roadmap`, `interactions`);
  coerced `branch`→name / `reviewRequest`→scalar (plus a `_yaml_scalar` JSON safety net). Verified by
  test: a recognized artifact is stamped once and a second `--stamp` sweep writes nothing (idempotent);
  the hand-authored trees are left untouched; the managed set on `main` is now empty (0 churn). The
  orphaned frontmatter these EA-X1 files briefly carried was stripped.
- **Note:** the stamp was already idempotent by design for *already-stamped* files
  (`allowAuditOnlyStamp: false`); the churn was purely the one-time first-stamp of over-broadly-included
  files. See `.claude/hooks/reference/artifact-metadata-config.md`.

---

## Inferred human-friction (a human may stall even though the machine path succeeds)

Labelled **Inferred** — the human trial's job to measure.

1. **"No installer yet" tax.** Path A = install Node ≥ 22.6 + OpenSpec (global) + .NET SDK, then
   hand-build **two** local npm packages, wire MCP, reload the client, press **F5** (or package a
   VSIX). Docs say so, but each is a stall point.
2. **Reaching *governed* first value (T1) needs the Decision Center running.** `chaos:propose`
   stops on a material decision answered **only in the VS Code Decision Center**. A newcomer who
   built only the MCP server has no way to answer it → stalls at the moment CHAOS's value appears.
   **Most likely place a 60-min run overflows.** (This probe reached T0 baseline value; T1 needs
   the human UI loop — **Unknown** here.)
3. **Demo doc is "illustrative," not reproducible.** `docs/demo/README.md` states its artifacts are
   hand-authored excerpts; the "real" trail lives on a separate `demo/dotnet` branch.
4. **`openspec init` scope confusion (F2)** + the docs' "`openspec init` vs `chaos:init`" distinction
   is heavy conceptual load before first value.

---

## What this probe did NOT do (scope honesty)

- **Did not measure human time-to-first-value.** Out of scope; **pending** the 3-dev trial
  ([`recruitment-protocol.md`](recruitment-protocol.md)). **Not claimed** (§15.1: the creator/agent
  cannot un-know the workflow).
- **Did not drive `chaos:propose → … → sync` end-to-end** (requires a human answering decisions in
  the Decision Center). Validated the environment up to that boundary + the real `chaos:doctor`.
- **Did not test the Copilot adapter** (experimental; lacks `chaos:doctor`). **Unknown.**

---

## Reproduce

(1) `git worktree add --detach <path> main`; (2) from the worktree, run `docs/installation.md`
**Path A** verbatim (prereq checks → `openspec init` → `npm install` in `tools/chaos-interaction-mcp`
→ `npm install && npm run build` in `extensions/chaos-decision-center`); (3) `chaos:doctor`
(read-only); (4) `docs/demo/README.md` first value (`dotnet test`; `dotnet run --project
src/TaskTracker.Api` + `curl http://localhost:5080/tasks`). Capture exit / wall-time / output-tail /
artifact per step, **stdin closed**.

---

## One line for `results-summary.md` (report-back to synthesis)

> **EA-X1 (machine probe):** mechanical onboarding path **completed end-to-end** (install →
> `chaos:doctor` `READY_WITH_WARNINGS` → demo API returns seeded data, 0 abandonment). Baseline
> (`8b751b7`) had **1** silent-failure condition (`py -3` hooks silently no-op — doctor-detectable,
> 0 undetected); **both requested fixes applied on `main` (`88954b8`)** — `py -3`→`python` and
> untracked `settings.local.json` — and the **re-run confirms silent failures = 0** with
> `chaos:doctor` **CD-HOOK-05 PASS**. **Still open:** F2 `openspec init` dirties 20 tracked files
> (→ EA-S2), F4 protected-file guard unwired (F5 — the F1 fix's over-broad metadata-hook managed
> set — has since been **fixed**: narrowed set + idempotent stamp + scalar serialization); plus the
> Inferred human stall at *governed* first
> value needing the Decision Center UI. **Human time-to-first-value remains PENDING** (3-dev kit provided).
