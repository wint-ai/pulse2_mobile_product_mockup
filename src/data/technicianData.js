// Technician App — mock data for locations, CUs, and water systems
// Matches the PRD hierarchy: Customer > Campus > Building > Floor

// ── Location Hierarchy ─────────────────────────────────────────────────────────
// 4-tier hierarchy with customer-configurable type names.
// The technician is assigned to specific locations — they see only those as
// top-level entries.

export const TECH_LOCATIONS = [
  {
    id: 'hilton',
    name: 'Hilton Hotels',
    levelType: 'Customer',
    children: [
      {
        id: 'hilton-chicago',
        name: 'Chicago Downtown',
        levelType: 'Campus',
        children: [
          {
            id: 'hilton-chicago-main',
            name: 'Main Building',
            levelType: 'Building',
            children: [
              { id: 'hilton-chicago-main-f1', name: 'Floor 1', levelType: 'Floor', children: [] },
              { id: 'hilton-chicago-main-f2', name: 'Floor 2', levelType: 'Floor', children: [] },
              { id: 'hilton-chicago-main-f3', name: 'Floor 3', levelType: 'Floor', children: [] },
            ],
          },
          {
            id: 'hilton-chicago-annex',
            name: 'Annex Building',
            levelType: 'Building',
            children: [
              { id: 'hilton-chicago-annex-f1', name: 'Floor 1', levelType: 'Floor', children: [] },
              { id: 'hilton-chicago-annex-f2', name: 'Floor 2', levelType: 'Floor', children: [] },
            ],
          },
        ],
      },
      {
        id: 'hilton-miami',
        name: 'Miami Beach',
        levelType: 'Campus',
        children: [
          {
            id: 'hilton-miami-tower',
            name: 'Ocean Tower',
            levelType: 'Building',
            children: [
              { id: 'hilton-miami-tower-f1', name: 'Floor 1', levelType: 'Floor', children: [] },
              { id: 'hilton-miami-tower-f2', name: 'Floor 2', levelType: 'Floor', children: [] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'marriott',
    name: 'Marriott International',
    levelType: 'Customer',
    children: [
      {
        id: 'marriott-nyc',
        name: 'New York',
        levelType: 'Campus',
        children: [
          {
            id: 'marriott-nyc-times',
            name: 'Times Square Hotel',
            levelType: 'Building',
            children: [
              { id: 'marriott-nyc-times-f1', name: 'Floor 1', levelType: 'Floor', children: [] },
              { id: 'marriott-nyc-times-f2', name: 'Floor 2', levelType: 'Floor', children: [] },
            ],
          },
        ],
      },
    ],
  },
];

// ── Control Units ──────────────────────────────────────────────────────────────

export const CONTROL_UNITS = [
  // Hilton Chicago — Main Building
  { id: 'cu-001', name: 'CU-001', locationId: 'hilton-chicago-main-f1', status: 'online', paired: true, wifi: 'configured', firmware: 'v3.2.1' },
  { id: 'cu-002', name: 'CU-002', locationId: 'hilton-chicago-main-f1', status: 'online', paired: true, wifi: 'configured', firmware: 'v3.2.1' },
  { id: 'cu-003', name: 'CU-003', locationId: 'hilton-chicago-main-f2', status: 'offline', paired: true, wifi: 'configured', firmware: 'v3.1.0' },
  { id: 'cu-004', name: 'CU-004', locationId: 'hilton-chicago-main-f3', status: 'online', paired: false, wifi: 'not_configured', firmware: 'v3.2.1' },

  // Hilton Chicago — Annex
  { id: 'cu-005', name: 'CU-005', locationId: 'hilton-chicago-annex-f1', status: 'online', paired: true, wifi: 'configured', firmware: 'v3.2.1' },
  { id: 'cu-006', name: 'CU-006', locationId: 'hilton-chicago-annex-f2', status: 'online', paired: false, wifi: 'not_configured', firmware: 'v3.2.1' },

  // Hilton Miami
  { id: 'cu-007', name: 'CU-007', locationId: 'hilton-miami-tower-f1', status: 'online', paired: true, wifi: 'configured', firmware: 'v3.2.1' },
  { id: 'cu-008', name: 'CU-008', locationId: 'hilton-miami-tower-f2', status: 'online', paired: true, wifi: 'configured', firmware: 'v3.2.0' },

  // Marriott NYC
  { id: 'cu-009', name: 'CU-009', locationId: 'marriott-nyc-times-f1', status: 'online', paired: true, wifi: 'configured', firmware: 'v3.2.1' },
  { id: 'cu-010', name: 'CU-010', locationId: 'marriott-nyc-times-f2', status: 'offline', paired: false, wifi: 'not_configured', firmware: 'v3.0.0' },
];

// ── Water Systems ──────────────────────────────────────────────────────────────

// Operational data fields per system (for paired systems):
//   valve: 'open' | 'closed' | 'error' | 'middle' | null (no valve)
//   power: 'connected' | 'disconnected' | null (Wint3 = null, Flowless has power)
//   comm: 'online' | 'offline'
//   lastSeen: ISO timestamp or null
//   autoShutoff: 'Enabled' | 'Disabled'
//   waterEvent: { type, startedAgo, flowLiters } | null
//   alertRecipients: number (count of people receiving alerts)

export const WATER_SYSTEMS = [
  // Hilton Chicago — Main Building — Floor 1 (CU-001, CU-002)
  { id: 'ws-001', name: 'Kitchen K1', locationId: 'hilton-chicago-main-f1', deviceType: 'wint3', cuId: 'cu-001', vmaSerial: 'VMA-2401-001', paired: true, tsoStatus: 'pass', lastTso: '2026-07-15T14:32:00',
    valve: 'open', power: null, comm: 'online', lastSeen: '2026-08-09T10:12:00', autoShutoff: 'Enabled', waterEvent: null, alertRecipients: 3 },
  { id: 'ws-002', name: 'Bathroom B1', locationId: 'hilton-chicago-main-f1', deviceType: 'wint3', cuId: 'cu-001', vmaSerial: 'VMA-2401-002', paired: true, tsoStatus: 'partial', lastTso: '2026-07-10T09:15:00',
    valve: 'open', power: null, comm: 'online', lastSeen: '2026-08-09T10:11:00', autoShutoff: 'Enabled', waterEvent: null, alertRecipients: 3 },
  { id: 'ws-003', name: 'Laundry L1', locationId: 'hilton-chicago-main-f1', deviceType: 'wint3', cuId: 'cu-002', vmaSerial: 'VMA-2401-003', paired: true, tsoStatus: 'fail', lastTso: '2026-07-12T11:45:00',
    valve: 'error', power: null, comm: 'online', lastSeen: '2026-08-09T10:10:00', autoShutoff: 'Disabled', waterEvent: { type: 'Leak Detected', startedAgo: '12 min', flowLiters: 8.4 }, alertRecipients: 2 },
  { id: 'ws-004', name: 'Main Supply F1', locationId: 'hilton-chicago-main-f1', deviceType: 'wint3', cuId: 'cu-002', vmaSerial: null, paired: false, tsoStatus: 'not_tested', lastTso: null,
    valve: null, power: null, comm: null, lastSeen: null, autoShutoff: null, waterEvent: null, alertRecipients: 0 },

  // Floor 2 (CU-003 — offline)
  { id: 'ws-005', name: 'Kitchen K2', locationId: 'hilton-chicago-main-f2', deviceType: 'wint3', cuId: 'cu-003', vmaSerial: 'VMA-2401-005', paired: true, tsoStatus: 'not_tested', lastTso: null,
    valve: 'closed', power: null, comm: 'offline', lastSeen: '2026-08-07T22:15:00', autoShutoff: 'Enabled', waterEvent: null, alertRecipients: 1 },
  { id: 'ws-006', name: 'Bathroom B2', locationId: 'hilton-chicago-main-f2', deviceType: 'wint3', cuId: 'cu-003', vmaSerial: 'VMA-2401-006', paired: true, tsoStatus: 'pass', lastTso: '2026-06-20T16:00:00',
    valve: 'open', power: null, comm: 'offline', lastSeen: '2026-08-07T22:15:00', autoShutoff: 'Enabled', waterEvent: null, alertRecipients: 1 },

  // Floor 3 (CU-004 — unpaired)
  { id: 'ws-007', name: 'Kitchen K3', locationId: 'hilton-chicago-main-f3', deviceType: 'wint3', cuId: 'cu-004', vmaSerial: null, paired: false, tsoStatus: 'not_tested', lastTso: null,
    valve: null, power: null, comm: null, lastSeen: null, autoShutoff: null, waterEvent: null, alertRecipients: 0 },
  { id: 'ws-008', name: 'Bathroom B3', locationId: 'hilton-chicago-main-f3', deviceType: 'wint3', cuId: 'cu-004', vmaSerial: null, paired: false, tsoStatus: 'not_tested', lastTso: null,
    valve: null, power: null, comm: null, lastSeen: null, autoShutoff: null, waterEvent: null, alertRecipients: 0 },

  // Annex — Floor 1 (CU-005)
  { id: 'ws-009', name: 'Pool Pump', locationId: 'hilton-chicago-annex-f1', deviceType: 'wint3', cuId: 'cu-005', vmaSerial: 'VMA-2401-009', paired: true, tsoStatus: 'pass', lastTso: '2026-07-20T10:00:00',
    valve: 'open', power: null, comm: 'online', lastSeen: '2026-08-09T10:05:00', autoShutoff: 'Enabled', waterEvent: null, alertRecipients: 2 },
  { id: 'ws-010', name: 'Spa Supply', locationId: 'hilton-chicago-annex-f1', deviceType: 'flowless', cuId: null, flowlessSerial: 'FL-2401-010', paired: true, tsoStatus: 'partial', lastTso: '2026-07-18T13:20:00',
    valve: 'closed', power: 'connected', comm: 'online', lastSeen: '2026-08-09T10:08:00', autoShutoff: 'Disabled', waterEvent: null, alertRecipients: 0 },

  // Annex — Floor 2 (CU-006 — unpaired)
  { id: 'ws-011', name: 'Conference Room', locationId: 'hilton-chicago-annex-f2', deviceType: 'wint3', cuId: 'cu-006', vmaSerial: null, paired: false, tsoStatus: 'not_tested', lastTso: null,
    valve: null, power: null, comm: null, lastSeen: null, autoShutoff: null, waterEvent: null, alertRecipients: 0 },

  // Hilton Miami — Floor 1 (CU-007)
  { id: 'ws-012', name: 'Lobby Fountain', locationId: 'hilton-miami-tower-f1', deviceType: 'wint3', cuId: 'cu-007', vmaSerial: 'VMA-2401-012', paired: true, tsoStatus: 'pass', lastTso: '2026-07-25T09:00:00',
    valve: 'open', power: null, comm: 'online', lastSeen: '2026-08-09T09:55:00', autoShutoff: 'Enabled', waterEvent: null, alertRecipients: 4 },
  { id: 'ws-013', name: 'Restaurant Main', locationId: 'hilton-miami-tower-f1', deviceType: 'flowless', cuId: null, flowlessSerial: 'FL-2401-013', paired: false, tsoStatus: 'not_tested', lastTso: null,
    valve: null, power: null, comm: null, lastSeen: null, autoShutoff: null, waterEvent: null, alertRecipients: 0 },

  // Hilton Miami — Floor 2 (CU-008)
  { id: 'ws-014', name: 'Rooftop Bar', locationId: 'hilton-miami-tower-f2', deviceType: 'wint3', cuId: 'cu-008', vmaSerial: 'VMA-2401-014', paired: true, tsoStatus: 'not_tested', lastTso: null,
    valve: 'middle', power: null, comm: 'online', lastSeen: '2026-08-09T10:01:00', autoShutoff: 'Enabled', waterEvent: null, alertRecipients: 2 },

  // Marriott NYC — Floor 1 (CU-009)
  { id: 'ws-015', name: 'Ballroom Supply', locationId: 'marriott-nyc-times-f1', deviceType: 'wint3', cuId: 'cu-009', vmaSerial: 'VMA-2401-015', paired: true, tsoStatus: 'pass', lastTso: '2026-08-01T14:00:00',
    valve: 'closed', power: null, comm: 'online', lastSeen: '2026-08-09T10:00:00', autoShutoff: 'Enabled', waterEvent: null, alertRecipients: 3 },
  { id: 'ws-016', name: 'Kitchen Main', locationId: 'marriott-nyc-times-f1', deviceType: 'flowless', cuId: null, flowlessSerial: 'FL-2401-016', paired: true, tsoStatus: 'fail', lastTso: '2026-07-28T11:30:00',
    valve: 'open', power: 'disconnected', comm: 'online', lastSeen: '2026-08-09T09:50:00', autoShutoff: 'Disabled', waterEvent: { type: 'Unusual Flow', startedAgo: '45 min', flowLiters: 142.5 }, alertRecipients: 1 },

  // Marriott NYC — Floor 2 (CU-010 — unpaired)
  { id: 'ws-017', name: 'Gym Supply', locationId: 'marriott-nyc-times-f2', deviceType: 'wint3', cuId: 'cu-010', vmaSerial: null, paired: false, tsoStatus: 'not_tested', lastTso: null,
    valve: null, power: null, comm: null, lastSeen: null, autoShutoff: null, waterEvent: null, alertRecipients: 0 },
  { id: 'ws-018', name: 'Pool Filtration', locationId: 'marriott-nyc-times-f2', deviceType: 'wint3', cuId: 'cu-010', vmaSerial: null, paired: false, tsoStatus: 'not_tested', lastTso: null,
    valve: null, power: null, comm: null, lastSeen: null, autoShutoff: null, waterEvent: null, alertRecipients: 0 },
];

// ── Photo Retake Requests ──────────────────────────────────────────────────────
// Each entry specifies which mandatory photo categories the admin flagged.

export const PHOTO_RETAKES = [
  { wsId: 'ws-002', categories: ['serial_number', 'system_installation'] },
  { wsId: 'ws-010', categories: ['area_view'] },
];

// ── History (completed actions) ────────────────────────────────────────────────

export const TECH_HISTORY = [
  { id: 'h-01', type: 'tso', entityId: 'ws-001', entityName: 'Kitchen K1', result: 'pass', locationBreadcrumb: 'Hilton Hotels > Chicago Downtown > Main Building > Floor 1', timestamp: '2026-08-09T08:30:00' },
  { id: 'h-02', type: 'ws_paired', entityId: 'ws-009', entityName: 'Pool Pump', result: null, locationBreadcrumb: 'Hilton Hotels > Chicago Downtown > Annex Building > Floor 1', timestamp: '2026-08-09T07:15:00' },
  { id: 'h-03', type: 'tso', entityId: 'ws-006', entityName: 'Bathroom B2', result: 'pass', locationBreadcrumb: 'Hilton Hotels > Chicago Downtown > Main Building > Floor 2', timestamp: '2026-08-08T16:00:00' },
  { id: 'h-04', type: 'cu_paired', entityId: 'cu-005', entityName: 'CU-005', result: null, locationBreadcrumb: 'Hilton Hotels > Chicago Downtown > Annex Building > Floor 1', timestamp: '2026-08-08T14:30:00' },
  { id: 'h-05', type: 'tso', entityId: 'ws-012', entityName: 'Lobby Fountain', result: 'pass', locationBreadcrumb: 'Hilton Hotels > Miami Beach > Ocean Tower > Floor 1', timestamp: '2026-08-07T10:00:00' },
  { id: 'h-06', type: 'cu_wifi', entityId: 'cu-007', entityName: 'CU-007', result: null, locationBreadcrumb: 'Hilton Hotels > Miami Beach > Ocean Tower > Floor 1', timestamp: '2026-08-07T09:30:00' },
  { id: 'h-07', type: 'tso', entityId: 'ws-015', entityName: 'Ballroom Supply', result: 'pass', locationBreadcrumb: 'Marriott International > New York > Times Square Hotel > Floor 1', timestamp: '2026-08-06T14:00:00' },
  { id: 'h-08', type: 'ws_paired', entityId: 'ws-015', entityName: 'Ballroom Supply', result: null, locationBreadcrumb: 'Marriott International > New York > Times Square Hotel > Floor 1', timestamp: '2026-08-06T13:45:00' },
  { id: 'h-09', type: 'tso', entityId: 'ws-016', entityName: 'Kitchen Main', result: 'fail', locationBreadcrumb: 'Marriott International > New York > Times Square Hotel > Floor 1', timestamp: '2026-08-04T11:30:00' },
  { id: 'h-10', type: 'cu_paired', entityId: 'cu-009', entityName: 'CU-009', result: null, locationBreadcrumb: 'Marriott International > New York > Times Square Hotel > Floor 1', timestamp: '2026-08-01T09:00:00' },
  { id: 'h-11', type: 'tso', entityId: 'ws-010', entityName: 'Spa Supply', result: 'partial', locationBreadcrumb: 'Hilton Hotels > Chicago Downtown > Annex Building > Floor 1', timestamp: '2026-07-28T13:20:00' },
  { id: 'h-12', type: 'tso', entityId: 'ws-003', entityName: 'Laundry L1', result: 'fail', locationBreadcrumb: 'Hilton Hotels > Chicago Downtown > Main Building > Floor 1', timestamp: '2026-07-25T11:45:00' },
];

// ── Helper functions ───────────────────────────────────────────────────────────

// Find a location by ID (recursive)
export function findLocation(id, nodes = TECH_LOCATIONS) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findLocation(id, node.children);
      if (found) return found;
    }
  }
  return null;
}

// Get all location IDs in a subtree (inclusive)
export function getDescendantIds(locationId) {
  const ids = [];
  const walk = (nodes) => {
    for (const n of nodes) {
      ids.push(n.id);
      if (n.children) walk(n.children);
    }
  };
  const root = findLocation(locationId);
  if (root) {
    ids.push(root.id);
    if (root.children) walk(root.children);
  }
  return ids;
}

// Get CUs at a specific location (not descendants)
export function getCUsAtLocation(locationId) {
  return CONTROL_UNITS.filter(cu => cu.locationId === locationId);
}

// Get water systems at a specific location (not descendants)
export function getWSAtLocation(locationId) {
  return WATER_SYSTEMS.filter(ws => ws.locationId === locationId);
}

// Get all CUs in a location subtree (including descendants)
export function getCUsInSubtree(locationId) {
  const ids = getDescendantIds(locationId);
  return CONTROL_UNITS.filter(cu => ids.includes(cu.locationId));
}

// Get all water systems in a location subtree (including descendants)
export function getWSInSubtree(locationId) {
  const ids = getDescendantIds(locationId);
  return WATER_SYSTEMS.filter(ws => ids.includes(ws.locationId));
}

// Get CU by ID
export function getCUById(id) {
  return CONTROL_UNITS.find(cu => cu.id === id);
}

// Get WS by ID
export function getWSById(id) {
  return WATER_SYSTEMS.find(ws => ws.id === id);
}

// Compute attention stats for a location subtree
export function getAttentionStats(locationId) {
  const cus = getCUsInSubtree(locationId);
  const wss = getWSInSubtree(locationId);
  const unpairedCUs = cus.filter(cu => !cu.paired).length;
  const unpairedWS = wss.filter(ws => !ws.paired).length;
  const incompleteTSO = wss.filter(ws => ws.paired && ws.tsoStatus !== 'pass').length;
  const photoRetakes = PHOTO_RETAKES.filter(pr => {
    const ws = getWSById(pr.wsId);
    if (!ws) return false;
    const ids = getDescendantIds(locationId);
    return ids.includes(ws.locationId);
  }).length;
  return { unpairedCUs, unpairedWS, unpaired: unpairedCUs + unpairedWS, incompleteTSO, photoRetakes, total: unpairedCUs + unpairedWS + incompleteTSO + photoRetakes };
}

// Build breadcrumb for a location
export function getLocationBreadcrumb(locationId, nodes = TECH_LOCATIONS, path = []) {
  for (const node of nodes) {
    if (node.id === locationId) return [...path, node.name].join(' > ');
    if (node.children) {
      const result = getLocationBreadcrumb(locationId, node.children, [...path, node.name]);
      if (result) return result;
    }
  }
  return null;
}

// Get the parent CU for a water system
export function getParentCU(ws) {
  if (!ws.cuId) return null;
  return getCUById(ws.cuId);
}
