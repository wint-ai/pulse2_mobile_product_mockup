// Technician Locations tab — assigned locations with list/tree toggle
// PRD: ch.01 §7

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TabBar from '../../components/TabBar';
import TechTopBar from '../../components/TechTopBar';
import {
  TECH_LOCATIONS, getAttentionStats, getCUsAtLocation, getWSAtLocation,
  getLocationBreadcrumb,
} from '../../data/technicianData';

function AttentionSummary({ stats, style = {} }) {
  if (stats.unpaired === 0 && stats.incompleteTSO === 0) {
    return <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, ...style }}>&#10003; All clear</span>;
  }
  const parts = [];
  if (stats.unpaired > 0) parts.push(<span key="u" style={{ color: '#DC2626' }}>{stats.unpaired} unpaired</span>);
  if (stats.incompleteTSO > 0) parts.push(<span key="t" style={{ color: '#F59E0B' }}>{stats.incompleteTSO} Incomplete TSO</span>);
  return (
    <span style={{ fontSize: 12, fontWeight: 500, ...style }}>
      {parts.reduce((acc, el, i) => i === 0 ? [el] : [...acc, <span key={`sep-${i}`} style={{ color: '#D1D5DB' }}> &middot; </span>, el], [])}
    </span>
  );
}

function LocationCard({ location, onClick, ancestors }) {
  const stats = getAttentionStats(location.id);
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 8,
        border: '1px solid #E5E7EB',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {ancestors && (
          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{ancestors}</div>
        )}
        <div style={{ fontSize: 14, fontWeight: 600, color: '#14151A' }}>{location.name}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{location.levelType}</div>
        <AttentionSummary stats={stats} />
      </div>
      <span style={{ fontSize: 16, color: '#D1D5DB', flexShrink: 0 }}>&rsaquo;</span>
    </div>
  );
}

// ── Tree View ──────────────────────────────────────────────────────────────────

const DEPTH_COLORS = ['#fff', '#F9FAFB', '#F3F4F6', '#E5E7EB'];

function TreeNode({ node, depth = 0, navigate }) {
  const [expanded, setExpanded] = useState(false);
  const stats = getAttentionStats(node.id);
  const cus = getCUsAtLocation(node.id);
  const wss = getWSAtLocation(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const hasDevices = cus.length > 0 || wss.length > 0;
  const isExpandable = hasChildren || hasDevices;
  const [devicesExpanded, setDevicesExpanded] = useState(false);

  return (
    <div>
      <div
        onClick={() => isExpandable ? setExpanded(!expanded) : null}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px 8px ' + (12 + depth * 20) + 'px',
          background: DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)],
          borderBottom: '1px solid #F3F4F6',
          cursor: isExpandable ? 'pointer' : 'default',
        }}
      >
        {isExpandable && (
          <span style={{
            fontSize: 14, color: '#9CA3AF', transition: 'transform 0.15s',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            display: 'inline-block', width: 18, textAlign: 'center',
          }}>&rsaquo;</span>
        )}
        {!isExpandable && <span style={{ width: 18 }} />}
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#9CA3AF' }}>
          {node.levelType === 'Floor' ? 'layers' : node.levelType === 'Building' ? 'apartment' : 'location_on'}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#14151A', flex: 1 }}>{node.name}</span>
        <AttentionSummary stats={stats} style={{ fontSize: 11 }} />
      </div>

      {expanded && hasChildren && node.children.map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1} navigate={navigate} />
      ))}

      {/* Devices at leaf locations — shown directly without a toggle */}
      {expanded && !hasChildren && hasDevices && (
        <>
          {cus.map(cu => (
            <DeviceRow key={cu.id} type="CU" name={cu.name} paired={cu.paired} onClick={() => navigate(`/tech/cu/${cu.id}`)} depth={depth + 1} />
          ))}
          {wss.map(ws => (
            <DeviceRow key={ws.id} type="WS" name={ws.name} deviceType={ws.deviceType} paired={ws.paired} tsoStatus={ws.tsoStatus} onClick={() => navigate(`/tech/ws/${ws.id}`)} depth={depth + 1} />
          ))}
        </>
      )}

      {/* Devices at non-leaf locations — collapsible "Devices (N)" group */}
      {expanded && hasChildren && hasDevices && (
        <>
          <div
            onClick={() => setDevicesExpanded(!devicesExpanded)}
            style={{
              padding: '6px 12px 6px ' + (12 + (depth + 1) * 20) + 'px',
              background: DEPTH_COLORS[Math.min(depth + 1, DEPTH_COLORS.length - 1)],
              borderBottom: '1px solid #F3F4F6',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{
              fontSize: 12, color: '#9CA3AF', transition: 'transform 0.15s',
              transform: devicesExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              display: 'inline-block', width: 14, textAlign: 'center',
            }}>&rsaquo;</span>
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Devices ({cus.length + wss.length})</span>
          </div>
          {devicesExpanded && cus.map(cu => (
            <DeviceRow key={cu.id} type="CU" name={cu.name} paired={cu.paired} onClick={() => navigate(`/tech/cu/${cu.id}`)} depth={depth + 2} />
          ))}
          {devicesExpanded && wss.map(ws => (
            <DeviceRow key={ws.id} type="WS" name={ws.name} deviceType={ws.deviceType} paired={ws.paired} tsoStatus={ws.tsoStatus} onClick={() => navigate(`/tech/ws/${ws.id}`)} depth={depth + 2} />
          ))}
        </>
      )}
    </div>
  );
}

