/** Auto-resume feature-gate tests (config.yaml parsing + adapter permission). */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  parseAutoResumeGate,
  readAutoResumeGate,
  claudeAdapterAllowed,
} from "../src/config/featureGate.ts";

const ENABLED_YAML = `policies:
  interactionRuntime:
    autoResume:
      # comment line inside the block
      enabled: true
      adapter: claude-code
    diagnostics:
      enabled: true
`;

const DISABLED_YAML = `policies:
  interactionRuntime:
    autoResume:
      enabled: false
      adapter: none
`;

test("parses an enabled claude-code gate", () => {
  const g = parseAutoResumeGate(ENABLED_YAML);
  assert.equal(g.enabled, true);
  assert.equal(g.adapter, "claude-code");
  assert.equal(g.present, true);
});

test("parses a disabled gate and stops at the block dedent", () => {
  const g = parseAutoResumeGate(DISABLED_YAML);
  assert.equal(g.enabled, false);
  assert.equal(g.adapter, "none");
  // The sibling `diagnostics.enabled: true` must NOT leak into autoResume.enabled.
  const withSibling = parseAutoResumeGate(ENABLED_YAML.replace("enabled: true\n      adapter", "enabled: false\n      adapter"));
  assert.equal(withSibling.enabled, false);
});

test("missing autoResume block yields safe defaults", () => {
  const g = parseAutoResumeGate("policies:\n  interactionRuntime:\n    diagnostics:\n      enabled: true\n");
  assert.equal(g.present, false);
  assert.equal(g.enabled, false);
  assert.equal(g.adapter, "none");
});

test("claudeAdapterAllowed enforces both enabled and adapter", () => {
  assert.equal(claudeAdapterAllowed({ enabled: true, adapter: "claude-code", present: true, configPath: "x" }).allowed, true);
  assert.equal(claudeAdapterAllowed({ enabled: false, adapter: "claude-code", present: true, configPath: "x" }).allowed, false);
  assert.equal(claudeAdapterAllowed({ enabled: true, adapter: "none", present: true, configPath: "x" }).allowed, false);
});

test("readAutoResumeGate reads a real config file; missing file is safe", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "chaos-gate-"));
  try {
    // No config file yet → safe defaults, not present.
    const missing = readAutoResumeGate(dir);
    assert.equal(missing.present, false);
    assert.equal(missing.enabled, false);

    fs.mkdirSync(path.join(dir, ".chaos"), { recursive: true });
    fs.writeFileSync(path.join(dir, ".chaos", "config.yaml"), ENABLED_YAML, "utf8");
    const present = readAutoResumeGate(dir);
    assert.equal(present.enabled, true);
    assert.equal(present.adapter, "claude-code");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
