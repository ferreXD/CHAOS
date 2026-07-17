/**
 * Pure parser for Claude Code's newline-delimited `stream-json` output, plus a
 * builder for the `stream-json` user messages the runner writes back on stdin.
 *
 * Kept dependency-free and side-effect-free so the (brittle, version-sensitive)
 * wire format lives behind one unit-tested seam. `ClaudeCodeSessionAdapter` is
 * the only consumer; if the CLI's event shape drifts, this is the single file to
 * adjust.
 *
 * Claude Code emits one JSON object per line on stdout:
 *   {"type":"system","subtype":"init","session_id":"...", ...}   ← session start
 *   {"type":"assistant","message":{...}}                          ← model output
 *   {"type":"user","message":{...}}                               ← tool results, etc.
 *   {"type":"result","subtype":"success","is_error":false, ...}   ← one per turn end
 *
 * In streaming-input mode (`--input-format stream-json`) every user message we
 * send triggers one run that terminates with exactly one `result` event, so
 * counting `result` events counts completed turns — that is our acknowledgement.
 */

export interface StreamInitEvent {
  kind: "init";
  sessionId: string | null;
}

export interface StreamResultEvent {
  kind: "result";
  isError: boolean;
  subtype: string | null;
  sessionId: string | null;
  /** The final assistant text for the turn, when present. */
  text: string | null;
}

export interface StreamOtherEvent {
  kind: "other";
  type: string;
}

export interface StreamMalformedEvent {
  kind: "malformed";
  line: string;
}

export type StreamEvent =
  | StreamInitEvent
  | StreamResultEvent
  | StreamOtherEvent
  | StreamMalformedEvent;

/** Classify a single parsed stdout object into a typed event. */
export function classifyStreamObject(obj: Record<string, unknown>): StreamEvent {
  const type = typeof obj["type"] === "string" ? (obj["type"] as string) : "";
  if (type === "system" && obj["subtype"] === "init") {
    return { kind: "init", sessionId: asStringOrNull(obj["session_id"]) };
  }
  if (type === "result") {
    const subtype = asStringOrNull(obj["subtype"]);
    const isError =
      obj["is_error"] === true ||
      (subtype !== null && subtype !== "success");
    return {
      kind: "result",
      isError,
      subtype,
      sessionId: asStringOrNull(obj["session_id"]),
      text: asStringOrNull(obj["result"]),
    };
  }
  return { kind: "other", type: type || "unknown" };
}

/**
 * Incremental line-buffering parser. `push()` accepts arbitrary stdout chunks
 * (which may split lines mid-object) and returns the events for every complete
 * line seen so far; `flush()` drains a trailing unterminated line, if any.
 */
export class StreamJsonParser {
  private buffer = "";

  push(chunk: string): StreamEvent[] {
    this.buffer += chunk;
    const events: StreamEvent[] = [];
    let newlineIndex = this.buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = this.buffer.slice(0, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 1);
      const ev = parseLine(line);
      if (ev) events.push(ev);
      newlineIndex = this.buffer.indexOf("\n");
    }
    return events;
  }

  flush(): StreamEvent[] {
    const line = this.buffer;
    this.buffer = "";
    const ev = parseLine(line);
    return ev ? [ev] : [];
  }
}

function parseLine(line: string): StreamEvent | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) return null;
  try {
    const obj = JSON.parse(trimmed) as unknown;
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
      return { kind: "malformed", line: trimmed };
    }
    return classifyStreamObject(obj as Record<string, unknown>);
  } catch {
    return { kind: "malformed", line: trimmed };
  }
}

/**
 * Build one `stream-json` user-message line (newline-terminated) for stdin. Uses
 * the structured content-array form so arbitrary text (including braces/quotes)
 * is carried safely as data, never interpreted.
 */
export function buildUserMessageLine(text: string): string {
  const message = {
    type: "user",
    message: {
      role: "user",
      content: [{ type: "text", text }],
    },
  };
  return JSON.stringify(message) + "\n";
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
