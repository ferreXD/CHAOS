/** HTML escaping + webview safety tests (cases 6, 13-15 security-sensitive). */

import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, escapeAttr, escapeJsonForScript } from "../src/decisionCenter/htmlEscape.ts";
import { renderDecisionCenter } from "../src/decisionCenter/decisionCenterHtml.ts";
import { buildProjection } from "../src/decisionCenter/decisionViewModel.ts";
import { decisionFixture, projectionInput } from "./helpers.ts";

test("6. escapeHtml neutralises HTML/script injection", () => {
  const evil = `<script>alert('x')</script>`;
  const escaped = escapeHtml(evil);
  assert.ok(!escaped.includes("<script>"));
  assert.ok(escaped.includes("&lt;script&gt;"));
  assert.equal(escapeAttr(`" onmouseover="alert(1)`), "&quot; onmouseover=&quot;alert(1)");
});

test("escapeJsonForScript neutralises closing-script sequences", () => {
  const out = escapeJsonForScript("</script><script>");
  assert.ok(!out.includes("</script>"));
  assert.ok(out.includes("\\u003c"));
});

test("6/12. rendered HTML escapes malicious decision content", () => {
  const d = decisionFixture({
    title: `<img src=x onerror=alert(1)>`,
    context: `</style><script>alert(2)</script>`,
    options: [
      { id: "opt", label: `<b>bad</b>`, description: null, consequence: null, risk: null, recommended: true },
    ],
    recommendedOptionId: "opt",
  });
  const projection = buildProjection(projectionInput({ decisions: [d] }));
  const html = renderDecisionCenter(projection, { nonce: "TESTNONCE" });

  assert.ok(!html.includes("<img src=x onerror=alert(1)>"));
  assert.ok(!html.includes("<script>alert(2)</script>"));
  assert.ok(!html.includes("<b>bad</b>"));
  assert.ok(html.includes("&lt;img src=x"));
});

test("13. rendered HTML uses strict CSP and no external assets (case 15)", () => {
  const projection = buildProjection(projectionInput({ decisions: [decisionFixture()] }));
  const html = renderDecisionCenter(projection, { nonce: "TESTNONCE" });

  assert.ok(html.includes("Content-Security-Policy"));
  assert.ok(html.includes("default-src 'none'"));
  assert.ok(html.includes("script-src 'nonce-TESTNONCE'"));
  // No external/remote references of any kind.
  assert.ok(!/https?:\/\//i.test(html), "must not contain http(s) URLs");
  assert.ok(!/\/\/cdn/i.test(html), "must not reference a CDN");
  assert.ok(!/src\s*=\s*["']https?:/i.test(html));
  // Inline script/style must carry the nonce.
  assert.ok(html.includes('<script nonce="TESTNONCE">'));
  assert.ok(html.includes('<style nonce="TESTNONCE">'));
});

test("health warnings render for unavailable runtime", () => {
  const projection = buildProjection(projectionInput({ rootExists: false }));
  const html = renderDecisionCenter(projection, { nonce: "N" });
  assert.ok(html.includes("Runtime Health Warnings"));
  assert.ok(html.includes("CHAOS: runtime unavailable"));
});

test("dashboard renders a clickable pending table with change routing", () => {
  const a = decisionFixture({ decisionId: "DEC-a", changeId: "change-a" });
  const b = decisionFixture({ decisionId: "DEC-b", changeId: "change-b" });
  const projection = buildProjection(projectionInput({ decisions: [a, b] }));
  const html = renderDecisionCenter(projection, { nonce: "N" });

  assert.ok(html.includes("Pending decisions"));
  assert.ok(html.includes('data-action="select-change"'));
  assert.ok(html.includes("change-a"));
  assert.ok(html.includes("change-b"));
});

test("renders multi-choice as checkboxes and freeform as a text field", () => {
  const multi = buildProjection(projectionInput({ decisions: [decisionFixture({ interactionType: "multi-choice-decision" })] }));
  const multiHtml = renderDecisionCenter(multi, { nonce: "N" });
  assert.ok(multiHtml.includes('type="checkbox"'));
  assert.ok(multiHtml.includes('data-interaction-type="multi-choice-decision"'));

  const free = buildProjection(projectionInput({ decisions: [decisionFixture({ interactionType: "freeform-input" })] }));
  const freeHtml = renderDecisionCenter(free, { nonce: "N" });
  assert.ok(freeHtml.includes('class="dc-freeform"'));
  assert.ok(!freeHtml.includes('type="radio"'), "freeform must not render option radios");
});

test("renders a live expiry badge and an expired note", () => {
  const future = renderDecisionCenter(
    buildProjection(projectionInput({ decisions: [decisionFixture({ expiresAt: "2026-07-07T05:00:00.000Z" })] })),
    { nonce: "N" },
  );
  assert.ok(future.includes('class="dc-expiry"'));
  assert.ok(future.includes('data-expires-at="2026-07-07T05:00:00.000Z"'));
  // Element marker (not the CSS class definition, which is always present).
  assert.ok(!future.includes('<div class="dc-expired-note">'));

  const past = renderDecisionCenter(
    buildProjection(projectionInput({ decisions: [decisionFixture({ expiresAt: "2026-07-06T23:00:00.000Z" })] })),
    { nonce: "N" },
  );
  assert.ok(past.includes('class="dc-expiry dc-expiry-expired"'));
  assert.ok(past.includes('<div class="dc-expired-note">'));
});

test("renders keyboard hints and the keyboard/countdown client script", () => {
  const html = renderDecisionCenter(
    buildProjection(projectionInput({ decisions: [decisionFixture()] })),
    { nonce: "N" },
  );
  assert.ok(html.includes('class="dc-kbd"'));
  assert.ok(html.includes("function submitCard"));
  assert.ok(html.includes("function tickExpiry"));
  assert.ok(html.includes("selectOptionByIndex"));
});

test("renders in-context open-artifact links", () => {
  const projection = buildProjection(projectionInput({ decisions: [decisionFixture({ changeId: "change-1" })] }));
  const html = renderDecisionCenter(projection, { nonce: "N" });
  assert.ok(html.includes('data-action="open-artifact"'));
  assert.ok(html.includes('data-open-kind="decision"'));
  assert.ok(html.includes('data-open-kind="change"'));
});

test("change view renders answerable cards + a back button and stays escaped", () => {
  const d = decisionFixture({
    decisionId: "DEC-x",
    changeId: "change-x",
    title: `<img src=x onerror=alert(1)>`,
  });
  const projection = buildProjection(projectionInput({ decisions: [d] }));
  const group = projection.changeGroups[0]!;
  const html = renderDecisionCenter(projection, {
    nonce: "N",
    view: { kind: "change", changeKey: group.key },
  });

  assert.ok(html.includes("Back to dashboard"));
  assert.ok(html.includes("change-x"));
  assert.ok(html.includes('data-action="submit"'));
  // malicious content is still neutralised in the change view.
  assert.ok(!html.includes("<img src=x onerror=alert(1)>"));
  assert.ok(html.includes("&lt;img src=x"));
});
