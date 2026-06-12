// Activity log events per system — generated deterministically from system ID.
// Real alerts come from events.js via getEventsForSystem (single source of
// truth for "alerts that ever happened"); this file only adds the deterministic
// non-alert noise (valve open/close, power restore, device online/offline) that
// fleshes out the per-system timeline.

import { SYSTEMS } from './systems';
import { getEventsForSystem } from './events';
import { getSimulatedAlert } from './simulatedAlerts';
import { getSimulatedEvents } from './simulatedEvents';

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed) {
  let t = seed + 0x6D2B79F5;
  return function () {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Real person names only \u2014 team / department labels (e.g. "Suffolk FM Team",
// "Heathrow Ops") aren't valid actors at the device-action level. A specific
// person opens or closes the valve. List drawn from the contacts on accounts.js
// so the same names appear on the Info tab and in the Timeline actor field.
const ACTORS = [
  'James Lee', 'Maya Tal', 'Yossi Shapira',
  'Michael Tan', 'Yara Saleh',
  'Rachel Adams', 'Charlie Cole',
  'Priya Shah', 'Tom Marshall',
  'Helen Park', 'Daniel Levin', 'Amelia Clarke',
  'Camille Dubois', 'St\u00e9phane Wattier',
  'Ronen Avraham', 'Khalid Al Mansoori', 'Dr. Avi Cohen',
  'Lior Ben-David', 'On-call Engineer',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTimestamp(date) {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Templates correspond to entries in the PRD-11 event catalogue only.
// `maintenance`, `config-change`, threshold-edit and similar are explicitly
// excluded by PRD 11 (see "What's NOT in the timeline"). Battery alerts are
// deferred from v1. These types are intentionally absent from the templates.
const GENERIC_TEMPLATES = [
  { type: 'valve-opened',   severity: 'info',   title: 'Valve opened',        detail: 'By Operator (manual open).',                    needsActor: true  },
  { type: 'valve-closed',   severity: 'medium', title: 'Valve closed',        detail: 'By Policy (Working hours).',                    needsActor: true  },
  { type: 'valve-opened',   severity: 'info',   title: 'Valve opened',        detail: 'By Policy (Working hours).',                    needsActor: false },
  { type: 'valve-closed',   severity: 'medium', title: 'Valve closed',        detail: 'By Operator (manual close).',                   needsActor: true  },
  { type: 'power-lost',     severity: 'high',   title: 'AC power disconnected', detail: 'Running from backup battery. Power saving mode.', needsActor: false },
  { type: 'power-restored', severity: 'info',   title: 'AC power reconnected', detail: 'Normal operation resumed.',                    needsActor: false },
  { type: 'device-offline', severity: 'medium', title: 'System Offline',      detail: 'Lost communication with cloud.',                needsActor: false },
  { type: 'device-online',  severity: 'info',   title: 'System Online',       detail: 'Normal operation resumed.',                     needsActor: false },
];

// Mock recipients for leak notification footers \u2014 keyed by account.
// Used to populate the foldable "Notified" section on water-event rows.
function initialsOf(name) {
  return (name || '').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

// Real person names only, 1 channel per recipient (locked 2026-06-09).
// Team / department labels are not valid notification targets - each push,
// SMS, or email goes to a specific PERSON with their configured channel
// preference. Earlier mocks listed "Suffolk FM Team" with ['push','sms','email']
// which doesn't match how notifications actually work (one person, one
// preferred channel; occasionally two for important contacts).
const RECIPIENTS_BY_ACCOUNT = {
  sc:         [{ name: 'James Lee',         channels: ['push']  },
               { name: 'Maya Tal',          channels: ['email'] }],
  ha:         [{ name: 'Tom Marshall',      channels: ['push']  },
               { name: 'Helen Park',        channels: ['email'] }],
  socgen:     [{ name: 'Camille Dubois',    channels: ['push']  },
               { name: 'St\u00e9phane Wattier', channels: ['email'] }],
  socgen_a:   [{ name: 'Camille Dubois',    channels: ['push']  }],
  socgen_b:   [{ name: 'St\u00e9phane Wattier', channels: ['email'] }],
  klep:       [{ name: 'St\u00e9phane Wattier', channels: ['push']  },
               { name: 'Amelia Clarke',     channels: ['email'] }],
  klep_forum: [{ name: 'Amelia Clarke',     channels: ['push']  }],
  azure:      [{ name: 'Priya Shah',        channels: ['push']  },
               { name: 'Daniel Levin',      channels: ['sms']   }],
  tidhar:     [{ name: 'Yossi Shapira',     channels: ['push']  },
               { name: 'Ronen Avraham',     channels: ['sms']   }],
};

function notificationsFor(sys, time) {
  const list = RECIPIENTS_BY_ACCOUNT[sys.account] || [{ name: 'On-call', channels: ['push'] }];
  return list.map(r => ({ name: r.name, initials: initialsOf(r.name), channels: r.channels, sentAt: time }));
}

// Active alert-specific recent events by system
// ACTIVE_ALERT_EVENTS removed 2026-06-03 — alerts now flow in via
// getEventsForSystem (events.js) so the same id is used on the Alerts list
// and on the Timeline tab. Kept the original map below as commented dead code
// for one cycle in case we need to grandfather any missing entries.
// eslint-disable-next-line no-unused-vars
const _ACTIVE_ALERT_EVENTS_OLD = {
  ct1: [
    { type: 'leak-detected', severity: 'critical', title: 'Leak \u2014 High flow detected', detail: 'Flow rate 38.2 L/hour exceeded threshold on cooling tower main inlet.', timestamp: 'Mar 25, 06:11', actor: 'System' },
    { type: 'alert-sent', severity: 'high', title: 'Alert notification sent', detail: 'Push notification sent to James Lee, email to Maya Tal.', timestamp: 'Mar 25, 06:11', actor: 'System' },
  ],
  ct2: [
    { type: 'valve-error', severity: 'high', title: 'Valve error detected', detail: 'Valve failed to respond to close command. Manual inspection required.', timestamp: 'Mar 25, 08:35', actor: 'System' },
  ],
  sp: [
    { type: 'leak-detected', severity: 'high', title: 'Leak \u2014 Low flow detected', detail: 'Flow rate 0.6 L/hour on sump pump drainage line.', timestamp: 'Mar 25, 08:18', actor: 'System' },
    { type: 'alert-sent', severity: 'medium', title: 'Alert notification sent', detail: 'Push notification sent to James Lee.', timestamp: 'Mar 25, 08:18', actor: 'System' },
  ],
  mshq: [
    { type: 'power-lost', severity: 'high', title: 'AC power lost', detail: 'Running on battery backup. Facility team alerted.', timestamp: 'Mar 25, 09:00', actor: 'System' },
  ],
  dhwhq: [
    { type: 'device-offline', severity: 'medium', title: 'Device went offline', detail: 'Device offline since 03:49. Remote reset attempted \u2014 no response.', timestamp: 'Mar 25, 03:49', actor: 'System' },
  ],
  msm: [
    { type: 'device-offline', severity: 'medium', title: 'Device went offline', detail: 'Device offline since 07:04. Suspected power interruption.', timestamp: 'Mar 25, 07:04', actor: 'System' },
  ],
  ctt2: [
    { type: 'leak-detected', severity: 'critical', title: 'Leak \u2014 High flow detected', detail: 'Flow rate 41.5 L/hour at T2 cooling tower.', timestamp: 'Mar 25, 06:00', actor: 'System' },
    { type: 'alert-sent', severity: 'high', title: 'Alert notification sent', detail: 'Push notification sent to Tom Marshall, email to Helen Park.', timestamp: 'Mar 25, 06:00', actor: 'System' },
  ],
  dhwt2: [
    { type: 'device-offline', severity: 'medium', title: 'Device went offline', detail: 'Device offline since 08:10.', timestamp: 'Mar 25, 08:10', actor: 'System' },
  ],
  cpta: [
    { type: 'power-lost', severity: 'high', title: 'AC power lost', detail: 'Running on battery backup. SocGen facilities alerted.', timestamp: 'Mar 25, 09:04', actor: 'System' },
  ],
  f9a: [
    { type: 'device-offline', severity: 'medium', title: 'Device went offline', detail: 'Device offline since 05:35.', timestamp: 'Mar 25, 05:35', actor: 'System' },
  ],
  f11a: [
    { type: 'leak-detected', severity: 'high', title: 'Leak \u2014 Low flow detected', detail: 'Flow rate 0.9 L/hour on Floor 11 DCW/DHW line.', timestamp: 'Mar 25, 08:27', actor: 'System' },
    { type: 'alert-sent', severity: 'medium', title: 'Alert notification sent', detail: 'Push notification sent to Camille Dubois.', timestamp: 'Mar 25, 08:27', actor: 'System' },
  ],
  ctb: [
    { type: 'valve-error', severity: 'high', title: 'Valve error detected', detail: 'Primary isolation valve fault. Manual override engaged.', timestamp: 'Mar 25, 08:47', actor: 'System' },
  ],
  csf: [
    { type: 'leak-detected', severity: 'high', title: 'Leak \u2014 Low flow detected', detail: 'Flow rate 0.7 L/hour on Forum cooling system.', timestamp: 'Mar 25, 07:17', actor: 'System' },
    { type: 'alert-sent', severity: 'medium', title: 'Alert notification sent', detail: 'Push notification sent to Kl\u00e9pierre FM.', timestamp: 'Mar 25, 07:17', actor: 'System' },
  ],
  shc: [
    { type: 'leak-detected', severity: 'critical', title: 'Leak \u2014 High flow detected', detail: 'Flow rate 44.1 L/hour on server hall cooling loop.', timestamp: 'Mar 25, 07:35', actor: 'System' },
    { type: 'alert-sent', severity: 'high', title: 'Alert notification sent', detail: 'Push notification sent to Azure Ops, Amsterdam FM.', timestamp: 'Mar 25, 07:35', actor: 'System' },
  ],
  msd: [
    { type: 'device-offline', severity: 'medium', title: 'Device went offline', detail: 'Device offline since 08:38.', timestamp: 'Mar 25, 08:38', actor: 'System' },
  ],
  tidhar_apt_47: [
    { type: 'leak-detected', severity: 'high', title: 'Leak \u2014 Low flow detected', detail: 'Flow rate 0.4 L/hour on apartment 47 water line.', timestamp: 'Mar 25, 08:47', actor: 'System' },
    { type: 'alert-sent', severity: 'medium', title: 'Alert notification sent', detail: 'Push notification sent to Tidhar FM Team.', timestamp: 'Mar 25, 08:47', actor: 'System' },
  ],
  tidhar_apt_156: [
    { type: 'device-offline', severity: 'medium', title: 'Device went offline', detail: 'Device offline since 07:12.', timestamp: 'Mar 25, 07:12', actor: 'System' },
  ],
  cbre_uk_mc_ct: [
    { type: 'valve-error', severity: 'high', title: 'Valve error detected', detail: 'Valve failed to respond to close command on Manchester Exchange Cooling Tower.', timestamp: 'Mar 25, 08:07', actor: 'System' },
  ],
};

let _cache = null;

function buildCache() {
  if (_cache) return _cache;
  _cache = {};

  const baseDate = new Date(2026, 2, 25, 9, 22, 0);

  for (const sys of SYSTEMS) {
    const events = [];
    const seed = hashCode(sys.id);
    const rand = seededRandom(seed);

    // Real alerts (active + history + ignored) — pulled from events.js so the
    // id matches the Alerts list (e.g. 'e7' or 'h12'). Deep-links from the
    // Alerts → History → tap-event flow resolve to the same row here.
    // Every alert here is alertable — water, valve fault, power loss,
    // connectivity loss, and their recovery variants all notify. Use the
    // explicit notifications list when present (events.js water entries have
    // their own), otherwise generate a recipients list from the system's
    // account so the Notified panel renders something.
    const alertsForSystem = getEventsForSystem(sys.id);
    for (const ae of alertsForSystem) {
      const sentAt = ae.timestamp?.split(',')[1]?.trim() || '';
      events.push({
        ...ae,
        notifications: ae.notifications || notificationsFor(sys, sentAt),
      });
    }

    // Synthetic non-alert history noise. Notification rules (locked 2026-06-04):
    //   • power-lost / power-restored                        → always notify.
    //   • device-offline / device-online                     → always notify.
    //   • valve-opened / valve-closed BY POLICY (actor='System') → NO notify.
    //   • valve-opened / valve-closed BY PERSON  (actor=name)    → notify
    //       (someone took a manual action — others on the system care).
    const ALWAYS_NOTIFIES = new Set([
      'power-lost', 'power-restored',
      'device-offline', 'device-online',
    ]);
    const isValveAction = (t) => t === 'valve-opened' || t === 'valve-closed';

    const numHistorical = 5 + Math.floor(rand() * 11);
    for (let i = 0; i < numHistorical; i++) {
      const template = GENERIC_TEMPLATES[Math.floor(rand() * GENERIC_TEMPLATES.length)];
      const daysAgo = 1 + Math.floor(rand() * 29);
      const hoursOffset = Math.floor(rand() * 18) + 6;
      const minutesOffset = Math.floor(rand() * 60);

      const eventDate = new Date(baseDate);
      eventDate.setDate(eventDate.getDate() - daysAgo);
      eventDate.setHours(hoursOffset, minutesOffset, 0, 0);

      const actor = template.needsActor
        ? ACTORS[Math.floor(rand() * ACTORS.length)]
        : 'System';

      const ts = formatTimestamp(eventDate);
      const sentAt = ts.split(',')[1]?.trim() || '';

      // Notify when: type is in the always-notify set, OR it's a valve action
      // performed by a person (actor is not 'System').
      const notify = ALWAYS_NOTIFIES.has(template.type)
        || (isValveAction(template.type) && actor !== 'System');

      events.push({
        id: `le_${sys.id}_${i}`,
        systemId: sys.id,
        type: template.type,
        severity: template.severity,
        title: template.title,
        detail: template.detail,
        timestamp: ts,
        actor,
        notifications: notify ? notificationsFor(sys, sentAt) : undefined,
      });
    }

    // Alerts (id starts with 'e' or 'h' — from events.js) on top of the
    // synthetic non-alert noise (id starts with 'le_'). Within each group,
    // preserve original order — ActivityTab does its own date-based sort.
    events.sort((a, b) => {
      const aIsAlert = !a.id.startsWith('le_');
      const bIsAlert = !b.id.startsWith('le_');
      if (aIsAlert && !bIsAlert) return -1;
      if (!aIsAlert && bIsAlert) return 1;
      return 0;
    });

    _cache[sys.id] = events;
  }

  return _cache;
}

// Build a timestamp in the format the timeline parser expects ("MMM D, HH:MM").
// Used for synthetic events derived from live simulated alerts (push pusher).
function _formatNowStamp() {
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  // The timeline anchor 'today' is Mar 25, 2026 (matches baseDate above) so
  // simulated alerts firing in 'today' real-time still land in the Today group.
  const t = new Date();
  const hh = String(t.getHours()).padStart(2, '0');
  const mm = String(t.getMinutes()).padStart(2, '0');
  return `Mar 25, ${hh}:${mm}`;
}

// Map a sim event log entry to a timeline row. Each entry in sim.events
// becomes one row in the Activity tab.
//
// IMPORTANT: each sim event type passes through to classifyEvent.js as-is.
// We do NOT remap to legacy types (leak-detected / valve-closed / etc.)
// because classify() rewrites titles based on type. Use distinct types so
// each gets its own classify case with the correct title.
function _simEventToLifeEvent(systemId, simEvt, idx) {
  if (!simEvt || !simEvt.type) return null;
  const ts = `Mar 25, ${simEvt.timestamp || ''}`;
  const sys = SYSTEMS.find(s => s.id === systemId);
  // Attach the same notifications shape static events have. Without this,
  // rowHasPanel() returns false for sim rows so they aren't expandable.
  const notifications = sys ? notificationsFor(sys, simEvt.timestamp || '') : [];
  return {
    id: `sim_${systemId}_${simEvt._seq ?? idx}_${simEvt.timestamp}`,
    systemId,
    type: simEvt.type,
    severity: simEvt.type === 'leak-detected-low' ? 'high' : 'critical',
    title: simEvt.title || '',
    detail: simEvt.detail || '',
    timestamp: ts,
    actor: 'System',
    notifications,
    resolved: simEvt.type === 'leak-resolved' || simEvt.type === 'leak-resolved-we'
           || simEvt.type === 'valve-resolved' || simEvt.type === 'valve-reconnected'
           || simEvt.type === 'power-restored' || simEvt.type === 'device-online'
           || simEvt.type === 'meter-reconnected',
    // Sort tiebreaker for same-minute events. simEvt._seq comes from
    // simulatedEvents.appendSimulatedEvent. Falls back to idx for legacy.
    _seq: simEvt._seq ?? idx,
  };
}

export function getLifeEventsForSystem(systemId) {
  // Pusher-owns-truth rule: when the pusher has touched this system, the
  // static lifecycle history is suppressed and the Timeline shows ONLY
  // sim rows. Avoids the confusing pre-pusher-mock + sim-pushes mix.
  // "Clear all" on the pusher restores static data.
  const log = getSimulatedEvents(systemId);
  if (log.length) {
    return log.map((e, i) => _simEventToLifeEvent(systemId, e, i)).filter(Boolean);
  }
  // No sim events log for this system. Static history is the only signal.
  const cache = buildCache();
  return cache[systemId] || [];
}