const TSO_COLORS = { pass: '#16A34A', partial: '#F59E0B', fail: '#EF4444', not_tested: '#9CA3AF', in_progress: '#3B82F6' };
const TSO_LABELS = { pass: 'Pass', partial: 'Partial', fail: 'Fail', not_tested: 'Not Tested', in_progress: 'In Progress' };

function DeviceRow({ type, name, deviceType, paired, tsoStatus, onClick, depth = 0 }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '6px 12px 6px ' + (12 + depth * 20) + 'px',
        background: DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)],
        borderBottom: '1px solid #F3F4F6',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      <span style={{
        fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
        background: type === 'CU' ? '#F3E8FF' : '#DBEAFE',
        color: type === 'CU' ? '#7C3AED' : '#2563EB',
      }}>{type}</span>
      <span style={{ fontSize: 12, color: '#14151A', flex: 1 }}>
        {name}
        {deviceType && <span style={{ color: '#9CA3AF' }}> &middot; {deviceType === 'wint3' ? 'Wint3' : 'Flowless'}</span>}
      </span>
      {/* Status labels */}
      <span style={{ fontSize: 10, fontWeight: 600, color: paired ? '#16A34A' : '#DC2626' }}>
        {paired ? 'Paired' : 'Unpaired'}
      </span>
      {type === 'WS' && paired && tsoStatus && (
        <span style={{ fontSize: 10, fontWeight: 600, color: TSO_COLORS[tsoStatus] }}>
          {TSO_LABELS[tsoStatus]}
        </span>
      )}
    </div>
  );
}

// ── List View — Drill-down ─────────────────────────────────────────────────────

