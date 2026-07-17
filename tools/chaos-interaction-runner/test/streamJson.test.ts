/** Pure stream-json parser + user-message builder tests. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  StreamJsonParser,
  classifyStreamObject,
  buildUserMessageLine,
} from "../src/runner/streamJson.ts";

test("classifies init events and extracts the session id", () => {
  const ev = classifyStreamObject({ type: "system", subtype: "init", session_id: "S1" });
  assert.equal(ev.kind, "init");
  assert.equal(ev.kind === "init" ? ev.sessionId : null, "S1");
});

test("classifies successful and error result events", () => {
  const ok = classifyStreamObject({ type: "result", subtype: "success", is_error: false, result: "done" });
  assert.equal(ok.kind, "result");
  assert.equal(ok.kind === "result" && ok.isError, false);
  assert.equal(ok.kind === "result" ? ok.text : null, "done");

  const errFlag = classifyStreamObject({ type: "result", subtype: "success", is_error: true });
  assert.equal(errFlag.kind === "result" && errFlag.isError, true);

  const errSubtype = classifyStreamObject({ type: "result", subtype: "error_max_turns" });
  assert.equal(errSubtype.kind === "result" && errSubtype.isError, true);
});

test("classifies other and malformed lines", () => {
  const other = classifyStreamObject({ type: "assistant", message: {} });
  assert.equal(other.kind, "other");
  assert.equal(other.kind === "other" ? other.type : null, "assistant");
});

test("parser buffers partial lines across chunks", () => {
  const p = new StreamJsonParser();
  const a = p.push('{"type":"system","subtype":"init","session_id":"S1"}\n{"type":"res');
  assert.equal(a.length, 1);
  assert.equal(a[0]!.kind, "init");

  const b = p.push('ult","subtype":"success","is_error":false}\n');
  assert.equal(b.length, 1);
  assert.equal(b[0]!.kind, "result");
});

test("parser reports malformed lines without throwing", () => {
  const p = new StreamJsonParser();
  const evs = p.push("not json at all\n");
  assert.equal(evs.length, 1);
  assert.equal(evs[0]!.kind, "malformed");
});

test("parser flush drains an unterminated trailing line", () => {
  const p = new StreamJsonParser();
  assert.equal(p.push('{"type":"result","subtype":"success"}').length, 0);
  const flushed = p.flush();
  assert.equal(flushed.length, 1);
  assert.equal(flushed[0]!.kind, "result");
});

test("buildUserMessageLine produces a valid newline-terminated user message", () => {
  const line = buildUserMessageLine('hello "world" {braces}');
  assert.ok(line.endsWith("\n"));
  const obj = JSON.parse(line.trim());
  assert.equal(obj.type, "user");
  assert.equal(obj.message.role, "user");
  assert.equal(obj.message.content[0].text, 'hello "world" {braces}');
});
