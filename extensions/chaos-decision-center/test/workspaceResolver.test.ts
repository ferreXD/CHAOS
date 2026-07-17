/** Path resolution tests (case 12). */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as path from "node:path";
import { resolveInteractionPaths, findInteractionPaths } from "../src/runtime/workspaceResolver.ts";
import { resolveConfig, DEFAULT_CONFIG } from "../src/config/extensionConfig.ts";

test("12. resolves relative config paths against the workspace folder", () => {
  const ws = path.resolve("/repo/project");
  const resolved = resolveInteractionPaths(ws, ".chaos/interactions", ".chaos/interactions/schema");
  assert.equal(resolved.root, path.resolve(ws, ".chaos/interactions"));
  assert.equal(resolved.schemaDir, path.resolve(ws, ".chaos/interactions/schema"));
});

test("12. absolute config paths are used verbatim", () => {
  const abs = path.resolve("/somewhere/interactions");
  const absSchema = path.resolve("/somewhere/schema");
  const resolved = resolveInteractionPaths("/repo", abs, absSchema);
  assert.equal(resolved.root, abs);
  assert.equal(resolved.schemaDir, absSchema);
});

test("12. falls back to process.cwd when no workspace folder", () => {
  const resolved = resolveInteractionPaths(undefined, ".chaos/interactions", "s");
  assert.equal(resolved.root, path.resolve(process.cwd(), ".chaos/interactions"));
});

test("findInteractionPaths walks up ancestors to locate .chaos/interactions", () => {
  const repo = path.resolve("/repo");
  const sub = path.resolve("/repo/extensions/chaos-decision-center");
  const existing = path.resolve(repo, ".chaos/interactions");
  const exists = (p: string) => p === existing;

  // Opened a sub-folder: resolution finds the repo-root interactions dir.
  const found = findInteractionPaths(sub, ".chaos/interactions", ".chaos/interactions/schema", exists);
  assert.equal(found.root, existing);
  assert.equal(found.schemaDir, path.resolve(repo, ".chaos/interactions/schema"));
});

test("findInteractionPaths falls back to the workspace candidate when nothing exists", () => {
  const ws = path.resolve("/nowhere");
  const found = findInteractionPaths(ws, ".chaos/interactions", ".chaos/interactions/schema", () => false);
  assert.equal(found.root, path.resolve(ws, ".chaos/interactions"));
});

test("findInteractionPaths respects an absolute interactionsRoot", () => {
  const abs = path.resolve("/somewhere/interactions");
  const found = findInteractionPaths("/repo", abs, "/somewhere/schema", () => true);
  assert.equal(found.root, abs);
});

test("resolveConfig applies defaults and validates enum/number fields", () => {
  assert.deepEqual(resolveConfig(), DEFAULT_CONFIG);
  const merged = resolveConfig({ afterSubmit: "closePanel" as any, maxHistoryItems: 5, userName: "  " });
  assert.equal(merged.afterSubmit, "closePanel");
  assert.equal(merged.maxHistoryItems, 5);
  assert.equal(merged.userName, "vscode-user"); // blank -> default, never email
  // Invalid enum falls back.
  assert.equal(resolveConfig({ afterSubmit: "bogus" as any }).afterSubmit, "switchToDashboard");
  // Negative number falls back.
  assert.equal(resolveConfig({ pollingFallbackMs: -1 }).pollingFallbackMs, DEFAULT_CONFIG.pollingFallbackMs);
});