function LocationDrillDown({ location, onBack, navigate }) {
  const breadcrumb = getLocationBreadcrumb(location.id);
  const stats = getAttentionStats(location.id);
  const cus = getCUsAtLocation(location.id);
  const wss = getWSAtLocation(location.id);
  const [subPath, setSubPath] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');

  if (subPath) {
    return <LocationDrillDown location={subPath} onBack={() => setSubPath(null)} navigate={navigate} />;
  }

  const filteredChildren = (location.children || []).filter(child => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return child.name.toLowerCase().includes(q);
  });

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
        <div onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 8 }}>
          <span style={{ fontSize: 18, color: '#6B7280' }}>&lsaquo;</span>
          <span style={{ fontSize: 13, color: '#6B7280' }}>Back</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#14151A' }}>{location.name}</div>
        {breadcrumb && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{breadcrumb}</div>}
      </div>

      {/* Attention summary */}
      <div style={{ padding: '10px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
        <AttentionSummary stats={stats} />
        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Including all sub-locations</div>
      </div>

      {/* Sub-locations */}
      {location.children && location.children.length > 0 && (
        <div style={{ padding: '12px 16px 4px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Sub-locations</div>
          {/* Filter */}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <input
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter locations..."
              style={{
                width: '100%', padding: '8px 32px 8px 12px',
                borderRadius: 8, border: '1px solid #E5E7EB',
                fontSize: 13, fontFamily: 'inherit', color: '#14151A',
                background: '#fff', outline: 'none', boxSizing: 'border-box',
              }}
            />
            {filterQuery && (
              <span onClick={() => setFilterQuery('')} style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                cursor: 'pointer', fontSize: 14, color: '#9CA3AF',
              }}>&times;</span>
            )}
          </div>
          {filteredChildren.map(child => {
            const childStats = getAttentionStats(child.id);
            return (
              <div
                key={child.id}
                onClick={() => setSubPath(child)}
                style={{
                  background: '#fff', borderRadius: 10, padding: '10px 14px', marginBottom: 6,
                  border: '1px solid #E5E7EB', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#14151A' }}>{child.name}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{child.levelType}</div>
                  <AttentionSummary stats={childStats} style={{ fontSize: 11 }} />
                </div>
                <span style={{ fontSize: 14, color: '#D1D5DB' }}>&rsaquo;</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Entities at this location */}
      {cus.length > 0 && (
        <div style={{ padding: '12px 16px 4px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Control Units at this location ({cus.length})</div>
          {cus.map(cu => (
            <div
              key={cu.id}
              onClick={() => navigate(`/tech/cu/${cu.id}`)}
              style={{
                background: '#fff', borderRadius: 10, padding: '10px 14px', marginBottom: 6,
                border: '1px solid #E5E7EB', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                background: '#F3E8FF', color: '#7C3AED',
              }}>CU</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#14151A' }}>{cu.name}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: cu.status === 'online' ? '#16A34A' : '#EF4444' }}>
                    &#9679; {cu.status === 'online' ? 'Online' : 'Offline'}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: cu.paired ? '#16A34A' : '#DC2626' }}>
                    {cu.paired ? 'Paired' : 'Unpaired'}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 14, color: '#D1D5DB' }}>&rsaquo;</span>
            </div>
          ))}
        </div>
      )}

      {wss.length > 0 && (
        <div style={{ padding: '12px 16px 4px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Water Systems at this location ({wss.length})</div>
          {wss.map(ws => (
            <div
              key={ws.id}
              onClick={() => navigate(`/tech/ws/${ws.id}`)}
              style={{
                background: '#fff', borderRadius: 10, padding: '10px 14px', marginBottom: 6,
                border: '1px solid #E5E7EB', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
              }}
            >
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                background: '#DBEAFE', color: '#2563EB',
              }}>WS</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#14151A' }}>
                  {ws.name}
                  <span style={{ color: '#9CA3AF', fontWeight: 400 }}> &middot; {ws.deviceType === 'wint3' ? 'Wint3' : 'Flowless'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: ws.paired ? '#16A34A' : '#DC2626' }}>
                    {ws.paired ? 'Paired' : 'Unpaired'}
                  </span>
                  {ws.paired && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: TSO_COLORS[ws.tsoStatus] }}>
                      {TSO_LABELS[ws.tsoStatus]}
                    </span>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 14, color: '#D1D5DB' }}>&rsaquo;</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ height: 20 }} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function TechLocations() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'list'
  const [drillLocation, setDrillLocation] = useState(null);

  // Technician's assigned locations = top-level entries
  const assignedLocations = TECH_LOCATIONS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: '#F3F4F6' }}>
      <TechTopBar />

      {drillLocation && viewMode === 'list' ? (
        <LocationDrillDown location={drillLocation} onBack={() => setDrillLocation(null)} navigate={navigate} />
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {/* Header */}
          <div style={{ padding: '16px 16px 8px' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#14151A' }}>Your Assigned Locations</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Showing locations assigned to you by your admin</div>
          </div>

          {/* List / Tree toggle */}
          <div style={{ padding: '0 16px 12px', display: 'flex', gap: 0 }}>
            {['tree', 'list'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '6px 16px',
                  fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                  border: '1px solid #E5E7EB',
                  background: viewMode === mode ? '#14151A' : '#fff',
                  color: viewMode === mode ? '#fff' : '#6B7280',
                  cursor: 'pointer',
                  borderRadius: mode === 'tree' ? '8px 0 0 8px' : '0 8px 8px 0',
                }}
              >{mode === 'tree' ? 'Tree' : 'List'}</button>
            ))}
          </div>

          {viewMode === 'list' ? (
            <div style={{ padding: '0 16px' }}>
              {assignedLocations.map(loc => (
                <LocationCard key={loc.id} location={loc} onClick={() => setDrillLocation(loc)} />
              ))}
            </div>
          ) : (
            <div>
              {assignedLocations.map(loc => (
                <TreeNode key={loc.id} node={loc} navigate={navigate} />
              ))}
            </div>
          )}
          <div style={{ height: 20 }} />
        </div>
      )}

      <TabBar activeTab="locations" />
    </div>
  );
}
