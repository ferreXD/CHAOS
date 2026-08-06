# Design: the public distribution surface

> 2026-08-06. Executes item 4 of the lean-core assessment's 90-day list
> (`.chaos/assessments/2026-08-06-lean-core-assessment/07-what-it-can-become.md`, Future A).
> Toolkit meta-work — designed and built without governance, per the standing rule.
>
> Registered target this design is accountable to (assessment 08, prediction 3):
> **time-to-first-stop under 15 minutes from a cold Claude Code install.** Everything below
> is shaped by that number and by R7: no claim on any public page may outrun the evidence.

## 1. Goals and non-goals

**Goals**

1. A stranger with Claude Code reaches their **first recorded stop in ≤15 minutes**,
   measured, on macOS/Linux/Windows.
2. **One version identity** across every artifact a user can hold (plugin, npm package,
   VSIX, git tag) — no more alignment-by-file-copy.
3. **Progressive enhancement**: the core loop works with the plugin alone; each additional
   install step upgrades the experience rather than gating it.
4. The evidence travels with the product: one honest page, caveats inline, and the
   plain+ask rival kit offered to every skeptic.
5. Zero telemetry. Local files only. Privacy is a stated feature, not an accident.

**Non-goals (this iteration)**

- Multi-user / team surfaces (Future B, parked).
- Non-Claude agent support.
- A hosted anything. The product is a repo-local discipline.

## 2. The shape: three artifacts, one ladder

### The install ladder (progressive enhancement)

| Level | What the user has | What works | Install cost |
|---|---|---|---|
| **L0 — plugin only** | CHAOS Claude Code plugin | All 5 commands; the stop runs **chat-interactive** (`commands.enabled: false` fallback, set by `chaos:init` when it detects no runtime); the **decision record is still written** | ~2 min |
| **L1 — + MCP runtime** | npm-published MCP server wired by the plugin | Durable decisions, locks, capsules, `chaos:resume`, answer via runtime CLI | 0 extra min (see 2.2) |
| **L2 — + Decision Center** | VS Code extension | The panel: pending decisions, options, rationale, one-click answer | ~3 min |

The critical design move: **the record — the adoptable artifact per assessment 09 — is
produced at L0.** Nobody has to install the runtime to get value; the runtime upgrades
durability, the panel upgrades ergonomics. `chaos:doctor` reports the current level and
the exact command to reach the next one.

### 2.1 Artifact A — the Claude Code plugin (primary channel)

A `chaos` plugin in a marketplace repo (this repo doubles as the marketplace:
`/plugin marketplace add ferreXD/CHAOS`, then `/plugin install chaos`). It ships:

- the 5 commands, the 13 skills, the 5 agents (the current `.claude/` surface, re-rooted
  into the plugin layout);
- the MCP server registration (plugin-scoped `.mcp.json` equivalent) pointing at the npm
  package via `npx -y` — which is what makes L1 free;
- hooks **excluded** from the default plugin (they require Python and are optional by
  doctrine); shipped as a documented opt-in.

Manifest specifics (`.claude-plugin/plugin.json` fields, marketplace metadata) to be
verified against current Claude Code plugin docs at implementation time — the design
depends only on capabilities the plugin system demonstrably has (commands, skills,
agents, MCP config).

Consequence worth naming: **the plugin update path replaces the alignment scripts.**
Machinery updates arrive by `/plugin update`; workspace files (`.chaos/`) remain
user-owned and are never touched by updates. `chaos:init` gains an idempotent
"re-init over existing workspace" mode as the migration tool between machinery versions.

### 2.2 Artifact B — `@chaos-workflow/interaction-mcp` on npm

The MCP server, published. Changes from today's state (Observed: `@chaos/interaction-mcp`
v0.1.0, `bin` pointing at a `.ts` file, run via `node <path>` from a checkout):

- **Bundle to JS** (single-file build, Node ≥ 20.19, no install-time compile); `bin` points
  at the bundle. `npx -y @chaos-workflow/interaction-mcp` must work on a machine that has
  never seen this repo.
- The runtime package becomes a bundled dependency (not separately published in v0.2 —
  fewer names to defend, one artifact to test).
