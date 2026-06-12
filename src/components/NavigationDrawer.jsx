// Shared navigation drawer — Option D design (minimal list + tree guides)
// Used on Home (HomeUnified) and System Detail page

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { getAccountById, getChildAccounts } from '../data/accounts';
import { getHierarchyForAccount } from '../data/hierarchy';
import { computeSystemHealth } from '../utils/systemHealth';
import { getFavorites, isFavorited, toggleFavorite } from '../data/favoritesStore';
import { useDataRefresh } from '../utils/useDataRefresh';

function MIcon({ name, size = 18, fill = false, color, style = {} }) {
  return (
    <span className="material-symbols-outlined"
      style={{ fontSize: size, fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0", color, lineHeight: 1, ...style }}
    >{name}</span>
  );
}

// Star button — tap to toggle favorite. Called from every row that can be
// pinned (system rows + location rows). Calls the store, then bumps the
// parent-provided `onChange` so the drawer re-renders the Favorites section.
const STAR_COLOR = '#F5A524';
function StarButton({ entry, onChange, theme }) {
  const starred = isFavorited(entry.kind, entry.id);
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(entry);
        onChange?.();
      }}
      title={starred ? 'Remove from favorites' : 'Add to favorites'}
      style={{
        flexShrink: 0, zIndex: 1, cursor: 'pointer',
        width: 36, height: 36,
        margin: '-9px -4px -9px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <MIcon name="star" size={18} fill={starred}
        color={starred ? STAR_COLOR : (theme.drawerTextSub || theme.textTertiary)} />
    </span>
  );
}

// Map hierarchy levelType → icon
function iconForLevel(levelType) {
  switch (levelType) {
    case 'Account':       return { name: 'domain',          fill: true,  color: '#0B95F8' };
    case 'Sub-account':   return { name: 'corporate_fare',  fill: false, color: '#04ADEF' };
    case 'Country':       return { name: 'public',          fill: false };
    case 'Region':        return { name: 'map',             fill: false };
    case 'District':      return { name: 'map',             fill: false };
    case 'Area':          return { name: 'map',             fill: false };
    case 'Province':      return { name: 'map',             fill: false };
    case 'Emirate':       return { name: 'map',             fill: false };
    case 'Business District': return { name: 'map',         fill: false };
    case 'City':          return { name: 'location_city',   fill: false };
    case 'Airport':       return { name: 'flight',          fill: false };
    case 'Building':      return { name: 'apartment',       fill: true };
    case 'Tower':         return { name: 'apartment',       fill: true };
    case 'Terminal':      return { name: 'apartment',       fill: true };
    case 'Mall':          return { name: 'store',           fill: true };
    case 'Campus':        return { name: 'apartment',       fill: true };
    case 'Floor':         return { name: 'layers',          fill: false };
    default:              return { name: 'place',           fill: false };
  }
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

function pruneRootTiles(accountTiles, visibleSystems) {
  const visibleIds = new Set(visibleSystems.map(s => s.id));
  const sysMap = {};
  visibleSystems.forEach(s => { sysMap[s.id] = s; });

  function collectLeaves(node) {
    if (!node.children || node.children.length === 0) return [];
    if (node.children.some(c => c.type === 'system')) {
      const visibleHere = node.children.filter(c => c.type === 'system' && visibleIds.has(c.id));
      if (visibleHere.length === 0) return [];
      return [{ id: node.id, name: node.name, levelType: node.levelType || null, systems: visibleHere.map(c => sysMap[c.id]).filter(Boolean), children: node.children }];
    }
    return node.children.filter(c => c.type !== 'system').flatMap(c => collectLeaves(c));
  }

  if (accountTiles.length > 1) {
    return { prunedTiles: accountTiles.map(a => ({ id: a.id, name: a.name, levelType: a.levelType, systems: a.systems, children: a.children })), prunedPath: [] };
  }

  const acc = accountTiles[0];
  if (!acc) return { prunedTiles: [], prunedPath: [] };

  const leaves = (acc.children || []).flatMap(c => collectLeaves(c));
  if (leaves.length === 0) {
    return { prunedTiles: [{ id: acc.id, name: acc.name, levelType: acc.levelType, systems: acc.systems, children: acc.children }], prunedPath: [] };
  }
  return { prunedTiles: leaves, prunedPath: [{ name: acc.name, systems: visibleSystems, children: null }] };
}

// Find path to system (returns ancestor IDs)
function findPathToSystem(tiles, systemId, allSystems) {
  for (const tile of tiles) {
    if (tile.systems.some(s => s.id === systemId)) {
      const childLocations = tile.children ? tile.children.filter(c => c.type !== 'system') : [];
      if (childLocations.length > 0) {
        const childTiles = getHierarchyTiles(childLocations, allSystems);
        const deeper = findPathToSystem(childTiles, systemId, allSystems);
        return [tile.id, ...deeper];
      }
      return [tile.id];
    }
  }
  return [];
}

// Find path to a location tile (returns ancestor IDs including the tile itself)
function findPathToLocation(tiles, locationId, allSystems) {
  for (const tile of tiles) {
    if (tile.id === locationId) return [tile.id];
    const childLocations = tile.children ? tile.children.filter(c => c.type !== 'system') : [];
    if (childLocations.length > 0) {
      const childTiles = getHierarchyTiles(childLocations, allSystems);
      const deeper = findPathToLocation(childTiles, locationId, allSystems);
      if (deeper.length > 0) return [tile.id, ...deeper];
    }
  }
  return [];
}

// Find the actual tile (with its populated `systems` list) + its ancestor
// chain, given just a location id. Used when activating a favorite — the
// favorites store only caches id+name, so we have to re-resolve the tile
// from the hierarchy to get the system list right.
function findLocationTile(tiles, locationId, allSystems, ancestors = []) {
  for (const tile of tiles) {
    if (tile.id === locationId) return { tile, ancestors };
    const childLocations = tile.children ? tile.children.filter(c => c.type !== 'system') : [];
    if (childLocations.length > 0) {
      const childTiles = getHierarchyTiles(childLocations, allSystems);
      const found = findLocationTile(childTiles, locationId, allSystems, [...ancestors, tile]);
      if (found) return found;
    }
  }
  return null;
}

// Search locations matching a query, returning {tile, path} for each
function searchLocations(tiles, query, allSystems, ancestors = []) {
  const results = [];
  for (const tile of tiles) {
    const matches = tile.name.toLowerCase().includes(query) ||
                    (tile.levelType && tile.levelType.toLowerCase().includes(query));
    if (matches) {
      results.push({ tile, ancestors: ancestors.map(a => a.name) });
    }
    const childLocations = tile.children ? tile.children.filter(c => c.type !== 'system') : [];
    if (childLocations.length > 0) {
      const childTiles = getHierarchyTiles(childLocations, allSystems);
      results.push(...searchLocations(childTiles, query, allSystems, [...ancestors, tile]));
    }
  }
  return results;
}

// ── Row component (Option D) ──
function NavRow({ depth, levelType, name, count, leakCount, alertCount, expanded, expandable, selected, onClick, onToggle, theme, search, targetId, favoriteEntry, onToggleFavorite }) {
  const indent = 12 + (depth - 1) * 11; // 11px per depth level
  const accent = theme.drawerAccent || theme.accent;
  const textColor = selected ? accent : (theme.drawerText || theme.text);
  const subColor = selected ? accent : (theme.drawerTextSub || theme.textTertiary);
  const ico = iconForLevel(levelType);

  const sub = (() => {
    const parts = [];
    if (count > 0) parts.push(`${count} system${count !== 1 ? 's' : ''}`);
    return parts.join(' · ');
  })();

  return (
    <div onClick={onClick}
      className="nav-drawer-row"
      data-drawer-target={targetId}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: `11px 14px 11px ${indent}px`,
        borderBottom: `0.5px solid ${theme.drawerDivider || 'rgba(255,255,255,0.05)'}`,
        cursor: 'pointer',
        background: selected ? accent + '1A' : 'transparent',
      }}>
      {/* Tree guide lines for indented rows */}
      {!selected && depth > 1 && Array.from({ length: depth - 1 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: 0, bottom: 0,
          left: 18 + i * 11,
          width: 1,
          background: 'rgba(255,255,255,0.08)',
        }} />
      ))}
      {/* Selected accent bar */}
      {selected && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accent }} />
      )}

      {/* Level icon */}
      <span style={{ flexShrink: 0, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
        <MIcon name={ico.name} size={18} fill={ico.fill} color={selected ? accent : (ico.color || theme.drawerTextSub || theme.textTertiary)} />
      </span>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
        <div style={{
          fontSize: 14, fontWeight: selected ? 600 : 500,
          color: textColor,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</div>
        {sub && (
          <div style={{ fontSize: 11, color: subColor, marginTop: 1, opacity: selected ? 0.85 : 1 }}>
            {sub}
            {leakCount > 0 && <span style={{ color: theme.red, fontWeight: 600 }}> · {leakCount} Water Event{leakCount !== 1 ? 's' : ''}</span>}
            {alertCount > 0 && <span style={{ color: theme.orange, fontWeight: 600 }}> · {alertCount} alert{alertCount !== 1 ? 's' : ''}</span>}
          </div>
        )}
      </div>

      {/* Leak indicator dot (right-aligned, before star + chevron) */}
      {leakCount > 0 && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.red, flexShrink: 0, zIndex: 1 }} />
      )}

      {/* Favorite star (locations are pinnable) */}
      {favoriteEntry && (
        <StarButton entry={favoriteEntry} onChange={onToggleFavorite} theme={theme} />
      )}

      {/* Expand chevron (only on expandable rows).
          Generous hit area — earlier the tap target was tight to the 18 px
          glyph, users kept hitting the row instead of the chevron. Now a
          ~44 px square with 10 px padding extending into the row's edge. */}
      {expandable && (
        <span onClick={(e) => { if (onToggle) { e.stopPropagation(); onToggle(); } }}
          style={{
            flexShrink: 0, zIndex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 44, height: 44,
            margin: '-11px -10px -11px 0',  // expand into row's vertical & right padding
            cursor: 'pointer',
          }}>
          <MIcon name={expanded ? 'expand_more' : 'chevron_right'} size={20} color={subColor} />
        </span>
      )}
    </div>
  );
}

