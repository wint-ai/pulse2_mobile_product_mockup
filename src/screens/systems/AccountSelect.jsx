import { useNavigate } from 'react-router-dom';
import TabBar from '../../components/TabBar';
import { ACCOUNTS } from '../../data/hierarchy';
import { useTheme } from '../../context/ThemeContext';

export default function AccountSelect() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ background: theme.headerBg, borderBottom: theme.headerBorder, padding: '11px 16px', flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: theme.text }}>Systems</div>
        <div style={{ fontSize: 13, color: theme.textTertiary, marginTop: 2 }}>Select account</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 8px', background: theme.bgFlat }}>
        {ACCOUNTS.map(acc => (
          <div
            key={acc.id}
            onClick={() => navigate(`/systems/${acc.id}`)}
            style={{
              background: theme.card, borderRadius: 12, overflow: 'hidden',
              marginBottom: 7, cursor: 'pointer', border: theme.cardBorder,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, fontSize: 14, fontWeight: 700,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: acc.color,
                }}>{acc.id.toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{acc.name}</div>
                  <div style={{ fontSize: 13, color: theme.textTertiary, marginTop: 2 }}>{acc.meta} · {acc.systems} systems</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {acc.alerts > 0 && (
                  <span style={{ fontSize: 13, fontWeight: 700, background: theme.red, color: '#fff', borderRadius: 12, padding: '2px 8px' }}>
                    {acc.alerts}
                  </span>
                )}
                <span style={{ fontSize: 15, color: theme.textDimmest }}>›</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <TabBar activeTab="systems" />
    </div>
  );
}
