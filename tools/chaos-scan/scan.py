#!/usr/bin/env python3
"""chaos-scan — the classifier operating protocol, mechanized (lever L3 / Stage E).

Design of record: docs/design/2026-08-03-l3-l4-scan-and-record.md (L3-D1..D6).
Prediction: cost-bar doc §5c — frozen before this build, not re-opened here.

The wrapper owns what the agent used to reason through by hand: C-15-scoped diff
generation (`git add -N` + `git diff -- <subjectPaths>`), payload/section assembly, the
scan → adjudicationDue? → merge sequence, TRG-* ledger transcription (L3-D6, creator:
writer rule 2 amended — decision entries stay agent-appended, TRG events are tool-appended),
and a verdict digest the agent reads instead of raw JSON. What remains model work is
exactly one thing: the adjudication judgement, at ceiling, when `adjudicationDue` says so.

It imports classify() as a library (the audit.py pattern) and NEVER modifies classifier
behaviour: same triggers, same dimensions, same stops, same state file.

Files (all under the change dir, working state — deliberately NOT records/):
  scan-inputs.json           inputs captured once at k1 (intent verbatim, scope,
                             declaredTriggers, mode, subjectPaths, posture/map paths,
                             lastCheckpoint cursor)
  classification-state.json  the classifier's own state (unchanged ownership)
  scan/verdict-<seq>.md      append-only verdict digests (L3-D4: verbatim cites,
                             demoted candidates, the stop duty — non-negotiable content)
  scan/packet-<seq>.json     sanitized adjudication packet, written when due (L3-D5)
  scan/k3.numstat|k3.patch   the C-15-scoped diff, reused by chaos-record (L4)

Subcommands: k1 · rescan (K3) · k2 · k4 · merge · update-scope.
`merge` fails closed (exit 2) on any raise missing a cite or naming a non-materiality
trigger — C-6 mechanized. Exit codes: 0 ok · 2 misuse/broken inputs.
"""

import argparse
import datetime
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                "..", "chaos-classify"))
from classify import (  # noqa: E402
    MATERIALITY, DECLARED_NAMES, DIM_KEYS, classify, sanitized_packet,
)

TRIGGER_NAMES = {v: k for k, v in DECLARED_NAMES.items()}
TRG_RE = re.compile(r"^## TRG-(\d+)\b", re.MULTILINE)


def _read(path):
    with open(path, encoding="utf-8-sig") as f:
        return f.read()


def _write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, indent=1)
        f.write("\n")


def _load_json(path):
    return json.loads(_read(path))


class ScanError(Exception):
    pass


# --- change-dir file conventions -----------------------------------------------------------

def paths(change_dir):
    return {
        "inputs": os.path.join(change_dir, "scan-inputs.json"),
        "state": os.path.join(change_dir, "classification-state.json"),
        "ledger": os.path.join(change_dir, "decision-events.md"),
        "scan": os.path.join(change_dir, "scan"),
    }


def load_inputs(change_dir):
    p = paths(change_dir)["inputs"]
    if not os.path.isfile(p):
        raise ScanError("no scan-inputs.json in %s — run `scan.py k1` first" % change_dir)
    return _load_json(p)


def build_sections(change_dir, inputs, checkpoint):
    """The classifier's section payload for one checkpoint, from persisted inputs."""
    p = paths(change_dir)
    fm = "chaosMetadata:\n  mode: %s\n  declaredTriggers: [%s]\n" % (
        inputs.get("mode") or "null", ", ".join(inputs.get("declaredTriggers", [])))
    if inputs.get("selfReview"):
        fm += "  selfReview: %s\n" % inputs["selfReview"]
    sections = {"frontmatter": fm, "intent": inputs["intent"], "scope": inputs["scope"]}
    posture = [f for f in inputs.get("postureFiles", []) if os.path.isfile(f)]
    if posture:
        sections["posture"] = "\n\n".join(_read(f) for f in posture)
    if checkpoint != "K1" and os.path.isfile(p["ledger"]):
        sections["ledger"] = _read(p["ledger"])
    if checkpoint in ("K3", "K4"):
        numstat = os.path.join(p["scan"], "k3.numstat")
        patch = os.path.join(p["scan"], "k3.patch")
        if os.path.isfile(numstat):
            sections["numstat"] = _read(numstat)
            sections["patch"] = _read(patch) if os.path.isfile(patch) else ""
    return sections


