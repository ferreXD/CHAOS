#!/usr/bin/env python3
"""Unit tests for the governance-digest staleness gate (stdlib unittest, tmpdir fixtures)."""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import digest as D  # noqa: E402

PINNED = "# Pinned contract\n\nRule one.\nRule two.\n"
PROSE = ("# Reference\n\nIntro prose.\n\n## The format\n\n- a rule\n- another\n\n"
         "### sub-detail\n\nkept inside the span\n\n## Unrelated section\n\ntail\n")


def build_digest(path, sections):
    """Write a digest with placeholder hashes + empty verbatim bodies; stamp() makes it real."""
    front = ["---", "digest: governance-digest", "generated-by: chaos:sync", "sections:"]
    body = ["", "> PROJECTION — do not edit by hand.", ""]
    for s in sections:
        front.append("  - id: %s" % s["id"])
        front.append("    mode: %s" % s["mode"])
        front.append("    source: %s" % s["source"])
        if s.get("span"):
            front.append('    span: "%s"' % s["span"])
        front.append("    sha256: %s" % s.get("sha256", "0" * 64))
        body.append("<!-- digest:begin %s -->" % s["id"])
        body.append(s.get("content", ""))
        body.append("<!-- digest:end %s -->" % s["id"])
        body.append("")
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(front) + "\n---\n" + "\n".join(body) + "\n")


