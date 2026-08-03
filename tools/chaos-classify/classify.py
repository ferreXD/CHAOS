#!/usr/bin/env python3
"""chaos-classify — Stage-C progressive-rigor trigger classifier (deterministic core).

Design of record: docs/design/2026-08-02-stage-c-progressive-rigor.md (decisions C-1..C-14).
Fidelity corpus:  .chaos/validation/2026-08-stage-c-classifier/ (pre-registered expectations).

Hard constraint: inputs are change.md frontmatter/sections + decision ledger + git-shaped
texts (numstat, patch) + posture docs + the path-class map. NEVER records/*.json.

The core is a pure function over input texts (classify()); filesystem access lives in the
fixture-loading adapter below. A repo/git adapter arrives only at wiring time (step 4), after
the corpus acceptance bar passes. The M1/semantic layer is NOT here: the core emits candidate
surfaces and demoted hits; a skill-side model pass may RAISE materiality triggers (C-6/C-7,
raise-only, cites required) — supplied to this tool as an adjudication-results file.
"""

import argparse
import json
import os
import re
import sys

# --- trigger sets (design doc section 5) ------------------------------------------------

MATERIALITY = {"M1", "M2", "M3", "M4", "M5"}
MECHANICAL = {"X1", "X2", "X3"}
OPENSPEC_BASE = {"M1", "M3", "M4"}   # any of these fired -> openspec >= 1
C13_COUNTED = {"M1", "M2", "M3"}     # surface-bearing triggers only. M5 carries no surface;
                                     # M4 measures DENSITY, not surface — its folded questions are
                                     # by construction one decision on one surface (5.3 law 2), so
                                     # counting "process" as a second surface double-counts the
                                     # same event. M4 still raises openspec->1, review, evidence.
                                     # (C-13/MR-2 as amended by C-17, creator 2026-08-03.)
MAX_MATERIAL_DECISIONS = 2           # M4 threshold; held across all measured runs

DECLARED_NAMES = {
    "posture-crossing": "M1", "sensitive-surface": "M2", "contract-surface": "M3",
    "decision-density": "M4", "scope-spill": "M5", "blast-radius": "X1",
    "self-review-fail": "X2", "dependency-churn": "X3",
}

DIM_KEYS = ["stops", "evidence.targeted", "evidence.breadth", "review", "verify", "openspec", "adr"]

FLOORS = {
    None:       {"stops": 1, "evidence.targeted": 0, "evidence.breadth": 0, "review": 0, "verify": 0, "openspec": 0, "adr": 0},
    "light":    {"stops": 1, "evidence.targeted": 0, "evidence.breadth": 0, "review": 0, "verify": 0, "openspec": 0, "adr": 0},
    "standard": {"stops": 1, "evidence.targeted": 1, "evidence.breadth": 1, "review": 1, "verify": 1, "openspec": 1, "adr": 0},
    "strict":   {"stops": 2, "evidence.targeted": 1, "evidence.breadth": 2, "review": 2, "verify": 2, "openspec": 2, "adr": 1},
}

# MR-3 implementation note: surface inference for ANSWERED ledger decisions is keyword-based.
# Documented + unit-tested; a wrong map here shows up as a corpus failure, not silence.
SURFACE_KEYWORDS = {
    "auth": ["api key", "credential", "token", "secret", "auth", "password", "x-api-key"],
    "data-store": ["store", "model", "schema", "persist", "retention", "migration", "column",
                   "soft delete", "hard delete", "data-retention"],
    "contract-dependency": ["endpoint", "route", "public contract", "client", "consumer",
                            "dependency", "package", "breaking"],
    "integration": ["broker", "queue", "webhook", "external service", "integration", "publish"],
    "deploy-ops": ["deploy", "pipeline", "infrastructure", "hosting", "rollout"],
}

ROUTE_RE = re.compile(r'Map(Get|Post|Put|Delete)\(\s*"([^"]+)"')
PKGREF_RE = re.compile(r'([+-])\s*<PackageReference\s+Include="([^"]+)"\s+Version="([^"]+)"')
LEDGER_ENTRY_RE = re.compile(r"^## ([A-Z]+)-DEC-(\d+)\s*[—–-]?\s*(.*)$", re.MULTILINE)
# M4 counts material QUESTIONS, not ledger headings. A stop that folds N questions declares
# `- folds: N` (change-template section 2); absent, an entry is exactly one question.
FOLDS_RE = re.compile(r"^-\s*folds:\s*(\d+)", re.MULTILINE)
TOTALS_RE = re.compile(r"^#\s*totals:\s*files=(\d+)(?:\s+loc=(\d+))?", re.MULTILINE)
PRED_FILES_RE = re.compile(r"~\s*(\d+)\s+files")
YAML_PROP_REMOVED_RE = re.compile(r"^-\s+\w[\w-]*:\s*$")

