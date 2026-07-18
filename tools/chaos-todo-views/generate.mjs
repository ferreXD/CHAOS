#!/usr/bin/env node
// CHAOS Todo dashboard generator.
// Reads the durable source of truth (.chaos/todo/items/*.md + index.md) and emits a single
// self-contained HTML dashboard (.chaos/todo/views/index.html). Deterministic: same inputs -> byte-identical output.
//
// Usage:
//   node tools/chaos-todo-views/generate.mjs
//   node tools/chaos-todo-views/generate.mjs --items <dir> --index <file> --out <file> --now <iso>
//
// Exit codes: 0 ok, 1 error.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseItem, parseIndex } from './lib/parse.mjs';
import { computeDashboard } from './lib/compute.mjs';
import { renderPage } from './lib/template.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..', '..');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq !== -1) out[a.slice(2, eq)] = a.slice(eq + 1);
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) out[a.slice(2)] = argv[++i];
      else out[a.slice(2)] = true;
    }
  }
  return out;
}

function maxTimestamp(items) {
  let max = '';
  for (const it of items) {
    for (const t of [it.closedAt, it.lastSeenAt, it.createdAt]) {
      if (t && t > max) max = t;
    }
  }
  return max || null;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const itemsDir = resolve(repoRoot, args.items || '.chaos/todo/items');
  const indexFile = resolve(repoRoot, args.index || '.chaos/todo/index.md');
  const outFile = resolve(repoRoot, args.out || '.chaos/todo/views/index.html');

  if (!existsSync(itemsDir)) {
    console.error(`[chaos-todo-views] items dir not found: ${itemsDir}`);
    process.exit(1);
  }

  const files = readdirSync(itemsDir).filter((f) => f.endsWith('.md')).sort();
  const items = files.map((f) => parseItem(readFileSync(join(itemsDir, f), 'utf8'), f));

  const indexMd = existsSync(indexFile) ? readFileSync(indexFile, 'utf8') : '';
  const index = parseIndex(indexMd);

  const generatedAt = args.now || maxTimestamp(items) || new Date().toISOString();

  const data = {
    generatedAt,
    sourceCommand: args['source-command'] || 'chaos:todo --refresh',
    context: index.context,
    provenance: index.provenance,
    dedup: index.dedup,
    candidates: index.candidates,
    items,
  };

  const html = renderPage(data);
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, html, 'utf8');

  const d = computeDashboard(items);
  const rel = outFile.replace(repoRoot + '\\', '').replace(repoRoot + '/', '');
  console.log(`[chaos-todo-views] wrote ${rel}`);
  console.log(
    `  ${d.total} items · ${d.open} open / ${d.done} done (${d.donePct}%) · ` +
      `${d.openBlockers} open blockers · ${d.staleCount} stale · ${d.needsDecisionCount} needs-decision`
  );
  console.log('  Recommended next:');
  d.recommended.forEach((it, i) => console.log(`   ${i + 1}. [${it.priority}] ${it.title}`));
}

main();