class TestDigest(unittest.TestCase):
    def setUp(self):
        self.td = tempfile.mkdtemp()
        self.digest = os.path.join(self.td, "governance-digest.md")
        self._write("ref/pinned.md", PINNED)
        self._write("ref/prose.md", PROSE)
        build_digest(self.digest, [
            {"id": "pinned-whole", "mode": "verbatim", "source": "ref/pinned.md"},
            {"id": "format-span", "mode": "verbatim", "source": "ref/prose.md",
             "span": "## The format"},
            {"id": "prose-compiled", "mode": "compiled", "source": "ref/prose.md",
             "content": "- checklist point derived from prose"},
        ])
        code, _ = D.stamp(self.digest, self.td)
        self.assertEqual(code, 0)

    def tearDown(self):
        shutil.rmtree(self.td, ignore_errors=True)

    def _write(self, rel, content, newline="\n"):
        path = os.path.join(self.td, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8", newline=newline) as f:
            f.write(content)
        return path

    def _fails(self, report, section_id):
        row = next(r for r in report["sections"] if r["id"] == section_id)
        self.assertFalse(row["pass"], row)
        return row["reason"]

    def test_fresh_after_stamp(self):
        code, report = D.check(self.digest, self.td)
        self.assertEqual(code, 0, report)
        self.assertTrue(report["pass"])

    def test_stamp_copied_the_verbatim_span(self):
        with open(self.digest, encoding="utf-8") as f:
            text = f.read()
        self.assertIn("Rule one.", text)                    # whole-file verbatim
        self.assertIn("kept inside the span", text)         # sub-heading stays in span
        self.assertNotIn("Unrelated section", text)         # same-level heading ends it

    def test_compiled_source_edit_goes_stale(self):
        self._write("ref/prose.md", PROSE + "\nnew paragraph\n")
        code, report = D.check(self.digest, self.td)
        self.assertEqual(code, 1)
        self.assertIn("source changed", self._fails(report, "prose-compiled"))
        # same source feeds the span section: it is stale too
        self.assertIn("source changed", self._fails(report, "format-span"))

    def test_hand_edited_verbatim_body_is_caught(self):
        """Corruption case: hashes match (source untouched) but someone edited the digest."""
        with open(self.digest, encoding="utf-8") as f:
            text = f.read()
        with open(self.digest, "w", encoding="utf-8", newline="\n") as f:
            f.write(text.replace("Rule one.", "Rule one, paraphrased."))
        code, report = D.check(self.digest, self.td)
        self.assertEqual(code, 1)
        self.assertIn("verbatim content differs", self._fails(report, "pinned-whole"))

    def test_stamp_repairs_verbatim_drift(self):
        self._write("ref/pinned.md", PINNED + "Rule three.\n")
        code, _ = D.check(self.digest, self.td)
        self.assertEqual(code, 1)
        code, report = D.stamp(self.digest, self.td)
        self.assertEqual(code, 0, report)
        with open(self.digest, encoding="utf-8") as f:
            self.assertIn("Rule three.", f.read())

    def test_stamp_named_section_leaves_others_stale(self):
        self._write("ref/pinned.md", PINNED + "Rule three.\n")
        self._write("ref/prose.md", PROSE + "\nmore\n")
        code, _ = D.stamp(self.digest, self.td, only_ids=["pinned-whole"])
        self.assertEqual(code, 1)  # stamp verifies afterwards: prose sections still stale
        _, report = D.check(self.digest, self.td)
        self.assertTrue(next(r for r in report["sections"] if r["id"] == "pinned-whole")["pass"])
        self.assertFalse(next(r for r in report["sections"] if r["id"] == "format-span")["pass"])

    def test_stamp_unknown_section_refused(self):
        code, report = D.stamp(self.digest, self.td, only_ids=["nope"])
        self.assertEqual(code, 2)
        self.assertIn("unknown section", report["error"])

    def test_missing_source_fails_check(self):
        os.remove(os.path.join(self.td, "ref", "pinned.md"))
        code, report = D.check(self.digest, self.td)
        self.assertEqual(code, 1)
        self.assertEqual(self._fails(report, "pinned-whole"), "source missing")

    def test_missing_span_fails_check(self):
        self._write("ref/prose.md", PROSE.replace("## The format", "## Renamed"))
        code, report = D.check(self.digest, self.td)
        self.assertEqual(code, 1)
        self.assertIn("span not found", self._fails(report, "format-span"))

    def test_missing_digest_and_structural_corruption_exit_2(self):
        code, report = D.check(os.path.join(self.td, "nope.md"), self.td)
        self.assertEqual(code, 2)
        with open(self.digest, encoding="utf-8") as f:
            text = f.read()
        with open(self.digest, "w", encoding="utf-8", newline="\n") as f:
            f.write(text.replace("<!-- digest:begin pinned-whole -->",
                                 "<!-- digest:begin renamed-id -->")
                        .replace("<!-- digest:end pinned-whole -->",
                                 "<!-- digest:end renamed-id -->"))
        code, report = D.check(self.digest, self.td)
        self.assertEqual(code, 2)
        self.assertIn("pinned-whole", report["error"])

    def test_crlf_checkout_is_not_drift(self):
        self._write("ref/pinned.md", PINNED.replace("\n", "\r\n"), newline="")
        code, report = D.check(self.digest, self.td)
        self.assertEqual(code, 0, report)

    def test_fence_aware_span_extraction(self):
        src = ("# Doc\n\n## Target\n\nbody\n\n```md\n## not a heading\n```\n\nstill target\n\n"
               "## Next\n")
        self.assertIn("still target", D.extract_span(src, "## Target"))
        self.assertNotIn("## Next", D.extract_span(src, "## Target"))

    def test_cli_exit_codes(self):
        here = os.path.dirname(os.path.abspath(__file__))
        cmd = [sys.executable, os.path.join(here, "digest.py"),
               "--digest", self.digest, "--root", self.td]
        ok = subprocess.run(cmd, capture_output=True, text=True)
        self.assertEqual(ok.returncode, 0, ok.stdout)
        self.assertTrue(json.loads(ok.stdout)["pass"])
        self._write("ref/prose.md", PROSE + "\nx\n")
        stale = subprocess.run(cmd, capture_output=True, text=True)
        self.assertEqual(stale.returncode, 1)
        restamp = subprocess.run(cmd + ["--stamp"], capture_output=True, text=True)
        self.assertEqual(restamp.returncode, 0, restamp.stdout)


if __name__ == "__main__":
    unittest.main()
