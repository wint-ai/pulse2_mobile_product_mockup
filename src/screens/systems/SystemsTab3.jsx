// SystemsTab3 — Side drawer + swipeable Dashboard|Systems tabs + 4 skins

import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TabBar from '../../components/TabBar';
import StatusWidgetsMobile from '../../components/StatusWidgetsMobile';
import { useUserContext } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import PipesHeader from '../../components/PipesHeader';
import { SystemsOnboarding } from '../../components/Onboarding';
import { getAccountById, getChildAccounts } from '../../data/accounts';
import { getHierarchyForAccount } from '../../data/hierarchy';

// ─── Helpers ────────────────────────────────────────────────────────────────

function MIcon({ name, size = 18, fill = false, color, style = {} }) {
  return (
    <span className="material-symbols-outlined"
      style={{ fontSize: size, fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0", color, lineHeight: 1, ...style }}
    >{name}</span>
  );
}

function collectSystemIds(node) {
  if (node.type === 'system') return [node.id];
  if (!node.children) return [];
  return node.children.flatMap(c => collectSystemIds(c));
}

function getAccountTiles(systems) {
  const map = {};
  systems.forEach(s => {
    const acc = getAccountById(s.account);
    const rootId = acc?.parentId || s.account;
    const rootAcc = getAccountById(rootId) || acc;
    if (!map[rootId]) map[rootId] = { id: rootId, name: rootAcc?.name || rootId, levelType: 'Account', systems: [], children: null };
    map[rootId].systems.push(s);
  });
  Object.keys(map).forEach(rootId => {
    const childAccounts = getChildAccounts(rootId);
    if (childAccounts.length > 0) {
      map[rootId].children = childAccounts.map(ca => ({
        id: ca.id, name: ca.name, type: 'sub-account', levelType: 'Sub-account',
        systems: map[rootId].systems.filter(s => s.account === ca.id),
        children: getHierarchyForAccount(ca.id),
      }));
    } else {
      map[rootId].children = getHierarchyForAccount(rootId);
    }
  });
  return Object.values(map).sort((a, b) => b.systems.length - a.systems.length);
}

function getHierarchyTiles(children, allSystems) {
  if (!children || children.length === 0) return [];
  const allSystemMap = {};
  allSystems.forEach(s => { allSystemMap[s.id] = s; });
  return children.map(child => {
    const sysIds = collectSystemIds(child);
    const systems = sysIds.map(id => allSystemMap[id]).filter(Boolean);
    return { id: child.id, name: child.name, levelType: child.levelType || null, systems, children: child.children || [] };
  }).filter(t => t.systems.length > 0);
}

// Auto-prune: skip hierarchy levels the user doesn't need.
// Multiple accounts → show accounts as root (user needs to pick one first).
// Single account → skip down to building level.
function pruneRootTiles(accountTiles, visibleSystems) {
  const visibleIds = new Set(visibleSystems.map(s => s.id));
  const sysMap = {};
  visibleSystems.forEach(s => { sysMap[s.id] = s; });

  // Recursively find all leaf nodes (nodes whose children are systems)
  function collectLeaves(node) {
    if (!node.children || node.children.length === 0) return [];
    if (node.children.some(c => c.type === 'system')) {
      const visibleHere = node.children.filter(c => c.type === 'system' && visibleIds.has(c.id));
      if (visibleHere.length === 0) return [];
      return [{
        id: node.id, name: node.name, levelType: node.levelType || null,
        systems: visibleHere.map(c => sysMap[c.id]).filter(Boolean),
        children: node.children,
      }];
    }
    return node.children.filter(c => c.type !== 'system').flatMap(c => collectLeaves(c));
  }

  // Multiple accounts → keep account tiles as root, don't prune
  if (accountTiles.length > 1) {
    return {
      prunedTiles: accountTiles.map(a => ({ id: a.id, name: a.name, levelType: a.levelType, systems: a.systems, children: a.children })),
      prunedPath: [],
    };
  }

  // Single account → prune to building level
  const acc = accountTiles[0];
  if (!acc) return { prunedTiles: [], prunedPath: [] };

  const leaves = (acc.children || []).flatMap(c => collectLeaves(c));

  if (leaves.length === 0) {
    return { prunedTiles: [{ id: acc.id, name: acc.name, levelType: acc.levelType, systems: acc.systems, children: acc.children }], prunedPath: [] };
  }

  return { prunedTiles: leaves, prunedPath: [{ name: acc.name, systems: visibleSystems, children: null }] };
}


// ─── Tile card ──────────────────────────────────────────────────────────────

function TileRow({ name, levelType, subtitle, count, subLocationCount, leakCount, alertCount, onDrill, onView, onToggle, expanded, selected, hasChildren, s }) {
  return (
    <div style={{
      background: selected ? (s.drawerAccent || s.accent) + '18' : (s.drawerCard || s.card),
      borderRadius: 8,
      border: selected ? `1.5px solid ${(s.drawerAccent || s.accent)}40` : (s.drawerCardBorder || s.cardBorder),
      marginBottom: 5,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '9px 10px',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center',
      }}>
        {/* Collapse/expand chevron */}
        {hasChildren && (
          <span onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, marginRight: 6, flexShrink: 0, cursor: 'pointer',
            borderRadius: 4, transition: 'background 0.15s',
          }}>
            <MIcon name={expanded ? 'expand_more' : 'chevron_right'} size={18} color={s.drawerTextSub || s.textTertiary} />
          </span>
        )}
        <div onClick={onView} style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: selected ? (s.drawerAccent || s.accent) : (s.drawerText || s.text), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          {subtitle && <div style={{ fontSize: 12, color: s.drawerTextSub || s.textTertiary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{subtitle}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            {levelType && <span style={{ fontSize: 10, fontWeight: 600, color: s.drawerAccent || s.accent, padding: '1px 5px', borderRadius: 3, background: (s.drawerAccent || s.accent) + '15', opacity: 0.8 }}>{levelType}</span>}
            <span style={{ fontSize: 12, color: s.drawerTextSub || s.textTertiary }}>
              {count} sys{subLocationCount > 0 ? ` · ${subLocationCount} loc` : ''}
            </span>
            {leakCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2, color: s.red }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: s.red }} />{leakCount}</span>}
            {alertCount > 0 && <span style={{ fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2, color: s.orange }}><MIcon name="warning" size={10} color={s.orange} />{alertCount}</span>}
          </div>
        </div>
        <span onClick={(e) => { e.stopPropagation(); onView(); }} style={{
          fontSize: 12, fontWeight: 700, color: s.drawerAccent || s.accent, flexShrink: 0, marginLeft: 6,
          padding: '3px 8px', borderRadius: 5, background: selected ? (s.drawerAccent || s.accent) + '10' : (s.accentBg || 'transparent'),
          cursor: 'pointer',
        }}>View</span>
      </div>
    </div>
  );
}

