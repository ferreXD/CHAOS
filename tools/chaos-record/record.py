#!/usr/bin/env python3
"""chaos-record — derive record FACTS, keep the judgement for the agent (lever L4).

Design of record: docs/design/2026-08-03-l3-l4-scan-and-record.md (L4-D1..D5).

Emits PARTIAL phase records at the real path (creator L4-D2):
`records/<phase>.pass-NN.facts.json` with derived facts filled and every judgement field
deliberately EMPTY — `verdict`, `assessment`, `verdictRationale`, `commentary`, coverage
`covered/evidence/whyNotTest`, `deviations`, rules `status/evidence`, `findings`,
`traceability`, `archiveReadiness`. The agent fills them; `render.py --check` is the
completion gate (it stays red while required judgement is empty). An aborted pass DELETES
the partial — writer rule 3's intent (no records for abandoned attempts) is preserved.

The honesty guard (L4-D5): this tool NEVER fills a judgement field, and anything it cannot
actually derive stays empty rather than guessed — enforced by unit test.

Phases: frame · deliver · verify. `contract.json` stays agent-authored (statements are
judgement end-to-end). deliver parses the loop's own build/test logs; verify RE-RUNS the
checks itself (creator L4-D4) — the independent re-run is the point. Reading `records/`
here is legitimate: L4 is an emitter, not a classifier (the never-read-records constraint
is about classification inputs).
"""

import argparse
import datetime
import json
import os
import re
import subprocess
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(_HERE, "..", "chaos-classify"))
from classify import compute_dimensions  # noqa: E402

WARN_RE = re.compile(r"(\d+)\s+Warning\(s\)")
ERR_RE = re.compile(r"(\d+)\s+Error\(s\)")
PASSED_RE = re.compile(r"Passed:\s*(\d+)")
FAILED_RE = re.compile(r"Failed:\s*(\d+)")
TOTAL_RE = re.compile(r"Total:\s*(\d+)")
PASS_FILE_RE = re.compile(r"\.pass-(\d+)\.facts\.json$")


def _read(path):
    with open(path, encoding="utf-8-sig") as f:
        return f.read()


def _now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class RecordError(Exception):
    pass


def next_pass(records_dir, phase):
    if not os.path.isdir(records_dir):
        return 1
    nums = [int(PASS_FILE_RE.search(n).group(1)) for n in os.listdir(records_dir)
            if n.startswith(phase + ".pass-") and PASS_FILE_RE.search(n)]
    return max(nums or [0]) + 1


def envelope(phase, change_dir, run_id, mode, source_command):
    return {
        "schemaVersion": 1,
        "recordType": "phase-facts",
        "phase": phase,
        "pass": next_pass(os.path.join(change_dir, "records"), phase),
        "changeId": os.path.basename(os.path.abspath(change_dir)),
        "sourceCommand": source_command,
        "run": run_id,
        "mode": mode,
        "verdict": "",
        "at": _now(),
        "assessment": {"confidence": "", "evidenceCoverage": "", "assumptionLoad": ""},
        "verdictRationale": None,
        "commentary": None,
    }


# --- derivations ---------------------------------------------------------------------------

def load_state(change_dir):
    p = os.path.join(change_dir, "classification-state.json")
    if not os.path.isfile(p):
        raise RecordError("no classification-state.json in %s" % change_dir)
    return json.loads(_read(p))


def load_inputs(change_dir):
    p = os.path.join(change_dir, "scan-inputs.json")
    return json.loads(_read(p)) if os.path.isfile(p) else {}


def parse_build(text, command):
    w, e = WARN_RE.search(text or ""), ERR_RE.search(text or "")
    out = {"command": command}
    # underivable stays empty — never guessed (L4-D5)
    out["warnings"] = int(w.group(1)) if w else ""
    out["errors"] = int(e.group(1)) if e else ""
    return out


