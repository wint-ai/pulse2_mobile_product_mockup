// Technician — Notifications full-page screen
// PRD: ch.01 §12

import { useNavigate } from 'react-router-dom';
import TechTopBar from '../../components/TechTopBar';

const NOTIFICATIONS = [
  { id: 'n1', icon: 'photo_camera', iconBg: '#DBEAFE', iconColor: '#2563EB', message: 'Admin requested photo retake for **Bathroom B1**', time: '2h ago', unread: true },
  { id: 'n2', icon: 'photo_camera', iconBg: '#DBEAFE', iconColor: '#2563EB', message: 'Admin requested photo retake for **Spa Supply**', time: '3h ago', unread: true },
  { id: 'n3', icon: 'check_circle', iconBg: '#DCFCE7', iconColor: '#16A34A', message: 'TSO submission uploaded for **Kitchen K1**', time: '5h ago', unread: true },
  { id: 'n4', icon: 'check_circle', iconBg: '#DCFCE7', iconColor: '#16A34A', message: 'CU-005 pairing synced successfully', time: 'Yesterday', unread: false },
  { id: 'n5', icon: 'error', iconBg: '#FEE2E2', iconColor: '#DC2626', message: 'Upload failed for **Pool Pump** pairing \u2014 will retry', time: 'Yesterday', unread: false },
];

export default function TechNotifications() {
  const navigate = useNavigate();

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
          <div style={{ fontSize: 18, fontWeight: 700, color: '#14151A' }}>Notifications</div>
        </div>

        {/* Notification list */}
        {NOTIFICATIONS.map(n => (
          <div key={n.id} style={{
            padding: '12px 16px',
            background: n.unread ? '#F8FAFF' : '#fff',
            borderBottom: '1px solid #F3F4F6',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: n.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: n.iconColor }}>{n.icon}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{ fontSize: 13, color: '#14151A', lineHeight: 1.45 }}
                dangerouslySetInnerHTML={{ __html: n.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
              />
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{n.time}</div>
            </div>
            {n.unread && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', flexShrink: 0, marginTop: 6 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