// Recursive collapsible tree node for drawer
function CollapsibleTile({ tile, depth, expandedIds, toggleExpanded, selectedTileId, onView, onSystemClick, allSystems, s }) {
  const isExpanded = expandedIds.has(tile.id);
  const isSelected = selectedTileId === tile.id;
  const leakCount = tile.systems.filter(sys => sys.alert?.type?.includes('leak')).length;
  const alertCount = tile.systems.filter(sys => sys.alert && !sys.alert.type?.includes('leak')).length;
  const childLocations = tile.children ? tile.children.filter(c => c.type !== 'system') : [];
  const hasChildren = childLocations.length > 0;
  const isLeaf = !hasChildren; // leaf = has systems but no sub-locations

  // Build child tiles
  const childTiles = hasChildren ? getHierarchyTiles(childLocations, allSystems) : [];

  return (
    <>
      <div style={{ paddingLeft: depth * 12 }}>
        <TileRow
          name={tile.name}
          levelType={tile.levelType}
          count={tile.systems.length}
          subLocationCount={childLocations.length}
          leakCount={leakCount}
          alertCount={alertCount}
          hasChildren={hasChildren || (isLeaf && tile.systems.length > 0)}
          expanded={isExpanded}
          selected={isSelected}
          onToggle={() => toggleExpanded(tile.id)}
          onView={() => onView(tile)}
          s={s}
        />
      </div>
      {isExpanded && (
        <>
          {/* Sub-location tiles */}
          {childTiles.map(child => (
            <CollapsibleTile
              key={child.id}
              tile={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              toggleExpanded={toggleExpanded}
              selectedTileId={selectedTileId}
              onView={onView}
              onSystemClick={onSystemClick}
              allSystems={allSystems}
              s={s}
            />
          ))}
          {/* Leaf systems — shown when no more sub-locations */}
          {isLeaf && tile.systems.map(sys => (
            <div key={sys.id} onClick={() => onSystemClick(sys.id)}
              style={{
                paddingLeft: (depth + 1) * 12,
                marginBottom: 2,
              }}>
              <div style={{
                display: 'flex', alignItems: 'center', padding: '6px 10px', cursor: 'pointer',
                borderRadius: 6, background: 'transparent',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', marginRight: 8, flexShrink: 0, background: sys.comm === 'online' ? s.green : s.red }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: s.drawerText || s.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sys.name}</div>
                  {sys.alert && <div style={{ fontSize: 11, color: s.red, fontWeight: 600, marginTop: 1 }}>{sys.alert.label}</div>}
                </div>
                {sys.valve && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: (sys.valve === 'open' ? s.green : sys.valve === 'error' ? s.red : '#717684') + '18', color: sys.valve === 'open' ? s.green : sys.valve === 'error' ? s.red : '#717684' }}>
                    {sys.valve === 'open' ? 'Open' : sys.valve === 'closed' ? 'Closed' : 'Error'}
                  </span>
                )}
                <span style={{ fontSize: 13, color: s.drawerTextDim || s.textDimmest, marginLeft: 6 }}>›</span>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}

// ─── Swipeable panel ────────────────────────────────────────────────────────

function SwipePanel({ children, activeIndex, onSwipe }) {
  const startRef = useRef(null);
  const onTouchStart = (e) => { startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e) => {
    if (!startRef.current) return;
    const dx = e.changedTouches[0].clientX - startRef.current.x;
    const dy = e.changedTouches[0].clientY - startRef.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0 && activeIndex < children.length - 1) onSwipe(activeIndex + 1);
      if (dx > 0 && activeIndex > 0) onSwipe(activeIndex - 1);
    }
    startRef.current = null;
  };
  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0 }}>
      <div style={{
        display: 'flex', width: `${children.length * 100}%`,
        transform: `translateX(-${activeIndex * (100 / children.length)}%)`,
        transition: 'transform 0.25s ease', height: '100%',
      }}>
        {children.map((child, i) => (
          <div key={i} style={{ width: `${100 / children.length}%`, height: '100%', overflowY: 'auto', flexShrink: 0 }}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── Protection compact (no gauge, for Systems Overview tab) ────────────────

function WintDropSmall({ color, size = 20 }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 32 39" fill="none" style={{ flexShrink: 0 }}>
      <path fillRule="evenodd" clipRule="evenodd"
        d="M30.2 30.5C29.1 34.6 25.2 37.5 20.5 37.5C15.8 37.5 11.9 34.6 10.8 30.5C10.1 27.8 11.2 24.7 14.1 21.5L20.5 14L26.9 21.5C29.8 24.7 30.9 27.8 30.2 30.5Z"
        transform="translate(-5, -10)" fill={color} />
    </svg>
  );
}

function ProtectionCompact({ systems, theme, navigate }) {
  const [expanded, setExpanded] = useState(false);
  const dk = theme.mode === 'dark' || theme.mode === 'ocean' || theme.mode === 'gradient' || theme.mode === 'midnight';
  const NOW = Date.now();
  const H24 = 24 * 3600000;

  const nonComm = systems.filter(sys => {
    if (!sys.lastSeen) return sys.offline || sys.comm === 'offline';
    return (NOW - new Date(sys.lastSeen).getTime()) > H24;
  });
  const seen = new Set(nonComm.map(sys => sys.id));
  const valveErr = systems.filter(sys => sys.valve === 'error' && !seen.has(sys.id));
  valveErr.forEach(sys => seen.add(sys.id));
  const powerLost = systems.filter(sys => sys.power === 'ac-lost' && !seen.has(sys.id));
  powerLost.forEach(sys => seen.add(sys.id));
  const noRecip = systems.filter(sys => (sys.notificationRecipients || 0) === 0 && !seen.has(sys.id));
  noRecip.forEach(sys => seen.add(sys.id));

  const protectedCount = systems.length - seen.size;
  const allGood = seen.size === 0;

  const gaps = [
    { key: 'protection-nocomm', label: 'Non-Communicating', count: nonComm.length, color: '#E5A100', ids: nonComm.map(sys => sys.id) },
    { key: 'protection-valve-error', label: 'Valve Error', count: valveErr.length, color: '#E5A100', ids: valveErr.map(sys => sys.id) },
    { key: 'protection-power-lost', label: 'Ext. Power Loss', count: powerLost.length, color: '#E5A100', ids: powerLost.map(sys => sys.id) },
    { key: 'protection-no-recipients', label: 'No Alert Contacts', count: noRecip.length, color: '#E5A100', ids: noRecip.map(sys => sys.id) },
  ].filter(g => g.count > 0);

  const protectedPct = systems.length > 0 ? (allGood ? 100 : Math.min(99, Math.floor((protectedCount / systems.length) * 100))) : 100;
  const tintColor = allGood ? '161,210,70' : '4,173,239';
  const tintAmt = allGood ? 0.05 : 0.04;

  return (
    <div style={{
      background: dk ? `rgba(${tintColor},${tintAmt})` : `rgba(${tintColor},${tintAmt * 0.5})`,
      borderRadius: 12, marginBottom: 6, overflow: 'hidden',
      border: `1px solid rgba(${tintColor},${dk ? 0.1 : 0.08})`,
      boxShadow: dk ? '0 1px 6px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.05)',
    }}>
      {/* Header — tappable to fold/unfold */}
      <div onClick={() => setExpanded(v => !v)} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, marginRight: 10, flexShrink: 0,
          background: (allGood ? theme.green : theme.accent) + '14',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MIcon name="shield" size={15} color={allGood ? theme.green : theme.accent} fill />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>System Health</div>
          <div style={{ fontSize: 13, color: theme.textTertiary }}>{protectedCount} of {systems.length} protected</div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: allGood ? theme.green : theme.accent, letterSpacing: '-0.5px', marginRight: 6 }}>{protectedPct}%</div>
        <span className="material-symbols-outlined" style={{
          fontSize: 18, color: theme.textTertiary,
          transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.15s ease',
        }}>expand_more</span>
      </div>

      {/* All 4 items — shown when expanded */}
      {expanded && (() => {
        const allItems = [
          { key: 'protection-nocomm', label: 'Non-Communicating', count: nonComm.length, color: nonComm.length > 0 ? '#E5A100' : theme.green, ok: nonComm.length === 0, ids: nonComm.map(x => x.id) },
          { key: 'protection-valve-error', label: 'Valve Error', count: valveErr.length, color: valveErr.length > 0 ? '#E5A100' : theme.green, ok: valveErr.length === 0, ids: valveErr.map(x => x.id) },
          { key: 'protection-power-lost', label: 'Ext. Power Loss', count: powerLost.length, color: powerLost.length > 0 ? '#E5A100' : theme.green, ok: powerLost.length === 0, ids: powerLost.map(x => x.id) },
          { key: 'protection-no-recipients', label: 'No Alert Contacts', count: noRecip.length, color: noRecip.length > 0 ? '#E5A100' : theme.green, ok: noRecip.length === 0, ids: noRecip.map(x => x.id) },
        ];
        return (
          <div style={{ padding: '0 14px 10px' }}>
            {allItems.map(item => (
              <div key={item.key}
                onClick={item.count > 0 ? () => navigate(`/kpi/${item.key}?scope=${item.ids.join(',')}`) : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0',
                  cursor: item.count > 0 ? 'pointer' : 'default',
                  borderTop: `1px solid ${dk ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
                }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, color: theme.text }}>{item.label}</span>
                {item.ok
                  ? <MIcon name="check" size={16} color={theme.green} />
                  : <>
                      <span style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.count}</span>
                      <span style={{ fontSize: 14, color: theme.textDimmest }}>›</span>
                    </>
                }
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

// ─── Lazy group for system list ──────────────────────────────────────────────

function LazyGroup({ group, multiLocation, maxItems, s, navigate, valveLabel, valveColor }) {
  const [showCount, setShowCount] = useState(maxItems);
  const visible = group.systems.slice(0, showCount);
  const hasMore = group.systems.length > showCount;

  return (
    <div style={{ marginBottom: multiLocation ? 12 : 0 }}>
      {multiLocation && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: s.text }}>{group.label}</div>
          {group.sub && <div style={{ fontSize: 12, color: s.textTertiary }}>{group.sub}</div>}
          <div style={{ fontSize: 12, color: s.textMuted }}>· {group.systems.length}</div>
        </div>
      )}
      <div style={{ background: s.card, borderRadius: 10, border: s.cardBorder, overflow: 'hidden' }}>
        {visible.map((sys, i) => (
          <div key={sys.id} onClick={() => navigate(`/system/${sys.id}`)} style={{
            display: 'flex', alignItems: 'center', padding: '10px 12px', cursor: 'pointer',
            borderTop: i > 0 ? `1px solid ${s.divider}` : 'none',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', marginRight: 10, flexShrink: 0, background: sys.comm === 'online' ? s.green : s.red }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: s.text }}>{sys.name}</div>
              {sys.alert && <div style={{ fontSize: 13, color: s.red, fontWeight: 600, marginTop: 1 }}>{sys.alert.label}</div>}
              {!multiLocation && (
                <div style={{ fontSize: 13, color: s.textTertiary, marginTop: 1 }}>
                  {sys.l4Name || sys.l3Name}{sys.l3Name && sys.l4Name ? ` · ${sys.l3Name}` : ''}
                </div>
              )}
            </div>
            {sys.valve && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 6px', borderRadius: 5, marginRight: 6, background: valveColor(sys.valve) + '18', color: valveColor(sys.valve) }}>{valveLabel(sys.valve)}</span>
            )}
            <span style={{ fontSize: 14, color: s.textDimmest }}>›</span>
          </div>
        ))}
        {hasMore && (
          <div onClick={() => setShowCount(c => c + maxItems)} style={{
            padding: '10px 12px', textAlign: 'center', cursor: 'pointer',
            borderTop: `1px solid ${s.divider}`, fontSize: 14, fontWeight: 600, color: s.accent,
          }}>
            Show more ({group.systems.length - showCount} remaining)
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Persisted state (survives remounts from navigation) ────────────────────
let _persistedActiveTab = 0;

// ─── Main component ─────────────────────────────────────────────────────────

export default function SystemsTab3() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { visibleSystems = [], exploreSystems = [], exploring, toggleExplore } = useUserContext() || {};
  // Systems screen uses exploreSystems (all when exploring, scoped otherwise)
  const activeSystems = exploreSystems;

  const s = theme; // use global theme

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(() => {
    return sessionStorage.getItem('pulse2-drawer-hint') !== 'true';
  });
  const [showDrawerHint, setShowDrawerHint] = useState(() => {
    return sessionStorage.getItem('pulse2-drawer-usage-hint') !== 'true';
  });
  // Also support full onboarding from Tutorial button
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const done = sessionStorage.getItem('pulse2-onboarded') === 'true';
    const phase = sessionStorage.getItem('pulse2-onboard-phase');
    return !done && phase === 'systems';
  });
  const [activeTab, _setActiveTab] = useState(_persistedActiveTab);
  const setActiveTab = (v) => { _persistedActiveTab = v; _setActiveTab(v); };
  const [selectedTile, setSelectedTile] = useState(() => {
    // Restore location selection from system detail page navigation
    const saved = sessionStorage.getItem('pulse2-selected-location');
    if (saved) {
      sessionStorage.removeItem('pulse2-selected-location');
      try {
        const loc = JSON.parse(saved);
        const systems = activeSystems.filter(s => loc.systemIds.includes(s.id));
        if (systems.length > 0) return { id: loc.id, name: loc.name, systems, children: [] };
      } catch {}
    }
    return null;
  });
  const [drillPath, setDrillPath] = useState([]);
  const [slideDir, setSlideDir] = useState(null);
  const [slideKey, setSlideKey] = useState(0);
  const [search, setSearch] = useState('');
  const [systemsSearch, setSystemsSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => {
    // If a location is already selected, auto-expand it
    if (selectedTile) return new Set([selectedTile.id]);
    return new Set();
  });
  const toggleExpanded = (id) => setExpandedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Edge swipe for drawer
  const touchRef = useRef(null);
  const handleTouchStart = (e) => {
    const x = e.touches[0].clientX;
    if (!drawerOpen && x > 30) return;
    touchRef.current = { x, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0 && !drawerOpen) setDrawerOpen(true);
      if (dx < 0 && drawerOpen) setDrawerOpen(false);
    }
    touchRef.current = null;
  };

  const accountTiles = useMemo(() => getAccountTiles(activeSystems), [activeSystems]);

  // Auto-prune single-path levels from root
  const { prunedTiles: rootTiles, prunedPath: autoSkipped } = useMemo(
    () => pruneRootTiles(accountTiles, activeSystems),
    [accountTiles, activeSystems],
  );

  const currentEntry = drillPath.length > 0 ? drillPath[drillPath.length - 1] : null;
  const currentSystems = currentEntry ? currentEntry.systems : activeSystems;
  const currentChildren = currentEntry ? currentEntry.children : null;

  const { tiles, showSystems } = useMemo(() => {
    if (drillPath.length === 0) {
      // If pruning left us with leaf-level tiles (systems), show systems
      if (rootTiles.length === 0) return { tiles: null, showSystems: true };
      const allLeaf = rootTiles.every(t => !t.children || t.children.length === 0 || t.children.some(c => c.type === 'system'));
      if (allLeaf && rootTiles.length === 1) return { tiles: null, showSystems: true };
      return { tiles: rootTiles, showSystems: false };
    }
    if (!currentChildren || currentChildren.length === 0) return { tiles: null, showSystems: true };
    const hasSystemChildren = currentChildren.some(c => c.type === 'system');
    if (hasSystemChildren) return { tiles: null, showSystems: true };
    const tileset = getHierarchyTiles(currentChildren, activeSystems);
    if (tileset.length === 0) return { tiles: null, showSystems: true };
    return { tiles: tileset, showSystems: false };
  }, [drillPath, rootTiles, currentChildren, activeSystems]);

  const displaySystems = selectedTile ? selectedTile.systems : currentSystems;
  // Show the pruned context in the header
  const rootName = autoSkipped.length > 0 ? autoSkipped[0].name : 'All';
  const displayName = selectedTile ? selectedTile.name : (drillPath.length > 0 ? drillPath[drillPath.length - 1].name : rootName);
  const locCount = new Set(displaySystems.map(s => s.l4 || s.l3).filter(Boolean)).size;

  function dismissDrawerHint() {
    if (showDrawerHint) { setShowDrawerHint(false); sessionStorage.setItem('pulse2-drawer-usage-hint', 'true'); }
  }

  function handleTileDrill(tile) {
    setSlideDir('in');
    setSlideKey(k => k + 1);
    setSelectedTile(null);
    setDrillPath(prev => [...prev, { name: tile.name, systems: tile.systems, children: tile.children }]);
  }

  function handleTileView(tile) {
    setSelectedTile(tile);
    // Auto-expand the selected tile to show its systems
    setExpandedIds(prev => { const next = new Set(prev); next.add(tile.id); return next; });
  }

  function goToLevel(index) {
    setSlideDir('out');
    setSlideKey(k => k + 1);
    setSelectedTile(null);
    setDrillPath(prev => prev.slice(0, index));
  }

  const valveLabel = (v) => v === 'open' ? 'Open' : v === 'closed' ? 'Closed' : v === 'error' ? 'Error' : null;
  const valveColor = (v) => v === 'open' ? s.green : v === 'closed' ? '#717684' : v === 'error' ? s.red : '#717684';

  const searchFiltered = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return activeSystems.filter(sys =>
      sys.name.toLowerCase().includes(q) ||
      (sys.l4Name || '').toLowerCase().includes(q) ||
      (sys.l3Name || '').toLowerCase().includes(q)
    );
  }, [search, activeSystems]);

  const headerTextColor = s.headerText || s.text;
  const headerSubColor = s.headerTextSub || s.textTertiary;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: s.bg, position: 'relative', overflow: 'hidden' }}
    >
      <style>{`
        @keyframes slideIn3 { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeTooltip { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideOut3 { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <PipesHeader>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px' }}>
          <div style={{ position: 'relative', marginRight: 10 }}>
            <span data-onboard="onboard-menu" onClick={() => { setDrawerOpen(true); if (showTooltip) { setShowTooltip(false); sessionStorage.setItem('pulse2-drawer-hint', 'true'); } }} style={{ cursor: 'pointer', padding: 4, display: 'flex' }}>
              <MIcon name="menu" size={22} color="#fff" />
            </span>
            {/* One-time tooltip */}
            {showTooltip && !drawerOpen && !showOnboarding && (
              <div onClick={() => { setShowTooltip(false); sessionStorage.setItem('pulse2-drawer-hint', 'true'); }} style={{ position: 'absolute', top: 36, left: -2, zIndex: 20, animation: 'fadeTooltip 0.3s ease', cursor: 'pointer' }}>
                <svg width="14" height="7" style={{ display: 'block', marginLeft: 8 }}><polygon points="7,0 0,7 14,7" fill="#2B35AF" /></svg>
                <div style={{ background: 'linear-gradient(135deg, #12086F, #2B35AF)', borderRadius: 8, padding: '7px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', border: '1px solid rgba(67,97,238,0.3)', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Explore locations</span>
                </div>
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Path trail when drilled in */}
            {drillPath.length > 0 && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 1 }}>
                {[rootName, ...drillPath.slice(0, -1).map(s => s.name)].join(' › ')}
              </div>
            )}
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
              {exploring && <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: 4, marginRight: 4, fontSize: 11 }}>Exploring</span>}
              {displaySystems.length} system{displaySystems.length !== 1 ? 's' : ''} · {locCount} location{locCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Tab strip */}
        <div data-onboard="onboard-tabs" style={{ display: 'flex', padding: '0 14px' }}>
          {['Overview', `Systems (${displaySystems.length})`].map((label, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              flex: 1, padding: '8px 0', border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 15, fontWeight: activeTab === i ? 700 : 500,
              color: activeTab === i ? '#fff' : 'rgba(255,255,255,0.6)',
              borderBottom: activeTab === i ? '2px solid #fff' : '2px solid transparent',
              transition: 'all 0.15s ease',
            }}>{label}</button>
          ))}
        </div>
      </PipesHeader>

      {/* ═══ SWIPEABLE MAIN CONTENT ═══ */}
      <SwipePanel activeIndex={activeTab} onSwipe={setActiveTab}>
        {/* Tab 0: Overview */}
        <div style={{ padding: 14 }}>
          {/* Leaks/alerts only */}
          <StatusWidgetsMobile systems={displaySystems} scopeIds={displaySystems.map(s => s.id)} alertsOnly />
          {/* System Health — compact, same style as Home */}
          <ProtectionCompact systems={displaySystems} theme={s} navigate={navigate} />
          {/* Full status widgets (comm, valves, power) */}
          <div data-onboard="onboard-widgets">
            <StatusWidgetsMobile systems={displaySystems} scopeIds={displaySystems.map(s => s.id)} skipAlerts />
          </div>
        </div>

        {/* Tab 1: Systems list (grouped by location if multiple) */}
        <div style={{ padding: 14 }}>
          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', background: s.inputBg, borderRadius: 10, padding: '8px 10px', marginBottom: 10 }}>
            <MIcon name="search" size={16} color={s.textTertiary} style={{ marginRight: 6 }} />
            <input value={systemsSearch} onChange={e => setSystemsSearch(e.target.value)} placeholder="Search systems..."
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: s.text, fontFamily: 'inherit', outline: 'none' }} />
            {systemsSearch && <span onClick={() => setSystemsSearch('')} style={{ cursor: 'pointer', display: 'flex' }}><MIcon name="close" size={16} color={s.textTertiary} /></span>}
          </div>

          {(() => {
            // Search searches entire scope (not just current drill-down)
            const searchPool = systemsSearch.trim() ? activeSystems : displaySystems;
            const filtered = systemsSearch.trim()
              ? searchPool.filter(sys => {
                  const q = systemsSearch.toLowerCase();
                  return sys.name.toLowerCase().includes(q) || (sys.l4Name || '').toLowerCase().includes(q) || (sys.l3Name || '').toLowerCase().includes(q);
                })
              : displaySystems;
            return filtered.length === 0 ? (
            <div style={{ background: s.card, borderRadius: 10, border: s.cardBorder, padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, color: s.textMuted }}>{systemsSearch ? 'No systems found' : 'No systems in scope'}</div>
            </div>
          ) : (() => {
            // Group by L4 (building)
            const groups = {};
            filtered.forEach(sys => {
              const key = sys.l4 || sys.l3 || '_other';
              const label = sys.l4Name || sys.l3Name || 'Other';
              const sub = sys.l3Name && sys.l4Name ? sys.l3Name : '';
              if (!groups[key]) groups[key] = { label, sub, systems: [] };
              groups[key].systems.push(sys);
            });
            const entries = Object.values(groups);
            const multiLocation = entries.length > 1;

            // Lazy: limit systems per group
            const MAX_PER_GROUP = 20;
            return entries.map((group, gi) => (
              <LazyGroup key={gi} group={group} multiLocation={multiLocation} maxItems={MAX_PER_GROUP}
                s={s} navigate={navigate} valveLabel={valveLabel} valveColor={valveColor} />
            ));
          })();
          })()}
        </div>
      </SwipePanel>

      {/* ═══ SIDE DRAWER ═══ */}
      <div onClick={() => setDrawerOpen(false)} style={{
        position: 'absolute', inset: 0, zIndex: 10,
        background: 'rgba(0,0,0,0.45)',
        opacity: drawerOpen ? 1 : 0,
        pointerEvents: drawerOpen ? 'auto' : 'none',
        transition: 'opacity 0.25s ease',
      }} />

      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: '80%', maxWidth: 320,
        background: s.drawerBg,
        zIndex: 11,
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
        display: 'flex', flexDirection: 'column',
        boxShadow: drawerOpen ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
      }}>
        {/* Drawer header */}
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${s.drawerDivider || s.divider}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: s.drawerText || s.text }}>Navigate</div>
            <span onClick={() => setDrawerOpen(false)} style={{ cursor: 'pointer', padding: 4, display: 'flex' }}>
              <MIcon name="close" size={20} color={s.drawerTextSub || s.textTertiary} />
            </span>
          </div>

          {/* Breadcrumb */}
          <div data-onboard="onboard-breadcrumb" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, marginBottom: 8 }}>
            <span onClick={() => goToLevel(0)} style={{
              fontSize: 14, cursor: 'pointer',
              color: drillPath.length === 0 ? (s.drawerText || s.text) : (s.drawerAccent || s.accent),
              fontWeight: drillPath.length === 0 ? 600 : 500,
            }}>{rootName} ({activeSystems.length})</span>
            {drillPath.map((step, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 13, color: s.drawerTextDim || s.textDimmest }}>›</span>
                <span onClick={() => goToLevel(i + 1)} style={{
                  fontSize: 14, cursor: 'pointer',
                  color: i === drillPath.length - 1 ? (s.drawerText || s.text) : (s.drawerAccent || s.accent),
                  fontWeight: i === drillPath.length - 1 ? 600 : 500,
                }}>{step.name} ({step.systems.length})</span>
              </span>
            ))}
          </div>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', background: s.drawerInput || s.inputBg, borderRadius: 8, padding: '7px 10px' }}>
            <MIcon name="search" size={15} color={s.drawerTextSub || s.textTertiary} style={{ marginRight: 6 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: s.drawerText || s.text, fontFamily: 'inherit', outline: 'none' }} />
            {search && <span onClick={() => setSearch('')} style={{ cursor: 'pointer', display: 'flex' }}><MIcon name="close" size={14} color={s.drawerTextSub || s.textTertiary} /></span>}
          </div>
        </div>

        {/* Drawer content */}
        <div data-onboard="onboard-tiles" key={slideKey} style={{
          flex: 1, overflowY: 'auto', padding: '8px 10px',
          animation: slideDir === 'in' ? 'slideIn3 0.2s ease' : slideDir === 'out' ? 'slideOut3 0.2s ease' : 'none',
        }}>
          {/* First-time usage hint */}
          {showDrawerHint && !search && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', marginBottom: 8,
              background: (s.drawerAccent || s.accent) + '12', borderRadius: 8,
              border: `1px solid ${(s.drawerAccent || s.accent)}25`,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: s.drawerAccent || s.accent, marginTop: 1 }}>lightbulb</span>
              <div style={{ flex: 1, fontSize: 13, color: s.drawerTextSub || s.textTertiary, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700, color: s.drawerAccent || s.accent }}>Tap a tile</span> to see sub-locations.<br /><span style={{ fontWeight: 700, color: s.drawerAccent || s.accent }}>Tap "View"</span> to explore it.
              </div>
              <span onClick={dismissDrawerHint} style={{ fontSize: 14, color: s.drawerTextDim || s.textDimmest, cursor: 'pointer', padding: '0 2px' }}>✕</span>
            </div>
          )}
          {search.length > 0 ? (
            searchFiltered.length === 0 ? (
              <div style={{ textAlign: 'center', color: s.drawerTextSub || s.textTertiary, fontSize: 14, marginTop: 20 }}>No results</div>
            ) : searchFiltered.map(sys => (
              <div key={sys.id} onClick={() => { navigate(`/system/${sys.id}`); setDrawerOpen(false); }} style={{
                background: s.drawerCard || s.card, borderRadius: 8, border: s.drawerCardBorder || s.cardBorder,
                padding: '8px 10px', marginBottom: 4, cursor: 'pointer', display: 'flex', alignItems: 'center',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', marginRight: 8, flexShrink: 0, background: sys.comm === 'online' ? s.green : s.red }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: s.drawerText || s.text }}>{sys.name}</div>
                  <div style={{ fontSize: 12, color: s.drawerTextSub || s.textTertiary }}>{sys.l4Name || sys.l3Name}</div>
                </div>
                {sys.alert && <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 4px', borderRadius: 4, background: s.red, color: '#fff' }}>!</span>}
              </div>
            ))
          ) : (
            tiles && tiles.map(tile => (
              <CollapsibleTile
                key={tile.id}
                tile={tile}
                depth={0}
                expandedIds={expandedIds}
                toggleExpanded={toggleExpanded}
                selectedTileId={selectedTile?.id}
                onView={(t) => handleTileView(t)}
                onSystemClick={(id) => { sessionStorage.setItem('pulse2-drawer-open', 'true'); navigate(`/system/${id}`); }}
                allSystems={activeSystems}
                s={s}
              />
            ))
          )}
        </div>

        {/* Explore All / Back to My Scope toggle */}
        <div onClick={() => { toggleExplore(); setDrillPath([]); setSelectedTile(null); }} style={{
          padding: '12px 14px', borderTop: `1px solid ${s.drawerDivider || s.divider}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          cursor: 'pointer', flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: s.drawerAccent || s.accent }}>
            {exploring ? 'my_location' : 'explore'}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: s.drawerAccent || s.accent }}>
            {exploring ? 'Back to My Scope' : 'Explore All'}
          </span>
        </div>
      </div>

      {/* Onboarding overlay */}
      {showOnboarding && (
        <SystemsOnboarding
          drawerOpen={drawerOpen}
          onOpenDrawer={() => setDrawerOpen(true)}
          onCloseDrawer={() => setDrawerOpen(false)}
          onDismiss={() => setShowOnboarding(false)}
        />
      )}

      <TabBar activeTab="systems" />
    </div>
  );
}
