# chaos-parity-check

Deterministic parity check between the two agent surfaces CHAOS ships:

- **Claude Code** — `.claude/commands/`, `.claude/skills/`, `.claude/agents/`
- **GitHub Copilot** — `.github/prompts/`, `.github/skills/`, `.github/agents/`

Parity between the two surfaces used to be asserted in prose and hand-maintained. This tool makes
drift **mechanically detectable** (in review and in CI) instead of relying on someone noticing.

## What it compares

| # | Dimension | Claude | Copilot |
|---|---|---|---|
| 1 | Command / prompt set | `.claude/commands/<n>.md` | `.github/prompts/<n>.prompt.md` |
| 2 | Skill set | `.claude/skills/<n>/` | `.github/skills/<n>/` |
| 3 | Agent set | `.claude/agents/<n>.md` | `.github/agents/<n>.agent.md` |
| 4 | Per-skill contract files | `SKILL.md` + `reference/**.md` | `SKILL.md` + `reference/**.md` |
| 5 | Prompt → agent linkage | — | each `.github/prompts/*` frontmatter `agent:` must resolve to an agent present on **both** surfaces |

A logical name present on one surface but missing on the other — and not declared as an
intentional exception — is reported as **drift** and fails the check.

## Usage

```bash
node tools/chaos-parity-check/check.mjs            # human-readable report
node tools/chaos-parity-check/check.mjs --json     # machine-readable report
node tools/chaos-parity-check/check.mjs --strict   # also fail on stale/needless exceptions
node tools/chaos-parity-check/check.mjs --exceptions <file>
node tools/chaos-parity-check/check.mjs --root <repoRoot>
node tools/chaos-parity-check/check.mjs --help
```

Requires **Node ≥ 18**. Zero npm dependencies. Deterministic (sorted output, no wall clock).

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Surfaces are in parity (modulo declared exceptions). |
| `1` | Drift detected. |
| `2` | Tool/config error (missing surface directory, unparseable exceptions file). |

## Declared exceptions

Intentional, reviewed asymmetries live in [`parity-exceptions.json`](./parity-exceptions.json). Each
entry carries a `reason`, so the manifest is self-documenting. Anything **not** listed there that
differs is drift.

Current declared exceptions:

- **Commands — Copilot-only:** `opsx-apply`, `opsx-archive`, `opsx-explore`, `opsx-propose`,
  `opsx-sync`. The OpenSpec experimental flow is surfaced on Claude as the `openspec-*` **skills**
  (not `.claude/commands` wrappers), so the prompt files have no command counterpart by design.
- **Agents — Copilot-only:** `CSharpExpert`, the generic C# fallback retained per
  `config.yaml` `agents.copilot.csharpExpertFallback`. The CHAOS-integrated
  `chaos-csharp-implementation-specialist` exists on both surfaces.

Run with `--strict` to also flag exceptions that are no longer justified (e.g. a name that now
exists on both surfaces, so the exception can be deleted).

## Scope and limitations

This check verifies the **structural contract surface** — which commands/skills/agents exist on
each side, which contract files (`SKILL.md` + `reference/`) back each skill, and that every prompt
points at a real, mirrored agent. It intentionally does **not**:

- diff the free-text *body* of paired files (a SKILL.md and its prompt are written differently per
  host by design);
- compare incidental root-level dev notes such as `PATCH-SUMMARY.md` (development history, not part
  of what an agent reads);
- parse decision-event vocabulary or per-command output-contract semantics out of prose.

Those richer semantic dimensions are deliberately out of scope for this pass; the structural check
is the deterministic, low-false-positive core. If a future need arises, add a dimension here rather
than re-introducing prose-only parity claims.

## CI

`.github/workflows/parity-check.yml` runs this script on pushes and pull requests that touch either
surface, so drift is caught automatically. The script is the source of truth; the workflow is just
an automated invocation of it and can be removed without affecting local use.
