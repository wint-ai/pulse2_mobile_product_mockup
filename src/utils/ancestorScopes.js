// Builds pressable ancestor scope objects from a system, so headers can show
// breadcrumbs that act as scope shortcuts.

import { SYSTEMS } from '../data/systems';
import { getAccountById } from '../data/accounts';

function matching(sys, levels) {
  return SYSTEMS.filter(s => levels.every(l => s[l] === sys[l]));
}

/**
 * Given a system, return an array of ancestor scope objects (top-down, account → L4).
 * Each entry is shape-compatible with `selectedScope` in UserContext.
 */
export function getAncestorScopes(sys) {
  if (!sys) return [];
  const acc = getAccountById(sys.account);
  const path = [];

  if (acc) {
    const systems = SYSTEMS.filter(s => s.account === sys.account);
    path.push({
      id: `acc-${sys.account}`,
      name: acc.name,
      levelType: 'Account',
      ancestors: [],
      systems,
      systemIds: systems.map(s => s.id),
    });
  }
  if (sys.l1 && sys.l1Name) {
    const systems = matching(sys, ['account', 'l1']);
    path.push({
      id: `l1-${sys.account}-${sys.l1}`,
      name: sys.l1Name,
      levelType: 'Country',
      ancestors: path.map(p => p.name),
      systems,
      systemIds: systems.map(s => s.id),
    });
  }
  if (sys.l2 && sys.l2Name) {
    const systems = matching(sys, ['account', 'l1', 'l2']);
    path.push({
      id: `l2-${sys.account}-${sys.l1}-${sys.l2}`,
      name: sys.l2Name,
      levelType: 'Region',
      ancestors: path.map(p => p.name),
      systems,
      systemIds: systems.map(s => s.id),
    });
  }
  if (sys.l3 && sys.l3Name) {
    const systems = matching(sys, ['account', 'l1', 'l2', 'l3']);
    path.push({
      id: `l3-${sys.account}-${sys.l1}-${sys.l2}-${sys.l3}`,
      name: sys.l3Name,
      levelType: 'City',
      ancestors: path.map(p => p.name),
      systems,
      systemIds: systems.map(s => s.id),
    });
  }
  if (sys.l4 && sys.l4Name) {
    const systems = matching(sys, ['account', 'l1', 'l2', 'l3', 'l4']);
    path.push({
      id: `l4-${sys.account}-${sys.l1}-${sys.l2}-${sys.l3}-${sys.l4}`,
      name: sys.l4Name,
      levelType: 'Building',
      ancestors: path.map(p => p.name),
      systems,
      systemIds: systems.map(s => s.id),
    });
  }
  return path;
}
