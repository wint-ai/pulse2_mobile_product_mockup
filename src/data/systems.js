// Systems from the Pulse 2.0 spreadsheet
// Hierarchy: Account > L1 (Country) > L2 (Region) > L3 (City) > L4 (Building) > System

// Generate Tidhar apartment systems (200 units)
function generateTidharApartments() {
  const apts = [];
  for (let i = 1; i <= 200; i++) {
    const isApt12 = i === 12;
    const isApt89 = i === 89;
    apts.push({
      id: `tidhar_apt_${i}`, account: 'tidhar',
      name: `Apt ${i}`,
      l1: 'il', l2: 'central', l3: 'petah_tikva', l4: 'tidhar_towers',
      l1Name: 'Israel', l2Name: 'Central District', l3Name: 'Petah Tikva', l4Name: 'Tidhar Towers',
      valve: 'open',
      comm: 'online',
      power: (isApt12 || isApt89) ? 'battery' : 'ac',
      leak: null,
      offline: false,
      battery: isApt12 ? 'critical' : isApt89 ? 'low' : null,
      homeAway: true, // tenant system — supports Home/Away mode
      // Battery alerts (apt12, apt89) deferred from v1 per PRD-11 \u2014 keep the
      // `battery` field for stats / future use, but emit no alert.
      // Sarah Cohen's apartment (Apt 47) is intentionally CLEAN per the
      // 2026-06-04 persona spec \u2014 she's the happy-path tenant demo. The
      // tenant-with-an-active-event story lives on Maya's apartments now.
      alert: null,
    });
  }
  return apts;
}

