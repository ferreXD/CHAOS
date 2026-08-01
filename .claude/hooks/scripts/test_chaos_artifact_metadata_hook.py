#!/usr/bin/env python3
"""Unit tests for chaos-artifact-metadata-hook.py serialization (Python 3 stdlib only).

Guards the defect class fixed in a3229c6 and re-found in a demo worktree running a pre-fix copy:
a contract-shaped nested `branch`/`reviewRequest` (from `.chaos/runtime/session-context.json`)
being dropped into the flat `chaosMetadata.repositoryContext` scalar slot and emitted as a Python
repr — `branch: "{'name': 'main', 'isDefaultBranch': False, ...}"`.

That regression survived because a3229c6's verification was ad-hoc and never committed. These
tests are the durable guard.

Run:  python .claude/hooks/scripts/test_chaos_artifact_metadata_hook.py
"""

from __future__ import annotations

import importlib.util
import os
import sys
import unittest

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def _load_hook():
    spec = importlib.util.spec_from_file_location(
        "chaos_artifact_metadata_hook_under_test",
        os.path.join(_SCRIPT_DIR, "chaos-artifact-metadata-hook.py"),
    )
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    # Register before exec: the hook uses @dataclass, which resolves annotations via
    # sys.modules[cls.__module__] and fails on an unregistered dynamically-loaded module.
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


hook = _load_hook()

# The exact shape `.chaos/runtime/session-context.json` stores (repository-context-contract.md).
NESTED_BRANCH = {
    "name": "demo/dotnet",
    "isDefaultBranch": False,
    "upstream": "origin/demo/dotnet",
    "mergeBase": "d27600f9690905320f9e168748cc51f31e76fe0d",
    "confidence": "MEDIUM",
}
NESTED_REVIEW_REQUEST = {
    "providerType": "unknown",
    "id": "",
    "url": "",
    "title": "",
    "author": "",
    "sourceBranch": "",
    "targetBranch": "",
    "status": "unknown",
    "confidence": "LOW",
}


class ScalarizeTests(unittest.TestCase):
    def test_nested_branch_becomes_plain_name(self):
        self.assertEqual(hook._scalarize_branch(NESTED_BRANCH, _SCRIPT_DIR), "demo/dotnet")

    def test_plain_branch_passes_through(self):
        self.assertEqual(hook._scalarize_branch("main", _SCRIPT_DIR), "main")

    def test_nested_review_request_without_identifiers_is_none(self):
        self.assertIsNone(hook._scalarize_review_request(NESTED_REVIEW_REQUEST))

    def test_nested_review_request_prefers_id_then_url_then_title(self):
        self.assertEqual(hook._scalarize_review_request({"id": "42", "url": "u", "title": "t"}), "42")
        self.assertEqual(hook._scalarize_review_request({"id": "", "url": "u", "title": "t"}), "u")
        self.assertEqual(hook._scalarize_review_request({"id": "", "url": "", "title": "t"}), "t")


class YamlScalarTests(unittest.TestCase):
    def test_dict_never_emitted_as_python_repr(self):
        rendered = hook._yaml_scalar(NESTED_BRANCH)
        self.assertNotIn("'", rendered, "a Python repr leaked into the YAML scalar slot")
        self.assertNotIn("False", rendered, "Python False leaked instead of JSON/YAML false")
        self.assertIn('"name"', rendered, "structured fallback should be deterministic JSON")

    def test_bools_render_as_yaml(self):
        self.assertEqual(hook._yaml_scalar(True), "true")
        self.assertEqual(hook._yaml_scalar(False), "false")

    def test_none_renders_null(self):
        self.assertEqual(hook._yaml_scalar(None), "null")


class RenderBlockTests(unittest.TestCase):
    """The end-to-end shape a reader actually sees in frontmatter."""

    def _render(self, rc):
        return "\n".join(hook.render_chaos_metadata_block({"repositoryContext": rc, "metadata": {}}))

    def test_scalarized_context_renders_plain_scalars(self):
        rendered = self._render(
            {
                "provider": "github",
                "branch": hook._scalarize_branch(NESTED_BRANCH, _SCRIPT_DIR),
                "reviewRequest": hook._scalarize_review_request(NESTED_REVIEW_REQUEST),
                "contextSource": "session-context",
                "confidence": "HIGH",
            }
        )
        self.assertIn("branch: demo/dotnet", rendered)
        self.assertIn("reviewRequest: null", rendered)
        self.assertNotIn("{'", rendered, "the reported corruption pattern must never appear")

    def test_unscalarized_context_still_never_emits_a_python_repr(self):
        """Belt-and-braces: even if a caller forgets to scalarize, no `{'name': ...}` escapes."""
        rendered = self._render({"provider": "github", "branch": NESTED_BRANCH})
        self.assertNotIn("{'", rendered)


class SelfHealTests(unittest.TestCase):
    """The update path copies existing metadata verbatim, so corruption must be repaired explicitly."""

    CORRUPT = "{'name': 'demo/dotnet', 'isDefaultBranch': False, 'upstream': 'origin/demo/dotnet'}"

    def test_detects_stringified_structures(self):
        self.assertTrue(hook.looks_like_stringified_structure(self.CORRUPT))
        self.assertTrue(hook.looks_like_stringified_structure("[1, 2]"))
        self.assertFalse(hook.looks_like_stringified_structure("demo/dotnet"))
        self.assertFalse(hook.looks_like_stringified_structure(None))

    def test_repairs_only_the_malformed_keys(self):
        existing = {
            "provider": "github",
            "branch": self.CORRUPT,
            "reviewRequest": "{'providerType': 'unknown'}",
            "contextSource": "session-context",
            "confidence": "HIGH",
        }
        resolved = {"provider": "github", "branch": "demo/dotnet", "reviewRequest": None}
        repaired, changed = hook.repair_repository_context(existing, resolved)

        self.assertTrue(changed)
        self.assertEqual(repaired["branch"], "demo/dotnet")
        self.assertIsNone(repaired["reviewRequest"])
        # Untouched keys survive — this is a surgical repair, not a wholesale rebuild.
        self.assertEqual(repaired["contextSource"], "session-context")
        self.assertEqual(repaired["confidence"], "HIGH")

    def test_healthy_context_is_left_alone(self):
        existing = {"provider": "github", "branch": "main", "reviewRequest": None}
        repaired, changed = hook.repair_repository_context(existing, {"branch": "other"})
        self.assertFalse(changed)
        self.assertIs(repaired, existing)

    def test_repaired_block_renders_clean(self):
        existing = {"provider": "github", "branch": self.CORRUPT, "reviewRequest": None}
        repaired, _ = hook.repair_repository_context(existing, {"branch": "demo/dotnet"})
        rendered = "\n".join(hook.render_chaos_metadata_block({"repositoryContext": repaired, "metadata": {}}))
        self.assertIn("branch: demo/dotnet", rendered)
        self.assertNotIn("{'", rendered)


if __name__ == "__main__":
    unittest.main(verbosity=2)
