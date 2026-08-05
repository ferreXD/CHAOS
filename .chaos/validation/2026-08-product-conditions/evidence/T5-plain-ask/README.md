# T5 plain+ask — **VOID: contaminated by the plain arm's output**. Must be re-run.

| | |
|---|---|
| Session | `f4ddc91c-00f2-45ab-83b4-fd5bfb011b31` |
| Model / effort / speed | opus-5 · high · standard ✅ |
| Machine time | 4.2 min (251 s) — **not comparable** |
| Questions asked | 0 — **for the wrong reason** |
| Suite | 92/92 (verified independently) |
| Status | **void as a T5 sample** |

## What happened

The tracked files were reverted to `c16f000` before this run, but the plain arm's **untracked
`tests/TaskTracker.Tests/TaskArchiveTests.cs` was left in the working tree**. `git checkout .`
restores tracked files and leaves untracked ones behind; nothing in the procedure catches that.

The arm found it in its second tool call and said so, unprompted:

> *Interesting — there's an untracked `TaskArchiveTests.cs`. Let me read the source and that test file.*
> *The test file reads as a complete spec.*

and then, in place of asking:

> **No blocking decision here** — the untracked `TaskArchiveTests.cs` already spells out the whole
> contract (routes, filter vocabulary, idempotency, ownership, PUT semantics, even which seed ships
> archived), so the things I'd otherwise have to guess at are settled. Implementing it directly.

**Every decision T5 exists to probe had already been made by the previous arm and was sitting in
the tree as 22 executable assertions.** The run then reimplemented that spec and passed 92/92.

## Why this is void rather than merely noisy

T5 is the only test in the kit whose *entire* content is the ambiguity — [`../../README.md` §3](../../README.md)
calls the under-specification "the instrument". A tree that contains the answers removes the
instrument. The 4.2 min is the cost of implementing a written spec, not of resolving an
under-specified request, and the zero questions say nothing about whether the arm would ask when
the answers are absent.

**One thing it does show, weakly:** the arm's *calibration* was correct on the facts available —
given a complete spec in the tree, declining to ask is the right call, and it is the second time
the arm has taken the null path with an explicit reason ([`../T4-plain-ask/`](../T4-plain-ask/README.md)
is the first, and that one is valid). It is evidence about the arm's judgement, not about T5.

## Re-run requirements

1. **`git clean -fd` as well as `git checkout .`** before the arm starts, and verify with
   `git status --porcelain` returning empty. Add this to the procedure — every prior arm pair got
   away with it only because earlier tasks produced no untracked files, and T3's
   `TaskOwnershipTests.cs`/`CallerIdentity.cs` were committed rather than reverted.
2. Base `c16f000` ("T4"), clean.
3. Same clause: opus-5 · high · standard, prompt verbatim.
4. **Archive before reverting** — this arm's tree was captured, but only because it was still
   uncommitted when the evaluation ran.

## Recorded anyway, for the file

The delivered tree passes 92/92 and implements the same archive design as the plain arm — which is
unsurprising, since it was implementing that arm's tests. `run1.diff` holds the captured working
tree at evaluation time (the arm's source edits plus the plain arm's untracked test file).
