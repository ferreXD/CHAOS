#!/usr/bin/env python3
"""chaos-digest — deterministic staleness gate for the governance digest (lever L2).

Design of record: docs/design/2026-08-03-l2-corpus-amortization.md (L2-D1/D2/D5/D6/D8).

The digest (`.claude/skills/chaos-shared/reference/governance-digest.md`) is a PROJECTION of
the governance sources — a curated compression maintained by `chaos:sync`, never a source of
truth. This tool is the deterministic gate around it:

  --check   recompute every source hash against the manifest and byte-compare each verbatim
            section against its source span. Exit 0 fresh · 1 stale/corrupt (each failure
            names the section, its source, and the reason) · 2 the check itself could not run
            (missing/unparseable digest, manifest/body id mismatch).
  --stamp   mechanically re-copy verbatim sections from their sources into the digest body
            and re-stamp manifest hashes — all sections, or only the ones named. This is the
            `chaos:sync` completion step, never invoked casually: compiled-section CONTENT is
            the model's job; this tool only moves bytes and hashes.

Hash-keying detects STALENESS, not wrongness — a compiled section can be fresh-wrong (the
sync report diff is the review surface for that) or stale-correct (the fallback path in
chaos:run is the safety net). Hashes and comparisons run over newline-normalized utf-8 so a
CRLF checkout never reads as drift.

Digest anatomy (rigid, documented here, parsed nowhere else):

    ---
    digest: governance-digest
    generated-by: chaos:sync
    sections:
      - id: <kebab-id>
        mode: verbatim | compiled
        source: <repo-root-relative path>
        span: "## exact heading line"        # optional; absent = whole file (verbatim only)
        sha256: <hex of normalized source>
    ---
    ...
    <!-- digest:begin <id> -->
    <section content>
    <!-- digest:end <id> -->

A `span` is heading-delimited: from the exact heading line through the line before the next
heading of the same or higher level. Spans must not contain double quotes.
"""

import argparse
import hashlib
import json
import os
import re
import sys

DEFAULT_DIGEST = os.path.join(".claude", "skills", "chaos-shared", "reference",
                              "governance-digest.md")
MODES = ("verbatim", "compiled")
BEGIN_RE = re.compile(r"<!-- digest:begin ([a-z0-9-]+) -->\n(.*?)<!-- digest:end \1 -->",
                      re.DOTALL)
FENCE_RE = re.compile(r"^```")


def norm(text):
    """Newline-normalize and strip trailing whitespace; all hashing/comparison runs on this."""
    return text.replace("\r\n", "\n").replace("\r", "\n").rstrip()


def sha256_text(text):
    return hashlib.sha256(norm(text).encode("utf-8")).hexdigest()


def _read(path):
    with open(path, encoding="utf-8-sig") as f:
        return f.read()


def parse_digest(text):
    """-> (sections list, body {id: content}, structural errors). Errors mean exit 2."""
    errors = []
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    if not text.startswith("---\n"):
        return [], {}, ["digest has no frontmatter"]
    end = text.find("\n---\n", 4)
    if end < 0:
        return [], {}, ["frontmatter is not terminated"]
    front, body = text[4:end], text[end + 5:]

    sections, entry, in_sections = [], None, False
    for ln, raw in enumerate(front.splitlines(), 2):
        line = raw.rstrip()
        if not line:
            continue
        if line == "sections:":
            in_sections = True
        elif in_sections and line.lstrip().startswith("- id:"):
            entry = {"id": line.split(":", 1)[1].strip()}
            sections.append(entry)
        elif in_sections and entry is not None and ":" in line:
            key, val = line.split(":", 1)
            entry[key.strip()] = val.strip().strip('"')
        elif not line.startswith(("digest:", "generated-by:")):
            errors.append("unparseable manifest line %d: %s" % (ln, line))

    for s in sections:
        for req in ("id", "mode", "source", "sha256"):
            if not s.get(req):
                errors.append("section %s missing %s" % (s.get("id", "?"), req))
        if s.get("mode") not in MODES:
            errors.append("section %s has unknown mode %r" % (s.get("id", "?"), s.get("mode")))

    body_sections = {m.group(1): m.group(2) for m in BEGIN_RE.finditer(body)}
    manifest_ids = [s["id"] for s in sections]
    if sorted(manifest_ids) != sorted(body_sections):
        only_m = set(manifest_ids) - set(body_sections)
        only_b = set(body_sections) - set(manifest_ids)
        if only_m:
            errors.append("in manifest but not in body: %s" % ", ".join(sorted(only_m)))
        if only_b:
            errors.append("in body but not in manifest: %s" % ", ".join(sorted(only_b)))
    if len(manifest_ids) != len(set(manifest_ids)):
        errors.append("duplicate section ids in manifest")
    return sections, body_sections, errors