export const SYSTEMS = [

  // ─── Suffolk Construction ───────────────────────────────────────────────────

  // Tower One · Manchester
  {
    id: 'ct1', account: 'sc',
    name: 'Cooling Tower #1',
    l1: 'uk', l2: 'nwe', l3: 'manchester', l4: 'towerone',
    l1Name: 'United Kingdom', l2Name: 'NW England', l3Name: 'Manchester', l4Name: 'Tower One',
    valve: 'open', comm: 'online', power: 'ac', leak: 'high', offline: false,
    alert: { type: 'leak-high', label: 'High Flow Water Event', age: '3h 11m', startedAt: '06:11', volume: '1,150L', flowRate: '38.2 L/hour' },
  },
  {
    id: 'ct2', account: 'sc',
    name: 'Cooling Tower #2',
    l1: 'uk', l2: 'nwe', l3: 'manchester', l4: 'towerone',
    l1Name: 'United Kingdom', l2Name: 'NW England', l3Name: 'Manchester', l4Name: 'Tower One',
    valve: 'error', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: { type: 'valve-error', label: 'Valve error', age: '47m', startedAt: '08:35', volume: null },
  },
  {
    id: 'msl', account: 'sc',
    name: 'Main Supply Line',
    l1: 'uk', l2: 'nwe', l3: 'manchester', l4: 'towerone',
    l1Name: 'United Kingdom', l2Name: 'NW England', l3Name: 'Manchester', l4Name: 'Tower One',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'dcw', account: 'sc',
    name: 'DCW Floors 1\u201318',
    l1: 'uk', l2: 'nwe', l3: 'manchester', l4: 'towerone',
    l1Name: 'United Kingdom', l2Name: 'NW England', l3Name: 'Manchester', l4Name: 'Tower One',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'dhw1', account: 'sc',
    name: 'DHW Floors 1\u201318',
    l1: 'uk', l2: 'nwe', l3: 'manchester', l4: 'towerone',
    l1Name: 'United Kingdom', l2Name: 'NW England', l3Name: 'Manchester', l4Name: 'Tower One',
    valve: null, comm: 'online', power: 'battery', leak: null, offline: false,
    alert: null,
  },

  // Parking Level B1 · Manchester
  {
    id: 'sp', account: 'sc',
    name: 'Sump Pump B1',
    l1: 'uk', l2: 'nwe', l3: 'manchester', l4: 'parking',
    l1Name: 'United Kingdom', l2Name: 'NW England', l3Name: 'Manchester', l4Name: 'Parking Level B1',
    valve: 'open', comm: 'online', power: 'ac', leak: 'low', offline: false,
    alert: { type: 'leak-low', label: 'Low Flow Water Event', age: '1h 4m', startedAt: '08:18', volume: '42L', flowRate: '0.6 L/hour' },
  },

  // HQ Building · Liverpool
  {
    id: 'mshq', account: 'sc',
    name: 'Main Supply HQ',
    l1: 'uk', l2: 'nwe', l3: 'liverpool', l4: 'hqbuilding',
    l1Name: 'United Kingdom', l2Name: 'NW England', l3Name: 'Liverpool', l4Name: 'HQ Building',
    valve: 'open', comm: 'online', power: 'ac-lost', leak: null, offline: false,
    alert: { type: 'power-lost', label: 'AC power lost', age: '22m', startedAt: '09:00', volume: null },
  },
  {
    id: 'dhwhq', account: 'sc',
    name: 'DHW Ground Floor',
    l1: 'uk', l2: 'nwe', l3: 'liverpool', l4: 'hqbuilding',
    l1Name: 'United Kingdom', l2Name: 'NW England', l3Name: 'Liverpool', l4Name: 'HQ Building',
    valve: null, comm: 'offline', power: null, leak: null, offline: true,
    alert: { type: 'offline', label: 'Device offline', age: '5h 33m', startedAt: '03:49', volume: null },
  },

  // Canary Wharf · London
  {
    id: 'mscw', account: 'sc',
    name: 'Main Supply CW',
    l1: 'uk', l2: 'see', l3: 'london', l4: 'canarywharf',
    l1Name: 'United Kingdom', l2Name: 'SE England', l3Name: 'London', l4Name: 'Canary Wharf',
    valve: 'closed', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'ctcw', account: 'sc',
    name: 'Cooling Tower CW',
    l1: 'uk', l2: 'see', l3: 'london', l4: 'canarywharf',
    l1Name: 'United Kingdom', l2Name: 'SE England', l3Name: 'London', l4Name: 'Canary Wharf',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },

  // Munich Office · Munich
  {
    id: 'msm', account: 'sc',
    name: 'Main Supply Munich',
    l1: 'de', l2: 'bavaria', l3: 'munich', l4: 'munichoffice',
    l1Name: 'Germany', l2Name: 'Bavaria', l3Name: 'Munich', l4Name: 'Munich Office',
    valve: null, comm: 'offline', power: null, leak: null, offline: true,
    alert: { type: 'offline', label: 'Device offline', age: '2h 18m', startedAt: '07:04', volume: null },
  },
  {
    id: 'br1', account: 'sc',
    name: 'Boiler Room #1',
    l1: 'de', l2: 'bavaria', l3: 'munich', l4: 'munichoffice',
    l1Name: 'Germany', l2Name: 'Bavaria', l3Name: 'Munich', l4Name: 'Munich Office',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },

  // ─── Heathrow Airport Authority ─────────────────────────────────────────────

  // Terminal 2 · Heathrow Airport
  {
    id: 'mst2', account: 'ha',
    name: 'Main Supply T2',
    l1: 'uk', l2: 'hwl', l3: 'heathrow', l4: 'terminal2',
    l1Name: 'United Kingdom', l2Name: 'Heathrow & West London', l3Name: 'Heathrow Airport', l4Name: 'Terminal 2',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'ctt2', account: 'ha',
    name: 'Cooling Tower T2',
    l1: 'uk', l2: 'hwl', l3: 'heathrow', l4: 'terminal2',
    l1Name: 'United Kingdom', l2Name: 'Heathrow & West London', l3Name: 'Heathrow Airport', l4Name: 'Terminal 2',
    valve: 'open', comm: 'online', power: 'ac', leak: 'high', offline: false,
    alert: { type: 'leak-high', label: 'High Flow Water Event', age: '3h 22m', startedAt: '06:00', volume: '890L', flowRate: '41.5 L/hour' },
  },
  {
    id: 'dhwt2', account: 'ha',
    name: 'DHW Staff Areas T2',
    l1: 'uk', l2: 'hwl', l3: 'heathrow', l4: 'terminal2',
    l1Name: 'United Kingdom', l2Name: 'Heathrow & West London', l3Name: 'Heathrow Airport', l4Name: 'Terminal 2',
    valve: null, comm: 'offline', power: null, leak: null, offline: true,
    alert: { type: 'offline', label: 'Device offline', age: '1h 12m', startedAt: '08:10', volume: null },
  },

  // Terminal 5 · Heathrow Airport
  {
    id: 'mst5', account: 'ha',
    name: 'Main Supply T5',
    l1: 'uk', l2: 'hwl', l3: 'heathrow', l4: 'terminal5',
    l1Name: 'United Kingdom', l2Name: 'Heathrow & West London', l3Name: 'Heathrow Airport', l4Name: 'Terminal 5',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'ctt5', account: 'ha',
    name: 'Cooling Tower T5',
    l1: 'uk', l2: 'hwl', l3: 'heathrow', l4: 'terminal5',
    l1Name: 'United Kingdom', l2Name: 'Heathrow & West London', l3Name: 'Heathrow Airport', l4Name: 'Terminal 5',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'bht5', account: 'ha',
    name: 'Baggage Hall Supply',
    l1: 'uk', l2: 'hwl', l3: 'heathrow', l4: 'terminal5',
    l1Name: 'United Kingdom', l2Name: 'Heathrow & West London', l3Name: 'Heathrow Airport', l4Name: 'Terminal 5',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },

  // ─── Soci\u00e9t\u00e9 G\u00e9n\u00e9rale ──────────────────────────────────────────────────────

  // SG Tower A · La D\u00e9fense
  {
    id: 'msta', account: 'sg',
    name: 'Main Supply Tower A',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowera',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower A',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'cpta', account: 'sg',
    name: 'Chiller Plant Tower A',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowera',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower A',
    valve: 'open', comm: 'online', power: 'ac-lost', leak: null, offline: false,
    alert: { type: 'power-lost', label: 'AC power lost', age: '18m', startedAt: '09:04', volume: null },
  },
  {
    id: 'f1a', account: 'sg',
    name: 'Floor 1 \u2014 DCW/DHW',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowera',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower A',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'f2a', account: 'sg',
    name: 'Floor 2 \u2014 DCW/DHW',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowera',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower A',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'f3a', account: 'sg',
    name: 'Floor 3 \u2014 DCW/DHW',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowera',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower A',
    valve: 'closed', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'f4a', account: 'sg',
    name: 'Floor 4 \u2014 DCW/DHW',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowera',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower A',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'f5a', account: 'sg',
    name: 'Floor 5 \u2014 DCW/DHW',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowera',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower A',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'f6a', account: 'sg',
    name: 'Floor 6 \u2014 DCW/DHW',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowera',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower A',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'f7a', account: 'sg',
    name: 'Floor 7 \u2014 DCW/DHW',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowera',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower A',
    valve: null, comm: 'online', power: 'battery', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'f8a', account: 'sg',
    name: 'Floor 8 \u2014 DCW/DHW',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowera',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower A',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'f9a', account: 'sg',
    name: 'Floor 9 \u2014 DCW/DHW',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowera',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower A',
    valve: null, comm: 'offline', power: null, leak: null, offline: true,
    alert: { type: 'offline', label: 'Device offline', age: '3h 47m', startedAt: '05:35', volume: null },
  },
  {
    id: 'f10a', account: 'sg',
    name: 'Floor 10 \u2014 DCW/DHW',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowera',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower A',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'f11a', account: 'sg',
    name: 'Floor 11 \u2014 DCW/DHW',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowera',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower A',
    valve: 'open', comm: 'online', power: 'ac', leak: 'low', offline: false,
    alert: { type: 'leak-low', label: 'Low Flow Water Event', age: '55m', startedAt: '08:27', volume: '28L', flowRate: '0.9 L/hour' },
  },
  // Floors 12–28 (generated)
  ...Array.from({ length: 17 }, (_, i) => ({
    id: `f${i + 12}a`, account: 'sg',
    name: `Floor ${i + 12} \u2014 DCW/DHW`,
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowera',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower A',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  })),

  // SG Tower B · La D\u00e9fense
  {
    id: 'mstb', account: 'sg',
    name: 'Main Supply Tower B',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowerb',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower B',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'ctb', account: 'sg',
    name: 'Cooling Tower B',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowerb',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower B',
    valve: 'error', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: { type: 'valve-error', label: 'Valve error', age: '35m', startedAt: '08:47', volume: null },
  },
  {
    id: 'dhwb', account: 'sg',
    name: 'DHW Floors 1\u20138',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowerb',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower B',
    valve: null, comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'spb', account: 'sg',
    name: 'Sump Pump B1',
    l1: 'fr', l2: 'idf', l3: 'ladefense', l4: 'sgtowerb',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'La D\u00e9fense', l4Name: 'SG Tower B',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },

  // ─── Kl\u00e9pierre Retail ──────────────────────────────────────────────────────

  // Forum des Halles · Paris
  {
    id: 'msf', account: 'kr',
    name: 'Main Supply Forum',
    l1: 'fr', l2: 'idf', l3: 'paris', l4: 'forumdeshalles',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'Paris', l4Name: 'Forum des Halles',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'csf', account: 'kr',
    name: 'Cooling System Forum',
    l1: 'fr', l2: 'idf', l3: 'paris', l4: 'forumdeshalles',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'Paris', l4Name: 'Forum des Halles',
    valve: 'open', comm: 'online', power: 'ac', leak: 'low', offline: false,
    alert: { type: 'leak-low', label: 'Low Flow Water Event', age: '2h 5m', startedAt: '07:17', volume: '95L', flowRate: '0.7 L/hour' },
  },
  {
    id: 'fsf', account: 'kr',
    name: 'Fire Suppression Main',
    l1: 'fr', l2: 'idf', l3: 'paris', l4: 'forumdeshalles',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'Paris', l4Name: 'Forum des Halles',
    valve: 'closed', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },

  // V\u00e9lizy 2 · Yvelines
  {
    id: 'msv', account: 'kr',
    name: 'Main Supply V\u00e9lizy',
    l1: 'fr', l2: 'idf', l3: 'yvelines', l4: 'velizy2',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'Yvelines', l4Name: 'V\u00e9lizy 2',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'csv', account: 'kr',
    name: 'Cooling System V\u00e9lizy',
    l1: 'fr', l2: 'idf', l3: 'yvelines', l4: 'velizy2',
    l1Name: 'France', l2Name: '\u00cele-de-France', l3Name: 'Yvelines', l4Name: 'V\u00e9lizy 2',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },

  // ─── Azure Tech Campuses ────────────────────────────────────────────────────

  // Azure Amsterdam · Amsterdam
  {
    id: 'msa', account: 'az',
    name: 'Main Supply Amsterdam',
    l1: 'nl', l2: 'nh', l3: 'amsterdam', l4: 'azureamsterdam',
    l1Name: 'Netherlands', l2Name: 'North Holland', l3Name: 'Amsterdam', l4Name: 'Azure Amsterdam',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'shc', account: 'az',
    name: 'Server Hall Cooling',
    l1: 'nl', l2: 'nh', l3: 'amsterdam', l4: 'azureamsterdam',
    l1Name: 'Netherlands', l2Name: 'North Holland', l3Name: 'Amsterdam', l4Name: 'Azure Amsterdam',
    valve: 'open', comm: 'online', power: 'ac', leak: 'high', offline: false,
    alert: { type: 'leak-high', label: 'High Flow Water Event', age: '1h 47m', startedAt: '07:35', volume: '2,340L', flowRate: '44.1 L/hour' },
  },
  {
    id: 'dhwa', account: 'az',
    name: 'DHW Staff Block',
    l1: 'nl', l2: 'nh', l3: 'amsterdam', l4: 'azureamsterdam',
    l1Name: 'Netherlands', l2Name: 'North Holland', l3Name: 'Amsterdam', l4Name: 'Azure Amsterdam',
    valve: null, comm: 'online', power: 'battery', leak: null, offline: false,
    alert: null,
  },

  // Azure Dublin · Dublin
  {
    id: 'msd', account: 'az',
    name: 'Main Supply Dublin',
    l1: 'ie', l2: 'leinster', l3: 'dublin', l4: 'azuredublin',
    l1Name: 'Ireland', l2Name: 'Leinster', l3Name: 'Dublin', l4Name: 'Azure Dublin',
    valve: null, comm: 'offline', power: null, leak: null, offline: true,
    alert: { type: 'offline', label: 'Device offline', age: '44m', startedAt: '08:38', volume: null },
  },
  {
    id: 'shd', account: 'az',
    name: 'Server Hall Cooling Dublin',
    l1: 'ie', l2: 'leinster', l3: 'dublin', l4: 'azuredublin',
    l1Name: 'Ireland', l2Name: 'Leinster', l3Name: 'Dublin', l4Name: 'Azure Dublin',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'ctd', account: 'az',
    name: 'Cooling Tower Dublin',
    l1: 'ie', l2: 'leinster', l3: 'dublin', l4: 'azuredublin',
    l1Name: 'Ireland', l2Name: 'Leinster', l3Name: 'Dublin', l4Name: 'Azure Dublin',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },

  // ─── CBRE Israel ────────────────────────────────────────────────────────────

  // Herzliya Campus A — LEAK DEMO SCENARIOS
  // Scenario 1: High Flow — valve closed successfully
  {
    id: 'cbre_il_hz_ms', account: 'cbre_il',
    name: 'Main Supply',
    l1: 'il', l2: 'central', l3: 'herzliya', l4: 'herzliya_campus_a',
    l1Name: 'Israel', l2Name: 'Central', l3Name: 'Herzliya', l4Name: 'Herzliya Campus A',
    valve: 'closed', comm: 'online', power: 'ac', leak: 'high', offline: false,
    alert: { type: 'leak-high', label: 'High Flow Water Event', age: '1h 45m', startedAt: '07:30', volume: '580L', flowRate: '120 L/hour' },
  },
  // Scenario 2: High Flow — valve error (tried to close, failed)
  {
    id: 'cbre_il_hz_ct', account: 'cbre_il',
    name: 'Cooling Tower',
    l1: 'il', l2: 'central', l3: 'herzliya', l4: 'herzliya_campus_a',
    l1Name: 'Israel', l2Name: 'Central', l3Name: 'Herzliya', l4Name: 'Herzliya Campus A',
    valve: 'error', comm: 'online', power: 'ac', leak: 'high', offline: false,
    alert: { type: 'leak-high', label: 'High Flow Water Event', age: '2h 20m', startedAt: '06:55', volume: '1,240L', flowRate: '85 L/hour' },
  },
  // Scenario 3: High Flow — no valve (detection only)
  {
    id: 'cbre_il_hz_dhw', account: 'cbre_il',
    name: 'DHW Building A',
    l1: 'il', l2: 'central', l3: 'herzliya', l4: 'herzliya_campus_a',
    l1Name: 'Israel', l2Name: 'Central', l3Name: 'Herzliya', l4Name: 'Herzliya Campus A',
    valve: null, comm: 'online', power: 'ac', leak: 'high', offline: false,
    alert: { type: 'leak-high', label: 'High Flow Water Event', age: '3h 10m', startedAt: '06:05', volume: '2,100L', flowRate: '95 L/hour' },
  },
  // Scenario 4: Low Flow
  {
    id: 'cbre_il_hz_fr', account: 'cbre_il',
    name: 'Fire Riser',
    l1: 'il', l2: 'central', l3: 'herzliya', l4: 'herzliya_campus_a',
    l1Name: 'Israel', l2Name: 'Central', l3Name: 'Herzliya', l4Name: 'Herzliya Campus A',
    valve: 'open', comm: 'online', power: 'ac', leak: 'low', offline: false,
    alert: { type: 'leak-low', label: 'Low Flow Water Event', age: '5h 30m', startedAt: '03:45', volume: '45L', flowRate: '8.2 L/hour' },
  },

  // Ramat Gan Tower
  {
    id: 'cbre_il_rg_ms', account: 'cbre_il',
    name: 'Main Supply',
    l1: 'il', l2: 'central', l3: 'ramat_gan', l4: 'ramat_gan_tower',
    l1Name: 'Israel', l2Name: 'Central', l3Name: 'Ramat Gan', l4Name: 'Ramat Gan Tower',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'cbre_il_rg_ct', account: 'cbre_il',
    name: 'Cooling Tower',
    l1: 'il', l2: 'central', l3: 'ramat_gan', l4: 'ramat_gan_tower',
    l1Name: 'Israel', l2Name: 'Central', l3Name: 'Ramat Gan', l4Name: 'Ramat Gan Tower',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'cbre_il_rg_dhw', account: 'cbre_il',
    name: 'DHW Floors 1-10',
    l1: 'il', l2: 'central', l3: 'ramat_gan', l4: 'ramat_gan_tower',
    l1Name: 'Israel', l2Name: 'Central', l3Name: 'Ramat Gan', l4Name: 'Ramat Gan Tower',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'cbre_il_rg_hvac', account: 'cbre_il',
    name: 'HVAC North Wing',
    l1: 'il', l2: 'central', l3: 'ramat_gan', l4: 'ramat_gan_tower',
    l1Name: 'Israel', l2Name: 'Central', l3Name: 'Ramat Gan', l4Name: 'Ramat Gan Tower',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },

  // ─── CBRE UK ──────────────────────────────────────────────────────────────

  // London Henrietta House
  {
    id: 'cbre_uk_ln_ms', account: 'cbre_uk',
    name: 'Main Supply',
    l1: 'gb', l2: 'england', l3: 'london', l4: 'henrietta_house',
    l1Name: 'United Kingdom', l2Name: 'England', l3Name: 'London', l4Name: 'Henrietta House',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'cbre_uk_ln_ct', account: 'cbre_uk',
    name: 'Cooling Tower',
    l1: 'gb', l2: 'england', l3: 'london', l4: 'henrietta_house',
    l1Name: 'United Kingdom', l2Name: 'England', l3Name: 'London', l4Name: 'Henrietta House',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'cbre_uk_ln_dhw', account: 'cbre_uk',
    name: 'DHW',
    l1: 'gb', l2: 'england', l3: 'london', l4: 'henrietta_house',
    l1Name: 'United Kingdom', l2Name: 'England', l3Name: 'London', l4Name: 'Henrietta House',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },

  // Manchester Exchange
  {
    id: 'cbre_uk_mc_ms', account: 'cbre_uk',
    name: 'Main Supply',
    l1: 'gb', l2: 'england', l3: 'manchester_cbre', l4: 'manchester_exchange',
    l1Name: 'United Kingdom', l2Name: 'England', l3Name: 'Manchester', l4Name: 'Manchester Exchange',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'cbre_uk_mc_ct', account: 'cbre_uk',
    name: 'Cooling Tower',
    l1: 'gb', l2: 'england', l3: 'manchester_cbre', l4: 'manchester_exchange',
    l1Name: 'United Kingdom', l2Name: 'England', l3Name: 'Manchester', l4Name: 'Manchester Exchange',
    valve: 'error', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: { type: 'valve-error', label: 'Valve error', age: '1h 15m', startedAt: '08:07', volume: null },
  },
  {
    id: 'cbre_uk_mc_fs', account: 'cbre_uk',
    name: 'Fire Suppression',
    l1: 'gb', l2: 'england', l3: 'manchester_cbre', l4: 'manchester_exchange',
    l1Name: 'United Kingdom', l2Name: 'England', l3Name: 'Manchester', l4Name: 'Manchester Exchange',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },

  // ─── Tidhar (200 apartments generated) ────────────────────────────────────
  ...generateTidharApartments(),

  // ─── Bank Leumi ───────────────────────────────────────────────────────────

  // HQ Yehuda Halevi
  {
    id: 'leumi_ms', account: 'leumi',
    name: 'Main Supply',
    l1: 'il', l2: 'tlv_district', l3: 'tel_aviv', l4: 'hq_yehuda_halevi',
    l1Name: 'Israel', l2Name: 'Tel Aviv District', l3Name: 'Tel Aviv', l4Name: 'HQ Yehuda Halevi St.',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'leumi_ct', account: 'leumi',
    name: 'Cooling Tower',
    l1: 'il', l2: 'tlv_district', l3: 'tel_aviv', l4: 'hq_yehuda_halevi',
    l1Name: 'Israel', l2Name: 'Tel Aviv District', l3Name: 'Tel Aviv', l4Name: 'HQ Yehuda Halevi St.',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'leumi_dhw', account: 'leumi',
    name: 'DHW Floors 1-8',
    l1: 'il', l2: 'tlv_district', l3: 'tel_aviv', l4: 'hq_yehuda_halevi',
    l1Name: 'Israel', l2Name: 'Tel Aviv District', l3Name: 'Tel Aviv', l4Name: 'HQ Yehuda Halevi St.',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'leumi_fs', account: 'leumi',
    name: 'Fire Suppression',
    l1: 'il', l2: 'tlv_district', l3: 'tel_aviv', l4: 'hq_yehuda_halevi',
    l1Name: 'Israel', l2Name: 'Tel Aviv District', l3Name: 'Tel Aviv', l4Name: 'HQ Yehuda Halevi St.',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },

  // ─── Aldar Properties ─────────────────────────────────────────────────────

  // Yas Island Tower
  {
    id: 'aldar_ms', account: 'aldar',
    name: 'Main Supply',
    l1: 'ae', l2: 'abu_dhabi', l3: 'yas_island', l4: 'yas_tower',
    l1Name: 'United Arab Emirates', l2Name: 'Abu Dhabi', l3Name: 'Yas Island', l4Name: 'Yas Tower',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'aldar_ct', account: 'aldar',
    name: 'Cooling Tower',
    l1: 'ae', l2: 'abu_dhabi', l3: 'yas_island', l4: 'yas_tower',
    l1Name: 'United Arab Emirates', l2Name: 'Abu Dhabi', l3Name: 'Yas Island', l4Name: 'Yas Tower',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'aldar_dhw', account: 'aldar',
    name: 'DHW',
    l1: 'ae', l2: 'abu_dhabi', l3: 'yas_island', l4: 'yas_tower',
    l1Name: 'United Arab Emirates', l2Name: 'Abu Dhabi', l3Name: 'Yas Island', l4Name: 'Yas Tower',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'aldar_hvac', account: 'aldar',
    name: 'HVAC Central',
    l1: 'ae', l2: 'abu_dhabi', l3: 'yas_island', l4: 'yas_tower',
    l1Name: 'United Arab Emirates', l2Name: 'Abu Dhabi', l3Name: 'Yas Island', l4Name: 'Yas Tower',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'aldar_irr', account: 'aldar',
    name: 'Irrigation',
    l1: 'ae', l2: 'abu_dhabi', l3: 'yas_island', l4: 'yas_tower',
    l1Name: 'United Arab Emirates', l2Name: 'Abu Dhabi', l3Name: 'Yas Island', l4Name: 'Yas Tower',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },

  // ─── Weizmann Institute ───────────────────────────────────────────────────

  // Rehovot Campus
  {
    id: 'weizmann_ms', account: 'weizmann',
    name: 'Main Supply',
    l1: 'il', l2: 'central_district', l3: 'rehovot', l4: 'weizmann_campus',
    l1Name: 'Israel', l2Name: 'Central District', l3Name: 'Rehovot', l4Name: 'Weizmann Campus',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'weizmann_ct', account: 'weizmann',
    name: 'Cooling Tower',
    l1: 'il', l2: 'central_district', l3: 'rehovot', l4: 'weizmann_campus',
    l1Name: 'Israel', l2Name: 'Central District', l3Name: 'Rehovot', l4Name: 'Weizmann Campus',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'weizmann_lwa', account: 'weizmann',
    name: 'Lab Water A',
    l1: 'il', l2: 'central_district', l3: 'rehovot', l4: 'weizmann_campus',
    l1Name: 'Israel', l2Name: 'Central District', l3Name: 'Rehovot', l4Name: 'Weizmann Campus',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'weizmann_lwb', account: 'weizmann',
    name: 'Lab Water B',
    l1: 'il', l2: 'central_district', l3: 'rehovot', l4: 'weizmann_campus',
    l1Name: 'Israel', l2Name: 'Central District', l3Name: 'Rehovot', l4Name: 'Weizmann Campus',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'weizmann_dhw', account: 'weizmann',
    name: 'DHW',
    l1: 'il', l2: 'central_district', l3: 'rehovot', l4: 'weizmann_campus',
    l1Name: 'Israel', l2Name: 'Central District', l3Name: 'Rehovot', l4Name: 'Weizmann Campus',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },
  {
    id: 'weizmann_irr', account: 'weizmann',
    name: 'Irrigation',
    l1: 'il', l2: 'central_district', l3: 'rehovot', l4: 'weizmann_campus',
    l1Name: 'Israel', l2Name: 'Central District', l3Name: 'Rehovot', l4Name: 'Weizmann Campus',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    alert: null,
  },

  // ─── David Levi's apartments (cross-account tenant) ─────────────────────────
  {
    id: 'dl_apt_sea_view', account: 'tidhar',
    name: 'Sea View Apt',
    l1: 'il', l2: 'central', l3: 'netanya', l4: 'tidhar_sea_view',
    l1Name: 'Israel', l2Name: 'Central District', l3Name: 'Netanya', l4Name: 'Tidhar Sea View',
    // Maya Tal's "Sea View" apartment — demo state per 2026-06-04 spec:
    // active Low Flow water event + valve error, system still communicating.
    valve: 'error', comm: 'online', power: 'ac', leak: 'low', offline: false,
    homeAway: true,
    alert: { type: 'leak-low', label: 'Low Flow Water Event', age: '42m', startedAt: '08:42', volume: '10L', flowRate: '0.5 L/hour' },
  },
  {
    id: 'dl_apt_leumi_tower', account: 'leumi',
    name: 'Apt 8B \u2014 Leumi Tower',
    l1: 'il', l2: 'tlv_district', l3: 'tel_aviv', l4: 'leumi_residential',
    l1Name: 'Israel', l2Name: 'Tel Aviv District', l3Name: 'Tel Aviv', l4Name: 'Leumi Tower Residences',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    homeAway: true,
    alert: null,
  },
  {
    id: 'dl_apt_aldar_yas', account: 'aldar',
    name: 'Villa 23 \u2014 Yas Island',
    l1: 'ae', l2: 'abu_dhabi', l3: 'abu_dhabi_city', l4: 'yas_acres',
    l1Name: 'UAE', l2Name: 'Abu Dhabi', l3Name: 'Abu Dhabi', l4Name: 'Yas Acres',
    valve: 'open', comm: 'online', power: 'ac', leak: null, offline: false,
    homeAway: true,
    alert: null,
  },
];

