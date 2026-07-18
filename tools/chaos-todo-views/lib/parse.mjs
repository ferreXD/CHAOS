// Zero-dependency parsing for CHAOS todo item + index Markdown.
// Deterministic: no clocks, no randomness, stable ordering by caller.

/**
 * Minimal YAML-subset parser sufficient for CHAOS frontmatter:
 * nested maps (indent-detected), sequences (`- item`), quoted/plain scalars, null.
 * Not a general YAML parser — it covers the shapes chaos:todo emits (any consistent indent width).
 */
export function parseYamlSubset(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let i = 0;

  const scalar = (raw) => {
    const v = raw.trim();
    if (v === '' || v === '~' || v === 'null') return null;
    if (v === 'true') return true;
    if (v === 'false') return false;
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      return v.slice(1, -1);
    }
    if (/^-?\d+$/.test(v)) return Number(v);
    return v;
  };
  const indentOf = (line) => line.match(/^(\s*)/)[1].length;
  const nextMeaningful = () => {
    while (i < lines.length && (lines[i].trim() === '' || lines[i].trim().startsWith('#'))) i++;
    return i < lines.length;
  };

  function parseBlock(minIndent) {
    if (!nextMeaningful()) return null;
    const blockIndent = indentOf(lines[i]);
    if (blockIndent < minIndent) return null;
    const first = lines[i].slice(blockIndent);
    const isSeq = first.startsWith('- ') || first === '-';

    if (isSeq) {
      const arr = [];
      while (nextMeaningful()) {
        const ind = indentOf(lines[i]);
        if (ind !== blockIndent) break;
        const rest = lines[i].slice(blockIndent);
        if (!(rest.startsWith('- ') || rest === '-')) break;
        const after = rest.replace(/^-\s*/, '');
        i++;
        if (after === '') {
          arr.push(parseBlock(blockIndent + 1));
        } else if (/^[\w.$-]+:(\s|$)/.test(after)) {
          i--;
          lines[i] = ' '.repeat(blockIndent + 2) + after; // reparse inline map member
          arr.push(parseBlock(blockIndent + 1));
        } else {
          arr.push(scalar(after));
        }
      }
      return arr;
    }

    const obj = {};
    while (nextMeaningful()) {
      const ind = indentOf(lines[i]);
      if (ind !== blockIndent) break;
      const m = lines[i].slice(blockIndent).match(/^([\w.$-]+):(.*)$/);
      if (!m) break;
      const key = m[1];
      const rest = m[2];
      i++;
      if (rest.trim() === '') {
        obj[key] = parseBlock(blockIndent + 1);
      } else {
        obj[key] = scalar(rest);
      }
    }
    return obj;
  }

  return parseBlock(0) || {};
}

/** Split a Markdown doc into {fm (raw frontmatter), body}. */
export function splitFrontmatter(md) {
  const t = md.replace(/\r\n/g, '\n');
  const m = t.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { fm: '', body: t };
  return { fm: m[1], body: m[2] };
}

/** Parse `## Section` blocks of an item body into { sectionTitleLower: rawMarkdown }. */
export function parseSections(body) {
  const out = {};
  const parts = body.split(/^##\s+/m);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    if (nl === -1) continue;
    const title = part.slice(0, nl).trim();
    if (!title || title.startsWith('#')) continue;
    out[title.toLowerCase()] = part.slice(nl + 1).trim();
  }
  return out;
}

/** Parse a single item Markdown file into a normalized record. */
export function parseItem(md, filename) {
  const { fm, body } = splitFrontmatter(md);
  const doc = parseYamlSubset(fm) || {};
  const todo = doc.todo || {};
  const meta = doc.chaosMetadata || {};
  const sections = parseSections(body);
  const asList = (v) => (Array.isArray(v) ? v.filter((x) => x != null) : v == null ? [] : [v]);
  const str = (v, d = '') => (v == null ? d : String(v));

  return {
    id: str(todo.id, filename.replace(/\.md$/, '')),
    title: str(todo.title, str(todo.id, filename)),
    status: str(todo.status, 'open'),
    priority: str(todo.priority, 'MEDIUM'),
    target: todo.target == null ? null : String(todo.target),
    type: todo.type == null ? null : String(todo.type),
    owner: str(todo.owner, 'TBD'),
    sourceIds: asList(todo.sourceIds).map(String),
    relatedFindings: asList(todo.relatedFindings).map(String),
    relatedRoadmapItems: asList(todo.relatedRoadmapItems).map(String),
    relatedChanges: asList(todo.relatedChanges).map(String),
    sourceArtifacts: asList(todo.sourceArtifacts).map(String),
    nextStep: str(todo.nextStep),
    recommendedCommand: str(todo.recommendedCommand, 'none'),
    closureCriteria: asList(todo.closureCriteria).map(String),
    knowledgeType: todo.knowledgeType == null ? null : String(todo.knowledgeType),
    confidence: todo.confidence == null ? null : String(todo.confidence),
    createdAt: str(todo.createdAt),
    lastSeenAt: str(todo.lastSeenAt),
    closedAt: todo.closedAt == null ? null : String(todo.closedAt),
    contextConfidence: (meta.repositoryContext && meta.repositoryContext.confidence) || null,
    file: filename,
    why: sections['why this exists'] || '',
    nextAction: sections['next action'] || str(todo.nextStep),
    closureCriteriaText: sections['closure criteria'] || '',
    sourceEvidence: sections['source evidence'] || '',
    history: sections['history'] || '',
  };
}

/** Extract useful context/provenance from index.md (best-effort, non-fatal). */
export function parseIndex(md) {
  if (!md) return { context: {}, provenance: '', dedup: '', candidates: '' };
  const { fm, body } = splitFrontmatter(md);
  const doc = parseYamlSubset(fm) || {};
  const ctx = (doc.chaosMetadata && doc.chaosMetadata.repositoryContext) || {};
  const grab = (heading) => {
    const re = new RegExp(`##\\s+${heading}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i');
    const m = body.match(re);
    return m ? m[1].trim() : '';
  };
  return {
    context: {
      provider: ctx.provider || 'unknown',
      branch: ctx.branch || 'unknown',
      confidence: ctx.confidence || 'LOW',
    },
    provenance: grab('Decision provenance'),
    dedup: grab('Deduplication'),
    candidates: grab('Todo Candidates'),
  };
}
