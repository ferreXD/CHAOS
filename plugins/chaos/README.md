# CHAOS plugin

GENERATED — do not edit. Source of truth is the repository's `.claude/` surface;
regenerate with `node scripts/build-plugin.mjs`.

Install:

```text
/plugin marketplace add ferreXD/CHAOS
/plugin install chaos
```

Commands land namespaced: `/chaos:init`, `/chaos:run`, `/chaos:resume`,
`/chaos:doctor`, `/chaos:help`. The MCP server (durable decisions) is wired
automatically via `npx -y @ferrexd/chaos-interaction-mcp`; without Node the
stop degrades to chat-interactive and the decision record is still written.

Hooks are NOT shipped in the plugin (they auto-enable on install and require
Python). To adopt them, copy `.claude/hooks/` from the repository — see
https://github.com/ferreXD/CHAOS/tree/main/.claude/hooks
