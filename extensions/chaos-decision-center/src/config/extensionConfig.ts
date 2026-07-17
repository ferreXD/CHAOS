/**
 * Extension configuration type + defaults.
 *
 * `resolveConfig` is pure (no vscode) so it can be unit-tested. The vscode layer
 * reads `workspace.getConfiguration('chaosDecisionCenter')` into a partial and
 * passes it here.
 */

export type AfterSubmit = "switchToDashboard" | "keepDecisionOpen" | "closePanel";

export interface ExtensionConfig {
  interactionsRoot: string;
  schemaDir: string;
  openOnPendingDecision: boolean;
  focusOnPendingDecision: boolean;
  showNotificationOnPendingDecision: boolean;
  afterSubmit: AfterSubmit;
  validateResponses: boolean;
  pollingFallbackMs: number;
  maxHistoryItems: number;
  userName: string;
}

export const DEFAULT_CONFIG: ExtensionConfig = {
  interactionsRoot: ".chaos/interactions",
  schemaDir: ".chaos/interactions/schema",
  openOnPendingDecision: true,
  focusOnPendingDecision: false,
  showNotificationOnPendingDecision: true,
  afterSubmit: "switchToDashboard",
  validateResponses: true,
  pollingFallbackMs: 2000,
  maxHistoryItems: 50,
  userName: "vscode-user",
};

const AFTER_SUBMIT_VALUES: AfterSubmit[] = ["switchToDashboard", "keepDecisionOpen", "closePanel"];

export function resolveConfig(raw: Partial<ExtensionConfig> = {}): ExtensionConfig {
  const afterSubmit =
    raw.afterSubmit && AFTER_SUBMIT_VALUES.includes(raw.afterSubmit)
      ? raw.afterSubmit
      : DEFAULT_CONFIG.afterSubmit;

  const userName =
    typeof raw.userName === "string" && raw.userName.trim().length > 0
      ? raw.userName.trim()
      : DEFAULT_CONFIG.userName;

  return {
    interactionsRoot: nonEmpty(raw.interactionsRoot, DEFAULT_CONFIG.interactionsRoot),
    schemaDir: nonEmpty(raw.schemaDir, DEFAULT_CONFIG.schemaDir),
    openOnPendingDecision: bool(raw.openOnPendingDecision, DEFAULT_CONFIG.openOnPendingDecision),
    focusOnPendingDecision: bool(raw.focusOnPendingDecision, DEFAULT_CONFIG.focusOnPendingDecision),
    showNotificationOnPendingDecision: bool(
      raw.showNotificationOnPendingDecision,
      DEFAULT_CONFIG.showNotificationOnPendingDecision,
    ),
    afterSubmit,
    validateResponses: bool(raw.validateResponses, DEFAULT_CONFIG.validateResponses),
    pollingFallbackMs: num(raw.pollingFallbackMs, DEFAULT_CONFIG.pollingFallbackMs, 0),
    maxHistoryItems: num(raw.maxHistoryItems, DEFAULT_CONFIG.maxHistoryItems, 0),
    userName,
  };
}

function nonEmpty(value: string | undefined, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}
function bool(value: boolean | undefined, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}
function num(value: number | undefined, fallback: number, min: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= min ? value : fallback;
}