CHECKPOINT_ORDER = ["K1", "K2", "K3", "K4"]


# --- input parsing -----------------------------------------------------------------------

def parse_seed_file(text):
    """Split a corpus seed file into its section payloads (first fenced block per heading).

    Fence-aware: `##` lines INSIDE fenced blocks (e.g. ledger decision entries) are payload,
    not seed-file section headings."""
    sections = {}
    heads, in_fence, offset = [], False, 0
    for line in text.splitlines(keepends=True):
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
        elif not in_fence and line.startswith("## "):
            heads.append((offset, offset + len(line), line[3:].strip()))
        offset += len(line)
    for i, (start, end, title_raw) in enumerate(heads):
        body = text[end: heads[i + 1][0] if i + 1 < len(heads) else len(text)]
        fence = re.search(r"```[^\n]*\n(.*?)\n```", body, re.DOTALL)
        if not fence:
            continue
        title = title_raw.lower()
        key = {
            "frontmatter": "frontmatter", "intent": "intent", "scope": "scope",
            "ledger": "ledger", "diff numstat": "numstat", "diff patch excerpt": "patch",
            "posture": "posture", "expected": "expected",
        }.get(title)
        if key:
            sections[key] = fence.group(1)
    return sections


def parse_frontmatter(text):
    fm = {"mode": None, "declaredTriggers": [], "changeId": None, "selfReview": None}
    if not text:
        return fm
    for raw in text.splitlines():
        line = raw.split("#", 1)[0].rstrip()
        stripped = line.strip()
        if stripped.startswith("mode:"):
            val = stripped.split(":", 1)[1].strip()
            fm["mode"] = None if val in ("", "null", "~") else val
        elif stripped.startswith("changeId:"):
            fm["changeId"] = stripped.split(":", 1)[1].strip()
        elif stripped.startswith("selfReview:"):
            fm["selfReview"] = stripped.split(":", 1)[1].strip()
        elif stripped.startswith("declaredTriggers:"):
            val = stripped.split(":", 1)[1].strip()
            inner = val.strip("[]").strip()
            if inner:
                fm["declaredTriggers"] = [t.strip() for t in inner.split(",") if t.strip()]
    return fm


def parse_scope(text):
    """Scope line -> path entries (parentheticals stripped) + optional predicted file count."""
    if not text:
        return {"entries": [], "predicted_files": None}
    line = text.strip()
    if line.lower().startswith("scope:"):
        line = line.split(":", 1)[1]
    pred = PRED_FILES_RE.search(line)
    predicted = int(pred.group(1)) if pred else None
    cleaned = re.sub(r"\([^)]*\)", "", line)
    entries = [e.strip() for e in cleaned.split(",") if e.strip()]
    return {"entries": entries, "predicted_files": predicted}


def parse_numstat(text):
    rows, totals = [], None
    if not text:
        return {"rows": rows, "files": 0, "loc": 0, "adds": 0, "dels": 0}
    tm = TOTALS_RE.search(text)
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or line.startswith("("):
            continue
        parts = line.split(None, 2)
        if len(parts) == 3 and parts[0].isdigit() and parts[1].isdigit():
            rows.append({"adds": int(parts[0]), "dels": int(parts[1]), "path": parts[2].strip()})
    adds = sum(r["adds"] for r in rows)
    dels = sum(r["dels"] for r in rows)
    files = int(tm.group(1)) if tm else len(rows)
    loc = int(tm.group(2)) if tm and tm.group(2) else adds + dels
    return {"rows": rows, "files": files, "loc": loc, "adds": adds, "dels": dels}


