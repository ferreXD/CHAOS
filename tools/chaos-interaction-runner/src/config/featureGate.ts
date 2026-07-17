/**
 * Master feature gate for live auto-resume.
 *
 * The fully-automatic "answer → auto-continue" loop ships OFF. The `claude-code`
 * session adapter refuses to run unless the repository's `.chaos/config.yaml`
 * explicitly opts in via:
 *
 *   policies:
 *     interactionRuntime:
 *       autoResume:
 *         enabled: true
 *         adapter: claude-code
 *
 * This module reads just those two scalars with a tiny, dependency-free targeted
 * parser (the runner has no YAML dependency by design). A `--force-adapter`
 * escape hatch on the CLI bypasses the gate for local development.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface AutoResumeGate {
  enabled: boolean;
  adapter: string;
  /** Whether an `autoResume:` block was actually found. */
  present: boolean;
  configPath: string;
}

export interface GateDecision {
  allowed: boolean;
  reason?: string;
}

const DEFAULT_ADAPTER = "none";

/** Read + parse the autoResume gate from `<repoRoot>/.chaos/config.yaml`. */
export function readAutoResumeGate(repoRoot: string): AutoResumeGate {
  const configPath = path.join(repoRoot, ".chaos", "config.yaml");
  let text: string;
  try {
    text = fs.readFileSync(configPath, "utf8");
  } catch {
    return { enabled: false, adapter: DEFAULT_ADAPTER, present: false, configPath };
  }
  return { ...parseAutoResumeGate(text), configPath };
}

/**
 * Pure parser: pull `enabled` / `adapter` out of the `autoResume:` block. Reads
 * only the keys directly under the first `autoResume:` mapping; ignores comments
 * and stops at the block's dedent. Kept intentionally small — it is not a general
 * YAML parser.
 */
export function parseAutoResumeGate(yamlText: string): Omit<AutoResumeGate, "configPath"> {
  const lines = yamlText.split(/\r?\n/);
  let blockIndent = -1;
  let enabled = false;
  let adapter = DEFAULT_ADAPTER;
  let present = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    const stripped = stripComment(raw);
    if (stripped.trim().length === 0) continue;
    const indent = leadingSpaces(stripped);

    if (blockIndent === -1) {
      if (/^\s*autoResume:\s*$/.test(stripped)) {
        blockIndent = indent;
        present = true;
      }
      continue;
    }

    // Inside the block until a line dedents to or past the block key.
    if (indent <= blockIndent) break;

    const m = /^\s*([A-Za-z0-9_]+)\s*:\s*(.*)$/.exec(stripped);
    if (!m) continue;
    const key = m[1]!;
    const value = firstToken(m[2]!);
    if (key === "enabled") enabled = value === "true";
    else if (key === "adapter") adapter = value.length > 0 ? value : DEFAULT_ADAPTER;
  }

  return { enabled, adapter, present };
}

/** Is the `claude-code` adapter permitted by the gate? */
export function claudeAdapterAllowed(gate: AutoResumeGate): GateDecision {
  if (!gate.enabled) {
    return {
      allowed: false,
      reason:
        `Auto-resume is disabled. Set policies.interactionRuntime.autoResume.enabled: true ` +
        `in ${gate.configPath} (or pass --force-adapter to bypass for local dev).`,
    };
  }
  if (gate.adapter !== "claude-code") {
    return {
      allowed: false,
      reason:
        `Auto-resume adapter is "${gate.adapter}", not "claude-code". Set ` +
        `policies.interactionRuntime.autoResume.adapter: claude-code in ${gate.configPath} ` +
        `(or pass --force-adapter to bypass for local dev).`,
    };
  }
  return { allowed: true };
}

function stripComment(line: string): string {
  const hash = line.indexOf("#");
  return hash === -1 ? line : line.slice(0, hash);
}

function leadingSpaces(line: string): number {
  const m = /^(\s*)/.exec(line);
  return m ? m[1]!.length : 0;
}

function firstToken(value: string): string {
  const trimmed = value.trim();
  const space = trimmed.search(/\s/);
  return space === -1 ? trimmed : trimmed.slice(0, space);
}
