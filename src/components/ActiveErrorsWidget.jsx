import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const ERROR_ICONS = {
  'valve-error': 'build',
  'power-lost': 'power_off',
  'offline': 'wifi_off',
};

export default function ActiveErrorsWidget({ systems, showViewAll = true }) {
  const navigate = useNavigate();
  const { theme } = useTheme();

  // All non-leak alerts + offline systems
  const errorSystems = [
    ...systems.filter(s => s.alert && s.alert.type !== 'leak-high' && s.alert.type !== 'leak-low'),
    ...systems.filter(s => s.offline && !s.alert),
  ];

  if (errorSystems.length === 0) return null;

  return (
    <div style={{
      background: theme.card, borderRadius: 10,
      border: theme.cardBorder,
      marginBottom: 10, overflow: 'hidden',
    }}>
      <div
        onClick={showViewAll ? () => navigate('/alerts') : undefined}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', borderBottom: `1px solid ${theme.divider}`,
          cursor: showViewAll ? 'pointer' : 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#717684' }}>warning</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>Active Errors</span>
          <span style={{ fontSize: 11, fontWeight: 800, padding: '1px 5px', borderRadius: 6, background: theme.badgeBg, color: theme.textSecondary }}>{errorSystems.length}</span>
        </div>
        {showViewAll && <span style={{ fontSize: 12, color: '#04ADEF', fontWeight: 600 }}>View all →</span>}
      </div>

      <div style={{ maxHeight: 120, overflowY: 'auto' }}>
        {errorSystems.map(sys => {
          const alertType = sys.alert?.type || 'offline';
          const icon = ERROR_ICONS[alertType] || 'warning';
          const description = sys.alert?.label || 'Device offline';
          return (
            <div
              key={sys.id}
              onClick={() => navigate(`/system/${sys.id}`)}
              style={{
                display: 'flex', alignItems: 'center', padding: '6px 12px',
                borderBottom: `1px solid ${theme.divider}`, cursor: 'pointer', gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#717684' }}>{icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: theme.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sys.name}
              </span>
              <span style={{ fontSize: 12, color: theme.textMuted, flexShrink: 0 }}>{description}</span>
              <span style={{ fontSize: 12, color: theme.textFaint, flexShrink: 0 }}>{sys.alert?.age || ''}</span>
              <span style={{ fontSize: 13, color: theme.textDimmest }}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
