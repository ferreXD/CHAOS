# Quickstart — from zero to your first recorded stop

CHAOS installs as a ladder. Every level is useful on its own; each next level upgrades
ergonomics, never gates the loop. You need [Claude Code](https://claude.com/claude-code)
(CLI, desktop, or the VS Code extension) — that's the only hard requirement.

> Time-to-first-stop is the number this guide is accountable to. It is measured per
> release on a machine that has never seen this repo (see the release checklist in
> [docs/design/2026-08-06-distribution-surface.md](design/2026-08-06-distribution-surface.md));
> the measured number will be printed here when the first packaged release ships.

## L0 — the plugin (the whole discipline)

In Claude Code:

```text
/plugin marketplace add ferreXD/CHAOS
/plugin install chaos
```

That's the install. You now have:

- `/chaos:init` — one-time bootstrap: `AGENTS.md` + the `.chaos/` workspace
  (architecture notes, decision records, config).
- `/chaos:run "<change intent>"` — the core loop: targeted read → **one pre-code stop**
  → build → honest verify → a decision record in `.chaos/decisions/`.
- `/chaos:resume`, `/chaos:doctor`, `/chaos:help`.

Run `/chaos:init` once in your repository, then:

```text
/chaos:run "add rate limiting to the public API"
```

The agent reads what the change touches, then **stops** — every open question, doubt,
and architecture crossing folded into a single decision with real options — and waits
for you. If the runtime isn't available (no Node), the stop happens right in chat and
the decision record is still written when the change ships. The record is the point:
next month's stop checks new changes against what you decided today.

## L1 — the durable runtime (free if you have Node)

Nothing to do: the plugin wires the `chaos-interaction` MCP server via
`npx -y @ferrexd-chaos/interaction-mcp`. If Node **≥ 20.19** is on your PATH, you're
already here. This upgrades the stop from chat-interactive to **durable**:

- decisions, sessions, and locks live as files under `.chaos/interactions/` —
  the chat thread is never the source of truth;
- an interrupted run resumes with `/chaos:resume` from a capsule, not from chat memory;
- the change is locked while a decision is pending.

Check where you stand at any time:

```text
/chaos:doctor
```

It reports your ladder level and the one command that reaches the next.

## L2 — the Decision Center panel (~3 minutes)

Install **CHAOS Decision Center** from the VS Code Marketplace (publisher `ferreXD`) —
or grab the `.vsix` from a [release](https://github.com/ferreXD/CHAOS/releases) for
air-gapped machines and non-Marketplace editors.

When a run stops, the panel notifies you, shows the decision with its options and
recommendation, and writes your validated answer back to the runtime — one click,
optional rationale. A status-bar item shows `CHAOS: N decisions pending`.

## What lands in your repository

`/chaos:init` creates exactly: `AGENTS.md`, `.chaos/config.yaml`,
`.chaos/bootstrap-report.md`, `.chaos/context.md`, `.chaos/architecture.md`,
`.chaos/decisions/index.md` — plus gitignored runtime state. Nothing else. Everything
is yours: plugin updates never touch workspace files (re-running `/chaos:init` is the
migration tool, and it asks before changing anything that exists).

Optional extras, deliberately not in the plugin: the observability **hooks**
(Python-based; copy [`.claude/hooks/`](../.claude/hooks/) if you want them).

## Is it worth a stop per change?

That question has a measured answer with honest caveats — see
[docs/evidence.md](evidence.md), including the rival-hypothesis kit you can run
against CHAOS in your own repo.
