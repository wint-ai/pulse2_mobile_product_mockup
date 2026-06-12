import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEventTypeColor } from '../data/events';
import { getSystemById, getSystemTz } from '../data/systems';
import { getActiveIncident, getLeakState } from '../data/incidents';
import { getActivePolicy } from '../data/systemDetails';
import { useTheme } from '../context/ThemeContext';
import { formatDate, formatDuration, parseEventInstant } from '../utils/format';
import LeakSummary from './LeakSummary';
import WaterEventSummary from './WaterEventSummary';
import NonWaterAlertSummary from './NonWaterAlertSummary';

const CHANNEL_ICONS = { push: 'notifications', email: 'mail', sms: 'sms' };

const TYPE_LABELS = {
  'leak-high': 'High Flow',
  'leak-low': 'Low Flow',
  'valve-error': 'Valve Error',
  'power-lost': 'Power Lost',
  'comm': 'Offline',
  'offline': 'Offline',
  'battery-low': 'Battery Low',
  'battery-critical': 'Battery Critical',
  'no-recipients': 'No recipients',
};

function ExpandedPanel({ event, theme }) {
  const hasTimeline = event.timeline?.length > 0;
  const hasNotifications = event.notifications?.length > 0;
  const hasMetadata = event.metadata && Object.keys(event.metadata).length > 0;
  const color = getEventTypeColor(event.type);

  return (
    <div style={{ padding: '0 14px 12px', borderTop: `1px solid ${theme.divider}` }}>
      {event.eventId && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0 4px' }}>
          <span style={{ fontSize: 13, color: theme.textMuted }}>Event ID</span>
          <span style={{ fontSize: 13, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: theme.badgeBg, color: theme.text, fontFamily: 'monospace' }}>{event.eventId}</span>
        </div>
      )}

      {hasTimeline && (
        <div style={{ marginTop: 8, marginBottom: hasNotifications || hasMetadata ? 12 : 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 8 }}>Timeline</div>
          {/* Variant A anatomy per PRD 11: [time] [colored icon-circle] [title + sub]. No rail. */}
          {event.timeline.map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: 8, padding: '8px 10px',
              background: theme.card, borderRadius: 10,
              border: `1px solid ${theme.divider}`,
              marginBottom: 4, alignItems: 'flex-start',
            }}>
              <div style={{ width: 42, flexShrink: 0, paddingTop: 1, fontSize: 11, fontWeight: 700, color: theme.text, fontVariantNumeric: 'tabular-nums' }}>
                {step.time}
              </div>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', background: color, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{
                  fontSize: 14, color: '#fff', lineHeight: 1, fontVariationSettings: "'FILL' 1",
                }}>{step.icon || 'water_drop'}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, lineHeight: 1.3 }}>
                  {step.label}
                </div>
                {(step.sublabel || step.flowRate) && (
                  <div style={{ fontSize: 11, color: theme.textTertiary, marginTop: 2, lineHeight: 1.4 }}>
                    {[step.flowRate && `Flow rate: ${step.flowRate}`, step.sublabel].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasNotifications && (
        <div style={{ marginTop: hasTimeline ? 0 : 8, marginBottom: hasMetadata ? 12 : 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 8 }}>Notified ({event.notifications.length})</div>
          {event.notifications.map((n, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#04ADEF', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>{n.initials}</div>
              <span style={{ fontSize: 14, fontWeight: 600, color: theme.text, flex: 1 }}>{n.name}</span>
              <div style={{ display: 'flex', gap: 4 }}>{n.channels.map(ch => <span key={ch} className="material-symbols-outlined" style={{ fontSize: 16, color: theme.textMuted }}>{CHANNEL_ICONS[ch] || ch}</span>)}</div>
              <span style={{ fontSize: 12, color: theme.textMuted, fontFamily: 'monospace' }}>{n.sentAt}</span>
            </div>
          ))}
        </div>
      )}

      {hasMetadata && (
        <div style={{ marginTop: hasTimeline || hasNotifications ? 0 : 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 8 }}>Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            {Object.entries(event.metadata).map(([key, val]) => (
              <div key={key}>
                <div style={{ fontSize: 12, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '.3px' }}>{key}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventRow({ event, highlight }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const color = getEventTypeColor(event.type);
  const isLeak = event.type === 'leak-high' || event.type === 'leak-low';
  const [expanded, setExpanded] = useState(false);
  const hasExpandableContent = event.eventId || event.metadata || event.notifications?.length > 0 || event.timeline?.length > 0;

  const sys = event.system ? getSystemById(event.system) : null;

  function handleClick() {
    if (!event.system) return;
    // Tap routing (locked 2026-06-03):
    //   • Active events → /system/:id → Overview tab — user wants to act
    //     (Tag / Ignore / On it via the Water Event Details widget).
    //   • History events → /system/:id?tab=activity&event=<id> — user wants
    //     to review what happened; the Timeline tab opens with that specific
    //     event pre-expanded and scrolled into view.
    const isHistory = !!(event.resolved || event.ignored);
    if (isHistory) {
      navigate(`/system/${event.system}?tab=activity&event=${event.id}`);
    } else {
      navigate(`/system/${event.system}`);
    }
  }

  function hl(text) {
    if (!highlight || !text) return text;
    const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
    if (idx === -1) return text;
    return <>{text.slice(0, idx)}<mark style={{ background: '#FEF08A', borderRadius: 2, padding: '0 1px' }}>{text.slice(idx, idx + highlight.length)}</mark>{text.slice(idx + highlight.length)}</>;
  }

  // Filter metadata: drop 'Detection' always; drop 'Volume Lost' for active leaks (Total Lost is History-only)
  const filteredMetadata = event.metadata
    ? Object.fromEntries(Object.entries(event.metadata).filter(([k]) =>
        k !== 'Detection' && (event.resolved || k !== 'Volume Lost'))
      )
    : null;

  // ── Leak Summary props derivation ─────────────────────────────────────────
  const policy = isLeak && event.system ? getActivePolicy(event.system) : null;
  const incident = isLeak && event.system && !event.resolved ? getActiveIncident(event.system) : null;
  const leakLevel = event.type === 'leak-high' ? 'high' : 'low';
  const leakState = !event.resolved ? getLeakState(incident) : null;
  const flowRate = event.metadata?.['Flow Rate'] || (event.detail ? event.detail.split(' · ').slice(-1)[0] : null);
  const hasValve = sys?.valve !== null && sys?.valve !== undefined;
  const autoShutoff = !hasValve
    ? null
    : policy?.autoShutoff === 'On' ? 'Enabled'
    : policy?.autoShutoff === 'Off' ? 'Disabled'
    : null;
  const detectionMode = policy?.detection || null;

  if (isLeak) {
    // Water Event Summary widget — see WaterEventSummary.jsx.
    // Tapping navigates to the system page (handleClick handles this).
    return <WaterEventSummary event={event} onClick={handleClick} highlight={highlight} />;
  }

  // Non-water alerts — Summary widget mirroring the Water Event one so the
  // Alerts list reads as one family. No dedicated detailed view yet; tap
  // takes the user to the system page where System Health surfaces the issue.
  return <NonWaterAlertSummary event={event} onClick={handleClick} highlight={highlight} />;
}
