/** Runner lease: write, heartbeat, expiry, stop flag. */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { SessionLeaseManager, isLeaseLive } from "../src/runtime/sessionLease.ts";
import { makeEnv, fixedClock, writeStopFlag } from "./helpers.ts";

function newManager(env: ReturnType<typeof makeEnv>, ttlMs: number, clock = env.clock) {
  return new SessionLeaseManager({
    runnersDir: env.config.runnersDir,
    runnerId: "RUNNER-lease-1",
    clock,
    ttlMs,
    maxAutoResumeCycles: 3,
    validate: true,
    schemaDir: env.config.schemaDir,
  });
}

test("1. register writes a schema-valid lease file", () => {
  const env = makeEnv();
  try {
    const mgr = newManager(env, 300000);
    const lease = mgr.register({
      commandRunId: "RUN-test-1",
      changeId: "c1",
      sourceCommand: "chaos:apply",
      processId: 123,
    });
    assert.ok(fs.existsSync(mgr.leasePath()));
    const onDisk = JSON.parse(fs.readFileSync(mgr.leasePath(), "utf8"));
    assert.equal(onDisk.runnerId, "RUNNER-lease-1");
    assert.equal(onDisk.commandRunId, "RUN-test-1");
    assert.equal(onDisk.state, "created");
    assert.equal(lease.maxAutoResumeCycles, 3);
  } finally {
    env.cleanup();
  }
});

test("2. heartbeat advances lastHeartbeatAt and leaseExpiresAt", () => {
  const env = makeEnv();
  try {
    const mgr = newManager(env, 300000);
    const first = mgr.register({
      commandRunId: "RUN-test-1",
      changeId: "c1",
      sourceCommand: "chaos:apply",
    });
    const second = mgr.heartbeat({ state: "running", autoResumeCyclesUsed: 1 });
    assert.equal(second.state, "running");
    assert.equal(second.autoResumeCyclesUsed, 1);
    assert.ok(new Date(second.lastHeartbeatAt).getTime() > new Date(first.lastHeartbeatAt).getTime());
    assert.ok(new Date(second.leaseExpiresAt).getTime() > new Date(first.leaseExpiresAt).getTime());
  } finally {
    env.cleanup();
  }
});

test("3. an expired lease is detected (heartbeat-based liveness)", () => {
  const env = makeEnv();
  try {
    // ttl of 1 step; the shared clock advances 1s per read.
    const clock = fixedClock("2026-07-07T09:00:00.000Z");
    const mgr = newManager(env, 500, clock); // 500ms < 1s step
    const lease = mgr.register({
      commandRunId: "RUN-test-1",
      changeId: "c1",
      sourceCommand: "chaos:apply",
    });
    // A later time is well past leaseExpiresAt.
    const later = "2026-07-07T09:00:10.000Z";
    assert.equal(mgr.isExpired(lease, later), true);
    assert.equal(isLeaseLive(lease, later), false);
    // Immediately after start it is still live.
    assert.equal(isLeaseLive(lease, lease.startedAt), true);
  } finally {
    env.cleanup();
  }
});

test("release keeps the file but does not extend the lease", () => {
  const env = makeEnv();
  try {
    const mgr = newManager(env, 300000);
    mgr.register({ commandRunId: "RUN-test-1", changeId: "c1", sourceCommand: "chaos:apply" });
    const before = mgr.current()!.leaseExpiresAt;
    const released = mgr.release("completed");
    assert.equal(released.state, "completed");
    assert.equal(released.leaseExpiresAt, before); // not extended
    assert.ok(fs.existsSync(mgr.leasePath())); // kept for audit
  } finally {
    env.cleanup();
  }
});

test("manual stop flag is detected", () => {
  const env = makeEnv();
  try {
    const mgr = newManager(env, 300000);
    mgr.register({ commandRunId: "RUN-test-1", changeId: "c1", sourceCommand: "chaos:apply" });
    assert.equal(mgr.hasStopFlag(), false);
    writeStopFlag(env, "RUNNER-lease-1");
    assert.equal(mgr.hasStopFlag(), true);
  } finally {
    env.cleanup();
  }
});
