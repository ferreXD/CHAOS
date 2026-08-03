#!/usr/bin/env python3
"""Assemble lever-arms.workflow.js from the template + the step-5 sources.

WHY THIS EXISTS: a standing rule of this program is that plain-arm prompts stay **byte-identical**
across runs — the plain arm is the denominator, and retyping it by hand is exactly how a
denominator silently drifts. So the two plain prompts and the task statements are LIFTED from the
step-5 workflow files rather than copied by a human. The only edit made to a lifted prompt is its
JS function NAME (plainPrompt -> plainPromptFrozen/plainPromptLight), because both source files
define the same name; the template literal is never touched.

Verification: the script asserts the lifted prompt bodies are byte-equal to the source spans, and
prints a sha256 of each so a re-run can be checked against the step-5 originals.

Usage: python build-workflow.py   (writes lever-arms.workflow.js next to this file)
"""

import hashlib
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
STEP5 = os.path.normpath(os.path.join(HERE, "..", "..", "2026-08-stage-c-step5-rerun", "harness"))
CORE = os.path.join(STEP5, "stage-c-arms.workflow.js")
EXTENDED = os.path.join(STEP5, "stage-c-extended-arms.workflow.js")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def span(text, start_marker, end_marker, what):
    """The exact source text from start_marker up to (not including) end_marker."""
    i = text.find(start_marker)
    if i < 0:
        sys.exit("BUILD FAIL: start marker not found for %s: %r" % (what, start_marker))
    j = text.find(end_marker, i + len(start_marker))
    if j < 0:
        sys.exit("BUILD FAIL: end marker not found for %s: %r" % (what, end_marker))
    return text[i:j].rstrip() + "\n"


def statements_body(text, what):
    """Inner entries of `const STATEMENTS = { ... }` — lifted verbatim, braces excluded."""
    i = text.find("const STATEMENTS = {")
    if i < 0:
        sys.exit("BUILD FAIL: no STATEMENTS block in %s" % what)
    start = i + len("const STATEMENTS = {")
    depth, k, in_str, esc = 1, start, False, False
    while k < len(text) and depth:
        c = text[k]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
        elif c == '"':
            in_str = True
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
        k += 1
    if depth:
        sys.exit("BUILD FAIL: unbalanced STATEMENTS block in %s" % what)
    return text[start:k - 1].strip().rstrip(",")


def sha(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:16]


core, ext = read(CORE), read(EXTENDED)

plain_frozen = span(core, "// ---- Plain arm: VERBATIM", "// ---- Shared preamble", "frozen plain")
plain_light = span(ext, "// ---- Plain arm: byte-identical", "// ---- Shared preamble", "light plain")

# The ONLY permitted edit: disambiguate the function names. Assert the prompt bodies are untouched.
frozen_named = plain_frozen.replace("function plainPrompt(p)", "function plainPromptFrozen(p)", 1)
light_named = plain_light.replace("function plainPrompt(p)", "function plainPromptLight(p)", 1)
for named, orig, what in ((frozen_named, plain_frozen, "frozen"), (light_named, plain_light, "light")):
    a = named.split("return `", 1)[1]
    b = orig.split("return `", 1)[1]
    if a != b:
        sys.exit("BUILD FAIL: %s prompt body changed during rename" % what)

stmts = "const STATEMENTS = {\n  %s,\n  %s,\n}\n" % (
    statements_body(core, "core"), statements_body(ext, "extended"))

tpl = read(os.path.join(HERE, "lever-arms.template.js"))
for marker, block in (("/*__PLAIN_FROZEN__*/", frozen_named),
                      ("/*__PLAIN_LIGHT__*/", light_named),
                      ("/*__STATEMENTS__*/", stmts)):
    if marker not in tpl:
        sys.exit("BUILD FAIL: template is missing %s" % marker)
    tpl = tpl.replace(marker, block.rstrip("\n"), 1)

out_path = os.path.join(HERE, "lever-arms.workflow.js")
with open(out_path, "w", encoding="utf-8", newline="\n") as f:
    f.write(tpl)

print("wrote %s (%d bytes)" % (os.path.basename(out_path), len(tpl)))
print("  plain prompt (frozen ea-x2 variant) sha256[:16] = %s" % sha(plain_frozen))
print("  plain prompt (Cost-B light variant) sha256[:16] = %s" % sha(plain_light))
print("  statements block                    sha256[:16] = %s" % sha(stmts))
for key in ("require-api-key-auth", "soft-delete-tasks", "optimistic-concurrency-updates",
            "task-count", "filter-tasks-by-status", "enforce-title-max-length"):
    print("  statement present: %-32s %s" % (key, '"%s"' % key in stmts))
