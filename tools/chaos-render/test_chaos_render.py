#!/usr/bin/env python3
"""Tests for the Stage-B renderer (tools/chaos-render/render.py).

House style: stdlib-only unittest, dynamic module load registered in sys.modules
before exec (same pattern as test_chaos_artifact_metadata_hook.py).
Fixtures mirror the golden reference (demo/dotnet secure-task-api) shapes.
"""

import importlib.util
import json
import os
import re
import shutil
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
RENDER_PATH = os.path.join(HERE, "render.py")

spec = importlib.util.spec_from_file_location("chaos_render", RENDER_PATH)
render = importlib.util.module_from_spec(spec)
sys.modules["chaos_render"] = render
spec.loader.exec_module(render)


GOLDEN_LEDGER = """---
chaosMetadata:
  schemaVersion: 1
---

# Decision Events — fixture

Append-only.

## ESC-001 — auto-escalated: intent crosses the auth non-goal

- status: RECORDED (2026-08-01)
- from: light · to: standard
- trigger: posture-crossing
- kept-work: the scoped evidence scan seeds the standard path.
- evidence: `.chaos/architecture.md` §Non-goals.
- knowledge: FACT · confidence: HIGH

## PROP-DEC-001 — What does "secure the API" cover?

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- runtime-decision: DEC-2026-08-01-fixture-scope-b66e
- options: A authn-only — smallest diff · B authn-plus-edge — A plus edge controls · C edge-only — no credentials
- recommendation: B — exposure readiness needs more than a credential check
- answer: B authn-plus-edge — rationale: "Easier for PoC"
- impact: §Contract carries authentication and edge statements.
- sync-action: AMEND_OPENSPEC_SPEC
- why-material: sets the spec deltas and the risk class
- knowledge: INFERENCE · confidence: MEDIUM

## PROP-DEC-002 — Escalate governance rigor to strict?

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- runtime-decision: DEC-2026-08-01-fixture-rigor-9cd5
- options: A strict — full manifest · B standard-with-rationale · C stop
- recommendation: A — auth is a HIGH/CRITICAL trigger
- answer: A strict — rationale: "The most reasonable answer here"
- escalates: standard → strict
- impact: mode strict; review mandatory.
- sync-action: NONE
- why-material: sets evidence depth
- knowledge: UNKNOWN · confidence: LOW

## Runtime note — session re-issued mid-resume

Not a decision entry; narrative only.

## REV-DEC-001 — REV-001 (BLOCKING): architecture still declares auth a non-goal

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- runtime-decision: DEC-2026-08-01-fixture-rev-77a8
- answer: A amend-tasks-and-record-obligation — rationale: "Needed for demo purposes"
- severity: BLOCKING · type: FACT · confidence: HIGH · fixability: FIXABLE_NOW + NEEDS_ADR_OR_DECISION_LOG
- options: A amend-tasks-and-record-obligation · B block-until-updated
- recommendation: A — records the governance obligation
- impact: tasks amended.
- sync-action: CREATE_ADR + UPDATE_CHAOS_RULES — reconcile architecture after archive
- why-material: strict cannot approve while governance contradicts the change
- knowledge: FACT · confidence: HIGH

## REV-DEC-002 — Approval handoff: approve for implementation?

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- approves-change: true
- runtime-decision: DEC-2026-08-01-fixture-approval-e123
- options: A approve-with-conditions · B request-revision
- recommendation: A — findings remediated
- answer: A approve-with-conditions — rationale: "Risk accepted"
- impact: this entry is the approval.
- sync-action: RECORD_ACCEPTED_RISK
- conditions: (1) verify confirms the gate; (2) sync reconciles the architecture
- why-material: this is the approval gate
- knowledge: FACT · confidence: MEDIUM

## APPLY-DEC-001 — Options types placed in Program.cs

- status: RECORDED (2026-08-01) · run: RUN-2026-08-01-chaos-apply-fixture-70104b
- type: DESIGN_DECISION
- decision: options types live at the bottom of Program.cs.
- rationale: creating a new folder would breach the approved scope list.
- knowledge: FACT · confidence: HIGH
- sync-action: NONE

## ARC-DEC-001 — Confirm archive with debt

- status: ANSWERED (vscode-user, 2026-08-01) · CONSUMED
- runtime-decision: DEC-2026-08-01-fixture-archive-a81a
- interaction-type: confirmation
- options: confirm-archive-with-debt · deny-stop
- recommendation: confirm — the deferral condition is discharged
- answer: confirm-archive-with-debt — rationale: "demo purposes"
- sync-action: NONE
- why-material: terminal, not cleanly reversible
- knowledge: FACT · confidence: HIGH
"""


def make_facts(phase, verdict, run_suffix, facts, mode="strict", pass_no=1, **envelope):
    rec = {
        "schemaVersion": 1,
        "recordType": "phase-facts",
        "phase": phase,
        "pass": pass_no,
        "changeId": "fixture-change",
        "sourceCommand": {
            "frame": "chaos:propose", "review": "chaos:review", "deliver": "chaos:apply",
            "verify": "chaos:verify", "sync": "chaos:sync", "archive": "chaos:archive",
        }[phase],
        "run": f"RUN-2026-08-01-{run_suffix}",
        "mode": mode,
        "verdict": verdict,
        "at": "2026-08-01T16:05:00Z",
        "assessment": {"confidence": "MEDIUM", "evidenceCoverage": "COMPLETE", "assumptionLoad": "LOW"},
        "facts": facts,
    }
    rec.update(envelope)
    return rec


