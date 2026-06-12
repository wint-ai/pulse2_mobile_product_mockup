import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TabBar from '../../components/TabBar';
import { useTheme } from '../../context/ThemeContext';
import { useUserContext } from '../../context/UserContext';
import { useDataRefresh } from '../../utils/useDataRefresh';

const BARS = [65, 40, 55, 80, 45, 70, 90, 60, 50, 75, 85, 55, 40, 65];

export default function HomeTenant() {
  useDataRefresh();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { visibleSystems = [], persona } = useUserContext() || {};
  const [mode, setMode] = useState('home');
  const [chartTab, setChartTab] = useState('day');

  const sys = visibleSystems[0];
  const sysName = sys?.name || 'My Apartment';
  const hasAlert = !!sys?.alert;
  const valveState = sys?.valve;
  const valveColor = valveState === 'open' ? '#A1D246' : valveState === 'error' ? '#DB4670' : '#717684';
  const valveLabel = valveState === 'open' ? 'Open' : valveState === 'closed' ? 'Closed' : valveState === 'error' ? 'Error' : 'N/A';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{ background: theme.headerBg, borderBottom: theme.headerBorder, padding: '11px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: theme.text }}>Home</div>
            <div style={{ fontSize: 13, color: theme.textTertiary }}>{sysName}</div>
          </div>
          <div style={{
            width: 34, height: 34, borderRadius: 17, background: theme.card,
            border: theme.cardBorder, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
          }}>🔔</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 8px', background: theme.bgFlat }}>
        {/* All clear */}
        <div style={{
          background: theme.clearBg, borderRadius: 11, padding: '11px 13px',
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
          border: theme.clearBorder,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: theme.green, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.green }}>All clear</div>
            <div style={{ fontSize: 13, color: theme.green, marginTop: 1, opacity: 0.7 }}>No active Water Events · system online</div>
          </div>
        </div>

        {/* Home / Away toggle */}
        <div style={{
          background: theme.card, borderRadius: 12, padding: '11px 13px',
          marginBottom: 10, border: theme.cardBorder,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.textTertiary, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 7 }}>
            Mode
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            <button
              onClick={() => setMode('home')}
              style={{
                flex: 1, padding: 10, borderRadius: 9, border: 'none', fontSize: 15, fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer',
                background: mode === 'home' ? theme.clearBg : theme.inputBg,
                color: mode === 'home' ? theme.green : theme.textTertiary,
              }}
            >🏠 Home</button>
            <button
              onClick={() => setMode('away')}
              style={{
                flex: 1, padding: 10, borderRadius: 9, border: 'none', fontSize: 15, fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer',
                background: mode === 'away' ? '#FFF7ED' : theme.inputBg,
                color: mode === 'away' ? theme.orange : theme.textTertiary,
              }}
            >✈️ Away</button>
          </div>
        </div>

        {/* Valve control — tappable */}
        {sys && valveState && (
          <div
            onClick={() => navigate(`/system/${sys.id}`)}
            style={{
              background: theme.card, borderRadius: 14, border: theme.cardBorder,
              overflow: 'hidden', marginBottom: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: valveColor + '18',
                border: `2px solid ${valveColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>{'\uD83D\uDCA7'}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>Water Valve</div>
                <div style={{ fontSize: 14, color: valveColor, fontWeight: 600 }}>{valveLabel}</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: '#04ADEF', fontWeight: 600 }}>Control {'\u203A'}</div>
          </div>
        )}

        {/* Consumption chart */}
        <div style={{ background: theme.card, borderRadius: 12, padding: '11px 13px', marginBottom: 8, border: theme.cardBorder }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>Consumption</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {['day', 'week', 'month'].map(t => (
                <button
                  key={t}
                  onClick={() => setChartTab(t)}
                  style={{
                    fontSize: 12, padding: '3px 7px', borderRadius: 6, border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                    background: chartTab === t ? theme.accent : theme.inputBg,
                    color: chartTab === t ? '#fff' : theme.textTertiary,
                    fontWeight: chartTab === t ? 600 : 400,
                  }}
                >{t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, letterSpacing: '-0.3px' }}>142L</div>
              <div style={{ fontSize: 12, color: theme.textTertiary, marginTop: 1 }}>Today</div>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: theme.green, letterSpacing: '-0.3px' }}>↓ 12%</div>
              <div style={{ fontSize: 12, color: theme.textTertiary, marginTop: 1 }}>vs yesterday</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 40 }}>
            {BARS.map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1, borderRadius: '2px 2px 0 0',
                  height: `${h}%`,
                  background: i === BARS.length - 1 ? theme.accent : (theme.mode === 'dark' ? 'rgba(4,173,239,0.2)' : '#DBF3FC'),
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: theme.textTertiary }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: theme.accent }} />
              Today
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: theme.textTertiary }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: theme.mode === 'dark' ? 'rgba(4,173,239,0.2)' : '#DBF3FC' }} />
              Previous
            </div>
          </div>
        </div>
      </div>

      <TabBar activeTab="home" />
    </div>
  );
}
