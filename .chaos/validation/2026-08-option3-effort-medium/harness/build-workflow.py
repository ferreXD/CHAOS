#!/usr/bin/env python3
"""Assemble effort-arms.workflow.js from the template + the lever-run built workflow.

The standing rule: plain-arm prompts stay BYTE-IDENTICAL across runs — the denominator
never drifts by retyping. The two plain prompt functions and the task STATEMENTS block are
lifted verbatim from the lever run's BUILT workflow (which itself lifted them from the
step-5 sources, sha-printed at its own build). This script asserts the lifted spans parse
and prints their shas for cross-checking against the lever build output.

Usage: python build-workflow.py    (writes effort-arms.workflow.js next to this file)
"""

import hashlib
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LEVER = os.path.normpath(os.path.join(HERE, "..", "..", "2026-08-lever-run", "harness",
                                      "lever-arms.workflow.js"))


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def span(text, start_marker, end_marker, what):
    i = text.find(start_marker)
    if i < 0:
        sys.exit("BUILD FAIL: start marker not found for %s: %r" % (what, start_marker))
    j = text.find(end_marker, i + len(start_marker))
    if j < 0:
        sys.exit("BUILD FAIL: end marker not found for %s: %r" % (what, end_marker))
    return text[i:j].rstrip() + "\n"


def statements_block(text):
    i = text.find("const STATEMENTS = {")
    if i < 0:
        sys.exit("BUILD FAIL: no STATEMENTS block in lever workflow")
    start = i
    k, depth, in_str, esc = text.find("{", i), 0, False, False
    first = k
    depth = 1
    k += 1
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
        sys.exit("BUILD FAIL: unbalanced STATEMENTS block")
    return text[start:k] + "\n"


def sha(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:16]


lever = read(LEVER)
plain_frozen = span(lever, "// ---- Plain arm: VERBATIM",
                    "// ---- Plain arm: byte-identical", "frozen plain")
plain_light = span(lever, "// ---- Plain arm: byte-identical",
                   "// ---- Governed arm:", "light plain")
stmts = statements_block(lever)

for needle, what in (("function plainPromptFrozen(p)", "frozen plain"),
                     ("function plainPromptLight(p)", "light plain")):
    if needle not in (plain_frozen + plain_light):
        sys.exit("BUILD FAIL: %s function not found in lifted spans" % what)

tpl = read(os.path.join(HERE, "effort-arms.template.js"))
for marker, block in (("/*__PLAIN_FROZEN__*/", plain_frozen),
                      ("/*__PLAIN_LIGHT__*/", plain_light),
                      ("/*__STATEMENTS__*/", stmts)):
    if marker not in tpl:
        sys.exit("BUILD FAIL: template is missing %s" % marker)
    tpl = tpl.replace(marker, block.rstrip("\n"), 1)

out_path = os.path.join(HERE, "effort-arms.workflow.js")
with open(out_path, "w", encoding="utf-8", newline="\n") as f:
    f.write(tpl)

print("wrote %s (%d bytes)" % (os.path.basename(out_path), len(tpl)))
print("  plain prompt (frozen ea-x2 variant) sha256[:16] = %s" % sha(plain_frozen))
print("  plain prompt (Cost-B light variant) sha256[:16] = %s" % sha(plain_light))
print("  statements block                    sha256[:16] = %s" % sha(stmts))
for key in ("require-api-key-auth", "filter-tasks-by-status", "enforce-title-max-length"):
    print("  statement present: %-32s %s" % (key, '"%s"' % key in stmts))
