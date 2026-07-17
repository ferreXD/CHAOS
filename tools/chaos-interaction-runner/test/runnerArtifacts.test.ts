/**
 * Static validation of the Iteration 5 docs/artifacts.
 *
 * Guards against over-claiming: the runner must not claim to control arbitrary
 * chat threads or to auto-resume after runner death, and must document the
 * live-only auto-resume + chaos:resume fallback.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";

const PKG = path.resolve(import.meta.dirname, "..");
const REPO = path.resolve(PKG, "../..");
const read = (p: string) => fs.readFileSync(p, "utf8");
const exists = (p: string) => fs.existsSync(p);

test("runner package artifacts exist", () => {
  for (const rel of ["README.md", "PATCH-SUMMARY.md", "package.json", "examples/runner.example.json"]) {
    assert.ok(exists(path.join(PKG, rel)), `missing ${rel}`);
  }
});

test("runtime lease schema + contract exist", () => {
  assert.ok(exists(path.join(REPO, ".chaos/interactions/schema/runner-lease.schema.json")));
  assert.ok(exists(path.join(REPO, ".chaos/interactions/contracts/runner-lease-contract.md")));
});

test("README does not claim to control arbitrary chat threads", () => {
  const readme = read(path.join(PKG, "README.md")).toLowerCase();
  assert.ok(
    readme.includes("does not control arbitrary"),
    "README must disclaim arbitrary chat-thread control",
  );
  // It must scope control to runner-launched executions.
  assert.ok(readme.includes("only executions it launched"));
});

test("README documents live-only auto-resume and the chaos:resume fallback", () => {
  const readme = read(path.join(PKG, "README.md")).toLowerCase();
  assert.ok(readme.includes("live"), "must mention live auto-resume");
  assert.ok(readme.includes("does not auto-resume dead"), "must disclaim dead-session auto-resume");
  assert.ok(readme.includes("chaos:resume"), "must reference the chaos:resume fallback");
});

test("PATCH-SUMMARY confirms no production code change and records the API gap", () => {
  const patch = read(path.join(PKG, "PATCH-SUMMARY.md"));
  assert.ok(/no production application source|Production code changed:\*\* no/i.test(patch));
  assert.ok(/resumeCommand/.test(patch), "must record the resumeCommand runtime addition");
});

test("lease contract states heartbeat-based liveness and no state deletion", () => {
  const contract = read(
    path.join(REPO, ".chaos/interactions/contracts/runner-lease-contract.md"),
  ).toLowerCase();
  assert.ok(contract.includes("heartbeat"));
  assert.ok(contract.includes("never") && contract.includes("delete"));
  assert.ok(contract.includes("chaos:resume"));
});
