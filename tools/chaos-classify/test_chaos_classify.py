#!/usr/bin/env python3
"""Unit tests for the chaos-classify deterministic core (stdlib unittest)."""

import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import classify as C

MAP = {
    "classes": {
        "auth": {"surface": "auth", "paths": ["src/**/Security/**", "src/**/*ApiKey*"]},
        "secrets": {"surface": "auth", "paths": ["**/*.pem"],
                    "configKeyMarkers": {"file": "**/appsettings*.json",
                                         "keys": ["ApiKey", "Token"]}},
        "persistence": {"surface": "data-store", "paths": ["src/**/Domain/**", "**/Migrations/**", "**/*.sql"]},
        "contract-artifacts": {"surface": "contract-dependency", "paths": ["**/*.openapi.*"]},
    },
    "m2Classes": ["auth", "secrets", "persistence"],
    "renameShapeGuard": {"minFiles": 6, "globalAddDeleteRatioTolerance": 0.2,
                         "minFractionFilesWithBothAddsAndDeletes": 0.8},
    "x1Thresholds": {"review1": {"files": 8, "loc": 400}, "review2": {"files": 20, "loc": 1000}},
}


class TestPrimitives(unittest.TestCase):
    def test_glob_dir_and_file(self):
        self.assertTrue(C.match_path("src/**/Domain/**", "src/App/Domain/TaskItem.cs"))
        self.assertTrue(C.match_scope_entry("src/**/Domain/**", "src/App/Domain/"))
        self.assertFalse(C.match_path("src/**/Domain/**", "src/App/Endpoints/T.cs"))
        self.assertTrue(C.match_path("**/*.pem", "a/b/key.pem"))
        self.assertTrue(C.match_path("docker-compose*", "docker-compose.override.yml"))
        self.assertFalse(C.match_path("**/*.pem", "tools/demo-signing.key"))

    def test_numstat_totals_trailer(self):
        n = C.parse_numstat("4\t4\ta.cs\n11\t11\tb.cs\n# totals: files=28 loc=392\n(note)\n")
        self.assertEqual((n["files"], n["loc"]), (28, 392))
        self.assertEqual(len(n["rows"]), 2)

    def test_scope_parsing(self):
        s = C.parse_scope("scope: src/App/Sec/ (new), tests/T/, README.md (~9 files predicted)")
        self.assertEqual(s["entries"], ["src/App/Sec/", "tests/T/", "README.md"])
        self.assertEqual(s["predicted_files"], 9)

    def test_space_separated_scope_is_a_list_not_one_entry(self):
        """The T1 defect: commas-only splitting collapsed a space-separated declaration into a
        single entry that matched nothing, so every touched file read as spill and M5 fired on a
        correct declaration. Verbatim the scope line that triggered it."""
        s = C.parse_scope("src/TaskTracker.Api/Endpoints/TaskEndpoints.cs "
                          "tests/TaskTracker.Tests/TaskEndpointsTests.cs")
        self.assertEqual(s["entries"], ["src/TaskTracker.Api/Endpoints/TaskEndpoints.cs",
                                        "tests/TaskTracker.Tests/TaskEndpointsTests.cs"])

    def test_declared_files_match_their_own_scope_entries(self):
        """The property that actually failed: a file named in the scope must not read as spill."""
        for line in ("src/App/F.cs tests/T/FTests.cs",          # space-separated
                     "src/App/F.cs, tests/T/FTests.cs",         # comma-separated
                     "src/App/F.cs,tests/T/FTests.cs"):         # comma, no space
            entries = C.parse_scope(line)["entries"]
            self.assertEqual(len(entries), 2, line)
            self.assertTrue(any(C.match_scope_entry("src/App/F.cs", e) for e in entries), line)
            self.assertTrue(any(C.match_scope_entry("tests/T/FTests.cs", e) for e in entries), line)

    def test_rename_shape(self):
        sym = "\n".join("%d\t%d\tf%d.cs" % (i + 2, i + 2, i) for i in range(8))
        self.assertTrue(C.rename_shaped(C.parse_numstat(sym), MAP["renameShapeGuard"]))
        asym = "\n".join("%d\t%d\tf%d.cs" % (90, 30, i) for i in range(8))
        self.assertFalse(C.rename_shaped(C.parse_numstat(asym), MAP["renameShapeGuard"]))
        small = "4\t4\ta.cs\n3\t3\tb.cs\n"
        self.assertFalse(C.rename_shaped(C.parse_numstat(small), MAP["renameShapeGuard"]))

    def test_route_delta(self):
        cancel = '-  app.MapGet("/tasks", x);\n+  app.MapGet("/tasks", y);\n'
        self.assertEqual(C.route_delta(cancel), (set(), set()))
        add = '+  app.MapGet("/tasks/count", h);\n'
        a, r = C.route_delta(add)
        self.assertEqual(a, {("GET", "/tasks/count")})
        self.assertFalse(r)
        tomb = ('-  app.MapDelete("/t/{id}", real);\n'
                '+  app.MapPost("/t/{id}/archive", h);\n'
                '+  app.MapDelete("/t/{id}", () => Results.StatusCode(410));\n')
        a, r = C.route_delta(tomb)
        self.assertIn(("POST", "/t/{id}/archive"), a)
        self.assertIn(("DELETE", "/t/{id}"), r)

    def test_dep_delta(self):
        bump = ('-    <PackageReference Include="A.B" Version="8.0.4" />\n'
                '+    <PackageReference Include="A.B" Version="8.0.6" />\n')
        new, major, minor = C.dep_delta(bump)
        self.assertFalse(new or major)
        self.assertEqual(minor[0][0], "A.B")
        newdep = '+    <PackageReference Include="FluentValidation" Version="11.9.0" />\n'
        new, major, minor = C.dep_delta(newdep)
        self.assertEqual(new[0][0], "FluentValidation")
        big = ('-    <PackageReference Include="A.B" Version="8.0.4" />\n'
               '+    <PackageReference Include="A.B" Version="9.0.0" />\n')
        self.assertTrue(C.dep_delta(big)[1])

    def test_ledger_scan_rule(self):
        text = ("# Decision Events — x\n\n## PROP-DEC-001 — q1\n\n- status: ANSWERED (m, d)\n"
                "- why-material: the task model's soft delete / data-retention story\n\n"
                "## Runtime note\n\nnot an entry\n\n## PROP-DEC-002 — q2\n\n- status: OPEN\n")
        entries = C.parse_ledger(text)
        self.assertEqual([e["id"] for e in entries], ["PROP-DEC-001", "PROP-DEC-002"])
        self.assertTrue(entries[0]["answered"])
        self.assertFalse(entries[1]["answered"])
        self.assertIn("data-store", C.decision_surfaces(entries[0]))
        # No `folds:` declared => each entry is exactly one material question.
        self.assertEqual([e["folds"] for e in entries], [1, 1])

    def test_unknown_mode_fails_closed(self):
        """A typo'd preset must NOT silently degrade to zero floors. Found by the post-lever-run
        sweep: `--mode stricct` used to yield stops 1 / openspec 0 / adr 0 — a caller asking for
        strict governance got none, with no error."""
        self.assertEqual(C.initial_state("strict")["floors"]["stops"], 2)
        for bad in ("stricct", "Strict", "none", ""):
            with self.assertRaises(ValueError, msg=bad):
                C.initial_state(bad)
        self.assertEqual(C.initial_state(None)["floors"]["stops"], 1)   # no preset stays valid

    def test_unknown_declared_trigger_fails_closed(self):
        """A typo'd declaration used to fire a PHANTOM trigger: recorded in state (and emitted
        as a TRG event) while bumping no dimension — it looked like governance and owed
        nothing. Both the declared name and the raw trigger id must keep working."""
        def run(decl):
            sections = {"frontmatter":
                        "chaosMetadata:\n  mode: null\n  declaredTriggers: [%s]\n" % decl,
                        "intent": "x", "scope": "scope: src/App/File.cs"}
            return C.classify(sections, "K1", None, None, MAP)[0]
        self.assertEqual([f["trigger"] for f in run("sensitive-surface:auth")["newlyFired"]],
                         ["M2"])
        self.assertEqual([f["trigger"] for f in run("M2")["newlyFired"]], ["M2"])
        for bad in ("sensitve-surface:auth", "garbage", "M9"):
            with self.assertRaises(ValueError, msg=bad):
                run(bad)

    def test_terminal_statuses_read_as_answered(self):
        """Only OPEN is pending; RESOLVED-IN-ARM and RECORDED are terminal (Stage-D results
        section 5: the ANSWERED-only match made every in-arm-resolved stop read as unanswered
        in the audit stop gate, MR-3 satisfaction, and pending-stop absorption)."""
        text = ("## RUN-DEC-001 — a\n\n- status: RESOLVED-IN-ARM\n\n"
                "## RUN-DEC-002 — b\n\n- status: RECORDED (2026-08-03) · run: RUN-X\n\n"
                "## RUN-DEC-003 — c\n\n- status: OPEN\n")
        entries = C.parse_ledger(text)
        self.assertEqual([e["answered"] for e in entries], [True, True, False])

    def test_folded_questions_counted(self):
        """M4 counts material QUESTIONS, not headings (step-5 core-tier finding)."""
        one_folded = ("# Decision Events — x\n\n## PROP-DEC-001 — approve as framed?\n\n"
                      "- status: ANSWERED (m, d)\n- approves-change: true\n"
                      "- folds: 3 — accept crossing? · enforcement boundary? · key source?\n")
        entries = C.parse_ledger(one_folded)
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]["folds"], 3)
        self.assertGreaterEqual(sum(e["folds"] for e in entries), C.MAX_MATERIAL_DECISIONS)

    def test_folds_malformed_falls_back_to_one(self):
        """A missing/zero/garbage `folds:` never counts less than the entry itself."""
        for line in ("", "- folds: 0\n", "- folds: not-a-number\n"):
            entries = C.parse_ledger("## PROP-DEC-001 — q\n\n- status: OPEN\n" + line)
            self.assertEqual(entries[0]["folds"], 1, line)

    def test_checkpoints_run_is_a_set_not_a_call_log(self):
        """The two-call pattern invokes each checkpoint twice (scan, then adjudication merge).

        Appending unconditionally made four checkpoints read as six entries in the state file
        and misled anyone auditing the trail (step-5 extended tier, findings 12)."""
        sections = {"frontmatter": "chaosMetadata:\n  mode: null\n  declaredTriggers: []\n",
                    "intent": "Tidy a README typo.",
                    "scope": "scope: README.md"}
        state = None
        for _ in range(2):                       # scan call, then the merge call
            _, state = C.classify(sections, "K1", state, None, MAP)
        self.assertEqual(state["checkpointsRun"], ["K1"])
        for _ in range(2):
            _, state = C.classify(sections, "K2", state, None, MAP)
        self.assertEqual(state["checkpointsRun"], ["K1", "K2"])

    def test_declared_triggers_still_fire_exactly_once(self):
        """Guard the dedupe: the declared-trigger gate keys off checkpointsRun being empty."""
        sections = {"frontmatter":
                    "chaosMetadata:\n  mode: null\n  declaredTriggers: [sensitive-surface:auth]\n",
                    "intent": "Rotate a credential.",
                    "scope": "scope: src/App/Config.cs"}
        state = None
        first, state = C.classify(sections, "K1", state, None, MAP)
        second, state = C.classify(sections, "K1", state, None, MAP)
        self.assertEqual([f["trigger"] for f in first["newlyFired"]], ["M2"])
        self.assertEqual(second["newlyFired"], [])          # already fired, not re-fired
        self.assertEqual(len([f for f in state["fired"] if f["trigger"] == "M2"]), 1)

    def test_vague_scope(self):
        self.assertTrue(C.vague_scope(["src/App/", "tests/T/"]))
        self.assertFalse(C.vague_scope(["src/App/Endpoints/File.cs"]))
        self.assertFalse(C.vague_scope(["tools/ops/smoke/"]))

    def test_x1_levels(self):
        t = MAP["x1Thresholds"]
        self.assertEqual(C.x1_level(5, 100, t), 0)
        self.assertEqual(C.x1_level(9, 100, t), 1)
        self.assertEqual(C.x1_level(5, 500, t), 1)
        self.assertEqual(C.x1_level(22, 100, t), 2)
        self.assertEqual(C.x1_level(5, 1200, t), 2)


