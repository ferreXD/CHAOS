# T4 — band A, second sample, both arms, archived 2026-08-04

**The arm asked nothing — and said so.** First exercise of the null path the prompt deliberately
allows, and the strongest available evidence that the standing instruction does not manufacture
questions.

| | Plain | **Plain+ask** |
|---|---:|---:|
| Session | `600755b0` | `f36d1eea` |
| Model / effort / speed | opus-5 · high · standard ✅ | opus-5 · high · standard ✅ |
| **Machine time** | **1.8 min** (109 s) | **1.7 min** (100 s) |
| Tool-mediated human answering | — | **0 s — no question asked** |
| API messages / tools / output tokens | 14 / 15 / 6,888 | 13 / 14 / 6,652 |
| Suite run by the arm | 66/66 (4 new) | 67/67 (6 new) |
| **Evaluator oracle** ([`../../oracles/T4ContractOracleTests.cs`](../../oracles/T4ContractOracleTests.cs)) | **7/7** | **7/7** |
| Questions asked | 0 | **0 — explicitly declined** |
| Provenance | **reconstructed** from 7 Edit/Write calls, all anchors matched | committed as `c16f000` |

Base for both: `daedf5d` ("T3"). **Asking cost −0.1 min** — inside noise; the arms are the same run.

## The null answer

> **Nothing in this needed a maintainer's call** — the spec pinned the limit, the status code, and
> the boundary behavior, and the codebase already had one obvious place for the check. So I
> implemented it directly.

[`../../plain-ask-arm.md` §2](../../plain-ask-arm.md) refused to write *"ask me at least one
question"* on the grounds that *"a run that finds nothing material must be free to say so. Forcing
a question guarantees a question and destroys the result."* T4 is the case that tests it, and the
arm took the null path unprompted on the one task in the kit whose prompt genuinely pins limit,
status code and boundary.

Together with T1–T3 (1, 1 and 2 questions, all material), question precision across four tasks is
**4 asked, 4 material, 0 spurious** — the falsification of the frozen selectivity prediction
(*"asks more questions than CHAOS, smaller material share"*) is now four tasks deep.

## Both arms converged, again — including on what to disclose

Near-identical implementations: a `MaxTitleLength = 200` constant and a shared `ValidateTitle`
helper folding the pre-existing blank-title check together with the new length check, called from
both POST and PUT, blank checked first so an empty title keeps its original message.

Differences are cosmetic:

| | Plain | Plain+ask |
|---|---|---|
| Error text | `"Title must be 200 characters or fewer (got 201)."` | `"Title must be 200 characters or fewer, but was 201."` |
| Tests | 4, in a new `TaskTitleLengthTests.cs` | 6, appended to `TaskEndpointsTests.cs` |
| Docs | also updated `TaskRequests.cs` doc comments | — |

**Both disclosed exactly two decisions, unprompted, and one of them is the same one:**

- Both: `string.Length` counts **UTF-16 code units**, so an emoji costs 2 — "the conventional .NET
  reading of 200 characters" — with an offer to switch to `StringInfo` for graphemes.
- Plain only: length is measured **untrimmed**, because the store persists the untrimmed title.
- Plain+ask only: the **32 KB body limit** in `Program.cs` still fires first for genuinely huge
  payloads, returning 413 rather than 400.

On this task the plain arm disclosed *as much* as the plain+ask arm. The disclosure difference the
earlier tasks showed is not a property of the instruction alone.

## Frozen-prediction check

- **Plain T4 predicted 2.5–4 min** ([`../../plain-workspace.md` §6](../../plain-workspace.md)) →
  **1.8 min**. Over-predicted. Running tally of plain-family duration predictions: **4 of 5 miss
  high**, T3 the only one inside its band.
- **Governed T4 has not run.** Predicted 8–16 min; against 1.8 that is **4.4–8.9×**, and against
  the 23.7 min that band A actually cost on T1 it would be **13.2×**.
- Band A is the direction test's high end: T1 measured **15.8×**, T2 projects 6.1–9.6×, T3 projects
  2.9–4.6×. **T4 should come back high again if the fixed-entry-cost diagnosis holds.** A cheap T4
  would falsify it.
