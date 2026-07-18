# Contributing to CHAOS

Thanks for your interest in CHAOS. It's an **experimental, public-alpha** project, so the
packaging and process are still evolving — expect some rough edges, and don't be shy about
pointing them out.

**Contributing to CHAOS is a normal pull-request workflow.** CHAOS is a governance workflow you
apply to *your own* projects — you do **not** need to run the CHAOS lifecycle
(`chaos:propose`/`review`/`apply`/…) on your changes to this repository. Open an issue, make your
change on a branch, and send a PR, like any other open-source project.

New here? The [5-minute overview](docs/overview.md) explains what CHAOS is, and the
[installation & onboarding guide](docs/installation.md) gets you a working setup.

> **Be respectful.** Assume good faith, keep discussion constructive, and focus on the work.
> This project has a [Code of Conduct](CODE_OF_CONDUCT.md) (Contributor Covenant) — by
> participating, you agree to uphold it.

---

## Ways to contribute

- **Report a bug or gap** — open an issue with the **Bug report** template; it prompts for what
  you did, what you expected, what happened, and your environment (OS, Node version,
  Claude Code vs. Copilot).
- **Suggest an idea** — open an issue with the **Change proposal / idea** template, describing the
  problem before the solution.
- **Improve docs** — docs live in [`docs/`](docs/) and the various `README.md` files; small doc
  fixes are always welcome.
- **Contribute code** — see the workflow below.

---

## Development setup

Follow [Path A of the installation guide](docs/installation.md#path-a--evaluate-chaos-in-this-repository).
In short:

- **Node.js ≥ 22.6** and **npm**, **git**, and **OpenSpec**
  (`npm install -g @fission-ai/openspec@latest`).
- Build the interaction runtime: `cd tools/chaos-interaction-mcp && npm install && npm run build`.
- Build the Decision Center: `cd extensions/chaos-decision-center && npm install && npm run build`.
- **.NET SDK** if you touch the C#/.NET example or specialist.

Run `chaos:doctor` to confirm your environment is ready. Much of CHAOS is command/skill content
under `.claude/` (and its `.github/` mirror) — if you change a command or skill, exercise it by
running it (the [demo](docs/demo/README.md) is a good end-to-end harness).

---

## Run the checks before you push

Match what a reviewer will run. From the repo root:

```bash
# Interaction runtime / MCP server
cd tools/chaos-interaction-mcp && npm test && npm run typecheck && cd -

# Decision Center extension
cd extensions/chaos-decision-center && npm test && npm run typecheck && cd -

# Runnable demo project (if you touched it)
cd examples/task-tracker/dotnet && dotnet build && dotnet test && cd -
```

---

## Repository conventions

A few repo-hygiene rules keep pull requests easy to merge:

- **Never commit runtime state or secrets.** `.chaos/runtime/` and the per-session files under
  `.chaos/interactions/` are git-ignored on purpose — don't force them in. Never put secrets,
  tokens, or connection strings in config or artifacts.
- **Keep the tooling sanitized.** No private or project-specific data, and no personal
  identifiers, in the generic tooling layer (`.claude/`, `.github/`, `tools/`, `extensions/`).
- **Leave `README.md` and `AGENTS.md` to the maintainers.** These are maintained through the
  project's own tooling; if your change needs them updated, mention it in the PR rather than
  editing them directly, to avoid conflicts.

---

## Pull request expectations

- **One focused change per PR.** Branch off the default branch (`main`).
- **Explain what and why.** Link the issue it addresses.
- **Include tests for behavioural changes**, and keep the build, tests, and typecheck green.
- **Keep it sanitized** (see conventions above).
- **Expect review** and please be responsive to feedback.

---

## Licensing

By contributing, you agree that your contributions are licensed under the project's
[MIT License](LICENSE), the same terms as the rest of the repository.

---

## Where to ask

Open an issue for questions, bugs, or proposals. For context on where the project is headed, see
the [roadmap](.chaos/roadmap/roadmap.md). Thanks for helping CHAOS grow up.
