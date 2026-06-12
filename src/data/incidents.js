// Leak incident timelines — active and resolved
// Active incidents exist for every system with an active leak alert

const INCIDENTS = [
  // ─── Active incidents ──────────────────────────────────────────────────────

  // Rich example demonstrating every timeline entry type \u2014 handoff between
  // John and Bob, a cloud reminder, a volume milestone. Use ct1 to demo.
  {
    id: 'inc_ct1_1',
    systemId: 'ct1',
    status: 'active',
    startedAt: '06:11',
    steps: [
      { type: 'detected', time: '06:11', timeAgo: '3h 11m ago', flowRate: '38.2 L/hour', detail: 'Flow rate crossed high-flow threshold on cooling tower main inlet' },
      { type: 'alert-sent', time: '06:11', timeAgo: '3h 10m ago', detail: '2 recipients \u00b7 Push + Email',
        recipients: [
          { name: 'James Lee', channels: ['push'] },
          { name: 'Maya Tal',  channels: ['email'] },
        ] },
      { type: 'on-it', time: '06:14', timeAgo: '3h 7m ago', actor: 'John', detail: 'Acknowledged \u00b7 system behavior unchanged' },
      { type: 'continues', time: '06:45', timeAgo: '2h 37m ago', flowRate: '40.1 L/hour', detail: 'Peak flow rate detected on cooling loop' },
      { type: 'stand-down', time: '07:20', timeAgo: '2h 2m ago', actor: 'John', detail: 'Released ownership \u2014 stuck in another call' },
      { type: 'on-it', time: '07:22', timeAgo: '2h ago', actor: 'Bob', detail: 'Acknowledged \u2014 walking over to inspect' },
      { type: 'continues', time: '07:50', timeAgo: '1h 32m ago', flowRate: '37.8 L/hour', detail: 'Stable high flow continuing \u2014 engineer en route' },
      { type: 'volume-milestone', time: '08:30', timeAgo: '52m ago', volume: '1,000L', detail: 'Total water lost exceeded 1,000L' },
      { type: 'reminder-sent', time: '09:11', timeAgo: '11m ago', detail: '3h ongoing reminder \u00b7 Push',
        recipients: [
          { name: 'Bob (current owner)', channels: ['push'] },
        ] },
    ],
  },
  {
    id: 'inc_sp_1',
    systemId: 'sp',
    status: 'active',
    startedAt: '08:18',
    steps: [
      { type: 'detected', time: '08:18', timeAgo: '1h 4m ago', flowRate: '0.6 L/hour', detail: 'Low-flow anomaly detected on sump pump drainage line' },
      { type: 'alert-sent', time: '08:18', timeAgo: '1h 3m ago', detail: '1 recipient · Push' },
      { type: 'continues', time: '08:50', timeAgo: '32m ago', flowRate: '0.7 L/hour', detail: 'Flow slightly increasing \u2014 suspected pipe joint in basement level' },
    ],
  },
  {
    id: 'inc_ctt2_1',
    systemId: 'ctt2',
    status: 'active',
    startedAt: '06:00',
    steps: [
      { type: 'detected', time: '06:00', timeAgo: '3h 22m ago', flowRate: '41.5 L/hour', detail: 'Flow rate crossed high-flow threshold on T2 cooling tower' },
      { type: 'alert-sent', time: '06:00', timeAgo: '3h 21m ago', detail: '2 recipients · Push' },
      { type: 'continues', time: '06:30', timeAgo: '2h 52m ago', flowRate: '43.2 L/hour', detail: 'Peak flow rate \u2014 potential burst on cooling loop' },
      { type: 'volume-milestone', time: '08:15', timeAgo: '1h 7m ago', volume: '800L', detail: 'Total water lost exceeded 800L' },
    ],
  },
  {
    id: 'inc_f11a_1',
    systemId: 'f11a',
    status: 'active',
    startedAt: '08:27',
    steps: [
      { type: 'detected', time: '08:27', timeAgo: '55m ago', flowRate: '0.9 L/hour', detail: 'Low-flow anomaly detected on Floor 11 DCW/DHW line' },
      { type: 'alert-sent', time: '08:27', timeAgo: '54m ago', detail: '1 recipient · Push' },
      { type: 'continues', time: '08:55', timeAgo: '27m ago', flowRate: '0.9 L/hour', detail: 'Stable low flow \u2014 possible toilet cistern leak on floor 11' },
    ],
  },
  {
    id: 'inc_csf_1',
    systemId: 'csf',
    status: 'active',
    startedAt: '07:17',
    steps: [
      { type: 'detected', time: '07:17', timeAgo: '2h 5m ago', flowRate: '0.7 L/hour', detail: 'Low-flow anomaly detected on Forum cooling system' },
      { type: 'alert-sent', time: '07:17', timeAgo: '2h 4m ago', detail: '1 recipient · Push' },
      { type: 'continues', time: '08:00', timeAgo: '1h 22m ago', flowRate: '0.7 L/hour', detail: 'Stable low flow \u2014 suspected seal on cooling loop valve' },
    ],
  },
  {
    id: 'inc_shc_1',
    systemId: 'shc',
    status: 'active',
    startedAt: '07:35',
    steps: [
      { type: 'detected', time: '07:35', timeAgo: '1h 47m ago', flowRate: '44.1 L/hour', detail: 'Flow rate crossed high-flow threshold on server hall cooling loop' },
      { type: 'alert-sent', time: '07:35', timeAgo: '1h 46m ago', detail: '2 recipients · Push' },
      { type: 'continues', time: '08:00', timeAgo: '1h 22m ago', flowRate: '45.2 L/hour', detail: 'Peak flow rate \u2014 suspected burst on cooling manifold' },
      { type: 'volume-milestone', time: '08:45', timeAgo: '37m ago', volume: '2,000L', detail: 'Total water lost exceeded 2,000L' },
    ],
  },

  {
    id: 'inc_tidhar_apt_47_1',
    systemId: 'tidhar_apt_47',
    status: 'active',
    startedAt: '08:47',
    steps: [
      { type: 'detected', time: '08:47', timeAgo: '35m ago', flowRate: '0.4 L/hour', detail: 'Low-flow anomaly detected on apartment 47 water line' },
      { type: 'alert-sent', time: '08:47', timeAgo: '34m ago', detail: '1 recipient · Push' },
      { type: 'continues', time: '09:10', timeAgo: '12m ago', flowRate: '0.4 L/hour', detail: 'Stable low flow \u2014 suspected fixture leak in apartment 47' },
    ],
  },

  // ─── Herzliya Campus A — LEAK DEMO SCENARIOS ──────────────────────────────

  // Scenario 1: Main Supply — High Flow, valve closed successfully.
  // Full lifecycle showcasing shutoff-threshold + valve-closed (auto) + leak-ended
  // + manual valve reopen.
  {
    id: 'inc_hz_ms_1',
    systemId: 'cbre_il_hz_ms',
    status: 'active',
    startedAt: '07:30',
    steps: [
      { type: 'detected', time: '07:30', timeAgo: '1h 45m ago', flowRate: '120 L/hour', detail: 'High-flow anomaly detected on main supply line — Adaptive detector' },
      { type: 'alert-sent', time: '07:30', timeAgo: '1h 44m ago', detail: '1 recipient · Push · Email',
        recipients: [
          { name: 'CBRE IL FM Team', channels: ['push', 'email'] },
        ] },
      { type: 'continues', time: '07:33', timeAgo: '1h 42m ago', flowRate: '118 L/hour', volume: '49 L', detail: 'Flow rate stable' },
      { type: 'shutoff-threshold', time: '07:35', timeAgo: '1h 40m ago', volume: '69 L', detail: 'Auto shut-off triggered — close command sent to valve' },
      { type: 'valve-closed', time: '07:36', timeAgo: '1h 39m ago', detail: 'Valve confirmed closed · automatic action' },
      { type: 'leak-ended', time: '08:30', timeAgo: '45m ago', volume: '70 L · 1h total', detail: 'Residual flow drained · valve holding' },
      { type: 'valve-opened-manual', time: '08:35', timeAgo: '40m ago', actor: 'John (Operator)', detail: 'From the device\'s "Open Valve" button' },
    ],
  },
  // Scenario 2: Cooling Tower — High Flow, valve error
  {
    id: 'inc_hz_ct_1',
    systemId: 'cbre_il_hz_ct',
    status: 'active',
    startedAt: '06:55',
    steps: [
      { type: 'detected', time: '06:55', timeAgo: '2h 20m ago', flowRate: '85 L/hour', detail: 'High-flow anomaly detected on cooling tower inlet — Adaptive detector' },
      { type: 'alert-sent', time: '06:55', timeAgo: '2h 19m ago', detail: '2 recipients · Push · SMS' },
      { type: 'continues', time: '07:00', timeAgo: '2h 15m ago', flowRate: '90 L/hour', detail: 'Shutoff threshold reached — valve close command sent' },
      { type: 'valve-error', time: '07:01', timeAgo: '2h 14m ago', detail: 'Valve error - failed to close. Manual intervention required.' },
      { type: 'continues', time: '08:00', timeAgo: '1h 15m ago', flowRate: '85 L/hour', detail: 'Leak ongoing — valve still in error state' },
      { type: 'volume-milestone', time: '08:45', timeAgo: '30m ago', volume: '1,200L', detail: 'Total water lost exceeded 1,200L' },
    ],
  },
  // Scenario 3: DHW Building A — High Flow, no valve
  {
    id: 'inc_hz_dhw_1',
    systemId: 'cbre_il_hz_dhw',
    status: 'active',
    startedAt: '06:05',
    steps: [
      { type: 'detected', time: '06:05', timeAgo: '3h 10m ago', flowRate: '95 L/hour', detail: 'High-flow anomaly detected on DHW line — no valve installed' },
      { type: 'alert-sent', time: '06:05', timeAgo: '3h 9m ago', detail: 'Push + Email sent to CBRE IL FM Team' },
      { type: 'continues', time: '06:35', timeAgo: '2h 40m ago', flowRate: '92 L/hour', detail: 'No automatic shutoff available — manual intervention required' },
      { type: 'continues', time: '07:30', timeAgo: '1h 45m ago', flowRate: '95 L/hour', detail: 'Ongoing reminder sent — leak persists' },
      { type: 'volume-milestone', time: '08:30', timeAgo: '45m ago', volume: '2,000L', detail: 'Total water lost exceeded 2,000L' },
    ],
  },
  // Scenario 4: Fire Riser — Low Flow
  {
    id: 'inc_hz_fr_1',
    systemId: 'cbre_il_hz_fr',
    status: 'active',
    startedAt: '03:45',
    steps: [
      { type: 'detected', time: '03:45', timeAgo: '5h 30m ago', flowRate: '8.2 L/hour', detail: 'Low-flow anomaly detected on fire riser — Adaptive detector' },
      { type: 'alert-sent', time: '03:45', timeAgo: '5h 29m ago', detail: '1 recipient · Push' },
      { type: 'continues', time: '08:00', timeAgo: '1h 15m ago', flowRate: '8.2 L/hour', detail: '24h ongoing reminder — low flow persists on fire suppression line' },
    ],
  },

  // ─── Resolved historical incidents ──────────────────────────────────────────

  {
    id: 'inc_ct1_h1',
    systemId: 'ct1',
    status: 'resolved',
    startedAt: '03:00',
    resolvedAt: '09:12',
    steps: [
      { type: 'detected', time: '03:00', timeAgo: 'Mar 15, 03:00', flowRate: '38.5 L/hour', detail: 'Flow rate crossed high-flow threshold on cooling tower' },
      { type: 'alert-sent', time: '03:00', timeAgo: 'Mar 15, 03:00', detail: '1 recipient · Push' },
      { type: 'continues', time: '05:00', timeAgo: 'Mar 15, 05:00', flowRate: '40.2 L/hour', detail: 'Peak flow rate \u2014 equipment fault suspected' },
      { type: 'volume-milestone', time: '06:30', timeAgo: 'Mar 15, 06:30', volume: '2,000L', detail: 'Total water lost exceeded 2,000L' },
      { type: 'valve-closed', time: '07:30', timeAgo: 'Mar 15, 07:30', detail: 'Valve closed remotely by James Lee' },
      { type: 'resolved', time: '09:12', timeAgo: 'Mar 15, 09:12', volume: '2,340L', detail: 'Incident resolved \u2014 equipment fault repaired, system restored' },
    ],
  },
  {
    id: 'inc_sp_h1',
    systemId: 'sp',
    status: 'resolved',
    startedAt: '14:10',
    resolvedAt: '14:35',
    steps: [
      { type: 'detected', time: '14:10', timeAgo: 'Mar 12, 14:10', flowRate: '0.6 L/hour', detail: 'Low-flow anomaly on sump pump line' },
      { type: 'alert-sent', time: '14:10', timeAgo: 'Mar 12, 14:10', detail: '1 recipient · Push' },
      { type: 'resolved', time: '14:35', timeAgo: 'Mar 12, 14:35', volume: '18L', detail: 'Pipe joint repaired \u2014 system restored' },
    ],
  },
  {
    id: 'inc_msl_h1',
    systemId: 'msl',
    status: 'resolved',
    startedAt: '22:00',
    resolvedAt: '00:34',
    steps: [
      { type: 'detected', time: '22:00', timeAgo: 'Feb 28, 22:00', flowRate: '35.1 L/hour', detail: 'High-flow detected overnight \u2014 aging pipe suspected' },
      { type: 'alert-sent', time: '22:01', timeAgo: 'Feb 28, 22:01', detail: '1 recipient · Push' },
      { type: 'valve-closed', time: '23:15', timeAgo: 'Feb 28, 23:15', detail: 'Valve closed by on-call engineer via app' },
      { type: 'resolved', time: '00:34', timeAgo: 'Mar 1, 00:34', volume: '890L', detail: 'Pipe section replaced \u2014 system restored' },
    ],
  },
];

