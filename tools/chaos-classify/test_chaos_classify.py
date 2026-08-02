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


if __name__ == "__main__":
    unittest.main()
