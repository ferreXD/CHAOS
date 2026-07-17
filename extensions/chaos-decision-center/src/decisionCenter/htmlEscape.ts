/**
 * HTML escaping helpers for safe webview rendering.
 *
 * All model/user-provided text (decision titles, context, labels, paths,
 * rationale, metadata) MUST pass through these before being embedded in HTML.
 * Nothing from a decision artifact is ever rendered as raw HTML.
 */

// Built from char codes so the source file contains no raw line-separator
// characters (U+2028/U+2029), which break TypeScript type-stripping when placed
// inside a regex literal.
const LINE_SEP = new RegExp(String.fromCharCode(0x2028), "g");
const PARA_SEP = new RegExp(String.fromCharCode(0x2029), "g");

/** Escape text for use in HTML element content. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape text for use inside a double-quoted HTML attribute. */
export function escapeAttr(value: unknown): string {
  return escapeHtml(value);
}

/** Escape a string for safe embedding inside a JSON string in an inline script. */
export function escapeJsonForScript(value: unknown): string {
  return JSON.stringify(value ?? null)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(LINE_SEP, "\\u2028")
    .replace(PARA_SEP, "\\u2029");
}
