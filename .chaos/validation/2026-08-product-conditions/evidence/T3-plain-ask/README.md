# T3 — the band-C task, both arms, archived 2026-08-04

**The result that inverts T1 and T2: on the largest task, asking made the run *faster*.**

| | Plain | **Plain+ask** |
|---|---:|---:|
| Session | `52633824` | `5cf35f0f` |
| Model / effort / speed | opus-5 · high · standard ✅ | opus-5 · high · standard ✅ |
| Stopwatch machine (raw) | 8.7 min (522 s) | 9.5 min (568 s) |
| Tool-mediated human answering | — | **275.3 s** (4.6 min), charged to `machine` |
| **True machine** | **8.7 min** | **4.9 min** |
| API messages / tools / output tokens | 42 / 51 / 32,375 | **15 / 31 / 23,542** |
| Suite run by the arm | 63/63 | 62/62 (11 new) |
| **Evaluator oracle** ([`../../oracles/T3ContractOracleTests.cs`](../../oracles/T3ContractOracleTests.cs)) | **7/7** | **7/7** |
| Questions asked / material | 0 / — | **2 / 2** |
| Provenance | **reconstructed** from 25 sequential Edit/Write calls, all anchors matched | committed as `daedf5d` |

Base for both: `3b6f397` ("T2").

**Asking did not cost 0.8 min — it saved 3.8 min, 44% of the plain arm's machine time**, on 27%
fewer output tokens and 64% fewer API round-trips. This is the first arm pair in the program where
the governed-shaped behaviour is *cheaper* than the ungoverned one.

## The two questions

Asked together in one stop, 41 s into the run, after ten reads and before any edit:

> **1. The store seeds 4 tasks at startup with no owner. Once tasks are owned, who owns those seeds?**
> *Drop the seeds entirely* — `TaskStore` starts empty; cleanest, but `GET /tasks` returns `[]` on
> first run and 3 existing tests get rewritten. · *Assign seeds to a fixed owner id* — seeds get a
> literal owner such as `"dev-user"` (the sub `/dev/token` issues); visible locally, invisible to
> everyone else. · *Seed per caller on first request* — each new subject gets its own copy; demo
> stays lively but puts identity-aware behaviour into a plain container.
>
> **2. Should the owner id appear in the task JSON returned to callers?**
> *No — keep it internal (Recommended)* — stored and filtered on, not serialized; since a caller
> only ever sees their own tasks, the field tells them nothing they don't know. · *Yes — add
> `ownerId` to responses* — visible and debuggable, forward-compatible with shared tasks, but an
> additive contract change on top of the breaking one.

Answered **"Assign seeds to a fixed owner id"** and **"No — keep it internal"**. Human gap 275.3 s.

**Question 1 is the real find.** The prompt says nothing about the four seeded tasks, and once
ownership exists they are unreachable orphans. It is exactly the kind of pre-existing-data question
a breaking change creates and a task description never mentions.

## Both arms reached the same design anyway — again

| | Plain | Plain+ask |
|---|---|---|
| Seed ownership | `SeedOwnerId = "dev-user"` | `SeedOwnerId = "dev-user"` |
| Owner in JSON | `[property: JsonIgnore] string OwnerId` | `[property: JsonIgnore] string OwnerId` |
| Missing `sub` | 401 | 401 |
| Cross-owner read/update/delete | 404 | 404 |
| Failed delete | `NoContent` / `NotFound` | `NoContent` / `NotFound` |
| Identity helper | `CallerIdentity.TryGetOwnerId(caller, out id)` — static | `user.TryGetOwnerId(out id)` — extension method |

**Three tasks, three question sets, zero behavioural divergence.** Every axis the plain+ask arm
stopped for, the plain arm settled the same way unaided — including both of T3's, where the seed
question had three genuinely different answers available. The only counterexample in the whole
series remains T1's plain runs disagreeing *with each other* on the empty-value axis
([`../T1-plain/`](../T1-plain/README.md)).

## Why the plain arm took longer

Its trace shows where the extra 3.8 minutes went, and **not all of it is waste**:

- **~2.4 min of exploration** before the first edit (15 reads, with 46 s and 73 s deliberation
  gaps), against the ask arm's 41 s. It was solving the seed problem alone.
- **~1.7 min on a mutation check** (17:01:27–17:03:10): it deliberately broke `TaskStore`'s
  ownership filter, re-ran the ownership suite to confirm the new tests actually fail, then
  restored — *"Let me verify the new tests actually detect the old behaviour."* Six edits and
  four test runs.

**The ask arm did not do a mutation check.** So the comparison is not clean: the plain arm bought
something real with part of its extra time. The honest reading is that the stop replaced
exploratory deliberation, not verification — and the arm that had its ambiguity resolved up front
spent its budget differently, not merely less.

## Frozen-prediction check

- **Plain T3 predicted 8–14 min** ([`../../plain-workspace.md` §6](../../plain-workspace.md), the
  one band with no anchor — *"none — never measured"*) → **8.7 min**. **The first plain-family
  prediction to land inside its band**, and the only one that was not extrapolated from a measured
  arm.
- **Governed T3 has not run.** Predicted 25–40 min; against 8.7 that is a **2.9–4.6×** multiplier,
  against the ask arm's 4.9 it is **5.1–8.2×**.
- The §6 direction test — *the multiplier falls as the band rises* — remains live: T1 measured
  15.8×, T2 projects 6.1–9.6×, T3 projects 2.9–4.6×.
