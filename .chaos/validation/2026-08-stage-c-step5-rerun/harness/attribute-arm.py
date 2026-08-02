#!/usr/bin/env python
"""Cost attribution for one governed Stage-C arm (brief section 8.2 — this decides Stage-B's fate).

Splits a governed arm's authored output into the cost centers the brief names:
  openspec         OpenSpec artifacts (the C-10 lever's target)
  records          JSON records the agent authored (Stage-B's cost center)
  rendered         change.md + lifecycle.md — renderer output, ~free to the agent
  ledger           decision-events.md, split into decision entries vs TRG-* trigger events
  classifier       classification-state.json + .tmp payload/raises scratch (Stage-C's new overhead)
  implementation   added source/test bytes (git diff against the base commit)

Byte-size proxy, exactly as the Stage-A/B rows used (bytes / 4 ~ tokens). "Authored" excludes
`rendered` — the agent does not write those. Usage:

    python attribute-arm.py <worktree> <changeId> [--base d27600f]
"""
import argparse
import json
import os
import re
import subprocess
import sys

TRG_RE = re.compile(r"^## TRG-", re.MULTILINE)
DEC_RE = re.compile(r"^## ([A-Z]+)-DEC-(\d+)", re.MULTILINE)


def _size(path):
    try:
        return os.path.getsize(path)
    except OSError:
        return 0


def _tree_bytes(root):
    """Total bytes + file list under a directory (recursive)."""
    total, files = 0, []
    for dirpath, _dirnames, filenames in os.walk(root):
        for fn in filenames:
            p = os.path.join(dirpath, fn)
            n = _size(p)
            total += n
            files.append([os.path.relpath(p, root).replace("\\", "/"), n])
    return total, sorted(files)


def _read(path):
    try:
        with open(path, encoding="utf-8-sig") as f:
            return f.read()
    except OSError:
        return ""


def _split_ledger(text):
    """Ledger bytes attributable to decision entries vs TRG-* trigger events.

    TRG-* blocks are Stage-C's ledger overhead; decision entries are the governance product.
    """
    if not text:
        return {"total": 0, "decisions": 0, "trgEvents": 0, "header": 0,
                "decisionCount": 0, "trgCount": 0}
    heads = [(m.start(), "trg") for m in TRG_RE.finditer(text)]
    heads += [(m.start(), "dec") for m in DEC_RE.finditer(text)]
    heads.sort()
    sizes = {"trg": 0, "dec": 0}
    for i, (start, kind) in enumerate(heads):
        end = heads[i + 1][0] if i + 1 < len(heads) else len(text)
        sizes[kind] += len(text[start:end].encode("utf-8"))
    total = len(text.encode("utf-8"))
    return {
        "total": total,
        "decisions": sizes["dec"],
        "trgEvents": sizes["trg"],
        "header": total - sizes["dec"] - sizes["trg"],
        "decisionCount": len(DEC_RE.findall(text)),
        "trgCount": len(TRG_RE.findall(text)),
    }


def _impl_bytes(wt, base):
    """Added source/test bytes: git diff against the base, staged intent-to-add so new files count."""
    subprocess.run(["git", "-C", wt, "add", "-N", "src", "tests"],
                   capture_output=True, text=True)
    diff = subprocess.run(["git", "-C", wt, "diff", base, "--", "src", "tests"],
                          capture_output=True, text=True).stdout
    numstat = subprocess.run(["git", "-C", wt, "diff", "--numstat", base, "--", "src", "tests"],
                             capture_output=True, text=True).stdout
    added_bytes = sum(len(l[1:].encode("utf-8")) + 1
                      for l in diff.splitlines()
                      if l.startswith("+") and not l.startswith("+++"))
    files, adds, dels = 0, 0, 0
    for line in numstat.splitlines():
        parts = line.split("\t")
        if len(parts) == 3:
            files += 1
            adds += int(parts[0]) if parts[0].isdigit() else 0
            dels += int(parts[1]) if parts[1].isdigit() else 0
    return {"addedBytes": added_bytes, "files": files, "addedLines": adds, "deletedLines": dels}


