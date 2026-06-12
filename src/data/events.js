// Event data mapped to Pulse 2.0 spreadsheet systems
// Enriched with event IDs, severity, metadata, notifications, and timeline

import { SYSTEMS, applySimOverlay } from './systems';
import { getActiveIncident, getNotification } from './incidents';
import { isIgnored, getAllIgnored, getIgnoredInfo } from './ignoredIncidents';
import { getSimulatedAlerts, reloadSimulatedAlerts } from './simulatedAlerts';
import { getAllSimulatedEvents } from './simulatedEvents';

export const CURRENT_EVENTS = [
  {
    id: 'e1', type: 'leak-high', system: 'ct1', systemName: 'Cooling Tower #1',
    path: 'Tower One \u00B7 Manchester', title: 'High Flow Water Event',
    detail: '1,150L \u00B7 38.2 L/hour', time: '3h 11m ago',
    timestamp: '2026-03-26T06:11:00', durationSec: 11460,
    resolved: false, dateGroup: 'Today', tappable: true,
    eventId: 'LK-6129384', severity: 'critical',
    metadata: { 'Flow Rate': '38.2 L/h', 'Volume Lost': '1,150L', 'Duration': '3h 11m', 'Threshold': '30 L/h', 'Detection': 'Adaptive algorithm' },
    notifications: [
      { name: 'James Lee', initials: 'JL', channels: ['push'], sentAt: '06:11 AM' },
      { name: 'Maya Tal',  initials: 'MT', channels: ['email'], sentAt: '06:11 AM' },
    ],
    timeline: [
      { label: 'Water Event detected', sublabel: 'High Flow Warning', time: '06:11', flowRate: '38.2 L/h' },
      { label: 'Alert Sent', sublabel: '2 recipients notified', time: '06:11' },
      { label: 'Flow Continues', sublabel: 'Peak rate detected', time: '07:30', flowRate: '40.1 L/h' },
      { label: 'Volume Milestone', sublabel: '1,000L exceeded', time: '08:50' },
    ],
  },
  {
    id: 'e2', type: 'leak-high', system: 'ctt2', systemName: 'Cooling Tower T2',
    path: 'Terminal 2 \u00B7 Heathrow Airport', title: 'High Flow Water Event',
    detail: '890L \u00B7 41.5 L/hour', time: '3h 22m ago',
    timestamp: '2026-03-26T06:00:00', durationSec: 12120,
    resolved: false, dateGroup: 'Today', tappable: true,
    eventId: 'LK-6129401', severity: 'critical',
    metadata: { 'Flow Rate': '41.5 L/h', 'Volume Lost': '890L', 'Duration': '3h 22m', 'Threshold': '30 L/h' },
    notifications: [
      { name: 'Tom Marshall', initials: 'TM', channels: ['push'],  sentAt: '06:00 AM' },
      { name: 'Helen Park',   initials: 'HP', channels: ['email'], sentAt: '06:00 AM' },
    ],
    timeline: [
      { label: 'Water Event detected', sublabel: 'High Flow Warning', time: '05:59', flowRate: '41.5 L/h' },
      { label: 'Alert Sent', sublabel: '1 recipient notified', time: '06:00' },
    ],
  },
  {
    id: 'e3', type: 'leak-high', system: 'shc', systemName: 'Server Hall Cooling',
    path: 'Azure Amsterdam \u00B7 Amsterdam', title: 'High Flow Water Event',
    detail: '2,340L \u00B7 44.1 L/hour', time: '1h 47m ago',
    timestamp: '2026-03-26T07:35:00', durationSec: 6420,
    resolved: false, dateGroup: 'Today', tappable: true,
    eventId: 'LK-6129455', severity: 'critical',
    metadata: { 'Flow Rate': '44.1 L/h', 'Volume Lost': '2,340L', 'Duration': '1h 47m', 'Threshold': '25 L/h', 'Detection': 'Adaptive algorithm' },
    notifications: [
      { name: 'Priya Shah',   initials: 'PS', channels: ['push'], sentAt: '07:35 AM' },
      { name: 'Daniel Levin', initials: 'DL', channels: ['sms'],  sentAt: '07:35 AM' },
    ],
    timeline: [
      { label: 'Water Event detected', sublabel: 'High Flow Warning', time: '07:35', flowRate: '44.1 L/h' },
      { label: 'Alert Sent', sublabel: '2 recipients notified', time: '07:35' },
      { label: 'Flow Continues', sublabel: 'Escalated', time: '08:15', flowRate: '44.1 L/h' },
    ],
  },
  {
    id: 'e4', type: 'leak-low', system: 'sp', systemName: 'Sump Pump B1',
    path: 'Parking Level B1 \u00B7 Manchester', title: 'Low Flow Water Event',
    detail: '42L \u00B7 0.6 L/hour', time: '1h 4m ago',
    timestamp: '2026-03-26T08:18:00', durationSec: 3840,
    resolved: false, dateGroup: 'Today', tappable: true,
    eventId: 'LK-6129470', severity: 'warning',
    metadata: { 'Flow Rate': '0.6 L/h', 'Volume Lost': '42L', 'Duration': '1h 4m', 'Threshold': '0.3 L/h' },
    notifications: [
      { name: 'James Lee', initials: 'JL', channels: ['push'], sentAt: '08:18 AM' },
    ],
    timeline: [
      { label: 'Water Event detected', sublabel: 'Low Flow Warning', time: '08:18', flowRate: '0.6 L/h' },
      { label: 'Alert Sent', sublabel: '1 recipient notified', time: '08:18' },
    ],
  },
  {
    id: 'e5', type: 'leak-low', system: 'f11a', systemName: 'Floor 11 \u2014 DCW/DHW',
    path: 'SG Tower A \u00B7 La D\u00e9fense', title: 'Low Flow Water Event',
    detail: '28L \u00B7 0.9 L/hour', time: '55m ago',
    timestamp: '2026-03-26T08:27:00', durationSec: 3300,
    resolved: false, dateGroup: 'Today', tappable: true,
    eventId: 'LK-6129482', severity: 'warning',
    metadata: { 'Flow Rate': '0.9 L/h', 'Volume Lost': '28L', 'Duration': '55m', 'Threshold': '0.5 L/h' },
    notifications: [
      { name: 'Camille Dubois',    initials: 'CD', channels: ['push'],  sentAt: '08:27 AM' },
      { name: 'Stéphane Wattier', initials: 'SW', channels: ['email'], sentAt: '08:27 AM' },
    ],
    timeline: [
      { label: 'Water Event detected', sublabel: 'Low Flow Warning', time: '08:27', flowRate: '0.9 L/h' },
    ],
  },
  {
    id: 'e6', type: 'leak-low', system: 'csf', systemName: 'Cooling System Forum',
    path: 'Forum des Halles \u00B7 Paris', title: 'Low Flow Water Event',
    detail: '95L \u00B7 0.7 L/hour', time: '2h 5m ago',
    timestamp: '2026-03-26T07:17:00', durationSec: 7500,
    resolved: false, dateGroup: 'Today', tappable: true,
    eventId: 'LK-6129443', severity: 'warning',
    metadata: { 'Flow Rate': '0.7 L/h', 'Volume Lost': '95L', 'Duration': '2h 5m', 'Threshold': '0.3 L/h' },
    notifications: [
      { name: 'Stéphane Wattier', initials: 'SW', channels: ['email'], sentAt: '07:17 AM' },
    ],
    timeline: [
      { label: 'Water Event detected', sublabel: 'Low Flow Warning', time: '07:17', flowRate: '0.7 L/h' },
      { label: 'Alert Sent', sublabel: '1 recipient notified', time: '07:17' },
    ],
  },
  {
    id: 'e7', type: 'valve-error', system: 'ct2', systemName: 'Cooling Tower #2',
    path: 'Tower One \u00B7 Manchester', title: 'Valve error',
    detail: 'Valve failed to respond', time: '47m ago',
    timestamp: '2026-03-26T08:35:00',
    resolved: false, dateGroup: 'Today', tappable: false,
    eventId: 'VL-4820193', severity: 'critical',
    metadata: { 'Error': 'No response from actuator', 'Last Command': 'Close', 'Retry Count': '3', 'Last Success': 'Mar 25, 08:12' },
    notifications: [
      { name: 'Maya Tal', initials: 'MT', channels: ['sms'], sentAt: '08:35 AM' },
    ],
  },
  {
    id: 'e8', type: 'valve-error', system: 'ctb', systemName: 'Cooling Tower B',
    path: 'SG Tower B \u00B7 La D\u00e9fense', title: 'Valve error',
    detail: 'Valve failed to respond', time: '35m ago',
    timestamp: '2026-03-26T08:47:00',
    resolved: false, dateGroup: 'Today', tappable: false,
    eventId: 'VL-4820207', severity: 'critical',
    metadata: { 'Error': 'Timeout on close command', 'Last Command': 'Close', 'Retry Count': '2' },
    notifications: [
      { name: 'Camille Dubois', initials: 'CD', channels: ['push'], sentAt: '08:47 AM' },
    ],
  },
  {
    id: 'e9', type: 'power-lost', system: 'mshq', systemName: 'Main Supply HQ',
    path: 'HQ Building \u00B7 Liverpool', title: 'AC power lost',
    detail: 'Running on battery backup', time: '22m ago',
    timestamp: '2026-03-26T09:00:00',
    resolved: false, dateGroup: 'Today', tappable: false,
    eventId: 'PW-3910284', severity: 'warning',
    metadata: { 'Power Source': 'Battery backup', 'Battery Level': '78%', 'Estimated Runtime': '~6h', 'Last AC': '09:00 AM' },
    notifications: [
      { name: 'James Lee', initials: 'JL', channels: ['push'], sentAt: '09:00 AM' },
    ],
  },
  {
    id: 'e10', type: 'power-lost', system: 'cpta', systemName: 'Chiller Plant Tower A',
    path: 'SG Tower A \u00B7 La D\u00e9fense', title: 'AC power lost',
    detail: 'Running on battery backup', time: '18m ago',
    timestamp: '2026-03-26T09:04:00',
    resolved: false, dateGroup: 'Today', tappable: false,
    eventId: 'PW-3910291', severity: 'warning',
    metadata: { 'Power Source': 'Battery backup', 'Battery Level': '85%', 'Estimated Runtime': '~8h' },
    notifications: [
      { name: 'Stéphane Wattier', initials: 'SW', channels: ['email'], sentAt: '09:04 AM' },
    ],
  },
  {
    id: 'e11', type: 'comm', system: 'dhwhq', systemName: 'DHW Ground Floor',
    path: 'HQ Building \u00B7 Liverpool', title: 'Device offline',
    detail: 'Last seen 5h 33m ago', time: '5h 33m ago',
    timestamp: '2026-03-26T03:49:00',
    resolved: false, dateGroup: 'Today', tappable: false,
    eventId: 'CM-2810451', severity: 'warning',
    metadata: { 'Last Seen': '03:49 AM', 'Connection Type': 'WiFi', 'Signal Strength': 'Weak (-78 dBm)', 'Offline Count (30d)': '3' },
    notifications: [
      { name: 'James Lee', initials: 'JL', channels: ['push'], sentAt: '04:49 AM' },
    ],
  },
  {
    id: 'e12', type: 'comm', system: 'msm', systemName: 'Main Supply Munich',
    path: 'Munich Office \u00B7 Munich', title: 'Device offline',
    detail: 'Last seen 2h 18m ago', time: '2h 18m ago',
    timestamp: '2026-03-26T07:04:00',
    resolved: false, dateGroup: 'Today', tappable: false,
    eventId: 'CM-2810467', severity: 'warning',
    metadata: { 'Last Seen': '07:04 AM', 'Connection Type': 'Cellular', 'Offline Count (30d)': '1' },
  },
  {
    id: 'e13', type: 'comm', system: 'dhwt2', systemName: 'DHW Staff Areas T2',
    path: 'Terminal 2 \u00B7 Heathrow Airport', title: 'Device offline',
    detail: 'Last seen 1h 12m ago', time: '1h 12m ago',
    timestamp: '2026-03-26T08:10:00',
    resolved: false, dateGroup: 'Today', tappable: false,
    eventId: 'CM-2810473', severity: 'warning',
    metadata: { 'Last Seen': '08:10 AM', 'Connection Type': 'WiFi', 'Signal Strength': 'Good (-52 dBm)' },
  },
  {
    id: 'e14', type: 'comm', system: 'f9a', systemName: 'Floor 9 \u2014 DCW/DHW',
    path: 'SG Tower A \u00B7 La D\u00e9fense', title: 'Device offline',
    detail: 'Last seen 3h 47m ago', time: '3h 47m ago',
    timestamp: '2026-03-26T05:35:00',
    resolved: false, dateGroup: 'Today', tappable: false,
    eventId: 'CM-2810459', severity: 'warning',
    metadata: { 'Last Seen': '05:35 AM', 'Connection Type': 'Ethernet', 'Offline Count (30d)': '5' },
  },
  {
    id: 'e15', type: 'comm', system: 'msd', systemName: 'Main Supply Dublin',
    path: 'Azure Dublin \u00B7 Dublin', title: 'Device offline',
    detail: 'Last seen 44m ago', time: '44m ago',
    timestamp: '2026-03-26T08:38:00',
    resolved: false, dateGroup: 'Today', tappable: false,
    eventId: 'CM-2810480', severity: 'info',
    metadata: { 'Last Seen': '08:38 AM', 'Connection Type': 'Cellular', 'Signal Strength': 'Moderate (-65 dBm)' },
  },
  {
    id: 'e16', type: 'leak-low', system: 'tidhar_apt_47', systemName: 'Apt 47',
    path: 'Petah Tikva \u00B7 Tidhar', title: 'Low Flow Water Event',
    detail: '8L \u00B7 0.4 L/hour', time: '35m ago',
    timestamp: '2026-03-26T08:47:00', durationSec: 2100,
    resolved: false, dateGroup: 'Today', tappable: true,
    eventId: 'LK-6129490', severity: 'warning',
    metadata: { 'Flow Rate': '0.4 L/h', 'Volume Lost': '8L', 'Duration': '35m', 'Threshold': '0.2 L/h' },
    notifications: [
      { name: 'Yossi Shapira', initials: 'YS', channels: ['push'], sentAt: '08:47 AM' },
      { name: 'Ronen Avraham', initials: 'RA', channels: ['sms'],  sentAt: '08:47 AM' },
    ],
  },
  {
    id: 'e17', type: 'comm', system: 'tidhar_apt_156', systemName: 'Apt 156',
    path: 'Petah Tikva \u00B7 Tidhar', title: 'Device offline',
    detail: 'Last seen 2h 10m ago', time: '2h 10m ago',
    timestamp: '2026-03-26T07:12:00',
    resolved: false, dateGroup: 'Today', tappable: false,
    eventId: 'CM-2810488', severity: 'warning',
    metadata: { 'Last Seen': '07:12 AM', 'Connection Type': 'WiFi' },
  },
  {
    id: 'e18', type: 'valve-error', system: 'cbre_uk_mc_ct', systemName: 'Cooling Tower',
    path: 'Manchester Exchange \u00B7 Manchester', title: 'Valve error',
    detail: 'Valve failed to respond', time: '1h 15m ago',
    timestamp: '2026-03-26T08:07:00',
    resolved: false, dateGroup: 'Today', tappable: false,
    eventId: 'VL-4820215', severity: 'critical',
    metadata: { 'Error': 'Actuator not responding', 'Last Command': 'Open', 'Retry Count': '3' },
    notifications: [
      { name: 'Helen Park',  initials: 'HP', channels: ['push'],  sentAt: '08:07 AM' },
      { name: 'Tom Marshall',initials: 'TM', channels: ['email'], sentAt: '08:07 AM' },
    ],
  },
];

