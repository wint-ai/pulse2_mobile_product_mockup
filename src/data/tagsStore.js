// Persists tag selections for water events.
//
// 2026-06-04 (multi-tag): a single event can have multiple tags applied. Each
// tag carries its own attribution (addedBy/addedAt) for support / audit. The
// UI surfaces attribution only on the Activity tab's expanded panel — other
// surfaces are compact and omit it (PRD 15 § 9.2).
//
// 2026-06-04 (key shape — see PRD 15 § 10.4): the storage key is an OPAQUE
// string. Callers decide what to use:
//   • Active phase  → caller passes `sys.id` (only one active event per
//                     system; system-id is functionally event-id here).
//   • Closed phase  → caller passes the closed event's stable `event.id`.
// This lets a single system carry independent tags on Event A (Tuesday)
// and Event B (Friday) without cross-contamination. The function params
// are still named `systemId` for back-compat — treat them as generic IDs.
//
// On-disk shape:
//   {
//     [id]: [
//       { chip, chipOther, detail, addedBy, addedAt },
//       { chip, chipOther, detail, addedBy, addedAt },
//     ]
//   }
//
// Older single-object shape ({ chip, chipOther, ... }) is migrated to an
// array on first load so existing reviewer sessions don't lose data.

const STORAGE_KEY = 'pulse2-event-tags';
const LOCATIONS_KEY = 'pulse2-event-tag-locations';

function migrate(raw) {
  // raw shape: { [systemId]: array-or-object }
  const out = {};
  for (const [id, value] of Object.entries(raw || {})) {
    if (Array.isArray(value)) {
      out[id] = value;
    } else if (value && typeof value === 'object') {
      // Legacy single-tag object — wrap into an array.
      const { chip, chipOther, detail, impact, impactOther, source, sourceOther, where, taggedBy, taggedAt } = value;
      // Skip empty legacy entries — old defaults wrote null fields even when nothing was tagged.
      if (chip || chipOther || detail || impact || source || where) {
        out[id] = [{
          chip:      chip || impact || source || where || null,
          chipOther: chipOther || impactOther || sourceOther || null,
          detail:    detail || null,
          addedBy:   taggedBy || 'Legacy',
          addedAt:   taggedAt || Date.now(),
        }];
      }
    }
  }
  return out;
}

function loadTags() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return migrate(raw);
  } catch { return {}; }
}
function loadLocations() {
  try { return JSON.parse(localStorage.getItem(LOCATIONS_KEY)) || {}; }
  catch { return {}; }
}
function persistTags(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { /* ignore */ }
}
function persistLocations(state) {
  try { localStorage.setItem(LOCATIONS_KEY, JSON.stringify(state)); }
  catch { /* ignore */ }
}

// Stateless reads — every call hits localStorage. Eliminates the in-memory
// cache that used to drift on cross-tab / cross-device updates.

export function reloadTags() { /* no-op back-compat shim */ }

// ─── Multi-tag API ─────────────────────────────────────────────────────────

/** Array of tags for the given system, oldest → newest. Empty array if none. */
export function getTags(systemId) {
  return loadTags()[systemId] || [];
}

/** True if the system has at least one tag. */
export function isTagged(systemId) {
  return (loadTags()[systemId] || []).length > 0;
}

/** Append one tag. Use this for each new chip the user selects. */
export function addTag(systemId, { chip, chipOther, detail, addedBy } = {}) {
  if (!systemId || !chip) return;
  const entry = {
    chip,
    chipOther: chipOther || null,
    detail:    detail || null,
    addedBy:   addedBy || 'You',
    addedAt:   Date.now(),
  };
  const tags = loadTags();
  tags[systemId] = [...(tags[systemId] || []), entry];
  persistTags(tags);

  // Remember the location / detail chip for the next tagging session.
  if (detail && systemId) {
    const locs = loadLocations();
    const list = locs[systemId] || [];
    if (!list.includes(detail)) {
      locs[systemId] = [detail, ...list].slice(0, 8);
      persistLocations(locs);
    }
  }
}

/** Remove the tag at index `i`. */
export function removeTagAt(systemId, i) {
  if (!systemId) return;
  const tags = loadTags();
  const list = tags[systemId] || [];
  if (i < 0 || i >= list.length) return;
  tags[systemId] = [...list.slice(0, i), ...list.slice(i + 1)];
  persistTags(tags);
}

/** Remove ALL tags from the given system. */
export function clearTags(systemId) {
  if (!systemId) return;
  const tags = loadTags();
  if (!tags[systemId]) return;
  delete tags[systemId];
  persistTags(tags);
}

/** Known detail strings the user has previously typed on this system. */
export function getKnownLocations(systemId) {
  return loadLocations()[systemId] || [];
}

// ─── Back-compat shims ─────────────────────────────────────────────────────
// These keep older callers working until they migrate to the array API.

/** Returns the FIRST tag for the system, or null. Prefer getTags() going forward. */
export function getTag(systemId) {
  const list = loadTags()[systemId] || [];
  return list[0] || null;
}

/** Equivalent to addTag — kept so existing callers don't break. */
export function saveTag(systemId, payload = {}) {
  addTag(systemId, {
    chip:      payload.chip,
    chipOther: payload.chipOther,
    detail:    payload.detail,
    addedBy:   payload.taggedBy || payload.addedBy,
  });
}

/** Removes all tags. */
export function clearTag(systemId) {
  clearTags(systemId);
}