// ─── Add protection fields to all systems ──────────────────────────────────
// lastSeen: ISO timestamp of last communication (offline systems = >24h ago)
// notificationRecipients: number of people registered for leak alerts

const NOW = Date.now();
const HOUR = 3600000;

// Contact pool for demo
const CONTACT_POOL = [
  { name: 'Mark Chen', email: 'mark.chen@suffolk.com' },
  { name: 'Sarah Wilson', email: 'sarah.w@suffolk.com' },
  { name: 'James Lee', email: 'james.lee@suffolk.com' },
  { name: 'Tom Wilson', email: 'tom.wilson@cbre.com' },
  { name: 'Rachel Adams', email: 'rachel.adams@cbre.com' },
  { name: 'Claire Dupont', email: 'claire.dupont@socgen.com' },
  { name: 'Mike Thompson', email: 'mike.t@heathrow.com' },
  { name: 'Yael Stern', email: 'yael.stern@weizmann.ac.il' },
  { name: 'Oren Tidhar', email: 'oren@tidhar.co.il' },
  { name: 'David Levi', email: 'david.levi@gmail.com' },
];

// Systems with no notification recipients (for demo)
const NO_RECIPIENTS = new Set(['dhwa', 'msd', 'weizmann_irr', 'aldar_irr', 'sp']);

