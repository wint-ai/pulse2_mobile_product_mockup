// Technician History tab — chronological activity log
// PRD: ch.01 §9

import { useNavigate } from 'react-router-dom';
import TabBar from '../../components/TabBar';
import TechTopBar from '../../components/TechTopBar';
import { TECH_HISTORY } from '../../data/technicianData';

const TYPE_BADGES = {
  tso: { label: 'TSO', bg: '#DBEAFE', color: '#2563EB' },
  ws_paired: { label: 'WS Paired', bg: '#DCFCE7', color: '#16A34A' },
  cu_paired: { label: 'CU Paired', bg: '#DCFCE7', color: '#16A34A' },
  cu_wifi: { label: 'WiFi Config', bg: '#F3E8FF', color: '#7C3AED' },
};

const RESULT_BADGES = {
  pass: { label: 'Pass', bg: '#DCFCE7', color: '#16A34A' },
  partial: { label: 'Partial', bg: '#FEF3C7', color: '#D97706' },
  fail: { label: 'Fail', bg: '#FEE2E2', color: '#DC2626' },
};

function groupByDate(entries) {
  const now = new Date('2026-08-09T12:00:00');
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const groups = [];
  let currentGroup = null;

  for (const entry of entries) {
    const d = new Date(entry.timestamp);
    const entryDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.floor((today - entryDate) / 86400000);

    let label;
    if (diffDays === 0) label = 'Today';
    else if (diffDays === 1) label = 'Yesterday';
    else if (diffDays <= 7) label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    else if (diffDays <= 28) {
      const weekStart = new Date(entryDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      label = 'Week of ' + weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (!currentGroup || currentGroup.label !== label) {
      currentGroup = { label, entries: [] };
      groups.push(currentGroup);
    }
    currentGroup.entries.push(entry);
  }
  return groups;
}

function formatTime(timestamp, isToday) {
  const d = new Date(timestamp);
  if (isToday) {
    const now = new Date('2026-08-09T12:00:00');
    const diffMs = now - d;
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return Math.floor(diffMs / 60000) + 'm ago';
    return diffH + 'h ago';
  }
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function TechHistory() {
  const navigate = useNavigate();
  const groups = groupByDate(TECH_HISTORY);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: '#F3F4F6' }}>
      <TechTopBar />
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ padding: '16px 16px 8px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#14151A' }}>History</div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Your completed actions</div>
        </div>

        {groups.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#9CA3AF' }}>No activity yet — completed pairings, TSOs, and WiFi configurations will appear here.</div>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.label}>
              <div style={{
                padding: '10px 16px 6px',
                fontSize: 12, fontWeight: 600, color: '#6B7280',
                textTransform: group.label === 'Today' || group.label === 'Yesterday' ? 'none' : 'none',
              }}>{group.label}</div>
              {group.entries.map(entry => {
                const typeBadge = TYPE_BADGES[entry.type];
                const resultBadge = entry.result ? RESULT_BADGES[entry.result] : null;
                const isToday = group.label === 'Today';
                const route = entry.type.startsWith('cu') ? `/tech/cu/${entry.entityId}` : `/tech/ws/${entry.entityId}`;
                return (
                  <div
                    key={entry.id}
                    onClick={() => navigate(route)}
                    style={{
                      padding: '10px 16px',
                      background: '#fff',
                      borderBottom: '1px solid #F3F4F6',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                          background: typeBadge.bg, color: typeBadge.color,
                        }}>{typeBadge.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#14151A' }}>{entry.entityName}</span>
                        {resultBadge && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                            background: resultBadge.bg, color: resultBadge.color,
                          }}>{resultBadge.label}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{entry.locationBreadcrumb}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>
                      {formatTime(entry.timestamp, isToday)}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div style={{ height: 20 }} />
      </div>
      <TabBar activeTab="history" />
    </div>
  );
}
