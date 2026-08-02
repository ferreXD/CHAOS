#!/usr/bin/env node
// CHAOS Claude <-> Copilot surface parity check.
//
// Compares the two agent surfaces that CHAOS ships — Claude Code (under .claude/) and
// GitHub Copilot (under .github/) — and reports structural drift so it is detectable in
// review and CI instead of only in prose.
//
// Dimensions checked:
//   1. Command/prompt set   .claude/commands/<n>.md   <-> .github/prompts/<n>.prompt.md
//   2. Skill set            .claude/skills/<n>/        <-> .github/skills/<n>/
//   3. Agent set            .claude/agents/<n>.md      <-> .github/agents/<n>.agent.md
//   4. Per-skill files      every *.md (SKILL.md + reference/ contracts) under each shared skill
//   5. Prompt -> agent link  Copilot prompt frontmatter `agent:` resolves on BOTH surfaces
//   6. CONTENT parity       shared skill files + agent/command bodies compared line-by-line
//                           after normalization (.claude/skills -> .github/skills path
//                           transform; frontmatter stripped for agents/commands). Every
//                           differing line must match a declared deviation pattern
//                           (contentParity in parity-exceptions.json) — otherwise it is
//                           drift. This catches one surface being edited (or clobbered)
//                           without the other, which the set checks (1-5) cannot see.
//                           Known limitation: lines mentioning "Claude"/"Copilot" are
//                           surface-specific wording by doctrine and always accepted, so
//                           drift inside such lines is not detected.
//
// Intentional asymmetries are declared in parity-exceptions.json (self-documenting, reviewable).
// Anything that differs and is NOT declared there is reported as drift.
//
// Usage:
//   node tools/chaos-parity-check/check.mjs            # human report
//   node tools/chaos-parity-check/check.mjs --json     # machine-readable report
//   node tools/chaos-parity-check/check.mjs --strict   # stale/needless exceptions also fail
//   node tools/chaos-parity-check/check.mjs --exceptions <file>
//   node tools/chaos-parity-check/check.mjs --root <repoRoot>
//   node tools/chaos-parity-check/check.mjs --help
//
// Exit codes: 0 parity OK · 1 drift detected · 2 tool/config error.
//
// Requires Node >= 18. Zero npm dependencies. Deterministic (sorted output, no wall clock).

import { readdirSync, readFileSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultRoot = resolve(scriptDir, '..', '..');

// ---------------------------------------------------------------------------- args / fs helpers

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq !== -1) out[a.slice(2, eq)] = a.slice(eq + 1);
      else if (argv[i + 1] && !argv[i + 1].startsWith('--')) out[a.slice(2)] = argv[++i];
      else out[a.slice(2)] = true;
    } else out._.push(a);
  }
  return out;
}

const toPosix = (p) => p.split('\\').join('/');
const relPosix = (root, p) => toPosix(relative(root, p));
const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };
const isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } };

function listFileNames(dir, filterFn) {
  if (!isDir(dir)) return [];
  return readdirSync(dir).filter((f) => isFile(join(dir, f)) && filterFn(f));
}

function listSubdirs(dir) {
  if (!isDir(dir)) return [];
  return readdirSync(dir).filter((name) => isDir(join(dir, name)));
}

function listMdFilesRecursive(dir) {
  const out = [];
  const walk = (cur, prefix) => {
    for (const name of readdirSync(cur)) {
      const full = join(cur, name);
      if (isDir(full)) walk(full, prefix ? `${prefix}/${name}` : name);
      else if (isFile(full) && name.endsWith('.md')) out.push(prefix ? `${prefix}/${name}` : name);
    }
  };
  if (isDir(dir)) walk(dir, '');
  return out.sort();
}

const stripSuffix = (name, suffix) => (name.endsWith(suffix) ? name.slice(0, -suffix.length) : name);
const exNames = (list) => (list || []).map((e) => (typeof e === 'string' ? e : e.name));

