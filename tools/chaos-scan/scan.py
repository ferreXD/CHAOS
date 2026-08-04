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
    MATERIALITY, DECLARED_NAMES, DIM_KEYS, SURFACE_KEYWORDS, classify, match_path,
    sanitized_packet,
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
    """The path-class map decides M2. Without it NOTHING can be sensitive, so a missing map
    silently converts every material change into 'fired: none' at HIGH confidence — the same
    silent-governance-loss shape as D4/D5, and the worst variant, because it certifies work as
    immaterial rather than merely under-flooring it. A map that was named and has since moved
    is therefore an error, never a degrade-to-empty. The only way to run without classes is to
    say so at k1 (`--no-map`), which records the choice in scan-inputs.json.
    """
    map_file = inputs.get("mapFile")
    if not map_file:
        if inputs.get("noMap"):
            return {}
        raise ScanError(
            "scan-inputs.json has no mapFile and no recorded --no-map choice. M2 cannot fire "
            "without a path-class map, so this scan would report 'fired: none' for changes on "
            "sensitive surfaces. Re-run k1 with --map <file>, or --no-map to accept that this "
            "repository declares no sensitive classes.")
    if not os.path.isfile(map_file):
        raise ScanError(
            "path-class map %r is named in scan-inputs.json but does not exist. M2 cannot fire "
            "without it and this scan would silently under-report materiality. Restore the file "
            "or re-run k1 with the correct --map." % map_file)
    return _load_json(map_file)


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

def write_digest(change_dir, verdict, checkpoint, trg_ids, packet_path=None, inputs=None):
    inputs = inputs or {}
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
    if inputs.get("noMap"):
        # Never let 'fired: none' stand unqualified when M2 was structurally unable to fire.
        lines.append("- NOTE: no path-class map (--no-map). M2 cannot fire; "
                     "'fired: none' does NOT mean no sensitive surface was touched.")
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
    _, digest = write_digest(change_dir, verdict, checkpoint, trg_ids, packet_path, inputs)
    return digest


# --- tier banding (L1 §8: T0/T1/T2) ------------------------------------------------------

TIER_BUDGET = 2                    # L1-D14: escalations allowed before implementation latches
X1_REVIEW1_FILES = 8               # L1 §8.6: a T0 unit sits below the X1 review1 threshold
# A contract statement counts as PINNED when its text carries a machine-checkable assertion.
# Documented operationalization, not a silent heuristic (house style): a quoted identifier, an
# HTTP status code, an HTTP method, or an explicit numeric bound.
PINNED_RES = (re.compile(r"`[^`]+`"), re.compile(r"\b[1-5]\d\d\b"),
              re.compile(r"\b(GET|POST|PUT|PATCH|DELETE)\b"),
              re.compile(r"\b(exactly|at most|at least|max|maximum|min|minimum)\s+\d+", re.I))


def _is_file_path(path):
    """File-level means a named file, not a directory. NOTE: classify.vague_scope answers a
    different question (LOW-signal scope: no files AND everything depth <= 2), so a deep
    directory passes it — reusing it here silently admitted `src/App/Dto/` as 'specified'."""
    p = path.replace("\\", "/").rstrip()
    return not p.endswith("/") and "." in p.rsplit("/", 1)[-1]


def _tier_state(state):
    return {"spent": state.get("tierBudgetSpent", 0),
            "latched": bool(state.get("tierLatched", False))}


def _classes_for_paths(paths, map_data, class_names):
    """Which of the named classes any of these paths falls into -> [(class, surface, path)]."""
    hits = []
    for cname in class_names:
        cdef = map_data.get("classes", {}).get(cname, {})
        for p in paths:
            if any(match_path(pat, p) for pat in cdef.get("paths", [])):
                hits.append((cname, cdef.get("surface"), p))
    return hits


def _coupled_statements(covers, contract, fired_surfaces):
    """Gate 3: a statement is COUPLED when its text matches the keyword set of a surface that
    has fired (reusing classify.SURFACE_KEYWORDS, the same map MR-3 uses for stop
    satisfaction) — the P1 lesson: tests encoding a fired surface's contract are not routine."""
    coupled = []
    by_id = {s["id"]: s for s in (contract or {}).get("statements", [])}
    for sid in covers:
        text = (by_id.get(sid, {}).get("text") or "").lower()
        for surface in fired_surfaces:
            for word in SURFACE_KEYWORDS.get(surface, []):
                if word in text:
                    coupled.append((sid, surface, word))
                    break
    return coupled


