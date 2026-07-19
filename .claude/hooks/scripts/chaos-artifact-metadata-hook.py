#!/usr/bin/env python3
"""CHAOS artifact provenance metadata hook.

Validates and optionally stamps `chaosMetadata` YAML frontmatter on CHAOS-owned
Markdown artifacts. Standard-library only; safe to run as a Claude Code
PostToolUse/Stop hook or manually from the command line.

See ../README.md and ../reference/*.md for the full contract. This script never
touches files outside the configured managed-file patterns, never writes
timestamps unless content materially changed or an explicit --stamp was run,
and never writes values that look like secrets.
"""

from __future__ import annotations

import argparse
import glob
import hashlib
import json
import os
import re
import subprocess
import sys
import threading
import queue as queue_module
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

SCHEMA_VERSION = 1
CONFIDENCE_VALUES = ("HIGH", "MEDIUM", "LOW")
FRONTMATTER_DELIM = "---"

DEFAULT_POLICY: Dict[str, Any] = {
    "enabled": True,
    "requireOnChaosMarkdown": True,
    "identityMode": "provider-username",
    "configuredAlias": "",
    "includeRepositoryContext": True,
    "updateTimestampOnlyOnMaterialChange": True,
    "allowAuditOnlyStamp": False,
    "stampSharedNonChaosFiles": False,
    "failOnMissingMetadataInStrictHooks": True,
    "warnOnMissingMetadataInContributorHooks": True,
}

# Only command-generated CHAOS artifacts whose type infer_artifact() recognizes — deliberately
# NOT a broad ".chaos/**/*.md", which would first-stamp hand-authored docs (assessments,
# validation, todo, roadmap) as artifactType:unknown. Kept in sync with the shipped
# policies.artifactMetadataManagedFiles in .chaos/config.yaml.
DEFAULT_MANAGED: Dict[str, List[str]] = {
    "include": [
        ".chaos/changes/**/*.md",
        ".chaos/doctor/**/*.md",
        ".chaos/sync-reports/**/*.md",
        ".chaos/archaeology/**/*.md",
        ".chaos/rules/**/*.md",
        ".chaos/gates/**/*.md",
        ".chaos/decisions/**/*.md",
        ".chaos/commands/**/*.md",
        ".chaos/status-report.md",
        ".chaos/bootstrap-report.md",
        ".chaos/architecture.md",
        ".chaos/context.md",
        ".chaos/constitution.md",
        ".chaos/README.md",
    ],
    "optional": ["docs/adr/**/*.md", "docs/decision-log/**/*.md"],
    "exclude": [
        "README.md",
        "AGENTS.md",
        ".chaos/assessments/**/*.md",
        ".chaos/validation/**/*.md",
        ".chaos/todo/**/*.md",
        ".chaos/roadmap/**/*.md",
        ".chaos/interactions/**/*.md",
    ],
}

_CHANGE_SCOPED_FILENAME_TYPES = {
    "proposal-review.md": "proposal-review",
    "proposal-report.md": "proposal-review",
    "approval.md": "approval",
    "apply-report.md": "apply-report",
    "code-review.md": "code-review",
    "verification.md": "verification-report",
    "archive-report.md": "archive-report",
    "sync-report.md": "change-sync-report",
    "retro.md": "retro",
    "lifecycle.md": "lifecycle",
    "decision-events.md": "decision-events",
    "waivers.md": "waivers",
}

_TOP_LEVEL_FILENAME_TYPES = {
    ".chaos/status-report.md": "status-report",
    ".chaos/bootstrap-report.md": "bootstrap-report",
    ".chaos/architecture.md": "architecture",
    ".chaos/context.md": "context",
    ".chaos/constitution.md": "constitution",
    ".chaos/README.md": "workspace-readme",
}

_SOURCE_COMMAND_BY_TYPE = {
    "status-report": "chaos:status",
    "bootstrap-report": "chaos:init",
    "proposal-review": "chaos:review",
    "approval": "chaos:review",
    "apply-report": "chaos:apply",
    "code-review": "chaos:code-review",
    "verification-report": "chaos:verify",
    "archive-report": "chaos:archive",
    "change-sync-report": "chaos:sync",
    "retro": "chaos:retro",
    "lifecycle": "chaos:propose",
    "archaeology-report": "chaos:archaeology",
    "archaeology-index": "chaos:archaeology",
    "repository-sync-report": "chaos:sync",
    "doctor-report": "chaos:doctor",
    "rule": "chaos:sync",
    "gate": "chaos:sync",
    "decision": "chaos:sync",
}

_SECRET_PATTERNS = [
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    re.compile(r"github_pat_[A-Za-z0-9_]{20,}"),
    re.compile(r"gh[oprsu]_[A-Za-z0-9]{20,}"),
    re.compile(r"AKIA[0-9A-Z]{12,}"),
    re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"),  # JWT-like
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    re.compile(r"(?i)bearer\s+[a-z0-9\-_.]{16,}"),
    re.compile(r"(?i)(password|pwd|secret|token|pat|connectionstring)\s*[:=]"),
    re.compile(r"[A-Za-z0-9+/]{40,}={0,2}"),  # long base64/hex-like blob
]

