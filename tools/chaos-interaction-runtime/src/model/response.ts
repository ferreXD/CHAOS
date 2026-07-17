/**
 * Decision response model.
 *
 * Mirrors `.chaos/interactions/schema/response.schema.json`.
 */

export type ResponseSource =
  | "vscode-decision-center"
  | "prompt-fallback"
  | "mcp-tool"
  | "manual-file"
  | "unknown";

/** Response status returned by getDecisionResponse (mcp-tool-contract). */
export type ResponseStatus =
  | "NO_RESPONSE_YET"
  | "ANSWERED"
  | "CANCELLED"
  | "EXPIRED"
  | "SUPERSEDED"
  | "CONSUMED";

export interface DecisionResponse {
  schemaVersion: 1;
  decisionId: string;
  commandRunId: string;
  selectedOptionId: string | null;
  selectedOptionIds: string[];
  freeformValue: string | null;
  rationale: string | null;
  selectedBy: string;
  selectedAt: string;
  source: ResponseSource;
  validatesAgainstDecisionHash: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Normalise a caller-provided source label (which may be an informal value such
 * as `vscode-webview`, `cli`, or `manual`) to a schema-valid enum member.
 */
export function normalizeResponseSource(source: string | undefined): ResponseSource {
  switch ((source ?? "").toLowerCase()) {
    case "vscode-decision-center":
    case "vscode-webview":
    case "vscode":
    case "webview":
      return "vscode-decision-center";
    case "prompt-fallback":
    case "prompt":
    case "fallback":
      return "prompt-fallback";
    case "mcp-tool":
    case "mcp":
      return "mcp-tool";
    case "manual-file":
    case "manual":
    case "cli":
    case "file":
      return "manual-file";
    default:
      return "unknown";
  }
}
