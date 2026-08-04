/** End-to-end stdio smoke test (cases 1, 19, 20) using the real MCP client + spawned server. */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { REAL_SCHEMA_DIR } from "./helpers.ts";

const CLI = path.resolve(import.meta.dirname, "../src/cli/chaos-interaction-mcp.ts");

function textOf(result: any): any {
  const block = result.content?.find((c: any) => c.type === "text");
  return JSON.parse(block.text);
}

test("19/20. stdio server starts, lists tools, runs a decision flow, serves resources", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "chaos-mcp-smoke-"));
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [CLI, "--root", root, "--schema-dir", REAL_SCHEMA_DIR, "--log-level", "silent"],
  });
  const client = new Client({ name: "smoke-test", version: "0.0.0" });

  try {
    await client.connect(transport);

    // 1/19. Tool registry is served over stdio.
    const tools = await client.listTools();
    const names = tools.tools.map((t) => t.name);
    for (const required of [
      "chaos_begin_command",
      "chaos_create_decision",
      "chaos_get_decision_response",
      "chaos_answer_decision",
      "chaos_list_locks",
    ]) {
      assert.ok(names.includes(required), `missing tool ${required}`);
    }
    assert.equal(names.length, 13);
    assert.ok(names.includes("chaos_find_resume_candidates"));

    // begin -> create-decision (mustStop) -> answer -> response ANSWERED.
    const begin = textOf(
      await client.callTool({
        name: "chaos_begin_command",
        arguments: { sourceCommand: "chaos:propose", changeId: "smoke" },
      }),
    );
    assert.equal(begin.status, "READY");
    const runId = begin.data.commandRunId;

    const dec = textOf(
      await client.callTool({
        name: "chaos_create_decision",
        arguments: {
          commandRunId: runId,
          title: "Choose profile",
          context: "ctx",
          options: [
            { id: "a", label: "A" },
            { id: "b", label: "B", recommended: true },
          ],
        },
      }),
    );
    assert.equal(dec.status, "WAITING_FOR_USER_DECISION");
    assert.equal(dec.mustStop, true);

    const answer = textOf(
      await client.callTool({
        name: "chaos_answer_decision",
        arguments: { decisionId: dec.data.decisionId, selectedOptionId: "b", selectedBy: "tester" },
      }),
    );
    assert.equal(answer.status, "ANSWERED");

    const resp = textOf(
      await client.callTool({
        name: "chaos_get_decision_response",
        arguments: { decisionId: dec.data.decisionId },
      }),
    );
    assert.equal(resp.status, "ANSWERED");
    assert.equal(resp.mustStop, false);

    // 20. Resource read over stdio.
    const active = await client.readResource({ uri: "chaos://interactions/active" });
    const activeJson = JSON.parse((active.contents[0] as any).text);
    assert.ok(["ready-to-resume", "ready", "waiting-for-user-decision"].includes(activeJson.state));
    assert.equal((active.contents[0] as any).mimeType, "application/json");

    // Structured error surfaces over stdio without a stack trace.
    const err = textOf(
      await client.callTool({
        name: "chaos_get_decision_response",
        arguments: { decisionId: "DEC-missing" },
      }),
    );
    assert.equal(err.ok, false);
    assert.equal(err.status, "NOT_FOUND");
  } finally {
    await client.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