// ── System leaf row ──
function SystemRow({ sys, depth, isCurrent, onClick, theme, onToggleFavorite, showPath = false }) {
  const indent = 12 + (depth - 1) * 11;
  const accent = theme.drawerAccent || theme.accent;

  // Status — derived via the shared helper so the drawer dot and the System
  // Health card on the system page never disagree.  Three states:
  //   • Red    — active leak (Water Event)
  //   • Amber  — any non-leak protection issue
  //              (offline · valve error/disconnected · external power lost · no recipients)
  //   • Green  — healthy
  const { isLeak, isComm, valveOk, powerOk, hasRecipients, allOk } = computeSystemHealth(sys);
  const isOffline = !isComm;                       // kept name for clarity below
  const dotColor = isLeak ? theme.red
                 : !allOk ? (theme.orange || '#E5A100')
                 : theme.green;
  // Sub-label under the system name — collect EVERY active health issue.
  // This list is computed regardless of whether the system also has a leak
  // alert: a system can have BOTH (e.g. DHW Building A has leak-high AND
  // comm=offline because the mock-data IIFE in systems.js forces 2 systems
  // per location offline without overriding their existing alerts). The
  // drawer should show both signals, not just the leak label.
  //
  // Dedup against sys.alert.type so the same issue doesn't render twice
  // (e.g. a system with alert.type='valve-error' would otherwise show
  // "Valve error" once via sys.alert.label and once via this list).
  const primaryType = sys.alert?.type;
  const primaryIsComm = primaryType === 'offline' || primaryType === 'comm';
  const healthIssues = (() => {
    const arr = [];
    if (isOffline && !primaryIsComm) arr.push('Offline');
    if (!valveOk && primaryType !== 'valve-error') arr.push('Valve error');
    if (!powerOk && primaryType !== 'power-lost') arr.push('External power disconnected');
    if (!hasRecipients) arr.push('No alert recipients');
    return arr;
  })();
  const healthLabel = healthIssues.length > 0 ? healthIssues.join(' · ') : null;
  // Keep the muted-grey treatment ONLY when Offline is the system's sole
  // problem (matches the drawer convention that "comms down" reads quieter
  // than "real issue"). Anything else — multi-issue OR any non-Offline single
  // issue — uses the amber attention color.
  const healthIsOfflineOnly = healthIssues.length === 1 && healthIssues[0] === 'Offline';

  return (
    <div onClick={onClick}
      data-drawer-target={sys.id}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: `9px 14px 9px ${indent}px`,
        borderBottom: `0.5px solid ${theme.drawerDivider || 'rgba(255,255,255,0.05)'}`,
        cursor: isCurrent ? 'default' : 'pointer',
        background: isCurrent ? accent + '1A' : 'transparent',
      }}>
      {/* Tree guide lines */}
      {!isCurrent && depth > 1 && Array.from({ length: depth - 1 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, bottom: 0,
          left: 18 + i * 11, width: 1,
          background: 'rgba(255,255,255,0.08)',
        }} />
      ))}
      {isCurrent && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accent }} />
      )}

      {/* Status dot in place of icon */}
      <span style={{ flexShrink: 0, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
      </span>

      {/* Name + alert label */}
      <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
        <div style={{
          fontSize: 13, fontWeight: isCurrent ? 700 : 500,
          color: isCurrent ? accent : isLeak ? theme.red : (theme.drawerText || theme.text),
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{sys.name}</div>
        {/* Parent location path — shown in search results to disambiguate
            systems with identical names across locations (e.g. "Floor 21"
            exists in 3 buildings). 2026-06-07. */}
        {showPath && (sys.l4Name || sys.l3Name) && (
          <div style={{
            fontSize: 11, color: theme.drawerTextSub || theme.textTertiary,
            marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{[sys.l4Name, sys.l3Name].filter(Boolean).join(' · ')}</div>
        )}
        {sys.alert && (
          <div style={{ fontSize: 11, color: theme.red, fontWeight: 600, marginTop: 1 }}>{sys.alert.label}</div>
        )}
        {/* Health label renders ALONGSIDE the alert label when the system has
            additional issues beyond the primary alert (e.g. leak-high +
            offline). Otherwise it's the only sub-line on systems with no
            sys.alert but with health drift. */}
        {healthLabel && (
          <div style={{
            fontSize: 11, fontWeight: 600, marginTop: 1,
            color: healthIsOfflineOnly ? (theme.drawerTextSub || theme.textTertiary) : (theme.orange || '#E5A100'),
          }}>{healthLabel}</div>
        )}
      </div>

      {isCurrent && (
        <span style={{ fontSize: 10, fontWeight: 700, color: accent, padding: '1px 6px', borderRadius: 4, background: accent + '15', flexShrink: 0, zIndex: 1 }}>Viewing</span>
      )}

      {/* Favorite star — systems are pinnable */}
      <StarButton
        entry={{
          kind: 'system',
          id: sys.id,
          name: sys.name,
          sub: [sys.l4Name, sys.l3Name].filter(Boolean).join(' · '),
        }}
        onChange={onToggleFavorite}
        theme={theme}
      />
    </div>
  );
}

// ── Recursive collapsible tree ──
function TreeNode({ tile, depth, ancestors = [], expandedIds, toggleExpanded, selectedTileId, onView, onSystemClick, currentSystemId, allSystems, theme, onToggleFavorite }) {
  const isExpanded = expandedIds.has(tile.id);
  const isSelected = selectedTileId === tile.id;
  // Leak + alert rollups — drawn from the shared health helper so the parent
  // location's "· N alerts" count agrees with the per-system rows below it
  // and with the System Health card on the system page.
  const leakCount = tile.systems.filter(sys => computeSystemHealth(sys).isLeak).length;
  const alertCount = tile.systems.filter(sys => {
    const h = computeSystemHealth(sys);
    return !h.isLeak && (!h.allOk || !!sys.alert);
  }).length;
  const childLocations = tile.children ? tile.children.filter(c => c.type !== 'system') : [];
  const hasChildLocations = childLocations.length > 0;
  const hasSystemChildren = tile.systems.length > 0 && !hasChildLocations;
  const expandable = hasChildLocations || hasSystemChildren;
  const childTiles = hasChildLocations ? getHierarchyTiles(childLocations, allSystems) : [];
  const childAncestors = [...ancestors, tile.name];

  return (
    <>
      <NavRow
        depth={depth}
        levelType={tile.levelType}
        name={tile.name}
        count={tile.systems.length}
        leakCount={leakCount}
        alertCount={alertCount}
        expandable={expandable}
        expanded={isExpanded}
        selected={isSelected}
        targetId={tile.id}
        onClick={() => {
          // One-tap: select scope + toggle expand
          onView(tile, ancestors);
          if (expandable) toggleExpanded(tile.id);
        }}
        onToggle={() => toggleExpanded(tile.id)}
        theme={theme}
        favoriteEntry={{
          kind: 'location',
          id: tile.id,
          name: tile.name,
          sub: `${tile.systems.length} system${tile.systems.length !== 1 ? 's' : ''}`,
          levelType: tile.levelType,
        }}
        onToggleFavorite={onToggleFavorite}
      />
      {isExpanded && (
        <>
          {childTiles.map(child => (
            <TreeNode key={child.id} tile={child} depth={depth + 1} ancestors={childAncestors}
              expandedIds={expandedIds} toggleExpanded={toggleExpanded} selectedTileId={selectedTileId}
              onView={onView} onSystemClick={onSystemClick} currentSystemId={currentSystemId}
              allSystems={allSystems} theme={theme} onToggleFavorite={onToggleFavorite} />
          ))}
          {hasSystemChildren && tile.systems.map(sys => (
            <SystemRow key={sys.id} sys={sys} depth={depth + 1}
              isCurrent={sys.id === currentSystemId}
              onClick={() => sys.id !== currentSystemId && onSystemClick(sys.id)}
              theme={theme} onToggleFavorite={onToggleFavorite} />
          ))}
        </>
      )}
    </>
  );
}

// ── Main drawer ──
export default function NavigationDrawer({ open, onClose, onSelectLocation, currentSystemId }) {
  useDataRefresh();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { exploreSystems = [], exploring, toggleExplore, setSelectedScope, selectedScope } = useUserContext() || {};
  const activeSystems = exploreSystems;
  const accent = theme.drawerAccent || theme.accent;

  const accountTiles = useMemo(() => getAccountTiles(activeSystems), [activeSystems]);
  const { prunedTiles: rootTiles, prunedPath: autoSkipped } = useMemo(
    () => pruneRootTiles(accountTiles, activeSystems), [accountTiles, activeSystems]);
  const rootName = autoSkipped.length > 0 ? autoSkipped[0].name : 'All';

  // Auto-expand path to current system on first render
  const [expandedIds, setExpandedIds] = useState(() => {
    if (currentSystemId) {
      const path = findPathToSystem(rootTiles, currentSystemId, activeSystems);
      if (path.length > 0) return new Set(path);
    }
    return new Set();
  });
  const [selectedTileId, setSelectedTileId] = useState(null);
  const [search, setSearch] = useState('');

  // Favorites are persisted in localStorage; the version counter is bumped on
  // every star/unstar so the section + every visible star button re-renders.
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const bumpFavorites = () => setFavoritesVersion(v => v + 1);
  const favorites = useMemo(() => getFavorites(), [favoritesVersion]);   // eslint-disable-line react-hooks/exhaustive-deps
  const [favoritesOpen, setFavoritesOpen] = useState(true);

  // The "current target" the drawer should focus on:
  // 1) the system being viewed (currentSystemId), OR
  // 2) the global selectedScope (from drawer drill-down), OR
  // 3) the locally-selected tile id.
  const focusTarget = currentSystemId || selectedScope?.id || selectedTileId;

  // Whenever drawer opens, expand path to current focus target.
  // ALSO: if the user has only one top-level location (e.g. Oren Tidhar
  // -> just "Tidhar Towers"), auto-expand it so the drawer doesn't open
  // to a single collapsed row that demands one extra tap to reveal what
  // anyone in this scope would obviously want to see.
  useEffect(() => {
    if (!open) return;
    let path = [];
    if (currentSystemId) {
      path = findPathToSystem(rootTiles, currentSystemId, activeSystems);
    } else if (selectedScope?.id) {
      path = findPathToLocation(rootTiles, selectedScope.id, activeSystems);
    } else if (selectedTileId) {
      path = findPathToLocation(rootTiles, selectedTileId, activeSystems);
    }
    // Single-root auto-expand. Append the single root id to the path so
    // any prior focus-path expansion still applies; if there was no focus
    // target, this becomes the entire expansion.
    if (rootTiles.length === 1) {
      path = [...path, rootTiles[0].id];
    }
    if (path.length > 0) {
      setExpandedIds(prev => {
        const next = new Set(prev);
        path.forEach(id => next.add(id));
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentSystemId, selectedScope?.id, selectedTileId, rootTiles.length]);

  // Scroll the focused row into view ONLY when the drawer opens (or the focus
  // target itself changes). Earlier this also ran on every `expandedIds`
  // change, which caused the bug where tapping a chevron to expand any
  // location yanked the scroll back to the currently-viewed system and pushed
  // the just-tapped row off-screen.
  useEffect(() => {
    if (!open || !focusTarget) return;
    // Defer so the auto-expand path effect has had a chance to render.
    const id = setTimeout(() => {
      const el = document.querySelector(`[data-drawer-target="${focusTarget}"]`);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'auto' });
    }, 150);
    return () => clearTimeout(id);
  }, [open, focusTarget]);

  const toggleExpanded = (id) => setExpandedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Search both systems and locations
  const searchResults = useMemo(() => {
    if (!search) return { systems: [], locations: [] };
    const q = search.toLowerCase();
    const systems = activeSystems.filter(sys =>
      sys.name.toLowerCase().includes(q) ||
      (sys.l4Name || '').toLowerCase().includes(q) ||
      (sys.l3Name || '').toLowerCase().includes(q)
    );
    const locations = searchLocations(rootTiles, q, activeSystems);
    return { systems, locations };
  }, [search, activeSystems, rootTiles]);

  function handleView(tile, ancestors = []) {
    setSelectedTileId(tile.id);
    // Set the global selected scope so every screen can show it.
    if (setSelectedScope) {
      setSelectedScope({
        id: tile.id,
        name: tile.name,
        levelType: tile.levelType,
        ancestors,
        systems: tile.systems,
        systemIds: tile.systems.map(s => s.id),
      });
    }
    if (onSelectLocation) onSelectLocation(tile);
  }

  function handleSystemClick(id) {
    // Close drawer on the way out — system detail will open without drawer
    if (onClose) onClose();
    navigate(`/system/${id}`);
  }

  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, zIndex: 10,
        background: 'rgba(0,0,0,0.45)',
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.25s ease',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: '85%', maxWidth: 340, background: theme.drawerBg, zIndex: 11,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
        display: 'flex', flexDirection: 'column',
        boxShadow: open ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
      }}>
        {/* Header — drop the "Navigate" title (2026-06-07); the search bar
            is the header (its placeholder explains what it does). Just the
            search input + close x. */}
        <div style={{ padding: '12px 14px 10px', borderBottom: `1px solid ${theme.drawerDivider || theme.divider}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: theme.drawerInput || theme.inputBg, borderRadius: 8, padding: '7px 10px' }}>
              <MIcon name="search" size={15} color={theme.drawerTextSub || theme.textTertiary} style={{ marginRight: 6 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search my systems and locations"
                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: theme.drawerText || theme.text, fontFamily: 'inherit', outline: 'none', minWidth: 0 }} />
              {search && <span onClick={() => setSearch('')} style={{ cursor: 'pointer', display: 'flex' }}><MIcon name="close" size={14} color={theme.drawerTextSub || theme.textTertiary} /></span>}
            </div>
            <span onClick={onClose} style={{ cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0 }}>
              <MIcon name="close" size={22} color={theme.drawerTextSub || theme.textTertiary} />
            </span>
          </div>
        </div>

        {/* Favorites — foldable section at the top. Visible only when not
            actively searching (search dominates the view). The Favorites
            section uses a tinted background to visually distinguish itself
            from the tree below (2026-06-08; revised after the BROWSE label
            alone wasn't enough separation). */}
        {search.length === 0 && (
          <div style={{
            flexShrink: 0,
            background: theme.drawerBg === '#fff' || !theme.drawerBg
              ? '#F4F6FA' // light tint on light drawer
              : 'rgba(255,255,255,0.04)', // subtle lift on dark drawer
          }}>
            <div onClick={() => setFavoritesOpen(o => !o)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', cursor: 'pointer', userSelect: 'none',
            }}>
              <MIcon name="star" size={16} fill={favorites.length > 0}
                color={favorites.length > 0 ? STAR_COLOR : (theme.drawerTextSub || theme.textTertiary)} />
              <span style={{
                flex: 1, fontSize: 12, fontWeight: 700,
                color: theme.drawerTextSub || theme.textTertiary,
                textTransform: 'uppercase', letterSpacing: '.4px',
              }}>Favorites{favorites.length > 0 ? ` (${favorites.length})` : ''}</span>
              <MIcon name={favoritesOpen ? 'expand_less' : 'expand_more'} size={18}
                color={theme.drawerTextSub || theme.textTertiary} />
            </div>
            {favoritesOpen && (
              <div style={{ paddingBottom: 4 }}>
                {favorites.length === 0 ? (
                  <div style={{
                    padding: '4px 14px 12px', fontSize: 12,
                    color: theme.drawerTextSub || theme.textTertiary, fontStyle: 'italic',
                    lineHeight: 1.4,
                  }}>Tap the star on any system or location to pin it here.</div>
                ) : favorites.map(fav => {
                  const isSystem = fav.kind === 'system';

                  // F6 (2026-06-08): system favorites use the SAME status dot
                  // as the main tree's SystemRow — green (healthy) / red (leak)
                  // / amber (other issue). Location favorites still use
                  // iconForLevel.
                  const sysForDot = isSystem ? activeSystems.find(s => s.id === fav.id) : null;
                  const sysHealth = sysForDot ? computeSystemHealth(sysForDot) : null;
                  const dotColor = sysHealth
                    ? (sysHealth.isLeak ? theme.red
                       : !sysHealth.allOk ? (theme.orange || '#E5A100')
                       : theme.green)
                    : null;
                  const ico = isSystem
                    ? null  // status dot used instead — see render below
                    : iconForLevel(fav.levelType);

                  // Roll up leak / alert counts for the line-3 status callouts.
                  let leakCount = 0;
                  let alertCount = 0;
                  let sysCount = 0;
                  if (isSystem) {
                    if (sysHealth) {
                      if (sysHealth.isLeak) leakCount = 1;
                      else if (!sysHealth.allOk || !!sysForDot.alert) alertCount = 1;
                    }
                  } else {
                    const found = findLocationTile(rootTiles, fav.id, activeSystems);
                    if (found) {
                      sysCount = found.tile.systems.length;
                      leakCount = found.tile.systems.filter(s => computeSystemHealth(s).isLeak).length;
                      alertCount = found.tile.systems.filter(s => {
                        const h = computeSystemHealth(s);
                        return !h.isLeak && (!h.allOk || !!s.alert);
                      }).length;
                    }
                  }

                  // F1 (2026-06-07): 3-line layout when there's an issue, so
                  // the status callout doesn't crowd the location line and
                  // wrap awkwardly. Matches the search-result anatomy:
                  //   line 1: name
                  //   line 2: location (system: "L4Name · L3Name"; location: "N systems")
                  //   line 3: status (only when leakCount/alertCount > 0)
                  const locationLine = isSystem
                    ? (fav.sub || '')
                    : (sysCount > 0 ? `${sysCount} system${sysCount !== 1 ? 's' : ''}` : '');
                  const hasStatus = leakCount > 0 || alertCount > 0;

                  return (
                    <div key={`${fav.kind}-${fav.id}`}
                      onClick={() => {
                        if (isSystem) {
                          handleSystemClick(fav.id);
                          return;
                        }
                        const found = findLocationTile(rootTiles, fav.id, activeSystems);
                        if (found && setSelectedScope) {
                          setSelectedScope({
                            id: found.tile.id,
                            name: found.tile.name,
                            levelType: found.tile.levelType,
                            ancestors: found.ancestors.map(a => a.name),
                            systems: found.tile.systems,
                            systemIds: found.tile.systems.map(s => s.id),
                          });
                        } else if (setSelectedScope) {
                          setSelectedScope({
                            id: fav.id, name: fav.name,
                            levelType: fav.levelType,
                            ancestors: [],
                            systems: [],
                            systemIds: [],
                          });
                        }
                        if (onClose) onClose();
                        navigate('/');
                      }}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '9px 14px',
                        cursor: 'pointer',
                      }}>
                      <span style={{ flexShrink: 0, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 2 }}>
                        {isSystem ? (
                          // F6 (2026-06-08): status dot, same shape + size +
                          // color logic as the main tree SystemRow.
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
                        ) : (
                          <MIcon name={ico.name} size={16} fill={ico.fill}
                            color={ico.color || theme.drawerTextSub || theme.textTertiary} />
                        )}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 600, color: theme.drawerText || theme.text,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{fav.name}</div>
                        {locationLine && (
                          <div style={{
                            fontSize: 11, color: theme.drawerTextSub || theme.textTertiary,
                            marginTop: 1,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>{locationLine}</div>
                        )}
                        {hasStatus && (
                          <div style={{
                            fontSize: 11, fontWeight: 600,
                            marginTop: 2,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {leakCount > 0 && <span style={{ color: theme.red }}>{leakCount} Water Event{leakCount !== 1 ? 's' : ''}</span>}
                            {alertCount > 0 && <span style={{ color: theme.orange }}>{leakCount > 0 ? ' · ' : ''}{alertCount} alert{alertCount !== 1 ? 's' : ''}</span>}
                          </div>
                        )}
                      </div>
                      {/* Leak indicator dot — matches main tree row */}
                      {leakCount > 0 && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.red, flexShrink: 0, marginTop: 6 }} />
                      )}
                      <StarButton entry={fav} onChange={bumpFavorites} theme={theme} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tree body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* F5 — section break between Favorites and tree. Revised 2026-06-08:
              the earlier "thin border + small BROWSE label" wasn't enough
              separation. Now uses a tall gap-band (12 px solid background-tint
              spacer) PLUS a larger BROWSE label with its own bottom divider. */}
          {search.length === 0 && favorites.length > 0 && (
            <>
              <div style={{
                height: 12,
                background: theme.drawerBg === '#fff' || !theme.drawerBg
                  ? '#E2E6EB' // visible grey band on light drawers
                  : 'rgba(0,0,0,0.2)', // darker band on dark drawer
              }} />
              <div style={{
                padding: '12px 14px 10px',
                fontSize: 12, fontWeight: 700,
                color: theme.drawerTextSub || theme.textTertiary,
                textTransform: 'uppercase', letterSpacing: '.5px',
                borderBottom: `1px solid ${theme.drawerDivider || theme.divider}`,
              }}>All systems &amp; locations</div>
            </>
          )}
          {search.length > 0 ? (
            (searchResults.locations.length === 0 && searchResults.systems.length === 0) ? (
              <div style={{ textAlign: 'center', color: theme.drawerTextSub || theme.textTertiary, fontSize: 14, padding: 24 }}>No results</div>
            ) : (
              <>
                {searchResults.locations.length > 0 && (
                  <>
                    <div style={{ padding: '8px 14px 4px', fontSize: 11, fontWeight: 700, color: theme.drawerTextSub || theme.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Locations ({searchResults.locations.length})
                    </div>
                    {searchResults.locations.map(({ tile, ancestors }) => {
                      const leakCount = tile.systems.filter(s => s.alert?.type?.includes('leak')).length;
                      const ico = iconForLevel(tile.levelType);
                      return (
                        <div key={tile.id}
                          onClick={() => { handleView(tile, ancestors); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '11px 14px',
                            borderBottom: `0.5px solid ${theme.drawerDivider || 'rgba(255,255,255,0.05)'}`,
                            cursor: 'pointer',
                          }}>
                          <span style={{ flexShrink: 0, width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MIcon name={ico.name} size={18} fill={ico.fill} color={ico.color || theme.drawerTextSub || theme.textTertiary} />
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: theme.drawerText || theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tile.name}</div>
                            <div style={{ fontSize: 11, color: theme.drawerTextSub || theme.textTertiary, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ancestors.length > 0 ? ancestors.join(' › ') + ' · ' : ''}{tile.systems.length} system{tile.systems.length !== 1 ? 's' : ''}
                              {leakCount > 0 && <span style={{ color: theme.red, fontWeight: 600 }}> · {leakCount} Water Event{leakCount !== 1 ? 's' : ''}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                {searchResults.systems.length > 0 && (
                  <>
                    <div style={{ padding: '8px 14px 4px', fontSize: 11, fontWeight: 700, color: theme.drawerTextSub || theme.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Systems ({searchResults.systems.length})
                    </div>
                    {searchResults.systems.map(sys => (
                      <SystemRow key={sys.id} sys={sys} depth={1}
                        isCurrent={sys.id === currentSystemId}
                        onClick={() => sys.id !== currentSystemId && handleSystemClick(sys.id)}
                        theme={theme}
                        showPath />
                    ))}
                  </>
                )}
              </>
            )
          ) : (
            rootTiles.map(tile => (
              <TreeNode key={tile.id} tile={tile} depth={1}
                expandedIds={expandedIds} toggleExpanded={toggleExpanded}
                selectedTileId={selectedTileId} onView={handleView}
                onSystemClick={handleSystemClick} currentSystemId={currentSystemId}
                allSystems={activeSystems} theme={theme}
                onToggleFavorite={bumpFavorites} />
            ))
          )}
        </div>

        {/* Explore toggle */}
        <div onClick={() => { toggleExplore(); setExpandedIds(new Set()); setSelectedTileId(null); }} style={{
          padding: '12px 14px', borderTop: `1px solid ${theme.drawerDivider || theme.divider}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          cursor: 'pointer', flexShrink: 0,
        }}>
          <MIcon name={exploring ? 'my_location' : 'explore'} size={18} color={accent} />
          <span style={{ fontSize: 14, fontWeight: 600, color: accent }}>
            {exploring ? 'Back to My Scope' : 'Explore All'}
          </span>
        </div>
      </div>
    </>
  );
}