def parse_ledger(text):
    """Change-template section-2 scan rule: entries are `## <PREFIX>-DEC-<nnn>` headings."""
    entries = []
    if not text:
        return entries
    matches = list(LEDGER_ENTRY_RE.finditer(text))
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[m.start():end]
        fm = FOLDS_RE.search(block)
        entries.append({
            "id": "%s-DEC-%s" % (m.group(1), m.group(2)),
            "question": m.group(3).strip(),
            "folds": max(1, int(fm.group(1))) if fm else 1,
            # Pending means status: OPEN. ANSWERED, RESOLVED-IN-ARM and RECORDED are all
            # terminal per the decision-entry enum (change-template section 2,
            # tools/chaos-render/schema/decision-entry.schema.json). Matching ANSWERED alone
            # made in-arm-resolved stops read as unanswered in the audit stop gate, MR-3
            # satisfaction, and pending-stop absorption (Stage-D results section 5, all 6 arms).
            "answered": bool(re.search(r"-\s*status:\s*(?:ANSWERED|RESOLVED-IN-ARM|RECORDED)",
                                       block)),
            "text": block.lower(),
        })
    return entries


def decision_surfaces(entry):
    """MR-3: keyword-inferred surface classes an ANSWERED decision covers."""
    found = set()
    for surface, words in SURFACE_KEYWORDS.items():
        if any(w in entry["text"] for w in words):
            found.add(surface)
    return found


# --- glob + patch primitives ---------------------------------------------------------------

def glob_to_regex(pattern):
    pat = pattern.replace("\\", "/")
    out, i = "", 0
    while i < len(pat):
        if pat.startswith("**/", i):
            out += "(?:.*/)?"
            i += 3
        elif pat.startswith("**", i):
            out += ".*"
            i += 2
        elif pat[i] == "*":
            out += "[^/]*"
            i += 1
        elif pat[i] == "?":
            out += "[^/]"
            i += 1
        else:
            out += re.escape(pat[i])
            i += 1
    return re.compile("^" + out + "$")


def match_path(pattern, path):
    return bool(glob_to_regex(pattern).match(path.replace("\\", "/").lstrip("./")))


def match_scope_entry(pattern, entry):
    """A class pattern hits a predicted-scope entry directly or as a directory prefix."""
    e = entry.replace("\\", "/")
    probes = [e, e.rstrip("/") + "/probe.file"]
    return any(match_path(pattern, p) for p in probes)


def route_delta(patch):
    added, removed, tombstoned = set(), set(), set()
    for raw in (patch or "").splitlines():
        if raw.startswith("+++") or raw.startswith("---"):
            continue
        sigs = {(m.group(1).upper(), m.group(2)) for m in ROUTE_RE.finditer(raw)}
        if raw.startswith("+"):
            added |= sigs
            if "StatusCode(410)" in raw:  # MR-7 impl note: 410 re-registration = removal
                tombstoned |= sigs
        elif raw.startswith("-"):
            removed |= sigs
    eff_added = added - tombstoned - removed
    eff_removed = (removed - added) | tombstoned
    return eff_added, eff_removed


def dep_delta(patch):
    added, removed = {}, {}
    for m in PKGREF_RE.finditer(patch or ""):
        (added if m.group(1) == "+" else removed)[m.group(2)] = m.group(3)
    new_deps, major, minor = [], [], []
    for name, ver in added.items():
        if name in removed:
            old_major = removed[name].split(".", 1)[0]
            (major if ver.split(".", 1)[0] != old_major else minor).append((name, removed[name], ver))
        else:
            new_deps.append((name, ver))
    return new_deps, major, minor


def rename_shaped(numstat, guard):
    files = numstat["files"]
    rows = numstat["rows"]
    if files < guard.get("minFiles", 6) or not rows or numstat["dels"] == 0:
        return False
    ratio = numstat["adds"] / float(numstat["dels"])
    if abs(ratio - 1.0) > guard.get("globalAddDeleteRatioTolerance", 0.2):
        return False
    both = sum(1 for r in rows if r["adds"] > 0 and r["dels"] > 0)
    return both / float(len(rows)) >= guard.get("minFractionFilesWithBothAddsAndDeletes", 0.8)


def x1_level(files, loc, thresholds):
    r2, r1 = thresholds.get("review2", {}), thresholds.get("review1", {})
    if files >= r2.get("files", 20) or loc >= r2.get("loc", 1000):
        return 2
    if files >= r1.get("files", 8) or loc >= r1.get("loc", 400):
        return 1
    return 0


