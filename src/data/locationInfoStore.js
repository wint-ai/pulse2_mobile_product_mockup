// Local store for user-edited Location Info fields on the Home Info tab.
// Two surfaces are user-editable per scope:
//   • notes     — freeform text override
//   • pictures  — list of { id, dataUrl, addedAt } site photos
//
// Mockup persistence only: data lives in localStorage under one key per
// account/scope id. Each account starts seeded from accounts.js so static
// mock data still shows; once the user edits, the localStorage override
// wins. Clearing localStorage restores the mock defaults.
//
// In a real product these would be server-side fields on the location
// record, with image uploads going to object storage instead of being
// inlined as data URLs.

const KEY_PREFIX = 'pulse2-location-info:';

function keyFor(scopeId) { return `${KEY_PREFIX}${scopeId}`; }

function read(scopeId) {
  if (!scopeId) return {};
  try {
    const raw = localStorage.getItem(keyFor(scopeId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function write(scopeId, obj) {
  if (!scopeId) return;
  try {
    localStorage.setItem(keyFor(scopeId), JSON.stringify(obj));
  } catch (err) {
    // localStorage can throw QuotaExceededError when images are large.
    // We deliberately don't surface this — it's a mockup constraint.
    console.warn('[locationInfoStore] write failed', err);
  }
}

// ── Notes ────────────────────────────────────────────────────────────────
export function getNotesOverride(scopeId) {
  const v = read(scopeId).notes;
  return typeof v === 'string' ? v : null;   // null = no override, use mock default
}

export function setNotes(scopeId, notes) {
  const obj = read(scopeId);
  obj.notes = String(notes ?? '');
  write(scopeId, obj);
}

// ── Pictures ─────────────────────────────────────────────────────────────
export function getPictures(scopeId) {
  const v = read(scopeId).pictures;
  return Array.isArray(v) ? v : [];
}

export function addPicture(scopeId, dataUrl) {
  const obj = read(scopeId);
  const list = Array.isArray(obj.pictures) ? obj.pictures : [];
  list.push({
    id: `pic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    dataUrl,
    addedAt: new Date().toISOString(),
  });
  obj.pictures = list;
  write(scopeId, obj);
}

export function removePicture(scopeId, pictureId) {
  const obj = read(scopeId);
  obj.pictures = (obj.pictures || []).filter(p => p.id !== pictureId);
  write(scopeId, obj);
}
