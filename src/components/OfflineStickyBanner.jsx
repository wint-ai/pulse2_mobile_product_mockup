// Sticky offline banners — two variants per PRD 12 § 1 + § 2 (locked 2026-06-07).
//
//   - Phone offline (brown):  "No internet connection · You're offline · showing last known data"
//   - System offline (red):   "System is offline · Can't reach {SystemName} · data may be outdated"
//
// Both render with a Retry pill on the right. If both apply simultaneously,
// the phone-offline banner stacks above the system-offline banner (you can't
// recover from the system side until your own connectivity is back).
//
// Reference mockup: public/reviews/offline-banner-pattern.html.
// PRD: docs/PRD/12-cross-cutting.md § 1 + § 2.

import { useEffect, useState } from 'react';

function MIcon({ name, size = 20, color = '#fff' }) {
  return (
    <span className="material-symbols-outlined" style={{
      fontSize: size, color, lineHeight: 1,
      fontVariationSettings: "'FILL' 1",
    }}>{name}</span>
  );
}

function Banner({ bg, iconGlyph, title, sub }) {
  return (
    <div style={{
      // align-items flex-start so multi-line text doesn't push the icon
      // off-center
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '12px 14px',
      background: bg, color: '#fff',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: 'rgba(255,255,255,0.18)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <MIcon name={iconGlyph} size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        {/* Wrap freely — don't truncate. (2026-06-07: Retry removed; text
            was clipping at narrow widths.) */}
        <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{title}</div>
        <div style={{ fontSize: 12.5, opacity: 0.92, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
      </div>
    </div>
  );
}

export default function OfflineStickyBanner({ sys }) {
  const [phoneOnline, setPhoneOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const on = () => setPhoneOnline(true);
    const off = () => setPhoneOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const isPhoneOffline = !phoneOnline;
  const isSystemOffline = !!(sys && (sys.comm === 'offline' || sys.offline === true));

  if (!isPhoneOffline && !isSystemOffline) return null;

  return (
    <div style={{ flexShrink: 0 }}>
      {isPhoneOffline && (
        <Banner
          bg="#8A4F12"
          iconGlyph="wifi_off"
          title="No internet connection"
          sub="You're offline · showing last known data"
        />
      )}
      {isSystemOffline && (
        <Banner
          bg="#B22838"
          iconGlyph="cell_tower"
          title="System is offline"
          sub={`Can't reach ${sys?.name || 'this system'} · data may be outdated`}
        />
      )}
    </div>
  );
}