_CONF_ORDER = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}


# --------------------------------------------------------------------------
# Small data types
# --------------------------------------------------------------------------


@dataclass
class Issue:
    severity: str  # ERROR | WARN | INFO
    code: str
    message: str


@dataclass
class FileResult:
    rel_path: str
    status: str  # ok | stamped | would_stamp | missing | invalid | error | skipped
    issues: List[Issue] = field(default_factory=list)
    material_change: Optional[bool] = None

    @property
    def blocking(self) -> bool:
        return any(i.severity == "ERROR" for i in self.issues)


# --------------------------------------------------------------------------
# Minimal indentation-based YAML subset (mappings + scalar lists only)
# --------------------------------------------------------------------------


def _strip_yaml_comment(line: str) -> str:
    result = []
    quote = None
    i = 0
    while i < len(line):
        c = line[i]
        if quote:
            result.append(c)
            if c == quote:
                quote = None
        elif c in ("'", '"'):
            quote = c
            result.append(c)
        elif c == "#" and (i == 0 or line[i - 1] in (" ", "\t")):
            break
        else:
            result.append(c)
        i += 1
    return "".join(result)


def _parse_yaml_scalar(raw: str) -> Any:
    s = raw.strip()
    if s == "":
        return None
    if s in ("null", "Null", "NULL", "~"):
        return None
    if s in ("true", "True", "TRUE"):
        return True
    if s in ("false", "False", "FALSE"):
        return False
    if len(s) >= 2 and s[0] == s[-1] and s[0] in ("'", '"'):
        inner = s[1:-1]
        if s[0] == '"':
            try:
                return json.loads(s)
            except ValueError:
                return inner
        return inner
    if re.fullmatch(r"-?\d+", s):
        try:
            return int(s)
        except ValueError:
            pass
    if re.fullmatch(r"-?\d+\.\d+", s):
        try:
            return float(s)
        except ValueError:
            pass
    return s


def _indent_of(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def parse_simple_yaml_lines(raw_lines: List[str]) -> Dict[str, Any]:
    """Parse an indentation-based subset of YAML (block mappings + scalar lists).

    Deliberately not a general YAML parser: no anchors, flow style, or
    multiline scalars. Sufficient for CHAOS config sections and the
    chaosMetadata frontmatter block, which are both authored in plain block
    style. Unrecognized constructs degrade to string scalars rather than
    raising, so callers never crash on drift elsewhere in a file.
    """
    prepared: List[Tuple[int, str]] = []
    for line in raw_lines:
        if line.strip() == "" or line.strip() == FRONTMATTER_DELIM:
            continue
        stripped = _strip_yaml_comment(line).rstrip()
        if stripped.strip() == "":
            continue
        prepared.append((_indent_of(stripped), stripped.strip()))

    def parse_block(i: int, indent: int) -> Tuple[Any, int]:
        if i >= len(prepared):
            return {}, i
        cur_indent, _ = prepared[i]
        if cur_indent < indent:
            return {}, i
        if prepared[i][1].startswith("- "):
            items = []
            while i < len(prepared) and prepared[i][0] == indent and prepared[i][1].startswith("- "):
                item_text = prepared[i][1][2:].strip()
                items.append(_parse_yaml_scalar(item_text))
                i += 1
            return items, i
        result: Dict[str, Any] = {}
        while i < len(prepared) and prepared[i][0] == indent:
            _, text = prepared[i]
            if ":" not in text:
                i += 1
                continue
            key, _, rest = text.partition(":")
            key = key.strip()
            rest = rest.strip()
            i += 1
            if rest == "":
                if i < len(prepared) and prepared[i][0] > indent:
                    value, i = parse_block(i, prepared[i][0])
                else:
                    value = None
            else:
                value = _parse_yaml_scalar(rest)
            result[key] = value
        return result, i

    if not prepared:
        return {}
    top_indent = prepared[0][0]
    value, _ = parse_block(0, top_indent)
    return value if isinstance(value, dict) else {}


def _yaml_scalar(value: Any) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, (dict, list)):
        # Safety net: a structured value must never be emitted as a Python repr
        # (`str(dict)` -> "{'name': 'main'}"), which is neither valid structured YAML
        # nor stable across dict key ordering. Emit deterministic, valid JSON instead.
        # Upstream callers should coerce to scalars (see _scalarize_* helpers); this only
        # fires if a new structured field slips through.
        return json.dumps(value, ensure_ascii=False, sort_keys=True)
    s = str(value)
    if s == "" or s.strip() != s or re.search(r"[:#\[\]{}]", s) or s.lower() in ("null", "true", "false", "~"):
        return json.dumps(s)
    return s


