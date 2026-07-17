/**
 * Static validation of Iteration 7 docs/integration (command static tests).
 *
 * Guards the read-only / no-destructive-repair posture and the doctor/status
 * integration language.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";

const PKG = path.resolve(import.meta.dirname, "..");
const REPO = path.resolve(PKG, "../..");
const read = (p: string) => fs.readFileSync(p, "utf8");
const exists = (p: string) => fs.existsSync(p);

test("package artifacts exist", () => {
  for (const rel of ["README.md", "PATCH-SUMMARY.md", "package.json"]) {
    assert.ok(exists(path.join(PKG, rel)), `missing ${rel}`);
  }
});

test("README states read-only + no destructive repair", () => {
  const readme = read(path.join(PKG, "README.md")).toLowerCase();
  assert.ok(readme.includes("read-only"));
  assert.ok(readme.includes("no destructive repair"));
  assert.ok(readme.includes("advisory"));
  assert.ok(readme.includes("todo candidate"));
});

test("chaos:doctor skill includes an Interaction Runtime section + read-only language", () => {
  const doctor = read(path.join(REPO, ".claude/skills/chaos-doctor/SKILL.md"));
  assert.ok(/##\s+Interaction Runtime health/.test(doctor));
  const lower = doctor.toLowerCase();
  assert.ok(lower.includes("read-only"));
  assert.ok(lower.includes("no auto-repair"));
  assert.ok(lower.includes("todo candidate"));
});

test("chaos:status skill includes a compact Interaction Runtime summary", () => {
  const status = read(path.join(REPO, ".claude/skills/chaos-status/SKILL.md"));
  assert.ok(/##\s+Interaction Runtime summary/.test(status));
  assert.ok(status.toLowerCase().includes("compact"));
  assert.ok(status.toLowerCase().includes("read-only"));
});

test("config declares additive interactionRuntime diagnostics + advisory enforcement", () => {
  const cfg = read(path.join(REPO, ".chaos/config.yaml"));
  assert.ok(cfg.includes("interactionRuntime:"));
  assert.ok(cfg.includes("mode: advisory"));
  assert.ok(cfg.includes("staleLockAgeHours"));
});

test("violations reuse the existing hook-violations stream (no duplicate)", () => {
  const patch = read(path.join(PKG, "PATCH-SUMMARY.md"));
  assert.ok(/hook-violations\.jsonl/.test(patch));
  assert.ok(/no production application source|production code changed:\*\* no/i.test(patch));
});
