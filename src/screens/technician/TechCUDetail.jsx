// Technician — Control Unit Detail Screen
// PRD: ch.01 §8.2

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TechTopBar from '../../components/TechTopBar';
import { getCUById, getLocationBreadcrumb, WATER_SYSTEMS } from '../../data/technicianData';

const TSO_COLORS = { pass: '#16A34A', partial: '#F59E0B', fail: '#EF4444', not_tested: '#9CA3AF' };
const TSO_LABELS = { pass: 'Pass', partial: 'Partial', fail: 'Fail', not_tested: 'Not Tested' };

function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
      <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#14151A', textAlign: 'right' }}>{children}</div>
    </div>
  );
}

export default function TechCUDetail() {
  const { cuId } = useParams();
  const navigate = useNavigate();
  const [showUnpair, setShowUnpair] = useState(false);

  const cu = getCUById(cuId);
  if (!cu) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#F3F4F6' }}>
        <TechTopBar />
        <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>Control unit not found</div>
      </div>
    );
  }

  const breadcrumb = getLocationBreadcrumb(cu.locationId);
  const connectedWS = WATER_SYSTEMS.filter(ws => ws.cuId === cu.id);

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
          <div style={{ fontSize: 18, fontWeight: 700, color: '#14151A' }}>
            {cu.name}
            <span style={{ fontWeight: 400, color: '#6B7280', fontSize: 14 }}> &middot; Control Unit</span>
          </div>
          {breadcrumb && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{breadcrumb}</div>}
        </div>

        {/* Info */}
        <div style={{ padding: '0 16px', background: '#fff', marginBottom: 8 }}>
          <InfoRow label="Status">
            <span style={{ color: cu.status === 'online' ? '#16A34A' : '#EF4444' }}>
              &#9679; {cu.status === 'online' ? 'Online' : 'Offline'}
            </span>
          </InfoRow>
          <InfoRow label="Pairing Status">
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              background: cu.paired ? '#DCFCE7' : '#FEE2E2',
              color: cu.paired ? '#16A34A' : '#DC2626',
            }}>{cu.paired ? 'Paired' : 'Unpaired'}</span>
          </InfoRow>
          <InfoRow label="WiFi">{cu.wifi === 'configured' ? 'Configured' : 'Not configured'}</InfoRow>
          <InfoRow label="Firmware">{cu.firmware}</InfoRow>
        </div>

        {/* Connected Water Systems */}
        {connectedWS.length > 0 && (
          <div style={{ padding: '8px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              Connected Water Systems ({connectedWS.length})
            </div>
            {connectedWS.map(ws => (
              <div
                key={ws.id}
                onClick={() => navigate(`/tech/ws/${ws.id}`)}
                style={{
                  background: '#fff', borderRadius: 10, padding: '10px 14px', marginBottom: 6,
                  border: '1px solid #E5E7EB', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                  background: '#DBEAFE', color: '#2563EB',
                }}>WS</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#14151A' }}>{ws.name}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>{ws.vmaSerial || ws.flowlessSerial || '\u2013'}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: ws.paired ? '#16A34A' : '#DC2626' }}>
                      {ws.paired ? 'Paired' : 'Unpaired'}
                    </span>
                    {ws.paired && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: TSO_COLORS[ws.tsoStatus] }}>
                        {TSO_LABELS[ws.tsoStatus]}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 14, color: '#D1D5DB' }}>&rsaquo;</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: '8px 16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => alert('WiFi setup — not yet implemented')}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10,
                background: '#F3F4F6', border: '1px solid #E5E7EB',
                fontSize: 14, fontWeight: 600, color: '#374151',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Configure WiFi</button>

            {!cu.paired && (
              <button
                onClick={() => alert('CU Pair flow — not yet implemented')}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 10,
                  background: '#2563EB', border: 'none',
                  fontSize: 14, fontWeight: 700, color: '#fff',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Pair</button>
            )}

            {cu.paired && (
              <button
                onClick={() => setShowUnpair(true)}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 10,
                  background: '#FEE2E2', border: 'none',
                  fontSize: 14, fontWeight: 700, color: '#DC2626',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Unpair</button>
            )}
          </div>
        </div>
      </div>

      {/* Unpair modal — reuses the same pattern as WS */}
      {showUnpair && (
        <UnpairModal
          entityName={cu.name}
          entityType="cu"
          onConfirm={() => { setShowUnpair(false); alert('Unpaired (demo)'); }}
          onCancel={() => setShowUnpair(false)}
        />
      )}
    </div>
  );
}

function UnpairModal({ entityName, entityType, onConfirm, onCancel }) {
  const [confirmText, setConfirmText] = useState('');
  const expected = `Unpair ${entityName}`;
  const matches = confirmText === expected;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(20,21,26,0.5)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, padding: 24, maxWidth: 340, width: '100%',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#14151A', marginBottom: 8 }}>
          Unpair this {entityType === 'ws' ? 'water system' : 'control unit'}?
        </div>
        <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5, marginBottom: 16 }}>
          {entityType === 'ws'
            ? 'This will unpair the system and delete all TSO results. It will need to be paired and tested again.'
            : 'All connected systems will lose connectivity until a new CU is paired.'}
        </div>
        <div style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}>
          Type <strong>{expected}</strong> to confirm (case-sensitive):
        </div>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 8,
            border: '1.5px solid #E5E7EB', fontSize: 14,
            fontFamily: 'inherit', color: '#14151A', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: 12, borderRadius: 10, background: '#fff',
            border: '1px solid #E5E7EB', fontSize: 14, fontWeight: 600,
            color: '#4B5563', cursor: 'pointer', fontFamily: 'inherit',
          }}>Keep Paired</button>
          <button
            onClick={matches ? onConfirm : undefined}
            disabled={!matches}
            style={{
              flex: 1, padding: 12, borderRadius: 10,
              background: matches ? '#EF4444' : '#E5E7EB',
              color: matches ? '#fff' : '#9CA3AF',
              border: 'none', fontSize: 14, fontWeight: 700,
              cursor: matches ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            }}
          >Unpair</button>
        </div>
      </div>
    </div>
  );
}