// Synthetic street-address generator per l4/l3 — gives the Water Event Summary widget
// a denser, more recognisable line under the system name than the breadcrumb path.
// In production this would come from the Location entity; here it's deterministic
// per system so the demo stays stable across reloads.
const ADDRESS_BY_L4 = {
  towerone:    '142 Quay Street, Manchester M3 4FE',
  msla:        '142 Quay Street, Manchester M3 4FE',
  rivermill:   '8 Old Mill Lane, Salford M5 2GA',
  terminal2:   'Eastern Perimeter, Heathrow Airport TW6 1EW',
  terminal5:   'Western Concourse, Heathrow Airport TW6 2GA',
  tower_a:     '17 Cours Valmy, La Défense, Puteaux 92800',
  weizmann:    '234 Herzl Street, Rehovot 7610001',
  tel_aviv:    '5 Rothschild Blvd, Tel Aviv 6688112',
  ramat_gan:   '12 Aluf Sade Street, Ramat Gan 5252006',
  herzliya:    '88 Medinat HaYehudim, Herzliya 4673304',
  tidhar_towers: '12 Em HaMoshavot, Petah Tikva 4951125',
  cbre_uk_mc:  '142 Quay Street, Manchester M3 4FE',
  cbre_il_hz:  '88 Medinat HaYehudim, Herzliya 4673304',
  aldar:       'Al Raha Beach, Abu Dhabi PO 53234',
  azure_ams:   'Pieter Calandlaan 1, Amsterdam 1065 KH',
  socgen:      '29 Boulevard Haussmann, Paris 75009',
};
function addressFor(s) {
  if (ADDRESS_BY_L4[s.l4]) return ADDRESS_BY_L4[s.l4];
  if (ADDRESS_BY_L4[s.l3]) return ADDRESS_BY_L4[s.l3];
  // Fallback: synthesize from breadcrumb so the line is never empty
  const parts = [s.l4Name, s.l3Name, s.l2Name].filter(Boolean);
  return parts.join(', ');
}

