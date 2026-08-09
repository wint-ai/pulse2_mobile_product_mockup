// Personas — the demo profile picker.
//
// Locked 2026-06-04 to a focused 6-persona set:
//   1. Tenant · 1 apartment            — Sarah Cohen (Apt 47 Tidhar Towers — same building Oren manages, so the demo can flip between tenant view + building-manager view of the same active leak)
//   2. Tenant · 2 apartments           — Maya Tal (Sea View + Leumi Tower)
//   3. Building manager · residential  — Oren Tidhar (200 apts, Tidhar Towers)
//   4. Location manager · 1 building   — Mark Chen (Tower One, Manchester)
//   5. Account manager · Suffolk       — James Lee (Suffolk Construction)
//   6. Account manager · CBRE          — Rachel Adams (CBRE — Israel + UK)
//
// + DEFAULT_PERSONA (Rami / Wint staff) — kept for the internal admin view.
//
// All prior demo personas were dropped on the same date. If we need them
// back, git history has them.

export const DEFAULT_PERSONA = {
  id: 'wint-admin',
  name: 'Rami Kletshevsky',
  role: 'Wint Admin',
  sub: '4 accounts in scope',
  description: 'Wint staff — scope: Suffolk, Heathrow, CBRE, Tidhar. Can explore all.',
  email: 'rami.kletshevsky@wint.ai',
  phone: '+972528542617',
  icon: '⚡',
  color: '#7C3AED',
  bg: '#F5F3FF',
  isWint: true,
  homePath: '/',
  tabMode: 'manager',
  systemFilter: (s) => s.account === 'sc' || s.account === 'ha' || s.account === 'cbre_il' || s.account === 'cbre_uk' || s.account === 'tidhar',
};

export const PERSONAS = [

  // ── TENANTS ────────────────────────────────────────────────────────────────

  {
    id: 'tenant-1apt',
    name: 'Sarah Cohen',
    role: 'Tenant',
    sub: 'Apt 47 · Tidhar Towers',
    description: 'Tenant in Apt 47, Tidhar Towers — same building Oren Tidhar manages. Happy-path demo: all clear, no events.',
    email: 'sarah.cohen@gmail.com',
    phone: '+972501234567',
    icon: '🏠',
    color: '#A1D246',
    bg: '#F0FDF4',
    isWint: false,
    homePath: '/tenant',
    tabMode: 'tenant',
    systemFilter: (s) => s.id === 'tidhar_apt_47',
  },
  {
    id: 'tenant-2apts',
    name: 'Maya Tal',
    role: 'Property Owner',
    sub: '2 apartments · Netanya & Tel Aviv',
    description: 'Owns two apartments in different cities. Sea View has an active Low Flow water event + valve error; Leumi Tower is all clear. Both communicating.',
    email: 'maya.tal@gmail.com',
    phone: '+972504567890',
    icon: '🏠',
    color: '#A1D246',
    bg: '#F0FDF4',
    isWint: false,
    homePath: '/tenant',
    tabMode: 'tenant',
    systemFilter: (s) => s.id === 'dl_apt_sea_view' || s.id === 'dl_apt_leumi_tower',
  },

  // ── MANAGERS ───────────────────────────────────────────────────────────────

  {
    id: 'building-manager-residential',
    name: 'Oren Tidhar',
    role: 'Building Manager',
    sub: 'Tidhar Towers · 200 apartments',
    description: 'Manages all apartments in one residential building. Includes one active Water Event + one offline unit.',
    email: 'oren@tidhar.co.il',
    phone: '+972541234567',
    icon: '🏢',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    isWint: false,
    homePath: '/',
    tabMode: 'manager',
    systemFilter: (s) => s.account === 'tidhar' && s.l4 === 'tidhar_towers',
  },
  {
    id: 'location-manager',
    name: 'Mark Chen',
    role: 'Location Manager',
    sub: 'Tower One · Manchester',
    description: 'Manages a single commercial building. Mix of cooling towers, sump pumps and supply lines.',
    email: 'mark.chen@suffolk.com',
    phone: '+44 7700 900222',
    icon: '🏢',
    color: '#04ADEF',
    bg: '#EFF6FF',
    isWint: false,
    homePath: '/',
    tabMode: 'manager',
    systemFilter: (s) => s.account === 'sc' && s.l4 === 'towerone',
  },
  {
    id: 'account-manager-suffolk',
    name: 'James Lee',
    role: 'Account Manager',
    sub: 'Suffolk Construction · 5 sites',
    description: 'Manages every Suffolk Construction site across the UK + Germany. Multi-location scope, mixed alerts.',
    email: 'james.lee@suffolk.com',
    phone: '+44 7700 900123',
    icon: '🏢',
    color: '#04ADEF',
    bg: '#EFF6FF',
    isWint: false,
    homePath: '/',
    tabMode: 'manager',
    systemFilter: (s) => s.account === 'sc',
  },
  {
    id: 'account-manager-cbre',
    name: 'Rachel Adams',
    role: 'Account Manager',
    sub: 'CBRE · Israel & UK',
    description: 'Manages CBRE properties across Israel and UK sub-accounts. Multi-sub-account scope, mixed alerts.',
    email: 'rachel.adams@cbre.com',
    phone: '+1 212 555 0199',
    icon: '🌐',
    color: '#0D9488',
    bg: '#F0FDFA',
    isWint: false,
    homePath: '/',
    tabMode: 'manager',
    systemFilter: (s) => s.account?.startsWith('cbre'),
  },

  // ── WINT STAFF ─────────────────────────────────────────────────────────────

  DEFAULT_PERSONA,

  // ── TECHNICIANS ──────────────────────────────────────────────────────────────

  {
    id: 'technician-1',
    name: 'David Levy',
    role: 'Field Technician',
    sub: 'Hilton Hotels & Marriott',
    description: 'Certified field technician assigned to Hilton Hotels and Marriott. Handles CU pairing, VMA pairing, TSO, and WiFi setup.',
    email: 'david.levy@wint.ai',
    phone: '+972521234567',
    icon: '\uD83D\uDD27',
    color: '#0D9488',
    bg: '#F0FDFA',
    isWint: true,
    homePath: '/tech',
    tabMode: 'technician',
    systemFilter: () => false, // Technician uses separate data layer
  },
];

export function getPersonaById(id) {
  return PERSONAS.find(p => p.id === id);
}
