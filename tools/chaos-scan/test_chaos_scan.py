#!/usr/bin/env python3
"""Unit tests for chaos-scan (stdlib unittest, real tmpdir git repo fixtures)."""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scan as S  # noqa: E402

MAP = {
    "classes": {
        "data-store": {"paths": ["src/App/Domain/**"], "surface": "data-store"},
        "secrets": {"paths": ["src/App/Config/**"], "surface": "auth"},
        "contract-artifacts": {"paths": ["contracts/**"]},
    },
    "m2Classes": ["data-store", "secrets"],
    "x1Thresholds": {"review1": {"files": 8, "loc": 400},
                     "review2": {"files": 20, "loc": 1000}},
    "renameShapeGuard": {"minFiles": 6, "globalAddDeleteRatioTolerance": 0.2,
                         "minFractionFilesWithBothAddsAndDeletes": 0.8},
}


class TestScan(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.mkdtemp()
        self.cwd = os.getcwd()
        os.chdir(self.td)
        subprocess.run(["git", "init", "-q"], check=True, capture_output=True)
        subprocess.run(["git", "config", "user.email", "t@t"], check=True)
        subprocess.run(["git", "config", "user.name", "t"], check=True)
        self._write("src/App/Program.cs", "class Program {}\n")
        self._write("tests/T/Basic.cs", "class Basic {}\n")
        subprocess.run(["git", "add", "."], check=True, capture_output=True)
        subprocess.run(["git", "commit", "-q", "-m", "base"], check=True, capture_output=True)
        self.change = os.path.join(self.td, ".chaos", "changes", "demo")
        self.map_path = self._write("map.json", json.dumps(MAP))

    def tearDown(self):
        os.chdir(self.cwd)
        shutil.rmtree(self.td, ignore_errors=True)

    def _write(self, rel, content):
        path = os.path.join(self.td, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        return path

    def _k1(self, scope="scope: src/", declared="", mode=None):
        args = ["k1", "--change-dir", self.change, "--intent", "Tidy things.",
                "--scope", scope, "--subject", "src", "--subject", "tests",
                "--map", self.map_path]
        if declared:
            args += ["--declared", declared]
        if mode:
            args += ["--mode", mode]
        return S.main(args)

    def _digest(self, seq):
        with open(os.path.join(self.change, "scan", "verdict-%d.md" % seq),
                  encoding="utf-8") as f:
            return f.read()

    def _ledger(self):
        p = os.path.join(self.change, "decision-events.md")
        if not os.path.isfile(p):
            return ""
        with open(p, encoding="utf-8") as f:
            return f.read()

    def test_missing_map_fails_closed_instead_of_scanning_everything_as_immaterial(self):
        """Without a map M2 can NEVER fire, so a change on a sensitive surface scans as
        'fired: none' at HIGH confidence. That certifies material work as immaterial —
        the D4/D5 class, worst variant. It must refuse rather than degrade to empty."""
        code = S.main(["k1", "--change-dir", self.change, "--intent", "Add a field.",
                       "--scope", "scope: src/App/Domain/", "--subject", "src",
                       "--map", os.path.join(self.td, "does-not-exist.json")])
        self.assertEqual(code, 2)
        self.assertFalse(os.path.isfile(os.path.join(self.change, "scan-inputs.json")))

    def test_no_map_is_an_explicit_recorded_choice(self):
        code = S.main(["k1", "--change-dir", self.change, "--intent", "Add a field.",
                       "--scope", "scope: src/App/Domain/", "--subject", "src", "--no-map"])
        self.assertEqual(code, 0)
        with open(os.path.join(self.change, "scan-inputs.json"), encoding="utf-8") as f:
            self.assertTrue(json.load(f)["noMap"])

    def test_no_map_digest_never_leaves_fired_none_unqualified(self):
        """'fired: none' must not be readable as 'nothing sensitive was touched'."""
        S.main(["k1", "--change-dir", self.change, "--intent", "Add a field.",
                "--scope", "scope: src/App/Domain/", "--subject", "src", "--no-map"])
        d = self._digest(1)
        self.assertIn("fired: none", d)
        self.assertIn("M2 cannot fire", d)

    def test_a_map_that_moved_after_k1_is_an_error_not_a_silent_empty(self):
        self.assertEqual(self._k1(), 0)
        os.remove(self.map_path)
        with self.assertRaises(S.ScanError):
            S.load_map(S.load_inputs(self.change))

    def test_k1_zero_trigger(self):
        self.assertEqual(self._k1(), 0)
        d = self._digest(1)
        self.assertIn("fired: none", d)
        self.assertIn("adjudication: DUE", d)          # first K1 call is always due
        self.assertIn("stops: none demanded", d)
        self.assertTrue(os.path.isfile(os.path.join(self.change, "scan", "packet-1.json")))
        self.assertTrue(os.path.isfile(os.path.join(self.change, "classification-state.json")))
        self.assertEqual(self._ledger(), "")           # nothing fired => no TRG, no ledger

    def test_declared_trigger_fires_and_trg_appended(self):
        self.assertEqual(self._k1(declared="sensitive-surface:auth"), 0)
        d = self._digest(1)
        self.assertIn("FIRED M2 (by declared, surface auth) [TRG-001]", d)
        ledger = self._ledger()
        self.assertIn("## TRG-001 — trigger fired: M2 sensitive-surface", ledger)
        self.assertIn("- status: RECORDED (", ledger)
        self.assertIn("- cite: frontmatter declaredTriggers: [sensitive-surface:auth]", ledger)
        self.assertIn("- dimensions-after: stops 1", ledger)

    def test_merge_fails_closed_without_cite(self):
        self._k1()
        raises = self._write("raises.json",
                             json.dumps({"raises": [{"trigger": "M1", "surface": "auth",
                                                     "cite": "  "}]}))
        self.assertEqual(S.main(["merge", "--change-dir", self.change,
                                 "--raises", raises]), 2)
        bad = self._write("bad.json",
                          json.dumps({"raises": [{"trigger": "X1", "cite": "c"}]}))
        self.assertEqual(S.main(["merge", "--change-dir", self.change, "--raises", bad]), 2)

    def test_merge_applies_valid_raise(self):
        self._k1()
        raises = self._write("raises.json", json.dumps(
            {"raises": [{"trigger": "M1", "surface": "data-store",
                         "cite": "intent line 1: crosses retention posture"}]}))
        self.assertEqual(S.main(["merge", "--change-dir", self.change,
                                 "--raises", raises]), 0)
        d = self._digest(2)
        self.assertIn("FIRED M1 (by adjudication, surface data-store)", d)
        self.assertIn("cite: intent line 1: crosses retention posture", d)
        self.assertIn("## TRG-001 — trigger fired: M1 posture-crossing", self._ledger())

    def test_rescan_fires_dedupes_and_echoes(self):
        self._k1()
        self._write("src/App/Domain/Store.cs", "class Store {}\n")   # untracked, needs -N
        self.assertEqual(S.main(["rescan", "--change-dir", self.change]), 0)
        d = self._digest(2)
        self.assertIn("FIRED M2 (by scan, surface data-store)", d)
        self.assertIn("stops: +1 placed", d)
        self.assertIn("new surface paths: src/App/Domain/Store.cs", d)
        self.assertIn("adjudication: DUE", d)
        self.assertIn("## TRG-001 — trigger fired: M2 sensitive-surface", self._ledger())
        # same diff again: dedupe, echo, nothing due
        self.assertEqual(S.main(["rescan", "--change-dir", self.change]), 0)
        d3 = self._digest(3)
        self.assertIn("fired: none", d3)
        self.assertIn("echo (already fired, re-detected): M2", d3)
        self.assertIn("adjudication: not due", d3)
        self.assertIn("stops: none demanded", d3)
        self.assertNotIn("TRG-002", self._ledger())

    def test_spill_absorbed_by_pending_stop(self):
        self._k1()
        self._write(os.path.join(self.change.replace(self.td + os.sep, ""), "x"), "")  # noop
        ledger = ("## RUN-DEC-001 — approve as framed?\n\n- status: OPEN\n"
                  "- approves-change: true\n")
        self._write(".chaos/changes/demo/decision-events.md", ledger)
        self._write("tests/T/Basic.cs", "class Basic { int x; }\n")  # outside scope: src/
        self.assertEqual(S.main(["rescan", "--change-dir", self.change]), 0)
        d = self._digest(2)
        self.assertIn("FIRED M5", d)
        self.assertIn("stops: ABSORBED by pending RUN-DEC-001", d)
        self.assertIn("increment `folds:`", d)

    def test_k2_counts_questions(self):
        self._k1()
        self._write(".chaos/changes/demo/decision-events.md",
                    "## RUN-DEC-001 — a\n\n- status: ANSWERED (m, d)\n\n"
                    "## RUN-DEC-002 — b\n\n- status: RESOLVED-IN-ARM\n")
        self.assertEqual(S.main(["k2", "--change-dir", self.change]), 0)
        self.assertIn("FIRED M4", self._digest(2))

    def test_k4_self_review(self):
        self._k1()
        self.assertEqual(S.main(["k4", "--change-dir", self.change,
                                 "--self-review", "fail"]), 0)
        d = self._digest(2)
        self.assertIn("FIRED X2", d)
        self.assertIn("adjudication: not due", d)      # K4 never sets it

    def test_k4_clean_does_not_fire_x2(self):
        self._k1()
        self.assertEqual(S.main(["k4", "--change-dir", self.change,
                                 "--self-review", "clean"]), 0)
        self.assertIn("fired: none", self._digest(2))

    def test_k4_rejects_free_text_verdicts(self):
        """Lever-run defect D3: free text let 6/6 arms pass 'pass'/'PASS', firing X2 and
        buying an unowed review + verify pass. The value is now a constrained choice."""
        self._k1()
        for bad in ("pass", "PASS", "issues-found", "ok"):
            with self.assertRaises(SystemExit):
                S.main(["k4", "--change-dir", self.change, "--self-review", bad])

    def test_update_scope_requires_decision(self):
        self._k1()
        self.assertEqual(S.main(["update-scope", "--change-dir", self.change,
                                 "--scope", "scope: src/, tests/", "--decision", " "]), 2)
        self.assertEqual(S.main(["update-scope", "--change-dir", self.change,
                                 "--scope", "scope: src/, tests/",
                                 "--decision", "RUN-DEC-002"]), 0)
        with open(os.path.join(self.change, "scan-inputs.json"), encoding="utf-8") as f:
            inputs = json.load(f)
        self.assertEqual(inputs["scopeUpdatedBy"], "RUN-DEC-002")
        self.assertEqual(inputs["scope"], "scope: src/, tests/")

    def test_rescan_without_k1_fails_cleanly(self):
        self.assertEqual(S.main(["rescan", "--change-dir", self.change]), 2)

    # --- tier banding (L1 §8) ------------------------------------------------------------

    def _contract(self, statements):
        self._write(".chaos/changes/demo/records/contract.json", json.dumps({
            "schemaVersion": 1, "recordType": "contract", "changeId": "demo",
            "sourceCommand": "chaos:run", "run": "RUN-t",
            "recordedAt": "2026-01-01T00:00:00Z", "statements": statements}))

    def _tier(self, *paths, **kw):
        return S.compute_tier(self.change, list(paths), kw.get("covers"),
                              kw.get("acceptance_exit"), MAP)

    def test_tier_t2_on_fired_surface(self):
        """Gate 1: a unit touching a class whose surface has FIRED is ceiling."""
        self._k1(declared="sensitive-surface:data-store")   # fires M2, surface data-store
        v = self._tier("src/App/Domain/Store.cs")
        self.assertEqual(v["tier"], "T2")
        self.assertEqual(v["gate"], "fired-surface")

    def test_tier_t2_on_sensitive_surface_before_it_fires(self):
        """Gate 2 (prospective): the FIRST unit cannot walk into auth pre-scan."""
        self._k1()
        v = self._tier("src/App/Config/appsettings.json")
        self.assertEqual((v["tier"], v["gate"]), ("T2", "sensitive-surface"))

    def test_tier_t2_on_coupled_evidence(self):
        """Gate 3: a test encoding a FIRED surface's contract is not routine (the P1 lesson)."""
        self._k1(declared="sensitive-surface:data-store")
        self._contract([{"id": "C-001", "text": "The store persists a soft delete marker."}])
        v = self._tier("tests/T/StoreTests.cs", covers=["C-001"])
        self.assertEqual((v["tier"], v["gate"]), ("T2", "coupled-evidence"))

    def test_tier_t1_when_disjoint(self):
        self._k1(declared="sensitive-surface:data-store")
        v = self._tier("src/App/Dto/Widget.cs", "tests/T/WidgetDtoTests.cs")
        self.assertEqual(v["tier"], "T1")
        self.assertIn("t0Blocked", v)          # T1 but no T0 route offered

    def test_tier_t0_route_a_requires_a_FAILING_check(self):
        self._k1()
        v = self._tier("src/App/Dto/Widget.cs", acceptance_exit=1)
        self.assertEqual((v["tier"], v["route"]), ("T0", "A"))
        passing = self._tier("src/App/Dto/Widget.cs", acceptance_exit=0)
        self.assertEqual(passing["tier"], "T1")            # already green => nothing to do
        self.assertIn("passes already", passing["t0Blocked"])

    def test_route_b_is_closed_even_for_perfectly_pinned_statements(self):
        """Closed 2026-08-04 after its first real test failed: the floor tier shipped a
        contract violation and certified it green, because it wrote the tests that checked
        it. A perfectly pinned statement is exactly the case that used to reach T0 — it must
        not any more, or the closure is cosmetic."""
        self._k1()
        self._contract([{"id": "C-001", "text": "`GET /widgets/summary` returns 200."},
                        {"id": "C-002", "text": "It should feel responsive."}])
        pinned = self._tier("src/App/Dto/Widget.cs", covers=["C-001"])
        self.assertEqual(pinned["tier"], "T1")
        self.assertNotIn("route", pinned)
        self.assertIn("route B is closed", pinned["t0Blocked"])
        vague = self._tier("src/App/Dto/Widget.cs", covers=["C-002"])
        self.assertEqual(vague["tier"], "T1")

    def test_route_a_still_reaches_t0(self):
        """Route A is deliberately untouched: its acceptance check pre-exists the unit and
        cannot be authored by the executor — the property Route B lacked."""
        self._k1()
        v = self._tier("src/App/Dto/Widget.cs", acceptance_exit=1)
        self.assertEqual((v["tier"], v["route"]), ("T0", "A"))

    def test_covers_still_drives_the_coupled_evidence_gate(self):
        """--covers is not dead: gate 3 still uses it to send coupled evidence to ceiling."""
        self._k1(declared="sensitive-surface:data-store")
        self._contract([{"id": "C-001", "text": "the data-store migration keeps `Id` stable"}])
        v = self._tier("src/App/Dto/Widget.cs", covers=["C-001"])
        self.assertEqual(v["tier"], "T2")
        self.assertEqual(v["gate"], "coupled-evidence")

    def test_tier_t0_needs_file_level_paths_and_small_radius(self):
        self._k1()
        d = self._tier("src/App/Dto/", acceptance_exit=1)
        self.assertEqual(d["tier"], "T1")
        self.assertIn("file-level", d["t0Blocked"])
        many = self._tier(*["src/App/Dto/F%d.cs" % i for i in range(8)], acceptance_exit=1)
        self.assertEqual(many["tier"], "T1")
        self.assertIn("X1 review1", many["t0Blocked"])

    def test_tier_escalates_one_rung_then_latches(self):
        self._k1()
        self.assertEqual(self._tier("src/App/Dto/W.cs", acceptance_exit=1)["tier"], "T0")
        first = S.record_escalation(self.change, "T0")
        self.assertEqual((first["redoAt"], first["budgetSpent"], first["latched"]),
                         ("T1", 1, False))
        # still bandable after one escalation
        self.assertEqual(self._tier("src/App/Dto/W.cs", acceptance_exit=1)["tier"], "T0")
        second = S.record_escalation(self.change, "T1")
        self.assertEqual((second["redoAt"], second["latched"]), ("T2", True))
        latched = self._tier("src/App/Dto/W.cs", acceptance_exit=1)
        self.assertEqual((latched["tier"], latched["gate"]), ("T2", "budget"))

    def test_tier_t2_without_declared_paths(self):
        self._k1()
        self.assertEqual(self._tier()["gate"], "declared-paths")

    def test_tier_cli(self):
        self._k1()
        rc = S.main(["tier", "--change-dir", self.change,
                     "--unit-path", "src/App/Dto/W.cs",
                     "--acceptance-check", "%s -c \"import sys; sys.exit(1)\"" % sys.executable])
        self.assertEqual(rc, 0)

    def test_run_id_stamped_on_trg(self):
        self.assertEqual(S.main(["k1", "--change-dir", self.change, "--intent", "x",
                                 "--scope", "scope: src/", "--subject", "src",
                                 "--map", self.map_path,
                                 "--declared", "sensitive-surface:auth",
                                 "--run", "RUN-2026-08-03-demo-abc"]), 0)
        self.assertIn("· run: RUN-2026-08-03-demo-abc", self._ledger())


if __name__ == "__main__":
    unittest.main()