def extract_span(source_text, span):
    """The heading-delimited span: the exact heading line through the line before the next
    heading of same-or-higher level. Fence-aware (a '#' line inside ``` is not a heading).
    None span = whole file. Returns None when the heading is absent."""
    text = norm(source_text)
    if span is None:
        return text
    lines = text.split("\n")
    level, start, in_fence = None, None, False
    for i, line in enumerate(lines):
        if FENCE_RE.match(line.lstrip()):
            in_fence = not in_fence
            continue
        if in_fence or not line.startswith("#"):
            continue
        hashes = len(line) - len(line.lstrip("#"))
        if start is None:
            if line.strip() == span.strip():
                level, start = hashes, i
        elif hashes <= level:
            return "\n".join(lines[start:i]).rstrip()
    return None if start is None else "\n".join(lines[start:]).rstrip()


def check(digest_path, root):
    if not os.path.isfile(digest_path):
        return 2, {"pass": False, "error": "digest missing: %s" % digest_path}
    sections, body, errors = parse_digest(_read(digest_path))
    if errors:
        return 2, {"pass": False, "error": "; ".join(errors)}

    results = []
    for s in sections:
        src_path = os.path.join(root, s["source"])
        reason = None
        if not os.path.isfile(src_path):
            reason = "source missing"
        else:
            src = _read(src_path)
            if sha256_text(src) != s["sha256"]:
                reason = "source changed since stamp"
            if s["mode"] == "verbatim":
                span = extract_span(src, s.get("span"))
                if span is None:
                    reason = "span not found in source: %s" % s.get("span")
                elif norm(body[s["id"]]) != span:
                    # even with a matching hash: someone edited the digest body by hand
                    reason = (reason or "") + ("; " if reason else "") + \
                        "verbatim content differs from source"
        results.append({"id": s["id"], "mode": s["mode"], "source": s["source"],
                        "pass": reason is None, **({"reason": reason} if reason else {})})
    ok = all(r["pass"] for r in results)
    return (0 if ok else 1), {"pass": ok, "digest": digest_path, "sections": results}


def stamp(digest_path, root, only_ids=None):
    if not os.path.isfile(digest_path):
        return 2, {"pass": False, "error": "digest missing: %s" % digest_path}
    text = _read(digest_path).replace("\r\n", "\n").replace("\r", "\n")
    sections, body, errors = parse_digest(text)
    if errors:
        return 2, {"pass": False, "error": "; ".join(errors)}
    known = {s["id"] for s in sections}
    unknown = set(only_ids or []) - known
    if unknown:
        return 2, {"pass": False, "error": "unknown section(s): %s" % ", ".join(sorted(unknown))}

    stamped = []
    for s in sections:
        if only_ids and s["id"] not in only_ids:
            continue
        src_path = os.path.join(root, s["source"])
        if not os.path.isfile(src_path):
            return 2, {"pass": False, "error": "cannot stamp %s: source missing %s"
                       % (s["id"], s["source"])}
        src = _read(src_path)
        if s["mode"] == "verbatim":
            span = extract_span(src, s.get("span"))
            if span is None:
                return 2, {"pass": False, "error": "cannot stamp %s: span not found: %s"
                           % (s["id"], s.get("span"))}
            text = re.sub(
                r"(<!-- digest:begin %s -->\n).*?(<!-- digest:end %s -->)"
                % (re.escape(s["id"]), re.escape(s["id"])),
                lambda m: m.group(1) + span + "\n" + m.group(2), text, flags=re.DOTALL)
        old = s["sha256"]
        s["sha256"] = sha256_text(src)
        stamped.append({"id": s["id"], "restamped": old != s["sha256"] or s["mode"] == "verbatim"})

    # regenerate the frontmatter from the (rigid) manifest; body already updated in `text`
    front = ["---", "digest: governance-digest", "generated-by: chaos:sync", "sections:"]
    for s in sections:
        front.append("  - id: %s" % s["id"])
        front.append("    mode: %s" % s["mode"])
        front.append("    source: %s" % s["source"])
        if s.get("span"):
            front.append('    span: "%s"' % s["span"])
        front.append("    sha256: %s" % s["sha256"])
    body_text = text[text.find("\n---\n", 4) + 5:]
    with open(digest_path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(front) + "\n---\n" + body_text)

    code, verify = check(digest_path, root)
    return code, {"pass": code == 0, "stamped": stamped, "verify": verify}


def main(argv=None):
    ap = argparse.ArgumentParser(description="governance-digest staleness gate (L2)")
    ap.add_argument("--digest", default=DEFAULT_DIGEST, help="digest file path")
    ap.add_argument("--root", default=".", help="repo root manifest source paths are relative to")
    ap.add_argument("--check", action="store_true", help="verify freshness (the default)")
    ap.add_argument("--stamp", nargs="*", metavar="SECTION", default=None,
                    help="re-copy verbatim sections + re-stamp hashes (all, or only the named "
                         "sections). The chaos:sync completion step — never casual.")
    args = ap.parse_args(argv)

    if args.stamp is not None:
        code, report = stamp(args.digest, args.root, args.stamp or None)
    else:
        code, report = check(args.digest, args.root)
    json.dump(report, sys.stdout, indent=2)
    print()
    return code


if __name__ == "__main__":
    sys.exit(main())