- Scope note: `@chaos/*` is almost certainly taken/unavailable; `@chaos-workflow/*` (or the
  operator's own scope) to be decided at publish time — **operator-owned decision** (§6).
- Server behaviour unchanged: file-backed, repo-local, `--repo-root .`; schemas ship inside
  the package and are seeded into `.chaos/interactions/schema/` by init (today they're
  copied from the repo — same contract, new source).

### 2.3 Artifact C — the Decision Center extension

- Publish to **VS Code Marketplace** and **OpenVSX** (Cursor/VSCodium users are a real
  slice of the target niche), plus a `.vsix` attached to every GitHub release for the
  air-gapped case. Publisher account creation and the `publisher` id (currently the
  placeholder `chaos`) are **operator-owned** (§6).
- The PowerShell build script is replaced by cross-platform npm scripts (`@vscode/vsce`
  driven), because releases must be cuttable from CI, not from the author's machine.
- Panel gains one small but load-bearing feature for the ladder: when the runtime store
  has pending decisions and the extension is *not* installed, nothing tells the human.
  `chaos:run`'s stop message already prints the decision id; it should also print the
  L2 upgrade line. (Skill-prose change, zero code.)

## 3. What lands in a user's repository

`chaos:init` (already lean) creates: `AGENTS.md`, `.chaos/config.yaml`,
`.chaos/bootstrap-report.md`, `.chaos/context.md`, `.chaos/architecture.md`,
`.chaos/decisions/index.md`, plus gitignored runtime state and (L1+) the seeded schema
dir. Nothing else. The `.gitignore` block is written by init, not documented-and-hoped.

Upgrade semantics: machinery via plugin/npm/marketplace; workspace via re-init (preserve
by default, ask before semantic change — the contract already says this). A
`machineryVersion` line in `config.yaml` gives doctor a drift check between plugin version
and workspace expectations.

## 4. The public face of this repository

1. **README** stays the front door (already accurate; add the install ladder + 15-min
   claim only after it is measured true).
2. **`docs/quickstart.md`** — the ladder, one screen per level, ending at the first
   recorded stop. This is the only new user guide; the old five stay dead.
3. **`docs/evidence.md`** — the honest page: the multipliers, the catches, the n=3 /
   one-operator / one-codebase caveats *in the same table*, a link to the full validation
   record, and the **plain+ask challenge**: the frozen rival instruction plus instructions
   to run it in your own repo and report. Assessment 05's positioning sentence is the
   page's header; R7 is its editor.
4. **Releases**: GitHub Releases with semver `0.x`, lockstep across plugin/npm/VSIX/tag.
   Proposed: current tree becomes **v0.2.0 "lean core"** (0.1 retroactively = the
   apparatus era, already immortalized by `apparatus-final`). Changelog generated from
   commit history, hand-edited for honesty.
5. **CI additions**: an OS matrix (ubuntu/macos/windows) for the five suites — today's CI
   plus the cross-platform reality check — and a release workflow that builds all three
   artifacts from a tag. A smoke job that runs `npx` against the *published* MCP package
   answers "does L1 actually work cold".

## 5. Release checklist (per release, mechanical)

1. All suites green on the OS matrix (runtime, MCP, runner, diagnostics, extension, hooks).
2. Version bumped in lockstep (one script owns this); tag `vX.Y.Z`.
3. `npx -y` cold-start smoke against the freshly published npm package.
4. Plugin install smoke in a scratch repo: marketplace add → install → init → one
   `chaos:run` reaching a stop; **time it**; the quickstart's claim is updated to the
   measured number or the claim comes off the page (R7 discipline).
5. Evidence page diff-reviewed against 02's caveat list.

## 6. Operator-owned actions (accounts, names, publishing — nothing here is mine to do)

| Decision | Options | Needed by |
|---|---|---|
| npm scope | `@chaos-workflow/*`, personal scope, unscoped name | first npm publish |
| VS Code publisher id | replaces placeholder `chaos` | first VSIX publish |
| Marketplace strategy | this repo as its own plugin marketplace vs a separate `chaos-marketplace` repo | plugin release |
| License confirmation for published artifacts | MIT already; confirm for npm/marketplace metadata | first publish |
| The 0.2.0 cut | when the arena-close work (assessment items 1–3) lands, or before | release day |

## 7. Risks specific to this design

- **`npx` cold-start is the weakest link** (network, Node version, corporate proxies).
  Mitigation: the L0 chat-mode floor means a broken L1 degrades, not blocks; doctor
  diagnoses the exact failure.
- **Plugin-system drift**: Claude Code's plugin surface is young; manifest details may
  shift. Mitigation: the repo remains installable by copy (documented as the fallback it
  already is); the plugin is a packaging of `.claude/`, not a rewrite.
- **Name collisions** ("chaos" is maximally generic). Accept: the discipline is small
  enough to rename cheaply before 1.0 if the operator ever wants a distinctive name;
  do not spend this iteration on branding.
- **Maintenance surface grows by three publish targets** against bus factor 1. Mitigation:
  the release workflow must be one-command from a tag, or releases will simply stop
  happening (Inferred, HIGH — this is the failure mode that produces assessment 09's 40%
  branch).

## 8. Acceptance

This design is done when: a machine that has never seen this repo, on each of the three
OSes, goes from "Claude Code installed" to "first folded stop answered and a decision
record on disk" in under 15 minutes at L0–L1, under 20 including L2 — measured, and the
measured numbers are the ones printed in the quickstart.
