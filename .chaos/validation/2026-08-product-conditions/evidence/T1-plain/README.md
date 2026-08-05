# T1 plain arm — three runs, archived 2026-08-04

Diffs against the plain baseline `02ff26e` (`D:/Proyectos/CHAOS/demo-plain`). Transcripts live
under `C:/Users/monch/.claude/projects/d--Proyectos-CHAOS-demo-plain/`.

| File | Session | Model / effort | Machine time | Provenance |
|---|---|---|---:|---|
| `run1-opus.diff` | `35c4c053-a521-480c-beff-8b9c57e7b9c2` | opus-5 · high · standard | **1.5 min** (88.8 s) | **reconstructed** from the transcript's Edit calls — reverted before archiving |
| `run2-haiku.diff` | `88f61ca8-ef28-4991-9d44-b83466f1855c` | haiku-4-5 · *effort field absent* · standard | **0.4 min** (25.5 s) | **reconstructed** from the transcript's single Edit — reverted before archiving |
| `run3-opus.diff` | `25b55d4b-9c5f-4288-9229-1ab325c6f06c` | opus-5 · high · standard | **1.5 min** (91.2 s) | captured from the live working tree before rollback |

Each run started from a clean baseline tree and pasted the T1 prompt verbatim. Timing:
`stopwatch.py session <transcript> --from-match "optional \?priority="`, `humanWait` 0 in all
three (single turn each).

## Results against the evaluator oracle

[`../../oracles/T1ContractOracleTests.cs`](../../oracles/T1ContractOracleTests.cs), applied to
each reconstructed tree and built:

| | Suite run by the arm? | Tests added | Oracle |
|---|---|---:|---|
| run1-opus | yes — 41/41 | 7 | **8/8 pass** |
| run2-haiku | **no — never built** | 0 | **5/8 — 3 FAIL** |
| run3-opus | yes — 42/42 | 8 | **8/8 pass** |

**run2-haiku ships a live contract violation.** `Enum.TryParse<TaskPriority>(…, ignoreCase: true)`
with no `IsDefined` guard accepts underlying numbers and comma combinations, so `?priority=0`,
`?priority=99` and `?priority=Low,High` all return **200** where the prompt requires **400**. It
is the same defect the governed arm's floor tier produced and its ceiling tier caught at review
([`../../results-T1.md` §6](../../results-T1.md)) — here nothing was above it. It also breaks the
model/effort clause of [`plain-workspace.md` §5](../../plain-workspace.md), so it is **void as a
denominator sample** and is kept as a cheap-tier probe.

## The divergence that mattered

On an axis the prompt never settles — a present-but-empty `?priority=` — the two valid opus runs
chose **opposite** behaviours, silently, at identical model and effort:

- **run1** → `TryParsePriority("")` fails → **400** (RUN-DEC-001 option **A**)
- **run3** → `string.IsNullOrEmpty` → returns everything → **200** (RUN-DEC-001 option **C**)

The governed arm stopped and asked exactly this, folded with case sensitivity, and pinned the
answer as C-004/C-005. All three plain runs matched C-004 (case-insensitive) unaided; 2 of 3
matched C-005. This is the evidence that motivated [`../../plain-ask-arm.md`](../../plain-ask-arm.md).
