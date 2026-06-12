// Favorites store — user-pinned systems and locations.
// Mixed list in one place: each entry has a `kind` so consumers can tell them
// apart. Persisted in localStorage for the mockup; in a real product these
// would be a per-user server preference.
//
// Entry shape:
//   { kind: 'system' | 'location', id, name, sub?, levelType?, addedAt }
//
// • kind       — discriminator
// • id         — system id or location/scope id
// • name       — display name (cached at pin time so the row renders without
//                a second lookup)
// • sub        — optional sub-label (e.g. parent location or system count)
// • levelType  — for locations only, the hierarchy level (used to pick the
//                row icon)
// • addedAt    — ISO timestamp; ordering = chronological for v1, drag-to-
//                reorder is parked

const KEY = 'pulse2-favorites';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('[favoritesStore] write failed', err);
  }
}

export function getFavorites() { return read(); }

export function isFavorited(kind, id) {
  return read().some(f => f.kind === kind && f.id === id);
}

export function addFavorite({ kind, id, name, sub, levelType }) {
  if (!kind || !id) return;
  const list = read();
  if (list.some(f => f.kind === kind && f.id === id)) return;
  list.push({ kind, id, name, sub, levelType, addedAt: new Date().toISOString() });
  write(list);
}

export function removeFavorite(kind, id) {
  write(read().filter(f => !(f.kind === kind && f.id === id)));
}

export function toggleFavorite(entry) {
  if (isFavorited(entry.kind, entry.id)) removeFavorite(entry.kind, entry.id);
  else addFavorite(entry);
}
