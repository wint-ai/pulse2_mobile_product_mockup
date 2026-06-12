// "Investigating" / "On it" claim per system, keyed by systemId.
// Stateless: every read goes to localStorage. No in-memory cache to drift.

const KEY = 'pulse2-investigating';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}
function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch { /* ignore */ }
}

export function isInvestigating(systemId) {
  return !!load()[systemId];
}

export function getInvestigatingInfo(systemId) {
  return load()[systemId] || null;
}

export function startInvestigating(systemId, { actor } = {}) {
  if (!systemId) return;
  const state = load();
  state[systemId] = { actor: actor || 'You', startedAt: Date.now() };
  save(state);
}

export function stopInvestigating(systemId) {
  if (!systemId) return;
  const state = load();
  if (!state[systemId]) return;
  delete state[systemId];
  save(state);
}

// Back-compat shim — older code called reloadInvestigating() to refresh the
// removed in-memory cache. With the stateless design every read already
// loads from localStorage, so this is a no-op.
export function reloadInvestigating() { /* no-op */ }
