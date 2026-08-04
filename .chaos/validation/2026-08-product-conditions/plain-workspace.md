# The plain workspace — what "normal" means, frozen before any plain arm runs

> Toolkit meta-work (no CHAOS governance). Created 2026-08-04. This document defines the
> denominator workspace for the product-conditions comparison and freezes the plain-arm
> predictions. **Nothing here is edited after a plain run exists.**

## 1. Why a separate workspace

The governed arms run in `D:/Proyectos/CHAOS/demo-light`, which carries the full CHAOS
bootstrap: `AGENTS.md`, `.chaos/`, `.claude/` skills and hooks, `.mcp.json`, `openspec/`,
the ported `tools/chaos-*` toolkit, 272 files of `.github` agent instructions, and a README
that opens with the word CHAOS. A "normal" session there is not normal — it may reach for
the governance machinery on its own initiative, or be steered by it. The honest
counterfactual for *"what would this change cost a team not using CHAOS"* is the same
application with the governance layer absent, because a team not using CHAOS would not have
the files.

**Definition: the plain workspace is the demo application at the identical baseline commit,
minus everything that exists because of CHAOS, plus nothing else.**

## 2. Where it is and how it was made

| | |
|---|---|
| Path | `D:/Proyectos/CHAOS/demo-plain` |
| Source | `demo-light` @ **`15de0a9`** (`demo/dotnet` tip: pre-T1 app state — T1 committed then reverted — plus the two toolkit repairs `84c6031`/`15de0a9`, which touch no app code) |
| Extraction | `git archive 15de0a9 TaskTracker.sln src tests .gitignore LICENSE .config` — tracked files only |
| Plain repo | fresh `git init -b main`, single commit `02ff26e` "Task Tracker API" |

**Kept:** `TaskTracker.sln`, `src/`, `tests/`, `LICENSE`, `.config/dotnet-tools.json`,
`.gitignore` (pruned, below), plus a new neutral `README.md` describing only the API.

