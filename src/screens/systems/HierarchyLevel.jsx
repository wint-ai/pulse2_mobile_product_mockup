// Shared component for L1, L2, L3, L4 drill-down screens
import { useNavigate } from 'react-router-dom';
import TabBar from '../../components/TabBar';
import { useTheme } from '../../context/ThemeContext';

function AlertBadge({ count, theme }) {
  if (!count) return null;
  return (
    <span style={{ fontSize: 13, fontWeight: 700, background: theme.red, color: '#fff', borderRadius: 12, padding: '3px 9px' }}>
      {count}
    </span>
  );
}

export default function HierarchyLevel({ title, breadcrumbs, nodes, onNodeClick, levelLabel }) {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const COLORS = ['#04ADEF', '#0D9488', '#7C3AED', '#EA580C', '#A1D246', '#F05C25'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ background: theme.headerBg, borderBottom: theme.headerBorder, padding: '11px 16px', flexShrink: 0 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ fontSize: 15, color: theme.accent, background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 2, marginBottom: 4 }}
        >‹ Back</button>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden', marginBottom: 4 }}>
            {breadcrumbs.map((bc, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {i > 0 && <span style={{ fontSize: 13, color: theme.textDimmest }}>›</span>}
                {i < breadcrumbs.length - 1 ? (
                  <button onClick={() => navigate(bc.path)} style={{ fontSize: 14, color: theme.accent, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', padding: 0 }}>
                    {bc.label}
                  </button>
                ) : (
                  <span style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>{bc.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: theme.text }}>{title}</span>
          {levelLabel && (
            <span style={{ fontSize: 12, color: theme.textTertiary, background: theme.inputBg, padding: '2px 7px', borderRadius: 5, whiteSpace: 'nowrap' }}>
              {levelLabel}
            </span>
          )}
        </div>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 8px', background: theme.bgFlat }}>
        <div style={{ background: theme.card, borderRadius: 12, overflow: 'hidden', border: theme.cardBorder }}>
          {nodes.map((node, i) => (
            <div
              key={node.id}
              onClick={() => onNodeClick(node)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 13px',
                borderBottom: i < nodes.length - 1 ? theme.separator : 'none',
                cursor: 'pointer',
                background: node.alerts > 0 ? (theme.mode === 'dark' ? 'rgba(219,70,112,0.08)' : '#FFFBFB') : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, fontSize: 12, fontWeight: 700,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: COLORS[i % COLORS.length],
                }}>
                  {node.label.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  {node.meta && <div style={{ fontSize: 12, color: theme.textTertiary }}>{node.meta}</div>}
                  <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{node.label}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14, color: theme.textTertiary }}>{node.systems} sys</span>
                <AlertBadge count={node.alerts} theme={theme} />
                <span style={{ fontSize: 16, color: theme.textDimmest }}>›</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <TabBar activeTab="systems" />
    </div>
  );
}
