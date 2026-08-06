#!/usr/bin/env node
/**
 * Builds the distributable Claude Code plugin at plugins/chaos/ from the
 * repository's own .claude/ surface (single source of truth).
 *
 * The generated plugin is COMMITTED (marketplace installs fetch it from git);
 * this script keeps it in sync. CI runs `--check` to fail on drift.
 *
 *   node scripts/build-plugin.mjs          # regenerate plugins/chaos/
 *   node scripts/build-plugin.mjs --check  # verify committed output is current
 *
 * What ships: the 5 chaos commands (renamed so installs expose /chaos:run,
 * /chaos:init, ...), the opsx commands, all skills, all agents, the MCP server
 * wiring (npx against the published npm package), and the plugin manifest.
 * What does NOT ship: hooks (Python, opt-in by doctrine — plugin hooks would
 * auto-enable on install), project settings, caches.
 *
 * Version source of truth: tools/chaos-interaction-mcp/package.json (lockstep).
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const claudeDir = path.join(repoRoot, ".claude");
const targetDir = path.join(repoRoot, "plugins", "chaos");

const VERSION = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "tools", "chaos-interaction-mcp", "package.json"), "utf8"),
).version;

/** Rewrites repo-checkout paths to plugin-root paths in shipped markdown. */
function rewritePaths(content) {
  return content
    .replaceAll(".claude/commands/opsx/", "${CLAUDE_PLUGIN_ROOT}/commands/opsx/")
    .replaceAll(".claude/commands/chaos-", "${CLAUDE_PLUGIN_ROOT}/commands/")
    .replaceAll(".claude/skills/", "${CLAUDE_PLUGIN_ROOT}/skills/")
    .replaceAll(".claude/agents/", "${CLAUDE_PLUGIN_ROOT}/agents/");
  // .claude/hooks/ references are intentionally NOT rewritten: hooks are an
  // opt-in copied into the user's own .claude/hooks, where those paths resolve.
}

function copyMarkdownTree(sourceDir, destDir, transform) {
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (entry.name === "__pycache__") continue;
    const from = path.join(sourceDir, entry.name);
    const to = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(to, { recursive: true });
      copyMarkdownTree(from, to, transform);
    } else {
      fs.mkdirSync(destDir, { recursive: true });
      const raw = fs.readFileSync(from, "utf8");
      fs.writeFileSync(to, transform ? transform(raw) : raw, "utf8");
    }
  }
}

function buildInto(outDir) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  // Commands: chaos-<name>.md -> commands/<name>.md so installs expose /chaos:<name>.
  const commandsDir = path.join(outDir, "commands");
  fs.mkdirSync(commandsDir, { recursive: true });
  for (const file of fs.readdirSync(path.join(claudeDir, "commands"))) {
    const from = path.join(claudeDir, "commands", file);
    if (fs.statSync(from).isDirectory()) continue; // opsx handled below
    if (!file.startsWith("chaos-") || !file.endsWith(".md")) continue;
    const renamed = file.replace(/^chaos-/, "");
    fs.writeFileSync(
      path.join(commandsDir, renamed),
      rewritePaths(fs.readFileSync(from, "utf8")),
      "utf8",
    );
  }
  copyMarkdownTree(
    path.join(claudeDir, "commands", "opsx"),
    path.join(commandsDir, "opsx"),
    rewritePaths,
  );

  copyMarkdownTree(path.join(claudeDir, "skills"), path.join(outDir, "skills"), rewritePaths);
  copyMarkdownTree(path.join(claudeDir, "agents"), path.join(outDir, "agents"), rewritePaths);

  // MCP wiring: the published npm bundle via npx (L1 of the install ladder).
  const mcp = {
    mcpServers: {
      "chaos-interaction": {
        command: "npx",
        args: [
          "-y",
          "@ferrexd/chaos-interaction-mcp",
          "--repo-root",
          "${CLAUDE_PROJECT_DIR}",
          "--log-level",
          "error",
        ],
      },
    },
  };
  fs.writeFileSync(path.join(outDir, ".mcp.json"), `${JSON.stringify(mcp, null, 2)}\n`, "utf8");

  const manifest = {
    name: "chaos",
    displayName: "CHAOS",
    version: VERSION,
    description:
      "One forced pre-code stop with durable decision state, honest verification, and a decision record future stops check against.",
    author: { name: "Pablo Ferreira", url: "https://github.com/ferreXD" },
    homepage: "https://github.com/ferreXD/CHAOS",
    repository: "https://github.com/ferreXD/CHAOS",
    license: "MIT",
    keywords: ["governance", "decision-record", "workflow", "agent-discipline"],
  };
  const manifestDir = path.join(outDir, ".claude-plugin");
  fs.mkdirSync(manifestDir, { recursive: true });
  fs.writeFileSync(
    path.join(manifestDir, "plugin.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  fs.writeFileSync(
    path.join(outDir, "README.md"),
    `# CHAOS plugin

GENERATED — do not edit. Source of truth is the repository's \`.claude/\` surface;
regenerate with \`node scripts/build-plugin.mjs\`.

Install:

\`\`\`text
/plugin marketplace add ferreXD/CHAOS
/plugin install chaos
\`\`\`

Commands land namespaced: \`/chaos:init\`, \`/chaos:run\`, \`/chaos:resume\`,
\`/chaos:doctor\`, \`/chaos:help\`. The MCP server (durable decisions) is wired
automatically via \`npx -y @ferrexd/chaos-interaction-mcp\`; without Node the
stop degrades to chat-interactive and the decision record is still written.

Hooks are NOT shipped in the plugin (they auto-enable on install and require
Python). To adopt them, copy \`.claude/hooks/\` from the repository — see
https://github.com/ferreXD/CHAOS/tree/main/.claude/hooks
`,
    "utf8",
  );
}

function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, base));
    else out.push(path.relative(base, full).replaceAll("\\", "/"));
  }
  return out.sort();
}

const checkMode = process.argv.includes("--check");

if (!checkMode) {
  buildInto(targetDir);
  console.log(
    `Built plugins/chaos (v${VERSION}): ${listFiles(targetDir).length} files.`,
  );
} else {
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), "chaos-plugin-check-"));
  buildInto(staging);
  const expected = listFiles(staging);
  const actual = fs.existsSync(targetDir) ? listFiles(targetDir) : [];
  const drift = [];
  const normalized = (file) => fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n");
  for (const f of expected) {
    if (!actual.includes(f)) drift.push(`missing: ${f}`);
    else if (normalized(path.join(staging, f)) !== normalized(path.join(targetDir, f))) {
      drift.push(`stale: ${f}`);
    }
  }
  for (const f of actual) if (!expected.includes(f)) drift.push(`orphaned: ${f}`);
  fs.rmSync(staging, { recursive: true, force: true });
  if (drift.length > 0) {
    console.error(
      `plugins/chaos is out of sync with .claude/ (${drift.length} files):\n  ${drift.join("\n  ")}\n` +
        "Run: node scripts/build-plugin.mjs",
    );
    process.exit(1);
  }
  console.log(`plugins/chaos is in sync (v${VERSION}, ${expected.length} files).`);
}