def vague_scope(entries):
    """MR-4 impl note: LOW-signal scope = no file entries and everything depth <= 2.
    A trailing slash marks a directory regardless of dots in its name (src/TaskTracker.Api/)."""
    if not entries:
        return True
    for e in entries:
        e_norm = e.replace("\\", "/")
        segs = [s for s in e_norm.split("/") if s]
        is_dir = e_norm.endswith("/")
        if segs and not is_dir and "." in segs[-1]:
            return False
        if len(segs) > 2:
            return False
    return True


# --- the classifier ------------------------------------------------------------------------

def compute_dimensions(state):
    """The dimension vector from cumulative state (max-of; stops by placement; C-13 openspec).

    Pure function of state — classify() uses it per verdict, and the obligation audit
    (audit.py) recomputes the SAME vector from the persisted state file, so the gate can
    never disagree with the classifier about what is owed."""
    dims = dict(state["floors"])
    fired_all = state["fired"]
    ids = {f["trigger"] for f in fired_all}

    def bump(key, val):
        dims[key] = max(dims[key], val)

    for f in fired_all:
        t = f["trigger"]
        if t == "M1":
            bump("evidence.targeted", 1)
            bump("adr", 2)
        elif t == "M2":
            bump("evidence.targeted", 1)
            bump("verify", 1)
        elif t == "M3":
            bump("verify", 1)
            bump("adr", 2 if f.get("breaking") else 1)
        elif t == "M4":
            bump("evidence.targeted", 1)
            bump("review", 1)
        elif t == "X1":
            bump("evidence.breadth", 1)
            bump("verify", 1)
            bump("review", state.get("x1Level", 0))
        elif t == "X2":
            bump("review", 2)
            bump("verify", 1)
        elif t == "X3":
            bump("verify", 1)

    if ids & OPENSPEC_BASE:
        bump("openspec", 1)
    surfaces = {f.get("surface") for f in fired_all
                if f["trigger"] in C13_COUNTED and f.get("surface")}
    if len(surfaces) >= 2 or any(f["trigger"] == "M3" and f.get("breaking") for f in fired_all):
        bump("openspec", 2)
    dims["stops"] = len(state["stopsPlaced"])
    return dims


def initial_state(mode):
    floors = dict(FLOORS.get(mode, FLOORS[None]))
    placed = ["K1:floor-approval"]
    if floors["stops"] >= 2:
        placed.append("deliver-exit:floor-signoff")
    return {"fired": [], "stopsPlaced": placed, "floors": floors, "mode": mode, "x1Level": 0,
            "checkpointsRun": [], "seenPaths": [], "scanCount": 0}


def _fired_ids(state):
    return {f["trigger"] for f in state["fired"]}


def _scan_diff_classes(numstat, patch, map_data):
    """Actual-diff class hits: (m2 hits, demoted hits, contract-artifact paths)."""
    classes = map_data["classes"]
    guard_active = rename_shaped(numstat, map_data.get("renameShapeGuard", {}))
    m2_hits, demoted, artifact_paths = [], [], []
    for row in numstat["rows"]:
        path = row["path"]
        for cname in map_data.get("m2Classes", []):
            cdef = classes.get(cname, {})
            if any(match_path(p, path) for p in cdef.get("paths", [])):
                hit = {"class": cname, "surface": cdef.get("surface"), "path": path}
                (demoted if guard_active else m2_hits).append(hit)
        cdef = classes.get("contract-artifacts", {})
        if any(match_path(p, path) for p in cdef.get("paths", [])):
            artifact_paths.append(path)
    # config-key markers (secrets class): file glob + quoted key present in the patch
    secrets = classes.get("secrets", {})
    ckm = secrets.get("configKeyMarkers")
    if ckm and patch:
        for row in numstat["rows"]:
            if match_path(ckm.get("file", ""), row["path"]):
                for key in ckm.get("keys", []):
                    if '"%s"' % key in patch:
                        m2_hits.append({"class": "secrets", "surface": secrets.get("surface"),
                                        "path": row["path"], "marker": key})
    return m2_hits, demoted, artifact_paths, guard_active