def load_map(inputs):
    map_file = inputs.get("mapFile")
    if map_file and os.path.isfile(map_file):
        return _load_json(map_file)
    return {}


# --- C-15 diff generation (L3-D3) ----------------------------------------------------------

def generate_diff(change_dir, inputs, repo_root="."):
    subjects = inputs.get("subjectPaths", [])
    if not subjects:
        raise ScanError("scan-inputs.json has no subjectPaths — rescan cannot scope the diff")
    scan_dir = paths(change_dir)["scan"]
    os.makedirs(scan_dir, exist_ok=True)
    existing = [s for s in subjects if os.path.exists(os.path.join(repo_root, s))]
    if existing:
        subprocess.run(["git", "add", "-N", "--"] + existing,
                       cwd=repo_root, check=True, capture_output=True)
    numstat = subprocess.run(["git", "diff", "--numstat", "--"] + subjects,
                             cwd=repo_root, check=True, capture_output=True, text=True).stdout
    patch = subprocess.run(["git", "diff", "--"] + subjects,
                           cwd=repo_root, check=True, capture_output=True, text=True).stdout
    with open(os.path.join(scan_dir, "k3.numstat"), "w", encoding="utf-8", newline="\n") as f:
        f.write(numstat)
    with open(os.path.join(scan_dir, "k3.patch"), "w", encoding="utf-8", newline="\n") as f:
        f.write(patch)


# --- TRG transcription (L3-D6, tool-appended by creator decision) --------------------------