FRAME_FACTS = {
    "title": "Authenticate and harden the fixture API",
    "intent": ["Close the open-API gap before exposure (PROP-DEC-001)."],
    "openspec": {
        "status": "INVOKED",
        "engine": {"name": "openspec", "version": "1.6.0", "configSource": None},
        "artifacts": ["openspec/changes/fixture-change/proposal.md"],
        "statusCheck": {"isComplete": True, "note": None},
        "validation": {"command": "openspec validate fixture-change --strict", "result": "PASS", "note": None},
        "confidenceImpact": None,
    },
}

DELIVER_FACTS = {
    "build": {"command": "dotnet build", "warnings": 0, "errors": 0},
    "tests": {"command": "dotnet test", "passed": 34, "total": 34, "note": "5 baseline updated + 29 new"},
    "coverage": [
        {"statement": "C-001", "covered": True, "evidence": "test", "refs": ["AuthTests.Rejects_anonymous"]},
        {"statement": "C-002", "covered": True, "evidence": "code", "refs": ["Program.cs CORS policy"],
         "whyNotTest": "CORS is enforced by the browser"},
    ],
    "rules": [{"id": "R-003", "status": "pass", "evidence": "build 0/0; tests 34/34"}],
    "files": [
        {"path": "src/Api/Program.cs", "change": "modified"},
        {"path": "tests/Api.Tests/AuthTests.cs", "change": "added"},
    ],
    "deviations": [{"summary": "Options types live in Program.cs", "decision": "APPLY-DEC-001"}],
    "scopeDrift": {"status": "NO_DRIFT", "risk": "LOW", "note": "every changed file is inside the approved scope list"},
}

CONTRACT = {
    "schemaVersion": 1,
    "recordType": "contract",
    "changeId": "fixture-change",
    "sourceCommand": "chaos:propose",
    "run": "RUN-2026-08-01-chaos-propose-fixture-e2858e",
    "recordedAt": "2026-08-01T15:30:00Z",
    "groups": ["Authentication"],
    "statements": [
        {"id": "C-001", "group": "Authentication", "text": "Every route returns 401 without a token",
         "source": ["PROP-DEC-001"]},
        {"id": "C-002", "group": "Authentication", "text": "CORS is an explicit allow-list"},
    ],
}


class FixtureRepo:
    def __init__(self):
        self.root = tempfile.mkdtemp(prefix="chaos-render-test-")
        self.change_dir = os.path.join(self.root, ".chaos", "changes", "fixture-change")
        self.records_dir = os.path.join(self.change_dir, "records")
        self.sessions_dir = os.path.join(self.root, ".chaos", "interactions", "sessions")
        os.makedirs(self.records_dir)
        os.makedirs(self.sessions_dir)
        with open(os.path.join(self.change_dir, "decision-events.md"), "w", encoding="utf-8") as fh:
            fh.write(GOLDEN_LEDGER)

    def write_record(self, name, data):
        with open(os.path.join(self.records_dir, name), "w", encoding="utf-8") as fh:
            json.dump(data, fh)

    def write_session(self, run_id, source_command, state="completed"):
        session = {
            "schemaVersion": 1, "commandRunId": run_id, "sourceCommand": source_command,
            "changeId": "fixture-change", "state": state,
            "createdAt": "2026-08-01T15:00:00Z", "lastSeenAt": "2026-08-01T15:10:00Z",
        }
        with open(os.path.join(self.sessions_dir, run_id + ".json"), "w", encoding="utf-8") as fh:
            json.dump(session, fh)

    def cleanup(self):
        shutil.rmtree(self.root, ignore_errors=True)