// ── Offline distribution normalisation (locked 2026-06-04) ─────────────────
// Tenant apartments (sys.homeAway === true) are ALWAYS online. Non-tenant
// systems get exactly 2 offline per l4 location (or all of them when the
// location has fewer than 2). Existing offline flags get reset first so the
// only source of truth is the rule below.
SYSTEMS.forEach(s => {
  // Reset every offline trace. Specific offline-alert objects get cleared so
  // we don't end up with a stale "Device offline" alert on a now-online row.
  if (s.alert?.type === 'offline') s.alert = null;
  s.offline = false;
  if (s.comm === 'offline') s.comm = 'online';
});

// Group non-tenant systems by l4. Tenant systems (homeAway===true) skipped —
// they stay online.
(() => {
  const byL4 = new Map();
  for (const s of SYSTEMS) {
    if (s.homeAway) continue;
    const key = s.l4 || s.l3 || s.account;
    if (!byL4.has(key)) byL4.set(key, []);
    byL4.get(key).push(s);
  }
  for (const [, group] of byL4) {
    // Stable sort by id so the pick is deterministic across reloads. Prefer
    // systems that don't already have a non-offline alert (so we don't
    // overwrite a valve-error / leak-high / power-lost demo case).
    const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id));
    const picks = [];
    for (const s of sorted) {
      if (picks.length >= 2) break;
      if (s.alert && s.alert.type !== 'offline') continue; // keep specific alert
      picks.push(s);
    }
    // If fewer than 2 alert-free systems exist in this location, fall back to
    // whatever's left (still capped at 2).
    if (picks.length < 2) {
      for (const s of sorted) {
        if (picks.length >= 2) break;
        if (!picks.includes(s)) picks.push(s);
      }
    }
    for (const s of picks) {
      s.comm = 'offline';
      s.offline = true;
      // Don't replace an existing non-offline alert — those remain the demo's
      // primary signal. Only synth an offline alert on systems that had none.
      if (!s.alert) {
        s.alert = { type: 'offline', label: 'Device offline', age: '2h 10m', startedAt: '07:12', volume: null };
      }
    }
  }
})();

