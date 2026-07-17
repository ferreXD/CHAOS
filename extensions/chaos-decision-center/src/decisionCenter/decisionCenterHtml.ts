/**
 * Pure HTML renderer for the Decision Center webview.
 *
 * SECURITY:
 *   - Strict Content-Security-Policy: default-src 'none'; only nonce'd inline
 *     style/script; no external scripts, CSS, fonts, images, or network.
 *   - Every piece of decision-derived text is escaped. Nothing is rendered as
 *     raw HTML and nothing from an artifact is executed.
 *
 * ROUTING:
 *   - The dashboard shows the featured decision (hero), a paged table of all
 *     pending decisions grouped-by-change, ready-to-resume sessions and history.
 *   - The change view shows every decision belonging to one change; pending ones
 *     are answerable inline.
 *   Routing is driven by the panel (it re-renders with a `view`); paging and
 *   in-progress answer drafts are preserved client-side so a background refresh
 *   never wipes what the human is typing.
 */

import { escapeAttr, escapeHtml } from "./htmlEscape.ts";
import type {
  DecisionVM,
  ExpiryVM,
  HealthWarning,
  HistoryVM,
  OptionVM,
  Projection,
  ReadyVM,
} from "./decisionViewModel.ts";

export type DashboardView =
  | { kind: "dashboard" }
  | { kind: "change"; changeKey: string };

export interface RenderOptions {
  nonce: string;
  view?: DashboardView;
}

/** How many pending rows show per page before the pager appears. */
const PAGE_SIZE = 6;