class TestSchemaValidator(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.facts_schema = render.load_schema("phase-facts.schema.json")
        cls.contract_schema = render.load_schema("contract.schema.json")

    def test_valid_deliver_record_passes(self):
        rec = make_facts("deliver", "APPLIED", "chaos-apply-fixture-70104b", DELIVER_FACTS)
        self.assertEqual(render.validate_schema(rec, self.facts_schema), [])

    def test_out_of_enum_verdict_is_caught(self):
        rec = make_facts("deliver", "SHIPPED", "chaos-apply-fixture-70104b", DELIVER_FACTS)
        issues = render.validate_schema(rec, self.facts_schema)
        self.assertTrue(any("SHIPPED" in i for i in issues), issues)

    def test_per_phase_verdict_enum_enforced(self):
        # READY is a valid verify verdict but not a valid deliver verdict.
        rec = make_facts("deliver", "READY", "chaos-apply-fixture-70104b", DELIVER_FACTS)
        self.assertTrue(render.validate_schema(rec, self.facts_schema))

    def test_missing_required_key_is_caught(self):
        rec = make_facts("deliver", "APPLIED", "chaos-apply-fixture-70104b", DELIVER_FACTS)
        del rec["assessment"]
        issues = render.validate_schema(rec, self.facts_schema)
        self.assertTrue(any("assessment" in i for i in issues), issues)

    def test_unknown_key_rejected(self):
        rec = make_facts("deliver", "APPLIED", "chaos-apply-fixture-70104b", DELIVER_FACTS, extraKey=True)
        issues = render.validate_schema(rec, self.facts_schema)
        self.assertTrue(any("extraKey" in i for i in issues), issues)

    def test_contract_record_validates(self):
        self.assertEqual(render.validate_schema(CONTRACT, self.contract_schema), [])

    def test_bad_statement_id_pattern_caught(self):
        bad = json.loads(json.dumps(CONTRACT))
        bad["statements"][0]["id"] = "CT-1"
        issues = render.validate_schema(bad, self.contract_schema)
        self.assertTrue(any("CT-1" in i for i in issues), issues)


class TestLedgerParser(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ledger = render.parse_ledger(GOLDEN_LEDGER)
        cls.by_id = {d["id"]: d for d in cls.ledger["decisions"]}

    def test_scan_rule_counts_entries_not_narrative(self):
        # 1 ESC + 6 decision entries; the '## Runtime note' heading is excluded.
        self.assertEqual(len(self.ledger["order"]), 7)
        self.assertEqual(len(self.ledger["escalations"]), 1)
        self.assertEqual(len(self.ledger["decisions"]), 6)

    def test_answered_consumed_status(self):
        st = self.by_id["PROP-DEC-001"]["status"]
        self.assertEqual(st["state"], "ANSWERED")
        self.assertTrue(st["consumed"])
        self.assertEqual(st["by"], "vscode-user")
        self.assertEqual(st["date"], "2026-08-01")

    def test_recorded_status_with_run(self):
        st = self.by_id["APPLY-DEC-001"]["status"]
        self.assertEqual(st["state"], "RECORDED")
        self.assertEqual(st["run"], "RUN-2026-08-01-chaos-apply-fixture-70104b")
        self.assertEqual(self.by_id["APPLY-DEC-001"]["kind"], "recorded")

    def test_lettered_options_and_answer(self):
        entry = self.by_id["PROP-DEC-001"]
        self.assertEqual([o["key"] for o in entry["options"]], ["A", "B", "C"])
        self.assertEqual(entry["options"][0]["label"], "authn-only")
        self.assertEqual(entry["options"][0]["summary"], "smallest diff")
        self.assertEqual(entry["answer"]["key"], "B")
        self.assertEqual(entry["answer"]["rationale"], "Easier for PoC")

    def test_unlettered_confirmation_options(self):
        entry = self.by_id["ARC-DEC-001"]
        self.assertEqual([o["key"] for o in entry["options"]], [None, None])
        self.assertEqual(entry["options"][0]["label"], "confirm-archive-with-debt")
        self.assertEqual(entry["interactionType"], "confirmation")
        self.assertIsNone(entry["answer"]["key"])

    def test_combined_sync_action_tokens(self):
        entry = self.by_id["REV-DEC-001"]
        self.assertEqual(entry["syncAction"]["tokens"], ["CREATE_ADR", "UPDATE_CHAOS_RULES"])
        self.assertEqual(entry["syncAction"]["note"], "reconcile architecture after archive")

    def test_review_composite_severity_line(self):
        entry = self.by_id["REV-DEC-001"]
        self.assertEqual(entry["severity"], "BLOCKING")
        self.assertEqual(entry["fixability"], "FIXABLE_NOW + NEEDS_ADR_OR_DECISION_LOG")
        # 'type: FACT' on the severity line is the knowledge classification, not entry type.
        self.assertIsNone(entry["type"])
        self.assertEqual(entry["knowledge"], "FACT")

    def test_unknown_knowledge_value(self):
        self.assertEqual(self.by_id["PROP-DEC-002"]["knowledge"], "UNKNOWN")

    def test_escalates_field(self):
        self.assertEqual(self.by_id["PROP-DEC-002"]["escalates"], {"from": "standard", "to": "strict"})

    def test_approves_change_and_conditions(self):
        entry = self.by_id["REV-DEC-002"]
        self.assertTrue(entry["approvesChange"])
        self.assertEqual(len(entry["conditions"]), 2)
        self.assertIn("verify confirms the gate", entry["conditions"][0])

    def test_escalation_event_fields(self):
        esc = self.ledger["escalations"][0]
        self.assertEqual(esc["from"], "light")
        self.assertEqual(esc["to"], "standard")
        self.assertEqual(esc["trigger"], "posture-crossing")
        self.assertEqual(esc["status"]["date"], "2026-08-01")

    def test_parsed_entries_conform_to_schema(self):
        dec_schema = render.load_schema("decision-entry.schema.json")
        esc_schema = render.load_schema("escalation-event.schema.json")
        for entry in self.ledger["decisions"]:
            self.assertEqual(render.validate_schema(entry, dec_schema), [], entry["id"])
        for esc in self.ledger["escalations"]:
            self.assertEqual(render.validate_schema(esc, esc_schema), [], esc["id"])


class TestModelAndRendering(unittest.TestCase):
    def setUp(self):
        self.repo = FixtureRepo()
        self.repo.write_record("contract.json", CONTRACT)
        self.repo.write_record(
            "frame.pass-01.facts.json",
            make_facts("frame", "READY_FOR_REVIEW", "chaos-propose-fixture-e2858e", FRAME_FACTS),
        )
        self.repo.write_record(
            "deliver.pass-01.facts.json",
            make_facts("deliver", "APPLIED", "chaos-apply-fixture-70104b", DELIVER_FACTS),
        )

    def tearDown(self):
        self.repo.cleanup()

    def build(self):
        return render.build_model(self.repo.root, "fixture-change")

    def test_current_rollup_is_derived(self):
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        self.assertEqual(model["current"]["tests"], "34/34")
        self.assertEqual(model["current"]["contract"], "2/2")
        self.assertEqual(model["current"]["decisions"], 7)  # §2 scan rule, narrative excluded

    def test_phase_run_comes_from_record_not_session(self):
        # A second, re-issued session must not change the recorded run id.
        self.repo.write_session("RUN-2026-08-01-chaos-apply-fixture-DEAD01", "chaos:apply")
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        self.assertEqual(model["phases"]["deliver"]["run"], "RUN-2026-08-01-chaos-apply-fixture-70104b")

    def test_phase_with_session_but_no_record_is_attempted_not_complete(self):
        self.repo.write_session("RUN-2026-08-01-chaos-verify-fixture-4efeab", "chaos:verify")
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        self.assertEqual(model["phases"]["verify"]["status"], "attempted")
        self.assertIsNone(model["phases"]["verify"]["verdict"])

    def test_escalation_chain_and_mode(self):
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        self.assertEqual([h["to"] for h in model["chain"]], ["standard", "strict"])
        self.assertEqual(model["mode"], "strict")
        self.assertEqual(model["escalatedFrom"], "standard")

    def test_status_progression(self):
        model, _, _ = self.build()
        self.assertEqual(model["status"], "Delivered")

    def test_coverage_must_match_contract(self):
        bad = json.loads(json.dumps(DELIVER_FACTS))
        bad["coverage"] = bad["coverage"][:1]  # drop C-002
        self.repo.write_record(
            "deliver.pass-01.facts.json",
            make_facts("deliver", "APPLIED", "chaos-apply-fixture-70104b", bad),
        )
        _, errors, _ = self.build()
        self.assertTrue(any("coverage does not match" in e for e in errors), errors)

    def test_deviation_citing_unknown_decision_is_an_error(self):
        bad = json.loads(json.dumps(DELIVER_FACTS))
        bad["deviations"][0]["decision"] = "APPLY-DEC-099"
        self.repo.write_record(
            "deliver.pass-01.facts.json",
            make_facts("deliver", "APPLIED", "chaos-apply-fixture-70104b", bad),
        )
        _, errors, _ = self.build()
        self.assertTrue(any("APPLY-DEC-099" in e for e in errors), errors)

    def test_change_md_renders_escalation_warnings_and_ticks(self):
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        text = render.render_change_md(model, None)
        self.assertIn("> ⚠ **escalated: light → standard**", text)
        self.assertIn("> ⚠ **escalated: standard → strict** — human decision", text)
        self.assertIn("- [x] Every route returns 401 without a token", text)
        self.assertIn("### Coverage honesty", text)
        self.assertIn("1 of 2 statements are covered by a passing test", text)

    def test_lifecycle_purity_absent_verdict_renders_dash(self):
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        text = render.render_lifecycle_md(model, None)
        self.assertIn("| Verify | Pending | — | — | — | change.md#verification |", text)
        self.assertNotIn("Last updated", text)

    def test_lifecycle_light_renders_only_frame_and_deliver(self):
        frame = make_facts("frame", "READY_FOR_REVIEW", "chaos-propose-fixture-e2858e", FRAME_FACTS, mode="light")
        self.repo.write_record("frame.pass-01.facts.json", frame)
        # No escalations in this variant: rewrite the ledger without ESC/escalates.
        with open(os.path.join(self.repo.change_dir, "decision-events.md"), "w", encoding="utf-8") as fh:
            fh.write("\n".join(
                line for line in GOLDEN_LEDGER.splitlines()
                if not line.startswith("- escalates:")
            ).replace("## ESC-001 — auto-escalated: intent crosses the auth non-goal", "## Removed heading"))
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        self.assertEqual(model["mode"], "light")
        text = render.render_lifecycle_md(model, None)
        self.assertIn("| Frame |", text)
        self.assertIn("| Deliver |", text)
        self.assertNotIn("| Verify |", text)
        self.assertNotIn("traceability", text.split("\n")[7] if len(text.split("\n")) > 7 else "")

    # --- C.1 repairs (Stage-C defects found by the step-5 measurement) -------------------

    def _light_frame(self, openspec=None):
        """Put the change on the collapsed base: a light frame record AND a ledger with no
        escalation — an `escalates:` entry would raise the model's mode straight back up."""
        facts = json.loads(json.dumps(FRAME_FACTS))
        if openspec is not None:
            facts["openspec"] = openspec
        self.repo.write_record(
            "frame.pass-01.facts.json",
            make_facts("frame", "READY_FOR_REVIEW", "chaos-propose-fixture-e2858e",
                       facts, mode="light"))
        with open(os.path.join(self.repo.change_dir, "decision-events.md"), "w",
                  encoding="utf-8") as fh:
            fh.write("\n".join(
                line for line in GOLDEN_LEDGER.splitlines()
                if not line.startswith("- escalates:")
            ).replace("## ESC-001 — auto-escalated: intent crosses the auth non-goal",
                      "## Removed heading"))

    def test_light_lifecycle_still_projects_a_verify_that_actually_ran(self):
        """`light` is floor provenance only under Stage C — verify runs at dimension >= 1.

        Keying the projection off the mode word dropped a completed Verify phase and its
        archiveReadiness from the state view (step-5 core tier, findings 4)."""
        self._light_frame()
        self.repo.write_record("verify.pass-01.facts.json", make_verify(3))
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        self.assertEqual(model["mode"], "light")
        self.assertEqual(model["phases"]["verify"]["status"], "complete")
        text = render.render_lifecycle_md(model, None)
        self.assertIn("| Verify |", text)
        self.assertIn("archive", text.split("Current:")[1].split("\n")[0])

    def test_light_lifecycle_hides_phases_that_never_ran(self):
        """The converse: a genuinely un-run phase must NOT appear as noise."""
        self._light_frame()
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        self.assertEqual(model["phases"]["verify"]["status"], "pending")
        self.assertNotIn("| Verify |", render.render_lifecycle_md(model, None))

    def test_openspec_zero_emits_no_dangling_pointer(self):
        """At `openspec 0` no folder exists; pointing at one is a dangling reference."""
        self._light_frame(openspec={"status": "NOT_INVOKED", "depth": 0})
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        change = render.render_change_md(model, None)
        self.assertNotIn(f"`openspec/changes/{model['changeId']}/`", change)
        self.assertIn("none owed at the classified depth", change)
        lifecycle = render.render_lifecycle_md(model, None)
        self.assertNotIn(f"OpenSpec: openspec/changes/{model['changeId']}", lifecycle)
        self.assertIn("none owed at the classified depth", lifecycle)

    def test_openspec_invoked_still_points_at_the_folder(self):
        """Guard the fix: a change that DOES owe OpenSpec keeps its pointer."""
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        self.assertIn(f"`openspec/changes/{model['changeId']}/`", render.render_change_md(model, None))

    def test_incomplete_status_is_qualified_at_shallow_depth(self):
        """`openspec status` measures the FULL set, so isComplete:false is EXPECTED at depth < 2.

        Unqualified it read as unfinished work and drove an arm to rewrite a completed pass
        record to remove the apparent contradiction (step-5 core tier, findings 3)."""
        self._light_frame(openspec={"status": "INVOKED", "depth": 1,
                                    "artifacts": ["openspec/changes/fixture-change/specs/x/spec.md"],
                                    "statusCheck": {"isComplete": False}})
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        change = render.render_change_md(model, None)
        self.assertIn("Classified depth: **1 — delta spec only**", change)
        self.assertIn("expected: the CLI measures the full set", change)

    def test_incomplete_status_is_not_excused_at_full_depth(self):
        """At depth 2 an incomplete set is a REAL problem and must not be explained away."""
        self._light_frame(openspec={"status": "INVOKED", "depth": 2,
                                    "statusCheck": {"isComplete": False}})
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        change = render.render_change_md(model, None)
        self.assertNotIn("expected: the CLI measures the full set", change)

    def test_escalated_from_absent_when_never_escalated(self):
        """`Escalated-from` is pre-C vocabulary; render it only when actually set."""
        self._light_frame()
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        self.assertIsNone(model["escalatedFrom"])
        self.assertNotIn("Escalated-from", render.render_lifecycle_md(model, None))

    def test_escalated_from_still_shown_on_legacy_escalated_changes(self):
        """Guard the fix: legacy escalated changes must keep the field visible."""
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        self.assertEqual(model["escalatedFrom"], "standard")
        self.assertIn("Escalated-from: standard", render.render_lifecycle_md(model, None))

    def test_cross_ref_validation_catches_bogus_ref(self):
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        rendered = render.render_change_md(model, None) + "\nsee PROP-DEC-042\n"
        ref_errors = render.validate_cross_refs(rendered, model)
        self.assertTrue(any("PROP-DEC-042" in e for e in ref_errors), ref_errors)

    def test_rendered_change_md_cross_refs_all_resolve(self):
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        rendered = render.render_change_md(model, None)
        self.assertEqual(render.validate_cross_refs(rendered, model), [])

    def test_check_mode_clean_and_dirty(self):
        model, errors, _ = self.build()
        self.assertEqual(errors, [])
        for name, renderer in (("change.md", render.render_change_md), ("lifecycle.md", render.render_lifecycle_md)):
            with open(os.path.join(self.repo.change_dir, name), "w", encoding="utf-8", newline="") as fh:
                fh.write(renderer(model, None))
        original_loader = render.load_metadata_hook
        render.load_metadata_hook = lambda root: None  # fixture repo has no hook/git identity
        try:
            rc = render.main(["fixture-change", "--root", self.repo.root, "--check"])
            self.assertEqual(rc, 0)
            with open(os.path.join(self.repo.change_dir, "lifecycle.md"), "a", encoding="utf-8") as fh:
                fh.write("Last updated: yesterday\n")  # the classic purity violation
            rc = render.main(["fixture-change", "--root", self.repo.root, "--check"])
            self.assertEqual(rc, 1)
        finally:
            render.load_metadata_hook = original_loader


class TestArchiveClosureValidation(unittest.TestCase):
    def setUp(self):
        self.repo = FixtureRepo()
        self.repo.write_record("contract.json", CONTRACT)
        self.repo.write_record(
            "deliver.pass-01.facts.json",
            make_facts("deliver", "APPLIED", "chaos-apply-fixture-70104b", DELIVER_FACTS),
        )

    def tearDown(self):
        self.repo.cleanup()

    def make_archive(self, matrix_ids):
        return make_facts("archive", "ARCHIVED_WITH_DEBT", "chaos-archive-fixture-7ef4f8", {
            "gate": {
                "decision": "ARC-DEC-001",
                "verificationRun": "RUN-2026-08-01-chaos-verify-fixture-4efeab",
                "forceWaiver": False,
                "governanceOverride": False,
            },
            "closureMatrix": [
                {"decision": d, "source": "propose", "classification": "x", "closure": "CLOSED",
                 "syncAction": {"tokens": ["NONE"]}, "confidence": "HIGH"}
                for d in matrix_ids
            ],
            "openspecArchive": {
                "command": "openspec archive fixture-change --yes",
                "archivedAs": "2026-08-01-fixture-change",
                "totals": {"added": 2, "modified": 0, "removed": 0, "renamed": 0},
            },
            "sourceOfTruth": {"status": "CONFIRMED", "checks": [{"check": "Active change removed", "result": "PASS"}]},
        })

    def test_incomplete_closure_matrix_is_an_error(self):
        # The round-2 defect: archive claimed complete classification while
        # enumerating a subset. The renderer makes that a hard error.
        all_ids = ["ESC-001", "PROP-DEC-001", "PROP-DEC-002", "REV-DEC-001",
                   "REV-DEC-002", "APPLY-DEC-001", "ARC-DEC-001"]
        self.repo.write_record("archive.pass-01.facts.json", self.make_archive(all_ids[:5]))
        _, errors, _ = render.build_model(self.repo.root, "fixture-change")
        self.assertTrue(any("closure matrix" in e for e in errors), errors)

    def test_complete_closure_matrix_passes_and_archives(self):
        all_ids = ["ESC-001", "PROP-DEC-001", "PROP-DEC-002", "REV-DEC-001",
                   "REV-DEC-002", "APPLY-DEC-001", "ARC-DEC-001"]
        self.repo.write_record("archive.pass-01.facts.json", self.make_archive(all_ids))
        model, errors, _ = render.build_model(self.repo.root, "fixture-change")
        self.assertEqual(errors, [])
        self.assertEqual(model["status"], "Archived")
        self.assertEqual(model["current"]["archiveReadiness"], "ARCHIVED_WITH_DEBT")


def make_verify(n_traceability_rows):
    rows = [
        {"requirement": f"Requirement {i}", "capability": "cap", "implementation": "impl",
         "test": "a_test", "status": "SATISFIED", "confidence": "HIGH"}
        for i in range(n_traceability_rows)
    ]
    return make_facts("verify", "READY_WITH_DEBT", "chaos-verify-fixture-4efeab", {
        "archiveReadiness": "READY_WITH_DEBT",
        "checks": {
            "build": {"warnings": 0, "errors": 0},
            "tests": {"passed": 34, "total": 34},
            "contract": {"ticked": 2, "total": 2},
        },
        "traceability": rows,
    })


def make_sync():
    return make_facts("sync", "PARTIALLY_RECONCILED", "chaos-sync-fixture-417916", {
        "invocation": {"scope": "change", "roleLevel": "contributor-safe", "dryRun": False},
        "driftFindings": [
            {"id": "SYNC-001", "category": "architecture posture", "severity": "HIGH",
             "knowledge": "FACT", "confidence": "HIGH", "summary": "stale non-goal",
             "action": {"kind": "RECOMMEND", "target": "maintainer sync"}}
        ],
        "decisionReconciliation": [
            {"decision": d, "classification": "x", "promotions": [{"token": "NO_PROMOTION", "state": "closed"}]}
            for d in ["ESC-001", "PROP-DEC-001", "PROP-DEC-002", "REV-DEC-001", "REV-DEC-002", "APPLY-DEC-001"]
        ],
        "rollup": {"driftLoad": "MEDIUM", "decisionLoad": "LOW", "manualFollowUpRequired": True},
    })


class TestWriteProvenanceOverflow(unittest.TestCase):
    def setUp(self):
        self.repo = FixtureRepo()
        self.repo.write_record("contract.json", CONTRACT)
        self.repo.write_record(
            "frame.pass-01.facts.json",
            make_facts("frame", "READY_FOR_REVIEW", "chaos-propose-fixture-e2858e", FRAME_FACTS),
        )
        self.repo.write_record(
            "deliver.pass-01.facts.json",
            make_facts("deliver", "APPLIED", "chaos-apply-fixture-70104b", DELIVER_FACTS),
        )

    def tearDown(self):
        self.repo.cleanup()

    def test_provenance_is_deterministic_and_source_derived(self):
        model, errors, _ = render.build_model(self.repo.root, "fixture-change")
        self.assertEqual(errors, [])
        text1 = render.render_change_md(model, None)
        # lastWrittenAt = newest record timestamp, never the wall clock.
        self.assertIn('lastWrittenAt: "2026-08-01T16:05:00Z"', text1)
        self.assertIn("timestampSource: records", text1)
        self.assertIn("bodyHash:", text1)
        model2, _, _ = render.build_model(self.repo.root, "fixture-change")
        self.assertEqual(text1, render.render_change_md(model2, None))

    def test_body_hash_matches_rendered_body(self):
        import hashlib
        model, _, _ = render.build_model(self.repo.root, "fixture-change")
        text = render.render_change_md(model, None)
        lines = text.splitlines()
        end_fm = lines.index("---", 1)
        body = "\n".join(lines[end_fm + 1:])
        expected = hashlib.sha256(body.strip("\n").encode("utf-8")).hexdigest()
        self.assertIn(f"bodyHash: \"sha256:{expected}\"", text)

    def test_overflow_moves_long_section_to_appendix(self):
        self.repo.write_record("verify.pass-01.facts.json", make_verify(90))
        model, errors, _ = render.build_model(self.repo.root, "fixture-change")
        self.assertEqual(errors, [])
        targets = render.render_artifacts(model, None)
        self.assertIn("appendix/verification.md", targets)
        change = targets["change.md"]
        self.assertIn("full section: `appendix/verification.md`", change)
        # The moved content lives only in the appendix; one entry point, always.
        self.assertNotIn("| Requirement 42 |", change)
        self.assertIn("| Requirement 42 |", targets["appendix/verification.md"])
        self.assertTrue(targets["appendix/verification.md"].split("---\n")[-1].lstrip().startswith("# Verification"))

    def test_short_sections_do_not_overflow(self):
        model, _, _ = render.build_model(self.repo.root, "fixture-change")
        targets = render.render_artifacts(model, None)
        self.assertEqual([k for k in targets if k.startswith("appendix/")], [])

    def test_write_is_idempotent(self):
        original_loader = render.load_metadata_hook
        render.load_metadata_hook = lambda root: None
        try:
            rc = render.main(["fixture-change", "--root", self.repo.root, "--write"])
            self.assertEqual(rc, 0)
            rc = render.main(["fixture-change", "--root", self.repo.root, "--check"])
            self.assertEqual(rc, 0)  # written output re-checks CLEAN
            rc = render.main(["fixture-change", "--root", self.repo.root, "--write"])
            self.assertEqual(rc, 0)  # second write: everything unchanged
        finally:
            render.load_metadata_hook = original_loader


class TestMeasurementRunFixes(unittest.TestCase):
    """Three defects surfaced by the 2026-08-02 EA-X2 Stage-B measurement run."""

    def setUp(self):
        self.repo = FixtureRepo()
        self.repo.write_record("contract.json", CONTRACT)

    def tearDown(self):
        self.repo.cleanup()

    def test_deliver_commentary_and_rationale_render(self):
        # Found by a governed arm: both fields were schema-valid, accepted, and silently dropped.
        self.repo.write_record(
            "deliver.pass-01.facts.json",
            make_facts("deliver", "APPLIED", "chaos-apply-fixture-70104b", DELIVER_FACTS,
                       commentary="Implemented as an endpoint filter on the existing group.",
                       verdictRationale="Two statements are code-evidenced, not test-covered."),
        )
        model, errors, _ = render.build_model(self.repo.root, "fixture-change")
        self.assertEqual(errors, [])
        text = render.render_change_md(model, None)
        self.assertIn("Implemented as an endpoint filter on the existing group.", text)
        self.assertIn("Two statements are code-evidenced, not test-covered.", text)

    def test_legacy_change_without_records_is_refused(self):
        # A pre-Stage-B change has hand-written artifacts and no records/; rendering would
        # project an empty skeleton over real content. Refuse instead of destroying it.
        legacy_dir = os.path.join(self.repo.root, ".chaos", "changes", "legacy-change")
        os.makedirs(legacy_dir)
        with open(os.path.join(legacy_dir, "decision-events.md"), "w", encoding="utf-8") as fh:
            fh.write("# Decision Events\n")
        with open(os.path.join(legacy_dir, "lifecycle.md"), "w", encoding="utf-8") as fh:
            fh.write("# CHAOS Lifecycle — legacy-change\n\nStatus: Archived\n")
        _, errors, _ = render.build_model(self.repo.root, "legacy-change")
        self.assertTrue(any("legacy" in e for e in errors), errors)
        rc = render.main(["legacy-change", "--root", self.repo.root, "--write"])
        self.assertEqual(rc, 2)
        with open(os.path.join(legacy_dir, "lifecycle.md"), "r", encoding="utf-8") as fh:
            self.assertIn("CHAOS Lifecycle", fh.read())  # untouched

    def test_change_with_records_still_renders(self):
        self.repo.write_record(
            "deliver.pass-01.facts.json",
            make_facts("deliver", "APPLIED", "chaos-apply-fixture-70104b", DELIVER_FACTS),
        )
        _, errors, _ = render.build_model(self.repo.root, "fixture-change")
        self.assertEqual(errors, [])


class TestReportRenderers(unittest.TestCase):
    def setUp(self):
        self.repo = FixtureRepo()
        self.repo.write_record("contract.json", CONTRACT)
        self.repo.write_record(
            "deliver.pass-01.facts.json",
            make_facts("deliver", "APPLIED", "chaos-apply-fixture-70104b", DELIVER_FACTS),
        )
        self.repo.write_record("sync.pass-01.facts.json", make_sync())

    def tearDown(self):
        self.repo.cleanup()

    def test_sync_report_renders_from_record(self):
        model, errors, _ = render.build_model(self.repo.root, "fixture-change")
        self.assertEqual(errors, [])
        targets = render.render_artifacts(model, None)
        self.assertIn("sync-report.md", targets)
        report = targets["sync-report.md"]
        self.assertIn("# CHAOS Sync Report — fixture-change", report)
        self.assertIn("| Verdict | PARTIALLY_RECONCILED |", report)
        self.assertIn("artifactType: sync-report", report)
        self.assertIn("SYNC-001", report)

    def test_no_report_without_record(self):
        model, _, _ = render.build_model(self.repo.root, "fixture-change")
        targets = render.render_artifacts(model, None)
        self.assertNotIn("archive-report.md", targets)

    def test_write_then_check_roundtrip_with_reports(self):
        original_loader = render.load_metadata_hook
        render.load_metadata_hook = lambda root: None
        try:
            self.assertEqual(render.main(["fixture-change", "--root", self.repo.root, "--write"]), 0)
            self.assertEqual(render.main(["fixture-change", "--root", self.repo.root, "--check"]), 0)
        finally:
            render.load_metadata_hook = original_loader


class TestDecisionAudit(unittest.TestCase):
    def test_audit_counts_as_of_phase(self):
        repo = FixtureRepo()
        try:
            repo.write_record("contract.json", CONTRACT)
            repo.write_record(
                "deliver.pass-01.facts.json",
                make_facts("deliver", "APPLIED", "chaos-apply-fixture-70104b", DELIVER_FACTS),
            )
            model, errors, _ = render.build_model(repo.root, "fixture-change")
            self.assertEqual(errors, [])
            # As of verify: ARC entries are not yet visible (6 of 7).
            audit = render.render_decision_audit(model, "verify")
            self.assertTrue(audit.startswith("6 entries:"), audit)
            self.assertNotIn("ARC-DEC", audit)
            audit_archive = render.render_decision_audit(model, "archive")
            self.assertTrue(audit_archive.startswith("7 entries:"), audit_archive)
        finally:
            repo.cleanup()


class TestRunDecPrefix(unittest.TestCase):
    """Lever-run defect D1: render.py's ledger regexes and PREFIX_STAGE omitted `RUN`, the
    prefix chaos:run mandates, so the renderer parsed ZERO decisions from a conformant ledger
    and hard-failed any deviation citing RUN-DEC-*. It blocked close on 6/6 measured arms."""

    def test_run_dec_heading_is_recognized(self):
        m = render.ENTRY_HEADING_RE.match("## RUN-DEC-001 — approve as framed?")
        self.assertIsNotNone(m)
        self.assertEqual(m.group(1), "RUN-DEC-001")

    def test_run_dec_reference_token_is_recognized(self):
        self.assertIn("RUN-DEC-002",
                      render.REF_TOKEN_RE.findall("deviation backed by RUN-DEC-002 here"))

    def test_run_prefix_has_a_stage(self):
        self.assertIn("RUN", render.PREFIX_STAGE)
        self.assertEqual(render.PREFIX_STAGE["RUN"], render.PREFIX_STAGE["PROP"])

    def test_every_prefix_site_agrees(self):
        """THE GUARD. D1 happened because the decision-prefix set is duplicated across six
        places and `RUN` was added to some of them. Fixing the renderer then revealed two MORE
        stale copies (the decision-entry parse contract and change-template's documented list).
        This test fails the moment any site drifts from the others again — it is cheaper than
        another 12-arm run discovering it."""
        expected = {"PROP", "RUN", "REV", "APP", "APPLY", "VFY", "VER", "CR", "SYNC", "ARC",
                    "RETRO"}
        sites = {}

        def from_pattern(text, label):
            m = re.search(r"\(\??:?((?:[A-Z]+\|){3,}[A-Z]+)\)-DEC-", text)
            self.assertIsNotNone(m, "no prefix alternation found in %s" % label)
            sites[label] = set(m.group(1).split("|"))

        from_pattern(render.ENTRY_HEADING_RE.pattern, "render.ENTRY_HEADING_RE")
        from_pattern(render.REF_TOKEN_RE.pattern, "render.REF_TOKEN_RE")
        for name, ref in (("contract.schema.json", "decisionRef"),
                          ("phase-facts.schema.json", "decisionRef")):
            from_pattern(render.load_schema(name)["$defs"][ref]["pattern"], name)
        from_pattern(render.load_schema("decision-entry.schema.json")
                     ["properties"]["id"]["pattern"], "decision-entry.schema.json")
        sites["render.PREFIX_STAGE"] = {k for k in render.PREFIX_STAGE if k != "ESC"}

        template = os.path.join(HERE, "..", "..", ".claude", "skills", "chaos-shared",
                                "reference", "change-template.md")
        if os.path.isfile(template):
            with open(template, encoding="utf-8") as f:
                body = f.read()
            line = next((l for l in body.splitlines() if l.startswith("Known prefixes:")), "")
            self.assertTrue(line, "change-template.md lost its 'Known prefixes:' line")
            tail = body.split("Known prefixes:", 1)[1].split("(plus", 1)[0]
            sites["change-template.md"] = set(re.findall(r"`([A-Z]+)-`", tail))

        for label, found in sites.items():
            self.assertEqual(found, expected, "%s prefix set drifted: %s" % (label, found))

    def test_mode_null_validates(self):
        """Defect D2: a run with no preset flag has mode null in classification-state.json;
        the record must be able to say so instead of claiming 'light'."""
        schema = render.load_schema("phase-facts.schema.json")
        self.assertEqual(render.validate_schema(None, schema["$defs"]["mode"]), [])
        self.assertEqual(render.validate_schema("light", schema["$defs"]["mode"]), [])
        self.assertTrue(render.validate_schema("bogus", schema["$defs"]["mode"]))


class TestExampleRecords(unittest.TestCase):
    """The examples/ records are the agent-facing replacement for reading the schemas
    (L2-D7, docs/design/2026-08-03-l2-corpus-amortization.md §3): agents pattern-match an
    example and let `render.py --check` catch them, so an example that drifts from its
    schema MUST fail here. The loop emits contract/frame/deliver/verify; review is not
    emitted by chaos:run and deliberately has no example until a command needs one."""

    EXAMPLES_DIR = os.path.join(HERE, "examples")
    EXPECTED = ["contract.example.json", "frame.facts.example.json",
                "deliver.facts.example.json", "verify.facts.example.json"]

    def _load(self, name):
        with open(os.path.join(self.EXAMPLES_DIR, name), encoding="utf-8") as f:
            return json.load(f)

    def test_every_expected_example_exists(self):
        for name in self.EXPECTED:
            self.assertTrue(os.path.isfile(os.path.join(self.EXAMPLES_DIR, name)), name)

    def test_examples_validate_against_their_schema(self):
        facts_schema = render.load_schema("phase-facts.schema.json")
        contract_schema = render.load_schema("contract.schema.json")
        for name in self.EXPECTED:
            data = self._load(name)
            schema = contract_schema if name.startswith("contract") else facts_schema
            issues = render.validate_schema(data, schema)
            self.assertEqual(issues, [], "%s: %s" % (name, issues))

    def test_examples_carry_the_honesty_fields(self):
        """The whole point of curated examples: weak-evidence honesty stays visible."""
        deliver = self._load("deliver.facts.example.json")
        non_test = [c for c in deliver["facts"]["coverage"] if c["evidence"] != "test"]
        self.assertTrue(non_test and all(c.get("whyNotTest") for c in non_test))
        self.assertTrue(all(d.get("decision") for d in deliver["facts"]["deviations"]))
        frame = self._load("frame.facts.example.json")
        self.assertTrue(frame.get("confidenceLimiters"))

    def test_examples_phase_matches_filename(self):
        for name in self.EXPECTED:
            if name.startswith("contract"):
                continue
            self.assertEqual(self._load(name)["phase"], name.split(".", 1)[0], name)


if __name__ == "__main__":
    unittest.main(verbosity=2)