import { hasSimActivity } from './systems';

export function getActiveIncident(systemId) {
  // Pusher-owns-truth rule (Rami 2026-06-06): when the pusher has touched
  // this system, the static incident timeline is suppressed. The pusher's
  // sim alert drives the active alert, the pusher's events log drives
  // the Activity Timeline. Mixing static + sim creates a confusing dual
  // timeline. Hitting the pusher's "Clear all" button wipes sim state
  // and the static data comes back.
  if (hasSimActivity(systemId)) return null;
  return INCIDENTS.find(inc => inc.systemId === systemId && inc.status === 'active') || null;
}

export function getIncidentsForSystem(systemId) {
  if (hasSimActivity(systemId)) return [];
  return INCIDENTS.filter(inc => inc.systemId === systemId);
}

// Derive structured notification info from the alert-sent step text.
// Pattern: "<channels> sent to <recipients>" — e.g. "Push + Email sent to CBRE IL FM Team".
export function getNotification(incident) {
  if (!incident) return null;
  const sent = incident.steps?.find(s => s.type === 'alert-sent');
  if (!sent?.detail) return null;
  const m = sent.detail.match(/^(.+?)\s+sent to\s+(.+)$/i);
  if (!m) return null;
  const channelText = m[1].toLowerCase();
  const channels = [];
  if (/push/.test(channelText)) channels.push('push');
  if (/email/.test(channelText)) channels.push('email');
  if (/sms/.test(channelText)) channels.push('sms');
  const recipients = m[2].split(/,\s*/).map(s => s.trim()).filter(Boolean);
  return { channels, recipients };
}

// Map active incident to a Highlight/Detailed leak state.
// Active states per spec: Warning, Ongoing, ShutOff (Resolved goes to history).
export function getLeakState(incident) {
  if (!incident) return null;
  const types = new Set(incident.steps?.map(s => s.type) || []);
  if (types.has('valve-closed')) return 'ShutOff';
  if (types.has('continues') || types.has('volume-milestone')) return 'Ongoing';
  return 'Warning';
}
// build-tag: 1780345046

// Cache bust: 1780345083
export const BUILD_VERSION = '1780345083';