class TestClassify(unittest.TestCase):
    def _run(self, sections, cps, adj=None):
        state, out = None, {}
        for cp in cps:
            v, state = C.classify(sections, cp, state, (adj or {}).get(cp), MAP)
            out[cp] = v
        return out, state

    def test_declared_trigger_and_fold(self):
        sections = {"frontmatter": "chaosMetadata:\n  mode: null\n  declaredTriggers: [sensitive-surface:auth]\n",
                    "intent": "x", "scope": "scope: src/App/Program.cs"}
        out, _ = self._run(sections, ["K1"])
        f = out["K1"]["newlyFired"][0]
        self.assertEqual((f["trigger"], f["by"], f["surface"]), ("M2", "declared", "auth"))
        self.assertEqual(out["K1"]["newStops"], 0)  # folds into the floor stop
        self.assertEqual(out["K1"]["dimensions"]["stops"], 1)
        self.assertEqual(out["K1"]["confidence"], "HIGH")

    def test_strict_floor_is_not_a_trigger(self):
        sections = {"frontmatter": "chaosMetadata:\n  mode: strict\n  declaredTriggers: []\n",
                    "intent": "docs", "scope": "scope: README.md"}
        out, _ = self._run(sections, ["K1"])
        self.assertEqual(out["K1"]["newlyFired"], [])
        self.assertEqual(out["K1"]["dimensions"], {
            "stops": 2, "evidence.targeted": 1, "evidence.breadth": 2,
            "review": 2, "verify": 2, "openspec": 2, "adr": 1})
        self.assertEqual(out["K1"]["newStops"], 0)

    def test_m4_fires_at_k2_not_k1(self):
        ledger = "## PROP-DEC-001 — a\n\n- status: ANSWERED (m, d)\n\n## PROP-DEC-002 — b\n\n- status: ANSWERED (m, d)\n"
        sections = {"frontmatter": "chaosMetadata:\n  mode: null\n  declaredTriggers: []\n",
                    "intent": "vague ask", "scope": "scope: src/App/, tests/", "ledger": ledger}
        out, _ = self._run(sections, ["K1", "K2"])
        self.assertEqual(out["K1"]["newlyFired"], [])
        self.assertEqual(out["K1"]["confidence"], "LOW")
        self.assertEqual([f["trigger"] for f in out["K2"]["newlyFired"]], ["M4"])
        self.assertEqual(out["K2"]["dimensions"]["openspec"], 1)
        self.assertEqual(out["K2"]["confidence"], "HIGH")

    def test_k3_stop_placed_vs_satisfied(self):
        numstat = "9\t1\tsrc/App/Domain/Store.cs\n12\t2\tsrc/App/Endpoints/E.cs\n"
        base = {"frontmatter": "chaosMetadata:\n  mode: null\n  declaredTriggers: []\n",
                "intent": "x", "scope": "scope: src/App/Endpoints/E.cs, tests/T/",
                "numstat": numstat, "patch": ""}
        out, _ = self._run(base, ["K1", "K3"])
        trigs = {f["trigger"] for f in out["K3"]["newlyFired"]}
        self.assertEqual(trigs, {"M2", "M5"})
        self.assertEqual(out["K3"]["newStops"], 1)  # folded: one stop for both
        covered = dict(base)
        covered["scope"] = "scope: src/App/"
        covered["ledger"] = ("## PROP-DEC-001 — delete semantics\n\n- status: ANSWERED (m, d)\n"
                             "- why-material: task model store shape / data-retention\n")
        out2, _ = self._run(covered, ["K1", "K3"])
        trigs2 = {f["trigger"] for f in out2["K3"]["newlyFired"]}
        self.assertEqual(trigs2, {"M2"})  # in scope now; M2 satisfied by answered decision
        self.assertEqual(out2["K3"]["newStops"], 0)
        self.assertIn("stopSatisfiedBy", out2["K3"])

    def test_resolved_in_arm_satisfies_stop(self):
        """MR-3 satisfaction accepts RESOLVED-IN-ARM same-surface coverage, same as ANSWERED."""
        sections = {"frontmatter": "chaosMetadata:\n  mode: null\n  declaredTriggers: []\n",
                    "intent": "x", "scope": "scope: src/App/",
                    "numstat": "9\t1\tsrc/App/Domain/Store.cs\n", "patch": "",
                    "ledger": ("## RUN-DEC-001 — delete semantics\n\n- status: RESOLVED-IN-ARM\n"
                               "- why-material: task model store shape / data-retention\n")}
        out, _ = self._run(sections, ["K1", "K3"])
        self.assertEqual([f["trigger"] for f in out["K3"]["newlyFired"]], ["M2"])
        self.assertEqual(out["K3"]["newStops"], 0)
        self.assertEqual(out["K3"].get("stopSatisfiedBy"), ["RUN-DEC-001"])
        self.assertNotIn("stopAbsorbedBy", out["K3"])

    def test_c13_correlated_vs_distinct(self):
        adj_same = {"K1": {"raises": [{"trigger": "M1", "surface": "data-store", "cite": "c"}]}}
        sections = {"frontmatter": "chaosMetadata:\n  mode: null\n  declaredTriggers: []\n",
                    "intent": "x", "scope": "scope: src/App/Domain/"}
        out, _ = self._run(sections, ["K1"], adj_same)
        self.assertEqual(out["K1"]["dimensions"]["openspec"], 1)  # both data-store: correlated
        self.assertEqual(out["K1"]["confidence"], "MEDIUM")
        adj_dist = {"K1": {"raises": [{"trigger": "M1", "surface": "integration", "cite": "c"}]}}
        out2, _ = self._run(sections, ["K1"], adj_dist)
        self.assertEqual(out2["K1"]["dimensions"]["openspec"], 2)  # distinct surfaces

    def test_rename_guard_demotes(self):
        numstat = "\n".join("%d\t%d\tsrc/App/Domain/f%d.cs" % (5, 5, i) for i in range(8))
        sections = {"frontmatter": "chaosMetadata:\n  mode: null\n  declaredTriggers: []\n",
                    "intent": "rename", "scope": "scope: src/App/, tests/ (~8 files)",
                    "numstat": numstat, "patch": ""}
        out, _ = self._run(sections, ["K3"])
        trigs = {f["trigger"] for f in out["K3"]["newlyFired"]}
        self.assertNotIn("M2", trigs)
        self.assertIn("X1", trigs)
        self.assertTrue(out["K3"]["demotedCandidates"])
        self.assertEqual(out["K3"]["newStops"], 0)

    def test_x2_at_k4(self):
        sections = {"frontmatter": "chaosMetadata:\n  mode: null\n  declaredTriggers: []\n  selfReview: fail\n",
                    "intent": "x", "scope": "scope: src/App/F.cs"}
        out, _ = self._run(sections, ["K4"])
        self.assertEqual([f["trigger"] for f in out["K4"]["newlyFired"]], ["X2"])
        self.assertEqual(out["K4"]["dimensions"]["review"], 2)
        self.assertEqual(out["K4"]["newStops"], 0)

    def test_inline_adapter_roundtrip(self):
        import subprocess
        import tempfile
        here = os.path.dirname(os.path.abspath(__file__))
        with tempfile.TemporaryDirectory() as td:
            map_path = os.path.join(td, "map.json")
            json.dump(MAP, open(map_path, "w", encoding="utf-8"))
            payload = {"checkpoint": "K1", "intent": "tighten health response",
                       "scope": "scope: src/App/Program.cs",
                       "declaredTriggers": ["sensitive-surface:auth"],
                       "mode": None, "mapFile": map_path}
            ppath = os.path.join(td, "p.json")
            json.dump(payload, open(ppath, "w", encoding="utf-8"))
            spath = os.path.join(td, "state.json")
            out = subprocess.run([sys.executable, os.path.join(here, "classify.py"),
                                  "--inline", ppath, "--state", spath],
                                 capture_output=True, text=True, check=True)
            verdict = json.loads(out.stdout)
            self.assertEqual(verdict["newlyFired"][0]["trigger"], "M2")
            self.assertEqual(verdict["newlyFired"][0]["by"], "declared")
            state = json.load(open(spath, encoding="utf-8"))
            self.assertEqual(state["checkpointsRun"], ["K1"])
            # second checkpoint continues from persisted state (monotone)
            payload["checkpoint"] = "K3"
            payload["numstatFile"] = os.path.join(td, "n.txt")
            open(payload["numstatFile"], "w", encoding="utf-8").write("3\t1\tsrc/App/Program.cs\n")
            json.dump(payload, open(ppath, "w", encoding="utf-8"))
            out2 = subprocess.run([sys.executable, os.path.join(here, "classify.py"),
                                   "--inline", ppath, "--state", spath],
                                  capture_output=True, text=True, check=True)
            verdict2 = json.loads(out2.stdout)
            self.assertEqual(verdict2["newlyFired"], [])  # M2 already fired; nothing new
            self.assertEqual(verdict2["dimensions"]["verify"], 1)
            state2 = json.load(open(spath, encoding="utf-8"))
            self.assertEqual(state2["checkpointsRun"], ["K1", "K3"])

    def test_adjudication_cannot_touch_mechanical_or_refire(self):
        sections = {"frontmatter": "chaosMetadata:\n  mode: null\n  declaredTriggers: []\n",
                    "intent": "x", "scope": "scope: src/App/F.cs"}
        adj = {"K1": {"raises": [{"trigger": "X1", "surface": None, "cite": "nope"},
                                 {"trigger": "M2", "surface": "auth", "cite": "ok"},
                                 {"trigger": "M2", "surface": "auth", "cite": "dup"}]}}
        out, _ = self._run(sections, ["K1"], adj)
        self.assertEqual([f["trigger"] for f in out["K1"]["newlyFired"]], ["M2"])


