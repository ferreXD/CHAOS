// Deterministic derivation of dashboard data from parsed items.

export const TERMINAL = new Set(['done', 'wont-do', 'superseded']);
export const PRIORITY_RANK = { BLOCKER: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
export const TARGET_RANK = { 'public-alpha': 0, v1: 1, vNext: 2, later: 3 };
const OPEN_STATES = new Set(['open', 'in-progress', 'blocked', 'needs-decision']);

export const isTerminal = (it) => TERMINAL.has(it.status);
export const isOpen = (it) => !isTerminal(it);

function pr(it) {
  const p = PRIORITY_RANK[it.priority];
  return p == null ? 9 : p;
}
function tr(it) {
  const t = TARGET_RANK[it.target];
  return t == null ? 9 : t;
}

/** Stable ordering for backlog display: open first, then by priority, target, created, id. */
export function backlogSort(a, b) {
  const ao = isOpen(a) ? 0 : 1;
  const bo = isOpen(b) ? 0 : 1;
  if (ao !== bo) return ao - bo;
  if (pr(a) !== pr(b)) return pr(a) - pr(b);
  if (tr(a) !== tr(b)) return tr(a) - tr(b);
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Recommended next: open items by priority, then nearest target, then created/id. Top N. */
export function recommendedNext(items, n = 5) {
  return items
    .filter(isOpen)
    .slice()
    .sort((a, b) => {
      if (pr(a) !== pr(b)) return pr(a) - pr(b);
      if (tr(a) !== tr(b)) return tr(a) - tr(b);
      if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    })
    .slice(0, n);
}

function countBy(items, keyFn) {
  const m = new Map();
  for (const it of items) {
    const k = keyFn(it);
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

export function computeDashboard(items) {
  const open = items.filter(isOpen);
  const done = items.filter(isTerminal);
  const isBlocker = (it) => it.priority === 'BLOCKER';
  const stale = items.filter((it) => it.status === 'stale');
  const needsDecision = items.filter((it) => it.status === 'needs-decision');

  const groupList = (keyOrder, keyFn, labelFn) => {
    const byKey = new Map();
    for (const it of items) {
      const k = keyFn(it);
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push(it);
    }
    const keys = [...byKey.keys()];
    keys.sort((a, b) => {
      const ra = keyOrder[a] == null ? 99 : keyOrder[a];
      const rb = keyOrder[b] == null ? 99 : keyOrder[b];
      if (ra !== rb) return ra - rb;
      return String(a) < String(b) ? -1 : 1;
    });
    return keys.map((k) => {
      const its = byKey.get(k).slice().sort(backlogSort);
      return {
        key: String(k),
        label: labelFn ? labelFn(k) : String(k),
        total: its.length,
        open: its.filter(isOpen).length,
        done: its.filter(isTerminal).length,
        items: its,
      };
    });
  };

  const targetLabels = {
    'public-alpha': 'Public alpha',
    v1: 'v1',
    vNext: 'vNext',
    later: 'Later',
  };

  return {
    total: items.length,
    open: open.length,
    done: done.length,
    donePct: items.length ? Math.round((done.length / items.length) * 100) : 0,
    openBlockers: open.filter(isBlocker).length,
    publicAlphaBlockers: open.filter((it) => isBlocker(it) && it.target === 'public-alpha').length,
    v1Blockers: open.filter((it) => isBlocker(it) && it.target === 'v1').length,
    staleCount: stale.length,
    needsDecisionCount: needsDecision.length,
    byTarget: groupList(TARGET_RANK, (it) => it.target || 'unassigned', (k) => targetLabels[k] || k),
    byType: groupList({}, (it) => it.type || 'other'),
    byPriority: countBy(items, (it) => it.priority),
    recommended: recommendedNext(items),
    blockers: open.filter(isBlocker).slice().sort(backlogSort),
    stale,
    allSorted: items.slice().sort(backlogSort),
  };
}

export { OPEN_STATES };
