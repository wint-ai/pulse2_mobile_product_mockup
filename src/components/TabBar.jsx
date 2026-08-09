import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useUserContext } from '../context/UserContext';

const HOME_ICON_FILLED = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);
const HOME_ICON_STROKE = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 12L12 3l9 9M5 10v9h5v-5h4v5h5v-9"/>
  </svg>
);
const EVENTS_ICON_FILLED = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 3a1 1 0 110 2 1 1 0 010-2zm0 4a4 4 0 110 8 4 4 0 010-8z"/>
  </svg>
);
const EVENTS_ICON_STROKE = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <path d="M8 7h8M8 12h5M8 17h3"/>
  </svg>
);
const SYSTEMS_ICON_FILLED = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
  </svg>
);
const SYSTEMS_ICON_STROKE = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M4 6h16M4 12h16M4 18h16"/>
  </svg>
);
const MORE_ICON_FILLED = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2.5"/>
    <circle cx="12" cy="12" r="2.5"/>
    <circle cx="12" cy="19" r="2.5"/>
  </svg>
);
const MORE_ICON_STROKE = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="5" r="2"/>
    <circle cx="12" cy="12" r="2"/>
    <circle cx="12" cy="19" r="2"/>
  </svg>
);

const TABS_FULL = [
  { key: 'home',    label: 'Home',    path: '/',        filled: HOME_ICON_FILLED,    stroke: HOME_ICON_STROKE },
  { key: 'events',  label: 'Alerts',  path: '/alerts',  filled: EVENTS_ICON_FILLED,  stroke: EVENTS_ICON_STROKE },
  { key: 'account', label: 'More',    path: '/account', filled: MORE_ICON_FILLED,    stroke: MORE_ICON_STROKE },
];

const TABS_TENANT = [
  { key: 'home',    label: 'Home',    path: '/tenant',  filled: HOME_ICON_FILLED,    stroke: HOME_ICON_STROKE },
  { key: 'events',  label: 'Alerts',  path: '/alerts',  filled: EVENTS_ICON_FILLED,  stroke: EVENTS_ICON_STROKE },
  { key: 'account', label: 'More',    path: '/account', filled: MORE_ICON_FILLED,    stroke: MORE_ICON_STROKE },
];

// Technician icons
const LOCATION_ICON_FILLED = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
  </svg>
);
const LOCATION_ICON_STROKE = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>
);
const HISTORY_ICON_FILLED = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6a7 7 0 117 7 6.97 6.97 0 01-4.95-2.05l-1.41 1.41A8.96 8.96 0 0013 21a9 9 0 000-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
  </svg>
);
const HISTORY_ICON_STROKE = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v5l3.5 2"/>
  </svg>
);
const SEARCH_ICON_FILLED = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
);
const SEARCH_ICON_STROKE = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="10" cy="10" r="6"/>
    <path d="M14.5 14.5L20 20"/>
  </svg>
);

const TABS_TECHNICIAN = [
  { key: 'home',      label: 'Home',      path: '/tech',           filled: HOME_ICON_FILLED,     stroke: HOME_ICON_STROKE },
  { key: 'locations', label: 'Locations', path: '/tech/locations', filled: LOCATION_ICON_FILLED, stroke: LOCATION_ICON_STROKE },
  { key: 'history',   label: 'History',   path: '/tech/history',   filled: HISTORY_ICON_FILLED,  stroke: HISTORY_ICON_STROKE },
  { key: 'search',    label: 'Search',    path: '/tech/search',    filled: SEARCH_ICON_FILLED,   stroke: SEARCH_ICON_STROKE },
];

export default function TabBar({ activeTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const userCtx = useUserContext() || {};
  const { persona, visibleSystems = [] } = userCtx;
  const isTenant = persona?.tabMode === 'tenant';
  const isTechnician = persona?.tabMode === 'technician';

  // For single-system tenants, Home tab points directly to their system
  const tenantTabs = isTenant && visibleSystems.length === 1
    ? [
        { key: 'home', label: 'Home', path: `/system/${visibleSystems[0].id}`, filled: HOME_ICON_FILLED, stroke: HOME_ICON_STROKE },
        { key: 'events', label: 'Alerts', path: '/alerts', filled: EVENTS_ICON_FILLED, stroke: EVENTS_ICON_STROKE },
        { key: 'account', label: 'More', path: '/account', filled: MORE_ICON_FILLED, stroke: MORE_ICON_STROKE },
      ]
    : TABS_TENANT;

  const tabs = isTechnician ? TABS_TECHNICIAN : isTenant ? tenantTabs : TABS_FULL;

  return (
    <div
      style={{
        background: theme.tabBarBg,
        borderTop: theme.tabBarBorder,
        ...(theme.glass ? { backdropFilter: theme.glassBlur, WebkitBackdropFilter: theme.glassBlur } : {}),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 0 14px',
        flexShrink: 0,
      }}
    >
      {tabs.map(tab => {
        const isActive = activeTab ? activeTab === tab.key : location.pathname === tab.path;
        return (
          <button
            key={tab.key}
            onClick={() => {
              // Bottom-tab tap NEVER mutates scope. Scope is owned by the
              // drawer (set by drill-down) and the breadcrumb (cleared via
              // 'My Systems' tap). Home and Alerts share one scope and must
              // stay in sync as the user navigates between them.
              //
              // Earlier (2026-06-08) we cleared scope here to avoid carry-over
              // from System Detail; that was the wrong fix - it broke the
              // Alerts-pick-location → Home → Alerts flow (scope wiped on the
              // Home tap, then wiped again on the Alerts tap). 2026-06-15.
              navigate(tab.path);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              cursor: 'pointer',
              padding: '0 6px',
              border: 'none',
              background: 'none',
              fontFamily: 'inherit',
              color: isActive ? theme.accent : theme.tabInactive,
            }}
          >
            {isActive ? tab.filled : tab.stroke}
            <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