class TestContinuousMode(unittest.TestCase):
    """Stage-D: checkpoints are evidence classes; K3 repeats per work unit as the diff grows."""

    FM = "chaosMetadata:\n  mode: null\n  declaredTriggers: []\n"

    def test_adjudication_due_first_k1_only(self):
        sections = {"frontmatter": self.FM, "intent": "x", "scope": "scope: src/App/F.cs"}
        first, state = C.classify(sections, "K1", None, None, MAP)
        self.assertTrue(first["adjudicationDue"])
        merge, state = C.classify(sections, "K1", state, None, MAP)  # two-call merge replay
        self.assertFalse(merge["adjudicationDue"])
        k2, _ = C.classify(sections, "K2", state, None, MAP)         # C-12: scan-only
        self.assertFalse(k2["adjudicationDue"])

    def test_repeated_k3_new_surface_drives_adjudication_due(self):
        sections = {"frontmatter": self.FM, "intent": "x",
                    "scope": "scope: src/App/, tests/",
                    "numstat": "4\t1\tsrc/App/Endpoints/A.cs\n", "patch": ""}
        v1, state = C.classify(sections, "K3", None, None, MAP)
        self.assertEqual(v1["newSurfacePaths"], ["src/App/Endpoints/A.cs"])
        self.assertTrue(v1["adjudicationDue"])
        # same diff replayed (the merge call, or an idle rescan): nothing new, no adjudication
        v2, state = C.classify(sections, "K3", state, None, MAP)
        self.assertEqual(v2["newSurfacePaths"], [])
        self.assertFalse(v2["adjudicationDue"])
        # the diff grows a new path in the next work unit: due again, only the delta reported
        grown = dict(sections)
        grown["numstat"] = "4\t1\tsrc/App/Endpoints/A.cs\n7\t0\tsrc/App/Endpoints/B.cs\n"
        v3, state = C.classify(grown, "K3", state, None, MAP)
        self.assertEqual(v3["newSurfacePaths"], ["src/App/Endpoints/B.cs"])
        self.assertTrue(v3["adjudicationDue"])
        self.assertEqual(state["seenPaths"],
                         ["src/App/Endpoints/A.cs", "src/App/Endpoints/B.cs"])

    def test_repeated_k3_monotone_and_no_refire(self):
        """P4 must hold across per-unit scans, not just across the four phase checkpoints."""
        numstat = "9\t1\tsrc/App/Domain/Store.cs\n"
        sections = {"frontmatter": self.FM, "intent": "x", "scope": "scope: src/App/",
                    "numstat": numstat, "patch": "",
                    "ledger": ("## RUN-DEC-001 — store shape\n\n- status: ANSWERED (m, d)\n"
                               "- why-material: task model store / data-retention\n")}
        v1, state = C.classify(sections, "K3", None, None, MAP)
        self.assertEqual([f["trigger"] for f in v1["newlyFired"]], ["M2"])
        dims1 = v1["dimensions"]
        v2, state = C.classify(sections, "K3", state, None, MAP)
        self.assertEqual(v2["newlyFired"], [])                    # no re-fire
        self.assertEqual(v2["scanEcho"], ["M2"])                  # but the echo is honest
        for k in C.DIM_KEYS:
            self.assertGreaterEqual(v2["dimensions"][k], dims1[k])
        self.assertEqual(v2["scanSeq"], 2)

    def test_pending_stop_absorbs_new_demand(self):
        """Stage-D absorption: while a stop is pending unanswered, new demands attach to it
        instead of interrupting again — continuous scanning must not un-fold stops."""
        base = {"frontmatter": self.FM, "intent": "x", "scope": "scope: src/App/",
                "numstat": "9\t1\tsrc/App/Domain/Store.cs\n", "patch": ""}
        v1, state = C.classify(base, "K3", None, None, MAP)
        self.assertEqual(v1["newStops"], 1)                       # M2 fires, stop placed
        # the skill surfaced that stop; it is now PENDING in the ledger; the next unit spills
        grown = dict(base)
        grown["ledger"] = "## RUN-DEC-001 — persistence surface\n\n- status: PENDING\n"
        grown["numstat"] = ("9\t1\tsrc/App/Domain/Store.cs\n"
                            "3\t0\tdeploy/pipeline.yml\n")       # out of scope -> M5
        v2, state = C.classify(grown, "K3", state, None, MAP)
        self.assertIn("M5", {f["trigger"] for f in v2["newlyFired"]})
        self.assertEqual(v2["newStops"], 0)                       # absorbed, not multiplied
        self.assertEqual(v2["stopAbsorbedBy"], ["RUN-DEC-001"])
        self.assertEqual(len([s for s in state["stopsPlaced"] if "trigger-fold" in s]), 1)
        # once answered with same-surface coverage gone stale, a NEW demand places a NEW stop
        answered = dict(grown)
        answered["ledger"] = ("## RUN-DEC-001 — persistence surface\n\n"
                              "- status: ANSWERED (m, d)\n- why-material: store shape\n")
        answered["numstat"] = ("9\t1\tsrc/App/Domain/Store.cs\n3\t0\tdeploy/pipeline.yml\n"
                               "2\t0\tsomething/else.cs\n")
        v3, _ = C.classify(answered, "K3", state, None, MAP)
        self.assertNotIn("stopAbsorbedBy", v3)

    def test_absorption_never_swallows_satisfaction(self):
        """An ANSWERED same-surface decision still satisfies (MR-3) even when an unrelated
        pending entry exists — satisfaction wins over absorption."""
        sections = {"frontmatter": self.FM, "intent": "x", "scope": "scope: src/App/",
                    "numstat": "9\t1\tsrc/App/Domain/Store.cs\n", "patch": "",
                    "ledger": ("## RUN-DEC-001 — store shape\n\n- status: ANSWERED (m, d)\n"
                               "- why-material: task model store / data-retention\n\n"
                               "## RUN-DEC-002 — unrelated open question\n\n- status: PENDING\n")}
        v, _ = C.classify(sections, "K3", None, None, MAP)
        self.assertEqual(v["newStops"], 0)
        self.assertEqual(v["stopSatisfiedBy"], ["RUN-DEC-001"])
        self.assertNotIn("stopAbsorbedBy", v)

    def test_state_backcompat_without_continuous_fields(self):
        """A Stage-C state file (no seenPaths/scanCount) must load and keep working."""
        sections = {"frontmatter": self.FM, "intent": "x", "scope": "scope: src/App/",
                    "numstat": "2\t1\tsrc/App/F.cs\n", "patch": ""}
        state = {"fired": [], "stopsPlaced": ["K1:floor-approval"],
                 "floors": dict(C.FLOORS[None]), "mode": None, "x1Level": 0,
                 "checkpointsRun": ["K1"]}
        v, state = C.classify(sections, "K3", state, None, MAP)
        self.assertEqual(v["scanSeq"], 1)
        self.assertEqual(v["newSurfacePaths"], ["src/App/F.cs"])
        self.assertEqual(state["seenPaths"], ["src/App/F.cs"])