def parse_tests(text, command):
    p, f, t = (PASSED_RE.search(text or ""), FAILED_RE.search(text or ""),
               TOTAL_RE.search(text or ""))
    out = {"command": command}
    out["passed"] = int(p.group(1)) if p else ""
    if t:
        out["total"] = int(t.group(1))
    elif p and f:
        out["total"] = int(p.group(1)) + int(f.group(1))
    else:
        out["total"] = ""
    return out


def derive_files(inputs, repo_root="."):
    subjects = inputs.get("subjectPaths") or []
    if not subjects:
        return []
    porcelain = subprocess.run(["git", "status", "--porcelain", "--"] + subjects,
                               cwd=repo_root, check=True, capture_output=True,
                               text=True).stdout
    change_map = {"A": "added", "?": "added", "M": "modified", "D": "deleted",
                  "R": "modified"}
    files = []
    for line in porcelain.splitlines():
        if len(line) < 4:
            continue
        code = (line[0] if line[0] not in (" ",) else line[1])
        path = line[3:].strip().split(" -> ")[-1]
        files.append({"path": path, "change": change_map.get(code, "modified")})
    return sorted(files, key=lambda x: x["path"])


def derive_scope_drift(state):
    fired = {f["trigger"] for f in state.get("fired", [])}
    if "M5" not in fired:
        return {"status": "NO_DRIFT", "risk": "LOW",
                "note": "M5 never fired across %d scan(s) — derived from "
                        "classification-state.json" % state.get("scanCount", 0)}
    return {"status": "", "risk": "", "note": ""}   # drift happened: the story is judgement


def coverage_scaffold(change_dir):
    contract = os.path.join(change_dir, "records", "contract.json")
    if not os.path.isfile(contract):
        return []
    statements = json.loads(_read(contract)).get("statements", [])
    return [{"statement": s["id"], "covered": None, "evidence": "", "refs": []}
            for s in statements]


def contract_tick_join(change_dir):
    """The same join the renderer does: ticked = statements the LATEST deliver pass covers."""
    contract = os.path.join(change_dir, "records", "contract.json")
    if not os.path.isfile(contract):
        return {"ticked": "", "total": "", "note": ""}
    total = len(json.loads(_read(contract)).get("statements", []))
    records_dir = os.path.join(change_dir, "records")
    delivers = sorted(n for n in os.listdir(records_dir)
                      if n.startswith("deliver.pass-") and PASS_FILE_RE.search(n))
    if not delivers:
        return {"ticked": "", "total": total, "note": ""}
    coverage = json.loads(_read(os.path.join(records_dir, delivers[-1])))\
        .get("facts", {}).get("coverage", [])
    ticked = sum(1 for c in coverage if c.get("covered") is True)
    return {"ticked": ticked, "total": total,
            "note": "join against %s — derived, same rule the renderer ticks by" % delivers[-1]}


def rules_scaffold(rule_ids):
    return [{"id": r, "status": "", "evidence": ""} for r in rule_ids or []]


def run_check(command, repo_root="."):
    proc = subprocess.run(command, cwd=repo_root, shell=True,
                          capture_output=True, text=True)
    return proc.stdout + proc.stderr


# --- phase emitters ------------------------------------------------------------------------

def emit_frame(change_dir, args):
    state = load_state(change_dir)
    inputs = load_inputs(change_dir)
    dims = compute_dimensions(state)
    depth = dims["openspec"]
    if depth == 0:
        openspec = {"status": "NOT_INVOKED", "depth": 0,
                    "invocationPath": "skipped, openspec dimension 0 — the classification "
                                      "owes no OpenSpec artifact; the contract of record is "
                                      "change.md §Contract. This is the classified outcome, "
                                      "not degraded mode.",
                    "confidenceImpact": "None. Depth 0 is the classified obligation."}
    else:
        openspec = {"status": "", "depth": depth, "invocationPath": "",
                    "confidenceImpact": ""}   # what was actually done is the agent's claim
    rec = envelope("frame", change_dir, args.run, args.mode, args.source_command)
    rec["facts"] = {"title": args.title or "",
                    "intent": [inputs.get("intent", "")] if inputs.get("intent") else [],
                    "openspec": openspec}
    return rec


