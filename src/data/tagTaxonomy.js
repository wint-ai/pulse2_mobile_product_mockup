// Tag taxonomy for water-event tagging — single source of truth.
// Used by both the standalone Tag bottom sheet and the Ignore-with-tag flow.
//
// 2026-06-04 — locked v1 per PRD 15 § 5.4. Two-group layout:
//
//   Group A — "Was something wrong?"   (fault causes)
//   Group B — "Expected use"           (routine consumption)
//
// Each group has a `visible` list (always rendered) + a `more` list (revealed
// by tapping the per-group More… affordance). Group B's more list ends with
// the free-text "Other" entry point in the UI.
//
// The chip set is IDENTICAL across all three phases — Active, Ignore (PRD 14),
// and Closed (PRD 15 § 5.3). No chip exclusions, no per-phase variants. The
// Ignore sheet adds a warning block above the chips but uses the same lists.

// ──────────────────────────────────────────────────────────────────────────
// Group A — Was something wrong? (fault causes)
// ──────────────────────────────────────────────────────────────────────────

export const GROUP_A_VISIBLE = [
  'Broken pipe',
  'Stuck/running toilet',
  'Leaking fixture',
  'Appliance leak',
  'Faulty valve',
];

export const GROUP_A_MORE = [
  'HVAC / cooling water issue',
  'Backflow / sewage',
  'Fire system discharge',
];

// ──────────────────────────────────────────────────────────────────────────
// Group B — Expected use (routine consumption)
// ──────────────────────────────────────────────────────────────────────────

export const GROUP_B_VISIBLE = [
  'Irrigation',
  'Cleaning',
  'Faucet/hose left on',
  'Shower/bath',
  'Pool/spa filling',
  'Construction work',
];

export const GROUP_B_MORE = [
  'HVAC routine top-up',
  'Building maintenance',
  'Fire system test',
  'Industrial / lab use',
];

// ──────────────────────────────────────────────────────────────────────────
// Group metadata for the sheet
// ──────────────────────────────────────────────────────────────────────────

export const TAG_GROUPS = [
  {
    id: 'wrong',
    label: 'Was something wrong?',
    visible: GROUP_A_VISIBLE,
    more: GROUP_A_MORE,
  },
  {
    id: 'expected',
    label: 'Expected use',
    visible: GROUP_B_VISIBLE,
    more: GROUP_B_MORE,
  },
];

// Flat list of every chip (visible + more, both groups). Useful for the
// "Currently tagged" greyout logic and chip → group lookups.
export const ALL_CHIPS = [
  ...GROUP_A_VISIBLE, ...GROUP_A_MORE,
  ...GROUP_B_VISIBLE, ...GROUP_B_MORE,
];

// Which group does a chip belong to? Useful for analytics + future
// learning-model integration (PRD 15 § 10.2).
export function groupForChip(chip) {
  if (GROUP_A_VISIBLE.includes(chip) || GROUP_A_MORE.includes(chip)) return 'wrong';
  if (GROUP_B_VISIBLE.includes(chip) || GROUP_B_MORE.includes(chip)) return 'expected';
  return 'other'; // free-text Other lives outside both groups
}

// ──────────────────────────────────────────────────────────────────────────
// Deprecated — old 3-step taxonomy
// Kept as exports so LeakDetail.jsx (deprecated screen, no longer in the nav
// flow per the post-2026-06-03 routing rules) doesn't break on import. New
// code should use TAG_GROUPS / groupForChip above.
// ──────────────────────────────────────────────────────────────────────────

export const IMPACTS = [
  { id: 'prevented',     label: 'Prevented or reduced damage',                  icon: 'shield',          fill: true  },
  { id: 'reduced-waste', label: 'Reduced waste',                                 icon: 'water_drop',      fill: true  },
  { id: 'not-interested', label: "I wasn't interested in this alert — Expected water flow", icon: 'event_available', fill: false },
  { id: 'other',         label: 'Other',                                         icon: 'more_horiz',      fill: false },
];

export const SOURCES = [
  { id: 'water-line',   label: 'Water line leak',                  sub: 'e.g. pipe burst',  icon: 'plumbing',              fill: true  },
  { id: 'stuck-toilet', label: 'Stuck toilet',                                              icon: 'wc',                    fill: true  },
  { id: 'leaking-urinal', label: 'Leaking urinal',                                          icon: 'wc',                    fill: true  },
  { id: 'tap-water',    label: 'Tap water',                        sub: 'sink, shower',     icon: 'shower',                fill: true  },
  { id: 'water-cooler', label: 'Water cooler / coffee machine',                             icon: 'coffee',                fill: true  },
  { id: 'pool',         label: 'Swimming pool / hot tub',                                   icon: 'pool',                  fill: true  },
  { id: 'cyclical',     label: 'Cyclical machine',                 sub: 'washing machine',  icon: 'local_laundry_service', fill: true  },
  { id: 'treatment',    label: 'Water treatment equipment',                                 icon: 'science',               fill: true  },
  { id: 'irrigation',   label: 'Irrigation system',                                         icon: 'grass',                 fill: true  },
  { id: 'cooling',      label: 'Cooling tower / chiller',                                   icon: 'ac_unit',               fill: true  },
  { id: 'scheduled',    label: 'Scheduled / maintenance action',                            icon: 'build',                 fill: true  },
  { id: 'other',        label: 'Other: please specify',                                     icon: 'edit',                  fill: false },
];

export const IMPACT_BY_ID = Object.fromEntries(IMPACTS.map(i => [i.id, i]));
export const SOURCE_BY_ID = Object.fromEntries(SOURCES.map(s => [s.id, s]));