export const HISTORY_EVENTS = [
  {
    id: 'h1', type: 'leak-high', system: 'ct1', systemName: 'Cooling Tower #1',
    path: 'Tower One \u00B7 Manchester', title: 'High Flow Water Event',
    detail: '2,340L \u00B7 6h 12m \u00B7 Equipment fault', time: 'Mar 15',
    timestamp: '2026-03-15T02:15:00', durationSec: 22320,
    resolved: true, dateGroup: 'Mar 15', tappable: true,
    eventId: 'LK-6128901', severity: 'critical',
    metadata: { 'Flow Rate': '38.5 L/h', 'Volume Lost': '2,340L', 'Duration': '6h 12m', 'Root Cause': 'Equipment fault' },
    timeline: [
      { label: 'Water Event detected', sublabel: 'High Flow Warning', time: '02:15', flowRate: '38.5 L/h' },
      { label: 'Alert Sent', sublabel: '2 recipients notified', time: '02:15' },
      { label: 'Valve Closed', sublabel: 'Auto shut-off', time: '02:15' },
      { label: 'Water Event ended', sublabel: 'Tagged: Equipment fault', time: '08:27' },
    ],
  },
  {
    id: 'h2', type: 'leak-low', system: 'sp', systemName: 'Sump Pump B1',
    path: 'Parking Level B1 \u00B7 Manchester', title: 'Low Flow Water Event',
    detail: '18L \u00B7 25m \u00B7 Pipe joint', time: 'Mar 12',
    timestamp: '2026-03-12T11:30:00', durationSec: 1500,
    resolved: true, dateGroup: 'Mar 12', tappable: true,
    eventId: 'LK-6128850', severity: 'warning',
    metadata: { 'Flow Rate': '0.7 L/h', 'Volume Lost': '18L', 'Duration': '25m', 'Root Cause': 'Pipe joint' },
  },
  {
    id: 'h3', type: 'power-lost', system: 'mshq', systemName: 'Main Supply HQ',
    path: 'HQ Building \u00B7 Liverpool', title: 'AC power lost',
    detail: 'Outage duration: 1h 42m', time: 'Mar 10',
    timestamp: '2026-03-10T14:20:00',
    resolved: true, dateGroup: 'Mar 10', tappable: false,
    eventId: 'PW-3910210', severity: 'warning',
    metadata: { 'Outage Duration': '1h 42m', 'Power Source': 'Battery during outage' },
  },
  {
    id: 'h4', type: 'valve-error', system: 'ct2', systemName: 'Cooling Tower #2',
    path: 'Tower One \u00B7 Manchester', title: 'Valve error',
    detail: 'Valve replaced \u00B7 2h 5m', time: 'Mar 8',
    timestamp: '2026-03-08T09:45:00',
    resolved: true, dateGroup: 'Mar 8', tappable: false,
    eventId: 'VL-4820101', severity: 'critical',
    metadata: { 'Error': 'Actuator failure', 'Resolution': 'Valve replaced', 'Downtime': '2h 5m' },
  },
  {
    id: 'h5', type: 'comm', system: 'msm', systemName: 'Main Supply Munich',
    path: 'Munich Office \u00B7 Munich', title: 'Device offline',
    detail: 'Offline duration: 3h 20m', time: 'Mar 5',
    timestamp: '2026-03-05T06:30:00',
    resolved: true, dateGroup: 'Mar 5', tappable: false,
    eventId: 'CM-2810390', severity: 'warning',
    metadata: { 'Offline Duration': '3h 20m', 'Connection Type': 'Cellular', 'Cause': 'Network outage' },
  },
  {
    id: 'h6', type: 'leak-high', system: 'msl', systemName: 'Main Supply Line',
    path: 'Tower One \u00B7 Manchester', title: 'High Flow Water Event',
    detail: '890L \u00B7 2h 34m \u00B7 Aging pipe', time: 'Feb 28',
    timestamp: '2026-02-28T14:30:00', durationSec: 9240,
    resolved: true, dateGroup: 'Feb 28', tappable: true,
    eventId: 'LK-6128720', severity: 'critical',
    metadata: { 'Flow Rate': '35.2 L/h', 'Volume Lost': '890L', 'Duration': '2h 34m', 'Root Cause': 'Aging pipe' },
    timeline: [
      { label: 'Water Event detected', sublabel: 'High Flow Warning', time: '14:30', flowRate: '35.2 L/h' },
      { label: 'Valve Closed', sublabel: 'Auto shut-off', time: '14:30' },
      { label: 'Water Event ended', sublabel: 'Tagged: Aging pipe', time: '17:04' },
    ],
  },
];

