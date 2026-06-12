import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TabBar from '../../components/TabBar';
import StatusWidgetsMobile from '../../components/StatusWidgetsMobile';
import { useUserContext } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import { getAccountById, ACCOUNTS, getChildAccounts, getRootAccounts } from '../../data/accounts';
import { getHierarchyForAccount, getSystemsUnderNode } from '../../data/hierarchy';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) { const f = findNode(node.children, id); if (f) return f; }
  }
  return null;
}

function collectAllNodes(nodes, acc = []) {
  for (const node of nodes) { acc.push(node); if (node.children) collectAllNodes(node.children, acc); }
  return acc;
}

// ─── Material icon helper ────────────────────────────────────────────────────

function MIcon({ name, size = 18, fill = false, color, style = {} }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: size,
        fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0",
        color,
        lineHeight: 1,
        ...style,
      }}
    >{name}</span>
  );
}

// ─── Donut SVG ───────────────────────────────────────────────────────────────

function MiniDonut({ value, max, color, label, size = 72, stroke = 5 }) {
  const { theme } = useTheme();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const offset = circ - (circ * pct) / 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="transparent" stroke={theme.divider} strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="transparent" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: theme.text, lineHeight: 1 }}>{pct}%</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: theme.badgeText, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Tree node icons by type ─────────────────────────────────────────────────

const NODE_ICONS = {
  account: 'corporate_fare',
  level1: 'public',
  level2: 'map',
  level3: 'location_city',
  level4: 'domain',
  system: 'water_drop',
};

// ─── Nav tree item ───────────────────────────────────────────────────────────

function NavTreeItem({ node, allSystems, depth, selectedId, onSelect, expandedSet, toggleExpanded }) {
  const { theme } = useTheme();
  const isSystem = node.type === 'system';
  const children = node.children || [];
  const hasChildren = children.length > 0 && !isSystem;
  const expanded = expandedSet.has(node.id);
  const nodeSystems = isSystem ? [] : getSystemsUnderNode(node, allSystems);
  const isSelected = selectedId === node.id;

  const leakCount = nodeSystems.filter(s => s.alert?.type === 'leak-high' || s.alert?.type === 'leak-low').length;
  const errorCount = nodeSystems.filter(s => s.alert && !s.alert.type.includes('leak')).length;

  const handleChevronClick = (e) => { e.stopPropagation(); toggleExpanded(node.id); };
  const handleClick = () => {
    if (isSystem) { onSelect(node.id, 'system'); }
    else { onSelect(node.id, node.type); }
  };

  const pl = depth * 16;

  return (
    <>
      <div
        onClick={handleClick}
        style={{
          paddingLeft: pl + 8, paddingRight: 8, paddingTop: 6, paddingBottom: 6,
          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          background: isSelected ? 'rgba(4,173,239,0.15)' : 'transparent',
          borderLeft: isSelected ? '2px solid #04ADEF' : '2px solid transparent',
          borderRadius: 6, margin: '1px 0',
        }}
      >
        {hasChildren ? (
          <span onClick={handleChevronClick} style={{ cursor: 'pointer', display: 'flex' }}>
            <MIcon name={expanded ? 'expand_more' : 'chevron_right'} size={18}
              color={isSelected ? '#04ADEF' : theme.badgeText} />
          </span>
        ) : (
          <span style={{ width: 18 }} />
        )}

        <MIcon name={NODE_ICONS[node.type] || 'folder'} size={18}
          color={isSelected ? '#04ADEF' : theme.badgeText}
          fill={isSelected} />

        <span style={{
          flex: 1, fontSize: 14, fontWeight: isSelected ? 700 : 500,
          color: isSelected ? '#04ADEF' : theme.text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {node.name}
        </span>

        {/* Location-level badges */}
        {!isSystem && leakCount > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            background: '#FF7C4F', padding: '1px 6px', borderRadius: 10,
          }}>
            <MIcon name="water_drop" size={10} fill color="#fff" />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{leakCount}</span>
          </span>
        )}
        {!isSystem && errorCount > 0 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            background: '#FFDAD6', padding: '1px 6px', borderRadius: 10,
          }}>
            <MIcon name="warning" size={10} fill color="#93000A" />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#93000A' }}>{errorCount}</span>
          </span>
        )}

        {/* System-level alert icon only */}
        {isSystem && (() => {
          const sys = allSystems.find(s => s.id === node.id);
          if (!sys?.alert) return null;
          const isLeak = sys.alert.type.includes('leak');
          return (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              background: isLeak ? '#FF7C4F' : theme.divider,
              padding: '2px 5px', borderRadius: 10,
            }}>
              <MIcon name={isLeak ? 'water_drop' : 'warning'} size={10} fill color={isLeak ? '#fff' : '#717684'} />
            </span>
          );
        })()}
      </div>

      {expanded && hasChildren && children.map(child => (
        <NavTreeItem key={child.id} node={child} allSystems={allSystems} depth={depth + 1}
          selectedId={selectedId} onSelect={onSelect} expandedSet={expandedSet} toggleExpanded={toggleExpanded} />
      ))}
    </>
  );
}