**Dropped (all of it CHAOS wiring):** `.chaos/`, `.claude/`, `.github/` (agent
instruction sets), `.mcp.json`, `.vscode/` (references `.chaos/` and the MCP server),
`AGENTS.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `docs/`, `examples/`, `extensions/`
(Decision Center), `openspec/`, `tools/` (the ported chaos toolkit),
`build-decision-center-vsix.ps1`.

## 3. Content edits, each recorded (the only divergences from the governed tree)

Rule applied: **app semantics stay identical; only pointers to a governance world that does
not exist in this universe are removed.** Two of these pointers additionally leaked the
exercise itself (they name the `?status=`/`?priority=` filters as "the worked example"),
which would have contaminated T1 in the *helpful* direction.

| File | Edit |
|---|---|
| `src/.../Endpoints/TaskEndpoints.cs` | remark keeps "GET /tasks currently returns EVERY task, unfiltered."; drops the "is the exercise the CHAOS worked example drives" sentence |
| `src/.../TaskTracker.Api.http` | "List all tasks (no filtering yet — the CHAOS demo adds ?status= / ?priority=)" → "List all tasks" |
| `src/.../Domain/TaskItem.cs` | drops the "(The CHAOS apply step reuses this naming …)" parenthetical; the naming rationale itself stays |
| `src/.../Domain/TaskStore.cs` | seed title "Review the CHAOS proposal" → "Review the design proposal" (same state, priority, timestamp; no test asserts titles) |
| `tests/.../TaskEndpointsTests.cs` | header "give the CHAOS apply/verify steps a green baseline" → "as a green baseline" |
| `.gitignore` | CHAOS runtime/interactions and `.claude/settings.local.json` blocks removed (lines 267–287) |
| `README.md` | replaced: the source README documents CHAOS, not the app; the new one documents build/test/run of the API only |

**One structural asymmetry, deliberate and on the record:** the plain repo has a single
neutral commit instead of demo-light's history, whose messages narrate CHAOS ports. A model
that reads `git log` in the governed workspace sees CHAOS; in the plain workspace it sees
nothing. That is the counterfactual working as intended, not a leak.

## 4. Verification (done at creation)

- `grep -ri "chaos\|openspec"` over the tree: **zero matches**.
- `dotnet test`: **34/34 green** — identical to the governed baseline (kit README §2).

## 5. How the plain arms are measured — the instrument stays OUTSIDE

The stopwatch is **not** copied into the workspace and must never be: the counterfactual
repo cannot contain `tools/chaos-*`, and the instrument's independence is the point. The
runtime stamps every transcript record regardless of workspace content. Plain-arm sessions
in `demo-plain` write transcripts under the runtime's project directory for that path
(`…/.claude/projects/d--Proyectos-CHAOS-demo-plain/<session>.jsonl`), and measurement runs
afterwards from this repo:

```text
python tools/chaos-stopwatch/stopwatch.py session <transcript.jsonl> --from-match "<distinctive prompt phrase>"
```

Operator procedure mirrors the governed kit (README §3/§5), minus the wrapper:

1. **Fresh session in `demo-plain`, one session for the sweep.** Same model (opus-5), same
   effort (`high`), same speed (`standard`) — verify all three afterwards in the
   transcript's `effort` and `usage.speed` fields; lever run 2's unrecorded `xhigh` is the
   precedent for why.
2. **Paste each kit prompt verbatim, minus the `/chaos-run "…"` wrapper** — the quoted text
   itself, T1→T5 in order, including T5's deliberate under-specification unchanged. The
   wording is the stopwatch bookmark.
3. **`git add -A && git commit -m "Tn-plain"` after each test**, same reason as governed:
   each test's diff must stand alone.
4. **Close with `runs finished`** so T5's window has an end.
5. **Quality gate:** `dotnet test` green after each test, plus the same implicit contract
   checks the governed arms owe (T1: unrecognised value → 400; T4: exactly 200 accepted).
   A fast plain run that ships a defect is a failure and a data point, not a time.
6. **For T5, record what the plain run silently decided** — it will not stop to ask. The
   interpretation it picks, and whether a maintainer would have wanted the question, is as
   much the result as the minutes (the EA-X2b finding, now under product conditions).

## 6. Frozen predictions for the plain arms (committed before any plain run)

Derived 2026-08-04 from the plain workflow arms (opus-5) × the measured product-conditions
penalty (~1.2–1.6×, governed n=1), cross-checked by token arithmetic (~92 tok/s, ~2 s/call
fixed, measured across 30 governed + 30 plain archived arms):

| Test | Anchor (plain workflow arms) | **Predicted plain, product** | Governed counterpart |
|---|---|---|---|
| T1 priority filter | B2-plain 2.0–2.9 min | **3–5 min** | 23.7 measured; 16–21 re-run predicted |
| T2 due date | P-plains 2.2–5.5 min | **4–6 min** | 14–22 predicted |
| T3 owner scoping | none — never measured | **8–14 min** | 25–40 predicted |
| T4 title max length | B3-plain 1.6–2.1 min (same task) | **2.5–4 min** | 8–16 predicted |
| T5 archive (ambiguous) | none | **5–8 min, no stop** | 12–20 + human wait |

**Direction tests, stated first:**

- Every plain arm should be **faster than its governed counterpart**. If any plain arm is
  not, something is wrong with the arm, not the theory — investigate before comparing.
- **The multiplier should fall as the band rises** (governance's fixed entry cost
  amortizes): expected ~4–6× on T1/T4, ~3–4× on T2, ~2.5–3.5× on T3. A flat or rising
  multiplier curve falsifies the fixed-entry-cost diagnosis under product conditions.
- T5's plain arm completes without asking anything. If it *does* ask, the prompt is less
  ambiguous than designed and T5's governed stop is not evidence of governance value.

## 7. Status log

- 2026-08-04 — workspace created at `02ff26e`, verified (§4), predictions frozen (§6).
  No plain arm has run.