SYSTEMS.forEach((s, idx) => {
  // lastSeen: offline systems last seen >24h ago. Online systems within the
  // last ~30 min so they comfortably clear the strictest WINT3 VMA 60-min
  // comm threshold — otherwise computeSystemHealth() flips them to "Offline"
  // even when their comm flag says online (bug spotted 2026-06-04 — the
  // drawer showed ~85% of apartments offline because lastSeen was up to 10h
  // old).
  if (s.offline || s.comm === 'offline') {
    s.lastSeen = new Date(NOW - 26 * HOUR - Math.random() * 48 * HOUR).toISOString();
  } else {
    const MIN = 60 * 1000;
    s.lastSeen = new Date(NOW - Math.random() * 30 * MIN).toISOString();
  }
  // Postal address — for the Summary widget's line 2
  s.address = addressFor(s);
  // Contacts
  if (NO_RECIPIENTS.has(s.id)) {
    s.notificationRecipients = 0;
    s.contacts = [];
  } else {
    const count = Math.floor(Math.random() * 3) + 1;
    const start = idx % CONTACT_POOL.length;
    s.contacts = [];
    for (let i = 0; i < count; i++) {
      s.contacts.push(CONTACT_POOL[(start + i) % CONTACT_POOL.length]);
    }
    s.notificationRecipients = s.contacts.length;
  }
});