def classify(sections, checkpoint, state=None, adjudication=None, map_data=None):
    """One checkpoint pass. Pure function of (texts, checkpoint, prior state, adj raises)."""
    fm = parse_frontmatter(sections.get("frontmatter", ""))
    scope = parse_scope(sections.get("scope", ""))
    map_data = map_data or {}
    if state is None:
        state = initial_state(fm["mode"])
    already = _fired_ids(state)
    newly, echo, demoted_out = [], [], []
    classes = map_data.get("classes", {})
    # Continuous mode (Stage D): checkpoints are EVIDENCE CLASSES, not phases — K3 may run
    # once per work unit as the diff grows. scanCount is the loop cursor for resume capsules.
    state["scanCount"] = state.get("scanCount", 0) + 1
    k1_first = checkpoint == "K1" and "K1" not in state["checkpointsRun"]
    new_surface = []

    def fire(trigger, by, surface, cite, breaking=None, meta=None):
        if trigger in already or trigger in {f["trigger"] for f in newly}:
            return
        rec = {"trigger": trigger, "by": by, "surface": surface, "cite": cite,
               "checkpoint": checkpoint}
        if breaking is not None:
            rec["breaking"] = breaking
        if meta:
            rec.update(meta)
        newly.append(rec)

    # -- declared triggers (C-9): authoritative input, fire at the first checkpoint
    if not state["checkpointsRun"]:
        for decl in fm["declaredTriggers"]:
            name, _, surf = decl.partition(":")
            trig = DECLARED_NAMES.get(name.strip(), name.strip())
            fire(trig, "declared", surf.strip() or "declared",
                 "frontmatter declaredTriggers: [%s]" % decl)

    # -- K1: predicted-scope scans
    if checkpoint == "K1":
        for cname in map_data.get("m2Classes", []):
            cdef = classes.get(cname, {})
            for entry in scope["entries"]:
                if any(match_scope_entry(p, entry) for p in cdef.get("paths", [])):
                    fire("M2", "scan", cdef.get("surface"),
                         "%s class: predicted scope includes %s" % (cname, entry))
        if scope["predicted_files"]:
            lvl = x1_level(scope["predicted_files"], 0, map_data.get("x1Thresholds", {}))
            if lvl:
                state["x1Level"] = max(state["x1Level"], lvl)
                fire("X1", "scan", None,
                     "predicted ~%d files meets review%d threshold" % (scope["predicted_files"], lvl))

    # -- K2+: ledger scans (M4 per the section-2 scan rule)
    ledger = parse_ledger(sections.get("ledger", "")) if checkpoint != "K1" else []
    if checkpoint in ("K2", "K3", "K4") and sections.get("ledger"):
        # M4 measures material QUESTIONS, not ledger formatting. Counting headings made the
        # trigger bimodal: stop-folding (design 5.3 law 2) collapses N questions into ONE entry,
        # so a heavily-decisioned change could never reach the threshold, while any small change
        # was one extra entry away from tripping it. Measured 2026-08-03, step-5 core tier.
        questions = sum(e["folds"] for e in ledger)
        if questions >= MAX_MATERIAL_DECISIONS:
            fire("M4", "scan", "process",
                 "ledger scan rule: %d material question(s) across %d entr%s >= threshold %d"
                 % (questions, len(ledger), "y" if len(ledger) == 1 else "ies",
                    MAX_MATERIAL_DECISIONS))

    # -- K3: actual-diff scans
    redetected = set()
    if checkpoint == "K3" and sections.get("numstat"):
        numstat = parse_numstat(sections["numstat"])
        patch = sections.get("patch", "")
        # New-surface tracking (Stage D continuous form of C-12): adjudication is due only
        # when this scan's diff contains paths no earlier scan has seen. The two-call pattern
        # stays correct — the merge call replays the same paths, sees nothing new, reports
        # adjudicationDue false.
        seen = set(state.get("seenPaths", []))
        scan_paths = {r["path"].replace("\\", "/") for r in numstat["rows"]}
        new_surface = sorted(scan_paths - seen)
        state["seenPaths"] = sorted(seen | scan_paths)
        m2_hits, demoted, artifact_paths, guard = _scan_diff_classes(numstat, patch, map_data)
        if m2_hits:
            h = m2_hits[0]
            redetected.add("M2")
            fire("M2", "scan", h["surface"],
                 "%s class: %s in diff%s" % (h["class"], h["path"],
                                             " (marker %s)" % h["marker"] if "marker" in h else ""))
        demoted_out = [dict(d, reason="rename-shape guard (C-14)") for d in demoted]

        # M3: route delta / contract artifacts / dependency manifests
        eff_added, eff_removed = route_delta(patch)
        new_deps, major_bumps, minor_bumps = dep_delta(patch)
        artifact_breaking = any(
            YAML_PROP_REMOVED_RE.match(line) for line in (patch or "").splitlines()
        ) and bool(artifact_paths)
        m3_fired = False
        if eff_removed:
            fire("M3", "scan", "contract-dependency",
                 "route delta: removed/tombstoned %s" % sorted("%s %s" % s for s in eff_removed),
                 breaking=True)
            m3_fired = True
        elif artifact_paths and artifact_breaking:
            fire("M3", "scan", "contract-dependency",
                 "contract artifact %s: removed property line" % artifact_paths[0], breaking=True)
            m3_fired = True
        elif eff_added:
            fire("M3", "scan", "contract-dependency",
                 "route delta: added %s (additive)" % sorted("%s %s" % s for s in eff_added),
                 breaking=False)
            m3_fired = True
        elif new_deps or major_bumps:
            what = new_deps or major_bumps
            fire("M3", "scan", "contract-dependency",
                 "dependency manifest: %s %s" % ("new direct" if new_deps else "major bump",
                                                 what[0][0]),
                 breaking=bool(major_bumps))
            m3_fired = True
        elif artifact_paths:
            fire("M3", "scan", "contract-dependency",
                 "contract artifact touched: %s (additive)" % artifact_paths[0], breaking=False)
            m3_fired = True
        if m3_fired:
            redetected.add("M3")
        if minor_bumps and not new_deps and not major_bumps:
            redetected.add("X3")
            fire("X3", "scan", None,
                 "dependency manifest: patch/minor bump %s %s -> %s" % minor_bumps[0])

        # M5: scope spill
        if scope["entries"]:
            spilled = []
            for row in numstat["rows"]:
                path = row["path"].replace("\\", "/")
                ok = False
                for entry in scope["entries"]:
                    e = entry.replace("\\", "/").rstrip("/")
                    if path == e or path.startswith(e + "/"):
                        ok = True
                        break
                if not ok:
                    spilled.append(path)
            if spilled:
                fire("M5", "scan", None,
                     "diff touches %s, not in the approved scope" % ", ".join(sorted(spilled)))

        # X1 actual
        lvl = x1_level(numstat["files"], numstat["loc"], map_data.get("x1Thresholds", {}))
        if lvl:
            redetected.add("X1")
            state["x1Level"] = max(state["x1Level"], lvl)
            fire("X1", "scan", None,
                 "numstat: %d files / %d LOC meets review%d threshold%s"
                 % (numstat["files"], numstat["loc"], lvl,
                    "; rename-shaped (guard active)" if guard else ""))

    # -- K4: self-review verdict
    if checkpoint == "K4" and fm.get("selfReview") and fm["selfReview"] != "clean":
        fire("X2", "scan", None, "self-review verdict '%s' != clean" % fm["selfReview"])

    # -- adjudication merge (raise-only; C-6/C-7)
    adj_used = False
    for raise_ in (adjudication or {}).get("raises", []):
        trig = raise_.get("trigger")
        if trig in MATERIALITY and trig not in already and trig not in {f["trigger"] for f in newly}:
            fire(trig, "adjudication", raise_.get("surface"),
                 raise_.get("cite", ""), breaking=raise_.get("breaking"))
            adj_used = True

    # -- scan echo: previously fired, diff-evidenced triggers the K3 scan re-detects
    if checkpoint == "K3":
        echo = sorted(t for t in redetected if t in already)

    # -- stops (union of placed stops; folding per checkpoint; MR-3 satisfaction;
    #    Stage-D pending-stop absorption)
    stop_demands = [f for f in newly
                    if f["trigger"] in {"M1", "M2", "M5"}
                    or (f["trigger"] == "M3" and f.get("breaking"))]
    new_stops = 0
    satisfied_by = None
    absorbed_by = None
    if stop_demands:
        if checkpoint == "K1":
            new_stops = 0  # folds into the mandatory FRAME approval stop (fold-absorber)
        else:
            all_entries = parse_ledger(sections.get("ledger", ""))
            answered = [e for e in all_entries if e["answered"]]
            pending = [e for e in all_entries if not e["answered"]]
            covered = []
            for f in stop_demands:
                surf = f.get("surface")
                match = next((e for e in answered if surf and surf in decision_surfaces(e)), None)
                covered.append(match)
            if all(covered) and covered:
                satisfied_by = sorted({e["id"] for e in covered})
            elif pending:
                # Pending-stop absorption (Stage D): continuous scanning produces more scan
                # events than four checkpoints; a new stop per event would un-fold what 5.3
                # law 2 folds. While a stop is pending unanswered, new demands attach to it —
                # the caller amends that decision's presentation (and its `folds:` count)
                # instead of surfacing a second interruption.
                absorbed_by = sorted(e["id"] for e in pending)
            else:
                state["stopsPlaced"].append("%s:trigger-fold" % checkpoint)
                new_stops = 1

    # -- dimensions (max-of; stops by placement; C-13 openspec)
    state["fired"] = state["fired"] + newly
    fired_all = state["fired"]
    dims = compute_dimensions(state)

    # -- confidence (MR-4)
    if any(f["by"] == "adjudication" for f in newly):
        confidence = "MEDIUM"
    elif not fired_all and vague_scope(scope["entries"]):
        confidence = "LOW"
    else:
        confidence = "HIGH"

    # A checkpoint SET, not a call log. The two-call pattern (scan, then merge adjudication)
    # invokes each checkpoint twice, so appending unconditionally made four checkpoints read as
    # six entries and misled anyone auditing the trail (step-5 extended tier, findings 12).
    # Note the declared-trigger gate above keys off this being empty — deduping preserves that:
    # declarations still fire exactly once, on the first call of the first checkpoint.
    if checkpoint not in state["checkpointsRun"]:
        state["checkpointsRun"].append(checkpoint)
    verdict = {
        "checkpoint": checkpoint,
        "newlyFired": newly,
        "scanEcho": echo,
        "demotedCandidates": demoted_out,
        "newStops": new_stops,
        "stopsPlaced": list(state["stopsPlaced"]),
        "dimensions": {k: dims[k] for k in DIM_KEYS},
        "confidence": confidence,
        "adjudicationRan": checkpoint in ("K1", "K3"),  # C-12 cadence
        # Continuous-mode fields (Stage D): the loop runs the model adjudication pass only
        # when this is true — first K1 call, or a K3 scan whose diff grew new paths.
        "adjudicationDue": k1_first or (checkpoint == "K3" and bool(new_surface)),
        "scanSeq": state["scanCount"],
    }
    if checkpoint == "K3":
        verdict["newSurfacePaths"] = new_surface
    if satisfied_by:
        verdict["stopSatisfiedBy"] = satisfied_by
    if absorbed_by:
        verdict["stopAbsorbedBy"] = absorbed_by
    if adj_used:
        verdict["adjudicationRaised"] = True
    return verdict, state