def append_trg_events(change_dir, verdict, run_id=None, today=None):
    """One RECORDED TRG-* ledger event per newly fired trigger — byte-derived from the
    verdict, exactly the change-template §2 TRG shape. Decision entries stay agent-only."""
    fired = verdict["newlyFired"]
    if not fired:
        return []
    ledger_path = paths(change_dir)["ledger"]
    existing = _read(ledger_path) if os.path.isfile(ledger_path) else ""
    n = max([int(m) for m in TRG_RE.findall(existing)] or [0])
    today = today or datetime.date.today().isoformat()
    dims = verdict["dimensions"]
    dims_line = " · ".join("%s %d" % (k, dims[k]) for k in DIM_KEYS)
    entries, ids = [], []
    for f in fired:
        n += 1
        ids.append("TRG-%03d" % n)
        name = TRIGGER_NAMES.get(f["trigger"], f["trigger"])
        entries.append(
            "## TRG-%03d — trigger fired: %s %s\n\n"
            "- status: RECORDED (%s)%s\n"
            "- trigger: %s · by: %s · surface: %s\n"
            "- cite: %s\n"
            "- dimensions-after: %s\n"
            % (n, f["trigger"], name, today,
               " · run: %s" % run_id if run_id else "",
               f["trigger"], f["by"], f.get("surface") or "none",
               f.get("cite", ""), dims_line))
    body = existing
    if body and not body.endswith("\n"):
        body += "\n"
    if body:
        body += "\n"
    with open(ledger_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(body + "\n".join(entries))
    return ids


# --- the verdict digest (L3-D4) ------------------------------------------------------------

def write_digest(change_dir, verdict, checkpoint, trg_ids, packet_path=None):
    scan_dir = paths(change_dir)["scan"]
    os.makedirs(scan_dir, exist_ok=True)
    seq = verdict["scanSeq"]
    lines = ["# Scan verdict %d — %s" % (seq, checkpoint), ""]

    if verdict["newlyFired"]:
        for f, tid in zip(verdict["newlyFired"], trg_ids or [""] * len(verdict["newlyFired"])):
            lines.append("- FIRED %s (by %s, surface %s)%s — cite: %s"
                         % (f["trigger"], f["by"], f.get("surface") or "none",
                            " [%s]" % tid if tid else "", f.get("cite", "")))
    else:
        lines.append("- fired: none")
    if verdict.get("scanEcho"):
        lines.append("- echo (already fired, re-detected): %s" % ", ".join(verdict["scanEcho"]))
    for d in verdict.get("demotedCandidates", []):
        lines.append("- DEMOTED candidate: %s hit %s — %s (adjudication may raise it, cite required)"
                     % (d.get("class"), d.get("path"), d.get("reason")))

    if verdict.get("stopSatisfiedBy"):
        lines.append("- stops: SATISFIED by %s — cite it in the delivery facts; no new stop"
                     % ", ".join(verdict["stopSatisfiedBy"]))
    elif verdict.get("stopAbsorbedBy"):
        lines.append("- stops: ABSORBED by pending %s — do NOT create a second decision; "
                     "amend that entry (append the folded question, increment `folds:`)"
                     % ", ".join(verdict["stopAbsorbedBy"]))
    elif verdict["newStops"]:
        lines.append("- stops: +%d placed — surface ONE runtime decision folding every "
                     "question from this scan (`folds: <n>` on the entry), write the resume "
                     "capsule, STOP" % verdict["newStops"])
    else:
        lines.append("- stops: none demanded")

    dims = verdict["dimensions"]
    lines.append("- dimensions: " + " · ".join("%s %d" % (k, dims[k]) for k in DIM_KEYS))
    lines.append("- confidence: %s · scanSeq: %d" % (verdict["confidence"], seq))
    if verdict.get("newSurfacePaths"):
        lines.append("- new surface paths: %s" % ", ".join(verdict["newSurfacePaths"]))
    if verdict["adjudicationDue"]:
        lines.append("- adjudication: DUE — judge %s per tools/chaos-classify/"
                     "adjudication-prompt.md (raise-only, cites mandatory), then run "
                     "`python tools/chaos-scan/scan.py merge --change-dir %s --raises <file>`"
                     % (packet_path, change_dir))
    else:
        lines.append("- adjudication: not due")

    text = "\n".join(lines) + "\n"
    path = os.path.join(scan_dir, "verdict-%d.md" % seq)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    return path, text


# --- checkpoint execution ------------------------------------------------------------------

def run_checkpoint(change_dir, checkpoint, inputs, adjudication=None, run_id=None):
    p = paths(change_dir)
    sections = build_sections(change_dir, inputs, checkpoint)
    state = _load_json(p["state"]) if os.path.isfile(p["state"]) else None
    verdict, state = classify(sections, checkpoint, state, adjudication, load_map(inputs))
    _write_json(p["state"], state)
    inputs["lastCheckpoint"] = checkpoint
    _write_json(p["inputs"], inputs)
    trg_ids = append_trg_events(change_dir, verdict, run_id=run_id)
    packet_path = None
    if verdict["adjudicationDue"]:
        packet = sanitized_packet(os.path.basename(os.path.abspath(change_dir)),
                                  checkpoint, sections, verdict, state)
        packet_path = os.path.join(p["scan"], "packet-%d.json" % verdict["scanSeq"])
        _write_json(packet_path, packet)
    _, digest = write_digest(change_dir, verdict, checkpoint, trg_ids, packet_path)
    return digest


def validate_raises(raises):
    for r in raises:
        if r.get("trigger") not in MATERIALITY:
            raise ScanError("raise-only violation: %r is not a materiality trigger"
                            % r.get("trigger"))
        if not (r.get("cite") or "").strip():
            raise ScanError("cite missing on raise %s — C-6: every raise carries a cite"
                            % r.get("trigger"))


def main(argv=None):
    ap = argparse.ArgumentParser(description="chaos-scan — the scan protocol, mechanized (L3)")
    sub = ap.add_subparsers(dest="cmd", required=True)

    def common(sp):
        sp.add_argument("--change-dir", required=True, help=".chaos/changes/<change-id>")
        sp.add_argument("--run", default=None, help="commandRunId stamped on TRG events")

    k1 = sub.add_parser("k1", help="classify at intent; captures scan-inputs.json")
    common(k1)
    k1.add_argument("--intent", required=True, help="the change intent, verbatim")
    k1.add_argument("--scope", required=True, help="predicted scope line")
    k1.add_argument("--declared", default="", help="comma list of declaredTriggers")
    # Constrained for the same reason as --self-review: a typo'd preset used to fall through to
    # zero floors, silently giving a caller who asked for strict governance none at all.
    k1.add_argument("--mode", default=None, choices=["light", "standard", "strict"],
                    help="preset floor; omit for no preset (zero floors, classification only)")
    k1.add_argument("--subject", action="append", default=None, required=True,
                    help="C-15 subject path root (repeatable), e.g. --subject src --subject tests")
    k1.add_argument("--map", default=os.path.join(".chaos", "path-class-map.json"))
    k1.add_argument("--posture", action="append", default=[],
                    help="posture doc path (repeatable)")

    for name, hlp in (("rescan", "K3 scan of the grown C-15-scoped diff"),
                      ("k2", "ledger rescan after an answered decision (scan-only)"),
                      ("k4", "self-review checkpoint")):
        sp = sub.add_parser(name, help=hlp)
        common(sp)
        if name == "k4":
            # CONSTRAINED ON PURPOSE (lever-run defect D3). This was free text, and the
            # classifier fires X2 for anything that is not the literal "clean" — so six of six
            # measured arms passed "pass"/"PASS", tripped X2, and bought an independent review
            # pass plus a verify pass they did not owe. A tool must not let a well-behaved
            # caller manufacture governance by wording. `clean` = self-review found nothing;
            # `fail` = it found something (X2 fires, review->2, verify->1, mechanically).
            sp.add_argument("--self-review", required=True, dest="self_review",
                            choices=["clean", "fail"],
                            help="clean = nothing found; fail = issues found (fires X2)")

    mg = sub.add_parser("merge", help="apply adjudication raises (second call of the pattern)")
    common(mg)
    mg.add_argument("--raises", required=True, help='JSON file: {"raises": [...]}')

    us = sub.add_parser("update-scope", help="update scope/subjects citing a decision")
    common(us)
    us.add_argument("--scope", default=None)
    us.add_argument("--subject", action="append", default=None)
    us.add_argument("--decision", required=True, help="the ledger decision authorizing this")

    args = ap.parse_args(argv)
    try:
        if args.cmd == "k1":
            inputs = {
                "intent": args.intent, "scope": args.scope,
                "declaredTriggers": [t.strip() for t in args.declared.split(",") if t.strip()],
                "mode": args.mode, "selfReview": None,
                "subjectPaths": args.subject, "mapFile": args.map,
                "postureFiles": args.posture, "lastCheckpoint": None,
            }
            os.makedirs(paths(args.change_dir)["scan"], exist_ok=True)
            _write_json(paths(args.change_dir)["inputs"], inputs)
            print(run_checkpoint(args.change_dir, "K1", inputs, run_id=args.run))
        elif args.cmd == "rescan":
            inputs = load_inputs(args.change_dir)
            generate_diff(args.change_dir, inputs)
            print(run_checkpoint(args.change_dir, "K3", inputs, run_id=args.run))
        elif args.cmd == "k2":
            inputs = load_inputs(args.change_dir)
            print(run_checkpoint(args.change_dir, "K2", inputs, run_id=args.run))
        elif args.cmd == "k4":
            inputs = load_inputs(args.change_dir)
            inputs["selfReview"] = args.self_review
            print(run_checkpoint(args.change_dir, "K4", inputs, run_id=args.run))
        elif args.cmd == "merge":
            inputs = load_inputs(args.change_dir)
            last = inputs.get("lastCheckpoint")
            if not last:
                raise ScanError("nothing to merge into — no prior scan call")
            adj = _load_json(args.raises)
            validate_raises(adj.get("raises", []))
            print(run_checkpoint(args.change_dir, last, inputs, adjudication=adj,
                                 run_id=args.run))
        elif args.cmd == "update-scope":
            inputs = load_inputs(args.change_dir)
            if not (args.decision or "").strip():
                raise ScanError("update-scope requires --decision")
            if args.scope:
                inputs["scope"] = args.scope
            if args.subject:
                inputs["subjectPaths"] = args.subject
            inputs["scopeUpdatedBy"] = args.decision
            _write_json(paths(args.change_dir)["inputs"], inputs)
            print("scan-inputs updated (authorized by %s)" % args.decision)
    except (ScanError, OSError, ValueError, KeyError, subprocess.CalledProcessError) as e:
        print("chaos-scan error: %s" % e, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
