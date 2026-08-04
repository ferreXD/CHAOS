#!/usr/bin/env python3
"""chaos-stopwatch — the independent wall-clock instrument for metric M2.

WHY THIS EXISTS: from 2026-08-04 wall clock is the PRIMARY measure and the only thing that
gates a run (docs/design/2026-08-04-metric-rebase.md §3). Every wall-clock figure produced
before this tool was **arm-self-reported** (`date +%s` inside the thing being timed), which
cannot gate anything — a measurement subject must not hold its own stopwatch.

THE CLOCK: every record the runtime writes to a transcript carries a `timestamp` field. The
runtime writes it, not the agent, so it is independent by construction and cannot be
influenced by the arm. Nothing new has to be instrumented at run time; the archived
transcripts of every past run already contain it.

MEASURED vs SELF-REPORTED, on lever run 2 (12 arms): self-report under-states by **+10%
overall**, and the bias is worst on the SHORT arms (+31% on a 128 s arm, +6% on a 1,283 s
arm) — the arm's own bracket misses setup, first-token latency and teardown, a roughly fixed
overhead that is a larger fraction of a small change. That is the wrong direction for a
band-A bar of 5 minutes, which is why self-report was retired.

THREE NUMBERS, and the gate is on `machine`:
  elapsed   last timestamp - first timestamp, over the measured window.
  machine   the sum of turn segments: from each real user prompt to the last record before
            the next one. This is time the *tool* is responsible for, including model
            latency. THIS IS WHAT GATES.
  humanWait elapsed - machine. Time a human spent thinking or typing — including answering a
            CHAOS stop. A governed run must not be failed for a human's deliberation; that
            stop is the product working. Reported, never gated.

In a workflow arm there are no mid-run user prompts, so machine == elapsed. In a real
`chaos:run` from chat/CLI — product conditions, the thing the bar is actually about — they
differ, which is the whole reason the split exists.

CONSERVATIVE BY DESIGN: a record is treated as a real user prompt only when it clearly is
one. Misclassifying a system-injected record as a prompt would *remove* a gap from `machine`
and flatter the result; missing a real prompt only *adds* time. When this tool is unsure it
errs toward reporting CHAOS as slower.

Usage:
    stopwatch.py workflow <dir> [--names A-gov,A-plain,...]
        [--band A=B2,B3] [--band B=P1,P2,P3,B1] [--bar A=5] [--bar B=15] [--json]
    stopwatch.py session <transcript.jsonl>
        [--from-match REGEX] [--to-match REGEX] [--bar 5] [--json]

Exit codes (the digest.py convention): 0 = within bar / no bar given, 1 = bar breached,
2 = usage or data error. A non-zero exit is what makes this a gate rather than a report.
"""

import argparse
import datetime
import json
import os
import re
import sys

DEFAULT_NAMES = [k + s for k in ("P1", "P2", "P3", "B1", "B2", "B3") for s in ("-gov", "-plain")]

# Records that are user-shaped but are not a human taking a turn. Splitting a segment on one
# of these would silently delete real machine time from the gated number.
_WRAPPER_RE = re.compile(
    r"^\s*<(?:local-command-[a-z]+|command-name|command-message|command-args"
    r"|ide_[a-z_]+|system-reminder)\b", re.I)


class DataError(Exception):
    """Raised when the input cannot be measured honestly. Never fall back to a guess."""


def parse_ts(value):
    if not value:
        return None
    try:
        return datetime.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def _text_blocks(message):
    """Every piece of user-authored text in a message, whatever shape it arrived in."""
    content = message.get("content")
    if isinstance(content, str):
        return [content]
    if not isinstance(content, list):
        return []
    out = []
    for block in content:
        if not isinstance(block, dict):
            continue
        if block.get("type") == "text" and isinstance(block.get("text"), str):
            out.append(block["text"])
    return out


def is_real_prompt(rec):
    """True only for a human actually taking a turn — see CONSERVATIVE BY DESIGN above."""
    if rec.get("type") != "user":
        return False
    if rec.get("isMeta") or rec.get("isSidechain"):
        return False
    if rec.get("toolUseResult"):
        return False
    message = rec.get("message")
    if not isinstance(message, dict):
        return False
    content = message.get("content")
    if isinstance(content, list) and any(
            isinstance(b, dict) and b.get("type") == "tool_result" for b in content):
        return False
    blocks = _text_blocks(message)
    if not blocks:
        return False
    # A turn is real if ANY block is human prose rather than a runtime wrapper: a genuine
    # prompt often arrives alongside injected <ide_opened_file> context in the same record.
    return any(b.strip() and not _WRAPPER_RE.match(b) for b in blocks)


def read_records(path):
    """-> [(timestamp, record)] in file order, timestamped records only."""
    out = []
    with open(path, encoding="utf-8", errors="replace") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except ValueError:
                continue
            if not isinstance(rec, dict):
                continue
            stamp = parse_ts(rec.get("timestamp"))
            if stamp is not None:
                out.append((stamp, rec))
    return out