# --- fixture adapter + packets ---------------------------------------------------------------

def load_seed(path):
    with open(path, encoding="utf-8") as f:
        sections = parse_seed_file(f.read())
    base = os.path.dirname(os.path.abspath(path))
    if "posture" not in sections:
        default = os.path.join(base, "..", "assets", "architecture-posture.d27600f.md")
        if os.path.exists(default):
            with open(default, encoding="utf-8") as f:
                sections["posture"] = f.read()
    return sections


def load_map(seed_path, map_path=None):
    path = map_path or os.path.join(os.path.dirname(os.path.abspath(seed_path)),
                                    "..", "assets", "path-class-map.json")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


PACKET_EVIDENCE = {  # what exists at each checkpoint (design doc section 3)
    "K1": ("frontmatter", "intent", "scope", "posture"),
    "K2": ("frontmatter", "intent", "scope", "posture", "ledger"),
    "K3": ("frontmatter", "intent", "scope", "posture", "ledger", "numstat", "patch"),
    "K4": ("frontmatter", "intent", "scope", "posture", "ledger", "numstat", "patch"),
}


def sanitized_packet(seed_id, checkpoint, sections, verdict_scan, state):
    """Adjudication input: everything the model layer may read at THIS checkpoint, and
    NOTHING it may not (no Expected section, no seed notes, no future evidence — a K1 judge
    must not see the ledger or the diff). Blindness is the point."""

    def fired_view(f):
        view = {k: f.get(k) for k in ("trigger", "by", "surface", "cite") }
        if "breaking" in f:
            view["breaking"] = f["breaking"]
        return view

    packet = {
        "seedId": seed_id,
        "checkpoint": checkpoint,
        "instructions": "see tools/chaos-classify/adjudication-prompt.md",
        "inputs": {k: sections.get(k) for k in PACKET_EVIDENCE[checkpoint]
                   if sections.get(k)},
        "scanState": {
            "firedThisCheckpoint": [fired_view(f) for f in verdict_scan["newlyFired"]],
            "firedEarlier": [fired_view(f) | {"checkpoint": f.get("checkpoint")}
                             for f in state["fired"]
                             if f.get("checkpoint") != checkpoint],
            "demotedCandidates": verdict_scan["demotedCandidates"],
        },
    }
    return packet


