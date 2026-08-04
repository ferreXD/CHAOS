#!/usr/bin/env python3
"""Decompose an arm's OUTPUT TOKENS into reasoning vs visible work, and attribute the
deliberation to what it was for.

WHY THIS EXISTS: every prior stage in this program attributed cost by **bytes on disk**
(`attribute-arm.py`). That proxy can only see artifacts, so it structurally cannot answer
"where does a governed arm's output actually go?" — it under-counts everything that never
lands in a file. This reads the agent transcripts instead:

  output_tokens (per assistant message, authoritative from usage)
    = visible content (text + tool-call inputs, measurable)
    + reasoning (thinking blocks — REDACTED in the transcript: content is empty, only a
      signature survives, but the tokens are still billed and still counted in output_tokens)

so reasoning is recovered by difference. `visible tokens ~ visible chars / CPT`; the default
3.5 is a proxy, and `--sensitivity` reports the conclusion across a range so no finding rests
on the constant.

Deliberation turns carry no tool call of their own (the model thinks in dedicated turns, then
acts), so each burst is attributed to the NEXT action taken, looking ahead up to 3 messages.

Usage:
    python decompose-output.py <workflow-transcript-dir> [--cpt 3.5] [--sensitivity]

The arm order is the journal's agent-start order, which for this kit is
P1-gov, P1-plain, P2-gov, ... — pass --names to override.
"""

import argparse
import collections
import json
import os
import sys

DEFAULT_NAMES = [k + s for k in ("P1", "P2", "P3", "B1", "B2", "B3") for s in ("-gov", "-plain")]


def _action(block):
    """What a tool_use block DOES, in loop terms (None for non-tool blocks)."""
    if block.get("type") != "tool_use":
        return None
    name = block.get("name")
    inp = block.get("input") or {}
    path = (inp.get("file_path") or "").replace("\\", "/").lower()
    cmd = (inp.get("command") or "").lower()
    if name in ("Write", "Edit", "MultiEdit"):
        if "/records/" in path:
            return "author records"
        if "decision-events" in path:
            return "author ledger/decisions"
        if "/.tmp/" in path:
            return "author classifier payload"
        if "/openspec/" in path:
            return "author openspec"
        if "/adr/" in path or path.rsplit("/", 1)[-1].startswith("adr"):
            return "author ADR"
        if "/src/" in path or "/tests/" in path:
            return "write code/tests"
        return "author other"
    if name == "Bash":
        # L3/L4 note: the Stage-D copy of this script predates chaos-scan/chaos-record, so
        # `python tools/chaos-scan/scan.py ...` fell into "scan prep / other bash" and made the
        # wrapper look like the very hand-rolled prep it replaced. These two entries are added
        # here and NOWHERE ELSE; Stage-D transcripts contain no such calls, so re-running the
        # older run through this script yields identical numbers (verified).
        for needle, label in (("chaos-scan/scan.py", "run scan tool (L3)"),
                              ("chaos-record/record.py", "run record tool (L4)"),
                              ("chaos-digest/digest.py", "run digest check (L2)"),
                              ("classify.py", "run classifier"), ("audit.py", "run audit"),
                              ("render.py", "run renderer"), ("dotnet", "build/test")):
            if needle in cmd:
                return label
        return "scan prep / other bash"
    if name in ("Read", "Grep", "Glob"):
        return "read governance/code"
    if name == "StructuredOutput":
        return "return telemetry (harness)"
    return str(name)


