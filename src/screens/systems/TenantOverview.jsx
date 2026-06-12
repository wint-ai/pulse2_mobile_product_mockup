// Tenant Overview tab — used by SystemDetail when sys.homeAway === true.
// Anatomy locked 2026-06-04 (see design-options/tenant-system-page-options.html).
//
//   1. Hero card — Home / Away mode with toggle, gradient tinted by state.
//   2. Active Water Event widget (only when there's an active leak).
//   3. System health row (only when there's a protection issue:
//      offline / valve error / external power lost). Tap to expand the
//      per-dimension breakdown.
//   4. Valve widget — same anatomy as the non-tenant ValveControlCard.
//   5. Water Consumption widget — same as non-tenants (Hourly / Daily /
//      Monthly / Yearly + year-over-year compare).
//
// Tabs on the System Detail page for tenants are just Overview + Activity
// (set in getTabsForSystem). No Policy, no Info — tenants don't manage
// policies and their apartment doesn't have a separate "Info" surface.

import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { computeSystemHealth } from '../../utils/systemHealth';
import { formatLastSeen } from '../../utils/format';
import WaterEventDetailsWidget from '../../components/WaterEventDetailsWidget';
import ValveControlCard from '../../components/ValveControlCard';
import ConsumptionTab from './ConsumptionTab';
import HomeAwayWidget from '../../components/HomeAwayWidget';

function MIcon({ name, size = 18, color, fill = false, style = {} }) {
  return (
    <span className="material-symbols-outlined"
      style={{ fontSize: size, color, fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0", lineHeight: 1, ...style }}
    >{name}</span>
  );
}

// Legacy ModeHero + ModeConfirm removed. Replaced by HomeAwayWidget
// (src/components/HomeAwayWidget.jsx) which implements the round-6 design:
// warm-neutral palette (no green/blue), plain-English mode descriptions
// that explain how auto-shutoff behaves, and an internal confirmation
// sheet so the parent just owns mode state.

// ── System Health row — only shown when there's an error ──
function HealthRow({ sys, theme }) {
  const [open, setOpen] = useState(false);
  const h = computeSystemHealth(sys);

  // No issues except an active water event → don't render. Water event has its
  // own widget; this row is purely for comm / valve / power / recipients drift.
  const issues = [];
  if (!h.isComm) issues.push({ dim: 'Communication', value: `System offline - last contact ${formatLastSeen(sys.lastSeen)}` });
  if (sys.valve != null && !h.valveOk) issues.push({ dim: 'Valve', value: 'Error - maintenance needed' });
  if (sys.power != null && !h.powerOk) issues.push({ dim: 'External power', value: 'Disconnected - running on backup battery' });
  if (issues.length === 0) return null;

  const head = issues.length === 1
    ? issues[0].dim === 'Communication' ? 'System offline'
    : issues[0].dim === 'Valve'         ? 'Valve error'
    : 'External power lost'
    : `${issues.length} issues need attention`;

  const sub = issues.length === 1
    ? issues[0].value
    : issues.map(i => i.dim).join(' · ');

  const headIcon = issues.length > 1 ? 'warning'
    : issues[0].dim === 'Communication' ? 'wifi_off'
    : issues[0].dim === 'Valve' ? 'valve'
    : 'power_off';

  return (
    <>
      <div onClick={() => setOpen(o => !o)} style={{
        background: 'rgba(229,161,0,0.08)',
        border: '1px solid rgba(229,161,0,0.28)',
        borderRadius: 14,
        padding: '12px 14px',
        marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 12,
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(20,21,26,0.05)',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          border: '2px solid #E5A100', background: 'rgba(255,255,255,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <MIcon name={headIcon} size={20} color="#8C5A0F" fill />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#8C5A0F', letterSpacing: '-0.2px' }}>{head}</div>
          <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>{sub}</div>
        </div>
        <MIcon name={open ? 'expand_less' : 'expand_more'} size={20} color={theme.textTertiary} />
      </div>

      {open && (
        <div style={{
          background: theme.card,
          border: `1px solid ${theme.cardBorderColor || '#E5E8EE'}`,
          borderRadius: 14,
          padding: '12px 14px',
          marginBottom: 8,
          boxShadow: '0 1px 3px rgba(20,21,26,0.05)',
        }}>
          {/* Only render the FAILING dimensions in the expanded view. Healthy
              dimensions aren't useful context for a tenant — they just see
              what's actually wrong. Multi-issue case still works since the
              issues array above already lists every failure. */}
          {!h.isComm && <Row dim="Communication" ok={false} value="Offline" theme={theme} />}
          {sys.valve != null && !h.valveOk && <Row dim="Valve" ok={false} value="Error · maintenance needed" theme={theme} />}
          {sys.power != null && !h.powerOk && <Row dim="External power" ok={false} value="Disconnected · on backup battery" theme={theme} />}
        </div>
      )}
    </>
  );
}

function Row({ dim, ok, value, theme }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 0', fontSize: 13,
      borderTop: `1px solid ${theme.divider || '#EEF1F5'}`,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? '#5C9E1A' : '#E5A100', flexShrink: 0 }} />
      <span style={{ flex: 1, color: theme.textSecondary }}>{dim}</span>
      <span style={{ fontWeight: 700, color: ok ? '#2F6112' : '#8C5A0F' }}>{value}</span>
    </div>
  );
}

// ── Main ──
export default function TenantOverview({ sys, navigate }) {
  const { theme } = useTheme();
  const [mode, setMode] = useState('home');

  return (
    // Container only handles vertical padding. Horizontal padding lives on
    // the inner group of widgets so the Consumption widget (which provides its
    // own 14 px horizontal padding via ConsumptionTab) lines up with everything
    // above it. Without this split, the Consumption card ends up 28 px inset
    // (14 px outer + 14 px ConsumptionTab inner) while the cards above it sit
    // at 14 px — the width mismatch in Tenant Overview screenshots.
    <div style={{ flex: 1, overflowY: 'auto', paddingTop: 10, paddingBottom: 24 }}>
      <div style={{ padding: '0 14px' }}>
        {/* Water Event widget - always rendered, always on top. Shows the
            active card when a water event is happening, otherwise the locked
            All clear state ("No active Water Event"). Same widget on tenant
            view; All clear is a STATE of this widget, not a separate widget.
            hideOnIt: tenant context is a single occupant. "On it" is a
            team-coordination action that doesn't apply, so we omit it. */}
        <WaterEventDetailsWidget sys={sys} hideOnIt />

        {/* Home-Away widget — locked design from PRD 04e (round 6).
            Cream card, charcoal active fill, two-line description per mode,
            confirmation sheet on switch. No green/blue editorializing. */}
        <HomeAwayWidget mode={mode} onSwitch={setMode} />

        {/* System health row — only when there's a protection issue */}
        <HealthRow sys={sys} theme={theme} />

        {/* Valve widget — tenantMode drives the auto-shutoff sub-line:
            Away = Enabled (auto-close on water event), Home = Disabled. */}
        <ValveControlCard sys={sys} tenantMode={mode} />
      </div>

      {/* Consumption widget — outside the padded group so its own internal
          14 px padding gives the right width. Mirrors SystemDetail Overview. */}
      <ConsumptionTab sys={sys} />

      {/* (legacy ModeConfirm sheet removed — HomeAwayWidget now owns the
          confirmation flow internally with the locked plain-English copy.) */}
    </div>
  );
}