def _read(path):
    with open(path, encoding="utf-8-sig") as f:
        return f.read()


def load_inline(payload_path):
    """Repo/skill adapter (step-4 wiring): a command feeds the classifier a JSON payload —
    {checkpoint, intent, scope, declaredTriggers, mode, postureFiles[], ledgerFile?,
     numstatFile?, patchFile?, mapFile}. File contents are read here; the core stays pure."""
    p = json.loads(_read(payload_path))
    decl = ", ".join(p.get("declaredTriggers", []))
    fm = "chaosMetadata:\n  mode: %s\n  declaredTriggers: [%s]\n" % (p.get("mode") or "null", decl)
    if p.get("selfReview"):
        fm += "  selfReview: %s\n" % p["selfReview"]
    sections = {"frontmatter": fm,
                "intent": p.get("intent", ""),
                "scope": p.get("scope", "")}
    if p.get("postureFiles"):
        sections["posture"] = "\n\n".join(_read(f) for f in p["postureFiles"])
    for key, fkey in (("ledger", "ledgerFile"), ("numstat", "numstatFile"),
                      ("patch", "patchFile")):
        if p.get(fkey):
            sections[key] = _read(p[fkey])
    return p, sections


def main(argv=None):
    ap = argparse.ArgumentParser(description="Stage-C trigger classifier (deterministic core)")
    ap.add_argument("seed", nargs="?", help="corpus seed file (fixture adapter)")
    ap.add_argument("--inline", default=None, metavar="PAYLOAD",
                    help="repo/skill adapter: classify one checkpoint from a JSON payload")
    ap.add_argument("--state", default=None,
                    help="classifier state file (read if present, written back after) — "
                         "the change folder's classification-state.json")
    ap.add_argument("--checkpoints", default=None, help="comma list, e.g. K1,K3 (seed mode)")
    ap.add_argument("--adjudication", default=None, help="adjudication-results JSON file")
    ap.add_argument("--map", default=None, help="path-class map (default: corpus assets)")
    args = ap.parse_args(argv)

    if args.inline:
        payload, sections = load_inline(args.inline)
        map_path = payload.get("mapFile") or args.map
        if not map_path:
            ap.error("--inline needs mapFile in the payload or --map")
        with open(map_path, encoding="utf-8-sig") as f:
            map_data = json.load(f)
        state = None
        if args.state and os.path.exists(args.state):
            state = json.loads(_read(args.state))
        adj = None
        if args.adjudication:
            adj = json.loads(_read(args.adjudication))  # inline form: {"raises": [...]}
        verdict, state = classify(sections, payload["checkpoint"], state, adj, map_data)
        if args.state:
            with open(args.state, "w", encoding="utf-8") as f:
                json.dump(state, f, indent=1)
        json.dump(verdict, sys.stdout, indent=2)
        print()
        return 0

    if not args.seed:
        ap.error("need a seed file or --inline PAYLOAD")
    sections = load_seed(args.seed)
    map_data = load_map(args.seed, args.map)
    expected = json.loads(sections["expected"]) if "expected" in sections else {}
    cps = (args.checkpoints.split(",") if args.checkpoints
           else sorted(expected.get("checkpoints", {"K1": None}),
                       key=CHECKPOINT_ORDER.index))
    adj_all = {}
    if args.adjudication:
        with open(args.adjudication, encoding="utf-8") as f:
            adj_all = json.load(f)
    seed_id = os.path.splitext(os.path.basename(args.seed))[0]

    state, out = None, {}
    for cp in cps:
        adj = adj_all.get(seed_id, {}).get(cp)
        verdict, state = classify(sections, cp, state, adj, map_data)
        out[cp] = verdict
    json.dump(out, sys.stdout, indent=2)
    print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
