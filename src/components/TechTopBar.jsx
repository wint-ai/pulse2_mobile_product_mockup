// Technician App — persistent top bar
// PRD: ch.01 §4
// WINT brand (left), sync icon + notifications bell + profile (right)
// Icons navigate to full-page screens.

import { useNavigate } from 'react-router-dom';

export default function TechTopBar() {
  const navigate = useNavigate();
  const syncCount = 2;
  const notifCount = 3;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px',
      background: '#fff',
      borderBottom: '1px solid #E5E7EB',
      flexShrink: 0,
    }}>
      {/* WINT brand */}
      <img
        src={`${import.meta.env.BASE_URL}wint-logo.svg`}
        alt="WINT"
        style={{ height: 22 }}
      />

      {/* Right icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Sync */}
        <div onClick={() => navigate('/tech/sync')} style={{ position: 'relative', cursor: 'pointer' }} title="Sync Queue">
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#6B7280' }}>sync</span>
          {syncCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -6,
              background: '#EF4444', color: '#fff',
              fontSize: 9, fontWeight: 700, borderRadius: 8,
              padding: '0 4px', minWidth: 14, textAlign: 'center',
              lineHeight: '16px',
            }}>{syncCount}</span>
          )}
        </div>

        {/* Notifications */}
        <div onClick={() => navigate('/tech/notifications')} style={{ position: 'relative', cursor: 'pointer' }} title="Notifications">
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#6B7280' }}>notifications</span>
          {notifCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -6,
              background: '#EF4444', color: '#fff',
              fontSize: 9, fontWeight: 700, borderRadius: 8,
              padding: '0 4px', minWidth: 14, textAlign: 'center',
              lineHeight: '16px',
            }}>{notifCount}</span>
          )}
        </div>

        {/* Profile */}
        <div
          onClick={() => navigate('/tech/profile')}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#E0E7FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#4F46E5' }}>person</span>
        </div>
      </div>
    </div>
  );
}
