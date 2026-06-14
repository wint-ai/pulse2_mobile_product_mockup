import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import TabBar from '../../components/TabBar';
import NavigationDrawer from '../../components/NavigationDrawer';
import SystemInfoTab from './SystemInfoTab';
import ActivityTab from './ActivityTab';
import ConsumptionTab from './ConsumptionTab';
import { getSystemById, getSystemTz } from '../../data/systems';
import { getConsumption } from '../../data/consumption';
import { getActivePolicy, getNextPolicy, getSystemTopology } from '../../data/systemDetails';
import TenantOverview from './TenantOverview';
import { getActiveIncident, getLeakState } from '../../data/incidents';
import { computeActiveEvents } from '../../data/events';
import { parseEventInstant, formatLastSeen } from '../../utils/format';
import LeakSummary from '../../components/LeakSummary';
import WaterEventDetailsWidget from '../../components/WaterEventDetailsWidget';
import TagBottomSheet from '../../components/TagBottomSheet';
import { getTags, addTag, removeTagAt } from '../../data/tagsStore';
import { getCurrentActor } from '../../data/currentUser';
import PipesHeader, { WINT_SKY_SYSTEM_BG, WINT_SKY_SYSTEM_BG_SIZE } from '../../components/PipesHeader';
import OfflineStickyBanner from '../../components/OfflineStickyBanner';
import ValveControlCard from '../../components/ValveControlCard';
import { getAncestorScopes } from '../../utils/ancestorScopes';
import { useTheme } from '../../context/ThemeContext';
import { useUserContext } from '../../context/UserContext';
import { useDataRefresh } from '../../utils/useDataRefresh';
import { computeSystemHealth } from '../../utils/systemHealth';

function isTenantSystem(sys) { return !!sys.homeAway; }

