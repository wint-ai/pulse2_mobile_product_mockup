// SystemsTab2 — Same as SystemsTab but drawer at TOP instead of bottom
// Navigation tiles at top, KPIs + system list at bottom

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TabBar from '../../components/TabBar';
import StatusWidgetsMobile from '../../components/StatusWidgetsMobile';
import { useUserContext } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { getAccountById, getChildAccounts } from '../../data/accounts';
import { getHierarchyForAccount } from '../../data/hierarchy';

// ─── Helpers (identical to SystemsTab) ──────────────────────────────────────

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

// ─── Tile card (identical to v1) ────────────────────────────────────────────

function TileRow({ name, levelType, count, subLocationCount, leakCount, alertCount, selected, onDrill, onView, theme }) {
  return (
    <div onClick={onDrill} style={{
      background: theme.card, borderRadius: 10,
      border: selected ? '2px solid #04ADEF' : theme.cardBorder,
      padding: selected ? '13px 15px' : '14px 16px',
      marginBottom: 8, cursor: 'pointer',
      display: 'flex', alignItems: 'center',
      transition: 'border 0.15s ease',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{name}</span>
          {levelType && <span style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, padding: '1px 6px', borderRadius: 4, background: theme.inputBg }}>{levelType}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span style={{ fontSize: 14, color: theme.textTertiary }}>
            {count} system{count !== 1 ? 's' : ''}{subLocationCount > 0 ? ` · ${subLocationCount} location${subLocationCount !== 1 ? 's' : ''}` : ''}
          </span>
          {leakCount > 0 && <span style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, color: '#DB4670' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DB4670' }} />{leakCount}</span>}
          {alertCount > 0 && <span style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, color: '#F05C25' }}><MIcon name="warning" size={12} color="#F05C25" />{alertCount}</span>}
        </div>
      </div>
      <span onClick={(e) => { e.stopPropagation(); onView(); }} style={{
        fontSize: 13, fontWeight: 700, color: '#04ADEF', flexShrink: 0, marginLeft: 8,
        padding: '4px 10px', borderRadius: 6, background: 'rgba(4,173,239,0.1)',
        cursor: 'pointer',
      }}>View</span>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function SystemsTab2() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { visibleSystems = [] } = useUserContext() || {};

  const [selectedTile, setSelectedTile] = useState(null);
  const [drillPath, setDrillPath] = useState([]);
  const [slideDir, setSlideDir] = useState(null);
  const [slideKey, setSlideKey] = useState(0);
  const [drawerState, setDrawerState] = useState('mid'); // 'collapsed' | 'mid' | 'full'
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');

  const accountTiles = useMemo(() => getAccountTiles(visibleSystems), [visibleSystems]);

  const currentEntry = drillPath.length > 0 ? drillPath[drillPath.length - 1] : null;
  const currentSystems = currentEntry ? currentEntry.systems : visibleSystems;
  const currentChildren = currentEntry ? currentEntry.children : null;

  const { tiles, showSystems } = useMemo(() => {
    if (drillPath.length === 0) {
      return { tiles: accountTiles.map(a => ({ id: a.id, name: a.name, levelType: a.levelType, systems: a.systems, children: a.children })), showSystems: false };
    }
    if (!currentChildren || currentChildren.length === 0) return { tiles: null, showSystems: true };
    const hasSystemChildren = currentChildren.some(c => c.type === 'system');
    if (hasSystemChildren) return { tiles: null, showSystems: true };
    const tileset = getHierarchyTiles(currentChildren, visibleSystems);
    if (tileset.length === 0) return { tiles: null, showSystems: true };
    return { tiles: tileset, showSystems: false };
  }, [drillPath, accountTiles, currentChildren, visibleSystems]);

  const displaySystems = selectedTile ? selectedTile.systems : currentSystems;

  function handleTileDrill(tile) {
    setSlideDir('in');
    setSlideKey(k => k + 1);
    setSelectedTile(null);
    setDrillPath(prev => [...prev, { name: tile.name, systems: tile.systems, children: tile.children }]);
  }

  function handleTileView(tile) {
    setSelectedTile(tile);
  }

  function goToLevel(index) {
    setSlideDir('out');
    setSlideKey(k => k + 1);
    setSelectedTile(null);
    setDrillPath(prev => prev.slice(0, index));
  }

  const valveLabel = (v) => v === 'open' ? 'Open' : v === 'closed' ? 'Closed' : v === 'error' ? 'Error' : null;
  const valveColor = (v) => v === 'open' ? '#A1D246' : v === 'closed' ? '#717684' : v === 'error' ? '#DB4670' : '#717684';

  const searchFiltered = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return visibleSystems.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.l4Name || '').toLowerCase().includes(q) ||
      (s.l3Name || '').toLowerCase().includes(q) ||
      (s.l2Name || '').toLowerCase().includes(q)
    );
  }, [search, visibleSystems]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: theme.bg, position: 'relative' }}>
      <style>{`
        @keyframes slideIn2 { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideOut2 { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      {/* ═══ TOP DRAWER: Navigation tiles ═══ */}
      <div style={{
        flex: drawerState === 'full' ? 1 : drawerState === 'mid' ? 5 : 'none',
        flexShrink: 0,
        background: theme.headerBg,
        borderBottom: theme.headerBorder,
        borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transition: 'flex 0.25s ease',
        zIndex: 2,
      }}>
        {/* Drawer header */}
        <div style={{ padding: '10px 16px 0', flexShrink: 0 }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>Sites <span style={{ fontSize: 13, fontWeight: 400, color: theme.textMuted }}>(v2)</span></div>
            <span onClick={() => navigate('/systems')} style={{ fontSize: 12, fontWeight: 700, color: '#04ADEF', cursor: 'pointer', padding: '3px 8px', borderRadius: 6, background: 'rgba(4,173,239,0.1)' }}>← v1</span>
          </div>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, marginBottom: 6 }}>
            <span onClick={() => goToLevel(0)} style={{ fontSize: 14, color: drillPath.length === 0 ? theme.text : '#04ADEF', cursor: 'pointer', fontWeight: drillPath.length === 0 ? 600 : 500 }}>
              All ({visibleSystems.length})
            </span>
            {drillPath.map((step, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 13, color: theme.textDimmest }}>›</span>
                <span onClick={() => goToLevel(i + 1)} style={{
                  fontSize: 14, cursor: 'pointer',
                  color: i === drillPath.length - 1 ? theme.text : '#04ADEF',
                  fontWeight: i === drillPath.length - 1 ? 600 : 500,
                }}>{step.name} ({step.systems.length})</span>
              </span>
            ))}
          </div>

          {/* Controls row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 4 }}>
            <span onClick={() => { setSearchOpen(v => !v); setSearch(''); if (drawerState === 'collapsed') setDrawerState('mid'); }}
              style={{ cursor: 'pointer', padding: 6, borderRadius: 8, background: searchOpen ? '#04ADEF' : 'transparent', marginRight: 4 }}>
              <MIcon name={searchOpen ? 'close' : 'search'} size={16} color={searchOpen ? '#fff' : theme.textTertiary} />
            </span>
            <span onClick={() => setDrawerState(s => s === 'full' ? 'mid' : 'full')}
              style={{ cursor: 'pointer', padding: 6 }}>
              <MIcon name={drawerState === 'full' ? 'close_fullscreen' : 'open_in_full'} size={16} color={theme.textTertiary} />
            </span>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && drawerState !== 'collapsed' && (
          <div style={{ padding: '4px 14px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: theme.inputBg, borderRadius: 8, padding: '7px 10px' }}>
              <MIcon name="search" size={16} color={theme.textTertiary} style={{ marginRight: 8 }} />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search systems…"
                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, color: theme.text, fontFamily: 'inherit', outline: 'none' }} />
              {search && <span onClick={() => setSearch('')} style={{ cursor: 'pointer', display: 'flex' }}><MIcon name="close" size={16} color={theme.textTertiary} /></span>}
            </div>
          </div>
        )}

        {/* Tile content */}
        {drawerState !== 'collapsed' && (
          <div key={slideKey} style={{
            flex: 1, overflowY: 'auto', padding: '4px 14px 14px',
            animation: slideDir === 'in' ? 'slideIn2 0.2s ease' : slideDir === 'out' ? 'slideOut2 0.2s ease' : 'none',
          }}>
            {searchOpen && search.length > 0 ? (
              searchFiltered.length === 0 ? (
                <div style={{ textAlign: 'center', color: theme.textTertiary, fontSize: 15, marginTop: 20 }}>No systems found</div>
              ) : searchFiltered.map(sys => (
                <div key={sys.id} onClick={() => navigate(`/system/${sys.id}`)} style={{
                  background: theme.card, borderRadius: 10, border: theme.cardBorder,
                  padding: '10px 12px', marginBottom: 6, cursor: 'pointer', display: 'flex', alignItems: 'center',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{sys.name}</div>
                    <div style={{ fontSize: 13, color: theme.textTertiary, marginTop: 1 }}>{sys.l4Name || sys.l3Name} · {sys.l3Name || sys.l2Name}</div>
                  </div>
                  {sys.alert && <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 5px', borderRadius: 6, background: '#DB4670', color: '#fff', marginRight: 6 }}>Alert</span>}
                  <span style={{ fontSize: 14, color: theme.textDimmest }}>›</span>
                </div>
              ))
            ) : showSystems ? (
              // Leaf level — system list
              <div style={{ background: theme.card, borderRadius: 10, border: theme.cardBorder, overflow: 'hidden' }}>
                {currentSystems.map((sys, i) => (
                  <div key={sys.id} onClick={() => navigate(`/system/${sys.id}`)} style={{
                    display: 'flex', alignItems: 'center', padding: '10px 12px', cursor: 'pointer',
                    borderTop: i > 0 ? `1px solid ${theme.divider}` : 'none',
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', marginRight: 10, flexShrink: 0, background: sys.comm === 'online' ? '#A1D246' : '#DB4670' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 500, color: theme.text }}>{sys.name}</div>
                      {sys.alert && <div style={{ fontSize: 13, color: '#DB4670', fontWeight: 600, marginTop: 1 }}>{sys.alert.label}</div>}
                    </div>
                    {sys.valve && (
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 6px', borderRadius: 5, marginRight: 6, background: valveColor(sys.valve) + '18', color: valveColor(sys.valve) }}>{valveLabel(sys.valve)}</span>
                    )}
                    <span style={{ fontSize: 14, color: theme.textDimmest }}>›</span>
                  </div>
                ))}
              </div>
            ) : (
              // Tile cards
              tiles && tiles.map(tile => {
                const leakCount = tile.systems.filter(s => s.alert?.type?.includes('leak')).length;
                const alertCount = tile.systems.filter(s => s.alert && !s.alert.type?.includes('leak')).length;
                return (
                  <TileRow key={tile.id} name={tile.name} levelType={tile.levelType}
                    count={tile.systems.length}
                    subLocationCount={tile.children ? tile.children.filter(c => c.type !== 'system').length : 0}
                    leakCount={leakCount} alertCount={alertCount}
                    selected={selectedTile?.id === tile.id}
                    onDrill={() => handleTileDrill(tile)}
                    onView={() => handleTileView(tile)}
                    theme={theme} />
                );
              })
            )}
          </div>
        )}

        {/* Handle — tap to collapse/expand */}
        <div
          onClick={() => { if (drawerState === 'collapsed') setDrawerState('mid'); else if (drawerState === 'mid') setDrawerState('collapsed'); }}
          style={{ padding: '4px 0 8px', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
        >
          <div style={{ width: 36, height: 4, background: theme.textDimmest, borderRadius: 2 }} />
        </div>
      </div>

      {/* ═══ BOTTOM: KPIs + scope info (hidden when drawer is full) ═══ */}
      {drawerState !== 'full' && (() => {
        const ds = selectedTile ? selectedTile.systems : currentSystems;
        const dn = selectedTile ? selectedTile.name : (drillPath.length > 0 ? drillPath[drillPath.length - 1].name : 'All');
        const lc = new Set(ds.map(s => s.l4 || s.l3).filter(Boolean)).size;
        return (
          <div style={{ flex: drawerState === 'collapsed' ? 1 : 5, overflowY: 'auto', padding: 14, transition: 'flex 0.25s ease' }}>
            <div style={{ fontSize: 14, color: theme.textTertiary, marginBottom: 8 }}>
              {dn} · {ds.length} systems · {lc} location{lc !== 1 ? 's' : ''}
            </div>
            <StatusWidgetsMobile systems={ds} scopeIds={ds.map(s => s.id)} />
          </div>
        );
      })()}

      <TabBar activeTab="systems" />
    </div>
  );
}