def read_arm(path):
    """(output_tokens, visible_chars, thinking_blocks, deliberation-by-next-action)."""
    msgs, out_tokens = [], 0
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            try:
                rec = json.loads(line)
            except ValueError:
                continue
            msg = rec.get("message") or {}
            if msg.get("role") != "assistant":
                continue
            out_tokens += (msg.get("usage") or {}).get("output_tokens", 0) or 0
            msgs.append([b for b in (msg.get("content") or []) if isinstance(b, dict)])

    visible, thinking, by_next = 0, 0, collections.Counter()
    for i, blocks in enumerate(msgs):
        n_think = 0
        for b in blocks:
            kind = b.get("type")
            if kind == "text":
                visible += len(b.get("text", ""))
            elif kind == "tool_use":
                visible += len(json.dumps(b.get("input") or {}))
            elif kind == "thinking":
                n_think += 1
        thinking += n_think
        if n_think:
            nxt = None
            for j in range(i, min(i + 3, len(msgs))):
                acts = [a for a in (_action(b) for b in msgs[j]) if a]
                if acts:
                    nxt = acts[0]
                    break
            by_next[nxt or "terminal/none"] += n_think
    return out_tokens, visible, thinking, by_next


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("transcript_dir")
    ap.add_argument("--cpt", type=float, default=3.5, help="chars per token for visible content")
    ap.add_argument("--names", default=",".join(DEFAULT_NAMES))
    ap.add_argument("--sensitivity", action="store_true")
    args = ap.parse_args()

    journal = os.path.join(args.transcript_dir, "journal.jsonl")
    if not os.path.exists(journal):
        sys.exit("no journal.jsonl in %s" % args.transcript_dir)
    order = []
    with open(journal, encoding="utf-8", errors="replace") as f:
        for line in f:
            try:
                rec = json.loads(line)
            except ValueError:
                continue
            if rec.get("type") == "started":
                order.append(rec.get("agentId"))

    names = args.names.split(",")
    groups = {"gov": collections.Counter(), "plain": collections.Counter()}
    delib = collections.Counter()
    print("%-10s %8s %9s %8s %8s %6s" % ("arm", "outTok", "visChars", "visTok~", "reason~", "%reas"))
    for name, agent_id in zip(names, order):
        path = os.path.join(args.transcript_dir, "agent-%s.jsonl" % agent_id)
        if not os.path.exists(path):
            continue
        out, vis, think, by_next = read_arm(path)
        vis_tok = vis / args.cpt
        reason = out - vis_tok
        print("%-10s %8d %9d %8.0f %8.0f %5.1f%%"
              % (name, out, vis, vis_tok, reason, 100 * reason / out if out else 0))
        key = "gov" if name.endswith("-gov") else "plain"
        groups[key].update({"out": out, "vis": vis, "think": think})
        if key == "gov":
            delib.update(by_next)

    print()
    for label in ("gov", "plain"):
        g = groups[label]
        if not g["out"]:
            continue
        vis_tok = g["vis"] / args.cpt
        print("%-6s outTok %s | visible ~%.1f%% | REASONING ~%.1f%% | %d deliberation turns"
              % (label.upper(), format(g["out"], ","), 100 * vis_tok / g["out"],
                 100 * (g["out"] - vis_tok) / g["out"], g["think"]))

    if groups["gov"]["out"] and groups["plain"]["out"]:
        gv, pv = groups["gov"], groups["plain"]
        rg = gv["out"] - gv["vis"] / args.cpt
        rp = pv["out"] - pv["vis"] / args.cpt
        print("\nratios governed:plain -> outTok %.2fx | visible %.2fx | REASONING %.2fx"
              % (gv["out"] / pv["out"], gv["vis"] / pv["vis"], rg / rp))
        if args.sensitivity:
            print("\nsensitivity to chars/token (the conclusion must not depend on it):")
            print("  cpt   gov reasoning%   plain reasoning%   reasoning ratio")
            for cpt in (3.0, 3.5, 4.0, 4.5):
                a = gv["out"] - gv["vis"] / cpt
                b = pv["out"] - pv["vis"] / cpt
                print("  %.1f      %5.1f%%           %5.1f%%            %.2fx"
                      % (cpt, 100 * a / gv["out"], 100 * b / pv["out"], a / b))

    total = sum(delib.values())
    if total:
        print("\nDELIBERATION (%d bursts, governed arms) by the NEXT action taken:" % total)
        for k, v in delib.most_common():
            print("   %-30s %4d  %5.1f%%" % (k, v, 100 * v / total))
        machinery = sum(v for k, v in delib.items()
                        if k in ("scan prep / other bash", "run classifier",
                                 "author classifier payload",
                                 "run scan tool (L3)"))   # L3 absorbs prep+payload+sequence
        artifacts = sum(v for k, v in delib.items()
                        if k in ("author records", "author ledger/decisions",
                                 "author openspec", "author ADR"))
        print("\n   classification machinery  %5.1f%%   <- the Stage-E target"
              % (100 * machinery / total))
        print("   governance artifacts      %5.1f%%   <- what A/B/C attacked"
              % (100 * artifacts / total))


if __name__ == "__main__":
    main()
