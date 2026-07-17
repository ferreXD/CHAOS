#!/usr/bin/env python3
"""CHAOS vNext runtime hook — session/repository context.

Builds `.chaos/runtime/session-context.json`: a best-effort, local-git-only
snapshot of repo/branch/user/working-tree context for the current session.
Python 3 standard library only. Safe as a Claude Code SessionStart /
UserPromptSubmit / Stop hook, or run manually from the command line.

Scope: local `git` fallback only. Does not call MCP or provider CLIs — see
../reference/hook-runtime-policy.md and
../../skills/chaos-shared/reference/repository-context-resolution-policy.md
for the (separate, still spec-only) full MCP-aware resolver this hook does
not implement.

Because this hook can only ever resolve from local git, each run compares
its `repository`/`branch`/`user` confidence against any prior
`session-context.json` (which may have been written by a richer,
MCP-aware resolver) and keeps whichever outranks the other per section,
instead of unconditionally overwriting richer prior context with a
lower-confidence local-git guess. `workingTree` is always resolved fresh
since it reflects live, time-sensitive repo state.
"""

from __future__ import annotations

import importlib.util
import os
import re
import sys
from typing import Any, Dict, List, Optional, Tuple

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def _bootstrap_common():
    spec = importlib.util.spec_from_file_location("chaos_hook_common", os.path.join(_SCRIPT_DIR, "chaos-hook-common.py"))
    if spec is None or spec.loader is None:
        raise ImportError("could not load chaos-hook-common.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


common = _bootstrap_common()

HOOK_NAME = "chaos-session-context"
GENERATED_BY = "chaos-session-context-hook"


def _parse_remote(remote_url: Optional[str], provider: str) -> Dict[str, str]:
    result = {"name": "", "ownerOrOrganization": "", "project": "", "remoteUrl": remote_url or "", "defaultBranch": "", "providerUrl": ""}
    if not remote_url:
        return result

    if provider == "github":
        m = re.search(r"github\.com[:/]([^/]+)/([^/]+?)(\.git)?/?$", remote_url)
        if m:
            owner, name = m.group(1), m.group(2)
            result["ownerOrOrganization"] = owner
            result["name"] = name
            result["providerUrl"] = f"https://github.com/{owner}/{name}"
        return result

    if provider == "azure-devops":
        # Modern: dev.azure.com/{org}/{project}/_git/{repo}
        m = re.search(r"dev\.azure\.com/([^/]+)/([^/]+)/_git/([^/]+?)/?$", remote_url)
        if m:
            org, project, name = m.group(1), m.group(2), m.group(3)
            result["ownerOrOrganization"] = org
            result["project"] = project
            result["name"] = name
            result["providerUrl"] = f"https://dev.azure.com/{org}/{project}/_git/{name}"
            return result
        # Legacy: {org}.visualstudio.com/{project}/_git/{repo} (org is the subdomain)
        m = re.search(r"([A-Za-z0-9-]+)\.visualstudio\.com[:/]([^/]+)/_git/([^/]+?)/?$", remote_url)
        if m:
            org, project, name = m.group(1), m.group(2), m.group(3)
            result["ownerOrOrganization"] = org
            result["project"] = project
            result["name"] = name
            result["providerUrl"] = f"https://dev.azure.com/{org}/{project}/_git/{name}"
            return result
        # Legacy, no project segment: {org}.visualstudio.com/_git/{repo}
        m = re.search(r"([A-Za-z0-9-]+)\.visualstudio\.com[:/]_git/([^/]+?)/?$", remote_url)
        if m:
            org, name = m.group(1), m.group(2)
            result["ownerOrOrganization"] = org
            result["name"] = name
            result["providerUrl"] = f"https://dev.azure.com/{org}/_git/{name}"
        return result

    # local-git / unknown: best-effort repo name from the URL/path tail only.
    tail = remote_url.rstrip("/").split("/")[-1]
    if tail.endswith(".git"):
        tail = tail[:-4]
    result["name"] = tail
    return result


def _resolve_default_branch(repo_root: str) -> str:
    ref = common.run_git(repo_root, ["symbolic-ref", "refs/remotes/origin/HEAD"])
    if ref:
        return ref.rsplit("/", 1)[-1]
    return ""


def _parse_working_tree(repo_root: str) -> Tuple[Dict[str, Any], bool]:
    status = common.run_git(repo_root, ["status", "--porcelain"])
    if status is None:
        return {"clean": True, "changedFiles": [], "stagedFiles": [], "untrackedFiles": [], "confidence": "LOW"}, False

    changed: List[str] = []
    staged: List[str] = []
    untracked: List[str] = []
    for line in status.splitlines():
        if not line:
            continue
        code = line[:2]
        path = line[3:].strip()
        if not path:
            continue
        if code.startswith("??"):
            untracked.append(path)
            continue
        if code[0] not in (" ", "?"):
            staged.append(path)
        if len(code) > 1 and code[1] not in (" ", "?"):
            changed.append(path)

    tree = {
        "clean": not (changed or staged or untracked),
        "changedFiles": changed,
        "stagedFiles": staged,
        "untrackedFiles": untracked,
        "confidence": "HIGH",
    }
    return tree, True


def resolve_session_context(repo_root: str, existing: Dict[str, Any]) -> Dict[str, Any]:
    sources_used: List[str] = []
    warnings: List[str] = []
    missing_capabilities = ["mcp", "provider-cli"]

    toplevel = common.run_git(repo_root, ["rev-parse", "--show-toplevel"])
    if toplevel:
        sources_used.append("git-rev-parse")

    remote = common.run_git(repo_root, ["remote", "get-url", "origin"])
    if remote:
        sources_used.append("git-remote")

    branch_name = common.run_git(repo_root, ["branch", "--show-current"])
    if branch_name:
        sources_used.append("git-branch")

    upstream = common.run_git(repo_root, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"])
    merge_base = None
    if upstream:
        sources_used.append("git-upstream")
        merge_base = common.run_git(repo_root, ["merge-base", upstream, "HEAD"])
        if merge_base:
            sources_used.append("git-merge-base")

    user_name = common.run_git(repo_root, ["config", "user.name"])
    user_email = common.run_git(repo_root, ["config", "user.email"])
    if user_name or user_email:
        sources_used.append("git-config")

    default_branch = _resolve_default_branch(repo_root)

    if not toplevel:
        # Not a git repository (or git unavailable). Tolerate rather than crash.
        warnings.append("git rev-parse --show-toplevel failed; treating as a non-git or inaccessible directory")
        working_tree = {"clean": True, "changedFiles": [], "stagedFiles": [], "untrackedFiles": [], "confidence": "LOW"}
        provider = "unknown"
        repository = {"name": "", "ownerOrOrganization": "", "project": "", "remoteUrl": "", "defaultBranch": "", "providerUrl": "", "confidence": "LOW"}
        branch = {"name": "", "isDefaultBranch": False, "upstream": "", "mergeBase": "", "confidence": "LOW"}
        user = {
            "id": "",
            "username": common.safe_string(user_name) if user_name else "",
            "displayName": common.safe_string(user_name) if user_name else "",
            "email": common.safe_string(user_email) if user_email else "",
            "identitySource": "git-config" if (user_name or user_email) else "unknown",
            "confidence": "LOW",
        }
        fallback_level = "git" if sources_used else "none"
    else:
        provider = common.detect_provider_from_remote(remote)
        repository = _parse_remote(remote, provider)
        repository["defaultBranch"] = default_branch
        repository["confidence"] = "HIGH" if (toplevel and remote) else ("MEDIUM" if toplevel else "LOW")

        branch = {
            "name": branch_name or "",
            "isDefaultBranch": bool(branch_name) and bool(default_branch) and branch_name == default_branch,
            "upstream": upstream or "",
            "mergeBase": merge_base or "",
            "confidence": "MEDIUM" if branch_name else "LOW",
        }

        user_confidence = "MEDIUM" if user_name else "LOW"
        user = {
            "id": "",
            "username": common.safe_string(user_name) if user_name else "",
            "displayName": common.safe_string(user_name) if user_name else "",
            # Raw email only stored because it came from local git fallback; never from a
            # provider identity API. Kept LOW/MEDIUM confidence per policy.
            "email": common.safe_string(user_email) if user_email else "",
            "identitySource": "git-config" if (user_name or user_email) else "unknown",
            "confidence": user_confidence,
        }

        working_tree, wt_ok = _parse_working_tree(repo_root)
        if wt_ok:
            sources_used.append("git-status")

        if not remote:
            warnings.append("no 'origin' remote resolved; provider/repository fields are best-effort or empty")
        if not branch_name:
            warnings.append("could not resolve current branch name (detached HEAD or empty repo?)")

        fallback_level = "git"

    # This hook only ever resolves identity/repository context from local git,
    # which is often lower-confidence than a prior resolution written by a
    # richer, MCP-aware resolver (see hook-runtime-policy.md). Rather than
    # blindly overwriting that richer context on every run, keep whichever of
    # (freshly resolved vs. prior session-context.json) outranks the other,
    # per section. `workingTree` is excluded: it reflects live, time-sensitive
    # repo state that local git can always resolve accurately, so a prior
    # snapshot is never preferred over a fresh one.
    def _carry_forward_warning(section_name: str, existing_confidence: Optional[str], new_confidence: Optional[str]) -> None:
        warnings.append(
            f"{section_name} carried forward from prior session-context.json "
            f"(existing confidence {existing_confidence!r} > local-git {new_confidence!r})"
        )

    existing_repository = existing.get("repository") if isinstance(existing, dict) else None
    if isinstance(existing_repository, dict) and common.is_richer_confidence(existing_repository.get("confidence"), repository.get("confidence")):
        _carry_forward_warning("repository", existing_repository.get("confidence"), repository.get("confidence"))
        repository = existing_repository
        existing_provider = existing.get("provider") if isinstance(existing, dict) else None
        if existing_provider:
            provider = existing_provider

    existing_branch = existing.get("branch") if isinstance(existing, dict) else None
    if isinstance(existing_branch, dict) and common.is_richer_confidence(existing_branch.get("confidence"), branch.get("confidence")):
        _carry_forward_warning("branch", existing_branch.get("confidence"), branch.get("confidence"))
        branch = existing_branch

    existing_user = existing.get("user") if isinstance(existing, dict) else None
    if isinstance(existing_user, dict) and common.is_richer_confidence(existing_user.get("confidence"), user.get("confidence")):
        _carry_forward_warning("user", existing_user.get("confidence"), user.get("confidence"))
        user = existing_user

    overall_confidence = common.min_confidence(
        repository.get("confidence", "LOW"), branch.get("confidence", "LOW"), user.get("confidence", "LOW"), working_tree.get("confidence", "LOW")
    )

    # Fields local git cannot resolve at all; carry forward from a prior,
    # richer resolution if one exists rather than guessing.
    review_request = {
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
    existing_review_request = existing.get("reviewRequest") if isinstance(existing, dict) else None
    if isinstance(existing_review_request, dict) and existing_review_request.get("id"):
        review_request = existing_review_request
        warnings.append("reviewRequest carried forward from prior session-context.json (not re-resolved by local git)")

    context: Dict[str, Any] = {
        "schemaVersion": common.SCHEMA_VERSION,
        "generatedAt": common.now_iso(),
        "generatedBy": GENERATED_BY,
        "repoRoot": toplevel or repo_root,
        "provider": provider,
        "repository": repository,
        "user": user,
        "branch": branch,
        "reviewRequest": review_request,
        "workingTree": working_tree,
        "resolution": {
            "sourcesUsed": sources_used,
            "fallbackLevel": fallback_level,
            "missingCapabilities": missing_capabilities,
            "warnings": warnings,
            "confidence": overall_confidence,
        },
    }
    return context


def main() -> int:
    parser = common.common_arg_parser("CHAOS session/repository context hook (writes .chaos/runtime/session-context.json).")
    parser.add_argument("--event", choices=["session-start", "user-prompt-submit", "stop"], required=True)
    args = parser.parse_args()

    try:
        payload = common.load_json_stdin()
        repo_root = common.find_repo_root(args.repo_root, payload)

        runtime_path, created = common.ensure_runtime_dir(repo_root, dry_run=args.dry_run)
        if created:
            common.log_violation(
                repo_root, "INFO", HOOK_NAME, "CHAOS-HOOK-001",
                "runtime directory created", confidence="HIGH", dry_run=args.dry_run,
            )

        existing = common.load_session_context(repo_root)
        context = resolve_session_context(repo_root, existing)

        target_path = os.path.join(runtime_path, common.SESSION_CONTEXT_FILENAME)
        common.write_json_file_atomic(target_path, context, dry_run=args.dry_run)

        resolution = context["resolution"]
        if context["provider"] == "unknown" or not context["branch"]["name"]:
            common.log_violation(
                repo_root, "WARN", HOOK_NAME, "CHAOS-HOOK-002",
                f"session context incomplete (provider={context['provider']!r}, branch={context['branch']['name']!r})",
                confidence=resolution["confidence"], dry_run=args.dry_run,
            )
        if resolution["fallbackLevel"] == "none":
            common.log_violation(
                repo_root, "WARN", HOOK_NAME, "CHAOS-HOOK-008",
                "repository context unavailable (not a git repository, or git is not installed/reachable)",
                confidence="LOW", dry_run=args.dry_run,
            )

        if args.print_output:
            print(__import__("json").dumps(context, indent=2))
        else:
            print(f"{HOOK_NAME} ({args.event}): provider={context['provider']} branch={context['branch']['name'] or 'unknown'} confidence={resolution['confidence']}")

        return 0
    except SystemExit:
        raise
    except Exception as exc:  # never let an internal bug block the session
        print(f"{HOOK_NAME}: internal error (non-blocking): {exc}", file=sys.stderr)
        try:
            repo_root = common.find_repo_root(None, {})
            common.log_violation(repo_root, "WARN", HOOK_NAME, "CHAOS-HOOK-010", f"recovered from non-fatal error: {exc}", confidence="LOW")
        except Exception:
            pass
        return 2 if args.strict else 0


if __name__ == "__main__":
    _exit_code = main()
    common.exit_hard(_exit_code)
