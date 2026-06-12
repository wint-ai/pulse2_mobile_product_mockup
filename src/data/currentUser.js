// Current actor (logged-in user) — used as the `actor` field in
// investigating/ignored/tag stores. Persists in localStorage so the Push
// Simulator can swap identities to test multi-recipient flows.

const KEY = 'pulse2-current-actor';
const DEFAULT = 'You';

export function getCurrentActor() {
  try { return localStorage.getItem(KEY) || DEFAULT; }
  catch { return DEFAULT; }
}

export function setCurrentActor(name) {
  try {
    const v = (name || '').trim();
    if (!v) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, v);
  } catch { /* ignore */ }
}