function readFrontmatterField(filePath, field) {
  let text;
  try { text = readFileSync(filePath, 'utf8'); } catch { return null; }
  const m = text.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const re = new RegExp(`^${field}\\s*:(.*)$`);
  for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(re);
    if (mm) return mm[1].trim().replace(/^['"]|['"]$/g, '').trim() || null;
  }
  return null;
}

// ---------------------------------------------------------------------------- comparisons

function compareSet(kind, claudeNames, copilotNames, ex) {
  const claude = new Set(claudeNames);
  const copilot = new Set(copilotNames);
  const exClaudeOnly = new Set(exNames(ex.claudeOnly));
  const exCopilotOnly = new Set(exNames(ex.copilotOnly));

  const shared = [...claude].filter((n) => copilot.has(n)).sort();
  const missingOnCopilot = [...claude].filter((n) => !copilot.has(n) && !exClaudeOnly.has(n)).sort();
  const missingOnClaude = [...copilot].filter((n) => !claude.has(n) && !exCopilotOnly.has(n)).sort();
  const declaredCopilotOnly = [...exCopilotOnly].filter((n) => copilot.has(n) && !claude.has(n)).sort();
  const declaredClaudeOnly = [...exClaudeOnly].filter((n) => claude.has(n) && !copilot.has(n)).sort();

  const staleExceptions = [];
  for (const n of exClaudeOnly) {
    if (!claude.has(n)) staleExceptions.push({ name: n, why: `declared claudeOnly but ${n} is not present on Claude` });
    else if (copilot.has(n)) staleExceptions.push({ name: n, why: `declared claudeOnly but ${n} now also exists on Copilot` });
  }
  for (const n of exCopilotOnly) {
    if (!copilot.has(n)) staleExceptions.push({ name: n, why: `declared copilotOnly but ${n} is not present on Copilot` });
    else if (claude.has(n)) staleExceptions.push({ name: n, why: `declared copilotOnly but ${n} now also exists on Claude` });
  }

  return { kind, shared, missingOnCopilot, missingOnClaude, declaredCopilotOnly, declaredClaudeOnly, staleExceptions };
}

// The parity contract surface of a skill is SKILL.md plus everything under reference/.
// Incidental root-level dev notes (e.g. PATCH-SUMMARY.md) are development history, not part
// of what the agent reads, so they are intentionally out of scope.
const isContractFile = (relPath) => relPath === 'SKILL.md' || relPath.startsWith('reference/');

function compareSkillFiles(claudeSkillsDir, copilotSkillsDir, sharedSkillDirs, ignore) {
  const ignoreSet = new Set(ignore || []);
  const drift = [];
  for (const skill of sharedSkillDirs) {
    const cFiles = new Set(listMdFilesRecursive(join(claudeSkillsDir, skill)).filter(isContractFile));
    const gFiles = new Set(listMdFilesRecursive(join(copilotSkillsDir, skill)).filter(isContractFile));
    const missOnCopilot = [...cFiles].filter((f) => !gFiles.has(f) && !ignoreSet.has(`${skill}/${f}`)).sort();
    const missOnClaude = [...gFiles].filter((f) => !cFiles.has(f) && !ignoreSet.has(`${skill}/${f}`)).sort();
    if (missOnCopilot.length || missOnClaude.length) drift.push({ skill, missOnCopilot, missOnClaude });
  }
  return drift;
}

// ---------------------------------------------------------------------------- content parity

const DEFAULT_ALLOWED_LINE_PATTERNS = [
  // Surface-specific wording is the whole point of the mirror deviations.
  '[Cc]opilot',
  'Claude',
  // Prompt-file invocation lines on the Copilot side / slash-command lines on the Claude side.
  '\\.prompt\\.md',
  '/(chaos|opsx)[-:]',
];

function stripFrontmatterBlock(text) {
  return text.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

function normalizeLines(text, side, stripFm) {
  let t = text.replace(/^﻿/, '');
  if (stripFm) t = stripFrontmatterBlock(t);
  t = t.replace(/\r\n/g, '\n');
  if (side === 'claude') t = t.split('.claude/skills').join('.github/skills');
  return t.split('\n').map((l) => l.replace(/\s+$/, ''));
}

// LCS-based line diff. Returns lines present on only one side.
function diffLines(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const aOnly = [], bOnly = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { aOnly.push({ line: i + 1, text: a[i] }); i++; }
    else { bOnly.push({ line: j + 1, text: b[j] }); j++; }
  }
  while (i < n) { aOnly.push({ line: i + 1, text: a[i] }); i++; }
  while (j < m) { bOnly.push({ line: j + 1, text: b[j] }); j++; }
  return { aOnly, bOnly };
}

// Stable fingerprint of a pair's undeclared diff (line numbers excluded so unrelated edits
// elsewhere in the file do not shift the signature).
function driftHash(claudeOnly, copilotOnly) {
  const h = createHash('sha256');
  for (const l of claudeOnly) h.update(`C ${l.text}\n`);
  h.update('--\n');
  for (const l of copilotOnly) h.update(`G ${l.text}\n`);
  return h.digest('hex').slice(0, 16);
}

// pairs: [{ id, claudePath, copilotPath, stripFm }]
// baseline: { "<pairId>": { claudeOnly, copilotOnly, hash } } — known LEGACY drift, tolerated
// as long as its signature is unchanged (ratchet: entries are removed as pairs get reconciled,
// never silently grown).
function compareContent(pairs, cp, baseline) {
  const globalRes = (cp.allowedLinePatterns || []).map((p) => new RegExp(p));
  const perFile = cp.perFile || {};
  const drift = [];        // hard failures (new drift, or legacy drift whose signature changed)
  const legacy = [];       // baseline-tolerated pairs (unchanged signature)
  const staleBaseline = []; // baseline entries whose pair is now clean or gone
  const nextBaseline = {}; // what --update-content-baseline would write
  const perFileUse = new Map();
  const seenIds = new Set();
  for (const pair of pairs) {
    if (!isFile(pair.claudePath) || !isFile(pair.copilotPath)) continue; // set checks own missing files
    seenIds.add(pair.id);
    const fileRes = (perFile[pair.id] || []).map((p) => new RegExp(p));
    const used = new Set();
    const accept = (text) => {
      if (text.trim() === '') return true; // pure formatting
      if (globalRes.some((re) => re.test(text))) return true;
      for (let k = 0; k < fileRes.length; k++) {
        if (fileRes[k].test(text)) { used.add((perFile[pair.id] || [])[k]); return true; }
      }
      return false;
    };
    const a = normalizeLines(readFileSync(pair.claudePath, 'utf8'), 'claude', pair.stripFm);
    const b = normalizeLines(readFileSync(pair.copilotPath, 'utf8'), 'copilot', pair.stripFm);
    const { aOnly, bOnly } = diffLines(a, b);
    const claudeOnly = aOnly.filter((l) => !accept(l.text));
    const copilotOnly = bOnly.filter((l) => !accept(l.text));
    if (perFile[pair.id]) perFileUse.set(pair.id, used);
    const base = baseline[pair.id];
    if (!claudeOnly.length && !copilotOnly.length) {
      if (base) staleBaseline.push({ id: pair.id, why: 'pair is now clean — remove its baseline entry (ratchet down)' });
      continue;
    }
    const hash = driftHash(claudeOnly, copilotOnly);
    nextBaseline[pair.id] = { claudeOnly: claudeOnly.length, copilotOnly: copilotOnly.length, hash };
    if (base && base.hash === hash) {
      legacy.push({ id: pair.id, claudeOnly: claudeOnly.length, copilotOnly: copilotOnly.length });
    } else {
      drift.push({ id: pair.id, claudeOnly, copilotOnly, baselined: !!base });
    }
  }
  for (const id of Object.keys(baseline)) {
    if (!seenIds.has(id)) staleBaseline.push({ id, why: 'baseline entry for a pair that was not compared (file missing or renamed)' });
  }
  const stalePerFile = [];
  for (const [id, patterns] of Object.entries(perFile)) {
    const used = perFileUse.get(id);
    if (used === undefined) { stalePerFile.push({ id, why: 'perFile content exception for a pair that was not compared (file missing or renamed)' }); continue; }
    for (const p of patterns) if (!used.has(p)) stalePerFile.push({ id, why: `perFile pattern ${JSON.stringify(p)} matched no differing line` });
  }
  return { drift, legacy, staleBaseline, stalePerFile, nextBaseline };
}

function checkLinkage(promptsDir, claudeAgents, copilotAgents, copilotOnlyCommands) {
  const claudeSet = new Set(claudeAgents);
  const copilotSet = new Set(copilotAgents);
  const skip = new Set(copilotOnlyCommands);
  const errors = [];
  for (const f of listFileNames(promptsDir, (n) => n.endsWith('.prompt.md'))) {
    const cmd = stripSuffix(f, '.prompt.md');
    const agent = readFrontmatterField(join(promptsDir, f), 'agent');
    if (!agent || agent === 'agent') continue; // generic placeholder / no specific agent
    const missCopilot = !copilotSet.has(agent);
    const missClaude = !claudeSet.has(agent);
    if (missCopilot || missClaude) errors.push({ prompt: f, cmd, agent, missCopilot, missClaude, exempt: skip.has(cmd) });
  }
  return errors;
}

// ---------------------------------------------------------------------------- reporting

function pad(n) { return String(n).padStart(2, ' '); }

function printSet(lines, r, claudeLabel, copilotLabel) {
  lines.push(`${r.kind}  (${claudeLabel}  <->  ${copilotLabel})`);
  const bits = [`${r.shared.length} shared`, `${r.missingOnCopilot.length + r.missingOnClaude.length} drift`];
  if (r.declaredCopilotOnly.length) bits.push(`${r.declaredCopilotOnly.length} declared Copilot-only`);
  if (r.declaredClaudeOnly.length) bits.push(`${r.declaredClaudeOnly.length} declared Claude-only`);
  lines.push(`  ${bits.join(' · ')}`);
  for (const n of r.missingOnCopilot) lines.push(`  DRIFT  \`${n}\` on Claude but MISSING on Copilot`);
  for (const n of r.missingOnClaude) lines.push(`  DRIFT  \`${n}\` on Copilot but MISSING on Claude`);
  for (const s of r.staleExceptions) lines.push(`  WARN   stale exception: ${s.why}`);
  if (!r.missingOnCopilot.length && !r.missingOnClaude.length) lines.push('  OK');
  lines.push('');
}

// ---------------------------------------------------------------------------- main

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log([
      'CHAOS Claude <-> Copilot surface parity check',
      '',
      'Usage:',
      '  node tools/chaos-parity-check/check.mjs            human report',
      '  node tools/chaos-parity-check/check.mjs --json     machine-readable report',
      '  node tools/chaos-parity-check/check.mjs --strict   stale/needless exceptions also fail',
      '  node tools/chaos-parity-check/check.mjs --no-content  skip dimension 6 (content parity)',
      '  node tools/chaos-parity-check/check.mjs --update-content-baseline  regenerate the legacy-drift baseline (ratchet)',
      '  node tools/chaos-parity-check/check.mjs --exceptions <file>',
      '  node tools/chaos-parity-check/check.mjs --root <repoRoot>',
      '',
      'Exit codes: 0 parity OK · 1 drift detected · 2 tool/config error.',
    ].join('\n'));
    process.exit(0);
  }

  const root = resolve(args.root || defaultRoot);
  const exFile = args.exceptions ? resolve(root, args.exceptions) : join(scriptDir, 'parity-exceptions.json');

  let ex = { commands: {}, skills: {}, agents: {}, referenceFiles: { ignore: [] } };
  if (existsSync(exFile)) {
    try { ex = JSON.parse(readFileSync(exFile, 'utf8')); }
    catch (e) { console.error(`[parity] cannot parse exceptions file ${relPosix(root, exFile)}: ${e.message}`); process.exit(2); }
  }
  ex.commands ||= {}; ex.skills ||= {}; ex.agents ||= {}; ex.referenceFiles ||= { ignore: [] };

  const dirs = {
    claudeCommands: join(root, '.claude', 'commands'),
    copilotPrompts: join(root, '.github', 'prompts'),
    claudeSkills: join(root, '.claude', 'skills'),
    copilotSkills: join(root, '.github', 'skills'),
    claudeAgents: join(root, '.claude', 'agents'),
    copilotAgents: join(root, '.github', 'agents'),
  };

  const missingDirs = Object.entries(dirs).filter(([, p]) => !isDir(p)).map(([k]) => k);
  if (missingDirs.length) {
    console.error(`[parity] required surface directories not found: ${missingDirs.join(', ')} (root: ${root})`);
    process.exit(2);
  }

  // 1. commands / prompts
  const claudeCommandNames = listFileNames(dirs.claudeCommands, (f) => f.endsWith('.md')).map((f) => stripSuffix(f, '.md'));
  const copilotPromptNames = listFileNames(dirs.copilotPrompts, (f) => f.endsWith('.prompt.md')).map((f) => stripSuffix(f, '.prompt.md'));
  const commandsResult = compareSet('Commands', claudeCommandNames, copilotPromptNames, ex.commands);

  // 2. skills
  const claudeSkillDirs = listSubdirs(dirs.claudeSkills);
  const copilotSkillDirs = listSubdirs(dirs.copilotSkills);
  const skillsResult = compareSet('Skills', claudeSkillDirs, copilotSkillDirs, ex.skills);

  // 3. agents
  const claudeAgentNames = listFileNames(dirs.claudeAgents, (f) => f.endsWith('.md')).map((f) => stripSuffix(f, '.md'));
  const copilotAgentNames = listFileNames(dirs.copilotAgents, (f) => f.endsWith('.agent.md')).map((f) => stripSuffix(f, '.agent.md'));
  const agentsResult = compareSet('Agents', claudeAgentNames, copilotAgentNames, ex.agents);

  // 4. per-skill file/contract parity (only for skill dirs present on both surfaces)
  const sharedSkillDirs = claudeSkillDirs.filter((d) => copilotSkillDirs.includes(d)).sort();
  const refDrift = compareSkillFiles(dirs.claudeSkills, dirs.copilotSkills, sharedSkillDirs, ex.referenceFiles.ignore);

  // 5. prompt -> agent linkage
  const linkage = checkLinkage(dirs.copilotPrompts, claudeAgentNames, copilotAgentNames, exNames(ex.commands.copilotOnly));

  // 6. content parity (skills verbatim modulo path transform; agents/commands body-only)
  const cp = {
    allowedLinePatterns: [
      ...DEFAULT_ALLOWED_LINE_PATTERNS,
      ...((ex.contentParity && ex.contentParity.allowedLinePatterns) || []),
    ],
    perFile: (ex.contentParity && ex.contentParity.perFile) || {},
  };
  const contentPairs = [];
  if (!args['no-content']) {
    const ignoreSet = new Set(ex.referenceFiles.ignore || []);
    for (const skill of sharedSkillDirs) {
      const cFiles = listMdFilesRecursive(join(dirs.claudeSkills, skill)).filter(isContractFile);
      const gFiles = new Set(listMdFilesRecursive(join(dirs.copilotSkills, skill)).filter(isContractFile));
      for (const f of cFiles) {
        if (!gFiles.has(f) || ignoreSet.has(`${skill}/${f}`)) continue;
        contentPairs.push({
          id: `skills/${skill}/${f}`,
          claudePath: join(dirs.claudeSkills, skill, ...f.split('/')),
          copilotPath: join(dirs.copilotSkills, skill, ...f.split('/')),
          stripFm: false,
        });
      }
    }
    for (const agent of agentsResult.shared) {
      contentPairs.push({
        id: `agents/${agent}`,
        claudePath: join(dirs.claudeAgents, `${agent}.md`),
        copilotPath: join(dirs.copilotAgents, `${agent}.agent.md`),
        stripFm: true, // frontmatter legitimately differs (tools list, Copilot preamble fields)
      });
    }
    for (const cmd of commandsResult.shared) {
      contentPairs.push({
        id: `commands/${cmd}`,
        claudePath: join(dirs.claudeCommands, `${cmd}.md`),
        copilotPath: join(dirs.copilotPrompts, `${cmd}.prompt.md`),
        stripFm: true,
      });
    }
  }
  const baselineFile = join(scriptDir, 'parity-content-baseline.json');
  let baseline = {};
  if (existsSync(baselineFile)) {
    try { baseline = JSON.parse(readFileSync(baselineFile, 'utf8')); }
    catch (e) { console.error(`[parity] cannot parse content baseline ${relPosix(root, baselineFile)}: ${e.message}`); process.exit(2); }
  }
  if (baseline._description) delete baseline._description;

  const content = args['no-content']
    ? { drift: [], legacy: [], staleBaseline: [], stalePerFile: [], nextBaseline: {} }
    : compareContent(contentPairs, cp, baseline);

  if (args['update-content-baseline']) {
    const sortedIds = Object.keys(content.nextBaseline).sort();
    const out = {
      _description: 'LEGACY content drift between the Claude and Copilot surfaces, tolerated by fingerprint. Dimension 6 fails on any pair whose drift signature is not recorded here (new drift) or no longer matches (changed drift). Reconcile pairs over time (chaos:sync hardening-drift work) and regenerate with --update-content-baseline — the file should only ever shrink. Never hand-edit hashes to silence real drift.',
    };
    for (const id of sortedIds) out[id] = content.nextBaseline[id];
    writeFileSync(baselineFile, JSON.stringify(out, null, 2) + '\n');
    console.log(`[parity] content baseline updated: ${sortedIds.length} pair(s) recorded at ${relPosix(root, baselineFile)}`);
    process.exit(0);
  }

  const sets = [commandsResult, skillsResult, agentsResult];
  const setDrift = sets.some((r) => r.missingOnCopilot.length || r.missingOnClaude.length);
  const linkDriftHard = linkage.some((e) => !e.exempt);
  const linkDriftSoft = linkage.some((e) => e.exempt);
  const staleAny = sets.some((r) => r.staleExceptions.length) || content.stalePerFile.length > 0 || content.staleBaseline.length > 0;
  const hasDrift = setDrift || refDrift.length > 0 || linkDriftHard || content.drift.length > 0;
  const hasWarnings = staleAny || linkDriftSoft;
  const failed = hasDrift || (args.strict && hasWarnings);

  if (args.json) {
    const payload = {
      root: toPosix(root),
      strict: !!args.strict,
      result: failed ? 'DRIFT' : 'OK',
      sets: sets.map((r) => ({
        kind: r.kind, shared: r.shared, missingOnCopilot: r.missingOnCopilot, missingOnClaude: r.missingOnClaude,
        declaredCopilotOnly: r.declaredCopilotOnly, declaredClaudeOnly: r.declaredClaudeOnly, staleExceptions: r.staleExceptions,
      })),
      skillFileDrift: refDrift,
      linkage,
      contentParity: {
        checkedPairs: contentPairs.length,
        drift: content.drift,
        legacyBaselined: content.legacy,
        staleBaseline: content.staleBaseline,
        stalePerFile: content.stalePerFile,
      },
    };
    console.log(JSON.stringify(payload, null, 2));
    process.exit(failed ? 1 : 0);
  }

  const lines = [];
  lines.push('CHAOS Claude <-> Copilot surface parity check');
  lines.push(`Root: ${toPosix(root)}`);
  lines.push('');
  printSet(lines, commandsResult, '.claude/commands/<n>.md', '.github/prompts/<n>.prompt.md');
  printSet(lines, skillsResult, '.claude/skills/<n>/', '.github/skills/<n>/');
  printSet(lines, agentsResult, '.claude/agents/<n>.md', '.github/agents/<n>.agent.md');

  lines.push('Skill files & contracts  (per shared skill: SKILL.md + reference/**.md)');
  lines.push(`  ${sharedSkillDirs.length} shared skills · ${refDrift.length} with file drift`);
  for (const d of refDrift) {
    for (const f of d.missOnCopilot) lines.push(`  DRIFT  ${d.skill}: \`${f}\` on Claude but MISSING on Copilot`);
    for (const f of d.missOnClaude) lines.push(`  DRIFT  ${d.skill}: \`${f}\` on Copilot but MISSING on Claude`);
  }
  if (!refDrift.length) lines.push('  OK');
  lines.push('');

  lines.push('Content parity  (normalized line diff; undeclared drift fails unless baselined-legacy)');
  if (args['no-content']) {
    lines.push('  SKIPPED (--no-content)');
  } else {
    lines.push(`  ${contentPairs.length} file pairs compared · ${content.drift.length} NEW/CHANGED drift · ${content.legacy.length} baselined-legacy (tolerated)`);
    const SAMPLES = 8;
    for (const d of content.drift) {
      const tag = d.baselined ? 'DRIFT (signature changed vs baseline)' : 'DRIFT (new — not in baseline)';
      lines.push(`  ${tag}  ${d.id} (${d.claudeOnly.length} Claude-only, ${d.copilotOnly.length} Copilot-only undeclared line(s))`);
      for (const l of d.claudeOnly.slice(0, SAMPLES)) lines.push(`         C:${pad(l.line)}  ${l.text.slice(0, 110)}`);
      for (const l of d.copilotOnly.slice(0, SAMPLES)) lines.push(`         G:${pad(l.line)}  ${l.text.slice(0, 110)}`);
      const hidden = d.claudeOnly.length + d.copilotOnly.length - Math.min(d.claudeOnly.length, SAMPLES) - Math.min(d.copilotOnly.length, SAMPLES);
      if (hidden > 0) lines.push(`         … ${hidden} more (use --json for the full list)`);
    }
    for (const s of content.staleBaseline) lines.push(`  WARN   stale baseline: ${s.id} — ${s.why}`);
    for (const s of content.stalePerFile) lines.push(`  WARN   stale content exception: ${s.id} — ${s.why}`);
    if (!content.drift.length) lines.push('  OK');
  }
  lines.push('');

  lines.push('Prompt -> agent linkage  (.github/prompts frontmatter `agent:`)');
  const checkedPrompts = listFileNames(dirs.copilotPrompts, (n) => n.endsWith('.prompt.md')).length;
  lines.push(`  ${checkedPrompts} prompts scanned · ${linkage.length} broken link(s)`);
  for (const e of linkage) {
    const where = [e.missClaude ? 'absent on Claude' : null, e.missCopilot ? 'absent on Copilot' : null].filter(Boolean).join(' & ');
    lines.push(`  ${e.exempt ? 'WARN ' : 'DRIFT'}  ${e.prompt} -> agent \`${e.agent}\` (${where})`);
  }
  if (!linkage.length) lines.push('  OK');
  lines.push('');

  lines.push(`RESULT: ${failed ? 'DRIFT DETECTED' : (hasWarnings ? 'PARITY OK (with warnings)' : 'PARITY OK')}`);
  if (hasWarnings && !args.strict) lines.push('  (run with --strict to treat warnings as failures)');
  console.log(lines.join('\n'));
  process.exit(failed ? 1 : 0);
}

try { main(); }
catch (e) { console.error(`[parity] unexpected error: ${e && e.stack ? e.stack : e}`); process.exit(2); }