def render_chaos_metadata_block(meta: Dict[str, Any], indent: str = "  ") -> List[str]:
    lines = ["chaosMetadata:"]
    for key in (
        "schemaVersion",
        "artifactType",
        "artifactScope",
        "changeId",
        "sourceCommand",
        "lastWrittenAt",
        "lastWrittenBy",
        "lastAuditedAt",
        "lastAuditedBy",
    ):
        lines.append(f"{indent}{key}: {_yaml_scalar(meta.get(key))}")
    rc = meta.get("repositoryContext")
    if rc:
        lines.append(f"{indent}repositoryContext:")
        for key in ("provider", "branch", "reviewRequest", "contextSource", "confidence"):
            lines.append(f"{indent}{indent}{key}: {_yaml_scalar(rc.get(key))}")
    md = meta.get("metadata") or {}
    lines.append(f"{indent}metadata:")
    for key in ("identitySource", "timestampSource", "confidence"):
        lines.append(f"{indent}{indent}{key}: {_yaml_scalar(md.get(key))}")
    if md.get("bodyHash"):
        lines.append(f"{indent}{indent}bodyHash: {_yaml_scalar(md.get('bodyHash'))}")
    return lines


# --------------------------------------------------------------------------
# Frontmatter splice helpers
# --------------------------------------------------------------------------


def split_frontmatter(text: str) -> Tuple[Optional[List[str]], str, bool]:
    lines = text.splitlines()
    if not lines or lines[0].strip() != FRONTMATTER_DELIM:
        return None, text, False
    for i in range(1, len(lines)):
        if lines[i].strip() == FRONTMATTER_DELIM:
            fm_lines = lines[1:i]
            body_lines = lines[i + 1 :]
            body = "\n".join(body_lines)
            if text.endswith("\n") and body_lines:
                body += "\n"
            return fm_lines, body, True
    return None, text, False


def find_chaos_metadata_span(fm_lines: List[str]) -> Optional[Tuple[int, int]]:
    for i, line in enumerate(fm_lines):
        if re.match(r"^chaosMetadata:\s*$", line):
            j = i + 1
            while j < len(fm_lines) and (fm_lines[j].strip() == "" or fm_lines[j].startswith((" ", "\t"))):
                j += 1
            return i, j
    return None


# --------------------------------------------------------------------------
# Secret scrubbing
# --------------------------------------------------------------------------


def looks_like_secret(value: Any) -> bool:
    if not value:
        return False
    s = str(value)
    return any(pat.search(s) for pat in _SECRET_PATTERNS)


# --------------------------------------------------------------------------
# Git / repository context helpers (local fallback only — no MCP/CLI here)
# --------------------------------------------------------------------------


def run_git(repo_root: str, args: List[str]) -> Optional[str]:
    try:
        result = subprocess.run(
            ["git", "-C", repo_root] + args,
            capture_output=True,
            text=True,
            timeout=5,
            encoding="utf-8",
            errors="replace",
            stdin=subprocess.DEVNULL,
        )
    except Exception:
        return None
    if result.returncode != 0:
        return None
    out = result.stdout.strip()
    return out or None


def detect_provider_from_remote(remote_url: Optional[str]) -> str:
    if not remote_url:
        return "unknown"
    low = remote_url.lower()
    if "dev.azure.com" in low or "visualstudio.com" in low:
        return "azure-devops"
    if "github.com" in low:
        return "github"
    return "local-git"


def read_json_file(path: str) -> Optional[Dict[str, Any]]:
    if not os.path.isfile(path):
        return None
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        return data if isinstance(data, dict) else None
    except Exception:
        return None


def _scalarize_branch(value: Any, repo_root: str) -> str:
    """Coerce a branch value to a plain branch-name scalar.

    `.chaos/runtime/session-context.json` may store `branch` as a structured object
    (`{name, isDefaultBranch, upstream, ...}`); the chaosMetadata schema wants a plain string.
    Never emit `str(dict)`.
    """
    if isinstance(value, dict):
        name = value.get("name")
        value = name if isinstance(name, str) and name else None
    if isinstance(value, str) and value:
        return value
    return run_git(repo_root, ["branch", "--show-current"]) or "unknown"


def _scalarize_review_request(value: Any) -> Optional[str]:
    """Coerce a reviewRequest to a compact scalar (id/url/title) or None — never `str(dict)`."""
    if isinstance(value, dict):
        for key in ("id", "url", "title"):
            v = value.get(key)
            if isinstance(v, str) and v:
                return v
        return None
    if isinstance(value, str):
        return value or None
    return None


def resolve_repository_context(repo_root: str) -> Tuple[Dict[str, Any], str]:
    session = read_json_file(os.path.join(repo_root, ".chaos", "runtime", "session-context.json"))
    if session and session.get("provider"):
        return (
            {
                "provider": session.get("provider", "unknown"),
                "branch": _scalarize_branch(session.get("branch"), repo_root),
                "reviewRequest": _scalarize_review_request(session.get("reviewRequest")),
                "contextSource": session.get("contextSource", "session-context"),
                "confidence": session.get("confidence", "HIGH"),
            },
            session.get("confidence", "HIGH"),
        )
    branch = run_git(repo_root, ["branch", "--show-current"])
    remote = run_git(repo_root, ["remote", "get-url", "origin"])
    provider = detect_provider_from_remote(remote)
    if branch or remote:
        return (
            {
                "provider": provider,
                "branch": branch or "unknown",
                "reviewRequest": None,
                "contextSource": "git",
                "confidence": "MEDIUM",
            },
            "MEDIUM",
        )
    return (
        {
            "provider": "unknown",
            "branch": "unknown",
            "reviewRequest": None,
            "contextSource": "unknown",
            "confidence": "LOW",
        },
        "LOW",
    )