def emit_deliver(change_dir, args):
    state = load_state(change_dir)
    inputs = load_inputs(change_dir)
    rec = envelope("deliver", change_dir, args.run, args.mode, args.source_command)
    rec["facts"] = {
        "build": parse_build(_read(args.build_log) if args.build_log else "",
                             args.build_cmd),
        "tests": parse_tests(_read(args.test_log) if args.test_log else "",
                             args.test_cmd),
        "coverage": coverage_scaffold(change_dir),
        "rules": rules_scaffold(args.rule),
        "files": derive_files(inputs),
        "deviations": [],
        "scopeDrift": derive_scope_drift(state),
    }
    return rec


def emit_verify(change_dir, args):
    state = load_state(change_dir)
    rec = envelope("verify", change_dir, args.run, args.mode, args.source_command)
    checks = {}
    if args.run_checks:
        note = "independent re-run by chaos-record (L4-D4)"
        checks["build"] = parse_build(run_check(args.build_cmd), args.build_cmd)
        checks["build"]["note"] = note
        checks["tests"] = parse_tests(run_check(args.test_cmd), args.test_cmd)
        checks["tests"]["note"] = note
        if args.openspec_validate_cmd:
            out = run_check(args.openspec_validate_cmd)
            ok = "is valid" in out or "PASS" in out
            checks["openspec"] = {"validation": "PASS" if ok else "FAIL",
                                  "isComplete": None,
                                  "note": "ran: %s" % args.openspec_validate_cmd}
    checks["contract"] = contract_tick_join(change_dir)
    checks["scopeDrift"] = derive_scope_drift(state)
    checks["rules"] = rules_scaffold(args.rule)
    rec["facts"] = {"archiveReadiness": "", "checks": checks,
                    "traceability": [], "findings": []}
    return rec


def main(argv=None):
    ap = argparse.ArgumentParser(description="chaos-record — record-facts emitter (L4)")
    ap.add_argument("phase", choices=["frame", "deliver", "verify"])
    ap.add_argument("--change-dir", required=True)
    ap.add_argument("--run", required=True, help="the completing commandRunId")
    ap.add_argument("--mode", default=None)
    ap.add_argument("--source-command", default="chaos:run")
    ap.add_argument("--title", default=None, help="frame: change title")
    ap.add_argument("--build-log", default=None, help="deliver: build output to parse")
    ap.add_argument("--test-log", default=None, help="deliver: test output to parse")
    ap.add_argument("--build-cmd", default="dotnet build")
    ap.add_argument("--test-cmd", default="dotnet test")
    ap.add_argument("--rule", action="append", default=None,
                    help="rule id to scaffold (repeatable)")
    ap.add_argument("--run-checks", action="store_true",
                    help="verify: execute build/test/openspec checks (the independent re-run)")
    ap.add_argument("--openspec-validate-cmd", default=None)
    args = ap.parse_args(argv)

    try:
        rec = {"frame": emit_frame, "deliver": emit_deliver,
               "verify": emit_verify}[args.phase](args.change_dir, args)
        records_dir = os.path.join(args.change_dir, "records")
        os.makedirs(records_dir, exist_ok=True)
        path = os.path.join(records_dir, "%s.pass-%02d.facts.json"
                            % (args.phase, rec["pass"]))
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(rec, f, indent=2)
            f.write("\n")
        print(json.dumps({"written": path.replace("\\", "/"), "pass": rec["pass"],
                          "judgementFieldsLeftEmpty": True,
                          "next": "fill verdict/assessment/judgement prose, then "
                                  "render.py --check"}, indent=1))
    except (RecordError, OSError, ValueError, KeyError,
            subprocess.CalledProcessError) as e:
        print("chaos-record error: %s" % e, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
