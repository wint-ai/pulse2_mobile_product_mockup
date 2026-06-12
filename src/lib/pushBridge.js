// Cross-device push bridge — relays Push Notifications Panel events from a
// desktop browser to the deployed app running on a phone. Uses ntfy.sh as a
// public broker: anonymous, no signup, HTTP POST to publish, SSE to subscribe.
//
// Pairing: both sides must share a "room" id. By default this is read from the
// `?room=<code>` URL parameter; if absent, a fixed demo room is used. To pair a
// specific desktop with a specific phone, append the same `?room=<code>` to
// both URLs.

const NTFY_BASE = 'https://ntfy.sh';
const DEFAULT_ROOM = 'pulse2-demo';
const SENDER_ID_KEY = 'pulse2-push-sender-id';
const PAIR_CODE_KEY = 'pulse2-pair-code';
const PUSHER_ROOM_KEY = 'pulse2-pusher-room';

// Resolve the ntfy.sh room (= pairing channel) in priority order:
//   1. `?p=<code>` URL param (set by QR deep-link)
//   2. `?room=<code>` URL param (legacy / explicit override)
//   3. sessionStorage 'pulse2-pair-code' (phone-side persistence)
//   4. localStorage 'pulse2-pusher-room' (pusher-side persistent unique room)
//   5. DEFAULT_ROOM ('pulse2-demo') as a final fallback
//
// CHANGED 2026-06-06: the pusher now generates its own unique room and
// persists it in localStorage (step 4). Each user testing the app gets
// their own ntfy.sh topic, so the heavily-rate-limited pulse2-demo
// default is no longer the de facto channel for everyone. Previously,
// every reviewer + tester was funneling through pulse2-demo and hitting
// the free-tier daily message quota.
function readRoomFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('p');
    if (p && p.trim()) return p.trim();
    const r = params.get('room');
    if (r && r.trim()) return r.trim();
    const sessStored = sessionStorage.getItem(PAIR_CODE_KEY);
    if (sessStored && sessStored.trim()) return sessStored.trim();
    const localStored = (typeof localStorage !== 'undefined') ? localStorage.getItem(PUSHER_ROOM_KEY) : null;
    if (localStored && localStored.trim()) return localStored.trim();
    return DEFAULT_ROOM;
  } catch {
    return DEFAULT_ROOM;
  }
}

