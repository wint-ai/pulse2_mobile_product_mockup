import { useNavigate } from 'react-router-dom';
import { computeWidgets } from '../data/systems';
import { useTheme } from '../context/ThemeContext';

function StatusCard({ icon, title, segments, total, theme, onSegmentClick }) {
  return (
    <div style={{
      background: theme.card, borderRadius: 10, padding: '8px 10px',
      border: theme.cardBorder, flex: 1, minWidth: 0,
      ...(theme.mode === 'light' ? { boxShadow: '0 1px 3px rgba(0,0,0,0.04)' } : {}),
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
        {typeof icon === 'string' && icon.length <= 2 ? (
          <span style={{ fontSize: 14 }}>{icon}</span>
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: 15, color: theme.text }}>{icon}</span>
        )}
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.text, flex: 1 }}>{title}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{total}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {segments.map((seg, i) => {
          if (seg.value === 0) return null;
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div
              key={i}
              onClick={() => seg.filterKey && onSegmentClick(seg.filterKey)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: seg.filterKey ? 'pointer' : 'default', borderRadius: 4, padding: '1px 0' }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: theme.textSecondary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{seg.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{seg.value}</span>
              <span style={{ fontSize: 12, color: theme.textMuted, minWidth: 22, textAlign: 'right' }}>{pct}%</span>
              {seg.filterKey && <span style={{ fontSize: 12, color: theme.textDimmest, marginLeft: 2 }}>{'\u203A'}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function KPICards({ systems, scopeIds }) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const w = computeWidgets(systems);

  // If scopeIds provided, pass them as query param so KPIDetailScreen filters correctly
  const scopeParam = scopeIds ? `?scope=${scopeIds.join(',')}` : '';
  const handleClick = (filterKey) => navigate(`/kpi/${filterKey}${scopeParam}`);

  const commTotal = w.comm.online + w.comm.offline;
  const valveTotal = w.valves.open + w.valves.closed + w.valves.error + w.comm.offline;
  const powerTotal = w.power.ac + w.power.battery + w.power.acLost;

  const commSegments = w.comm.offline > 0
    ? [
        { value: w.comm.online, color: '#04ADEF', label: 'Online', filterKey: 'comm-online' },
        { value: w.comm.offline, color: '#DB4670', label: 'Offline', filterKey: 'comm-offline' },
      ]
    : [
        { value: w.comm.online, color: '#A1D246', label: 'All online', filterKey: 'comm-online' },
      ];

  const powerSegments = [
    { value: w.power.ac, color: '#04ADEF', label: 'AC', filterKey: 'power-ac' },
    { value: w.power.acLost, color: '#DB4670', label: 'AC Lost', filterKey: 'power-ac-lost' },
    { value: w.power.battery, color: '#F05C25', label: 'Battery', filterKey: 'power-battery' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <StatusCard theme={theme} onSegmentClick={handleClick}
          icon="wifi" title="Comm" total={commTotal}
          segments={commSegments}
        />
        <StatusCard theme={theme} onSegmentClick={handleClick}
          icon="⚡" title="Power" total={powerTotal}
          segments={powerSegments}
        />
      </div>
      <StatusCard theme={theme} onSegmentClick={handleClick}
        icon="valve" title="Valves" total={valveTotal}
        segments={[
          { value: w.valves.open, color: '#04ADEF', label: 'Open', filterKey: 'valve-open' },
          { value: w.valves.closed, color: '#717684', label: 'Closed', filterKey: 'valve-closed' },
          { value: w.valves.error, color: '#DB4670', label: 'Error', filterKey: 'valve-error' },
          { value: w.comm.offline, color: theme.textDimmest, label: 'N/A', filterKey: 'valve-na' },
        ]}
      />
    </div>
  );
}
