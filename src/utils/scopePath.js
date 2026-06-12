// Derives a hierarchy breadcrumb from a list of systems.
// Walks the deepest level at which all systems share the same value.

import { getAccountById } from '../data/accounts';

/**
 * @param {Array}   systems   — list of system objects (filtered by current scope)
 * @param {boolean} exploring — whether the user is in "Explore All" mode
 * @returns {{ crumbs: string[], all: boolean, summary: string|null }}
 *   - all=true        → "Explore All" mode
 *   - crumbs=[…]      → shared hierarchy breadcrumb (1+ levels deep)
 *   - summary='X accounts · Y locations' → multiple accounts; no shared root
 */
export function getScopePath(systems, exploring) {
  if (exploring) return { crumbs: [], all: true, summary: null };
  if (!systems || systems.length === 0) return { crumbs: [], all: false, summary: 'No systems' };

  const first = systems[0];

  // Account-level
  const allSameAccount = systems.every(s => s.account === first.account);

  if (!allSameAccount) {
    // Multiple accounts in scope — no clean breadcrumb. Summarize counts.
    const accountIds = new Set(systems.map(s => s.account));
    const locationIds = new Set(systems.map(s => `${s.l1}/${s.l2}/${s.l3}/${s.l4}`));
    return {
      crumbs: [],
      all: false,
      summary: `${accountIds.size} accounts · ${locationIds.size} locations`,
    };
  }

  // Single account — build hierarchy down as far as we share
  const acc = getAccountById(first.account);
  const accountName = acc?.name;
  const crumbs = [];
  if (accountName) crumbs.push(accountName);

  const allSameL1 = systems.every(s => s.l1 === first.l1);
  if (allSameL1 && first.l1Name) crumbs.push(first.l1Name);

  const allSameL2 = allSameL1 && systems.every(s => s.l2 === first.l2);
  if (allSameL2 && first.l2Name) crumbs.push(first.l2Name);

  const allSameL3 = allSameL2 && systems.every(s => s.l3 === first.l3);
  if (allSameL3 && first.l3Name) crumbs.push(first.l3Name);

  const allSameL4 = allSameL3 && systems.every(s => s.l4 === first.l4);
  if (allSameL4 && first.l4Name) crumbs.push(first.l4Name);

  return { crumbs, all: false, summary: null };
}
