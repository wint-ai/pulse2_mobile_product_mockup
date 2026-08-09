// Technician — Sync Queue full-page screen
// PRD: ch.01 §11

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TechTopBar from '../../components/TechTopBar';

const SYNC_PENDING = [
  { id: 's1', label: 'Kitchen K1 \u00b7 TSO', location: 'Hilton Hotels > Chicago > Main Building > Floor 1', status: 'uploading' },
  { id: 's2', label: 'Pool Pump \u00b7 WS Paired', location: 'Hilton Hotels > Chicago > Annex Building > Floor 1', status: 'failed' },
];

const SYNC_HISTORY = [
  { id: 'sh1', label: 'Lobby Fountain \u00b7 TSO', location: 'Hilton Hotels > Miami > Ocean Tower > Floor 1', timestamp: '2026-08-09 08:30' },
  { id: 'sh2', label: 'CU-005 \u00b7 CU Paired', location: 'Hilton Hotels > Chicago > Annex Building > Floor 1', timestamp: '2026-08-08 14:30' },
  { id: 'sh3', label: 'Ballroom Supply \u00b7 TSO', location: 'Marriott > New York > Times Square > Floor 1', timestamp: '2026-08-06 14:00' },
];

export default function TechSyncQueue() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending');

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
          <div style={{ fontSize: 18, fontWeight: 700, color: '#14151A' }}>Sync Queue</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
          {['pending', 'history'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                border: 'none', borderBottom: tab === t ? '2px solid #2563EB' : '2px solid transparent',
                background: 'none', color: tab === t ? '#2563EB' : '#9CA3AF',
                cursor: 'pointer',
              }}
            >{t === 'pending' ? `Pending (${SYNC_PENDING.length})` : 'History'}</button>
          ))}
        </div>

        {/* Content */}
        {tab === 'pending' ? (
          SYNC_PENDING.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No pending items</div>
          ) : (
            SYNC_PENDING.map(item => (
              <div key={item.id} style={{
                padding: '12px 16px', background: '#fff', borderBottom: '1px solid #F3F4F6',
                borderLeft: `3px solid ${item.status === 'failed' ? '#EF4444' : '#F59E0B'}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#14151A' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{item.location}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {item.status === 'uploading' ? (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#F59E0B' }}>sync</span>
                        <span style={{ fontSize: 11, color: '#D97706', fontWeight: 500 }}>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#EF4444' }}>error</span>
                        <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 500 }}>Upload failed</span>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {item.status === 'failed' && (
                      <button style={{
                        padding: '4px 10px', fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                        background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 6, cursor: 'pointer',
                      }}>Retry</button>
                    )}
                    <button style={{
                      padding: '4px 10px', fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                      background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 6, cursor: 'pointer',
                    }}>Cancel</button>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          SYNC_HISTORY.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No sync history</div>
          ) : (
            SYNC_HISTORY.map(item => (
              <div key={item.id} style={{
                padding: '12px 16px', background: '#fff', borderBottom: '1px solid #F3F4F6',
                borderLeft: '3px solid #16A34A',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#14151A' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{item.location}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#16A34A' }}>Uploaded</span>
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{item.timestamp}</div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
