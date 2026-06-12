import { useNavigate } from 'react-router-dom';
import { getAccountById } from '../data/accounts';
import { useTheme } from '../context/ThemeContext';

export default function ActiveLeaksWidget({ systems, showViewAll = true }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const leakSystems = systems.filter(s => s.alert?.type === 'leak-high' || s.alert?.type === 'leak-low');
  const highFlows = leakSystems.filter(s => s.alert?.type === 'leak-high');
  const lowFlows = leakSystems.filter(s => s.alert?.type === 'leak-low');

  if (leakSystems.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(161,210,70,0.15), rgba(4,173,239,0.1))',
        borderRadius: 10, padding: '12px 14px', marginBottom: 10,
        border: '1px solid rgba(161,210,70,0.2)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#A1D246', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>No Active Water Events</div>
          <div style={{ fontSize: 12, color: theme.textSecondary }}>All systems operating normally</div>
        </div>
      </div>
    );
  }

  function LeakRow({ sys }) {
    const isHigh = sys.alert?.type === 'leak-high';
    return (
      <div
        onClick={() => navigate(`/alert/${sys.id}`)}
        style={{
          display: 'flex', alignItems: 'center', padding: '6px 12px',
          borderBottom: `1px solid ${theme.divider}`, cursor: 'pointer', gap: 6,
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: isHigh ? '#DB4670' : '#F05C25' }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: theme.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sys.name}
        </span>
        <span style={{ fontSize: 12, color: theme.textMuted, flexShrink: 0 }}>{sys.l4Name || sys.l3Name}</span>
        <span style={{ fontSize: 12, color: theme.textFaint, flexShrink: 0 }}>{sys.alert?.age}</span>
        <span style={{ fontSize: 13, color: theme.textDimmest }}>›</span>
      </div>
    );
  }

  return (
    <div style={{
      background: theme.card, borderRadius: 10,
      border: theme.cardBorder,
      marginBottom: 10, overflow: 'hidden',
    }}>
      {/* Header */}
      <div
        onClick={showViewAll ? () => navigate('/alerts?filter=leak') : undefined}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', borderBottom: `1px solid ${theme.divider}`,
          cursor: showViewAll ? 'pointer' : 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#DB4670', fontVariationSettings: "'FILL' 1" }}>water_drop</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>Active Water Events</span>
          <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 5px', borderRadius: 6, background: '#DB4670', color: '#fff' }}>{leakSystems.length}</span>
        </div>
        {showViewAll && <span style={{ fontSize: 12, color: '#04ADEF', fontWeight: 600 }}>View all →</span>}
      </div>

      {/* Scrollable content */}
      <div style={{ maxHeight: 120, overflowY: 'auto' }}>
        {highFlows.length > 0 && (
          <>
            <div style={{ padding: '5px 12px 2px', fontSize: 11, fontWeight: 800, color: '#DB4670', textTransform: 'uppercase', letterSpacing: '1px' }}>
              High Flow · {highFlows.length}
            </div>
            {highFlows.map(sys => <LeakRow key={sys.id} sys={sys} />)}
          </>
        )}
        {lowFlows.length > 0 && (
          <>
            <div style={{ padding: '5px 12px 2px', fontSize: 11, fontWeight: 800, color: '#F05C25', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Low Flow · {lowFlows.length}
            </div>
            {lowFlows.map(sys => <LeakRow key={sys.id} sys={sys} />)}
          </>
        )}
      </div>
    </div>
  );
}