def resolve_identity(mode: str, configured_alias: str, repo_root: str) -> Tuple[str, str, str]:
    session = read_json_file(os.path.join(repo_root, ".chaos", "runtime", "session-context.json"))
    if mode == "anonymous":
        return "anonymous", "anonymous", "HIGH"
    if mode == "configured-alias":
        if configured_alias:
            return configured_alias, "configured-alias", "HIGH"
        return "unknown", "configured-alias", "LOW"
    if mode == "git-email":
        email = run_git(repo_root, ["config", "user.email"])
        if email:
            return email, "git-config", "MEDIUM"
        return "unknown", "git-config", "LOW"
    if mode == "git-name":
        name = run_git(repo_root, ["config", "user.name"])
        if name:
            return name, "git-config", "MEDIUM"
        return "unknown", "git-config", "LOW"
    # default: provider-username
    if session and session.get("username"):
        return (
            str(session["username"]),
            session.get("source", "session-context"),
            session.get("userConfidence", "HIGH"),
        )
    name = run_git(repo_root, ["config", "user.name"])
    if name:
        return name, "git-config", "MEDIUM"
    return "unknown", "unresolved", "LOW"


def min_confidence(*values: str) -> str:
    valid = [v for v in values if v in _CONF_ORDER]
    if not valid:
        return "LOW"
    return min(valid, key=lambda v: _CONF_ORDER[v])


# --------------------------------------------------------------------------
# Artifact type / scope / changeId / sourceCommand inference
# --------------------------------------------------------------------------


def infer_artifact(rel_path: str) -> Tuple[str, str, Optional[str]]:
    if rel_path in _TOP_LEVEL_FILENAME_TYPES:
        return _TOP_LEVEL_FILENAME_TYPES[rel_path], "repository", None
    m = re.match(r"^\.chaos/changes/([^/]+)/(.+)$", rel_path)
    if m:
        change_id, filename = m.group(1), m.group(2)
        artifact_type = _CHANGE_SCOPED_FILENAME_TYPES.get(filename, "change-artifact")
        return artifact_type, "change", change_id
    if rel_path.startswith(".chaos/archaeology/"):
        return ("archaeology-index" if rel_path.endswith("/index.md") else "archaeology-report"), "topic", None
    if rel_path.startswith(".chaos/sync-reports/"):
        return "repository-sync-report", "repository", None
    if rel_path.startswith(".chaos/doctor/"):
        return "doctor-report", "repository", None
    if rel_path.startswith(".chaos/rules/"):
        return "rule", "repository", None
    if rel_path.startswith(".chaos/gates/"):
        return "gate", "repository", None
    if rel_path.startswith(".chaos/decisions/"):
        return "decision", "repository", None
    if rel_path.startswith(".chaos/commands/"):
        return "command-index", "repository", None
    if rel_path.startswith("docs/adr/"):
        return "adr", "repository", None
    if rel_path.startswith("docs/decision-log/"):
        return "decision-log", "repository", None
    return "unknown", "unknown", None


def resolve_source_command(artifact_type: str, repo_root: str) -> Tuple[str, str]:
    active = read_json_file(os.path.join(repo_root, ".chaos", "runtime", "active-command.json"))
    if active and active.get("command"):
        return str(active["command"]), "HIGH"
    fallback = _SOURCE_COMMAND_BY_TYPE.get(artifact_type)
    if fallback:
        return fallback, "MEDIUM"
    return "unknown", "LOW"


# --------------------------------------------------------------------------
# Timestamps
# --------------------------------------------------------------------------