def compute_tier(change_dir, unit_paths, covers=None, acceptance_exit=None, map_data=None):
    """Deterministic tier verdict for one work unit (L1-D15): T0 | T1 | T2 + the deciding gate.

    T2 is the DEFAULT and the fallback — a unit reaches a cheaper tier only by passing every
    gate. Nothing here is a model judgement; every input is evidence already on disk."""
    p = paths(change_dir)
    state = _load_json(p["state"]) if os.path.isfile(p["state"]) else {}
    map_data = map_data if map_data is not None else load_map(load_inputs(change_dir))
    covers = covers or []
    unit_paths = [u.replace("\\", "/") for u in unit_paths]
    budget = _tier_state(state)
    fired = state.get("fired", [])
    fired_surfaces = {f.get("surface") for f in fired if f.get("surface")}
    sensitive = map_data.get("m2Classes", [])

    def verdict(tier, gate, cite, route=None):
        out = {"tier": tier, "gate": gate, "cite": cite,
               "budgetSpent": budget["spent"], "budgetTotal": TIER_BUDGET,
               "unitPaths": unit_paths}
        if route:
            out["route"] = route
        return out

    # --- gate 4 first: a latched run is ceiling regardless of anything else
    if budget["latched"] or budget["spent"] >= TIER_BUDGET:
        return verdict("T2", "budget", "escalation budget spent (%d/%d) — implementation is "
                                       "ceiling for the rest of this run"
                       % (budget["spent"], TIER_BUDGET))
    if not unit_paths:
        return verdict("T2", "declared-paths", "no unit paths declared — a unit with no "
                                               "declared surface cannot be banded")

    # --- gate 1: retrospective surface-disjoint (a FIRED trigger's surface)
    fired_classes = [c for c in map_data.get("classes", {})
                     if map_data["classes"][c].get("surface") in fired_surfaces]
    hit = _classes_for_paths(unit_paths, map_data, fired_classes)
    if hit:
        cname, surface, path = hit[0]
        return verdict("T2", "fired-surface",
                       "%s is in class %s (surface %s), which carries a fired trigger"
                       % (path, cname, surface))

    # --- gate 2: prospective surface-disjoint (ANY sensitive class, fired or not)
    hit = _classes_for_paths(unit_paths, map_data, sensitive)
    if hit:
        cname, surface, path = hit[0]
        return verdict("T2", "sensitive-surface",
                       "%s is in sensitive class %s (surface %s) — ceiling even before it fires"
                       % (path, cname, surface))

    # --- gate 3: no coupled evidence
    contract_path = os.path.join(change_dir, "records", "contract.json")
    contract = _load_json(contract_path) if os.path.isfile(contract_path) else {}
    coupled = _coupled_statements(covers, contract, fired_surfaces)
    if coupled:
        sid, surface, word = coupled[0]
        return verdict("T2", "coupled-evidence",
                       "%s reads on the fired surface %s (keyword %r) — evidence for a fired "
                       "surface's contract is not routine work" % (sid, surface, word))

    # --- T1 established. Now: does it also clear the narrower T0 bar? (L1-D16)
    t1 = verdict("T1", "all-T1-gates",
                 "no fired surface, no sensitive class, no coupled evidence, budget %d/%d"
                 % (budget["spent"], TIER_BUDGET))
    not_files = [u for u in unit_paths if not _is_file_path(u)]
    if not_files:
        t1["t0Blocked"] = ("declared path(s) are not file-level: %s — a directory is not a "
                           "specification" % ", ".join(not_files))
        return t1
    if len(unit_paths) >= X1_REVIEW1_FILES:
        t1["t0Blocked"] = ("%d declared files meets the X1 review1 threshold (%d)"
                           % (len(unit_paths), X1_REVIEW1_FILES))
        return t1
    # Route A — an executable acceptance check exists AND currently FAILS.
    if acceptance_exit is not None:
        if acceptance_exit != 0:
            return verdict("T0", "route-A", "acceptance check exists and fails (exit %d) — it "
                                            "defines done and validates the result"
                           % acceptance_exit, route="A")
        t1["t0Blocked"] = ("acceptance check passes already (exit 0) — nothing for T0 to turn "
                           "green")
        return t1
    # Route B — CLOSED 2026-08-04 (creator), on the rule L1-D11 pre-registered: a correctness
    # failure on a cheap tier closes that route rather than being tuned.
    #
    # Route B banded a unit T0 when it mapped 1:1 onto pinned contract statements, accepting that
    # there was NO pre-existing validator and post-conditions were the only check. Its first and
    # only real test — T1 of the product-conditions run — failed: the floor tier implemented the
    # `?priority=` guard with `Enum.TryParse`, which accepts comma-separated lists, so
    # `?priority=Low,High` returned 200 where pinned statement C-003 requires 400. It reported
    # COMPLETE, 1 attempt, 41/41 green, and it was wrong. The unit violated one of the very
    # statements that authorized it to run at floor.
    #
    # The cause is structural, not a weakness of the floor model: "suite green" counted tests the
    # EXECUTOR ITSELF WROTE, so it authored both the implementation and the evidence that the
    # implementation was right, and one misreading of the spec produced both. A self-written
    # validator is not a validator, and a stronger model lowers the probability without closing
    # the hole. Route A is deliberately untouched — its acceptance check pre-exists the unit and
    # cannot be authored by the executor, which is exactly the property Route B lacked.
    if covers:
        t1["t0Blocked"] = ("route B is closed (2026-08-04): pinned statements alone do not make "
                           "a unit floor-safe, because the executor would author both the "
                           "implementation and the tests that check it. Use an acceptance check "
                           "that already fails (route A) to reach T0.")
        return t1
    t1["t0Blocked"] = ("no acceptance check: only route A can reach T0, and it needs an "
                       "executable check that currently fails")
    return t1