// Material icon helper
function MIcon({ name, size = 18, color, fill, style = {} }) {
  return <span className="material-symbols-outlined" style={{ fontSize: size, color, fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0", ...style }}>{name}</span>;
}

/* ════════════════════════════════════════════════════════════════════════════
   VALVE STATUS CARD (dual valve — Supply + Return for closed loops)
   ════════════════════════════════════════════════════════════════════════ */

// ValveStatusCard for dual-valve systems — TODO: enable when dual-valve data is available

/* ════════════════════════════════════════════════════════════════════════════
   STATUS PILLS (Comm + Power) — icon-in-container pattern
   ════════════════════════════════════════════════════════════════════════ */

export function StatusPills({ sys, theme }) {
  const powerLabel = { ac: 'AC', 'ac-lost': 'AC Lost', battery: 'Battery' };
  const commColor = sys.comm === 'online' ? '#A1D246' : '#DB4670';
  const powerColor = sys.power === 'ac' ? '#A1D246' : sys.power === 'battery' ? '#F05C25' : '#DB4670';

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 10, padding: '0 14px' }}>
      <div style={{ flex: 1, background: theme.card, borderRadius: 10, padding: '12px 14px', border: theme.cardBorder, display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, marginRight: 12, flexShrink: 0, background: commColor + '14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MIcon name="wifi" size={16} color={commColor} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: theme.textMuted }}>Comm</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{sys.comm === 'online' ? 'Online' : 'Offline'}</div>
        </div>
      </div>
      {sys.comm === 'online' && sys.power && (
        <div style={{ flex: 1, background: theme.card, borderRadius: 10, padding: '12px 14px', border: theme.cardBorder, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, marginRight: 12, flexShrink: 0, background: powerColor + '14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MIcon name="bolt" size={16} color={powerColor} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: theme.textMuted }}>Power</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{powerLabel[sys.power] || sys.power}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ALERT BANNER (non-water alert path; "All Clear" component removed 2026-06-13)
   ════════════════════════════════════════════════════════════════════════ */

// Note: the legacy AllClear banner was removed 2026-06-13. "All Clear" framing
// implied a global system state and contradicted any active health issue
// surfaced by the Health widget below. The Water Event widget handles its own
// empty state ("No active Water Events") and reports only on its dimension.

const TYPE_LABELS = { 'leak-high': 'High Flow', 'leak-low': 'Low Flow', 'valve-error': 'Valve Error', 'power-lost': 'Power Lost', 'offline': 'Offline' };

export function AlertBanner({ sys, navigate, theme }) {
  const alert = sys.alert;
  if (!alert) return null;

  // Valve errors and power-lost already shown in Protection Status
  if (alert.type === 'valve-error' || alert.type === 'power-lost' || alert.type === 'offline') return null;

  const isLeak = alert.type === 'leak-high' || alert.type === 'leak-low';
  if (!isLeak) return null;

  // Pull the matching event for full timestamp + durationSec.
  // Use the same source as /alerts (computeActiveEvents derives from systems + incidents) to keep parity.
  const event = computeActiveEvents().find(e => e.system === sys.id);
  const incident = getActiveIncident(sys.id);
  const policy = getActivePolicy(sys.id);
  const leakLevel = alert.type === 'leak-high' ? 'high' : 'low';
  const leakState = getLeakState(incident);
  const hasValve = sys.valve !== null && sys.valve !== undefined;
  const autoShutoff = !hasValve
    ? null
    : policy?.autoShutoff === 'On' ? 'Enabled'
    : policy?.autoShutoff === 'Off' ? 'Disabled'
    : null;

  const systemTz = getSystemTz(sys);
  return (
    <div style={{ marginBottom: 10 }}>
      <LeakSummary
        level={leakLevel}
        state={leakState}
        instant={parseEventInstant(event?.timestamp, systemTz)}
        systemTz={systemTz}
        flowRate={alert.flowRate}
        autoShutoff={autoShutoff}
        valveState={sys.valve ?? null}
        detectionMode={policy?.detection || null}
        onClick={() => navigate(`/alert/${sys.id}`)}
      />
      <div
        onClick={() => navigate(`/alert/${sys.id}`)}
        style={{ fontSize: 14, color: theme.accent, fontWeight: 600, cursor: 'pointer', padding: '8px 14px 0' }}
      >View details &rarr;</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   HOME / AWAY widget moved to src/components/HomeAwayWidget.jsx (round 6).
   The legacy HomeAwayToggle below is dead code; never called. Kept temporarily
   for git blame continuity until the next cleanup pass.
   ════════════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line no-unused-vars
function _LegacyHomeAwayToggle({ theme }) {
  const [mode, setMode] = useState('home');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);

  const handleSwitch = (newMode) => {
    if (newMode === mode) return;
    setPendingMode(newMode);
    setShowConfirm(true);
  };

  const confirmSwitch = () => {
    setMode(pendingMode);
    setShowConfirm(false);
    setPendingMode(null);
  };

  const confirmText = pendingMode === 'away'
    ? 'When set to Away, water will be automatically shut off if a leak is detected.'
    : 'When set to Home, water will only be shut off if auto shut-off is enabled by the user.';

  return (
    <>
      <div style={{ background: theme.card, borderRadius: 10, padding: '12px 14px', marginBottom: 10, border: theme.cardBorder }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '.4px' }}>Mode</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'home', icon: '\uD83C\uDFE0', label: 'Home' },
            { key: 'away', icon: '\u2708\uFE0F', label: 'Away' },
          ].map(opt => (
            <div key={opt.key} onClick={() => handleSwitch(opt.key)} style={{
              flex: 1, padding: '10px 10px', borderRadius: 8, textAlign: 'center', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: mode === opt.key ? (opt.key === 'home' ? 'rgba(161,210,70,0.12)' : 'rgba(4,173,239,0.12)') : theme.headerBg,
              border: mode === opt.key ? (opt.key === 'home' ? '1.5px solid rgba(161,210,70,0.3)' : '1.5px solid rgba(4,173,239,0.3)') : '1.5px solid transparent',
              transition: 'all 0.2s ease',
            }}>
              <span style={{ fontSize: 16 }}>{opt.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: mode === opt.key ? theme.text : theme.textTertiary }}>{opt.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation */}
      {showConfirm && (
        <div onClick={() => setShowConfirm(false)} style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: theme.modalBg, borderRadius: '20px 20px 0 0', padding: '8px 20px 28px', boxShadow: '0 -4px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 36, height: 4, background: theme.textDimmest, borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: theme.text, textAlign: 'center', marginBottom: 6 }}>
              Switch to {pendingMode === 'away' ? 'Away' : 'Home'}?
            </div>
            <div style={{ fontSize: 15, color: theme.textTertiary, textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
              {confirmText}
            </div>
            <button onClick={confirmSwitch} style={{
              width: '100%', padding: '15px 0', borderRadius: 14, border: 'none',
              fontSize: 16, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              background: pendingMode === 'away' ? '#04ADEF' : '#A1D246', marginBottom: 10,
            }}>
              Yes, Switch to {pendingMode === 'away' ? 'Away' : 'Home'}
            </button>
            <button onClick={() => setShowConfirm(false)} style={{
              width: '100%', padding: '13px 0', borderRadius: 14,
              border: theme.cardBorder, background: theme.card,
              fontSize: 15, fontWeight: 600, color: theme.textSecondary, cursor: 'pointer', fontFamily: 'inherit',
            }}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   WATER TODAY — compact chart
   ════════════════════════════════════════════════════════════════════════ */

function WaterToday({ sys, theme }) {
  const [compareMode, setCompareMode] = useState(true);
  const [tappedIdx, setTappedIdx] = useState(null);

  // Consumption stays visible when the system is offline - historical
  // data is cloud-aggregated, not real-time from the device.
  // Confirmed rule (Rami 2026-06-06).
  const data = getConsumption(sys.id, sys.name);

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Build monthly totals: "YYYY-MM" → liters
  const monthlyTotals = {};
  for (const d of data.daily) {
    const dt = new Date(d.date);
    const key = `${dt.getFullYear()}-${String(dt.getMonth()).padStart(2, '0')}`;
    monthlyTotals[key] = (monthlyTotals[key] || 0) + d.liters;
  }

  // Build last 12 months as YoY pairs (this year + last year)
  const today = new Date(2026, 3, 12);
  const groups = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const yearKey = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    const prevYearKey = `${d.getFullYear() - 1}-${String(d.getMonth()).padStart(2, '0')}`;
    groups.push({
      label: MONTH_NAMES[d.getMonth()],
      year: d.getFullYear(),
      thisYear: monthlyTotals[yearKey] || 0,
      lastYear: monthlyTotals[prevYearKey] || 0,
    });
  }
  const allValues = compareMode
    ? groups.flatMap(g => [g.thisYear, g.lastYear])
    : groups.map(g => g.thisYear);
  const maxVal = Math.max(...allValues, 1);
  const yTicks = [1, 0.75, 0.5, 0.25, 0];
  const fmtNum = (n) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
    return Math.round(n).toString();
  };
  const tapped = tappedIdx != null ? groups[tappedIdx] : null;
  const currentMonth = groups[groups.length - 1];
  const yoyDiff = currentMonth.lastYear > 0
    ? Math.round(((currentMonth.thisYear - currentMonth.lastYear) / currentMonth.lastYear) * 100)
    : 0;

  const dk = theme.mode === 'dark' || theme.mode === 'ocean' || theme.mode === 'gradient' || theme.mode === 'midnight';
  const yoyColor = yoyDiff > 0 ? '#DB4670' : yoyDiff < 0 ? '#5C9E1A' : theme.textTertiary;
  const thisYearColor = '#04ADEF';
  const lastYearColor = dk ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)';

  return (
    <div style={{ background: theme.card, borderRadius: 10, padding: '14px', marginBottom: 10, border: theme.cardBorder }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '.4px' }}>This Month</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: theme.text, marginTop: 2 }}>{currentMonth.thisYear.toLocaleString()}<span style={{ fontSize: 15, fontWeight: 500, color: theme.textTertiary }}>L</span></div>
        </div>
        {compareMode && currentMonth.lastYear > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: theme.textMuted }}>vs same month last year</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: yoyColor }}>
              {yoyDiff > 0 ? '↑' : yoyDiff < 0 ? '↓' : ''} {Math.abs(yoyDiff)}%
            </div>
          </div>
        )}
      </div>
      {/* Legend + Compare toggle switch */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, background: thisYearColor, borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: theme.textTertiary }}>{today.getFullYear()}</span>
          </div>
          {compareMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, background: lastYearColor, borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: theme.textTertiary }}>{today.getFullYear() - 1}</span>
            </div>
          )}
        </div>
        <div onClick={() => { setCompareMode(c => !c); setTappedIdx(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: theme.textTertiary }}>Compare</span>
          <div style={{
            width: 30, height: 18, borderRadius: 9, position: 'relative',
            background: compareMode ? thisYearColor : (dk ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'),
            transition: 'background 0.2s',
          }}>
            <div style={{
              position: 'absolute', top: 2, left: compareMode ? 14 : 2,
              width: 14, height: 14, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <div style={{ minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        {tapped && (
          <div style={{
            background: '#1B2838', borderRadius: 8, padding: '6px 12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)', display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{tapped.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                {tapped.thisYear.toLocaleString()}<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginLeft: 2 }}>L &middot; {tapped.year}</span>
              </div>
              {compareMode && tapped.lastYear > 0 && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                  {tapped.lastYear.toLocaleString()}<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginLeft: 2 }}>L &middot; {tapped.year - 1}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chart with Y-axis */}
      <div style={{ display: 'flex', gap: 6 }}>
        {/* Y-axis labels */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 90 }}>
          {yTicks.map(t => (
            <div key={t} style={{ fontSize: 9, color: theme.textMuted, textAlign: 'right', lineHeight: 1, minWidth: 24 }}>
              {fmtNum(maxVal * t)}
            </div>
          ))}
        </div>
        {/* Chart area */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Horizontal grid lines */}
          <div style={{ position: 'absolute', inset: 0, height: 90, pointerEvents: 'none' }}>
            {yTicks.map((t, i) => (
              <div key={i} style={{
                position: 'absolute', left: 0, right: 0,
                top: `${(1 - t) * 100}%`,
                height: 1, background: dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              }} />
            ))}
          </div>
          {/* Bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90, position: 'relative' }}>
            {groups.map((g, i) => {
              const isTapped = tappedIdx === i;
              return (
                <div key={i}
                  onClick={() => setTappedIdx(isTapped ? null : i)}
                  style={{
                    flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end',
                    gap: 1, minWidth: 0, cursor: 'pointer',
                    opacity: tappedIdx != null && !isTapped ? 0.5 : 1,
                    transition: 'opacity 0.15s',
                  }}>
                  {compareMode && (
                    <div style={{
                      flex: 1, borderRadius: '2px 2px 0 0', minWidth: 0,
                      height: `${(g.lastYear / maxVal) * 100}%`,
                      background: lastYearColor,
                      minHeight: g.lastYear > 0 ? 1 : 0,
                    }} />
                  )}
                  <div style={{
                    flex: 1, borderRadius: '2px 2px 0 0', minWidth: 0,
                    height: `${(g.thisYear / maxVal) * 100}%`,
                    background: thisYearColor,
                    minHeight: g.thisYear > 0 ? 1 : 0,
                  }} />
                </div>
              );
            })}
          </div>
          {/* X-axis labels */}
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {groups.map((g, i) => (
              <div key={i} style={{ flex: 1, fontSize: 9, color: theme.textMuted, textAlign: 'center', minWidth: 0 }}>
                {g.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ACTIVE POLICY CARD (Pro only)
   ════════════════════════════════════════════════════════════════════════ */

// One row of the fields grid — small label + field pill below.
function PolicyField({ label, value, theme }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: theme.textTertiary, marginBottom: 4 }}>{label}</div>
      <span style={{
        display: 'inline-block', padding: '5px 10px', borderRadius: 8,
        background: theme.card, border: `1px solid ${theme.cardBorderColor || '#E5E8EE'}`,
        fontSize: 13, fontWeight: 700, color: theme.text,
      }}>{value}</span>
    </div>
  );
}

// Single policy card — used twice (active + next).
function PolicyCard({ kind, policy, theme }) {
  const isActive = kind === 'active';
  const tint = isActive ? 'rgba(92,158,26,0.10)' : (theme.card);
  const borderColor = isActive ? 'rgba(92,158,26,0.25)' : (theme.cardBorderColor || '#E5E8EE');
  return (
    <div style={{
      background: tint,
      border: `1px solid ${borderColor}`,
      borderRadius: 14,
      padding: '14px 16px',
      marginBottom: 10,
    }}>
      {/* Badge + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 6,
          letterSpacing: '.4px',
          background: isActive ? '#5C9E1A' : (theme.divider || '#E5E8EE'),
          color: isActive ? '#fff' : (theme.textSecondary || theme.text),
        }}>{isActive ? 'ACTIVE' : 'NEXT'}</span>
        <span style={{ fontSize: 17, fontWeight: 700, color: theme.text, letterSpacing: '-0.3px' }}>{policy.name}</span>
      </div>

      {/* Hours — second thing the eye sees, by Rami's call */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14,
        fontSize: 13, fontWeight: 700, color: theme.text, fontVariantNumeric: 'tabular-nums',
      }}>
        <span className="material-symbols-outlined" style={{
          fontSize: 16, color: isActive ? '#2F6112' : theme.textTertiary,
        }}>schedule</span>
        <span>{policy.schedule}</span>
      </div>

      {/* 2x2 fields grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 16px' }}>
        <PolicyField label="Auto shutoff"        value={policy.autoShutoff}       theme={theme} />
        <PolicyField label="Alert"               value={policy.alert}             theme={theme} />
        <PolicyField label="Default valve state" value={policy.defaultValveState} theme={theme} />
        <PolicyField label="Detection mode"      value={policy.detection}         theme={theme} />
      </div>
    </div>
  );
}

function ActivePolicyCard({ sys, theme }) {
  const active = getActivePolicy(sys.id);
  const next   = getNextPolicy(sys.id);

  // Date pill — today, formatted like "Thu, Apr 23".
  const now = new Date();
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;

  return (
    <div>
      {/* Section header — title + date pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: theme.textSecondary }}>policy</span>
        <span style={{ flex: 1, fontSize: 16, fontWeight: 700, color: theme.text, letterSpacing: '-0.2px' }}>Action Policy</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, color: theme.textTertiary,
          background: theme.card, border: `1px solid ${theme.cardBorderColor || '#E5E8EE'}`,
          padding: '4px 9px', borderRadius: 8,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>calendar_today</span>
          {dateStr}
        </span>
      </div>

      {/* Two stacked cards — active + next, both fully expanded. */}
      <PolicyCard kind="active" policy={active} theme={theme} />
      <PolicyCard kind="next"   policy={next}   theme={theme} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PROTECTION STATUS (single system) — WINT drop / circle
   ════════════════════════════════════════════════════════════════════════ */

// WINT water drop SVG shape
function WintDrop({ color, size = 28 }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 32 39" fill="none" style={{ flexShrink: 0 }}>
      <path fillRule="evenodd" clipRule="evenodd"
        d="M30.2 30.5C29.1 34.6 25.2 37.5 20.5 37.5C15.8 37.5 11.9 34.6 10.8 30.5C10.1 27.8 11.2 24.7 14.1 21.5L20.5 14L26.9 21.5C29.8 24.7 30.9 27.8 30.2 30.5Z"
        transform="translate(-5, -10)" fill={color} />
    </svg>
  );
}

// formatLastSeen moved to src/utils/format.js (shared with TenantOverview).

function ProtectionStatusCard({ sys, theme }) {
  // expanded: when true, the passing (green) rows are appended below the
  // failing rows. Failing rows are ALWAYS visible (H2 — locked 2026-06-08).
  const [expanded, setExpanded] = useState(false);
  // Recipients row open state — replaces the old contacts bottom-sheet modal.
  // Inline expansion below the row showing avatar + name + channel chips.
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  // "What does Healthy mean?" tooltip — restored 2026-06-04 per Rami. The
  // healthy state is otherwise opaque (just a green shield + the word
  // "Healthy") so a tap on the info icon reveals the canonical definition.
  const [showHealthInfo, setShowHealthInfo] = useState(false);

  // Shared health check — drawer + system page MUST agree. See utils/systemHealth.js.
  const { isComm, valveOk, powerOk, hasRecipients, allOk, issueCount } = computeSystemHealth(sys);

  const isExpanded = expanded;

  // Variant A palette — same muted red used by the Home Systems Health bar /
  // counter and the Status Overview "bad" pills, so health drift reads as one
  // signal across the app. Green when all healthy.
  const ringColor = allOk ? '#5C9E1A' : '#A5455E';
  const iconBg = allOk ? 'rgba(92,158,26,0.10)' : 'rgba(165,69,94,0.10)';
  const iconColor = ringColor;
  const titleColor = allOk ? '#2F6112' : '#A5455E';

  const valveLabel = sys.valve === 'open' ? 'Open' : sys.valve === 'closed' ? 'Closed' : sys.valve === 'error' ? 'Error' : null;
  const contacts = sys.contacts || [];

  // Per-dimension explanation copy for failing rows. Locked in
  // public/reviews/system-health-card.html design notes.
  const WHY = {
    comm:       'It has been too long since the system communicated with the Cloud.',
    valve:      'The valve is reporting an error and needs attention.',
    power:      'The system is disconnected from its power source.',
    recipients: 'No one is registered to receive alert notifications from this system.',
  };

  const lastSeenLine = `Last communicated: ${formatLastSeen(sys.lastSeen)}`;

  const checks = [
    { key: 'comm',  label: 'Communications', value: isComm ? 'Online' : 'Offline', ok: isComm, why: WHY.comm, meta: lastSeenLine },
    ...(sys.valve != null
      ? [{ key: 'valve', label: 'Valve',          value: valveLabel,                                                ok: valveOk,      why: WHY.valve }]
      : []),
    ...(sys.power != null
      ? [{ key: 'power', label: 'Ext. Power',     value: powerOk ? 'Connected' : 'Disconnected',                    ok: powerOk,      why: WHY.power }]
      : []),
    { key: 'recipients', label: 'Alert recipients',
      value: hasRecipients ? `${contacts.length} ${contacts.length === 1 ? 'person' : 'people'}` : 'None',
      ok: hasRecipients, tappable: hasRecipients, why: WHY.recipients },
  ];

  // When issues, build a short summary line for the subtitle.
  const failingLabels = checks.filter(c => !c.ok).map(c => c.label);
  const subtitle = failingLabels.length === 1
    ? failingLabels[0]
    : failingLabels.slice(0, 2).join(' · ') + (failingLabels.length > 2 ? ` + ${failingLabels.length - 2}` : '');

  // H2 — locked 2026-06-08: issue rows visible by default. H3 — expand reveals
  // the passing (green) rows. Issue rows stay where they are.
  const issueRows = checks.filter(c => !c.ok);
  const passingRows = checks.filter(c => c.ok);

  return (
    <>
      <div style={{
        background: theme.card,
        border: `1px solid ${theme.cardBorderColor || '#E5E8EE'}`,
        borderRadius: 14,
        boxShadow: '0 1px 3px rgba(20,21,26,0.05)',
        marginBottom: 8,
        overflow: 'hidden',
      }}>
        {/* Header — not tappable. Locked round 7 (H10): the bare header
            chevron was confusing because issues are already visible. The
            expand affordance moved to a labeled text-link inside the body
            (see § Show/Hide passing checks below). */}
        <div style={{
          padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: iconBg,
            border: `2px solid ${ringColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span className="material-symbols-outlined" style={{
              fontSize: 18, color: iconColor, fontVariationSettings: "'FILL' 1",
            }}>shield</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: titleColor, letterSpacing: '-0.2px' }}>
                {allOk ? 'Healthy' : `${issueCount} issue${issueCount !== 1 ? 's' : ''}`}
              </span>
              {allOk && (
                <span
                  onClick={() => setShowHealthInfo(v => !v)}
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: theme.textTertiary, cursor: 'pointer' }}
                  title="What does Healthy mean?"
                >info</span>
              )}
            </div>
            {!allOk && (
              <div style={{
                fontSize: 12, color: theme.textSecondary, fontWeight: 500, marginTop: 1,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{subtitle}</div>
            )}
          </div>
        </div>

        {/* "What does Healthy mean?" tooltip — only visible in the healthy
            state when the info icon was tapped. Canonical copy locked in
            public/reviews/system-health-card.html design notes. */}
        {allOk && showHealthInfo && (
          <div style={{ padding: '0 14px 12px' }}>
            <div style={{
              background: theme.inputBg, borderRadius: 8, padding: '10px 12px',
              fontSize: 12, lineHeight: 1.55, color: theme.textSecondary,
            }}>
              A system is <b style={{ color: theme.text }}>Healthy</b> when it communicated within its expected window, has no valve or external-power errors, and has at least one user registered to receive Water Event and Error notifications.
            </div>
          </div>
        )}

        {/* Body — issue rows always visible (issue state); passing rows behind
            a 'Show N passing checks' text-link (both states).
            Recipients row opens inline (no bottom-sheet modal).
            Healthy state (2026-06-09): widget IS expandable - shows the
            "Show N passing checks" text-link so the user can verify each
            dimension is OK. Previously the healthy state had no body, which
            made the widget feel un-tappable. */}
        {(issueRows.length > 0 || passingRows.length > 0) && (
          <div style={{ padding: '0 14px 12px' }}>
            {/* Issue rows — always visible when present */}
            {issueRows.map(c => (
              <HealthRow key={c.key} c={c} theme={theme} contacts={contacts} recipientsOpen={recipientsOpen} setRecipientsOpen={setRecipientsOpen} />
            ))}

            {/* Show/Hide passing checks text-link.
                - In issue state: separates issue rows from passing rows with a
                  border-top divider.
                - In healthy state: no divider above (nothing's above it). */}
            {passingRows.length > 0 && (
              <div
                onClick={() => setExpanded(v => !v)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 600, color: theme.accent || '#036AB5',
                  padding: '8px 0',
                  cursor: 'pointer', userSelect: 'none',
                  marginTop: issueRows.length > 0 ? 4 : 0, width: '100%',
                  borderTop: issueRows.length > 0 ? `1px solid ${theme.divider || '#EEF1F5'}` : 'none',
                }}>
                {isExpanded ? 'Hide passing checks' : `Show ${passingRows.length} passing check${passingRows.length !== 1 ? 's' : ''}`}
                <span className="material-symbols-outlined" style={{
                  fontSize: 16, color: theme.accent || '#036AB5',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.15s',
                }}>expand_more</span>
              </div>
            )}

            {/* Passing rows — revealed when expanded */}
            {isExpanded && passingRows.map(c => (
              <HealthRow key={c.key} c={c} theme={theme} contacts={contacts} recipientsOpen={recipientsOpen} setRecipientsOpen={setRecipientsOpen} />
            ))}
          </div>
        )}

      </div>
    </>
  );
}

// Single row in the System Health body. Shared by issue-rows and passing-rows
// so the rendering stays consistent across both groups.
function HealthRow({ c, theme, contacts, recipientsOpen, setRecipientsOpen }) {
  const isOpen = c.key === 'recipients' && recipientsOpen;
  return (
    <div>
      <div
        onClick={c.tappable ? () => setRecipientsOpen(v => !v) : undefined}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0',
          borderTop: `1px solid ${theme.divider || '#EEF1F5'}`,
          cursor: c.tappable ? 'pointer' : 'default',
        }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
          background: c.ok ? '#5C9E1A' : '#E5A100',
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{c.label}</span>
            <span style={{
              fontSize: 13, whiteSpace: 'nowrap',
              color: c.ok ? theme.textTertiary : '#8C5A0F',
              fontWeight: c.ok ? 500 : 700,
            }}>{c.value}</span>
          </div>
          {!c.ok && c.why && (
            <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 3, lineHeight: 1.4 }}>
              {c.why}
            </div>
          )}
          {c.meta && (
            <div style={{
              fontSize: 12,
              color: c.ok ? theme.textTertiary : theme.textSecondary,
              marginTop: 3, lineHeight: 1.4,
              fontVariantNumeric: 'tabular-nums',
            }}>{c.meta}</div>
          )}
        </div>
        {c.tappable && (
          <span className="material-symbols-outlined" style={{
            fontSize: 18, color: isOpen ? theme.text : theme.textDimmest,
            marginTop: 2,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.15s',
          }}>expand_more</span>
        )}
      </div>

      {/* Inline recipients sub-list (H4 — locked 2026-06-08). */}
      {isOpen && (
        <div style={{ marginLeft: 18, marginTop: 4, paddingTop: 4, borderTop: `1px dashed ${theme.divider || '#E2E6EB'}` }}>
          {contacts.map((c2, idx) => (
            <RecipientInlineRow key={idx} contact={c2} idx={idx} theme={theme} />
          ))}
        </div>
      )}
    </div>
  );
}

// Recipient row for the inline Alert-recipients expansion. Avatar (initials)
// + name + channel chips. Channel data is synthesized from a stable pattern
// for demo realism (each person gets a meaningful mix of Push / SMS / Email).
const HEALTH_AVATAR_COLORS = ['#036AB5', '#5C9E1A', '#8C5A0F', '#A5455E', '#6B7280'];
function RecipientInlineRow({ contact, idx, theme }) {
  const name = contact?.name || '-';
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() || '?';

  // Channel mix - same pattern used in WaterEventDetailsWidget for consistency.
  const hasPush  = idx % 3 !== 2;
  const hasEmail = contact?.email && idx % 2 === 0;
  const hasSms   = !hasEmail || idx % 4 === 0;

  const chips = [
    hasPush  && { key: 'push',  label: 'Push',  icon: 'notifications', color: '#036AB5' },
    hasSms   && { key: 'sms',   label: 'SMS',   icon: 'sms',           color: '#5C9E1A' },
    hasEmail && { key: 'email', label: 'Email', icon: 'mail',          color: '#8C5A0F' },
  ].filter(Boolean);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: HEALTH_AVATAR_COLORS[idx % HEALTH_AVATAR_COLORS.length] + '24',
        color: HEALTH_AVATAR_COLORS[idx % HEALTH_AVATAR_COLORS.length],
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: theme.text }}>{name}</div>
      <div style={{ display: 'inline-flex', gap: 6, flexShrink: 0 }}>
        {chips.map(ch => (
          <span key={ch.key} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600,
            background: '#F4F6FA', color: theme.textSecondary,
            borderRadius: 6, padding: '3px 7px',
          }}>
            <span className="material-symbols-outlined"
              style={{ fontSize: 13, color: ch.color, fontVariationSettings: "'FILL' 1" }}>{ch.icon}</span>
            {ch.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   OVERVIEW TAB
   ════════════════════════════════════════════════════════════════════════ */

function OverviewTab({ sys, navigate }) {
  const { theme } = useTheme();
  const tenant = isTenantSystem(sys);

  // Tenant systems get a completely different Overview anatomy (hero mode
  // card, health row only when there's an issue, valve, consumption). See
  // TenantOverview.jsx + design-options/tenant-system-page-options.html.
  if (tenant) {
    return <TenantOverview sys={sys} navigate={navigate} />;
  }

  // Water Event Details widget replaces the legacy AlertBanner for water events.
  // The widget surfaces the full event + the inline action row (Tag / Ignore / On it),
  // so the user no longer navigates to a separate alert page to handle the event.
  const isWaterEvent = sys.alert?.type === 'leak-high' || sys.alert?.type === 'leak-low';

  return (
    <div style={{ flex: 1, overflowY: 'auto', paddingTop: 10 }}>
      <div style={{ padding: '0 14px' }}>
        {/* Water Event widget always renders. When there's an active water
            event it shows the full active card; when there isn't, it shows
            the empty state ("No active Water Events"). The widget stays
            visible so users always have a positive water-event indicator
            regardless of other alerts on the system. "All Clear" framing
            was dropped 2026-06-13 -- the widget reports water only, not
            global system status. */}
        <WaterEventDetailsWidget sys={sys} />
        {!isWaterEvent && <AlertBanner sys={sys} navigate={navigate} theme={theme} />}
        <ProtectionStatusCard sys={sys} theme={theme} />
        <ValveControlCard sys={sys} />
      </div>

      {/* Consumption is now a first-class part of the Overview tab —
          moved here from its own tab. The Active Policy card moved out of
          Overview into the renamed "Policy" tab. */}
      <ConsumptionTab sys={sys} />
    </div>
  );
}

// Policy tab — wraps the existing ActivePolicyCard until the policy surface
// gets its own dedicated redesign. Non-tenants only — tenants don't manage
// policies, so they don't see this tab.
function PolicyTab({ sys }) {
  const { theme } = useTheme();
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 14px' }}>
      <ActivePolicyCard sys={sys} theme={theme} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB CONFIG
   ════════════════════════════════════════════════════════════════════════ */

function getTabsForSystem(sys) {
  // Consumption is now folded into Overview. The middle tab becomes Policy
  // for non-tenants (wraps the Active Policy card). Tenants don't have a
  // policy surface so the tab is dropped for them.
  return isTenantSystem(sys)
    ? [
        { key: 'overview', label: 'System' },
        { key: 'activity', label: 'Timeline' },
      ]
    : [
        { key: 'overview', label: 'System' },
        { key: 'policy',   label: 'Policy' },
        { key: 'activity', label: 'Timeline' },
        { key: 'info',     label: 'Info' },
      ];
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════════ */

export default function SystemDetail() {
  useDataRefresh();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { systemId } = useParams();
  const { visibleSystems = [], setSelectedScope } = useUserContext() || {};
  const sys = getSystemById(systemId) || getSystemById('ct1');
  // Deep-link support — Alerts → History → tap event lands here with
  //   ?tab=activity&event=<eventId>
  // so the Timeline tab opens with that event pre-expanded.
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const focusEventId = searchParams.get('event');
  const [activeTab, setActiveTab] = useState(initialTab);
  const tenant = isTenantSystem(sys);
  const isSingleTenantHome = tenant && visibleSystems.length === 1;
  const tabs = getTabsForSystem(sys);

  // Tag bottom sheet handler — lifted from WaterEventDetailsWidget so the
  // Tag CTA on a "Water Event ended" push still works AFTER the widget has
  // been tombstoned (sys.alert = null on End of Leak). Reads ?action=tag
  // from the URL just like the widget did; this is the universal place
  // since the widget may not be on screen.
  const [pageTagSheetOpen, setPageTagSheetOpen] = useState(false);
  const [tagBumper, setTagBumper] = useState(0);
  useEffect(() => {
    if (searchParams.get('action') === 'tag') {
      setPageTagSheetOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('action');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  // bumper is just a re-render trigger; getTags is a stateless read
  // eslint-disable-next-line no-unused-vars
  const _tagRead = tagBumper;
  const currentTagList = sys && sys.id ? getTags(sys.id) : [];

  // Navigation drawer — opens automatically when navigated from the systems drawer
  const [drawerOpen, setDrawerOpen] = useState(() => {
    const flag = sessionStorage.getItem('pulse2-drawer-open');
    if (flag) { sessionStorage.removeItem('pulse2-drawer-open'); return true; }
    return false;
  });

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
      background: WINT_SKY_SYSTEM_BG,
      backgroundSize: WINT_SKY_SYSTEM_BG_SIZE,
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'local',
    }}>
      {/* Header — Wint Sky System variant (ui-improvements-take-1, locked
          2026-06-10). Same wave SVG as Home but rendered at half opacity
          (0.05/0.03/0.02 vs Home's 0.10/0.06/0.04) so the System page reads
          as calmer / deeper-in-hierarchy without changing widget shapes.
          PipesHeader is transparent (glow=true); the page bg shows through. */}
      <PipesHeader glow={true}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px 0', gap: 10 }}>
          {!isSingleTenantHome && (
            // Tenants don't open the full navigation drawer — that surface is
            // built for fleet managers (account/region/building tree, favorites,
            // multi-issue health). Tenants navigate between their apartments via
            // the /tenant home page only; the "My properties" breadcrumb above
            // takes them there.
            <div onClick={tenant ? undefined : () => setDrawerOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: tenant ? 'default' : 'pointer' }}
              role={tenant ? undefined : 'button'}
              aria-label={tenant ? undefined : 'Switch system or location'}
              title={tenant ? undefined : 'Switch system or location'}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(11,149,248,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid rgba(11,149,248,0.20)',
              }}>
                <span className="material-symbols-outlined"
                  style={{ fontSize: 22, color: '#036AB5', fontVariationSettings: "'FILL' 1" }}>home_work</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Breadcrumb:
                     - Tenant + multi-apt → "My properties ›" (back to /tenant list).
                     - Tenant + 1 apt    → no crumb (nowhere to go back to).
                     - Non-tenant        → "My Systems › L1 › L2 › ..." chain.
                    stopPropagation so a crumb tap doesn't also open the drawer. */}
                {(() => {
                  const crumbStyle = { color: '#036AB5', textDecoration: 'underline', cursor: 'pointer' };
                  const sepStyle = { color: '#B8BCC4', margin: '0 4px' };

                  if (tenant) {
                    if (visibleSystems.length <= 1) return null;
                    return (
                      <div style={{ fontSize: 12, color: '#4A4F5A', lineHeight: 1.4, marginBottom: 2 }}>
                        <span
                          onClick={(e) => { e.stopPropagation(); navigate('/tenant'); }}
                          style={crumbStyle}
                        >My properties</span>
                        <span style={sepStyle}>›</span>
                      </div>
                    );
                  }

                  // Bug fix 2026-06-09: only show ancestors that are WITHIN
                  // the user's visible scope. Mark Cohen scoped to Tower One
                  // previously saw "My Systems > Tidhar > UK > Manchester >
                  // Tower One"; he now sees just "My Systems > Tower One"
                  // because the levels above Tower One are outside his scope.
                  // Filter rule: keep an ancestor only if every system in
                  // its subtree is visible to the user.
                  const visibleSystemIds = new Set(visibleSystems.map(s => s.id));
                  const allAncestors = getAncestorScopes(sys);
                  const ancestors = allAncestors.filter(a =>
                    Array.isArray(a.systemIds) &&
                    a.systemIds.length > 0 &&
                    a.systemIds.every(id => visibleSystemIds.has(id))
                  );
                  return (
                    <div style={{ fontSize: 12, color: '#4A4F5A', lineHeight: 1.4, marginBottom: 2, wordBreak: 'break-word' }}>
                      <span
                        onClick={(e) => { e.stopPropagation(); setSelectedScope?.(null); navigate('/'); }}
                        style={crumbStyle}
                      >My Systems</span>
                      {ancestors.map((a) => (
                        <span key={a.id}>
                          <span style={sepStyle}>›</span>
                          <span
                            onClick={(e) => { e.stopPropagation(); setSelectedScope?.(a); navigate('/'); }}
                            style={crumbStyle}
                          >{a.name}</span>
                        </span>
                      ))}
                    </div>
                  );
                })()}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#14151A', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sys.name}
                  </span>
                  {!tenant && (
                    <span className="material-symbols-outlined"
                      style={{ fontSize: 22, color: '#4A4F5A', flexShrink: 0, marginLeft: 2 }}>expand_more</span>
                  )}
                </div>
                {tenant && visibleSystems.length > 1 && (sys.l4Name || sys.l3Name) && (
                  <div style={{
                    fontSize: 13, fontWeight: 500, color: '#4A4F5A',
                    marginTop: 2,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{sys.l4Name || sys.l3Name}</div>
                )}
              </div>
            </div>
          )}
          {isSingleTenantHome && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 18, fontWeight: 700, color: '#14151A', letterSpacing: '-0.3px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{sys.name}</div>
              {(sys.l4Name || sys.l3Name) && (
                <div style={{
                  fontSize: 13, fontWeight: 500, color: '#4A4F5A',
                  marginTop: 2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{sys.l4Name || sys.l3Name}</div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', overflowX: 'auto', padding: '8px 14px 0' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              flexShrink: 0, padding: '8px 12px', textAlign: 'center', fontSize: 14,
              fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? '#0B95F8' : '#717684',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              borderBottom: activeTab === tab.key ? '2px solid #0B95F8' : '2px solid transparent',
              whiteSpace: 'nowrap',
            }}>{tab.label}</button>
          ))}
        </div>
      </PipesHeader>

      {/* Sticky offline banners — phone (brown) and/or system (red). Locked
          2026-06-07 per PRD 12 § 1 + § 2. */}
      <OfflineStickyBanner sys={sys} />

      {activeTab === 'overview' && <OverviewTab sys={sys} navigate={navigate} />}
      {activeTab === 'policy' && <PolicyTab sys={sys} />}
      {activeTab === 'activity' && <ActivityTab sys={sys} focusEventId={focusEventId} />}
      {activeTab === 'info' && <SystemInfoTab sys={sys} />}

      <TabBar activeTab={isSingleTenantHome ? 'home' : 'systems'} />

      <NavigationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentSystemId={systemId}
        onSelectLocation={(tile) => {
          // Navigate to systems tab with selected location scope
          sessionStorage.setItem('pulse2-selected-location', JSON.stringify({ id: tile.id, name: tile.name, systemIds: tile.systems.map(s => s.id) }));
          navigate('/systems');
        }}
      />

      {/* Page-level Tag sheet. Opens from ?action=tag in the URL (push
          notification deep-link). Lives here, not inside the Water Event
          widget, so it still opens AFTER End of Leak when the widget has
          been tombstoned. */}
      {pageTagSheetOpen && sys && sys.id && (
        <TagBottomSheet
          currentTags={currentTagList}
          onClose={() => setPageTagSheetOpen(false)}
          onAdd={(additions) => {
            additions.forEach(t => addTag(sys.id, { ...t, addedBy: getCurrentActor() }));
            setTagBumper(b => b + 1);
          }}
          onRemove={(i) => {
            removeTagAt(sys.id, i);
            setTagBumper(b => b + 1);
          }}
        />
      )}
    </div>
  );
}
