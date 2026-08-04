# chaos-stopwatch — the independent wall-clock instrument (metric M2)

Wall clock is the **primary measure and the only gate** from 2026-08-04
([`docs/design/2026-08-04-metric-rebase.md`](../../docs/design/2026-08-04-metric-rebase.md) §3).
Every figure before this tool was **arm-self-reported** (`date +%s` inside the thing being
timed), which cannot gate anything. Stdlib only, own tests (29).

## The clock

Every record the runtime writes to a transcript carries a `timestamp`. **The runtime writes it,
not the agent** — independent by construction, impossible for an arm to influence, and already
present in every archived run. No new run-time instrumentation was needed.

**Self-report under-states by +6% to +31%**, worst on the *shortest* arms (a fixed setup /
first-token / teardown overhead the arm's own bracket misses is a bigger fraction of a small
change). That is the wrong direction for a 5-minute band-A bar, which is why it was retired.

## Three numbers; the gate is on `machine`

| | |
|---|---|
| `elapsed` | last − first timestamp over the window |
| `machine` | Σ turn segments: each real user prompt → the last record before the next one. Includes model latency. **THIS GATES.** |
| `humanWait` | `elapsed − machine`. A human thinking, including answering a CHAOS stop — that stop is the product working, so it is **reported, never gated**. |

In a workflow arm there is no mid-run prompt, so `machine == elapsed`. In a real `chaos:run`
they differ, which is the point.

**Conservative by design:** a record counts as a real prompt only when it clearly is one.
Over-detecting would *delete* machine time and flatter the result; under-detecting only adds
time. When unsure the tool reports CHAOS as slower.

## Usage

```text
stopwatch.py workflow <dir> [--names A-gov,A-plain,...]
    [--band A=B2,B3] [--bar A=5] [--json] [--allow-unordered]
stopwatch.py session <transcript.jsonl>
    [--from-match REGEX] [--to-match REGEX] [--bar 5] [--json]
```

Exit codes follow `digest.py`: **0** within bar / no bar, **1** bar breached, **2** usage or
data error. The non-zero exit is what makes this a gate rather than a report.

Arms are ordered by **journal start order, never sorted filenames** — transcripts are
hash-named, and sorting once mis-assigned governed reads to plain arms in `read-volume.py`. A
missing `journal.jsonl` is an error, not a silent re-order; `--allow-unordered` is opt-in.

## Status

- 2026-08-04 — built. Validated against lever run 2 (12 arms), then used to re-measure **all 12
  RUNKIT rows** under one clock. Each row was identified by a falsification test — self-report
  must be ≤ measured, since the arm's bracket is a sub-interval of its own transcript — and all
  12 mapped unambiguously. Series and corrections in the rebase doc §6.
