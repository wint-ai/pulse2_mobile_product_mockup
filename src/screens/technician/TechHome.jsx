// Technician Home — KPI cards + open items work queue
// PRD: ch.01 §6

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TabBar from '../../components/TabBar';
import TechTopBar from '../../components/TechTopBar';
import {
  WATER_SYSTEMS, CONTROL_UNITS, PHOTO_RETAKES,
  getLocationBreadcrumb, getParentCU,
} from '../../data/technicianData';

const TSO_STATUS_COLORS = {
  pass: '#16A34A',
  partial: '#F59E0B',
  fail: '#EF4444',
  not_tested: '#9CA3AF',
  in_progress: '#3B82F6',
};

const TSO_STATUS_LABELS = {
  pass: 'Pass',
  partial: 'Partial',
  fail: 'Fail',
  not_tested: 'Not Tested',
  in_progress: 'In Progress',
};

function KPICard({ label, value, color }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: '14px 16px',
      border: '1px solid #E5E7EB',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || '#14151A', letterSpacing: '-1px' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function OpenItemRow({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 16px',
        background: '#fff',
        borderBottom: '1px solid #F3F4F6',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#14151A' }}>{item.name}</span>
          {item.deviceType && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
              background: item.deviceType === 'wint3' ? '#EFF6FF' : '#F0FDF4',
              color: item.deviceType === 'wint3' ? '#2563EB' : '#16A34A',
            }}>{item.deviceType === 'wint3' ? 'Wint3' : 'Flowless'}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
            background: item.statusBg, color: item.statusColor,
          }}>{item.statusLabel}</span>
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{item.breadcrumb}</div>
      </div>
      <span style={{ fontSize: 16, color: '#D1D5DB', flexShrink: 0 }}>&rsaquo;</span>
    </div>
  );
}

function SectionHeader({ title, count, expanded, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        padding: '10px 16px',
        background: '#F9FAFB',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 13, color: '#6B7280', transition: 'transform 0.15s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>&rsaquo;</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{title}</span>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
        background: '#E5E7EB', color: '#4B5563',
      }}>{count}</span>
    </div>
  );
}

export default function TechHome() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Compute open items
  const unpairedCUs = CONTROL_UNITS.filter(cu => !cu.paired);
  const unpairedWS = WATER_SYSTEMS.filter(ws => !ws.paired);
  const incompleteTSO = WATER_SYSTEMS.filter(ws => ws.paired && ws.tsoStatus !== 'pass');
  const photoRetakeWS = PHOTO_RETAKES.map(pr => {
    const ws = WATER_SYSTEMS.find(w => w.id === pr.wsId);
    return ws ? { ...ws, retakeCount: pr.categories.length } : null;
  }).filter(Boolean);

  // KPI values
  const totalNeedWork = unpairedCUs.length + unpairedWS.length + incompleteTSO.length + photoRetakeWS.length;

  // Build section items with search filtering
  const q = searchQuery.toLowerCase().trim();
  const filterItem = (item, breadcrumb) => {
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || breadcrumb.toLowerCase().includes(q);
  };

  const sections = useMemo(() => {
    const buildItems = (items, statusLabel, statusColor, statusBg, entityType) =>
      items.map(item => {
        const breadcrumb = getLocationBreadcrumb(item.locationId) || '';
        return {
          ...item,
          breadcrumb,
          statusLabel: item.retakeCount ? `${item.retakeCount} photos requested` : statusLabel,
          statusColor,
          statusBg,
          entityType,
          route: entityType === 'cu' ? `/tech/cu/${item.id}` : `/tech/ws/${item.id}`,
        };
      }).filter(item => filterItem(item, item.breadcrumb));

    const result = [];

    const cuItems = buildItems(unpairedCUs, 'Unpaired', '#DC2626', '#FEF2F2', 'cu');
    if (cuItems.length > 0) result.push({ key: 'unpaired-cus', title: 'Unpaired CUs', items: cuItems });

    const wsItems = buildItems(unpairedWS, 'Unpaired', '#DC2626', '#FEF2F2', 'ws');
    if (wsItems.length > 0) result.push({ key: 'unpaired-ws', title: 'Unpaired Water Systems', items: wsItems });

    const tsoItems = incompleteTSO.map(ws => {
      const breadcrumb = getLocationBreadcrumb(ws.locationId) || '';
      return {
        ...ws,
        breadcrumb,
        statusLabel: TSO_STATUS_LABELS[ws.tsoStatus],
        statusColor: TSO_STATUS_COLORS[ws.tsoStatus],
        statusBg: ws.tsoStatus === 'fail' ? '#FEF2F2' : ws.tsoStatus === 'partial' ? '#FFFBEB' : '#F3F4F6',
        entityType: 'ws',
        route: `/tech/ws/${ws.id}`,
      };
    }).filter(item => filterItem(item, item.breadcrumb));
    if (tsoItems.length > 0) result.push({ key: 'incomplete-tso', title: 'Incomplete TSO', items: tsoItems });

    const retakeItems = buildItems(photoRetakeWS, '', '#2563EB', '#EFF6FF', 'ws');
    if (retakeItems.length > 0) result.push({ key: 'photo-retake', title: 'Photo Retake Requested', items: retakeItems });

    return result;
  }, [q]);

  // Expanded state per section — default: <=10 expanded
  const [collapsed, setCollapsed] = useState({});
  const isExpanded = (key, count) => {
    if (collapsed[key] !== undefined) return !collapsed[key];
    return count <= 10;
  };
  const toggleSection = (key) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: '#F3F4F6' }}>
      <TechTopBar />
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {/* KPI Cards */}
        <div style={{ padding: '16px 16px 8px' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <KPICard label="Total Need Work" value={totalNeedWork} />
            <KPICard label="Incomplete TSO" value={incompleteTSO.length} color="#F59E0B" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <KPICard label="Unpaired Systems" value={unpairedWS.length} color="#EF4444" />
            <KPICard label="Unpaired CUs" value={unpairedCUs.length} color="#EF4444" />
          </div>
        </div>

        {/* Open Items header + search */}
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#14151A', marginBottom: 8 }}>Open Items</div>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search systems..."
              style={{
                width: '100%', padding: '10px 36px 10px 14px',
                borderRadius: 10, border: '1px solid #E5E7EB',
                fontSize: 14, fontFamily: 'inherit', color: '#14151A',
                background: '#fff', outline: 'none', boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <span
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  cursor: 'pointer', fontSize: 16, color: '#9CA3AF', fontWeight: 700,
                }}
              >&times;</span>
            )}
          </div>
        </div>

        {/* Sections */}
        {sections.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            {q ? (
              <div style={{ fontSize: 14, color: '#9CA3AF' }}>No results for "{searchQuery}"</div>
            ) : (
              <>
                <span style={{ fontSize: 32 }}>&#10003;</span>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#16A34A', marginTop: 8 }}>All caught up</div>
                <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>No open items</div>
              </>
            )}
          </div>
        )}

        {sections.map(section => {
          const expanded = isExpanded(section.key, section.items.length);
          return (
            <div key={section.key} style={{ marginBottom: 2 }}>
              <SectionHeader
                title={section.title}
                count={section.items.length}
                expanded={expanded}
                onToggle={() => toggleSection(section.key)}
              />
              {expanded && section.items.map(item => (
                <OpenItemRow
                  key={item.id}
                  item={item}
                  onClick={() => navigate(item.route)}
                />
              ))}
            </div>
          );
        })}
        <div style={{ height: 20 }} />
      </div>
      <TabBar activeTab="home" />
    </div>
  );
}