// ─── Convenience exports ───────────────────────────────────────────────────

export const ALERT_CARDS = SYSTEMS.filter(s => s.alert !== null);

// Overlay any simulator-written alert onto the static system. Called from
// every screen, so simulator pushes show up in /alerts, /system, /alert.
import { getSimulatedAlert, reloadSimulatedAlerts } from './simulatedAlerts';
import { getSimulatedEvents } from './simulatedEvents';

// "Treat the fleet as clean" flag, set by the pusher's Clear button via
// applyDemoReset(). When set, every system that has NO sim alert reads as
// alert: null - the pre-populated mock incidents + historical events are
// suppressed everywhere they're read. New pushes still work on top: firing
// a Warning activates a sim alert for that one system; everything else
// stays clean. Sticky in localStorage; gone on a full storage clear.
const MOCK_SUPPRESSED_KEY = 'pulse2-mock-suppressed';
export function isMockSuppressed() {
  try { return localStorage.getItem(MOCK_SUPPRESSED_KEY) === '1'; }
  catch { return false; }
}
export function setMockSuppressed(yes) {
  try {
    if (yes) localStorage.setItem(MOCK_SUPPRESSED_KEY, '1');
    else localStorage.removeItem(MOCK_SUPPRESSED_KEY);
  } catch { /* ignore */ }
}

/**
 * Has the pusher touched this system? True if there's a sim alert OR any
 * row in the simulatedEvents log for this system.
 *
 * Rule (Rami 2026-06-06): once the pusher touches a system, the pusher
 * owns the truth for that system. Static mock incidents + lifecycle
 * events from incidents.js / events.js are suppressed so the Timeline
 * + Alert step lists don't show a confusing mix of static + sim rows.
 *
 * Hitting the pusher's "Clear all" button wipes both stores -> static
 * data comes back.
 */
export function hasSimActivity(systemId) {
  if (!systemId) return false;
  // Global "treat fleet as clean" flag also counts - it suppresses static
  // incidents + historical lifeEvents the same way per-system sim activity
  // does. So getActiveIncident + getLifeEventsForSystem stay clean without
  // any extra plumbing in those modules.
  if (isMockSuppressed()) return true;
  if (getSimulatedAlert(systemId)) return true;
  if (getSimulatedEvents(systemId).length > 0) return true;
  return false;
}

/**
 * Apply a single sim alert overlay to a static system.
 *
 * Exposed so consumers that already have the full SYSTEMS array + sims map
 * (UserContext.visibleSystems, computeActiveEvents) use the same logic and
 * never drift from getSystemById(). DRY single source of truth.
 *
 * Behavior:
 *   - No sim    -> static system unchanged
 *   - Resolved water-event sim (sim.resolved && leak-*) -> alert TOMBSTONED:
 *     returns { ...sys, alert: null }. Suppresses both sim AND any static
 *     water alert so the System page widget hides, drawer drops the red
 *     sub-line, active alert lists don't count it. Lifecycle still on Timeline.
 *   - Active sim -> { ...sys, alert: sim } plus implicit overlays:
 *       sim.valveOverride -> sys.valve
 *       sim.type === 'power-lost'  -> sys.power = 'ac-lost'
 *       sim.type === 'offline'     -> sys.comm  = 'offline'
 *       sim.type === 'valve-error' -> sys.valve = 'error'
 */