export function renderDecisionCenter(projection: Projection, options: RenderOptions): string {
  const nonce = options.nonce;
  const view = options.view ?? { kind: "dashboard" };
  const csp = [
    "default-src 'none'",
    `style-src 'nonce-${nonce}'`,
    `script-src 'nonce-${nonce}'`,
    "img-src 'none'",
    "font-src 'none'",
    "connect-src 'none'",
  ].join("; ");

  const body =
    view.kind === "change"
      ? renderChangeView(projection, view.changeKey)
      : renderDashboard(projection);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="${csp}" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>CHAOS Decision Center</title>
<style nonce="${nonce}">${STYLES}</style>
</head>
<body>
${renderHeader(projection)}
<main class="dc-main">
${body}
</main>
<footer class="dc-footer">Generated ${escapeHtml(projection.generatedAt)} · the interaction runtime is the source of truth.</footer>
<script nonce="${nonce}">${SCRIPT}</script>
</body>
</html>`;
}

/* ------------------------------------------------------------------ header */

function renderHeader(projection: Projection): string {
  const s = projection.status;
  const pill = `<span class="dc-pill dc-pill-${escapeAttr(s.state)}">
    <span class="dc-pill-dot"></span>${escapeHtml(s.text)}</span>`;
  return `<header class="dc-header">
  <div class="dc-brand"><span class="dc-logo">◇</span><h1>CHAOS Decision Center</h1></div>
  <div class="dc-header-right">
    ${pill}
    <button data-action="refresh" class="dc-btn dc-btn-ghost" title="Reload runtime state">↻ Refresh</button>
  </div>
</header>`;
}

/* --------------------------------------------------------------- dashboard */

function renderDashboard(projection: Projection): string {
  return [
    renderHealth(projection.health),
    renderHero(projection.activeDecision, projection.pending.length),
    renderPendingTable(projection),
    renderReady(projection.readyToResume),
    renderHistory(projection.history),
  ].join("\n");
}

function renderHero(active: DecisionVM | null, pendingCount: number): string {
  if (!active) {
    return `<section class="dc-section">
      <div class="dc-card dc-empty-card">
        <div class="dc-empty-mark">✓</div>
        <div>
          <h2 class="dc-empty-title">You're all clear</h2>
          <p class="dc-muted">No decision is waiting for you. New decisions from CHAOS commands will appear here automatically.</p>
        </div>
      </div>
    </section>`;
  }
  const more =
    pendingCount > 1
      ? `<span class="dc-badge dc-badge-amber">+${pendingCount - 1} more pending</span>`
      : "";
  return `<section class="dc-section">
    <div class="dc-section-head"><h2>Next decision ${more}</h2></div>
    ${renderAnswerCard(active, true)}
  </section>`;
}

function renderPendingTable(projection: Projection): string {
  const pending = projection.pending;
  if (pending.length === 0) return "";

  // Map decisionId -> its change group key, for row navigation.
  const keyByDecision = new Map<string, string>();
  for (const g of projection.changeGroups) {
    for (const d of g.decisions) keyByDecision.set(d.decisionId, g.key);
  }

  const rows = pending
    .map((d, i) => {
      const key = keyByDecision.get(d.decisionId) ?? "";
      const featured = i === 0 ? `<span class="dc-tag">featured</span>` : "";
      const change = d.changeId
        ? `<code class="dc-change">${escapeHtml(d.changeId)}</code>`
        : `<span class="dc-muted">(no change)</span>`;
      return `<tr class="dc-prow" data-action="select-change" data-change-key="${escapeAttr(key)}" tabindex="0">
        <td>${change}</td>
        <td><code class="dc-cmd">${escapeHtml(d.sourceCommand)}</code></td>
        <td class="dc-prow-title">${escapeHtml(d.title)} ${featured} ${renderExpiryBadge(d.expiry)}</td>
        <td class="dc-prow-go">›</td>
      </tr>`;
    })
    .join("");

  const pager =
    pending.length > PAGE_SIZE
      ? `<div class="dc-pager" data-page-size="${PAGE_SIZE}">
          <button data-action="page-prev" class="dc-btn dc-btn-ghost">‹ Prev</button>
          <span class="dc-page-label"></span>
          <button data-action="page-next" class="dc-btn dc-btn-ghost">Next ›</button>
        </div>`
      : "";

  return `<section class="dc-section">
    <div class="dc-section-head"><h2>Pending decisions</h2><span class="dc-count">${pending.length}</span></div>
    <p class="dc-muted dc-hint">Click a row to see every decision for that change.</p>
    <div class="dc-table-wrap">
      <table class="dc-table dc-table-click">
        <thead><tr><th>Change</th><th>Command</th><th>Decision</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${pager}
  </section>`;
}

/* ------------------------------------------------------------- change view */

function renderChangeView(projection: Projection, changeKey: string): string {
  const group = projection.changeGroups.find((g) => g.key === changeKey);
  const pendingById = new Map(projection.pending.map((d) => [d.decisionId, d]));

  const back = `<button data-action="back" class="dc-btn dc-btn-ghost dc-back">‹ Back to dashboard</button>`;

  if (!group) {
    return `<section class="dc-section">
      ${back}
      <div class="dc-card"><p class="dc-muted">This change has no decisions anymore. It may have been answered or cancelled.</p></div>
    </section>`;
  }

  const pendingCards = group.decisions
    .filter((d) => d.isPending)
    .map((d) => pendingById.get(d.decisionId))
    .filter((d): d is DecisionVM => Boolean(d))
    .map((d) => renderAnswerCard(d, false))
    .join("\n");

  const resolved = group.decisions.filter((d) => !d.isPending);
  const resolvedTable =
    resolved.length === 0
      ? ""
      : `<div class="dc-section-head"><h3>Resolved in this change</h3><span class="dc-count">${resolved.length}</span></div>
         <div class="dc-table-wrap"><table class="dc-table">
           <thead><tr><th>State</th><th>Decision</th><th>Command</th></tr></thead>
           <tbody>${resolved
             .map(
               (d) =>
                 `<tr><td>${renderStatePill(d.state)}</td><td>${escapeHtml(d.title)}</td><td><code class="dc-cmd">${escapeHtml(d.sourceCommand)}</code></td></tr>`,
             )
             .join("")}</tbody>
         </table></div>`;

  const commands = group.sourceCommands
    .map((c) => `<code class="dc-cmd">${escapeHtml(c)}</code>`)
    .join(" ");

  const pendingHead =
    group.pendingCount > 0
      ? `<div class="dc-section-head"><h3>Pending in this change</h3><span class="dc-count">${group.pendingCount}</span></div>`
      : `<div class="dc-card"><p class="dc-muted">No pending decisions remain for this change.</p></div>`;

  return `<section class="dc-section">
    ${back}
    <div class="dc-change-hero">
      <div class="dc-change-title">${group.changeId ? `<code class="dc-change dc-change-lg">${escapeHtml(group.changeId)}</code>` : `<span class="dc-muted">(no change)</span>`}</div>
      <div class="dc-change-meta">
        <span class="dc-badge dc-badge-amber">${group.pendingCount} pending</span>
        <span class="dc-badge">${group.totalCount} total</span>
        <span class="dc-change-cmds">${commands}</span>
      </div>
    </div>
    ${pendingHead}
    ${pendingCards}
    ${resolvedTable}
  </section>`;
}

/* --------------------------------------------------------- shared: answer */

function renderOptionExtras(o: OptionVM): string {
  return [
    o.description ? `<div class="dc-opt-desc">${escapeHtml(o.description)}</div>` : "",
    o.consequence
      ? `<div class="dc-opt-meta"><span class="dc-opt-k">Consequence</span> ${escapeHtml(o.consequence)}</div>`
      : "",
    o.risk
      ? `<div class="dc-opt-meta dc-risk"><span class="dc-opt-k">Risk</span> ${escapeHtml(o.risk)}</div>`
      : "",
  ].join("");
}

function renderDecisionInputs(active: DecisionVM): string {
  const type = active.interactionType;

  if (type === "freeform-input") {
    return `<div class="dc-field">
      <label class="dc-field-label">Your answer <span class="dc-required">required</span></label>
      <textarea class="dc-freeform" rows="3" placeholder="Type your answer…"></textarea>
    </div>`;
  }

  const multi = type === "multi-choice-decision";
  const confirm = type === "confirmation";
  const name = `opt-${active.decisionId}`;
  const opts = active.options
    .map((o, i) => {
      const rec = o.recommended ? `<span class="dc-badge dc-badge-rec">recommended</span>` : "";
      // Keyboard hint for the first nine options (press 1-9 to pick).
      const kbd = i < 9 ? `<kbd class="dc-kbd">${i + 1}</kbd>` : "";
      const input = multi
        ? `<input type="checkbox" class="dc-check" value="${escapeAttr(o.id)}" />`
        : `<input type="radio" name="${escapeAttr(name)}" value="${escapeAttr(o.id)}"${o.recommended ? " checked" : ""} />`;
      return `<label class="dc-option${confirm ? " dc-option-confirm" : ""}">
        ${kbd}${input}
        <span class="dc-opt-body"><span class="dc-opt-label">${escapeHtml(o.label)} ${rec}</span>${renderOptionExtras(o)}</span>
      </label>`;
    })
    .join("");
  return `<div class="dc-options${confirm ? " dc-options-confirm" : ""}">${opts}</div>`;
}

function typeHint(type: DecisionVM["interactionType"]): string {
  switch (type) {
    case "freeform-input":
      return "Provide a written answer";
    case "multi-choice-decision":
      return "Select all that apply";
    case "confirmation":
      return "Confirm to continue";
    default:
      return "Select one option";
  }
}

function renderAnswerCard(active: DecisionVM, hero: boolean): string {
  const rationale = active.requiresRationale
    ? `<div class="dc-field">
         <label class="dc-field-label">Rationale <span class="dc-required">required</span></label>
         <textarea class="dc-rationale" rows="3" placeholder="Why this answer?"></textarea>
       </div>`
    : `<div class="dc-field">
         <label class="dc-field-label">Rationale <span class="dc-muted">(optional)</span></label>
         <textarea class="dc-rationale" rows="2" placeholder="Optional note for the audit trail"></textarea>
       </div>`;

  const links = `<div class="dc-links">
    <button class="dc-linkbtn" data-action="open-artifact" data-open-kind="decision" data-open-decision-id="${escapeAttr(active.decisionId)}" title="Open the decision.json file">⧉ decision file</button>
    ${
      active.changeId
        ? `<button class="dc-linkbtn" data-action="open-artifact" data-open-kind="change" data-open-change-id="${escapeAttr(active.changeId)}" title="Reveal the change folder">⧉ change folder</button>`
        : ""
    }
  </div>`;

  const expiredNote =
    active.expiry && active.expiry.expired
      ? `<div class="dc-expired-note">⚠ This decision has expired but can still be answered. If it is stale, use <strong>Cancel session</strong> to release its lock.</div>`
      : "";

  return `<div class="dc-card dc-answer${hero ? " dc-answer-hero" : ""}" data-decision-id="${escapeAttr(active.decisionId)}" data-requires-rationale="${active.requiresRationale ? "1" : "0"}" data-interaction-type="${escapeAttr(active.interactionType)}">
    <div class="dc-chips">
      <span class="dc-chip dc-chip-type">${escapeHtml(active.interactionType)}</span>
      <span class="dc-chip"><span class="dc-chip-k">command</span> ${escapeHtml(active.sourceCommand)}</span>
      <span class="dc-chip"><span class="dc-chip-k">change</span> ${escapeHtml(active.changeId ?? "—")}</span>
      <span class="dc-chip"><span class="dc-chip-k">decision</span> ${escapeHtml(active.decisionId)}</span>
      ${renderExpiryBadge(active.expiry)}
    </div>
    ${links}
    <h3 class="dc-answer-title">${escapeHtml(active.title)}</h3>
    <p class="dc-context">${escapeHtml(active.context)}</p>
    ${expiredNote}
    <div class="dc-type-hint dc-muted">${escapeHtml(typeHint(active.interactionType))}</div>
    ${renderDecisionInputs(active)}
    ${rationale}
    <div class="dc-actions">
      <button data-action="submit" class="dc-btn dc-btn-primary">Submit answer</button>
      <button data-action="cancel" class="dc-btn dc-btn-danger">Cancel session</button>
    </div>
    <div class="dc-inline-error" hidden></div>
  </div>`;
}

/* ------------------------------------------------------ shared: sections */

function renderHealth(health: HealthWarning[]): string {
  if (health.length === 0) return "";
  const items = health
    .map(
      (h) =>
        `<li class="dc-health-item dc-health-${escapeAttr(h.level)}"><code class="dc-code">${escapeHtml(h.code)}</code> ${escapeHtml(h.message)}</li>`,
    )
    .join("");
  return `<section class="dc-section"><div class="dc-card dc-health-card">
    <h2 class="dc-health-h">Runtime Health Warnings</h2><ul class="dc-health-list">${items}</ul>
  </div></section>`;
}

function renderReady(ready: ReadyVM[]): string {
  if (ready.length === 0) return "";
  const items = ready
    .map((r) => {
      const cmds = r.resume.commands.map((c) => `<code class="dc-code">${escapeHtml(c)}</code>`).join(" ");
      return `<div class="dc-card dc-ready-item">
        <div class="dc-chips">
          <span class="dc-chip"><span class="dc-chip-k">run</span> ${escapeHtml(r.commandRunId)}</span>
          <span class="dc-chip"><span class="dc-chip-k">change</span> ${escapeHtml(r.changeId ?? "—")}</span>
        </div>
        <div class="dc-resume">${cmds}</div>
        <div class="dc-muted">${escapeHtml(r.resume.manualFallback)}</div>
        <button data-action="copy-resume" data-command-run-id="${escapeAttr(r.commandRunId)}" class="dc-btn dc-btn-secondary">Copy resume instruction</button>
      </div>`;
    })
    .join("");
  return `<section class="dc-section">
    <div class="dc-section-head"><h2>Ready to resume</h2><span class="dc-count">${ready.length}</span></div>
    ${items}
  </section>`;
}

function renderHistory(history: HistoryVM[]): string {
  if (history.length === 0) return "";
  const rows = history
    .map((h) => {
      const a = h.answer;
      const chosen = !a
        ? `<span class="dc-muted">—</span>`
        : a.freeformValue !== null
          ? `<span class="dc-opt-k">freeform</span> ${escapeHtml(clip(a.freeformValue, 80))}`
          : a.selectedLabels.length > 0
            ? escapeHtml(a.selectedLabels.join(", "))
            : `<span class="dc-muted">—</span>`;
      const who = a ? escapeHtml(a.selectedBy) : "—";
      const when = a ? escapeHtml(formatWhen(a.selectedAt)) : "—";
      const rationaleRow =
        a && a.rationale
          ? `<tr class="dc-hist-note"><td></td><td colspan="4"><span class="dc-opt-k">rationale</span> ${escapeHtml(clip(a.rationale, 240))}</td></tr>`
          : "";
      return `<tr>
        <td>${renderStatePill(h.state)}</td>
        <td>${escapeHtml(h.title)}<div class="dc-muted dc-hist-sub"><code class="dc-cmd">${escapeHtml(h.sourceCommand)}</code> · ${escapeHtml(h.changeId ?? "—")}</div></td>
        <td>${chosen}</td>
        <td>${who}</td>
        <td class="dc-hist-when">${when}</td>
      </tr>${rationaleRow}`;
    })
    .join("");
  return `<section class="dc-section">
    <details class="dc-details">
      <summary class="dc-summary"><h2>History</h2><span class="dc-count">${history.length}</span></summary>
      <div class="dc-table-wrap"><table class="dc-table dc-hist-table">
        <thead><tr><th>State</th><th>Decision</th><th>Answer</th><th>By</th><th>When</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </details>
  </section>`;
}

/** Truncate for compact display. */
function clip(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) + "…" : value;
}

/** Compact, locale-independent timestamp: "2026-07-08 12:34:56". */
function formatWhen(iso: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/.exec(iso);
  return m ? `${m[1]} ${m[2]}` : iso;
}

/**
 * Expiry pill. Carries `data-expires-at` so the client can tick the countdown
 * live (and flip to "expired") without a server re-render.
 */
function renderExpiryBadge(expiry: ExpiryVM | null): string {
  if (!expiry || !expiry.label) return "";
  const cls = expiry.expired ? "dc-expiry dc-expiry-expired" : "dc-expiry";
  const icon = expiry.expired ? "⚠" : "⏱";
  return `<span class="${cls}" data-expires-at="${escapeAttr(expiry.expiresAt)}">${icon} <span class="dc-expiry-text">${escapeHtml(expiry.label)}</span></span>`;
}

function renderStatePill(state: string): string {
  const cls =
    state === "answered" || state === "consumed"
      ? "dc-spill-ok"
      : state === "cancelled" || state === "expired"
        ? "dc-spill-off"
        : "dc-spill-neutral";
  return `<span class="dc-spill ${cls}">${escapeHtml(state)}</span>`;
}

/* ----------------------------------------------------------------- styles */

const STYLES = `
:root {
  color-scheme: light dark;
  --dc-radius: 10px;
  --dc-gap: 14px;
  --dc-border: var(--vscode-panel-border, rgba(128,128,128,0.25));
  --dc-accent: var(--vscode-focusBorder, #3794ff);
}
* { box-sizing: border-box; }
body {
  font-family: var(--vscode-font-family);
  font-size: 13px;
  color: var(--vscode-foreground);
  background: var(--vscode-editor-background);
  margin: 0;
  padding: 0 16px 24px;
}
h1 { font-size: 1.05rem; margin: 0; }
h2 { font-size: 0.95rem; margin: 0; }
h3 { font-size: 0.9rem; margin: 0; }

/* header */
.dc-header {
  position: sticky; top: 0; z-index: 5;
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 12px 0 10px;
  background: var(--vscode-editor-background);
  border-bottom: 1px solid var(--dc-border);
}
.dc-brand { display: flex; align-items: center; gap: 8px; }
.dc-logo {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 6px;
  background: var(--dc-accent); color: #fff; font-size: 12px;
}
.dc-header-right { display: flex; align-items: center; gap: 10px; }

/* status pill */
.dc-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px; border-radius: 999px; font-size: 0.8rem;
  border: 1px solid var(--dc-border);
  background: var(--vscode-badge-background); color: var(--vscode-badge-foreground);
}
.dc-pill-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; opacity: 0.85; }
.dc-pill-ready { color: var(--vscode-testing-iconPassed, #3fb950); }
.dc-pill-pending, .dc-pill-multiple { color: var(--vscode-editorWarning-foreground, #d7a500); }
.dc-pill-unavailable { color: var(--vscode-errorForeground, #f14c4c); }

/* layout */
.dc-main { padding-top: 4px; }
.dc-section { margin: 18px 0; }
.dc-section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.dc-count {
  font-size: 0.72rem; padding: 1px 7px; border-radius: 999px;
  background: var(--vscode-badge-background); color: var(--vscode-badge-foreground);
}
.dc-hint { margin: -2px 0 8px; }

/* cards */
.dc-card {
  border: 1px solid var(--dc-border); border-radius: var(--dc-radius);
  padding: 14px; margin: 10px 0;
  background: var(--vscode-editorWidget-background, transparent);
}
.dc-answer-hero { border-color: var(--dc-accent); box-shadow: 0 0 0 1px var(--dc-accent) inset; }

.dc-empty-card { display: flex; align-items: center; gap: 14px; }
.dc-empty-mark {
  width: 34px; height: 34px; border-radius: 50%; flex: none;
  display: flex; align-items: center; justify-content: center;
  background: var(--vscode-testing-iconPassed, #3fb950); color: #fff; font-size: 18px;
}
.dc-empty-title { margin: 0 0 2px; }

/* chips + badges */
.dc-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.dc-chip {
  font-size: 0.72rem; padding: 2px 8px; border-radius: 6px;
  border: 1px solid var(--dc-border); color: var(--vscode-descriptionForeground);
  font-family: var(--vscode-editor-font-family);
}
.dc-chip-k, .dc-opt-k { text-transform: uppercase; letter-spacing: 0.04em; font-size: 0.62rem; opacity: 0.7; margin-right: 3px; }
.dc-badge {
  font-size: 0.68rem; padding: 1px 7px; border-radius: 999px;
  background: var(--vscode-badge-background); color: var(--vscode-badge-foreground);
}
.dc-badge-rec { background: var(--dc-accent); color: #fff; }
.dc-badge-amber { background: var(--vscode-editorWarning-foreground, #d7a500); color: #1a1a1a; }
.dc-tag { font-size: 0.62rem; padding: 0 6px; border-radius: 4px; border: 1px solid var(--dc-accent); color: var(--dc-accent); }

/* answer */
.dc-answer-title { margin: 6px 0 4px; font-size: 0.98rem; }
.dc-context { white-space: pre-wrap; color: var(--vscode-foreground); margin: 0 0 10px; opacity: 0.92; }
.dc-options { display: flex; flex-direction: column; gap: 8px; }
.dc-option {
  display: flex; gap: 10px; align-items: flex-start;
  border: 1px solid var(--dc-border); border-radius: 8px; padding: 10px; cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
}
.dc-option:hover { border-color: var(--dc-accent); }
.dc-option:has(input:checked) { border-color: var(--dc-accent); background: color-mix(in srgb, var(--dc-accent) 10%, transparent); }
.dc-option input { margin-top: 2px; accent-color: var(--dc-accent); }
.dc-opt-body { display: flex; flex-direction: column; gap: 3px; }
.dc-opt-label { font-weight: 600; }
.dc-opt-desc { font-size: 0.82rem; color: var(--vscode-descriptionForeground); }
.dc-opt-meta { font-size: 0.8rem; color: var(--vscode-descriptionForeground); }
.dc-risk { color: var(--vscode-errorForeground); }

.dc-field { margin-top: 12px; }
.dc-field-label { display: block; font-size: 0.78rem; margin-bottom: 4px; color: var(--vscode-descriptionForeground); }
.dc-required { color: var(--vscode-errorForeground); font-size: 0.72rem; }
textarea {
  width: 100%; box-sizing: border-box; border-radius: 8px; padding: 8px;
  background: var(--vscode-input-background); color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border, var(--dc-border));
  font-family: inherit; resize: vertical;
}
textarea:focus { outline: none; border-color: var(--dc-accent); }

/* buttons */
.dc-actions { margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap; }
.dc-btn { border: 1px solid transparent; border-radius: 7px; padding: 7px 14px; cursor: pointer; font-size: 0.82rem; font-family: inherit; }
.dc-btn:hover { filter: brightness(1.08); }
.dc-btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
.dc-btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
.dc-btn-danger { background: transparent; color: var(--vscode-errorForeground); border-color: var(--vscode-errorForeground); }
.dc-btn-ghost { background: transparent; color: var(--vscode-foreground); border-color: var(--dc-border); }
.dc-back { margin-bottom: 12px; }
.dc-inline-error { color: var(--vscode-errorForeground); margin-top: 10px; font-size: 0.82rem; }

/* tables */
.dc-table-wrap { overflow-x: auto; border: 1px solid var(--dc-border); border-radius: var(--dc-radius); }
.dc-table { border-collapse: collapse; width: 100%; font-size: 0.84rem; }
.dc-table th {
  text-align: left; padding: 8px 12px; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--vscode-descriptionForeground); border-bottom: 1px solid var(--dc-border);
  background: var(--vscode-editorWidget-background, transparent);
}
.dc-table td { padding: 9px 12px; border-bottom: 1px solid var(--dc-border); vertical-align: middle; }
.dc-table tr:last-child td { border-bottom: none; }
.dc-table-click .dc-prow { cursor: pointer; }
.dc-table-click .dc-prow:hover { background: color-mix(in srgb, var(--dc-accent) 8%, transparent); }
.dc-prow:focus { outline: 2px solid var(--dc-accent); outline-offset: -2px; }
.dc-prow-title { width: 55%; }
.dc-prow-go { color: var(--vscode-descriptionForeground); text-align: right; font-size: 1.1rem; }

.dc-change { font-family: var(--vscode-editor-font-family); color: var(--dc-accent); }
.dc-change-lg { font-size: 1rem; }
.dc-cmd { font-family: var(--vscode-editor-font-family); color: var(--vscode-descriptionForeground); }

/* change hero */
.dc-change-hero { border: 1px solid var(--dc-border); border-radius: var(--dc-radius); padding: 14px; margin-bottom: 14px; }
.dc-change-title { margin-bottom: 8px; }
.dc-change-meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.dc-change-cmds { display: inline-flex; gap: 6px; flex-wrap: wrap; }

/* state pills */
.dc-spill { font-size: 0.7rem; padding: 1px 8px; border-radius: 999px; border: 1px solid var(--dc-border); }
.dc-spill-ok { color: var(--vscode-testing-iconPassed, #3fb950); }
.dc-spill-off { color: var(--vscode-errorForeground); }
.dc-spill-neutral { color: var(--vscode-descriptionForeground); }

/* pager */
.dc-pager { display: flex; align-items: center; gap: 12px; justify-content: center; margin-top: 12px; }
.dc-page-label { font-size: 0.8rem; color: var(--vscode-descriptionForeground); }
.dc-btn[disabled] { opacity: 0.4; cursor: default; }

/* health */
.dc-health-card { border-color: var(--vscode-editorWarning-foreground, #d7a500); }
.dc-health-h { margin-bottom: 8px; }
.dc-health-list { margin: 0; padding-left: 18px; }
.dc-health-item { margin: 4px 0; font-size: 0.84rem; }
.dc-health-error { color: var(--vscode-errorForeground); }
.dc-code { font-family: var(--vscode-editor-font-family); background: var(--vscode-textBlockQuote-background); padding: 1px 5px; border-radius: 4px; }

/* resume */
.dc-resume { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }

/* history */
.dc-details { border: 1px solid var(--dc-border); border-radius: var(--dc-radius); padding: 6px 12px; }
.dc-summary { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 6px 0; list-style: none; }
.dc-summary::-webkit-details-marker { display: none; }
.dc-summary::before { content: "▸"; color: var(--vscode-descriptionForeground); }
.dc-details[open] .dc-summary::before { content: "▾"; }

.dc-muted, .dc-empty { color: var(--vscode-descriptionForeground); }
.dc-footer { margin-top: 22px; padding-top: 10px; border-top: 1px solid var(--dc-border); font-size: 0.75rem; color: var(--vscode-descriptionForeground); }

/* decision types */
.dc-chip-type { background: var(--dc-accent); color: #fff; text-transform: none; letter-spacing: 0; }
.dc-type-hint { font-size: 0.78rem; margin: 0 0 8px; }
.dc-option input[type=checkbox] { margin-top: 2px; accent-color: var(--dc-accent); }
.dc-options-confirm { flex-direction: row; flex-wrap: wrap; }
.dc-option-confirm { flex: 1 1 180px; }
.dc-freeform { min-height: 64px; }

/* in-context links */
.dc-links { display: flex; flex-wrap: wrap; gap: 8px; margin: 2px 0 8px; }
.dc-linkbtn { background: none; border: none; padding: 0; cursor: pointer; font-size: 0.78rem; color: var(--vscode-textLink-foreground); font-family: inherit; }
.dc-linkbtn:hover { text-decoration: underline; }

/* history (audit-rich) */
.dc-hist-sub { font-size: 0.72rem; margin-top: 2px; }
.dc-hist-when { white-space: nowrap; font-family: var(--vscode-editor-font-family); font-size: 0.76rem; color: var(--vscode-descriptionForeground); }
.dc-hist-note td { padding-top: 0; border-bottom: 1px solid var(--dc-border); font-size: 0.78rem; color: var(--vscode-descriptionForeground); }

/* expiry */
.dc-expiry {
  display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem;
  padding: 1px 8px; border-radius: 999px; border: 1px solid var(--dc-border);
  color: var(--vscode-descriptionForeground); white-space: nowrap;
}
.dc-expiry-expired { color: var(--vscode-errorForeground); border-color: var(--vscode-errorForeground); font-weight: 600; }
.dc-expired-note {
  margin: 8px 0; padding: 8px 10px; border-radius: 8px; font-size: 0.82rem;
  color: var(--vscode-errorForeground); border: 1px solid var(--vscode-errorForeground);
  background: color-mix(in srgb, var(--vscode-errorForeground) 8%, transparent);
}

/* keyboard hints */
.dc-kbd {
  flex: none; min-width: 17px; text-align: center; align-self: flex-start;
  font-family: var(--vscode-editor-font-family); font-size: 0.68rem; line-height: 15px;
  padding: 0 4px; border: 1px solid var(--dc-border); border-bottom-width: 2px;
  border-radius: 4px; color: var(--vscode-descriptionForeground);
}
`;

/* ----------------------------------------------------------------- script */

const SCRIPT = `
const vscode = acquireVsCodeApi();
function post(msg) { vscode.postMessage(msg); }
function getState() { return vscode.getState() || { drafts: {}, page: 0 }; }
function setState(s) { vscode.setState(s); }

function closestCard(el) {
  while (el && el.getAttribute && !el.getAttribute('data-decision-id')) el = el.parentElement;
  return el && el.getAttribute && el.getAttribute('data-decision-id') ? el : null;
}
function cardError(card, msg) {
  const e = card.querySelector('.dc-inline-error');
  if (e) { e.textContent = msg; e.hidden = false; }
}

/* ---- draft persistence: survive background full-page refreshes ---- */
function esc(v) { return window.CSS && CSS.escape ? CSS.escape(v) : v; }
function saveDraft(card) {
  const id = card.getAttribute('data-decision-id');
  if (!id) return;
  const radio = card.querySelector('input[type=radio]:checked');
  const checks = Array.prototype.slice.call(card.querySelectorAll('input[type=checkbox]:checked')).map(function (c) { return c.value; });
  const ff = card.querySelector('.dc-freeform');
  const ta = card.querySelector('.dc-rationale');
  const s = getState();
  s.drafts = s.drafts || {};
  s.drafts[id] = {
    optionId: radio ? radio.value : null,
    optionIds: checks,
    freeform: ff ? ff.value : '',
    rationale: ta ? ta.value : '',
  };
  setState(s);
}
function restoreDrafts() {
  const s = getState();
  const drafts = s.drafts || {};
  document.querySelectorAll('.dc-answer[data-decision-id]').forEach(function (card) {
    const id = card.getAttribute('data-decision-id');
    const d = drafts[id];
    if (!d) return;
    if (d.optionId) {
      const input = card.querySelector('input[type=radio][value="' + esc(d.optionId) + '"]');
      if (input) input.checked = true;
    }
    if (d.optionIds && d.optionIds.length) {
      d.optionIds.forEach(function (v) {
        const input = card.querySelector('input[type=checkbox][value="' + esc(v) + '"]');
        if (input) input.checked = true;
      });
    }
    const ff = card.querySelector('.dc-freeform');
    if (ff && typeof d.freeform === 'string' && d.freeform.length) ff.value = d.freeform;
    const ta = card.querySelector('.dc-rationale');
    if (ta && typeof d.rationale === 'string' && d.rationale.length) ta.value = d.rationale;
  });
}
function clearDraft(id) {
  const s = getState();
  if (s.drafts && s.drafts[id]) { delete s.drafts[id]; setState(s); }
}

/* ---- client-side paging for the pending table ---- */
function applyPaging() {
  const pager = document.querySelector('.dc-pager');
  const rows = Array.prototype.slice.call(document.querySelectorAll('.dc-prow'));
  if (rows.length === 0) return;
  const size = pager ? parseInt(pager.getAttribute('data-page-size') || '6', 10) : rows.length;
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const s = getState();
  let page = Math.min(Math.max(0, s.page || 0), pages - 1);
  s.page = page; setState(s);
  rows.forEach(function (r, i) {
    const p = Math.floor(i / size);
    r.style.display = p === page ? '' : 'none';
  });
  if (pager) {
    const label = pager.querySelector('.dc-page-label');
    if (label) label.textContent = 'Page ' + (page + 1) + ' of ' + pages;
    const prev = pager.querySelector('[data-action=page-prev]');
    const next = pager.querySelector('[data-action=page-next]');
    if (prev) prev.disabled = page <= 0;
    if (next) next.disabled = page >= pages - 1;
  }
}
function changePage(delta) {
  const s = getState();
  s.page = Math.max(0, (s.page || 0) + delta);
  setState(s);
  applyPaging();
}

/* ---- input tracking ---- */
document.addEventListener('input', function (ev) {
  const card = closestCard(ev.target);
  if (card && card.classList.contains('dc-answer')) saveDraft(card);
});
document.addEventListener('change', function (ev) {
  const card = closestCard(ev.target);
  if (card && card.classList.contains('dc-answer')) saveDraft(card);
});

/* ---- click routing ---- */
document.addEventListener('click', function (ev) {
  const t = ev.target instanceof HTMLElement ? ev.target.closest('[data-action]') : null;
  if (!t) return;
  const action = t.getAttribute('data-action');
  if (action === 'refresh') { post({ type: 'refresh' }); return; }
  if (action === 'back') { post({ type: 'backToDashboard' }); return; }
  if (action === 'select-change') { post({ type: 'selectChange', changeKey: t.getAttribute('data-change-key') }); return; }
  if (action === 'copy-resume') { post({ type: 'copyResumeInstruction', commandRunId: t.getAttribute('data-command-run-id') }); return; }
  if (action === 'page-prev') { changePage(-1); return; }
  if (action === 'page-next') { changePage(1); return; }
  if (action === 'open-artifact') {
    post({ type: 'openArtifact', kind: t.getAttribute('data-open-kind'), decisionId: t.getAttribute('data-open-decision-id'), changeId: t.getAttribute('data-open-change-id') });
    return;
  }

  const card = closestCard(t);
  if (!card) return;
  const decisionId = card.getAttribute('data-decision-id');
  if (action === 'cancel') { post({ type: 'cancelDecision', decisionId: decisionId }); return; }
  if (action === 'submit') { submitCard(card); return; }
});

/* ---- submit (shared by click + keyboard) ---- */
function submitCard(card) {
  if (!card || !card.classList.contains('dc-answer')) return;
  const decisionId = card.getAttribute('data-decision-id');
  const type = card.getAttribute('data-interaction-type');
  const rt = card.querySelector('.dc-rationale');
  const rationale = rt ? rt.value : '';
  const msg = { type: 'answerDecision', decisionId: decisionId, rationale: rationale };

  if (type === 'freeform-input') {
    const ff = card.querySelector('.dc-freeform');
    const val = ff ? ff.value : '';
    if (val.trim().length === 0) { cardError(card, 'Enter your answer before submitting.'); return; }
    msg.freeformValue = val;
  } else if (type === 'multi-choice-decision') {
    const checked = Array.prototype.slice.call(card.querySelectorAll('input[type=checkbox]:checked')).map(function (c) { return c.value; });
    if (checked.length === 0) { cardError(card, 'Select at least one option before submitting.'); return; }
    msg.selectedOptionIds = checked;
  } else {
    const checked = card.querySelector('input[type=radio]:checked');
    if (!checked) { cardError(card, 'Select an option before submitting.'); return; }
    msg.selectedOptionId = checked.value;
  }

  const requires = card.getAttribute('data-requires-rationale') === '1';
  if (requires && rationale.trim().length === 0) { cardError(card, 'A rationale is required for this decision.'); return; }
  clearDraft(decisionId);
  post(msg);
}

/* ---- keyboard answering ---- */
function primaryCard() {
  const a = document.activeElement;
  const c = a ? closestCard(a) : null;
  if (c && c.classList.contains('dc-answer')) return c;
  return document.querySelector('.dc-answer[data-decision-id]');
}
function selectOptionByIndex(card, n) {
  const checks = card.querySelectorAll('input[type=checkbox].dc-check');
  if (checks.length) {
    const c = checks[n - 1];
    if (!c) return false;
    c.checked = !c.checked; saveDraft(card); return true;
  }
  const radios = card.querySelectorAll('input[type=radio]');
  const r = radios[n - 1];
  if (!r) return false;
  r.checked = true; saveDraft(card); return true;
}
document.addEventListener('keydown', function (ev) {
  const ae = document.activeElement;
  const tag = ae ? ae.tagName : '';
  const typing = tag === 'TEXTAREA' || (tag === 'INPUT' && ae.type === 'text');

  // Enter/Space activates a focused pending-table row.
  if (ev.key === 'Enter' || ev.key === ' ') {
    const row = ev.target instanceof HTMLElement ? ev.target.closest('.dc-prow') : null;
    if (row) { ev.preventDefault(); post({ type: 'selectChange', changeKey: row.getAttribute('data-change-key') }); return; }
  }

  // 1-9 selects an option in the primary answer card (not while typing).
  if (!typing && ev.key >= '1' && ev.key <= '9') {
    const card = primaryCard();
    if (card && selectOptionByIndex(card, parseInt(ev.key, 10))) ev.preventDefault();
    return;
  }

  // Enter submits the primary card: Ctrl/Cmd+Enter anywhere, or plain Enter when
  // not typing in a text field and not on a button (which fires its own click).
  if (ev.key === 'Enter' && tag !== 'BUTTON' && ((ev.ctrlKey || ev.metaKey) || !typing)) {
    const card = primaryCard();
    if (card) { ev.preventDefault(); submitCard(card); }
  }
});

/* ---- live expiry countdown (no server re-render needed) ---- */
function humanize(ms) {
  const s = Math.floor(Math.abs(ms) / 1000);
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (d > 0) return d + 'd ' + h + 'h';
  if (h > 0) return h + 'h ' + m + 'm';
  if (m > 0) return m + 'm';
  return sec + 's';
}
function tickExpiry() {
  const now = Date.now();
  document.querySelectorAll('.dc-expiry[data-expires-at]').forEach(function (el) {
    const at = Date.parse(el.getAttribute('data-expires-at'));
    if (isNaN(at)) return;
    const rem = at - now;
    const expired = rem <= 0;
    el.classList.toggle('dc-expiry-expired', expired);
    const txt = el.querySelector('.dc-expiry-text');
    if (txt) txt.textContent = expired ? ('expired ' + humanize(rem) + ' ago') : ('expires in ' + humanize(rem));
  });
}

restoreDrafts();
applyPaging();
tickExpiry();
setInterval(tickExpiry, 30000);
`;