export const EVENT_TYPES = [
  { key: 'leak-high',  label: 'High Flow Water Event',  color: '#DB4670', matchTypes: ['leak-high'] },
  { key: 'leak-low',   label: 'Low Flow Water Event',   color: '#F05C25', matchTypes: ['leak-low'] },
  { key: 'valve',      label: 'Valve events',    color: '#717684', matchTypes: ['valve', 'valve-error'] },
  { key: 'power-lost', label: 'Power events',    color: '#717684', matchTypes: ['power-lost'] },
  { key: 'comm',       label: 'Communication',   color: '#717684', matchTypes: ['comm'] },
];

// tokens.css aligned: danger-main #a5455e · orange-main #f97316 · text-tertiary #7a8189
// Cross-source event normaliser — used by lifeEvents.js to fold every alert
// (current + history + ignored) into the per-system Activity timeline under
// its original `e<N>` / `h<N>` id. This is the single piece that lets the
// Alerts → History → tap-event deep-link match the right row in the Timeline
// tab: same id used in both surfaces.
const _MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function _formatLifeEventTs(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${_MONTHS[d.getMonth()]} ${d.getDate()}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function _toLifeEventType(ev) {
  // Map Alerts-list types to the ActivityTab classify() vocabulary.
  let t = ev.type;
  if (t === 'comm' || t === 'offline') t = 'device-offline';
  if (!ev.resolved) return t;
  // Resolved variants → switch to the "ended" type so the row gets the green
  // ✓ badge in the Timeline (Variant A locked).
  if (t === 'leak-high' || t === 'leak-low') return 'leak-resolved';
  if (t === 'valve-error') return 'valve-resolved';
  if (t === 'power-lost') return 'power-restored';
  if (t === 'device-offline') return 'device-online';
  return t;
}
export function getEventsForSystem(sysId) {
  return [...CURRENT_EVENTS, ...HISTORY_EVENTS]
    .filter(ev => ev.system === sysId)
    .map(ev => ({
      id: ev.id,                        // 'e7', 'h12', ... — preserved across surfaces
      systemId: ev.system,
      type: _toLifeEventType(ev),
      severity: ev.severity,
      title: ev.title,
      detail: ev.detail,
      timestamp: _formatLifeEventTs(ev.timestamp),
      actor: 'System',
      notifications: ev.notifications,
      resolved: !!ev.resolved,
    }));
}

export function getEventTypeColor(type) {
  const map = {
    'leak-high':         '#a5455e',
    'leak-low':          '#f97316',
    'valve':             '#7a8189',
    'valve-error':       '#7a8189',
    'power-lost':        '#7a8189',
    'comm':              '#7a8189',
    'battery-critical':  '#7a8189',
    'battery-low':       '#7a8189',
    'offline':           '#7a8189',
    'no-recipients':     '#DB4670',  // configuration gap \u2014 surfaced in Alerts > Configuration
  };
  return map[type] || '#7a8189';
}

export function getEventTypeIcon(type) {
  if (type === 'leak-high' || type === 'leak-low') return '\uD83D\uDCA7';
  if (type === 'valve' || type === 'valve-error') return '\u2699\uFE0F';
  if (type === 'power-lost') return '\u26A1';
  if (type === 'no-recipients') return '\uD83D\uDD15'; // bell with slash
  return '\uD83D\uDCE1';
}

/** True if this event type is a configuration gap (state-based, not time-based). */
export function isConfigurationGap(type) {
  return type === 'no-recipients';
}

// ─── Active events derived from systems + incidents (single source of truth) ──

const TYPE_TITLE = {
  'leak-high':        'High Flow Water Event',
  'leak-low':         'Low Flow Water Event',
  'valve-error':      'Valve error',
  'power-lost':       'AC power lost',
  'offline':          'Device offline',
  'battery-low':      'Battery low',
  'battery-critical': 'Battery critical',
};

const STEP_TITLE = {
  detected:           'Water Event detected',
  'alert-sent':       'Alert Sent',
  continues:          'Flow Continues',
  'reminder-sent':    'Ongoing reminder',  // OL push per V10.9
  'valve-error':      'Valve error',       // V_ER push per V10.9
  'volume-milestone': 'Volume Milestone',
  'valve-closed':     'Valve Closed',
};

function hashId(s) {
  let h = 0;
  for (const c of (s || '')) h = (h * 31 + c.charCodeAt(0)) % 100000;
  return h.toString().padStart(4, '0');
}

function initialsFor(name) {
  return (name || '').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

// Build a "today at HH:MM" naive ISO timestamp (no offset, treated as system-local downstream).
function timestampFromTodayClock(hhmm) {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null;
  const [hh, mm] = hhmm.split(':').map(Number);
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hh)}:${pad(mm)}:00`;
}

function buildActiveEvent(sys) {
  const alert = sys.alert;
  if (!alert) return null;
  const isLeak = alert.type === 'leak-high' || alert.type === 'leak-low';
  const incident = isLeak ? getActiveIncident(sys.id) : null;
  const notif = incident ? getNotification(incident) : null;

  const timestamp = timestampFromTodayClock(alert.startedAt);
  const durationSec = timestamp
    ? Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000))
    : null;

  const path = sys.l4Name && sys.l3Name ? `${sys.l4Name} · ${sys.l3Name}` : (sys.l3Name || sys.l4Name || '');

  // Detail is set only when it adds info beyond the type pill.
  // For non-leak alerts (offline / valve error / power lost), the type label
  // already conveys what the detail would say, so we leave it empty to avoid
  // the "Offline + Device offline" duplication in the row.
  let detail = '';
  if (alert.flowRate) {
    detail = alert.volume ? `${alert.volume} · ${alert.flowRate}` : alert.flowRate;
  }

  const idPrefix = isLeak ? 'LK' : alert.type === 'valve-error' ? 'VE' : alert.type === 'power-lost' ? 'PW' : 'CM';
  const eventId = `${idPrefix}-${hashId(incident?.id || sys.id)}`;

  const metadata = {};
  if (alert.flowRate) metadata['Flow Rate'] = alert.flowRate;
  if (alert.volume) metadata['Volume Lost'] = alert.volume;
  if (alert.age) metadata['Duration'] = alert.age;

  const notifications = notif?.recipients?.length
    ? notif.recipients.map(name => ({
        name,
        initials: initialsFor(name),
        channels: notif.channels,
        sentAt: alert.startedAt || '',
      }))
    : [];

  const timeline = incident?.steps
    ? incident.steps.map(step => ({
        label: STEP_TITLE[step.type] || step.type,
        sublabel: step.detail,
        time: step.time,
        flowRate: step.flowRate,
      }))
    : [];

  return {
    id: `act_${sys.id}`,
    type: alert.type,
    system: sys.id,
    systemName: sys.name,
    path,
    title: TYPE_TITLE[alert.type] || alert.label,
    detail,
    time: alert.age || '',
    timestamp,
    durationSec,
    resolved: false,
    dateGroup: 'Today',
    tappable: isLeak,
    eventId,
    severity: alert.type === 'leak-high' ? 'critical' : 'warning',
    metadata,
    notifications,
    timeline,
  };
}

/**
 * Build pseudo-events for systems that have NO notification recipients configured.
 * These are state-based "configuration gaps" — they aren't real events with a
 * lifecycle, so they have no timestamp and no notifications/timeline. They're
 * folded into the Alerts feed under the Configuration filter so users have a
 * single place to find everything that needs their attention.
 */
export function computeConfigurationGaps() {
  return SYSTEMS
    .filter(s => (s.notificationRecipients || 0) === 0)
    .map(s => ({
      id:         `cfg_${s.id}`,
      type:       'no-recipients',
      system:     s.id,
      systemName: s.name,
      path:       [s.l3Name, s.l4Name].filter(Boolean).join(' · '),
      title:      'No notification recipients',
      detail:     'Add at least one recipient to receive alerts',
      time:       'Since setup',
      timestamp:  null,           // intentional — state, not event
      resolved:   false,
      dateGroup:  'Configuration',
      tappable:   true,
      severity:   'warning',
      configGap:  true,
    }));
}

/**
 * Build a "secondary" event for a dimension issue that exists on a system
 * but isn't reflected in sys.alert.type. Bare-bones — no timeline, no
 * notifications, no metadata. Used when a system has multiple concurrent
 * issues (e.g. Water Event + Valve Error) so each issue gets its own row in
 * the Alerts feed and filtering by category catches all of them.
 */
function buildSecondaryEvent(sys, type) {
  const path = sys.l4Name && sys.l3Name ? `${sys.l4Name} · ${sys.l3Name}` : (sys.l3Name || sys.l4Name || '');
  const idPrefix = type === 'valve-error' ? 'VE' : type === 'power-lost' ? 'PW' : 'CM';
  return {
    id: `act_${sys.id}_${type}`,
    type,
    system: sys.id,
    systemName: sys.name,
    path,
    title: TYPE_TITLE[type] || type,
    detail: '',
    time: '',
    timestamp: null,
    durationSec: null,
    resolved: false,
    dateGroup: 'Today',
    tappable: false,
    eventId: `${idPrefix}-${hashId(sys.id + '_' + type)}`,
    severity: 'warning',
    metadata: {},
    notifications: [],
    timeline: [],
  };
}

/**
 * Derive the live "Active" event list from systems.js + incidents.js.
 * Single source of truth — replaces the static active subset of CURRENT_EVENTS.
 * Excludes Water Events the user has ignored (those move to History).
 *
 * A single system can contribute MULTIPLE events when it has multiple
 * concurrent issues (e.g. Water Event AND Valve Error). The primary event
 * comes from sys.alert (richest data); additional issues on the same system
 * (sys.valve === 'error' / sys.comm === 'offline' / sys.power === 'ac-lost')
 * generate bare secondary events so each issue is filterable and countable
 * independently, matching how the Home Systems Health widget counts.
 */
export function computeActiveEvents() {
  reloadSimulatedAlerts();
  const sims = getSimulatedAlerts();
  const out = [];

  for (const sysOrig of SYSTEMS) {
    // applySimOverlay handles: resolved tombstone, sim alert overlay,
    // and implicit sys.power/comm/valve overrides for non-water sims.
    // Single source of truth shared with getSystemById + UserContext.
    const sys = applySimOverlay(sysOrig, sims[sysOrig.id]);
    const primaryType = sys.alert?.type || null;
    const isWaterAlert = primaryType === 'leak-high' || primaryType === 'leak-low';
    const waterIgnored = isWaterAlert && isIgnored(sys.id);

    // Primary alert (if any). Water events that have been ignored are skipped
    // entirely — but secondary issues on the same system are NOT skipped, they
    // still represent active problems the user should see.
    if (sys.alert && !waterIgnored) {
      const ev = buildActiveEvent(sys);
      if (ev) out.push(ev);
    }

    // Secondary issues — emit one event per failing dimension whose category
    // isn't already represented by the primary alert.
    if (sys.valve === 'error' && primaryType !== 'valve-error') {
      out.push(buildSecondaryEvent(sys, 'valve-error'));
    }
    const primaryIsComm = primaryType === 'offline' || primaryType === 'comm';
    if (sys.comm === 'offline' && !primaryIsComm) {
      out.push(buildSecondaryEvent(sys, 'offline'));
    }
    if (sys.power === 'ac-lost' && primaryType !== 'power-lost') {
      out.push(buildSecondaryEvent(sys, 'power-lost'));
    }
  }

  return out;
}

/**
 * Build event-shape entries for Water Events the user has ignored.
 * Used in the History tab.
 */
// Pusher-resolved events for the Alerts History tab.
//
// When the pusher fires "End of Leak" (or any closure push), the active sim
// alert is tombstoned but the events log keeps the lifecycle row. The Alerts
// History tab needs a way to surface those resolved events so users can find
// what they just closed.
//
// Each system whose sim events log contains a resolution row contributes one
// entry here (the most recent resolution row, since the log restarts on each
// new Warning).
export function computePusherResolvedEvents() {
  const log = getAllSimulatedEvents();
  const out = [];
  for (const [systemId, rows] of Object.entries(log || {})) {
    if (!Array.isArray(rows) || rows.length === 0) continue;
    // Find the most recent resolution row in this system's log.
    const RESOLVED_TYPES = new Set([
      'leak-resolved-we', 'leak-resolved',
      'valve-resolved', 'valve-reconnected',
      'power-restored', 'device-online', 'meter-reconnected',
    ]);
    const resolvedRow = [...rows].reverse().find(r => RESOLVED_TYPES.has(r?.type));
    if (!resolvedRow) continue;
    const sys = SYSTEMS.find(s => s.id === systemId);
    if (!sys) continue;
    // Map sim event types to the History entry's alert type for filter
    // compatibility with the Active tab.
    const isWater = resolvedRow.type === 'leak-resolved-we' || resolvedRow.type === 'leak-resolved';
    const alertType = isWater
      ? (rows.some(r => r.type === 'leak-detected-low') ? 'leak-low' : 'leak-high')
      : (resolvedRow.type === 'valve-resolved' || resolvedRow.type === 'valve-reconnected') ? 'valve-error'
      : (resolvedRow.type === 'power-restored') ? 'power-lost'
      : (resolvedRow.type === 'device-online') ? 'offline'
      : 'leak-high';
    out.push({
      id: `simres_${systemId}_${resolvedRow._seq ?? rows.indexOf(resolvedRow)}`,
      type: alertType,
      system: sys.id,
      systemName: sys.name,
      path: [sys.l4Name, sys.l3Name].filter(Boolean).join(' · '),
      title: resolvedRow.title || 'Resolved',
      detail: resolvedRow.detail || '',
      time: resolvedRow.timestamp || '',
      timestamp: `Mar 25, ${resolvedRow.timestamp || ''}`,
      durationSec: 0,
      resolved: true,
      dateGroup: 'Today',
      notifications: [],
      timeline: rows.map(r => ({
        label: r.title || r.type,
        sublabel: r.detail || '',
        time: r.timestamp || '',
      })),
    });
  }
  return out;
}

export function computeIgnoredEvents() {
  return getAllIgnored().map(({ systemId }) => {
    const sys = SYSTEMS.find(s => s.id === systemId);
    if (!sys || !sys.alert) return null;
    const isWater = sys.alert.type === 'leak-high' || sys.alert.type === 'leak-low';
    if (!isWater) return null;
    const event = buildActiveEvent(sys);
    if (!event) return null;
    const info = getIgnoredInfo(systemId);
    return {
      ...event,
      id: `ign_${sys.id}`,
      resolved: true,
      ignored: true,
      dateGroup: 'Today',
      ignoredInfo: info,
    };
  }).filter(Boolean);
}

// Legacy CT1-specific exports
export const CT1_EVENTS = [
  {
    id: 'c1', type: 'leak-high',
    title: 'Water Event detected', metric: '38.2 L/hour',
    detail: 'Flow rate crossed threshold (>30 L/hour)', time: '3h 11m ago',
    dotColor: '#DB4670',
  },
  {
    id: 'c2', type: 'comm',
    title: 'Alert Sent', metric: null,
    detail: 'Push notification to James Lee', time: '3h 10m ago',
    dotColor: '#717684',
  },
  {
    id: 'c3', type: 'comm',
    title: 'Flow rate update', metric: '40.1 L/hour',
    detail: 'Peak rate detected', time: '2h 30m ago',
    dotColor: '#DB4670',
  },
  {
    id: 'c4', type: 'comm',
    title: 'Flow rate update', metric: '37.8 L/hour',
    detail: 'Stable high flow', time: '1h 15m ago',
    dotColor: '#DB4670',
  },
  {
    id: 'c5', type: 'comm',
    title: 'Volume milestone', metric: '1,000L',
    detail: 'Total water lost exceeded 1,000L', time: '42m ago',
    dotColor: '#F05C25',
  },
];

export const CT1_HISTORY_LEAKS = [
  {
    id: 'lh1', severity: 'high', date: 'Mar 15, 2026',
    volume: '2,340L', rate: '38.5 L/hour', duration: '6h 12m', tag: 'Equipment fault',
  },
  {
    id: 'lh2', severity: 'low', date: 'Jan 22, 2026',
    volume: '95L', rate: '3.2 L/hour', duration: '29m', tag: 'Pipe joint',
  },
  {
    id: 'lh3', severity: 'high', date: 'Nov 4, 2025',
    volume: '5,820L', rate: '47.1 L/hour', duration: '12h 18m', tag: 'Aging pipe',
  },
];
