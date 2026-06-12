// Home-Away widget - shared component for both Simple (System tab body) and
// Standard (Policy tab when admin chose Home-Away) views.
//
// Design locked 2026-06-08 (round 6). Reference:
//   docs/PRD/04e-home-away.md
//   public/reviews/home-away.html
//
// Key rules: no green, no blue. Both Home and Away are equally valid life
// states. Warm-neutral monochromatic palette. Differentiation by iconography
// (home vs flight_takeoff) + filled-vs-outlined treatment on the toggle.
// Confirmation bottom sheet on every mode switch -- no silent flips.

import { useState } from 'react';

function MIcon({ name, size = 18, color, fill = false, style = {} }) {
  return (
    <span className="material-symbols-outlined"
      style={{
        fontSize: size, color,
        fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0",
        lineHeight: 1, ...style,
      }}
    >{name}</span>
  );
}

// Locked palette tokens.
const HA = {
  cream: '#FAF7F2',
  border: '#E8E0D5',
  charcoal: '#14151A',
  warmGrey: '#6B6557',
  warmAccent: '#8B7A56',
  toggleTrack: 'rgba(20,21,26,0.06)',
  sheetGrip: '#D6D0C5',
  scrim: 'rgba(0,0,0,0.5)',
  cancelBg: '#F2F4F8',
};

// Locked plain-English copy. Two sentences per mode:
//   sentence 1: what the user is telling the system / expected water use
//   sentence 2: how auto-shutoff behaves in this mode
// No jargon -- no "auto-shutoff", no "policy" terms.
const MODE_COPY = {
  home: "Water consumption is expected, like a normal day. If a water event is detected, you'll be alerted but the valve will stay open.",
  away: "No water consumption is expected while you're away. If a water event is detected, you'll be alerted and the valve will be closed automatically.",
};

// Confirmation sheet body copy ("you're telling the system...").
const CONFIRM_COPY = {
  home: "You're telling the system you're back. Water consumption is expected, like a normal day. If a water event is detected, you'll be alerted but the valve will stay open.",
  away: "You're telling the system you'll be away. No water consumption is expected. If a water event is detected, you'll be alerted and the valve will be closed automatically.",
};

export default function HomeAwayWidget({ mode = 'home', onSwitch }) {
  const [pending, setPending] = useState(null);

  const isHome = mode === 'home';
  const modeName = isHome ? 'Home' : 'Away';
  const modeIcon = isHome ? 'home' : 'flight_takeoff';

  const requestSwitch = (next) => {
    if (next === mode) return;
    setPending(next);
  };
  const cancel = () => setPending(null);
  const confirm = () => {
    if (pending) onSwitch?.(pending);
    setPending(null);
  };

  return (
    <>
      <div style={{
        background: HA.cream,
        border: `1px solid ${HA.border}`,
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        boxShadow: '0 1px 3px rgba(20,21,26,0.04)',
      }}>
        {/* Title row (no info icon -- the description below explains everything) */}
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#4A4F5A',
          textTransform: 'uppercase', letterSpacing: 0.6,
          marginBottom: 14,
        }}>Home-Away</div>

        {/* Hero block */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: HA.charcoal,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <MIcon name={modeIcon} size={30} color={HA.cream} fill />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 700, color: HA.warmAccent,
              textTransform: 'uppercase', letterSpacing: 0.5,
              marginBottom: 2,
            }}>Current mode</div>
            <div style={{
              fontSize: 24, fontWeight: 700, color: HA.charcoal,
              letterSpacing: -0.5, lineHeight: 1.1,
            }}>{modeName}</div>
            <div style={{
              fontSize: 12.5, color: HA.warmGrey, lineHeight: 1.4,
              marginTop: 4,
            }}>{MODE_COPY[mode]}</div>
          </div>
        </div>

        {/* Segmented toggle */}
        <div style={{
          display: 'flex', gap: 6,
          background: HA.toggleTrack,
          padding: 4, borderRadius: 14,
        }}>
          {[
            { key: 'home', label: 'Home', icon: 'home' },
            { key: 'away', label: 'Away', icon: 'flight_takeoff' },
          ].map(seg => {
            const active = seg.key === mode;
            return (
              <div
                key={seg.key}
                onClick={() => !active && requestSwitch(seg.key)}
                style={{
                  flex: 1,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  gap: 6,
                  padding: '10px 12px',
                  borderRadius: 10,
                  fontSize: 13, fontWeight: 700,
                  cursor: active ? 'default' : 'pointer',
                  background: active ? HA.charcoal : 'transparent',
                  color: active ? HA.cream : HA.warmGrey,
                  boxShadow: active ? '0 1px 3px rgba(20,21,26,0.18)' : 'none',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <MIcon name={seg.icon} size={18} color={active ? HA.cream : HA.warmGrey} fill />
                {seg.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation bottom sheet */}
      {pending && (
        <div
          onClick={cancel}
          style={{
            position: 'absolute', inset: 0, zIndex: 100,
            background: HA.scrim,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '18px 18px 0 0',
              padding: '12px 18px 18px',
              boxShadow: '0 -4px 24px rgba(20,21,26,0.18)',
            }}
          >
            <div style={{
              width: 36, height: 4, background: HA.sheetGrip,
              borderRadius: 2, margin: '0 auto 14px',
            }} />

            {/* Header: charcoal badge with target mode icon + title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: HA.charcoal,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <MIcon name={pending === 'home' ? 'home' : 'flight_takeoff'} size={22} color={HA.cream} fill />
              </div>
              <div style={{
                fontSize: 16, fontWeight: 700, color: HA.charcoal, lineHeight: 1.2,
              }}>Switch to {pending === 'home' ? 'Home' : 'Away'}?</div>
            </div>

            {/* Body copy - mirrors the widget hero copy, phrased as "you're telling the system..." */}
            <div style={{
              fontSize: 13.5, color: '#4A4F5A', lineHeight: 1.5,
              marginBottom: 14,
            }}>{CONFIRM_COPY[pending]}</div>

            {/* Cancel + Switch buttons (no effects block - body copy says it all) */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={cancel}
                style={{
                  flex: 1, padding: 12, borderRadius: 12,
                  fontSize: 13.5, fontWeight: 700,
                  background: HA.cancelBg, color: HA.charcoal,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Cancel</button>
              <button
                onClick={confirm}
                style={{
                  flex: 1, padding: 12, borderRadius: 12,
                  fontSize: 13.5, fontWeight: 700,
                  background: HA.charcoal, color: HA.cream,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Switch to {pending === 'home' ? 'Home' : 'Away'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
