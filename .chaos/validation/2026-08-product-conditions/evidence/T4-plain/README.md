# T4 plain — run 1, archived 2026-08-04

| | |
|---|---|
| Session | `600755b0-56c6-4e29-bb19-ff1e4652a0c7` |
| Model / effort / speed | opus-5 · high · standard ✅ |
| **Machine time** | **1.8 min** (109 s) · `humanWait` 0, no questions asked |
| API messages / tool calls / output tokens | 14 / 15 / 6,888 |
| Base | `daedf5d` ("T3") |
| Suite run by the arm | yes — 66/66 (4 new) |
| **Evaluator oracle** | **7/7 pass** |
| Provenance | **reconstructed** from 7 Edit/Write calls, all anchors matched; the tree was reverted before the plain+ask arm ran |

Full comparison against the plain+ask arm — which asked nothing and said so — at
[`../T4-plain-ask/README.md`](../T4-plain-ask/README.md).

## What it did

`MaxTitleLength = 200` constant plus a shared `ValidateTitle` helper folding the pre-existing
blank-title check together with the new length check, called from POST and PUT — *"sharing it keeps
the two verbs from drifting on what a valid title is"*. Four tests in a new
`TaskTitleLengthTests.cs` (200 accepted, 201 rejected, on each verb, with no-side-effect
assertions), and the cap noted in the `TaskRequests.cs` doc comments.

## It disclosed two decisions unprompted

- **Length is measured untrimmed** — the store persists the untrimmed title, so trimming for the
  check would let the API accept a title it then returns at a different length.
- **`string.Length` is UTF-16 code units**, so an astral character counts as 2 — *"the conventional
  .NET reading of '200 characters' … but if you meant grapheme clusters, say so and I'll switch to
  `StringInfo`."*

The second is the same disclosure the plain+ask arm made. On this task the two arms disclosed the
same amount.
