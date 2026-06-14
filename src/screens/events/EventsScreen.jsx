import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TabBar from '../../components/TabBar';
import PipesHeader, { GLOW_PAGE_BG } from '../../components/PipesHeader';
import EventRow from '../../components/EventRow';
import NavigationDrawer from '../../components/NavigationDrawer';
import { CURRENT_EVENTS, HISTORY_EVENTS, computeActiveEvents, computeIgnoredEvents, computeConfigurationGaps, computePusherResolvedEvents } from '../../data/events';
import { getAncestorScopes } from '../../utils/ancestorScopes';
import { getAccountById } from '../../data/accounts';
import { useUserContext } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { useDataRefresh } from '../../utils/useDataRefresh';

const ALERT_TABS = ['active', 'history'];

function SwipeableAlertTabs({ children, activeTab, onSwipe }) {
  const startRef = useRef(null);
  const idx = ALERT_TABS.indexOf(activeTab);
  return (
    <div
      onTouchStart={(e) => { startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
      onTouchEnd={(e) => {
        if (!startRef.current) return;
        const dx = e.changedTouches[0].clientX - startRef.current.x;
        const dy = e.changedTouches[0].clientY - startRef.current.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx < 0 && idx < ALERT_TABS.length - 1) onSwipe(ALERT_TABS[idx + 1]);
          if (dx > 0 && idx > 0) onSwipe(ALERT_TABS[idx - 1]);
        }
        startRef.current = null;
      }}
      style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}
    >
      <div style={{
        display: 'flex', width: `${ALERT_TABS.length * 100}%`,
        transform: `translateX(-${idx * (100 / ALERT_TABS.length)}%)`,
        transition: 'transform 0.25s ease', height: '100%',
      }}>
        {children.map((child, i) => (
          <div key={i} style={{ width: `${100 / ALERT_TABS.length}%`, height: '100%', overflowY: 'auto', flexShrink: 0 }}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

function MIcon({ name, size = 18, color, fill, style = {} }) {
  return <span className="material-symbols-outlined" style={{ fontSize: size, color, fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0", ...style }}>{name}</span>;
}

export default function EventsScreen() {
  useDataRefresh();
  const { theme } = useTheme();
  const { visibleSystems = [] } = useUserContext() || {};
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');
  const scopeParam = searchParams.get('scope');
  const [activeTab, setActiveTab] = useState('active');
  // Search removed 2026-06-03 — Alerts is meant to be a focused inbox, not a
  // searchable index. Use Home → drilldown for finding a specific system.

  // Filter pills — multi-select toggles (locked 2026-06-04):
  //   • Tap a category pill → adds it to the active set (turns ON).
  //   • Tap again            → removes it (turns OFF).
  //   • All categories OFF   → "All" is implicitly active, show everything.
  //   • Tap "All"            → clears the set (back to show-everything).
  //
  // URL ?filter=<x> param still arrives from Home / Status Overview / push
  // deep-links. Now returns an ARRAY of pill keys so 'needs-attention' can
  // pre-select multiple pills (everything-but-water — locked 2026-06-04).
  function pillsForUrlFilter(raw) {
    if (!raw) return [];
    if (raw === 'high' || raw === 'low' || raw === 'leak' || raw === 'water') return ['water'];
    if (raw === 'valve' || raw === 'valve-error') return ['valve'];
    if (raw === 'power' || raw === 'power-lost') return ['power'];
    if (raw === 'conn' || raw === 'offline' || raw === 'comm') return ['conn'];
    // Systems Health → "everything that needs attention except water events"
    // (water has its own card on Home, so the Systems Health tap is meant to
    // surface device/protection-level errors). Multi-select: Valve + Power +
    // Comm pre-applied.
    if (raw === 'needs-attention') return ['valve', 'power', 'conn'];
    return [];
  }
  const initialPills = pillsForUrlFilter(filterParam);
  const [activeFilters, setActiveFilters] = useState(() => new Set(initialPills));
  // Water sub-filter — only meaningful when 'water' is in activeFilters.
  // Values: 'all' (both high + low) | 'high' (leak-high only) | 'low' (leak-low only).
  // Pre-set from URL when the deep-link is specifically 'high' or 'low'.
  const initialWaterSub = filterParam === 'high' ? 'high'
                       : filterParam === 'low'  ? 'low'  : 'all';
  const [waterSub, setWaterSub] = useState(initialWaterSub);
  // Re-sync when the URL filter param changes — covers the case where the user
  // is already on /alerts and a Home pill deep-links to a different filter.
  useEffect(() => {
    setActiveFilters(new Set(pillsForUrlFilter(filterParam)));
    setWaterSub(filterParam === 'high' ? 'high' : filterParam === 'low' ? 'low' : 'all');
  }, [filterParam]);
  function clearFilters() { setActiveFilters(new Set()); setWaterSub('all'); }
  function toggleFilter(key) {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        // Removing 'water' resets the sub-filter so the next toggle starts fresh.
        if (key === 'water') setWaterSub('all');
      } else {
        next.add(key);
      }
      return next;
    });
  }
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { exploring, selectedScope, setSelectedScope, clearSelectedScope } = useUserContext() || {};

  const scopeIds = useMemo(() => {
    if (!scopeParam) return null;
    return new Set(scopeParam.split(','));
  }, [scopeParam]);

  const visibleIds = useMemo(() => new Set(visibleSystems.map(s => s.id)), [visibleSystems]);

  // Drawer-selected scope. When the user picks a location from the navigation
  // drawer (e.g. "Henrietta House") the scoped systems should narrow the
  // events list — not just the page title. Earlier the title was driven from
  // selectedScope but the list was not, which produced the data inconsistency
  // where the header said "Henrietta House · 2 alerts" while the list showed
  // every alert across every visible system. Locked: same scope drives both.
  const selectedScopeIds = useMemo(() => {
    const ids = selectedScope?.systemIds;
    if (!ids || ids.length === 0) return null;
    return new Set(ids);
  }, [selectedScope]);

  function applyFilters(events) {
    let list = events;
    if (visibleIds.size > 0) list = list.filter(e => visibleIds.has(e.system));
    if (scopeIds) list = list.filter(e => scopeIds.has(e.system));
    if (selectedScopeIds) list = list.filter(e => selectedScopeIds.has(e.system));
    // Type filters — Variant A category set, multi-select. Empty set = All.
    // Water can additionally narrow to high-only / low-only via waterSub.
    if (activeFilters.size > 0) {
      list = list.filter(e => {
        if (activeFilters.has('water')) {
          if (waterSub === 'high' && e.type === 'leak-high') return true;
          if (waterSub === 'low'  && e.type === 'leak-low')  return true;
          if (waterSub === 'all'  && (e.type === 'leak-high' || e.type === 'leak-low')) return true;
        }
        if (activeFilters.has('valve') && e.type === 'valve-error') return true;
        if (activeFilters.has('power') && e.type === 'power-lost') return true;
        if (activeFilters.has('conn')  && (e.type === 'comm' || e.type === 'offline')) return true;
        return false;
      });
    }
    return list;
  }

  // Active events derived live from systems + incidents (single source of truth).
  // Config gaps (systems with no recipients) are folded in as pseudo-events so the
  // Alerts feed is the single "needs attention" surface.
  // Sort: real events first (newest → oldest by timestamp), config gaps last (no timestamp).
  // Unfiltered totals — these feed fleet-level counters (sub-line "X need
  // attention" + Active tab badge). They MUST stay independent of the filter
  // pills, the way an Inbox unread-count never shrinks when you apply a label
  // filter. The filter visibly shrinks the LIST, not the headline counter.
  const allActiveEvents = [...computeActiveEvents(), ...computeConfigurationGaps()];
  const allHistoryEvents = [
    ...computeIgnoredEvents(),
    ...computePusherResolvedEvents(),
    ...CURRENT_EVENTS.filter(e => e.resolved),
    ...HISTORY_EVENTS,
  ];
  // Count UNIQUE SYSTEMS that need attention (not events). The sub-line reads
  // SYSTEM-deduplicated count - feeds the header sub-line "X need attention".
  // "200 systems · 8 need attention" - that's 8 of 200 SYSTEMS, not 8 events.
  // A single system with 2 simultaneous alerts (e.g. Water + Valve) counts once.
  const totalActiveCount = new Set(
    allActiveEvents.map(e => e.system || e.systemId).filter(Boolean)
  ).size;
  // ALERT-ROW count - feeds the Active tab badge + "Showing X of Y" line.
  // Each incident is a separate row in the list (a system with valve-error +
  // offline produces 2 rows), so the badge must reflect rows, not systems.
  // Fixed 2026-06-09: previously the badge also used totalActiveCount which
  // de-duped systems and didn't match the visible list count.
  const totalActiveAlertsCount = allActiveEvents.length;

  // Filtered lists — feed the list rendering only.
  const activeEvents = applyFilters(allActiveEvents)
    .slice()
    .sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : -Infinity;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : -Infinity;
      return tb - ta;
    });
  const historyEvents = applyFilters(allHistoryEvents);

  const historyGroups = useMemo(() => {
    const seen = new Map();
    const groups = [];
    historyEvents.forEach(e => {
      if (!seen.has(e.dateGroup)) { seen.set(e.dateGroup, []); groups.push({ label: e.dateGroup, events: seen.get(e.dateGroup) }); }
      seen.get(e.dateGroup).push(e);
    });
    return groups;
  }, [historyEvents]);

  const isEmpty = activeTab === 'active' ? activeEvents.length === 0 : historyGroups.length === 0;

  // Variant A category pills (PRD 11). Same set + same palette as the Event
  // Timeline (Activity tab) so the user sees one filter rail across the app.
  // "All" pill removed 2026-06-06 - empty selection IS "show all"; explicit
  // reset lives in a "N selected · Clear x" strip above the row only when
  // filters are active. Mirrors the Timeline tab anatomy on the System page.
  const FILTERS = [
    { key: 'water', label: 'Water',  color: '#DB4670' },
    { key: 'valve', label: 'Valve',  color: '#036AB5' },
    { key: 'power', label: 'Power',  color: '#B5651A' },
    { key: 'conn',  label: 'Comms',  color: '#717684' },
  ];

  // ── Header data — mirrors the Home screen so both top bars look identical ──
  // The scoped system list (after applying drawer/scope selection), the parent
  // account, the page title, and the "N locations · Total X systems" subtitle.
  const scopedSystems = selectedScope?.systems || visibleSystems;
  const account = useMemo(() => {
    const accId = scopedSystems[0]?.account;
    if (!accId) return null;
    const a = getAccountById(accId);
    return a?.parentId ? getAccountById(a.parentId) : a;
  }, [scopedSystems]);
  const pageTitle = selectedScope?.name || account?.name || 'My Systems';
  const { locationsBelow, hasNextLevel } = useMemo(() => {
    if (!scopedSystems.length) return { locationsBelow: 0, hasNextLevel: false };
    const levels = ['l1', 'l2', 'l3', 'l4'];
    const scopeLevel = selectedScope?.ancestors?.length ?? 0;
    if (scopeLevel >= levels.length) return { locationsBelow: 0, hasNextLevel: false };
    const nextKey = levels[scopeLevel];
    const distinct = new Set(scopedSystems.map(s => s[nextKey]).filter(Boolean));
    return { locationsBelow: distinct.size, hasNextLevel: true };
  }, [scopedSystems, selectedScope]);
  const totalSystems = scopedSystems.length;

  // Slide-in animation when arriving from a Home deep-link. iOS-style page
  // push: full-width translate, ~400 ms, smooth easing. No opacity fade —
  // pure slide reads as motion, fade reads as flicker. Plays once on mount;
  // subsequent in-screen tab/filter changes don't replay.
  const cameFromDrillDown = !!filterParam;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: GLOW_PAGE_BG,
      animation: cameFromDrillDown ? 'alerts-slide-in 0.42s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
      willChange: cameFromDrillDown ? 'transform' : 'auto',
    }}>
      <style>{`
        @keyframes alerts-slide-in {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>

      {/* Header — same rich pattern as Home for visual consistency.
          Left: 38 px circular badge with home_work icon.
          Center: breadcrumb (My Systems > ...) + account/scope title + chevron + subtitle. */}
      <PipesHeader glow={true}>
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div onClick={() => setDrawerOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}
            role="button" aria-label="Switch location"
            title="Switch location">
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(11,149,248,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid rgba(11,149,248,0.20)',
            }}>
              <MIcon name="home_work" size={22} color="#036AB5" fill />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Compact two-crumb breadcrumb (locked 2026-06-13). Same
                  pattern as Home + System Detail headers. */}
              {selectedScope && (() => {
                const sample = (selectedScope.systems?.[0]) || scopedSystems[0];
                const all = sample ? getAncestorScopes(sample) : [];
                const ancestors = all.slice(0, selectedScope.ancestors.length);
                const immediateParent = ancestors.length > 0 ? ancestors[ancestors.length - 1] : null;
                const crumbStyle = { color: '#036AB5', textDecoration: 'underline', cursor: 'pointer' };
                return (
                  <div style={{
                    fontSize: 12, color: '#4A4F5A', lineHeight: 1.4, marginBottom: 2,
                    display: 'flex', alignItems: 'center', gap: 8,
                    minWidth: 0,
                  }}>
                    <span
                      onClick={(e) => { e.stopPropagation(); clearSelectedScope?.(); }}
                      style={{ ...crumbStyle, display: 'inline-flex', alignItems: 'center', gap: 2, flexShrink: 0 }}
                      title="Back to all systems"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#036AB5' }}>chevron_left</span>
                      My Systems
                    </span>
                    {immediateParent && (
                      <>
                        <span style={{ color: '#B8BCC4', flexShrink: 0 }}>·</span>
                        <span
                          onClick={(e) => { e.stopPropagation(); setSelectedScope?.(immediateParent); }}
                          style={{ ...crumbStyle, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          title={immediateParent.name}
                        >{immediateParent.name}</span>
                      </>
                    )}
                  </div>
                );
              })()}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <MIcon name="notifications_active" size={18} color="#DB4670" fill style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: '#14151A', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Alerts
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#4A4F5A' }}>
                {totalSystems.toLocaleString()} system{totalSystems !== 1 ? 's' : ''}
                <span style={{ margin: '0 6px', opacity: 0.6 }}>·</span>
                {totalActiveCount === 0
                  ? 'All clear'
                  : `${totalActiveCount} need${totalActiveCount === 1 ? 's' : ''} attention`}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - brand-blue active on light bg. No count badges on either
            tab (PRD 05 lock 2026-06-13). The only count surface on this page
            is the header sub-line ({N} systems . {M} need attention). */}
        <div style={{ display: 'flex' }}>
          {[
            { key: 'active', label: 'Active' },
            { key: 'history', label: 'History' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flex: 1, padding: '9px 0', border: 'none', background: 'none',
              fontFamily: 'inherit', cursor: 'pointer', fontSize: 15, fontWeight: activeTab === tab.key ? 700 : 600,
              color: activeTab === tab.key ? '#0B95F8' : '#717684',
              borderBottom: activeTab === tab.key ? '2px solid #0B95F8' : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      </PipesHeader>

      {/* Filter pills — 5 equal-width pills, fit on one row (no horizontal
          scroll). Same set as the Event Timeline so the filter rail reads as
          one component across the app. Selected pill is always highlighted —
          if the URL filter param maps to one of these pills, it lands here
          pre-selected (pillForUrlFilter handles legacy filter values too). */}
      {/* Multi-select filter rail. Selected pills carry a small checkmark.
          When any filter is active, a small "×" reset button appears INLINE
          at the end of the row - same height, pills don't shift down. */}
      <div style={{
        padding: '10px 14px', flexShrink: 0, display: 'flex', gap: 6,
        borderBottom: `1px solid ${theme.divider}`, alignItems: 'center',
      }}>
        {FILTERS.map(f => {
          const active = activeFilters.has(f.key);
          return (
            <button key={f.key} onClick={() => toggleFilter(f.key)} style={{
              flex: 1, minWidth: 0,
              padding: '6px 8px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600,
              fontFamily: 'inherit', cursor: 'pointer',
              background: active ? f.color + '22' : theme.inputBg,
              color: active ? f.color : theme.textTertiary,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              {active && <span className="material-symbols-outlined" style={{ fontSize: 14, color: f.color }}>check</span>}
              {f.label}
            </button>
          );
        })}
        {activeFilters.size > 0 && (
          <button onClick={clearFilters} title="Clear all filters" style={{
            width: 28, height: 28, flexShrink: 0,
            borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: theme.inputBg, color: theme.textTertiary,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, fontFamily: 'inherit',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
          </button>
        )}
      </div>

      {/* Water sub-tier — appears only when the Water main pill is active.
          Lets the user narrow to High Flow or Low Flow specifically. Variant A
          palette: High #DB4670, Low #F05C25. */}
      {activeFilters.has('water') && (
        <div style={{
          padding: '8px 14px', flexShrink: 0, display: 'flex', gap: 6,
          borderBottom: `1px solid ${theme.divider}`,
          background: 'rgba(219,70,112,0.04)',
        }}>
          {[
            { key: 'all',  label: 'All water', color: '#DB4670' },
            { key: 'high', label: 'High Flow', color: '#DB4670' },
            { key: 'low',  label: 'Low Flow',  color: '#F05C25' },
          ].map(s => {
            const active = waterSub === s.key;
            return (
              <button key={s.key} onClick={() => setWaterSub(s.key)} style={{
                flex: 1, minWidth: 0,
                padding: '4px 8px', borderRadius: 999, border: `1px solid ${active ? s.color : (theme.cardBorderColor || '#E5E8EE')}`,
                fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                background: active ? s.color : theme.card,
                color: active ? '#fff' : s.color,
                whiteSpace: 'nowrap',
              }}>{s.label}</button>
            );
          })}
        </div>
      )}

      {/* Swipeable list */}
      <SwipeableAlertTabs activeTab={activeTab} onSwipe={setActiveTab}>
        {/* Active */}
        <div style={{ padding: '10px 14px 12px' }}>
          {/* Filter-scope strip — only when filters are active. Tells the user
              the LIST below is a subset of the headline counter (which stays
              fleet-total). Hidden when no filters are on. */}
          {activeFilters.size > 0 && (
            <div style={{
              fontSize: 12, color: theme.textTertiary, fontWeight: 600,
              padding: '0 2px 8px', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <MIcon name="filter_alt" size={14} color={theme.textTertiary} />
              Showing {activeEvents.length} of {totalActiveAlertsCount} (filtered)
            </div>
          )}
          {activeEvents.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 60 }}>
              <MIcon name="check_circle" size={40} color={theme.green} fill />
              <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginTop: 10 }}>
                {activeFilters.size > 0 && totalActiveAlertsCount > 0 ? 'No matches for this filter' : 'No active alerts'}
              </div>
              <div style={{ fontSize: 15, color: theme.textTertiary, marginTop: 4 }}>
                {activeFilters.size > 0 && totalActiveAlertsCount > 0 ? 'Clear filters to see all attention items' : 'All systems operating normally'}
              </div>
            </div>
          ) : activeEvents.map(ev => <EventRow key={ev.id} event={ev} />)}
        </div>

        {/* History */}
        <div style={{ padding: '10px 14px 12px' }}>
          {activeFilters.size > 0 && historyEvents.length > 0 && (
            <div style={{
              fontSize: 12, color: theme.textTertiary, fontWeight: 600,
              padding: '0 2px 8px', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <MIcon name="filter_alt" size={14} color={theme.textTertiary} />
              Showing {historyEvents.length} of {allHistoryEvents.length} (filtered)
            </div>
          )}
          {historyGroups.length === 0
            ? <div style={{ textAlign: 'center', color: theme.textTertiary, fontSize: 15, marginTop: 40 }}>No history</div>
            : historyGroups.map(({ label, events }) => (
                <div key={label}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: theme.textTertiary, textTransform: 'uppercase', letterSpacing: '.5px', padding: '12px 0 8px' }}>
                    {label}
                  </div>
                  {events.map(ev => <EventRow key={ev.id} event={ev} />)}
                </div>
              ))
          }
        </div>
      </SwipeableAlertTabs>

      <TabBar activeTab="events" />

      <NavigationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