def window(records, from_match=None, to_match=None):
    """Narrow to one command's span, bounded by real prompts matching the given regexes."""
    if not from_match and not to_match:
        return records
    start = 0
    if from_match:
        pattern = re.compile(from_match, re.I)
        start = None
        for i, (_, rec) in enumerate(records):
            if is_real_prompt(rec) and any(pattern.search(b) for b in _text_blocks(rec["message"])):
                start = i
                break
        if start is None:
            raise DataError("--from-match %r matched no user prompt" % from_match)
    end = len(records)
    if to_match:
        pattern = re.compile(to_match, re.I)
        for i in range(start + 1, len(records)):
            _, rec = records[i]
            if is_real_prompt(rec) and any(pattern.search(b) for b in _text_blocks(rec["message"])):
                end = i
                break
        else:
            raise DataError("--to-match %r matched no user prompt after the start" % to_match)
    return records[start:end]


def measure(records):
    """-> {elapsed, machine, humanWait, turns, first, last} in seconds."""
    if not records:
        raise DataError("no timestamped records — nothing to measure")
    stamps = [t for t, _ in records]
    elapsed = (stamps[-1] - stamps[0]).total_seconds()

    # Segment boundaries: each real prompt opens a turn; the turn closes at the last record
    # before the next one. Time between a turn's close and the next prompt is the human's.
    starts = [i for i, (_, rec) in enumerate(records) if is_real_prompt(rec)]
    if not starts or starts[0] != 0:
        starts.insert(0, 0)  # a workflow arm opens with its task, not a user prompt

    machine = 0.0
    for n, begin in enumerate(starts):
        close = (starts[n + 1] - 1) if n + 1 < len(starts) else len(records) - 1
        if close > begin:
            machine += (stamps[close] - stamps[begin]).total_seconds()

    return {"elapsed": round(elapsed, 1),
            "machine": round(machine, 1),
            "humanWait": round(elapsed - machine, 1),
            "turns": len(starts),
            "records": len(records),
            "first": stamps[0].isoformat(),
            "last": stamps[-1].isoformat()}


def ordered_agents(workflow_dir):
    """Agent ids in journal START order.

    NOT sorted filenames: transcripts are named by hash, so sorting shuffles the arms. This
    exact bug once assigned governed reads to plain arms in read-volume.py; it is not
    repeated here, and a missing journal is an error rather than a silent re-order.
    """
    journal = os.path.join(workflow_dir, "journal.jsonl")
    if not os.path.isfile(journal):
        raise DataError(
            "no journal.jsonl in %s — arm order is unrecoverable. Sorting the transcript "
            "filenames would silently mis-assign arms (it has happened before); pass "
            "--allow-unordered only if you have verified the order another way." % workflow_dir)
    order = []
    with open(journal, encoding="utf-8", errors="replace") as handle:
        for line in handle:
            try:
                rec = json.loads(line)
            except ValueError:
                continue
            if rec.get("type") == "started":
                aid = rec.get("agentId") or rec.get("id")
                if aid and aid not in order:
                    order.append(aid)
    if not order:
        raise DataError("journal.jsonl in %s has no 'started' events" % workflow_dir)
    return order


def agent_files(workflow_dir, allow_unordered=False):
    present = {n[len("agent-"):-len(".jsonl")]: os.path.join(workflow_dir, n)
               for n in os.listdir(workflow_dir)
               if n.startswith("agent-") and n.endswith(".jsonl")}
    if not present:
        raise DataError("no agent-*.jsonl transcripts in %s" % workflow_dir)
    if allow_unordered:
        return [present[k] for k in sorted(present)]
    return [present[a] for a in ordered_agents(workflow_dir) if a in present]


def parse_pairs(values, what):
    """--band A=B2,B3 / --bar A=5 -> {'A': [...]} / {'A': 5.0}"""
    out = {}
    for raw in values or []:
        if "=" not in raw:
            raise DataError("bad --%s %r — expected NAME=VALUE" % (what, raw))
        key, _, rest = raw.partition("=")
        key = key.strip()
        if not key:
            raise DataError("bad --%s %r — empty name" % (what, raw))
        out[key] = [p.strip() for p in rest.split(",") if p.strip()] if what == "band" \
            else float(rest)
    return out


def _verdict(minutes, bar):
    if bar is None:
        return None, False
    if minutes <= bar:
        return "PASS (%.1f/%.0f min)" % (minutes, bar), False
    return "FAIL %.1fx (%.1f/%.0f min)" % (minutes / bar, minutes, bar), True


