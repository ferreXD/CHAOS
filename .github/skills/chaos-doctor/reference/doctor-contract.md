# chaos:doctor — Report & Fix Contract

Defines the doctor report shape, verdict semantics, and the strict fix policy.

## Verdicts

- **READY** — all required checks pass for the active mode; no blocking gaps.
- **READY_WITH_WARNINGS** — usable; non-blocking gaps exist (e.g. MCP unavailable, optional
  CLI not authenticated). The default outcome when only optional capabilities are missing.
- **NOT_READY** — a required local capability is missing for the active mode (e.g. git or
  OpenSpec unavailable) and must be fixed before normal CHAOS use.
- **BLOCKED** — a mode-required, provider-backed fact cannot be resolved (e.g. `--strict`
  needs provider authority but no provider context is reachable).
- **UNKNOWN** — diagnostics could not run far enough to judge (e.g. not inside a git repo).

## Mode behaviour

- `--light` — surface gaps as advisories; recommend `--dry-run` for repo-wide operations when
  provider context is missing.
- `--standard` (default) — gaps are warnings unless they block normal local execution.
- `--strict` — mode-required provider-backed facts (provider authority, provider CI) must be
  resolvable, else `BLOCKED`. Local-git-only authority is recorded as LOW.
- Focus flags (`--mcp`, `--github`, `--azure-devops`, `--hooks`) narrow the catalog to the
  named area but keep the same verdict model.

## Fix policy (strict)

- Default and `--dry-run`: **read-only**, no writes.
- `--fix-plan`: propose safe local setup fixes as explicit commands (e.g. `gh auth login`,
  `npm install -g @fission-ai/openspec@latest`), with rationale. **Do not apply.**
- `--fix`: apply **only safe local setup fixes** (local tooling/auth/config-intent), one at a
  time, each behind an explicit confirmation (STOP before applying). Never:
  - edit production code, governance indexes, ADRs, or rules;
  - write secrets/tokens/PATs to any file;
  - perform remote writes;
  - apply broad/auto fixes beyond the confirmed item.

## Report shape

Write to `.chaos/doctor/doctor-report-YYYY-MM-DD.md` (unless `--dry-run`):

```markdown
# chaos:doctor report — <YYYY-MM-DD>

Mode: light | standard | strict
Focus: all | mcp | github | azure-devops | hooks
Verdict: READY | READY_WITH_WARNINGS | NOT_READY | BLOCKED | UNKNOWN

## Summary
- <one-line verdict rationale>

## Repository Context
Provider: github | azure-devops | local-git | unknown
Context source: github-mcp | azure-devops-mcp | gh-cli | az-devops-cli | git | manual
Branch: <branch>
Default branch: <branch-or-unknown>
Review request: <id/url-or-none>
User: <resolved user-or-unknown>
Authority confidence: HIGH | MEDIUM | LOW
Repo-wide sync posture: ALLOWED | REQUIRES_CONFIRMATION | BLOCKED
Missing capabilities:
- <capability-or-none>

## Checks
| Check | Result | Confidence | Notes |
|---|---|---|---|
| ... | PASS/WARN/FAIL/UNKNOWN | HIGH/MEDIUM/LOW | ... |

## Fix plan (only when --fix-plan / --fix)
- [ ] <safe local setup fix> — <command> — <rationale>

## Next actions
- <recommended next command>
```

Findings carry knowledge type (`FACT|INFERENCE|ASSUMPTION|UNKNOWN|CONFLICT`) and confidence
(`HIGH|MEDIUM|LOW`) per the constitution's confidence doctrine. Redact any sensitive values.

## Related

- `check-catalog.md`
- `.github/skills/chaos-shared/reference/repository-context-contract.md`
- `.github/skills/chaos-shared/reference/mcp-security-policy.md`
