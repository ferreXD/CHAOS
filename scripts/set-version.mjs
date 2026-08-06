#!/usr/bin/env node
/**
 * Lockstep version management. ONE version identity across every artifact a
 * user can hold: npm package, VS Code extension, Claude Code plugin,
 * marketplace metadata, and the MCP server's self-reported version.
 *
 *   node scripts/set-version.mjs 0.3.0    # stamp everywhere + regenerate plugin
 *   node scripts/set-version.mjs --check  # verify lockstep (CI); prints version
 *
 * The git tag (vX.Y.Z) is cut by the operator; the release workflow refuses a
 * tag that does not match the stamped version.
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const MCP_PKG = "tools/chaos-interaction-mcp/package.json";
const EXT_PKG = "extensions/chaos-decision-center/package.json";
const SERVER_TS = "tools/chaos-interaction-mcp/src/server.ts";
const PLUGIN_MANIFEST = "plugins/chaos/.claude-plugin/plugin.json";
const MARKETPLACE = ".claude-plugin/marketplace.json";

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(repoRoot, rel), "utf8"));
const serverVersion = () => {
  const match = fs
    .readFileSync(path.join(repoRoot, SERVER_TS), "utf8")
    .match(/SERVER_VERSION = "([^"]+)"/);
  return match?.[1];
};

const arg = process.argv[2];

if (arg === "--check" || arg === undefined) {
  const versions = {
    [MCP_PKG]: readJson(MCP_PKG).version,
    [EXT_PKG]: readJson(EXT_PKG).version,
    [SERVER_TS]: serverVersion(),
    [PLUGIN_MANIFEST]: readJson(PLUGIN_MANIFEST).version,
    [`${MARKETPLACE} (metadata)`]: readJson(MARKETPLACE).metadata?.version,
  };
  const unique = [...new Set(Object.values(versions))];
  if (unique.length !== 1 || unique[0] === undefined) {
    console.error("Version lockstep BROKEN:");
    for (const [file, v] of Object.entries(versions)) console.error(`  ${v ?? "??"}  ${file}`);
    process.exit(1);
  }
  console.log(unique[0]);
  process.exit(0);
}

if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(arg)) {
  console.error(`Not a semver version: ${arg}`);
  process.exit(1);
}

const stampJson = (rel, mutate) => {
  const file = path.join(repoRoot, rel);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  mutate(data);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
};

stampJson(MCP_PKG, (d) => (d.version = arg));
stampJson(EXT_PKG, (d) => (d.version = arg));
stampJson(MARKETPLACE, (d) => (d.metadata.version = arg));
fs.writeFileSync(
  path.join(repoRoot, SERVER_TS),
  fs
    .readFileSync(path.join(repoRoot, SERVER_TS), "utf8")
    .replace(/SERVER_VERSION = "[^"]+"/, `SERVER_VERSION = "${arg}"`),
  "utf8",
);

// Sync lockfiles and regenerate the plugin (its manifest reads the npm version).
for (const dir of ["tools/chaos-interaction-mcp", "extensions/chaos-decision-center"]) {
  execSync("npm install --package-lock-only --no-audit --no-fund", {
    cwd: path.join(repoRoot, dir),
    stdio: "inherit",
  });
}
execSync("node scripts/build-plugin.mjs", { cwd: repoRoot, stdio: "inherit" });

console.log(`Stamped ${arg} across npm package, extension, server, plugin, marketplace.`);
