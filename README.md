n# Task Tracker — the CHAOS demo repository

A small, **runnable** ASP.NET Core Minimal API (`net8.0`) that exists for one purpose: to be
a realistic subject for [CHAOS](https://github.com/ferreXD/CHAOS) — a thin discipline for
AI-assisted changes, where every change passes through one forced pre-code stop, honest
verification, and a decision record.

> **This branch is the demo, not the toolkit.** The CHAOS machinery is no longer vendored
> here — it installs as a Claude Code plugin. What remains in this repository is the app,
> its `.chaos/` workspace, and the recorded decisions that make the loop demonstrable.

## Try it

1. **Install the plugin** (in Claude Code):

   ```text
   /plugin marketplace add ferreXD/CHAOS
   /plugin install chaos
   ```

2. **Clone this branch and open it:**

   ```bash
   git clone -b demo/dotnet https://github.com/ferreXD/CHAOS.git task-tracker-demo
   cd task-tracker-demo
   dotnet test TaskTracker.sln     # green baseline before you start
   ```

3. **Run a governed change:**

   ```text
   /chaos:run "add an optional ?status= filter to GET /tasks"
   ```

   The agent reads the terrain, then **stops** with every open question and crossing folded
   into a single decision. You answer (in the VS Code Decision Center, or in chat), it
   builds, verifies honestly, and writes a record to `.chaos/decisions/`.

The [guided walkthrough](docs/demo/README.md) narrates that loop end to end, including the
decision that makes it worth doing.

## What's in here

| Path | What |
|---|---|
| `src/TaskTracker.Api/` | the API: in-memory CRUD over tasks, `GET /tasks` with filters |
| `tests/TaskTracker.Tests/` | the test suite — the baseline every governed change must keep green |
| `.chaos/` | the CHAOS workspace: context, architecture posture, decision records |
| `docs/adr/` | architecture decision records (the postures a future stop checks against) |
| `docs/demo/README.md` | the guided walkthrough |
| `openspec/` | the spec engine's project — specs and changes for gated work |

## Why the decisions matter more than the code

The change in the walkthrough is about a dozen lines of LINQ. The point is the
**decision**: *what should happen when a client sends an invalid filter value?* — surfaced
before code was written, answered by a human, recorded in
[`.chaos/decisions/`](.chaos/decisions/index.md), and available to catch a future change
that contradicts it. That trail is what CHAOS is for; the API is just something real to
have opinions about.

## Requirements

- **.NET SDK 8.0+** — to build and test the API.
- **Claude Code** with the CHAOS plugin — to run the governed loop.
- Node.js ≥ 20.19 (optional) — the plugin uses it to launch the durable decision runtime;
  without it the stop still happens in chat and the record is still written.

## License

See [LICENSE](LICENSE). The `task-tracker` domain is fictional and contains no private data.