def current_iso_timestamp() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def is_valid_iso8601_with_tz(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    s = value.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        return False
    return dt.tzinfo is not None


def compute_body_hash(body_text: str) -> str:
    normalized = body_text.strip("\n")
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


# --------------------------------------------------------------------------
# Glob-based managed-file matching (uses real glob semantics for `**`)
# --------------------------------------------------------------------------


def _norm_rel(path: str) -> str:
    return path.replace(os.sep, "/")


def _glob_matches(repo_root: str, pattern: str) -> set:
    joined = os.path.join(repo_root, *pattern.split("/"))
    try:
        results = glob.glob(joined, recursive=True)
    except Exception:
        return set()
    rels = set()
    for r in results:
        try:
            rel = os.path.relpath(r, repo_root)
        except ValueError:
            continue
        rels.add(_norm_rel(rel))
    return rels


def matches_any(rel_path: str, repo_root: str, patterns: List[str]) -> bool:
    rel_path = _norm_rel(rel_path)
    for pattern in patterns or []:
        if rel_path in _glob_matches(repo_root, pattern):
            return True
    return False


def classify_managed(rel_path: str, repo_root: str, managed: Dict[str, List[str]]) -> str:
    if matches_any(rel_path, repo_root, managed.get("exclude", [])):
        return "excluded"
    if matches_any(rel_path, repo_root, managed.get("include", [])):
        return "managed"
    if matches_any(rel_path, repo_root, managed.get("optional", [])):
        return "optional_inactive"
    return "unmanaged"


def collect_managed_files(repo_root: str, managed: Dict[str, List[str]]) -> List[str]:
    included: set = set()
    for pattern in managed.get("include", []):
        included |= _glob_matches(repo_root, pattern)
    excluded: set = set()
    for pattern in managed.get("exclude", []):
        excluded |= _glob_matches(repo_root, pattern)
    return sorted(p for p in included if p not in excluded)


def collect_optional_candidates(repo_root: str, managed: Dict[str, List[str]], active_included: List[str]) -> List[str]:
    optional: set = set()
    for pattern in managed.get("optional", []):
        optional |= _glob_matches(repo_root, pattern)
    active = set(active_included)
    return sorted(p for p in optional if p not in active)


# --------------------------------------------------------------------------
# Validation of an existing chaosMetadata block
# --------------------------------------------------------------------------


def validate_existing_metadata(meta: Dict[str, Any], rel_path: str) -> List[Issue]:
    issues: List[Issue] = []
    schema_version = meta.get("schemaVersion")
    if schema_version != SCHEMA_VERSION:
        issues.append(Issue("ERROR", "INVALID_SCHEMA_VERSION", f"schemaVersion is {schema_version!r}, expected {SCHEMA_VERSION}"))

    for ts_key in ("lastWrittenAt", "lastAuditedAt"):
        value = meta.get(ts_key)
        if not value or not is_valid_iso8601_with_tz(value):
            issues.append(Issue("ERROR", "INVALID_TIMESTAMP", f"{ts_key} is missing or not a valid ISO-8601 timestamp with timezone: {value!r}"))

    for by_key, missing_code in (("lastWrittenBy", "MISSING_LAST_WRITTEN_BY"), ("lastAuditedBy", "MISSING_LAST_AUDITED_BY")):
        value = meta.get(by_key)
        if not value:
            issues.append(Issue("ERROR", missing_code, f"{by_key} is missing"))
        elif looks_like_secret(value):
            issues.append(Issue("ERROR", "SECRET_LIKE_VALUE", f"{by_key} looks like it may contain a secret/token and must not be committed"))
        elif value == "unknown":
            issues.append(Issue("WARN", "UNKNOWN_IDENTITY", f"{by_key} is 'unknown' — identity could not be resolved"))

    rc = meta.get("repositoryContext")
    if isinstance(rc, dict) and rc:
        conf = rc.get("confidence")
        if conf not in CONFIDENCE_VALUES:
            issues.append(Issue("ERROR", "INVALID_CONFIDENCE", f"repositoryContext.confidence is {conf!r}, expected one of {CONFIDENCE_VALUES}"))

    md = meta.get("metadata")
    if isinstance(md, dict):
        conf2 = md.get("confidence")
        if conf2 not in CONFIDENCE_VALUES:
            issues.append(Issue("ERROR", "INVALID_CONFIDENCE", f"metadata.confidence is {conf2!r}, expected one of {CONFIDENCE_VALUES}"))
        body_hash_value = md.get("bodyHash")
        if body_hash_value and not re.fullmatch(r"sha256:[0-9a-f]{64}", str(body_hash_value)):
            issues.append(Issue("WARN", "MALFORMED_BODY_HASH", f"metadata.bodyHash does not look like sha256:<64 hex chars>: {body_hash_value!r}"))
    else:
        issues.append(Issue("WARN", "MISSING_METADATA_BLOCK", "metadata block (identitySource/timestampSource/confidence) is missing"))

    return issues


# --------------------------------------------------------------------------
# Core per-file processing
# --------------------------------------------------------------------------


def build_metadata_fields(rel_path: str, repo_root: str, policy: Dict[str, Any]) -> Dict[str, Any]:
    artifact_type, artifact_scope, change_id = infer_artifact(rel_path)
    source_command, _cmd_confidence = resolve_source_command(artifact_type, repo_root)
    identity_value, identity_source, identity_confidence = resolve_identity(
        policy.get("identityMode", "provider-username"), policy.get("configuredAlias", ""), repo_root
    )
    if looks_like_secret(identity_value):
        identity_value, identity_source, identity_confidence = "unknown", "redacted", "LOW"

    repo_context, repo_confidence = resolve_repository_context(repo_root)
    if looks_like_secret(repo_context.get("reviewRequest")):
        repo_context["reviewRequest"] = None
    if looks_like_secret(source_command):
        source_command, _cmd_confidence = "unknown", "LOW"

    overall_confidence = min_confidence(identity_confidence, repo_confidence, _cmd_confidence)

    return {
        "artifactType": artifact_type,
        "artifactScope": artifact_scope,
        "changeId": change_id,
        "sourceCommand": source_command,
        "identityValue": identity_value,
        "identitySource": identity_source,
        "repositoryContext": repo_context if policy.get("includeRepositoryContext", True) else None,
        "metadataConfidence": overall_confidence,
    }


def process_file(abs_path: str, rel_path: str, repo_root: str, policy: Dict[str, Any], args: argparse.Namespace) -> FileResult:
    try:
        with open(abs_path, "r", encoding="utf-8") as fh:
            original_text = fh.read()
    except Exception as exc:
        return FileResult(rel_path, "error", [Issue("ERROR", "READ_FAILED", str(exc))])

    fm_lines, body, has_frontmatter = split_frontmatter(original_text)
    body_hash = compute_body_hash(body)

    existing_meta: Optional[Dict[str, Any]] = None
    span: Optional[Tuple[int, int]] = None
    if has_frontmatter and fm_lines is not None:
        span = find_chaos_metadata_span(fm_lines)
        if span:
            parsed = parse_simple_yaml_lines(fm_lines[span[0] : span[1]])
            candidate = parsed.get("chaosMetadata")
            if isinstance(candidate, dict):
                existing_meta = candidate

    issues: List[Issue] = []
    if not has_frontmatter:
        issues.append(Issue("ERROR", "MISSING_FRONTMATTER", "File has no YAML frontmatter block"))
    elif existing_meta is None:
        issues.append(Issue("ERROR", "MISSING_CHAOS_METADATA", "Frontmatter present but chaosMetadata key is missing"))
    else:
        issues.extend(validate_existing_metadata(existing_meta, rel_path))

    material_change: Optional[bool] = None
    if existing_meta is not None:
        stored_hash = (existing_meta.get("metadata") or {}).get("bodyHash") if isinstance(existing_meta.get("metadata"), dict) else None
        if stored_hash:
            material_change = stored_hash != f"sha256:{body_hash}"
        else:
            # Previous body hash unknown -> conservatively assume no material change
            # (avoids stamping/churning just because the hook happened to run).
            material_change = False

    want_stamp = args.stamp and not args.check_only
    did_stamp = False
    new_text = original_text

    if want_stamp:
        now_iso = current_iso_timestamp()
        fields = build_metadata_fields(rel_path, repo_root, policy)
        identity = fields["identityValue"]

        if existing_meta is None:
            new_meta: Dict[str, Any] = {
                "schemaVersion": SCHEMA_VERSION,
                "artifactType": fields["artifactType"],
                "artifactScope": fields["artifactScope"],
                "changeId": fields["changeId"],
                "sourceCommand": fields["sourceCommand"],
                "lastWrittenAt": now_iso,
                "lastWrittenBy": identity,
                "lastAuditedAt": now_iso,
                "lastAuditedBy": identity,
                "repositoryContext": fields["repositoryContext"],
                "metadata": {
                    "identitySource": fields["identitySource"],
                    "timestampSource": "local-system",
                    "confidence": fields["metadataConfidence"],
                    "bodyHash": f"sha256:{body_hash}",
                },
            }
            did_stamp = True
        else:
            new_meta = dict(existing_meta)
            changed = False
            if material_change:
                new_meta["lastWrittenAt"] = now_iso
                new_meta["lastWrittenBy"] = identity
                md = dict(new_meta.get("metadata") or {})
                md["bodyHash"] = f"sha256:{body_hash}"
                new_meta["metadata"] = md
                changed = True
            if material_change or policy.get("allowAuditOnlyStamp", False):
                new_meta["lastAuditedAt"] = now_iso
                new_meta["lastAuditedBy"] = identity
                changed = True
            did_stamp = changed

        if did_stamp:
            rendered = render_chaos_metadata_block(new_meta)
            if has_frontmatter and fm_lines is not None:
                if span:
                    new_fm_lines = fm_lines[: span[0]] + rendered + fm_lines[span[1] :]
                else:
                    trailer = [] if (fm_lines and fm_lines[-1].strip() == "") or not fm_lines else [""]
                    new_fm_lines = fm_lines + trailer + rendered
                new_text = "---\n" + "\n".join(new_fm_lines) + "\n---\n" + body
            else:
                new_text = "---\n" + "\n".join(rendered) + "\n---\n\n" + body

    status = "ok"
    if any(i.code == "MISSING_CHAOS_METADATA" or i.code == "MISSING_FRONTMATTER" for i in issues):
        status = "missing"
    elif any(i.severity == "ERROR" for i in issues):
        status = "invalid"

    if want_stamp and did_stamp:
        if args.dry_run:
            status = "would_stamp"
        else:
            try:
                if new_text != original_text:
                    with open(abs_path, "w", encoding="utf-8", newline="") as fh:
                        fh.write(new_text)
                status = "stamped"
                issues = [i for i in issues if i.code not in ("MISSING_CHAOS_METADATA", "MISSING_FRONTMATTER")]
            except Exception as exc:
                issues.append(Issue("ERROR", "WRITE_FAILED", str(exc)))
                status = "error"

    return FileResult(rel_path, status, issues, material_change)


# --------------------------------------------------------------------------
# Config / repo-root resolution
# --------------------------------------------------------------------------


def resolve_repo_root(args: argparse.Namespace, payload: Dict[str, Any]) -> str:
    if args.repo_root:
        return os.path.abspath(args.repo_root)
    env_root = os.environ.get("CLAUDE_PROJECT_DIR")
    if env_root and os.path.isdir(env_root):
        return os.path.abspath(env_root)
    payload_cwd = payload.get("cwd") if isinstance(payload, dict) else None
    if payload_cwd and os.path.isdir(str(payload_cwd)):
        return os.path.abspath(str(payload_cwd))
    current = os.path.abspath(os.getcwd())
    for _ in range(10):
        if os.path.isdir(os.path.join(current, ".chaos")) or os.path.isdir(os.path.join(current, ".git")):
            return current
        parent = os.path.dirname(current)
        if parent == current:
            break
        current = parent
    return os.path.abspath(os.getcwd())


def load_config(repo_root: str, config_path_arg: Optional[str]) -> Tuple[Dict[str, Any], Dict[str, List[str]]]:
    config_path = config_path_arg or os.path.join(repo_root, ".chaos", "config.yaml")
    policy = dict(DEFAULT_POLICY)
    managed = {k: list(v) for k, v in DEFAULT_MANAGED.items()}
    if not os.path.isfile(config_path):
        return policy, managed
    try:
        with open(config_path, "r", encoding="utf-8") as fh:
            text = fh.read()
        parsed = parse_simple_yaml_lines(text.splitlines())
        policies = parsed.get("policies") if isinstance(parsed, dict) else None
        if isinstance(policies, dict):
            am = policies.get("artifactMetadata")
            if isinstance(am, dict):
                policy.update(am)
            amf = policies.get("artifactMetadataManagedFiles")
            if isinstance(amf, dict):
                for key in ("include", "optional", "exclude"):
                    if isinstance(amf.get(key), list):
                        managed[key] = [str(p) for p in amf[key]]
    except Exception:
        pass
    return policy, managed


def read_stdin_payload() -> Dict[str, Any]:
    """Read a JSON hook payload from stdin without ever blocking.

    Claude Code hooks pipe a JSON payload and close stdin. Manual/CLI runs
    typically have stdin attached to a terminal or an inherited handle that
    never closes and never sends data. `isatty()` alone cannot distinguish
    "no data coming" from "hook payload arriving shortly" on Windows, so the
    actual read happens on a daemon thread with a bounded wait; if nothing
    arrives in time, we proceed with no payload instead of hanging.
    """
    try:
        if sys.stdin is None or sys.stdin.isatty():
            return {}
    except Exception:
        return {}

    result_queue: "queue_module.Queue[bytes]" = queue_module.Queue()

    def _reader() -> None:
        try:
            # Read raw bytes rather than sys.stdin.read(): on Windows, the
            # console/pipe codepage can decode a UTF-8 BOM as three separate
            # mojibake characters instead of recognizing it, which then fails
            # JSON parsing silently. Decoding the bytes ourselves with
            # utf-8-sig sidesteps the active codepage entirely.
            result_queue.put(sys.stdin.buffer.read())
        except Exception:
            result_queue.put(b"")

    reader_thread = threading.Thread(target=_reader, daemon=True)
    reader_thread.start()
    try:
        raw = result_queue.get(timeout=1.0)
    except queue_module.Empty:
        return {}

    if not raw or not raw.strip():
        return {}
    try:
        data = raw.decode("utf-8-sig")
        parsed = json.loads(data)
        return parsed if isinstance(parsed, dict) else {}
    except Exception:
        return {}


# --------------------------------------------------------------------------
# Reporting
# --------------------------------------------------------------------------


def render_issue(issue: Issue) -> str:
    return f"    [{issue.severity}] {issue.code}: {issue.message}"


def render_result(result: FileResult) -> str:
    lines = [f"  {result.rel_path} -> {result.status}"]
    for issue in result.issues:
        lines.append(render_issue(issue))
    return "\n".join(lines)


def remediation_text() -> str:
    return (
        "Remediation: run "
        "`python .claude/hooks/scripts/chaos-artifact-metadata-hook.py --event stop --stamp` "
        "(or the equivalent --event post-tool-use --stamp for a single file) to insert/repair "
        "chaosMetadata frontmatter, or see .claude/hooks/reference/artifact-metadata-validation.md."
    )


def summarize(results: List[FileResult]) -> Dict[str, int]:
    summary = {"checked": len(results), "valid": 0, "missing": 0, "invalid": 0, "stamped": 0, "would_stamp": 0, "error": 0}
    for r in results:
        if r.status == "ok":
            summary["valid"] += 1
        elif r.status == "missing":
            summary["missing"] += 1
        elif r.status == "invalid":
            summary["invalid"] += 1
        elif r.status == "stamped":
            summary["stamped"] += 1
        elif r.status == "would_stamp":
            summary["would_stamp"] += 1
        elif r.status == "error":
            summary["error"] += 1
    return summary


# --------------------------------------------------------------------------
# Event handlers
# --------------------------------------------------------------------------


def handle_post_tool_use(payload: Dict[str, Any], repo_root: str, policy: Dict[str, Any], managed: Dict[str, List[str]], args: argparse.Namespace) -> int:
    if not policy.get("enabled", True):
        return 0

    tool_name = payload.get("tool_name")
    tool_input = payload.get("tool_input") if isinstance(payload.get("tool_input"), dict) else {}
    file_path = tool_input.get("file_path") or tool_input.get("path") or payload.get("file_path")

    if not file_path:
        return 0
    if tool_name and tool_name not in ("Edit", "Write", "MultiEdit", "NotebookEdit"):
        return 0
    if not str(file_path).lower().endswith(".md"):
        return 0

    abs_path = file_path if os.path.isabs(file_path) else os.path.join(repo_root, file_path)
    if not os.path.isfile(abs_path):
        return 0

    try:
        rel_path = _norm_rel(os.path.relpath(abs_path, repo_root))
    except ValueError:
        return 0

    state = classify_managed(rel_path, repo_root, managed)
    if state != "managed":
        return 0

    result = process_file(abs_path, rel_path, repo_root, policy, args)

    print(f"chaos-artifact-metadata-hook (post-tool-use): {rel_path}")
    print(render_result(result))

    if args.strict and result.blocking and result.status in ("missing", "invalid", "error"):
        if policy.get("failOnMissingMetadataInStrictHooks", True):
            print(remediation_text(), file=sys.stderr)
            return 2
    elif result.blocking and policy.get("warnOnMissingMetadataInContributorHooks", True):
        print(remediation_text())

    return 0


def handle_stop(payload: Dict[str, Any], repo_root: str, policy: Dict[str, Any], managed: Dict[str, List[str]], args: argparse.Namespace) -> int:
    if not policy.get("enabled", True):
        print("chaos-artifact-metadata-hook (stop): policies.artifactMetadata.enabled is false — skipping.")
        return 0

    files = collect_managed_files(repo_root, managed)
    results = [process_file(os.path.join(repo_root, rel), rel, repo_root, policy, args) for rel in files]
    summary = summarize(results)
    optional_candidates = collect_optional_candidates(repo_root, managed, files)

    print("chaos-artifact-metadata-hook (stop) — CHAOS artifact provenance summary")
    print(
        f"  files checked: {summary['checked']} | valid: {summary['valid']} | missing: {summary['missing']} | "
        f"invalid: {summary['invalid']} | stamped: {summary['stamped']} | would_stamp: {summary['would_stamp']} | "
        f"errors: {summary['error']}"
    )
    for result in results:
        if result.status != "ok":
            print(render_result(result))
    if optional_candidates:
        print(f"  optional (not yet CHAOS-managed): {len(optional_candidates)} file(s) — see policies.artifactMetadataManagedFiles.optional")

    blocking = summary["missing"] + summary["invalid"] + summary["error"]
    if args.strict and blocking > 0 and policy.get("failOnMissingMetadataInStrictHooks", True):
        print(remediation_text(), file=sys.stderr)
        return 2
    if blocking > 0 and policy.get("warnOnMissingMetadataInContributorHooks", True):
        print(remediation_text())
    return 0


# --------------------------------------------------------------------------
# CLI entrypoint
# --------------------------------------------------------------------------


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="CHAOS artifact provenance metadata hook (report-only or stamping).")
    parser.add_argument("--event", choices=["post-tool-use", "stop"], required=True)
    parser.add_argument("--dry-run", action="store_true", help="Compute but do not write changes.")
    parser.add_argument("--check-only", action="store_true", help="Validation only; never stamps, even if --stamp is also passed.")
    parser.add_argument("--stamp", action="store_true", help="Insert/update chaosMetadata where policy allows.")
    parser.add_argument("--strict", action="store_true", help="Exit 2 (blocking) on missing/invalid metadata for managed files.")
    parser.add_argument("--config", default=None, help="Path to .chaos/config.yaml (defaults to <repo-root>/.chaos/config.yaml).")
    parser.add_argument("--repo-root", default=None, help="Repository root (defaults to CLAUDE_PROJECT_DIR, payload cwd, or discovered .chaos/.git).")
    return parser


def main() -> int:
    args = build_arg_parser().parse_args()
    payload = read_stdin_payload()

    try:
        repo_root = resolve_repo_root(args, payload)
        policy, managed = load_config(repo_root, args.config)

        if args.event == "post-tool-use":
            return handle_post_tool_use(payload, repo_root, policy, managed, args)
        return handle_stop(payload, repo_root, policy, managed, args)
    except SystemExit:
        raise
    except Exception as exc:  # never let an internal bug block the session
        print(f"chaos-artifact-metadata-hook: internal error (non-blocking): {exc}", file=sys.stderr)
        return 0


if __name__ == "__main__":
    _exit_code = main()
    # A daemon reader thread from read_stdin_payload() may still be blocked in
    # stdin.read() if no hook payload ever arrived (e.g. a manual CLI run with
    # stdin inherited-but-idle rather than a real TTY). Python's normal
    # interpreter shutdown can then crash trying to finalize stdin's buffer
    # while that thread holds its lock. Flush our own output and hard-exit to
    # skip that finalization path entirely.
    sys.stdout.flush()
    sys.stderr.flush()
    os._exit(_exit_code)
