// Technician — Profile full-page screen
// PRD: ch.01 §4 (profile dropdown → full page)

import { useNavigate } from 'react-router-dom';
import TechTopBar from '../../components/TechTopBar';

export default function TechProfile() {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('pulse2-auth');
    window.location.href = import.meta.env.BASE_URL;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: '#F3F4F6' }}>
      <TechTopBar />
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
          <div onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 8 }}>
            <span style={{ fontSize: 18, color: '#6B7280' }}>&lsaquo;</span>
            <span style={{ fontSize: 13, color: '#6B7280' }}>Back</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#14151A' }}>Profile</div>
        </div>

        {/* Profile card */}
        <div style={{ padding: '20px 16px', background: '#fff', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 30, color: '#4F46E5' }}>person</span>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#14151A' }}>David Levy</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>david.levy@wint.ai</div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Field Technician</div>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div style={{ background: '#fff' }}>
          {[
            { icon: 'bug_report', label: 'Share Logs', subtitle: 'Send debug logs to support' },
            { icon: 'settings', label: 'Settings', subtitle: 'App preferences' },
          ].map(item => (
            <div
              key={item.label}
              style={{
                padding: '14px 16px', borderBottom: '1px solid #F3F4F6',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#6B7280' }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#14151A' }}>{item.label}</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{item.subtitle}</div>
              </div>
              <span style={{ fontSize: 14, color: '#D1D5DB' }}>&rsaquo;</span>
            </div>
          ))}
        </div>

        {/* Log out */}
        <div style={{ padding: '16px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              background: '#FEE2E2', color: '#DC2626', border: 'none',
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
