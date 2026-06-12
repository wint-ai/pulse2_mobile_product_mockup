// Append-only events log per system.
//
// Separate from simulatedAlerts (which holds the ACTIVE alert state).
// EVERY push the pusher fires appends one row here, including closure
// pushes (Valve error cleared, AC power restored, System back online,
// etc.) so the Activity timeline shows the full history.
//
// Stateless reads - every read hits localStorage.

const KEY = 'pulse2-simulated-events';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}
function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch { /* ignore */ }
}

export function getSimulatedEvents(systemId) {
  if (!systemId) return [];
  return load()[systemId] || [];
}

export function getAllSimulatedEvents() {
  return load();
}

// Append one event row. Each row: { type, title, timestamp, detail, variantId, _seq }
export function appendSimulatedEvent(systemId, row) {
  if (!systemId || !row || !row.type) return;
  const state = load();
  const list = state[systemId] || [];
  const withSeq = { ...row, _seq: list.length };
  state[systemId] = [...list, withSeq];
  save(state);
}

export function clearSimulatedEventsForSystem(systemId) {
  if (!systemId) return;
  const state = load();
  if (!state[systemId]) return;
  delete state[systemId];
  save(state);
}

export function clearAllSimulatedEvents() {
  save({});
}
