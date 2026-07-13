// Tracks water-event incidents the user has ignored, keyed by systemId.
// Stateless: every read goes to localStorage. No in-memory cache.

const KEY = 'pulse2-ignored-incidents';

// Demo-guaranteed non-ignored systems. On every page load we clear these
// two systems from the ignored list so the fresh mock state always includes
// one active High Flow event (ct1 -- Suffolk Cooling Tower #1) and one
// active Low Flow event (sp -- Suffolk Sump Pump B1). Any ignore action
// the user performs mid-session on these systems still applies for that
// session; the wipe only runs once at module load. Rationale: the pusher
// republishes ignore state across sessions, so clearing app data on the
// phone doesn't always yield a truly-fresh baseline -- this fallback
// guarantees at least one visible active water event of each severity.
const DEMO_UNIGNORE_ON_LOAD = ['ct1', 'sp'];

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}
function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch { /* ignore */ }
}

// One-shot cleanup at module load.
try {
  const state = load();
  let dirty = false;
  for (const id of DEMO_UNIGNORE_ON_LOAD) {
    if (state[id]) { delete state[id]; dirty = true; }
  }
  if (dirty) save(state);
} catch { /* ignore */ }

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
