import { useNavigate } from 'react-router-dom';
import TabBar from '../../components/TabBar';
import { useTheme } from '../../context/ThemeContext';
import { useUserContext } from '../../context/UserContext';
import { getAncestorScopes } from '../../utils/ancestorScopes';

const ALERT_META = {
  'valve-error':      { label: 'Valve error',     icon: 'valve',         severity: 'Critical', sevColor: '#DB4670' },
  'battery-critical': { label: 'Battery critical', icon: 'battery_alert', severity: 'Critical', sevColor: '#DB4670' },
  'battery-low':      { label: 'Battery low',      icon: 'battery_3_bar', severity: 'Warning',  sevColor: '#B5651A' },
  'power-lost':       { label: 'AC power lost',    icon: 'bolt',          severity: 'Warning',  sevColor: '#B5651A' },
  'offline':          { label: 'Device offline',   icon: 'wifi_off',      severity: 'Warning',  sevColor: '#B5651A' },
  'comm':             { label: 'Device offline',   icon: 'wifi_off',      severity: 'Warning',  sevColor: '#B5651A' },
};

const ID_PREFIX = {
  'valve-error':      've',
  'battery-critical': 'bat',
  'battery-low':      'bat',
  'power-lost':       'pwr',
  'offline':          'off',
  'comm':             'off',
};

function deterministicId(seed, prefix) {
  let h = 0;
  for (const c of (seed || '')) h = (h * 31 + c.charCodeAt(0)) % 10000;
  return `${prefix}-${h.toString().padStart(4, '0')}`;
}

// Mock recipients for non-water alerts (water uses incidents.alert-sent step).
function defaultRecipients(sys) {
  if (sys.account === 'sc') return [{ name: 'Suffolk FM', initials: 'SF', channels: ['push', 'email'] }];
  if (sys.account === 'ha') return [{ name: 'Heathrow Ops', initials: 'HO', channels: ['push', 'email'] }];
  if (sys.account === 'tidhar') return [{ name: 'Tidhar Mgmt', initials: 'TM', channels: ['push'] }];
  if (sys.account === 'cbre_il') return [{ name: 'CBRE IL FM Team', initials: 'CB', channels: ['push', 'email'] }];
  if (sys.account?.startsWith('socgen')) return [{ name: 'SocGen Facilities', initials: 'SG', channels: ['push', 'email'] }];
  if (sys.account?.startsWith('klep')) return [{ name: 'Klépierre FM', initials: 'KP', channels: ['push'] }];
  return [{ name: 'On-call', initials: 'OC', channels: ['push'] }];
}

export default function ErrorAlertDetail({ sys }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { setSelectedScope } = useUserContext() || {};

  const alert = sys.alert;
  const meta = ALERT_META[alert.type] || { label: alert.label || 'Alert', icon: 'error', severity: 'Warning', sevColor: '#B5651A' };
  const eventId = deterministicId(sys.id + alert.type, ID_PREFIX[alert.type] || 'evt');

  // Activity section removed per alerts-mockup-feedback #13 (decision 2026-06-01):
  // Activity is a System-Detail concept, not per-alert. Users go to System Detail → Activity tab
  // for system-wide context.
  const recipients = defaultRecipients(sys);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: theme.bg }}>
      {/* Slim neutral grey gradient header */}
      <div style={{ background: 'linear-gradient(135deg, #4A4F5A, #2D3138)', color: '#fff', padding: '10px 16px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer', padding: 0 }}
          >&lsaquo; Back</button>
          <button
            onClick={() => navigate(`/system/${sys.id}`)}
            style={{ fontSize: 14, color: '#fff', background: 'rgba(255,255,255,.2)', border: 'none', fontFamily: 'inherit', cursor: 'pointer', padding: '4px 10px', borderRadius: 8, fontWeight: 500 }}
          >View System</button>
        </div>
        {/* Pressable breadcrumb — each ancestor jumps to that scope */}
        {(() => {
          const ancestors = getAncestorScopes(sys);
          if (ancestors.length === 0) return null;
          return (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4, marginBottom: 2, wordBreak: 'break-word' }}>
              {ancestors.map((a, i) => (
                <span key={a.id}>
                  {i > 0 && <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>›</span>}
                  <span
                    onClick={(e) => { e.stopPropagation(); setSelectedScope?.(a); navigate('/'); }}
                    style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'underline', cursor: 'pointer' }}
                  >{a.name}</span>
                </span>
              ))}
            </div>
          );
        })()}
        {/* System name — tap to open the system page */}
        <div onClick={() => navigate(`/system/${sys.id}`)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{sys.name}</span>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }}>chevron_right</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 12px' }}>

        {/* Alert Summary (inline — no flow rate, severity pill instead of state) */}
        <div style={{
          background: theme.card, borderRadius: 10, border: theme.cardBorder,
          borderLeft: '3px solid #717684',
          padding: '9px 12px 10px', marginBottom: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
            <span className="material-symbols-outlined" style={{
              fontSize: 16, color: meta.sevColor,
              fontVariationSettings: "'FILL' 1", alignSelf: 'center',
            }}>{meta.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{meta.label}</span>
            {alert.startedAt && <span style={{ fontSize: 11, color: theme.textMuted }}>Today · {alert.startedAt}</span>}
            {alert.age && <span style={{ fontSize: 11, color: theme.textMuted }}>· {alert.age}</span>}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
              background: meta.sevColor + '24', color: meta.sevColor,
            }}>{meta.severity}</span>
            {alert.level && (
              <span style={{
                fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                background: '#F2F4F7', color: theme.text,
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.sevColor }} />
                {alert.level} remaining
              </span>
            )}
            {alert.type === 'valve-error' && (
              <span style={{
                fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                background: '#F2F4F7', color: theme.text,
              }}>Last command: Close · failed</span>
            )}
            {alert.type === 'power-lost' && sys.power === 'battery' && (
              <span style={{
                fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                background: '#F2F4F7', color: theme.text,
              }}>On battery</span>
            )}
          </div>
        </div>

        {/* Activity section dropped per alerts-mockup-feedback #13 — Activity is a System Detail concept,
            not per-alert. Users go to System Detail → Activity tab for broader context. */}

        {/* Notified */}
        {recipients.length > 0 && (
          <div style={{ background: theme.card, borderRadius: 10, border: theme.cardBorder, padding: '10px 13px', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>
              Notified · {recipients.length} recipient{recipients.length === 1 ? '' : 's'}
            </div>
            {recipients.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < recipients.length - 1 ? `1px solid ${theme.divider}` : 'none' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#04ADEF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{r.initials}</div>
                <span style={{ fontSize: 14, fontWeight: 600, color: theme.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {r.channels.map(ch => (
                    <span key={ch} style={{
                      fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                      background: 'rgba(4,173,239,0.13)', color: '#036AB5',
                    }}>{ch === 'push' ? 'Push' : ch === 'email' ? 'Email' : ch === 'sms' ? 'SMS' : ch}</span>
                  ))}
                </div>
                {alert.startedAt && <span style={{ fontSize: 11, color: theme.textMuted, fontFamily: 'monospace' }}>{alert.startedAt}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Event ID — last */}
        <div style={{ background: theme.card, borderRadius: 10, padding: '10px 13px', marginBottom: 8, border: theme.cardBorder, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '.4px' }}>Event ID</div>
          <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: theme.inputBg, color: theme.text }}>{eventId}</span>
        </div>
      </div>

      <TabBar activeTab="home" />
    </div>
  );
}