// Pusher-side unique-room accessor. Generates + persists on first call.
// Used by ControlPanel for both the QR pair code AND the bridge publishes.
// Phone surfaces don't call this - they get their room from the QR URL.
export function getOrCreatePusherRoom() {
  try {
    let room = localStorage.getItem(PUSHER_ROOM_KEY);
    if (room && room.trim()) return room.trim();
    // Generate a friendly + reasonably unique code.
    // Format: pulse2-<8 lowercase alphanumerics> (e.g. pulse2-k3m9x7p2)
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let suffix = '';
    for (let i = 0; i < 8; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    room = `pulse2-${suffix}`;
    localStorage.setItem(PUSHER_ROOM_KEY, room);
    return room;
  } catch {
    return DEFAULT_ROOM;
  }
}

function getSenderId() {
  try {
    let id = sessionStorage.getItem(SENDER_ID_KEY);
    if (!id) {
      id = `s_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
      sessionStorage.setItem(SENDER_ID_KEY, id);
    }
    return id;
  } catch {
    return `s_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function getRoom() {
  return readRoomFromUrl();
}

export function getTopicUrl(room = getRoom()) {
  return `${NTFY_BASE}/${encodeURIComponent(room)}`;
}

// ─── Rate-limit observability ────────────────────────────────────────────
// When ntfy.sh returns 429 (daily quota exhausted on the free tier), we
// flip a global flag + notify subscribers. The pusher UI uses this to
// show a clear banner explaining what happened and what to do.
let _rateLimited = false;
let _rateLimitReason = '';
const _rateLimitListeners = new Set();
export function isRateLimited() { return _rateLimited; }
export function getRateLimitReason() { return _rateLimitReason; }
export function onRateLimitChange(fn) {
  _rateLimitListeners.add(fn);
  return () => _rateLimitListeners.delete(fn);
}
function setRateLimited(yes, reason = '') {
  if (_rateLimited === yes && _rateLimitReason === reason) return;
  _rateLimited = yes;
  _rateLimitReason = reason;
  _rateLimitListeners.forEach(fn => { try { fn(yes, reason); } catch { /* noop */ } });
}

// Bridge kill-switch. Add ?bridge=off to the URL to skip ALL ntfy.sh
// network calls and rely on BroadcastChannel only. Useful when:
//   - Same-machine multi-tab testing (BroadcastChannel already works)
//   - You hit the daily quota and want to keep iterating
//   - You're offline and the bridge would just throw network errors
//   - Demos where you don't want any external dependency
export function isBridgeDisabled() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('bridge') === 'off') return true;
    if (localStorage.getItem('pulse2-bridge-disabled') === '1') return true;
  } catch { /* noop */ }
  return false;
}

// Publish a single event to the bridge. `event` must match the shape used by
// the local BroadcastChannel: { type, payload? } — type is one of
// 'push' | 'lock-phone' | 'shade' | 'other-app' | 'unlock-phone' |
// 'actor-changed' | 'data-changed' | 'phone-persona' | 'phone-persona-request'.
// Uses Content-Type: text/plain so the request stays in the CORS "simple" set
// (no preflight). ntfy.sh treats the body as the message text either way.
export async function publish(event, room = getRoom()) {
  if (isBridgeDisabled()) return;  // bridge=off kill-switch
  const envelope = {
    sender: getSenderId(),
    sentAt: Date.now(),
    event,
  };
  try {
    const resp = await fetch(getTopicUrl(room), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(envelope),
    });
    if (resp.ok) {
      console.log('[pushBridge] published', event.type);
      // A successful publish clears any prior rate-limit flag.
      if (_rateLimited) setRateLimited(false, '');
      return;
    }
    console.warn('[pushBridge] publish HTTP', resp.status, event.type);
    if (resp.status === 429) {
      // ntfy.sh free tier: ~24-hour daily quota per visitor IP.
      let reason = 'Cross-device push relay (ntfy.sh) has reached its daily limit. Pushes will not reach paired phones until ~midnight UTC.';
      try {
        const body = await resp.text();
        const parsed = JSON.parse(body);
        if (parsed?.error) reason = parsed.error;
      } catch { /* keep default */ }
      setRateLimited(true, reason);
    }
  } catch (err) {
    console.warn('[pushBridge] publish failed', err);
  }
}

// Subscribe to a room. Uses Server-Sent Events (native EventSource), which is
// supported across browsers — including iOS Safari — without the streaming-
// fetch buffering quirks. Returns a cleanup fn.
//
// ntfy.sh SSE format: lines like `event: message` / `event: keepalive` /
// `event: open`, each followed by `data: {...}`. Only `message` events carry
// user payloads.
//
// opts:
//   - room    (optional override of the URL-derived room)
//   - onOpen  (called every time the SSE connection becomes ready — including
//              after auto-reconnects, so callers can re-request stateful data)
//   - onStatus(state) where state is 'connecting' | 'open' | 'closed'
export function subscribe(handler, opts = {}) {
  if (isBridgeDisabled()) {
    console.log('[pushBridge] subscribe skipped - bridge disabled (?bridge=off)');
    if (opts.onStatus) opts.onStatus('closed');
    return () => {};
  }
  const { room = getRoom(), onOpen, onStatus } = opts;
  const url = `${NTFY_BASE}/${encodeURIComponent(room)}/sse`;
  const me = getSenderId();
  console.log('[pushBridge] subscribing', url, 'as', me);

  const es = new EventSource(url);
  if (onStatus) onStatus('connecting');

  es.addEventListener('open', () => {
    console.log('[pushBridge] connected', url);
    if (onStatus) onStatus('open');
    if (onOpen) {
      try { onOpen(); } catch (err) { console.warn('[pushBridge] onOpen threw', err); }
    }
  });

  es.addEventListener('error', (e) => {
    console.warn('[pushBridge] connection error', e);
    if (onStatus) onStatus('closed');
  });

  es.addEventListener('message', (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.event !== 'message' || !msg.message) return;
      const envelope = JSON.parse(msg.message);
      if (envelope.sender === me) return;          // skip our own messages
      if (!envelope.event) return;
      console.log('[pushBridge] event', envelope.event.type);
      handler(envelope.event);
    } catch (err) {
      console.warn('[pushBridge] parse error', err);
    }
  });

  return () => {
    try { es.close(); } catch { /* ignore */ }
    if (onStatus) onStatus('closed');
  };
}
