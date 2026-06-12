export const SCOPES = [
  { key: 'all',         label: 'All locations',    sub: '12 systems',                indent: 0, alerts: 4 },
  { key: 'uk',          label: 'United Kingdom',   sub: '10 systems · Country · L1', indent: 1, alerts: 4 },
  { key: 'nwe',         label: 'NW England',       sub: '8 systems · Region · L2',   indent: 2, alerts: 4 },
  { key: 'manchester',  label: 'Manchester',       sub: '6 systems · Campus · L3',   indent: 3, alerts: 3 },
  { key: 'towerone',    label: 'Tower One',        sub: '5 systems · Building · L4', indent: 4, alerts: 2 },
  { key: 'parkingb1',   label: 'Parking Level B1', sub: '1 system · Floor · L4',     indent: 4, alerts: 1 },
  { key: 'liverpool',   label: 'Liverpool',        sub: '2 systems · Campus · L3',   indent: 3, alerts: 1 },
  { key: 'se',          label: 'SE England',       sub: '2 systems · Region · L2',   indent: 2, alerts: 0 },
  { key: 'germany',     label: 'Germany',          sub: '2 systems · Country · L1',  indent: 1, alerts: 0 },
];

export function getScopeByKey(key) {
  return SCOPES.find(s => s.key === key) || SCOPES[0];
}