def cmd_workflow(args):
    files = agent_files(args.workflow_dir, args.allow_unordered)
    names = (args.names.split(",") if args.names else DEFAULT_NAMES)
    if len(names) < len(files):
        raise DataError("%d transcripts but only %d names — refusing to guess which arm is "
                        "which (pass --names)" % (len(files), len(names)))

    arms = {}
    for name, path in zip(names, files):
        arms[name.strip()] = measure(read_records(path))

    bands = parse_pairs(args.band, "band")
    bars = parse_pairs(args.bar, "bar")
    for band, members in bands.items():
        for m in members:
            if m + "-gov" not in arms:
                raise DataError("band %s names %r, which is not a measured arm" % (band, m))

    report = {"source": os.path.abspath(args.workflow_dir), "clock": "runtime timestamps",
              "arms": arms, "bands": {}, "breached": False}
    for band, members in bands.items():
        govs = [arms[m + "-gov"]["machine"] for m in members]
        plains = [arms[m + "-plain"]["machine"] for m in members if m + "-plain" in arms]
        mean_min = sum(govs) / len(govs) / 60.0
        bar = bars.get(band)
        text, breached = _verdict(mean_min, bar)
        report["breached"] = report["breached"] or breached
        report["bands"][band] = {
            "members": members, "changes": len(govs),
            "meanMinPerChange": round(mean_min, 1),
            "maxMinPerChange": round(max(govs) / 60.0, 1),
            "worstArm": members[govs.index(max(govs))],
            "planMeanMinPerChange": round(sum(plains) / len(plains) / 60.0, 1) if plains else None,
            "timeRatio": round(sum(govs) / sum(plains), 2) if plains else None,
            "bar": bar, "verdict": text,
            "armsOverBar": [m for m, s in zip(members, govs) if bar and s / 60.0 > bar]}
    return report


def cmd_session(args):
    records = window(read_records(args.transcript), args.from_match, args.to_match)
    result = measure(records)
    minutes = result["machine"] / 60.0
    text, breached = _verdict(minutes, args.bar)
    return {"source": os.path.abspath(args.transcript), "clock": "runtime timestamps",
            "conditions": "product (main session)", "run": result,
            "machineMin": round(minutes, 1), "elapsedMin": round(result["elapsed"] / 60.0, 1),
            "humanWaitMin": round(result["humanWait"] / 60.0, 1),
            "bar": args.bar, "verdict": text, "breached": breached}


def render(report):
    lines = []
    if "arms" in report:
        lines.append("%-10s %9s %9s %9s %6s" % ("arm", "machine", "elapsed", "humanWait", "turns"))
        for name, m in report["arms"].items():
            lines.append("%-10s %8.0fs %8.0fs %8.0fs %6d"
                         % (name, m["machine"], m["elapsed"], m["humanWait"], m["turns"]))
        if report["bands"]:
            lines.append("")
            lines.append("%-6s %7s %9s %9s %8s  %s"
                         % ("band", "changes", "mean/chg", "max/chg", "ratio", "verdict"))
            for band, b in report["bands"].items():
                lines.append("%-6s %7d %7.1f m %7.1f m %7s  %s"
                             % (band, b["changes"], b["meanMinPerChange"], b["maxMinPerChange"],
                                ("%.2fx" % b["timeRatio"]) if b["timeRatio"] else "-",
                                b["verdict"] or "(no bar)"))
                if b["armsOverBar"]:
                    lines.append("       over bar individually: %s" % ", ".join(b["armsOverBar"]))
    else:
        r = report["run"]
        lines.append("machine   %8.0fs  = %5.1f min   <- GATED" % (r["machine"], report["machineMin"]))
        lines.append("elapsed   %8.0fs  = %5.1f min" % (r["elapsed"], report["elapsedMin"]))
        lines.append("humanWait %8.0fs  = %5.1f min   (never gated)"
                     % (r["humanWait"], report["humanWaitMin"]))
        lines.append("turns     %8d   records %d" % (r["turns"], r["records"]))
        lines.append("verdict   %s" % (report["verdict"] or "(no bar given)"))
    return "\n".join(lines)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)

    w = sub.add_parser("workflow", help="measure the arms of a workflow run")
    w.add_argument("workflow_dir")
    w.add_argument("--names", default=None, help="comma list, in journal start order")
    w.add_argument("--band", action="append", help="NAME=arm,arm (repeatable)")
    w.add_argument("--bar", action="append", help="NAME=minutes (repeatable)")
    w.add_argument("--allow-unordered", action="store_true",
                   help="fall back to sorted filenames; see ordered_agents() before using")
    w.add_argument("--json", action="store_true")

    s = sub.add_parser("session", help="measure a real chaos:run under product conditions")
    s.add_argument("transcript")
    s.add_argument("--from-match", default=None, help="regex on a user prompt; starts the window")
    s.add_argument("--to-match", default=None, help="regex on a user prompt; ends the window")
    s.add_argument("--bar", type=float, default=None, help="minutes; breach exits 1")
    s.add_argument("--json", action="store_true")

    args = ap.parse_args(argv)
    try:
        report = cmd_workflow(args) if args.cmd == "workflow" else cmd_session(args)
    except DataError as exc:
        sys.stderr.write("error: %s\n" % exc)
        return 2
    except OSError as exc:
        sys.stderr.write("error: %s\n" % exc)
        return 2

    if args.json:
        json.dump(report, sys.stdout, indent=2)
        print()
    else:
        print(render(report))
    return 1 if report.get("breached") else 0


if __name__ == "__main__":
    sys.exit(main())