// ─── Search results ──────────────────────────────────────────────────────────

function SearchResults({ query, allSystems, onSelectNode, onSelectSystem, selectedId, expandedSet, toggleExpanded }) {
  const { theme } = useTheme();
  const q = query.toLowerCase();
  const matchedAccounts = ACCOUNTS.filter(a => a.name.toLowerCase().includes(q) || a.shortName.toLowerCase().includes(q));

  const matchedNodes = [];
  const seenIds = new Set();
  for (const acc of ACCOUNTS) {
    const hierarchy = getHierarchyForAccount(acc.id);
    for (const node of collectAllNodes(hierarchy)) {
      if (node.type === 'system' || seenIds.has(node.id)) continue;
      if (node.name.toLowerCase().includes(q)) {
        seenIds.add(node.id);
        const ns = getSystemsUnderNode(node, allSystems);
        matchedNodes.push({ ...node, accountName: acc.shortName, systemCount: ns.length });
      }
    }
  }

  const matchedSystems = allSystems.filter(s => s.name.toLowerCase().includes(q));
  if (matchedAccounts.length + matchedNodes.length + matchedSystems.length === 0) {
    return <div style={{ textAlign: 'center', color: theme.textMuted, fontSize: 14, padding: 16 }}>No results</div>;
  }

  return (
    <div style={{ padding: '4px 0' }}>
      {matchedAccounts.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '6px 12px 2px' }}>
            Accounts · {matchedAccounts.length}
          </div>
          {matchedAccounts.map(acc => (
            <div key={acc.id} onClick={() => onSelectNode(acc.id, 'account')}
              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                background: selectedId === acc.id ? 'rgba(4,173,239,0.15)' : 'transparent',
                borderLeft: selectedId === acc.id ? '2px solid #04ADEF' : '2px solid transparent', borderRadius: 6 }}>
              <MIcon name="corporate_fare" size={16} color={selectedId === acc.id ? '#04ADEF' : theme.badgeText} />
              <span style={{ fontSize: 14, fontWeight: selectedId === acc.id ? 700 : 500, color: selectedId === acc.id ? '#04ADEF' : theme.text }}>{acc.name}</span>
            </div>
          ))}
        </>
      )}
      {matchedNodes.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '8px 12px 2px' }}>
            Locations · {matchedNodes.length}
          </div>
          {matchedNodes.map(node => {
            const expanded = expandedSet.has(node.id);
            const allNodeSystems = getSystemsUnderNode(node, allSystems);
            return (
              <div key={node.id}>
                <div style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  background: selectedId === node.id ? 'rgba(4,173,239,0.15)' : 'transparent',
                  borderLeft: selectedId === node.id ? '2px solid #04ADEF' : '2px solid transparent', borderRadius: 6 }}>
                  {allNodeSystems.length > 0 && (
                    <span onClick={(e) => { e.stopPropagation(); toggleExpanded(node.id); }} style={{ cursor: 'pointer', display: 'flex' }}>
                      <MIcon name={expanded ? 'expand_more' : 'chevron_right'} size={16} color={theme.badgeText} />
                    </span>
                  )}
                  <MIcon name={NODE_ICONS[node.type] || 'folder'} size={16} color={theme.badgeText} />
                  <div onClick={() => onSelectNode(node.id, node.type)} style={{ flex: 1, cursor: 'pointer' }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: theme.text }}>{node.name}</span>
                    <span style={{ fontSize: 12, color: theme.textTertiary, marginLeft: 6 }}>{node.accountName} · {node.systemCount} sys</span>
                  </div>
                </div>
                {expanded && allNodeSystems.map(sys => (
                  <div key={sys.id} onClick={() => onSelectSystem(sys.id)}
                    style={{ paddingLeft: 36, paddingRight: 12, paddingTop: 4, paddingBottom: 4, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', borderRadius: 6 }}>
                    <MIcon name="water_drop" size={14} color={theme.badgeText} />
                    <span style={{ fontSize: 13, color: theme.text, flex: 1 }}>{sys.name}</span>
                    {sys.alert && <MIcon name={sys.alert.type.includes('leak') ? 'water_drop' : 'warning'} size={12} fill color={sys.alert.type.includes('leak') ? '#FF7C4F' : '#93000A'} />}
                  </div>
                ))}
              </div>
            );
          })}
        </>
      )}
      {matchedSystems.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '1.5px', padding: '8px 12px 2px' }}>
            Systems · {matchedSystems.length}
          </div>
          {matchedSystems.map(sys => (
            <div key={sys.id} onClick={() => onSelectSystem(sys.id)}
              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', borderRadius: 6 }}>
              <MIcon name="water_drop" size={16} color={theme.badgeText} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: theme.text }}>{sys.name}</div>
                <div style={{ fontSize: 12, color: theme.textTertiary }}>{sys.l4Name || sys.l3Name} · {sys.l3Name}</div>
              </div>
              {sys.alert && <MIcon name={sys.alert.type.includes('leak') ? 'water_drop' : 'warning'} size={14} fill color="#FF7C4F" />}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Detail panel ────────────────────────────────────────────────────────────

function DetailPanel({ selectedId, selectedType, allSystems }) {
  const { theme } = useTheme();
  let scopedSystems = allSystems;
  let title = 'All Accounts';
  let subtitle = `${allSystems.length} systems`;

  if (selectedId && selectedType !== 'system') {
    const acc = getAccountById(selectedId);
    if (acc) {
      const children = getChildAccounts(selectedId);
      if (children.length > 0) {
        const childIds = children.map(c => c.id);
        scopedSystems = allSystems.filter(s => childIds.includes(s.account));
      } else {
        scopedSystems = allSystems.filter(s => s.account === selectedId);
      }
      title = acc.name;
      subtitle = `${acc.industry} · ${scopedSystems.length} systems`;
    } else {
      for (const sys of allSystems) {
        const h = getHierarchyForAccount(sys.account);
        const node = findNode(h, selectedId);
        if (node) {
          scopedSystems = getSystemsUnderNode(node, allSystems);
          title = node.name;
          subtitle = `${node.levelType || ''} · ${scopedSystems.length} systems`;
          break;
        }
      }
    }
  }

  const alertCount = scopedSystems.filter(s => s.alert).length;
  const leakCount = scopedSystems.filter(s => s.alert?.type?.includes('leak')).length;
  const isOperational = alertCount === 0;

  // Counts
  const accountCount = new Set(scopedSystems.map(s => s.account)).size;
  const locationCount = new Set(scopedSystems.map(s => s.l4 || s.l3).filter(Boolean)).size;

  return (
    <>
      {/* Header */}
      <div style={{
        background: theme.card, borderRadius: 8, padding: '10px 14px',
        border: theme.cardBorder, marginBottom: 8,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', color: theme.badgeText }}>Active Entity</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#04ADEF', letterSpacing: '-0.5px', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: isOperational ? 'rgba(161,210,70,0.2)' : 'rgba(219,70,112,0.2)',
            padding: '3px 8px', borderRadius: 4, flexShrink: 0,
          }}>
            <MIcon name={isOperational ? 'check_circle' : 'warning'} size={12}
              fill color={isOperational ? '#A1D246' : '#DB4670'} />
            <span style={{ fontSize: 10, fontWeight: 800, color: isOperational ? '#A1D246' : '#DB4670', textTransform: 'uppercase' }}>
              {isOperational ? 'OK' : `${alertCount} Alert${alertCount !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {/* Inline counts */}
        <div style={{ fontSize: 14, color: theme.badgeText, marginTop: 6 }}>
          {scopedSystems.length} systems in {locationCount} location{locationCount !== 1 ? 's' : ''}
        </div>
      </div>

      <StatusWidgetsMobile systems={scopedSystems} scopeIds={scopedSystems.map(s => s.id)} />
    </>
  );
}

// ─── Persisted state ─────────────────────────────────────────────────────────

// Old tree state vars removed — tile navigation uses its own persistence below

// ─── Smart View: Flat List (≤10 systems) ────────────────────────────────────

function FlatSystemsList({ systems, navigate, theme }) {
  // Group by L4 (building) name
  const groups = useMemo(() => {
    const map = {};
    systems.forEach(s => {
      const key = s.l4Name || s.l3Name || 'Other';
      const loc = s.l3Name || s.l2Name || '';
      if (!map[key]) map[key] = { location: loc, systems: [] };
      map[key].systems.push(s);
    });
    return Object.entries(map);
  }, [systems]);

  const valveLabel = (v) => v === 'open' ? 'Open' : v === 'closed' ? 'Closed' : v === 'error' ? 'Error' : null;
  const valveColor = (v) => v === 'open' ? '#A1D246' : v === 'closed' ? '#717684' : v === 'error' ? '#DB4670' : '#717684';

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
      {groups.map(([building, { location, systems: sysList }]) => (
        <div key={building} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: theme.textTertiary, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            {building}{location ? ` \u00B7 ${location}` : ''}
          </div>
          <div style={{ background: theme.card, borderRadius: 10, border: theme.cardBorder, overflow: 'hidden' }}>
            {sysList.map((sys, i) => (
              <div key={sys.id}
                onClick={() => navigate(`/system/${sys.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', padding: '12px 14px', cursor: 'pointer',
                  borderTop: i > 0 ? `1px solid ${theme.divider}` : 'none',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{sys.name}</div>
                  {sys.alert && (
                    <div style={{ fontSize: 13, color: '#DB4670', fontWeight: 600, marginTop: 2 }}>{sys.alert.label}</div>
                  )}
                </div>
                {sys.valve && (
                  <span style={{
                    fontSize: 13, fontWeight: 700, padding: '2px 8px', borderRadius: 5, marginRight: 8,
                    background: valveColor(sys.valve) + '18', color: valveColor(sys.valve),
                  }}>{valveLabel(sys.valve)}</span>
                )}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', marginRight: 8, flexShrink: 0,
                  background: sys.comm === 'online' ? '#A1D246' : '#DB4670',
                }} />
                <span style={{ fontSize: 14, color: theme.textDimmest }}>{'\u203A'}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Smart View: Building Cards (≤5 buildings) ──────────────────────────────

function BuildingCardsList({ systems, navigate, theme }) {
  const buildings = useMemo(() => {
    const map = {};
    systems.forEach(s => {
      const key = s.l4 || s.l3 || 'other';
      const name = s.l4Name || s.l3Name || 'Unknown';
      const loc = s.l3Name || s.l2Name || '';
      if (!map[key]) map[key] = { name, location: loc, systems: [] };
      map[key].systems.push(s);
    });
    return Object.entries(map);
  }, [systems]);

  const [expandedBuildings, setExpandedBuildings] = useState(() => new Set(buildings.map(([k]) => k)));

  const valveLabel = (v) => v === 'open' ? 'Open' : v === 'closed' ? 'Closed' : v === 'error' ? 'Error' : null;
  const valveColor = (v) => v === 'open' ? '#A1D246' : v === 'closed' ? '#717684' : v === 'error' ? '#DB4670' : '#717684';

  const toggleBuilding = (key) => {
    setExpandedBuildings(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
      {buildings.map(([key, { name, location, systems: sysList }]) => {
        const expanded = expandedBuildings.has(key);
        const alertCount = sysList.filter(s => s.alert).length;
        return (
          <div key={key} style={{ background: theme.card, borderRadius: 10, border: theme.cardBorder, marginBottom: 10, overflow: 'hidden' }}>
            {/* Building header */}
            <div
              onClick={() => toggleBuilding(key)}
              style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, marginRight: 12, flexShrink: 0,
                background: 'rgba(4,173,239,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MIcon name="apartment" size={16} color="#04ADEF" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{name}</div>
                <div style={{ fontSize: 13, color: theme.textTertiary, marginTop: 1 }}>
                  {location} &middot; {sysList.length} system{sysList.length !== 1 ? 's' : ''}
                </div>
              </div>
              {alertCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 5px', borderRadius: 6, background: '#DB4670', color: '#fff', marginRight: 8 }}>{alertCount}</span>
              )}
              <span style={{
                fontSize: 15, color: theme.textDimmest,
                transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease',
              }}>{'\u203A'}</span>
            </div>

            {/* System rows */}
            {expanded && sysList.map((sys, i) => (
              <div key={sys.id}
                onClick={() => navigate(`/system/${sys.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', padding: '10px 14px 10px 58px', cursor: 'pointer',
                  borderTop: `1px solid ${theme.divider}`,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: theme.text }}>{sys.name}</div>
                  {sys.alert && (
                    <div style={{ fontSize: 13, color: '#DB4670', fontWeight: 600, marginTop: 1 }}>{sys.alert.label}</div>
                  )}
                </div>
                {sys.valve && (
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '2px 7px', borderRadius: 5, marginRight: 8,
                    background: valveColor(sys.valve) + '18', color: valveColor(sys.valve),
                  }}>{valveLabel(sys.valve)}</span>
                )}
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', marginRight: 8, flexShrink: 0,
                  background: sys.comm === 'online' ? '#A1D246' : '#DB4670',
                }} />
                <span style={{ fontSize: 14, color: theme.textDimmest }}>{'\u203A'}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Determine view mode ────────────────────────────────────────────────────

function getViewMode(systems) {
  if (systems.length <= 10) return 'flat';
  return 'tree'; // Tile drill-down in bottom drawer
}

// ─── Full-width tile row ────────────────────────────────────────────────────

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
            {count} system{count !== 1 ? 's' : ''}{subLocationCount > 0 ? ` \u00B7 ${subLocationCount} location${subLocationCount !== 1 ? 's' : ''}` : ''}
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

// ─── Status popup (centered dialog — info + OK) ─────────────────────────────

function StatusSheet({ name, systems, onClose, onDrillDown, theme }) {
  const online = systems.filter(s => s.comm === 'online').length;
  const offline = systems.filter(s => s.comm === 'offline' || s.offline).length;
  const valveOpen = systems.filter(s => s.valve === 'open').length;
  const valveClosed = systems.filter(s => s.valve === 'closed').length;
  const valveError = systems.filter(s => s.valve === 'error').length;
  const acPower = systems.filter(s => s.power === 'ac' && s.comm === 'online').length;
  const battery = systems.filter(s => s.power === 'battery').length;
  const acLost = systems.filter(s => s.power === 'ac-lost').length;
  const leaks = systems.filter(s => s.alert?.type?.includes('leak')).length;
  const errors = systems.filter(s => s.alert && !s.alert.type?.includes('leak')).length;

  function StatRow({ icon, label, segments }) {
    return (
      <div style={{ background: theme.card, borderRadius: 10, padding: '10px 12px', border: theme.cardBorder }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <MIcon name={icon} size={16} color={theme.text} style={{ marginRight: 8 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>{label}</span>
        </div>
        {segments.filter(s => s.value > 0).map((seg, i) => (
          <div key={i} onClick={seg.filterKey ? () => onDrillDown(seg.filterKey) : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, cursor: seg.filterKey ? 'pointer' : 'default', borderRadius: 4, padding: '2px 0' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 15, color: theme.textSecondary, flex: 1 }}>{seg.label}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{seg.value}</span>
            {seg.filterKey && <span style={{ fontSize: 13, color: theme.textDimmest, marginLeft: 2 }}>{'\u203A'}</span>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', bottom: 56, left: 0, right: 0, zIndex: 50,
      background: theme.modalBg,
      borderRadius: '16px 16px 0 0',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.25)',
      animation: 'slideUp 0.25s ease',
      maxHeight: '60%', overflowY: 'auto',
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

      {/* Handle + close */}
      <div style={{ position: 'sticky', top: 0, background: theme.modalBg, borderRadius: '16px 16px 0 0', zIndex: 1 }}>
        <div style={{ width: 36, height: 4, background: theme.textDimmest, borderRadius: 2, margin: '8px auto 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px 8px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>{name}</div>
            <div style={{ fontSize: 14, color: theme.textTertiary, marginTop: 1 }}>{systems.length} systems</div>
          </div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: theme.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <MIcon name="close" size={16} color={theme.textTertiary} />
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <div style={{ flex: 1 }}>
            <StatRow icon="wifi" label="Comm" segments={[
              { label: 'Online', value: online, color: '#04ADEF', filterKey: 'comm-online' },
              { label: 'Offline', value: offline, color: '#DB4670', filterKey: 'comm-offline' },
            ]} />
          </div>
          <div style={{ flex: 1 }}>
            <StatRow icon="bolt" label="Power" segments={[
              { label: 'AC', value: acPower, color: '#04ADEF', filterKey: 'power-ac' },
              { label: 'AC Lost', value: acLost, color: '#DB4670', filterKey: 'power-ac-lost' },
              { label: 'Battery', value: battery, color: '#F05C25', filterKey: 'power-battery' },
            ]} />
          </div>
        </div>

        <div style={{ marginBottom: 6 }}>
          <StatRow icon="valve" label="Valves" segments={[
            { label: 'Open', value: valveOpen, color: '#04ADEF', filterKey: 'valve-open' },
            { label: 'Closed', value: valveClosed, color: '#717684', filterKey: 'valve-closed' },
            { label: 'Error', value: valveError, color: '#DB4670', filterKey: 'valve-error' },
          ]} />
        </div>

        {(leaks > 0 || errors > 0) && (
          <div>
            <StatRow icon="water_drop" label="Alerts" segments={[
              { label: 'Water Events', value: leaks, color: '#DB4670', filterKey: 'alerts-leak' },
              { label: 'Errors', value: errors, color: '#F05C25', filterKey: 'alerts-error' },
            ]} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hierarchy-based tile builder ────────────────────────────────────────────
// Uses actual hierarchy tree from hierarchy.js, not system field grouping

function getAccountTiles(systems) {
  const map = {};
  systems.forEach(s => {
    const acc = getAccountById(s.account);
    const rootId = acc?.parentId || s.account;
    const rootAcc = getAccountById(rootId) || acc;
    if (!map[rootId]) map[rootId] = { id: rootId, name: rootAcc?.name || rootId, levelType: 'Account', systems: [], children: null };
    map[rootId].systems.push(s);
  });
  // Attach children (sub-accounts) and hierarchy
  Object.keys(map).forEach(rootId => {
    const childAccounts = getChildAccounts(rootId);
    if (childAccounts.length > 0) {
      // Has sub-accounts (like CBRE → CBRE IL + CBRE UK)
      map[rootId].children = childAccounts.map(ca => ({
        id: ca.id, name: ca.name, type: 'sub-account', levelType: 'Sub-account',
        systems: map[rootId].systems.filter(s => s.account === ca.id),
        children: getHierarchyForAccount(ca.id),
      }));
    } else {
      // Direct hierarchy
      map[rootId].children = getHierarchyForAccount(rootId);
    }
  });
  return Object.values(map).sort((a, b) => b.systems.length - a.systems.length);
}

// Collect all system IDs under a hierarchy node
function collectSystemIds(node) {
  if (node.type === 'system') return [node.id];
  if (!node.children) return [];
  return node.children.flatMap(c => collectSystemIds(c));
}

// Get tiles from hierarchy children, with systems attached
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

// Auto-skip: if only 1 child and it has children, skip to its children
function autoSkip(tiles) {
  if (tiles.length === 1 && tiles[0].children && tiles[0].children.length > 0) {
    // Check if children are systems
    const hasSystemChildren = tiles[0].children.some(c => c.type === 'system');
    if (!hasSystemChildren) {
      return { skipped: true, name: tiles[0].name, children: tiles[0].children };
    }
  }
  return { skipped: false };
}

// ─── Persisted state (survives navigation away and back) ────────────────────

let _persistedDrillPath = [];
let _persistedSearchOpen = false;
let _persistedSearch = '';

// ─── Main tab ────────────────────────────────────────────────────────────────

export default function SystemsTab() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { visibleSystems = [] } = useUserContext() || {};

  const [search, setSearch] = useState(_persistedSearch);
  const [searchOpen, setSearchOpen] = useState(_persistedSearchOpen);
  const [statusSheet, setStatusSheet] = useState(null);
  const [selectedTile, setSelectedTile] = useState(null); // { id, name, systems, children }

  // Drill path: persisted across navigations
  const [drillPath, _setDrillPath] = useState(_persistedDrillPath);
  const setDrillPath = (fn) => {
    _setDrillPath(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      _persistedDrillPath = next;
      return next;
    });
  };

  const viewMode = getViewMode(visibleSystems);

  // Account tiles at root level
  const accountTiles = useMemo(() => getAccountTiles(visibleSystems), [visibleSystems]);

  // Current state
  const currentEntry = drillPath.length > 0 ? drillPath[drillPath.length - 1] : null;
  const currentSystems = currentEntry ? currentEntry.systems : visibleSystems;
  const currentChildren = currentEntry ? currentEntry.children : null;

  // Build tiles for current level
  const { tiles, showSystems } = useMemo(() => {
    if (drillPath.length === 0) {
      // Root: show accounts
      return { tiles: accountTiles.map(a => ({ id: a.id, name: a.name, levelType: a.levelType, systems: a.systems, children: a.children })), showSystems: false };
    }

    // We have hierarchy children from the drill path
    if (!currentChildren || currentChildren.length === 0) {
      return { tiles: null, showSystems: true };
    }

    // Check if children are systems
    const hasSystemChildren = currentChildren.some(c => c.type === 'system');
    if (hasSystemChildren) {
      return { tiles: null, showSystems: true };
    }

    // Build tiles from hierarchy children
    let tileset = getHierarchyTiles(currentChildren, visibleSystems);

    // No auto-skip — show every level as-is

    if (tileset.length === 0) return { tiles: null, showSystems: true };
    return { tiles: tileset, showSystems: false };
  }, [drillPath, accountTiles, currentChildren, visibleSystems]);

  // forceSystemList only when tiles resolved to show systems
  const forceSystemList = false;

  const valveLabel = (v) => v === 'open' ? 'Open' : v === 'closed' ? 'Closed' : v === 'error' ? 'Error' : null;
  const valveColor = (v) => v === 'open' ? '#A1D246' : v === 'closed' ? '#717684' : v === 'error' ? '#DB4670' : '#717684';

  const [slideDir, setSlideDir] = useState(null); // 'in' | 'out' | null
  const [slideKey, setSlideKey] = useState(0);

  // Single tap → drill down immediately
  function handleTileDrill(tile) {
    setSlideDir('in');
    setSlideKey(k => k + 1);
    setSelectedTile(null);
    setDrillPath(prev => [...prev, { name: tile.name, systems: tile.systems, children: tile.children }]);
  }

  // "View" button → select this scope (show its KPIs above)
  function handleTileView(tile) {
    setSelectedTile(tile);
  }

  function goToLevel(index) {
    setSlideDir('out');
    setSlideKey(k => k + 1);
    setSelectedTile(null);
    if (statusSheet) {
      if (index === 0) {
        setStatusSheet({ name: 'All', systems: visibleSystems });
      } else {
        const step = drillPath[index - 1];
        if (step) setStatusSheet({ name: step.name, systems: step.systems });
      }
    }
    setDrillPath(prev => prev.slice(0, index));
  }

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

  const [drawerState, setDrawerState] = useState('mid'); // 'collapsed' | 'mid' | 'full'

  // Small scope → flat/building view (no drawer)
  if (viewMode === 'flat' || viewMode === 'buildings') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: theme.bg }}>
        <div style={{ background: theme.headerBg, borderBottom: theme.headerBorder, padding: '11px 16px', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', color: theme.text }}>Systems & Locations</div>
          <div style={{ fontSize: 13, color: theme.textTertiary, marginTop: 2 }}>
            {visibleSystems.length} system{visibleSystems.length !== 1 ? 's' : ''}{' \u00B7 '}{new Set(visibleSystems.map(s => s.l4 || s.l3).filter(Boolean)).size} locations
          </div>
        </div>
        {viewMode === 'flat'
          ? <FlatSystemsList systems={visibleSystems} navigate={navigate} theme={theme} />
          : <BuildingCardsList systems={visibleSystems} navigate={navigate} theme={theme} />
        }
        <TabBar activeTab="systems" />
      </div>
    );
  }

  // ── Drawer + KPIs layout ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: theme.bg, position: 'relative' }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideOut { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      {/* TOP: KPIs + alerts for current scope (hidden when drawer is full) */}
      {drawerState !== 'full' && (() => {
        const displaySystems = selectedTile ? selectedTile.systems : currentSystems;
        const displayName = selectedTile ? selectedTile.name : (drillPath.length > 0 ? drillPath[drillPath.length - 1].name : 'All');
        const locCount = new Set(displaySystems.map(s => s.l4 || s.l3).filter(Boolean)).size;
        return (
        <div style={{ flex: drawerState === 'collapsed' ? 1 : 5, overflowY: 'auto', padding: 14, transition: 'flex 0.25s ease' }}>
          <div style={{ fontSize: 14, color: theme.textTertiary, marginBottom: 8 }}>
            {displayName} &middot; {displaySystems.length} systems &middot; {locCount} location{locCount !== 1 ? 's' : ''}
          </div>

          <StatusWidgetsMobile systems={displaySystems} scopeIds={displaySystems.map(s => s.id)} />
        </div>
        );
      })()}

      {/* BOTTOM: Navigation drawer */}
      <div style={{
        flex: drawerState === 'full' ? 1 : drawerState === 'mid' ? 5 : 'none',
        flexShrink: 0,
        background: theme.headerBg,
        borderTop: theme.headerBorder,
        borderTopLeftRadius: 16, borderTopRightRadius: 16,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transition: 'flex 0.25s ease',
      }}>
        {/* Drawer header — handle + controls */}
        <div
          onClick={() => { if (drawerState === 'collapsed') setDrawerState('mid'); else if (drawerState === 'mid') setDrawerState('collapsed'); }}
          style={{
            padding: '8px 16px 10px', cursor: 'pointer',
            borderBottom: drawerState !== 'collapsed' ? `1px solid ${theme.divider}` : 'none',
          }}
        >
          <div style={{ width: 36, height: 4, background: theme.textDimmest, borderRadius: 2, margin: '0 auto 8px' }} />
          {/* Breadcrumb — always visible in drawer */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, marginBottom: 6 }}>
            <span onClick={e => { e.stopPropagation(); goToLevel(0); }} style={{ fontSize: 14, color: drillPath.length === 0 ? theme.text : '#04ADEF', cursor: 'pointer', fontWeight: drillPath.length === 0 ? 600 : 500 }}>All ({visibleSystems.length})</span>
            {drillPath.map((step, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 13, color: theme.textDimmest }}>&rsaquo;</span>
                <span onClick={e => { e.stopPropagation(); goToLevel(i + 1); }} style={{ fontSize: 14, color: i === drillPath.length - 1 ? theme.text : '#04ADEF', cursor: 'pointer', fontWeight: i === drillPath.length - 1 ? 600 : 500 }}>{step.name} ({step.systems.length})</span>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span onClick={e => { e.stopPropagation(); const next = !searchOpen; setSearchOpen(next); _persistedSearchOpen = next; setSearch(''); _persistedSearch = ''; if (drawerState === 'collapsed') setDrawerState('mid'); }}
                style={{ cursor: 'pointer', padding: 6, borderRadius: 8, background: searchOpen ? '#04ADEF' : 'transparent', marginRight: 4 }}>
                <MIcon name={searchOpen ? 'close' : 'search'} size={16} color={searchOpen ? '#fff' : theme.textTertiary} />
              </span>
              <span onClick={e => { e.stopPropagation(); setDrawerState(s => s === 'full' ? 'mid' : 'full'); }}
                style={{ cursor: 'pointer', padding: 6 }}>
                <MIcon name={drawerState === 'full' ? 'close_fullscreen' : 'open_in_full'} size={16} color={theme.textTertiary} />
              </span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && drawerState !== 'collapsed' && (
          <div style={{ padding: '4px 14px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: theme.inputBg, borderRadius: 8, padding: '7px 10px' }}>
              <MIcon name="search" size={16} color={theme.textTertiary} style={{ marginRight: 8 }} />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search systems\u2026"
                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 15, color: theme.text, fontFamily: 'inherit', outline: 'none' }} />
              {search && <span onClick={() => setSearch('')} style={{ cursor: 'pointer', display: 'flex' }}><MIcon name="close" size={16} color={theme.textTertiary} /></span>}
            </div>
          </div>
        )}

        {/* Tile content */}
        {drawerState !== 'collapsed' && (
          <div key={slideKey} style={{
            flex: 1, overflowY: 'auto', padding: '4px 14px 14px',
            animation: slideDir === 'in' ? 'slideIn 0.2s ease' : slideDir === 'out' ? 'slideOut 0.2s ease' : 'none',
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
                    <div style={{ fontSize: 13, color: theme.textTertiary, marginTop: 1 }}>{sys.l4Name || sys.l3Name} &middot; {sys.l3Name || sys.l2Name}</div>
                  </div>
                  {sys.alert && <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 5px', borderRadius: 6, background: '#DB4670', color: '#fff', marginRight: 6 }}>Alert</span>}
                  <span style={{ fontSize: 14, color: theme.textDimmest }}>{'\u203A'}</span>
                </div>
              ))
            ) : showSystems ? (
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
                    <span style={{ fontSize: 14, color: theme.textDimmest }}>{'\u203A'}</span>
                  </div>
                ))}
              </div>
            ) : (
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
      </div>

      <TabBar activeTab="systems" />
    </div>
  );
}
