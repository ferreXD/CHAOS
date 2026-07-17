# Decision-Wait Contract

`.chaos/runtime/decision-waits.jsonl` records moments where Claude appears
to be waiting on a user decision (e.g. presenting numbered options and
asking the user to pick one). This is explicitly **best-effort** — Claude
Code hooks cannot reliably inspect assistant output in every context, so
this detection is allowed to miss cases, and nothing in CHAOS blocks on
its absence or presence (`hook-runtime-policy.md`).

## How detection works today

`chaos-stop-summary.py` is the only current writer. On a `Stop` event, if
the hook payload includes a `transcript_path` pointing to a readable file,
the hook reads the **last ~8000 bytes** of that file as raw text (not
parsed against any particular transcript JSON schema — this is
deliberately format-agnostic so it degrades gracefully if the transcript
layout changes) and searches it for these patterns
(`chaos-hook-common.py`'s `DECISION_WAIT_PATTERNS`):

- `Decision required:`
- `^Options:` (start of line)
- `Select one option to continue`
- `Reply with 1`
- a line that is exactly `STOP`

If any pattern matches, a record is appended with:

- `decisionTitle` — best-effort text captured after `Decision required:`
  on the same line, else `""`.
- `optionsCount` — count of lines matching `^\s*\d+\.\s` (a numbered list)
  in the scanned text.
- `recommendedOption` — the number of a line matching
  `^\s*(\d+)\.[^\n]*\(Recommended\)` (case-insensitive), else `""`.
- `source: "assistant-output"`, `status: "waiting"`, `confidence: "LOW"`
  (transcript-tail text scanning is inherently approximate).

A corresponding `CHAOS-HOOK-006` `INFO` entry is also logged to
`hook-violations.jsonl`.

If no `transcript_path` is present in the payload, or the file can't be
read, or nothing matches — nothing is written, and this is not treated as
an error.

## Explicit-marker path (for future command/skill authors)

Because transcript scanning is approximate, `chaos-hook-common.py` exposes
a small importable function for anything that already *knows* it's
presenting a decision and wants to log it precisely instead of relying on
best-effort text scanning:

```python
record_decision_wait(
    repo_root,
    command="chaos:sync",
    change_id="",
    decision_title="Repo-wide sync scope",
    options_count=3,
    recommended_option="1",
    source="explicit-marker",
    status="waiting",
    confidence="HIGH",
)
```

This delivery does not wire this into any CHAOS command/skill prompt —
that integration is out of scope here (see `hook-runtime-policy.md`'s "not
implemented" list). It's documented so a future task can call it directly
(e.g. from a small Python snippet invoked by a command) instead of
inventing a second detection mechanism.

## Why no standalone `chaos-decision-wait.py`

Detection is integrated into `chaos-stop-summary.py` rather than shipped
as a separate script, per the originating task's preference ("prefer
integrating decision-wait detection into stop summary ... unless a
separate file is clearer"). A `Stop` event is also the only point in the
current hook wiring where a `transcript_path` is realistically available
to read.

## Related

- `runtime-file-contract.md` — the full `decision-waits.jsonl` schema.
- `hook-violation-contract.md` — `CHAOS-HOOK-006`.
