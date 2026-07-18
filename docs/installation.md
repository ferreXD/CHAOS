# Installing CHAOS

This guide gets the **CHAOS tooling** onto disk, wired up, verified, and running its
first command — either in this repository (to evaluate it) or in **your own** repository
(to adopt it).

> **This is not `chaos:init`.** Installing CHAOS puts the *commands, runtime, and
> Decision Center UI* in place. `chaos:init` is a governed command you run *after*
> installing — it **generates governance content** (constitution, config, decision/rule
> indexes) for a repo that has code but no CHAOS governance yet. The two solve different
> problems; see [Installation vs. `chaos:init`](#installation-vs-chaosinit) at the end.

> **Status: experimental / public alpha.** Packaging is still rough. Expect to copy
> folders by hand and build two small local packages — there is no installer yet.

---

## What you're installing

CHAOS is not a single binary. It is a set of repo-local pieces that work together:

| Piece | Location | Role |
|---|---|---|
| **Command surface (Claude Code)** | `.claude/` | The reference implementation — commands, skills, agents, hooks. **Required.** |
| **Command surface (Copilot)** | `.github/` | Experimental GitHub Copilot adapter. **Optional.** |
| **Interaction runtime + MCP server** | `tools/chaos-interaction-*` | The file-backed decision/session store and the stdio **MCP server** that is the agent-facing API to it. **Required** for the governed decision flow. |
| **Decision Center** | `extensions/chaos-decision-center` | VS Code extension — the human-facing UI where you answer material decisions. **Recommended.** |
| **Runtime state + schemas** | `.chaos/interactions/` | Schemas/contracts (tracked) plus per-session state (created at runtime, git-ignored). |
| **Repo conventions** | `.chaos/config.yaml` | Stable paths, toolchain/validation commands, and policies every command inherits. |
| **MCP wiring** | `.mcp.json` and/or `.vscode/mcp.json` | Points your MCP client at the `chaos-interaction` server. |

The chat thread is **not** the source of truth — the interaction runtime is. The MCP
server is the agent-facing API to that runtime; the Decision Center is the human-facing UI.

---

## Prerequisites

| Tool | Version | Needed for |
|---|---|---|
| **Claude Code** | current | The first-class command surface. (Copilot is an experimental alternative.) |
| **Node.js** | **≥ 22.6.0** | The interaction runtime, MCP server, and Decision Center run TypeScript sources directly via Node's built-in type-stripping. |
| **npm** | bundled with Node | Installing/building the two local packages. |
| **git** | any recent | Repository context resolution and provenance. |
| **OpenSpec** | latest | The spec engine CHAOS wraps: `npm install -g @fission-ai/openspec@latest` |
| **VS Code** | ≥ 1.90 | Hosting the Decision Center UI. Optional but strongly recommended. |
| **.NET SDK** | as your project needs | Only if you use the C#/.NET implementation specialist or run the demo. |

Check the basics:

```bash
node --version      # must be >= 22.6.0
npm --version
git --version
openspec --version  # after the global install above
```

> `.chaos/config.yaml` also declares a general `toolchain.node.minimumVersion` of `20.19.0`
> for CHAOS in general, but the **interaction runtime and Decision Center specifically
> require Node ≥ 22.6.0**. When in doubt, use ≥ 22.6.0.

---

## Initialize the OpenSpec project

Installing the OpenSpec **CLI** (prerequisite above) is not the same as having an initialized
OpenSpec **project**. CHAOS wraps OpenSpec — a swappable spec-engine provider selected by
`project.specEngine` in `.chaos/config.yaml`: `chaos:propose` writes each change under
`openspec/changes/<id>/`, and the lifecycle commands read it back. A repo with the CLI but **no
`openspec/` directory** has nothing for the first `chaos:propose` to wrap.

**Scaffolding this is `chaos:init`'s job, not yours.** When you adopt CHAOS into your own repo
(Path B), `chaos:init` initializes the spec-engine project for you — it runs the engine's
`toolchain.<specEngine>.initCommand` (`openspec init`) when the project is missing. You do not run
`openspec init` by hand.

The one exception is **evaluating this repository (Path A)**: it is already CHAOS-initialized and
ships no `openspec/`, so to run a real `chaos:propose` here, scaffold the project once from the
repo root:

```bash
openspec init      # Path A only — or any repo where chaos:init was skipped
```

`chaos:doctor`'s `CD-RT-07` is the **safety net**: it WARNs when the project directory is absent
and points you at `chaos:init` (or `openspec init`). It is a warning, not a blocker — a fresh clone
is still `READY_WITH_WARNINGS`. You do **not** need any of this to read the [demo](demo/README.md),
which uses representative excerpts.

---

## Path A — Evaluate CHAOS in this repository

The fastest way to see CHAOS work end-to-end. You clone this repo, build the two local
packages, verify, and run the worked demo.

```bash
git clone <this-repo-url> chaos
cd chaos
```

**1. Install the interaction runtime (MCP server) dependencies.**

```bash
cd tools/chaos-interaction-mcp
npm install
npm run build        # OPTIONAL — only if you prefer the compiled dist entry
cd ../..
```

The committed `.mcp.json` points at the **source** entry
`tools/chaos-interaction-mcp/src/cli/chaos-interaction-mcp.ts`, which Node ≥ 22.6 runs directly —
so `npm install` alone is enough and **no build is required**. `npm run build` is optional (see
[Wiring the MCP server](#wiring-the-mcp-server) for the built-`dist` alternative).

**2. Build and install the Decision Center.**

```bash
cd extensions/chaos-decision-center
npm install
npm run build        # compiles the extension + runtime into dist/
cd ../..
```

Then open `extensions/chaos-decision-center` in VS Code and press **F5** to launch an
Extension Development Host, or package a VSIX for everyday use — see
[Installing the Decision Center](#installing-the-decision-center).

**3. Verify.** In Claude Code, from the repo root:

```text
chaos:doctor
```

Expect `READY` or `READY_WITH_WARNINGS`. Warnings about optional pieces (e.g. a missing
provider MCP, or `CD-RT-07` reminding you to run `openspec init` before your first real
`chaos:propose`) are fine.

**4. Run the demo.** Follow the worked, runnable walkthrough — one small change to a real
ASP.NET Core API, taken through `propose → review → apply → verify → archive → sync`:

- [`docs/demo/README.md`](demo/README.md) (starts from [`examples/task-tracker/dotnet/`](../examples/task-tracker/dotnet/README.md))

---

## Path B — Install CHAOS into your own repository

This is the real "add CHAOS to a repo that doesn't have it" path. Run everything from
**your** repository root.

### Step 1 — Copy the tooling

Copy these from the CHAOS repo into your repo, preserving paths:

```text
.claude/                     # REQUIRED — Claude Code command surface
tools/chaos-interaction-mcp/         # REQUIRED — MCP server (agent-facing runtime API)
tools/chaos-interaction-runtime/     # REQUIRED — file-backed runtime the server adapts
tools/chaos-interaction-diagnostics/ # recommended — runtime health diagnostics
tools/chaos-interaction-runner/      # optional  — headless live auto-resume runner
extensions/chaos-decision-center/    # RECOMMENDED — human-facing Decision Center UI
.chaos/interactions/         # REQUIRED — schemas/contracts the runtime validates against
.mcp.json                    # MCP wiring for Claude Code (build-free source path)
.vscode/mcp.json             # optional — VS Code native MCP wiring (source path, no build)
.github/                     # OPTIONAL — experimental Copilot adapter
```

Notes:

- Don't copy `node_modules/` or `dist/` — you rebuild those in Step 3. They are not
  tracked and are regenerated locally.
- Under `.chaos/interactions/`, only `schema/`, `contracts/`, and `README.md` are source.
  The runtime creates `active.json`, `index.json`, `locks.json`, `sessions/`,
  `decisions/`, `capsules/`, and `audit.jsonl` at runtime — leave those to be generated
  (they are git-ignored).
- The `.github/` Copilot adapter is a hand-maintained digest of the Claude surface and is
  **experimental** — it does not yet have full parity (e.g. no `chaos:doctor`). Skip it
  unless you actively use Copilot.

### Step 2 — Create `.chaos/config.yaml`

`.chaos/config.yaml` is the lightweight conventions file every command reads (paths,
toolchain/validation commands, and the hardening policies). Choose one of two ways to get
it in place:

**Option 1 — Start from the shipped config (fastest).** Copy this repo's
[`.chaos/config.yaml`](../.chaos/config.yaml) into your repo and edit the top `project:`
block for your stack:

```yaml
project:
  name: "your-project"
  type: dotnet          # your project type
  primaryLanguage: csharp
  specEngine: openspec
```

Keep the `policies.*`, `mcp*`, and `integrations.*` sections — later commands inherit them.
The shipped config is already GitHub-default (`integrations.repository.github.enabled: true`)
with Azure DevOps as an opt-in placeholder; adjust only if you need Azure DevOps.

**Option 2 — Generate it with `chaos:init` (guided).** If your repo already has code and
you want CHAOS to *discover your evidence and scaffold governance*, run `chaos:init`
instead of hand-writing config — it generates `.chaos/config.yaml` **plus** the governance
scaffolding (`constitution.md`, decision/rule/command indexes, a bootstrap report). This is
the bootstrapping step described in [Installation vs. `chaos:init`](#installation-vs-chaosinit);
you still complete Steps 3–5 below either way.

### Step 3 — Build the runtime and Decision Center

Same as Path A, steps 1–2:

```bash
# MCP server
cd tools/chaos-interaction-mcp && npm install && npm run build && cd -

# Decision Center
cd extensions/chaos-decision-center && npm install && npm run build && cd -
```

### Step 4 — Wire the MCP server and install the Decision Center

See [Wiring the MCP server](#wiring-the-mcp-server) and
[Installing the Decision Center](#installing-the-decision-center) below, then reload your
MCP client so the `chaos-interaction` server is picked up.

### Step 5 — Verify, then run your first command

```text
chaos:doctor        # verify local execution readiness (CD-RT-07 WARNs until the spec-engine project exists)
chaos:help          # list the available commands
```

Then run your first **governed** command — for a repo that needs governance scaffolding that's
`chaos:init`, which also **initializes the spec-engine project** (`openspec init`) for you as part
of bootstrapping, so you never run it by hand. To see the full lifecycle first, walk the
[demo](demo/README.md). See [Run your first command](#run-your-first-command).

---

## Wiring the MCP server

The `chaos-interaction` MCP server is how CHAOS commands create, inspect, and resume
decisions. There are two equivalent ways to point your client at it.

**Source (`.ts`) — no build step (what the committed `.mcp.json` and `.vscode/mcp.json` use).**
Node ≥ 22.6 strips the types and runs the TypeScript directly, so the server works after
`npm install` alone — no `npm run build`. This is the default because it removes the biggest
silent first-run failure: an unbuilt (or stale) `dist/` leaves MCP dead with no obvious error.

```json
{
  "mcpServers": {
    "chaos-interaction": {
      "command": "node",
      "args": [
        "tools/chaos-interaction-mcp/src/cli/chaos-interaction-mcp.ts",
        "--repo-root", ".",
        "--root", ".chaos/interactions",
        "--schema-dir", ".chaos/interactions/schema"
      ]
    }
  }
}
```

**Built (`dist`) — optional, requires `npm run build`.** A compiled entry starts marginally
faster and does not depend on Node's type-stripping. If you prefer it, run Step 3's build and
point `.mcp.json` at the `dist` path instead:

```json
"args": [
  "tools/chaos-interaction-mcp/dist/chaos-interaction-mcp/src/cli/chaos-interaction-mcp.js",
  "--repo-root", ".",
  "--root", ".chaos/interactions",
  "--schema-dir", ".chaos/interactions/schema"
]
```

Either way, `chaos:doctor`'s `CD-MCP-03` check surfaces it loudly (a WARN with the exact
remediation command) if the wired entry is missing or the server package's `node_modules` is
not installed — so a dead MCP wiring is never silent.

All paths are repo-root-relative — **don't commit absolute machine paths.** All server
logging goes to stderr; stdout is reserved for the MCP protocol. After editing MCP config,
**reload your MCP client** (restart Claude Code / reload the VS Code window). Confirm the
`chaos-interaction` server and its `chaos_*` tools are listed.

---

## Installing the Decision Center

The Decision Center is the VS Code panel where you answer material decisions. It reads and
writes the same `.chaos/interactions/` state as the MCP server and **does not require the
MCP server to be running**.

**For evaluation — Extension Development Host.** Open `extensions/chaos-decision-center` in
VS Code and press **F5** (or run the *Run Extension* launch config). The compiled entry
`dist/extensions/chaos-decision-center/src/extension.js` is already referenced by `main`,
so build it first (Step 3).

**For everyday use — package and install a VSIX.** From the repo root:

```bash
cd extensions/chaos-decision-center
npm ci
npm run build
npx @vscode/vsce package --allow-missing-repository --no-dependencies \
    --baseContentUrl https://local.invalid --baseImagesUrl https://local.invalid
```

On Windows this exact sequence is scripted as
[`build-decision-center-vsix.ps1`](../build-decision-center-vsix.ps1). Install the resulting
`chaos-decision-center-<version>.vsix` via VS Code → *Extensions* → *Install from VSIX…*.

Once running, a status bar item shows `CHAOS: Ready` / `CHAOS: N decisions pending` /
`CHAOS: runtime unavailable`. Set `chaosDecisionCenter.userName` (default `vscode-user`) —
it is recorded as `selectedBy` on your decisions; avoid using an email address.

---

## Verify your setup

Run **`chaos:doctor`** from the repo root. It is the local **execution-readiness**
diagnostic — it checks git, provider/repo context, OpenSpec, build/test commands, MCP and
Decision Center package presence, hooks, and the interaction-runtime health, then writes
`.chaos/doctor/doctor-report-YYYY-MM-DD.md`. It is read-only by default.

| Verdict | Meaning |
|---|---|
| `READY` | Everything the current mode needs is present. |
| `READY_WITH_WARNINGS` | Usable; optional pieces (e.g. a provider MCP) are missing. Fine for getting started. |
| `NOT_READY` / `BLOCKED` | A required tool or wiring is missing — see the report's remediation section. |

> `chaos:doctor` (execution readiness) is distinct from `chaos:status` (governance/workspace
> health — "are the `.chaos` artifacts coherent?"). At install time you want `chaos:doctor`.

---

## Run your first command

```text
chaos:help          # discover the command set
chaos:doctor        # confirm you're ready
```

From there, pick the path that matches your goal:

- **See the whole lifecycle first:** walk the runnable [demo](demo/README.md) — a real
  change through `propose → review → apply → verify → archive → sync`.
- **Bootstrap governance for your repo:** run `chaos:init` (discovers your evidence,
  generates the constitution/config/indexes).
- **Govern a real change now:** run `chaos:propose "<your small change>"`. When it hits a
  decision only a human should make, it stops and surfaces it in the Decision Center — you
  answer there, and the command continues.

---

## Installation vs. `chaos:init`

These are different problems, and CHAOS keeps them separate on purpose.

| | **Installing CHAOS** (this guide) | **`chaos:init`** |
|---|---|---|
| **Question it answers** | "How do I get the CHAOS *tooling* into a repo and running?" | "How do I get *governance content* for a repo that already has code?" |
| **What it touches** | `.claude/`, `.github/`, `tools/`, `extensions/`, `.mcp.json`, and a starter `.chaos/config.yaml` | Generates `.chaos/config.yaml`, `constitution.md`, `context.md`, `architecture.md`, and the decision/rule/command/gate indexes + a bootstrap report |
| **How you do it** | Copy folders, `npm install`/`npm run build`, wire MCP, install the Decision Center | Run the `chaos:init` command; it discovers evidence and asks high-impact decisions one at a time |
| **When** | Once, to adopt the tool | After install, on a repo that needs its governance scaffolded |

Installing is the **prerequisite**; `chaos:init` is typically the **first governed command**
you run afterward. `chaos:init` bootstraps *governance for existing code* — it does **not**
copy the tooling or build the runtime, which is exactly what this guide covers.

---

## Troubleshooting

- **MCP tools (`chaos_*`) don't appear.** Confirm Node ≥ 22.6, that you ran `npm install` in
  `tools/chaos-interaction-mcp` (the committed `.mcp.json` uses the build-free `.ts` source path,
  so no `npm run build` is needed — but the dependencies must be installed), and that you
  reloaded the MCP client. `chaos:doctor`'s `CD-MCP-03` names the exact fix if the wiring can't
  resolve. If you switched `.mcp.json` to the `dist` path, also run `npm run build`.
- **Decision Center shows `CHAOS: runtime unavailable`.** Check the `chaosDecisionCenter.interactionsRoot`
  (default `.chaos/interactions`) and `schemaDir` settings resolve to the copied
  `.chaos/interactions/` folder, and that you built the extension (Step 3).
- **`openspec: command not found`.** Install the CLI globally:
  `npm install -g @fission-ai/openspec@latest`.
- **`chaos:propose` fails with no OpenSpec project / `openspec/` is missing.** The CLI is
  installed but the project was never initialized. `chaos:init` scaffolds it for you in your own
  repo; when evaluating this repo (Path A) or if init was skipped, run `openspec init` from the
  repo root once (see [Initialize the OpenSpec project](#initialize-the-openspec-project)).
  `chaos:doctor`'s `CD-RT-07` also flags this and points at `chaos:init`.
- **A hook "silently does nothing" (no `.chaos/runtime/*` updates).** The `command` interpreter
  (`py -3` in the committed `.claude/settings.json`) isn't resolving — a common Windows
  Store-stub / broken-launcher issue, or a non-Windows machine where `py` doesn't exist. Set
  `command` to whatever `python3 --version` / `python --version` / `py -3 --version` actually
  runs. `chaos:doctor`'s `CD-HOOK-05` executes the wired interpreter and WARNs loudly when it
  fails; see `.claude/hooks/README.md` troubleshooting.
- **A command stops and "waits on a decision."** That's expected — answer it in the Decision
  Center, or copy the `chaos:resume --run <run-id>` instruction it printed. Decisions never
  get answered from chat.

---

## Where to go next

- **Worked end-to-end example:** [`docs/demo/README.md`](demo/README.md)
- **The runnable demo project:** [`examples/task-tracker/dotnet/`](../examples/task-tracker/dotnet/README.md)
- **What CHAOS is and who it's for:** [`README.md`](../README.md)
- **Where this is going:** [project roadmap](../.chaos/roadmap/roadmap.md)
