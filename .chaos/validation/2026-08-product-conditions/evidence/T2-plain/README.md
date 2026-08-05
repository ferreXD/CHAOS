# T2 plain — run 1, archived 2026-08-04

| | |
|---|---|
| Session | `ccfb4ab5-66fd-47e1-a9b1-1ea614860ec9` |
| Model / effort / speed | opus-5 · high · standard ✅ |
| **Machine time** | **2.3 min** (136 s) · `humanWait` 0, no questions asked |
| API messages / tool calls / output tokens | 12 / 20 / **10,204** |
| Base | `5f3ef0f` ("T1") — see the note below |
| Suite run by the arm | yes — 49/49 (6 new) |
| **Evaluator oracle** ([`../../oracles/T2ContractOracleTests.cs`](../../oracles/T2ContractOracleTests.cs)) | **6/6 pass** |
| Provenance | **reconstructed** from the transcript's 8 Edit calls — the tree was reverted before the plain+ask arm ran. All 8 anchors matched exactly. |

## What it did

`DateTimeOffset? DueDate` on the record (placed before `CreatedAt`, "keeping the system-assigned
`CreatedAt` last"), optional `dueDate` on both request contracts and on `TaskStore.Add`/`Update`
with `= null` defaults so the four seed calls are untouched. Endpoint passes it through on POST
and PUT. Updated `.http` and `README.md` as well.

**No questions asked.** It chose `DateTimeOffset?` silently — the same type the plain+ask arm
stopped to ask about, and the same one the operator picked.

Its closing summary did flag one choice unprompted: *"No new validation: any date is accepted,
since none was specified."*

## Base note — the arms share a plain+ask ancestor

Both T2 arms ran on `5f3ef0f`, which is byte-identical to the **plain+ask T1** delivery
([`../T1-plain-ask/run1.diff`](../T1-plain-ask/README.md), verified). The T2 comparison is
therefore sound — both arms start from the same code — but **there is no pure plain-only
cumulative trajectory in this workspace**, and there will not be one unless a separate lineage is
kept.

Minor asymmetry, recorded: T1 was committed 13 s *after* this run's prompt, so this arm ran
`git diff` at 16:15:31 and saw T1's changes as uncommitted work; the plain+ask arm started after
the commit and never ran `git diff`. Same content either way.
