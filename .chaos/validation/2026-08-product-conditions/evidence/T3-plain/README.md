# T3 plain — run 1, archived 2026-08-04

| | |
|---|---|
| Session | `52633824-494d-4ae3-854f-89ce453b7461` |
| Model / effort / speed | opus-5 · high · standard ✅ |
| **Machine time** | **8.7 min** (522 s) · `humanWait` 0, no questions asked |
| API messages / tool calls / output tokens | 42 / 51 / 32,375 |
| Base | `3b6f397` ("T2") |
| Suite run by the arm | yes — 63/63 |
| **Evaluator oracle** | **7/7 pass** |
| Provenance | **reconstructed** from 25 sequential Edit/Write calls (including six mutation-check edits and their restores) — all anchors matched; the tree was reverted before the plain+ask arm ran |

Full comparison against the plain+ask arm, including both questions it asked and why this arm was
slower: [`../T3-plain-ask/README.md`](../T3-plain-ask/README.md).

## What it did

New `Security/CallerIdentity.cs`, `OwnerId` on `TaskItem` marked `[property: JsonIgnore]`,
ownership threaded through every `TaskStore` operation, `Program.cs` claim mapping plus a
subject-required gate, `TestApiFactory` extended with a per-subject client, and a new 
`TaskOwnershipTests.cs` suite. README updated for the breaking contract change.

**It silently resolved both axes the plain+ask arm stopped for, and landed on the same answers:**
seeds assigned to a fixed `SeedOwnerId = "dev-user"`, and `ownerId` kept out of the wire format.

## The mutation check — work the other arm did not do

Between 17:01:27 and 17:03:10 it deliberately broke the ownership filter in `TaskStore`, re-ran
the ownership suite to confirm the new tests fail against the old behaviour, then restored the
code — *"Let me verify the new tests actually detect the old behaviour."* Six edits, four filtered
test runs, roughly **1.7 min**.

This is real verification value and it is part of why this arm took longer. It is recorded here so
the 8.7-vs-4.9 comparison is not read as pure waste.
