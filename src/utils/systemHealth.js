// Single source of truth for "is this system healthy" — used by:
//   • ProtectionStatusCard on the system page
//   • NavigationDrawer SystemRow (status dot + sub-label)
//   • NavigationDrawer LocRow alert-count rollup
//
// Both surfaces MUST agree, or the drawer dot will green-light a system the
// System Health card flags as having an issue (the bug fixed in this commit).
//
// Four dimensions (matches Confluence "Widget 1: Location Health" spec):
//   1. Communication — lastSeen within device-family threshold
//   2. Valve         — no error / disconnected (only if the system has a valve)
//   3. External power — not ac-lost (only if the system has power state)
//   4. Alert recipients — at least one notification recipient configured

import { getSystemTopology } from '../data/systemDetails';
import { isIgnored } from '../data/ignoredIncidents';

// Default thresholds per device family. Flowless devices report every few
// hours; WINT 3 / VMA report every minute.  Past the threshold the system
// is considered "not communicating" — surfaced as Offline.
const COMM_THRESHOLD_FLOWLESS_MS = 24 * 60 * 60 * 1000;     // 24 h
const COMM_THRESHOLD_DEFAULT_MS  = 60 * 60 * 1000;           // 60 min

/**
 * @param {object} sys — system object from systems.js
 * @returns {{
 *   isComm: boolean,
 *   valveOk: boolean,
 *   powerOk: boolean,
 *   hasRecipients: boolean,
 *   allOk: boolean,
 *   issueCount: number,
 *   isLeak: boolean,            // active Water Event (high or low flow)
 * }}
 */
export function computeSystemHealth(sys) {
  const topology = getSystemTopology(sys?.id);
  const isFlowless = topology?.deviceType === 'Flowless';
  const commThresholdMs = isFlowless ? COMM_THRESHOLD_FLOWLESS_MS : COMM_THRESHOLD_DEFAULT_MS;

  // Comm — prefer lastSeen, fall back to the legacy boolean flags.
  const isComm = sys?.lastSeen
    ? (Date.now() - new Date(sys.lastSeen).getTime()) < commThresholdMs
    : sys?.comm === 'online' && !sys?.offline;

  // Valve — `error` and `disconnected` both count as "not OK". `null` means
  // no valve installed, which is NOT an issue (the card hides the row).
  const valveOk = sys?.valve == null || (sys.valve !== 'error' && sys.valve !== 'disconnected');

  // External power — only matters when the system tracks power state.
  const powerOk = sys?.power == null || sys.power !== 'ac-lost';

  // At least one notification recipient at the system's parent location.
  const hasRecipients = (sys?.notificationRecipients || 0) > 0;

  // Issue count — counts only dimensions that apply to this system.
  const issueCount =
    (isComm ? 0 : 1) +
    (sys?.valve != null && !valveOk ? 1 : 0) +
    (sys?.power != null && !powerOk ? 1 : 0) +
    (hasRecipients ? 0 : 1);

  const allOk = issueCount === 0;
  // Active Water Event — ignored events don't count anywhere (home, alerts,
  // drawer, system page status). They're history.
  const isLeak = !!(
    (sys?.alert?.type === 'leak-high' || sys?.alert?.type === 'leak-low') &&
    !isIgnored(sys?.id)
  );

  return { isComm, valveOk, powerOk, hasRecipients, allOk, issueCount, isLeak };
}