def _corpus_present():
    """The fidelity corpus is a main-side validation asset; branches that carry only the
    product surface (demo/dotnet) do not have it. Absent corpus = skip, never fail."""
    import run_corpus
    return os.path.isdir(os.path.join(run_corpus.DEFAULT_CORPUS, "seeds"))


class TestCorpusHarnessFailsClosed(unittest.TestCase):
    """Full mode without --adjudication once produced five FAIL blocks that read as a
    classifier regression. It was a missing input. The guard must not rot back."""

    def _run(self, argv):
        import io
        import contextlib
        import run_corpus
        err = io.StringIO()
        with contextlib.redirect_stderr(err), contextlib.redirect_stdout(io.StringIO()):
            code = run_corpus.main(argv)
        return code, err.getvalue()

    def test_full_mode_without_adjudication_exits_2_not_1(self):
        """Exit 2 (usage) must be distinguishable from exit 1 (real corpus failure)."""
        code, err = self._run([])
        self.assertEqual(code, 2)
        self.assertIn("none were supplied", err)

    def test_the_error_names_both_valid_invocations(self):
        _, err = self._run([])
        self.assertIn("--adjudication", err)
        self.assertIn("--scan-only", err)

    @unittest.skipUnless(_corpus_present(), "fidelity corpus not on this branch")
    def test_scan_only_needs_no_adjudication(self):
        self.assertEqual(self._run(["--scan-only"])[0], 0)

    @unittest.skipUnless(_corpus_present(), "fidelity corpus not on this branch")
    def test_full_mode_passes_with_the_checked_in_adjudication_evidence(self):
        import run_corpus
        adj = os.path.join(run_corpus.DEFAULT_CORPUS, "evidence-adjudication-results.json")
        self.assertTrue(os.path.isfile(adj), "corpus adjudication evidence is missing")
        self.assertEqual(self._run(["--adjudication", adj])[0], 0)


if __name__ == "__main__":
    unittest.main()
