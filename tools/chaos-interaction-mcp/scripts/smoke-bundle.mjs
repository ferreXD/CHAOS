#!/usr/bin/env node
/**
 * Cold-start smoke test against the BUNDLED server (dist/chaos-interaction-mcp.mjs).
 *
 * Simulates the L1 install path: the bundle is copied into a temp directory
 * that is not a CHAOS checkout, started over stdio, and driven through a real
 * decision flow (begin -> create -> answer -> response) with schema validation
 * on. Auto-seeding must supply the schemas.
 *
 * Run after `npm run bundle`; part of the release checklist (see
 * docs/design/2026-08-06-distribution-surface.md §5.3).
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const bundle = path.resolve(here, "..", "dist", "chaos-interaction-mcp.mjs");
if (!fs.existsSync(bundle)) {
  console.error("Bundle not found — run `npm run bundle` first.");
  process.exit(1);
}

const stage = fs.mkdtempSync(path.join(os.tmpdir(), "chaos-bundle-smoke-"));
const stagedBundle = path.join(stage, "chaos-interaction-mcp.mjs");
fs.copyFileSync(bundle, stagedBundle);
const repo = path.join(stage, "repo");
fs.mkdirSync(path.join(repo, ".chaos", "interactions"), { recursive: true });

function unwrap(result) {
  const block = result.content?.find((c) => c.type === "text");
  return JSON.parse(block.text);
}

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [stagedBundle, "--repo-root", repo, "--log-level", "error"],
  cwd: repo,
});
const client = new Client({ name: "bundle-smoke", version: "0.0.0" });

try {
  await client.connect(transport);

  const tools = await client.listTools();
  if (tools.tools.length !== 14) {
    throw new Error(`expected 14 tools, got ${tools.tools.length}`);
  }

  const begin = unwrap(
    await client.callTool({
      name: "chaos_begin_command",
      arguments: { sourceCommand: "chaos:run", changeId: "bundle-smoke" },
    }),
  );
  if (begin.status !== "READY") throw new Error(`begin_command: ${JSON.stringify(begin)}`);
  const runId = begin.data.commandRunId;

  const dec = unwrap(
    await client.callTool({
      name: "chaos_create_decision",
      arguments: {
        commandRunId: runId,
        title: "Bundle smoke decision",
        context: "Cold-start validation of the published bundle.",
        options: [
          { id: "opt-a", label: "Option A", description: "The recommended option." },
          { id: "opt-b", label: "Option B", description: "The alternative." },
        ],
        recommendedOptionId: "opt-a",
        mustStop: true,
      },
    }),
  );
  if (dec.status !== "WAITING_FOR_USER_DECISION") {
    throw new Error(`create_decision: ${JSON.stringify(dec)}`);
  }
  const decisionId = dec.data.decisionId;

  const answer = unwrap(
    await client.callTool({
      name: "chaos_answer_decision",
      arguments: { decisionId, selectedOptionId: "opt-a", answeredBy: "smoke-operator" },
    }),
  );
  if (answer.status !== "ANSWERED") {
    throw new Error(`answer_decision: ${JSON.stringify(answer)}`);
  }

  const response = unwrap(
    await client.callTool({
      name: "chaos_get_decision_response",
      arguments: { decisionId },
    }),
  );
  if (response.status !== "ANSWERED" || response.data.selectedOptionId !== "opt-a") {
    throw new Error(`get_decision_response: ${JSON.stringify(response)}`);
  }

  const schemaDir = path.join(repo, ".chaos", "interactions", "schema");
  const seeded = fs.readdirSync(schemaDir).filter((f) => f.endsWith(".schema.json"));
  if (seeded.length === 0) throw new Error("auto-seed left the schema dir empty");

  console.log(
    `BUNDLE SMOKE OK — 14 tools, decision round-trip answered, ${seeded.length} schemas auto-seeded (${stage})`,
  );
} finally {
  await client.close().catch(() => {});
}