def record_escalation(change_dir, from_tier):
    """L1-D17: a failed unit climbs ONE rung and spends one unit of the shared budget."""
    p = paths(change_dir)
    state = _load_json(p["state"]) if os.path.isfile(p["state"]) else {}
    spent = state.get("tierBudgetSpent", 0) + 1
    state["tierBudgetSpent"] = spent
    nxt = {"T0": "T1", "T1": "T2"}.get(from_tier, "T2")
    if spent >= TIER_BUDGET:
        state["tierLatched"] = True
        nxt = "T2"
    _write_json(p["state"], state)
    return {"escalatedFrom": from_tier, "redoAt": nxt, "budgetSpent": spent,
            "budgetTotal": TIER_BUDGET, "latched": bool(state.get("tierLatched"))}


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
    # A missing map is fail-closed, not degrade-to-empty: without classes M2 can never fire, so
    # the scan would certify sensitive-surface work as 'fired: none' at HIGH confidence.
    k1.add_argument("--no-map", action="store_true",
                    help="declare explicitly that this repository has no sensitive path classes "
                         "(M2 can never fire); recorded in scan-inputs.json")
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

    tr = sub.add_parser("tier", help="band ONE work unit: T0 | T1 | T2 (L1 §8, deterministic)")
    common(tr)
    tr.add_argument("--unit-path", action="append", default=[], dest="unit_path",
                    help="a file this unit will touch (repeatable; file-level for T0)")
    tr.add_argument("--covers", default="",
                    help="comma list of contract statement ids this unit delivers evidence for")
    tr.add_argument("--acceptance-check", default=None,
                    help="Route A: a command that must ALREADY FAIL (it defines done). It is "
                         "run here; a passing check does not qualify.")
    tr.add_argument("--escalate", default=None, choices=["T0", "T1"],
                    help="record a failed unit at this tier: climbs one rung, spends budget")

    us = sub.add_parser("update-scope", help="update scope/subjects citing a decision")
    common(us)
    us.add_argument("--scope", default=None)
    us.add_argument("--subject", action="append", default=None)
    us.add_argument("--decision", required=True, help="the ledger decision authorizing this")

    args = ap.parse_args(argv)
    try:
        if args.cmd == "k1":
            if args.no_map:
                map_file = None
            else:
                if not os.path.isfile(args.map):
                    raise ScanError(
                        "no path-class map at %r. M2 cannot fire without one, so every change "
                        "on a sensitive surface would scan as 'fired: none' at HIGH confidence. "
                        "Point --map at the repository's map, or pass --no-map to declare "
                        "explicitly that this repository has no sensitive classes." % args.map)
                map_file = args.map
            inputs = {
                "intent": args.intent, "scope": args.scope,
                "declaredTriggers": [t.strip() for t in args.declared.split(",") if t.strip()],
                "mode": args.mode, "selfReview": None,
                "subjectPaths": args.subject, "mapFile": map_file, "noMap": bool(args.no_map),
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
        elif args.cmd == "tier":
            if args.escalate:
                json.dump(record_escalation(args.change_dir, args.escalate), sys.stdout, indent=1)
                print()
                return 0
            acceptance_exit = None
            if args.acceptance_check:
                acceptance_exit = subprocess.run(args.acceptance_check, shell=True,
                                                 capture_output=True, text=True).returncode
            v = compute_tier(args.change_dir, args.unit_path,
                             [c.strip() for c in args.covers.split(",") if c.strip()],
                             acceptance_exit)
            json.dump(v, sys.stdout, indent=1)
            print()
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