export function applySimOverlay(sys, sim) {
  if (!sim) {
    // "Treat fleet as clean": reset EVERY status field that could surface
    // a problem - not just sys.alert. Without this, a system whose static
    // mock data has valve='error', comm='offline', or power='ac-lost'
    // would keep showing those issues on the ProtectionStatusCard +
    // computeActiveEvents' secondary issues even after Clear, and the
    // fleet wouldn't actually look clean.
    //
    // Reset rules:
    //   alert  -> null
    //   valve  -> 'open' (or kept null on no-valve systems)
    //   comm   -> 'online'
    //   power  -> 'ac' (only when the system originally had power)
    //   offline -> false
    //
    // A new push (e.g. valve-error / offline / power-lost) overrides
    // these via the sim path below - so the clean baseline doesn't
    // block testing.
    if (isMockSuppressed()) {
      return {
        ...sys,
        alert: null,
        valve: sys.valve == null ? sys.valve : 'open',
        comm: 'online',
        power: sys.power == null ? sys.power : 'ac',
        offline: false,
        // computeSystemHealth prefers sys.lastSeen over sys.comm - if
        // mock data has a stale timestamp, it still reads as offline.
        // Mark lastSeen as "right now" so the threshold check passes.
        lastSeen: new Date().toISOString(),
        // Ensure at least one recipient so the "no recipients" dimension
        // doesn't fail health.
        notificationRecipients: Math.max(1, sys.notificationRecipients || 0),
      };
    }
    return sys;
  }

  // Resolved water event tombstones the alert (see header comment).
  if (sim.resolved && (sim.type === 'leak-high' || sim.type === 'leak-low')) {
    return { ...sys, alert: null };
  }

  // valveStateOnly sim entries (e.g. VC_OK_01 Valve closed by user) carry
  // a valve state change but are NOT alerts. Per project rule "Valve
  // closed is NOT an issue." Apply the valve override; leave sys.alert
  // untouched so the drawer doesn't go red and the Alerts list doesn't
  // pick it up.
  if (sim.valveStateOnly) {
    return { ...sys, valve: sim.valveOverride || sys.valve };
  }

  const overlaid = { ...sys, alert: sim };
  if (sim.valveOverride) overlaid.valve = sim.valveOverride;
  if (sim.type === 'power-lost')  overlaid.power = 'ac-lost';
  if (sim.type === 'offline') {
    overlaid.comm = 'offline';
    // Push lastSeen back so computeSystemHealth's threshold check agrees -
    // it prefers lastSeen over the flag, and if the static lastSeen is
    // recent it would compute isComm=true even when comm='offline'.
    // 90 min past = beyond the 60-min default threshold for WINT 3/VMA.
    overlaid.lastSeen = new Date(Date.now() - 90 * 60 * 1000).toISOString();
  }
  if (sim.type === 'valve-error') overlaid.valve = 'error';
  return overlaid;
}

export function getSystemById(id) {
  reloadSimulatedAlerts();
  const sys = SYSTEMS.find(s => s.id === id);
  if (!sys) return undefined;
  return applySimOverlay(sys, getSimulatedAlert(id));
}

export function isLeakDetectionEnabled(sys) {
  if (!sys) return false;
  if (sys.leakDetectionEnabled === false) return false;
  return !sys.offline;
}

// IANA timezone defaults per country (l1 field).
const TZ_BY_COUNTRY = {
  ae: 'Asia/Dubai',
  de: 'Europe/Berlin',
  fr: 'Europe/Paris',
  gb: 'Europe/London',
  ie: 'Europe/Dublin',
  il: 'Asia/Jerusalem',
  nl: 'Europe/Amsterdam',
  uk: 'Europe/London',
};

export function getSystemTz(sysOrId) {
  const sys = typeof sysOrId === 'string' ? getSystemById(sysOrId) : sysOrId;
  if (!sys) return 'UTC';
  if (sys.tz) return sys.tz;
  return TZ_BY_COUNTRY[sys.l1] || 'UTC';
}

export function computeWidgets(systems) {
  const online = systems.filter(s => s.comm === 'online').length;
  const offline = systems.filter(s => s.comm === 'offline').length;
  const offlineSystems = systems.filter(s => s.comm === 'offline').map(s => s.id);

  const valveSystems = systems.filter(s => s.valve !== null && s.comm === 'online');
  const open = valveSystems.filter(s => s.valve === 'open').length;
  const closed = valveSystems.filter(s => s.valve === 'closed').length;
  const error = valveSystems.filter(s => s.valve === 'error').length;
  const closedSystems = valveSystems.filter(s => s.valve === 'closed').map(s => s.id);
  const errorSystems = valveSystems.filter(s => s.valve === 'error').map(s => s.id);

  const commSystems = systems.filter(s => s.comm === 'online');
  const ac = commSystems.filter(s => s.power === 'ac').length;
  const acLost = commSystems.filter(s => s.power === 'ac-lost').length;
  const battery = commSystems.filter(s => s.power === 'battery').length;
  const acLostSystems = commSystems.filter(s => s.power === 'ac-lost').map(s => s.id);
  const batterySystems = commSystems.filter(s => s.power === 'battery').map(s => s.id);

  return {
    comm: { online, offline, offlineSystems },
    valves: { open, closed, error, closedSystems, errorSystems },
    power: { ac, acLost, battery, acLostSystems, batterySystems },
  };
}

export function computeKPIs(systems) {
  return {
    highFlows: systems.filter(s => s.alert?.type === 'leak-high').length,
    lowFlows: systems.filter(s => s.alert?.type === 'leak-low').length,
    insights: 0,
    errors: systems.filter(s => s.alert && s.alert.type !== 'leak-high' && s.alert.type !== 'leak-low').length,
    offline: systems.filter(s => s.offline).length,
  };
}

export const WIDGET_COUNTS = computeWidgets(SYSTEMS);
