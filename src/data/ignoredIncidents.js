// Tracks water-event incidents the user has ignored, keyed by systemId.
// Stateless: every read goes to localStorage. No in-memory cache.

const KEY = 'pulse2-ignored-incidents';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}
function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch { /* ignore */ }
}

export function isIgnored(systemId) {
  return !!load()[systemId];
}

export function getIgnoredInfo(systemId) {
  return load()[systemId] || null;
}

export function getAllIgnored() {
  const state = load();
  return Object.entries(state).map(([systemId, info]) => ({ systemId, ...info }));
}

export function ignoreIncident(systemId, { tag, ignoredBy } = {}) {
  if (!systemId) return;
  const state = load();
  state[systemId] = {
    tag: tag || 'No reason given',
    ignoredBy: ignoredBy || 'You',
    ignoredAt: Date.now(),
  };
  save(state);
}

export function clearIgnored(systemId) {
  if (!systemId) return;
  const state = load();
  if (!state[systemId]) return;
  delete state[systemId];
  save(state);
}

// Back-compat shim — see investigatingStore.reloadInvestigating.
export function reloadIgnored() { /* no-op */ }