def attribute(wt, change_id, base):
    chg = os.path.join(wt, ".chaos", "changes", change_id)
    ospec = os.path.join(wt, "openspec", "changes", change_id)

    ospec_bytes, ospec_files = _tree_bytes(ospec) if os.path.isdir(ospec) else (0, [])
    rec_bytes, rec_files = _tree_bytes(os.path.join(chg, "records")) \
        if os.path.isdir(os.path.join(chg, "records")) else (0, [])

    rendered = {"change.md": _size(os.path.join(chg, "change.md")),
                "lifecycle.md": _size(os.path.join(chg, "lifecycle.md"))}
    ledger = _split_ledger(_read(os.path.join(chg, "decision-events.md")))

    state_bytes = _size(os.path.join(chg, "classification-state.json"))
    tmp_bytes, tmp_files = _tree_bytes(os.path.join(wt, ".tmp")) \
        if os.path.isdir(os.path.join(wt, ".tmp")) else (0, [])
    # Split the scratch: the agent AUTHORS the payload/raises JSON, but the numstat/patch files
    # are shell redirections of `git diff` — they cost zero agent tokens and must not be charged
    # to the classifier. Attributing them would inflate Stage-C's overhead by ~5x.
    generated = sum(n for f, n in tmp_files
                    if f.endswith((".patch", ".numstat", ".diff", ".txt")))
    authored_scratch = tmp_bytes - generated

    # Anything else the arm dropped in the change folder (should be empty — the artifact set is strict).
    stray = []
    if os.path.isdir(chg):
        known = {"change.md", "lifecycle.md", "decision-events.md", "classification-state.json"}
        for fn in sorted(os.listdir(chg)):
            p = os.path.join(chg, fn)
            if os.path.isfile(p) and fn not in known:
                stray.append([fn, _size(p)])

    # ADRs: `adr 2` makes an ADR a blocking obligation, so its bytes are authored governance too.
    adr_bytes, adr_files = _tree_bytes(os.path.join(wt, "docs", "adr")) \
        if os.path.isdir(os.path.join(wt, "docs", "adr")) else (0, [])

    impl = _impl_bytes(wt, base)

    authored = (ospec_bytes + rec_bytes + ledger["total"] + state_bytes + authored_scratch
                + adr_bytes + sum(n for _, n in stray))
    return {
        "worktree": wt,
        "changeId": change_id,
        "base": base,
        "unit": "bytes on disk (file-size proxy; bytes/4 ~ tokens, as the Stage-A/B rows used)",
        "openspec": {"bytes": ospec_bytes, "files": ospec_files},
        "adr": {"bytes": adr_bytes, "files": adr_files},
        "records": {"bytes": rec_bytes, "files": rec_files},
        "rendered": {"bytes": sum(rendered.values()), "files": rendered,
                     "note": "renderer output — costs the agent nothing to author"},
        "ledger": ledger,
        "classifier": {"stateBytes": state_bytes,
                       "authoredScratchBytes": authored_scratch,
                       "generatedScratchBytes": generated,
                       "scratchFiles": tmp_files,
                       "note": "authoredScratch = the payload/raises JSON the agent wrote; "
                               "generatedScratch = git-diff redirections (free). The adjudication "
                               "REASONING is not on disk and is NOT captured by this byte proxy — "
                               "see the per-arm classifierInvocations/adjudicationPasses counts."},
        "strayArtifacts": stray,
        "implementation": impl,
        "totals": {
            "authoredGovernanceBytes": authored,
            "authoredPlusImplementationBytes": authored + impl["addedBytes"],
            "renderedBytes": sum(rendered.values()),
        },
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("worktree")
    ap.add_argument("changeId")
    ap.add_argument("--base", default="d27600f")
    a = ap.parse_args()
    json.dump(attribute(a.worktree, a.changeId, a.base), sys.stdout, indent=1)
    print()


if __name__ == "__main__":
    main()
