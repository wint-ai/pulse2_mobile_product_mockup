// Technician — Water System Detail Screen
// PRD: ch.01 §8.1

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TechTopBar from '../../components/TechTopBar';
import { getWSById, getCUById, getLocationBreadcrumb, PHOTO_RETAKES } from '../../data/technicianData';

const TSO_COLORS = { pass: '#16A34A', partial: '#F59E0B', fail: '#EF4444', not_tested: '#9CA3AF', in_progress: '#3B82F6' };
const TSO_LABELS = { pass: 'Pass', partial: 'Partial', fail: 'Fail', not_tested: 'Not Tested', in_progress: 'In Progress' };

function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
      <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#14151A', textAlign: 'right' }}>{children}</div>
    </div>
  );
}

function ActionButton({ label, style, hint, disabled, onClick }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: hint ? '10px 16px 8px' : '12px 16px',
        borderRadius: 10, border: 'none',
        fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      <div>{label}</div>
      {hint && <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2, opacity: 0.8 }}>{hint}</div>}
    </button>
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

// ── Valve Control Confirmation Modal ──────────────────────────────────────────

function ValveConfirmModal({ action, onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '20px 20px 0 0',
          padding: '8px 24px 24px',
          boxShadow: '0 -4px 24px rgba(32,41,76,.18)',
        }}
      >
        <div style={{ width: 36, height: 4, background: '#E5E7EB', borderRadius: 2, margin: '0 auto 16px' }} />
        <div style={{ fontSize: 18, fontWeight: 600, color: '#14151A', textAlign: 'center', marginBottom: 8 }}>
          {action === 'close' ? 'Close the valve?' : 'Open the valve?'}
        </div>
        <div style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
          {action === 'close' ? 'This will shut off water flow.' : 'Water flow will resume to this system.'}
        </div>
        <button
          onClick={onConfirm}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
            fontSize: 16, fontWeight: 600, color: '#fff', cursor: 'pointer',
            fontFamily: 'inherit', background: '#0B95F8', marginBottom: 10,
          }}
        >{action === 'close' ? 'Yes, Close Valve' : 'Yes, Open Valve'}</button>
        <button
          onClick={onCancel}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 14, border: 'none',
            background: '#F3F4F6', fontSize: 16, fontWeight: 600,
            color: '#14151A', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >Cancel</button>
      </div>
    </div>
  );
}

// ── System Health Card ───────────────────────────────────────────────────────

function SystemHealthCard({ ws }) {
  const [expanded, setExpanded] = useState(false);

  const isOnline = ws.comm === 'online';
  const valveOk = ws.valve === 'open' || ws.valve === 'closed';
  const powerOk = ws.power == null || ws.power === 'connected';
  const hasRecipients = (ws.alertRecipients || 0) > 0;

  const checks = [
    { key: 'comm', label: 'Communications', value: isOnline ? 'Online' : 'Offline', ok: isOnline,
      meta: ws.lastSeen ? `Last communicated: ${formatLastSeen(ws.lastSeen)}` : null },
    ...(ws.valve != null ? [{
      key: 'valve', label: 'Valve',
      value: ws.valve === 'open' ? 'Open' : ws.valve === 'closed' ? 'Closed' : ws.valve === 'middle' ? 'Middle' : 'Error',
      ok: valveOk,
      why: !valveOk ? (ws.valve === 'middle' ? 'Valve error \u2014 indicator failure' : 'The valve is reporting an error and needs attention.') : null,
    }] : []),
    ...(ws.power != null ? [{
      key: 'power', label: 'Ext. Power',
      value: powerOk ? 'Connected' : 'Disconnected',
      ok: powerOk,
      why: !powerOk ? 'The system is disconnected from its power source.' : null,
    }] : []),
    { key: 'recipients', label: 'Alert Recipients',
      value: hasRecipients ? `${ws.alertRecipients} ${ws.alertRecipients === 1 ? 'person' : 'people'}` : 'None',
      ok: hasRecipients,
      why: !hasRecipients ? 'No one is registered to receive alert notifications.' : null },
  ];

  const issueRows = checks.filter(c => !c.ok);
  const passingRows = checks.filter(c => c.ok);
  const allOk = issueRows.length === 0;

  const ringColor = allOk ? '#5C9E1A' : '#A5455E';
  const iconBg = allOk ? 'rgba(92,158,26,0.10)' : 'rgba(165,69,94,0.10)';

  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
      marginBottom: 8, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: iconBg,
          border: `2px solid ${ringColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: 18, color: ringColor, fontVariationSettings: "'FILL' 1",
          }}>shield</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: allOk ? '#2F6112' : '#A5455E' }}>
            {allOk ? 'Healthy' : `${issueRows.length} issue${issueRows.length !== 1 ? 's' : ''}`}
          </div>
          {!allOk && (
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>
              {issueRows.map(c => c.label).join(' \u00b7 ')}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '0 14px 12px' }}>
        {/* Issue rows — always visible */}
        {issueRows.map(c => (
          <HealthRow key={c.key} c={c} />
        ))}

        {/* Show/hide passing checks */}
        {passingRows.length > 0 && (
          <div
            onClick={() => setExpanded(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 600, color: '#2563EB',
              padding: '8px 0', cursor: 'pointer', userSelect: 'none',
              marginTop: issueRows.length > 0 ? 4 : 0, width: '100%',
              borderTop: issueRows.length > 0 ? '1px solid #F3F4F6' : 'none',
            }}
          >
            {expanded ? 'Hide passing checks' : `Show ${passingRows.length} passing check${passingRows.length !== 1 ? 's' : ''}`}
            <span className="material-symbols-outlined" style={{
              fontSize: 16, color: '#2563EB',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.15s',
            }}>expand_more</span>
          </div>
        )}

        {expanded && passingRows.map(c => (
          <HealthRow key={c.key} c={c} />
        ))}
      </div>
    </div>
  );
}

function HealthRow({ c }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0',
      borderTop: '1px solid #F3F4F6',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
        background: c.ok ? '#5C9E1A' : '#E5A100',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#14151A' }}>{c.label}</span>
          <span style={{
            fontSize: 13, whiteSpace: 'nowrap',
            color: c.ok ? '#9CA3AF' : '#8C5A0F', fontWeight: c.ok ? 500 : 700,
          }}>{c.value}</span>
        </div>
        {!c.ok && c.why && (
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3, lineHeight: 1.4 }}>{c.why}</div>
        )}
        {c.meta && (
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3, lineHeight: 1.4 }}>{c.meta}</div>
        )}
      </div>
    </div>
  );
}

function formatLastSeen(isoStr) {
  if (!isoStr) return 'Unknown';
  const d = new Date(isoStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

// ── Valve Control Card ───────────────────────────────────────────────────────

function ValveControlCard({ ws, onRequestConfirm }) {
  const isOffline = ws.comm === 'offline';

  if (ws.valve == null) {
    return (
      <div style={{
        background: '#F9FAFB', borderRadius: 14, border: '1px dashed #E5E7EB',
        marginBottom: 8, padding: 14,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: '#F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#9CA3AF', fontVariationSettings: "'FILL' 1" }}>do_not_disturb_on</span>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#9CA3AF' }}>Valve Status</div>
          <div style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>No valve installed</div>
        </div>
      </div>
    );
  }

  const isError = ws.valve === 'error' || ws.valve === 'middle';
  const iconBg = isError ? 'rgba(165,69,94,0.12)' : 'rgba(122,129,137,0.14)';
  const iconColor = isError ? '#A5455E' : '#7A8189';
  const positionLabel = ws.valve === 'open' ? 'Open' : ws.valve === 'closed' ? 'Closed' : ws.valve === 'middle' ? 'Middle' : 'Error';
  const errorLabel = ws.valve === 'middle' ? 'Valve error \u2014 indicator failure' : ws.valve === 'error' ? 'Valve error \u2014 needs attention' : null;

  // Determine which actions to show
  const actions = isError ? ['open', 'close']
    : ws.valve === 'open' ? ['close']
    : ws.valve === 'closed' ? ['open']
    : [];

  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
      marginBottom: 8, overflow: 'hidden',
    }}>
      <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, position: 'relative',
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: 22, color: iconColor, fontVariationSettings: "'FILL' 1",
          }}>valve</span>
          {ws.valve === 'closed' && (
            <div style={{
              position: 'absolute', right: -3, bottom: -3,
              width: 16, height: 16, borderRadius: '50%', background: '#1A1D20',
              border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 9, color: '#fff', fontVariationSettings: "'FILL' 1" }}>lock</span>
            </div>
          )}
          {isError && (
            <div style={{
              position: 'absolute', right: -3, bottom: -3,
              width: 16, height: 16, borderRadius: '50%', background: '#A5455E',
              border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>!</span>
            </div>
          )}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#14151A' }}>Valve Status</div>
          <div style={{ fontSize: 14, color: isError ? '#A5455E' : '#6B7280', fontWeight: isError ? 600 : 400, marginTop: 2 }}>
            {positionLabel}
          </div>
          {errorLabel && (
            <div style={{ fontSize: 13, color: '#A5455E', fontWeight: 600, marginTop: 2, lineHeight: 1.4 }}>{errorLabel}</div>
          )}
          {isOffline && (
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#9CA3AF' }}>wifi_off</span>
              System is offline
            </div>
          )}
          {ws.autoShutoff === 'Enabled' && (
            <div style={{ fontSize: 12, color: '#7A8189', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#7A8189', fontVariationSettings: "'FILL' 0" }}>shield</span>
              Auto-shutoff enabled
            </div>
          )}
          {ws.autoShutoff === 'Disabled' && (
            <div style={{ fontSize: 12, color: '#B85C00', marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#B85C00', fontVariationSettings: "'FILL' 0" }}>shield</span>
              Auto-shutoff disabled
            </div>
          )}
        </div>

        {/* Action buttons */}
        {actions.length > 0 && (
          actions.length === 2 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {actions.map(a => (
                <button key={a} onClick={() => !isOffline && onRequestConfirm(a)} disabled={isOffline} style={{
                  padding: '7px 12px', borderRadius: 12, border: 'none', flexShrink: 0,
                  fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'inherit',
                  cursor: isOffline ? 'not-allowed' : 'pointer',
                  background: isOffline ? '#E5E7EB' : '#0B95F8',
                }}>{a === 'open' ? 'Open' : 'Close'}</button>
              ))}
            </div>
          ) : (
            <button onClick={() => !isOffline && onRequestConfirm(actions[0])} disabled={isOffline} style={{
              padding: '9px 16px', borderRadius: 12, border: 'none', flexShrink: 0,
              fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'inherit',
              cursor: isOffline ? 'not-allowed' : 'pointer',
              background: isOffline ? '#E5E7EB' : '#0B95F8',
            }}>{actions[0] === 'open' ? 'Open' : 'Close'}</button>
          )
        )}
      </div>
    </div>
  );
}

// ── Water Event Card ─────────────────────────────────────────────────────────

function WaterEventCard({ waterEvent }) {
  if (!waterEvent) {
    return (
      <div style={{
        background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB',
        marginBottom: 8, padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(92,158,26,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: 18, color: '#5C9E1A', fontVariationSettings: "'FILL' 1",
          }}>check_circle</span>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#14151A' }}>Water Events</div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 1 }}>No active water events</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: '1px solid #FBBF24',
      marginBottom: 8, overflow: 'hidden',
    }}>
      <div style={{
        padding: '3px 14px', background: '#FEF3C7',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#D97706', fontVariationSettings: "'FILL' 1" }}>warning</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '.5px' }}>Active Event</span>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(217,119,6,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#D97706', fontVariationSettings: "'FILL' 1" }}>water_drop</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#14151A' }}>{waterEvent.type}</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
              Started {waterEvent.startedAgo} &middot; {waterEvent.flowLiters}L flow
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function TechWSDetail() {
  const { wsId } = useParams();
  const navigate = useNavigate();
  const [showUnpair, setShowUnpair] = useState(false);
  const [valveConfirm, setValveConfirm] = useState(null); // 'open' | 'close' | null

  const ws = getWSById(wsId);
  if (!ws) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#F3F4F6' }}>
        <TechTopBar />
        <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>Water system not found</div>
      </div>
    );
  }

  const parentCU = ws.cuId ? getCUById(ws.cuId) : null;
  const cuPaired = ws.deviceType === 'flowless' ? true : (parentCU?.paired ?? false);
  const breadcrumb = getLocationBreadcrumb(ws.locationId);
  const lastTso = ws.lastTso ? new Date(ws.lastTso).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '\u2013';
  const retakeRequest = PHOTO_RETAKES.find(pr => pr.wsId === ws.id);
  const hasRetake = !!retakeRequest;

  // Action states per PRD §8.1
  const canPair = !ws.paired && cuPaired;
  const pairDisabled = !ws.paired && !cuPaired;
  const canStartTSO = ws.paired && cuPaired;
  const tsoDisabledNoPair = !ws.paired && cuPaired;
  const tsoDisabledNoCU = !cuPaired;
  const canUnpair = ws.paired && cuPaired;
  const unpairDisabledNoCU = ws.paired && !cuPaired;

  const pairHint = pairDisabled ? 'Pair CU first' : null;
  const tsoHint = tsoDisabledNoCU ? 'Pair CU first' : tsoDisabledNoPair ? 'Pair before TSO' : null;
  const unpairHint = unpairDisabledNoCU ? 'Pair CU first' : null;

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
            {ws.name}
            <span style={{ fontWeight: 400, color: '#6B7280', fontSize: 14 }}> &middot; Water System &middot; {ws.deviceType === 'wint3' ? 'Wint3' : 'Flowless'}</span>
          </div>
          {breadcrumb && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{breadcrumb}</div>}
        </div>

        {/* Commissioning Info */}
        <div style={{ padding: '0 16px', background: '#fff', marginBottom: 8 }}>
          <InfoRow label="Pairing Status">
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              background: ws.paired ? '#DCFCE7' : '#FEE2E2',
              color: ws.paired ? '#16A34A' : '#DC2626',
            }}>{ws.paired ? 'Paired' : 'Unpaired'}</span>
          </InfoRow>
          <InfoRow label="TSO Status">
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              background: ws.tsoStatus === 'pass' ? '#DCFCE7' : ws.tsoStatus === 'fail' ? '#FEE2E2' : ws.tsoStatus === 'partial' ? '#FEF3C7' : '#F3F4F6',
              color: TSO_COLORS[ws.tsoStatus],
            }}>{TSO_LABELS[ws.tsoStatus]}</span>
          </InfoRow>
          <InfoRow label="Last TSO">{lastTso}</InfoRow>
          {ws.deviceType === 'wint3' && parentCU && (
            <InfoRow label="Parent CU">
              <span
                onClick={() => navigate(`/tech/cu/${parentCU.id}`)}
                style={{ color: '#2563EB', cursor: 'pointer' }}
              >{parentCU.name}</span>
            </InfoRow>
          )}
          <InfoRow label={ws.deviceType === 'wint3' ? 'CU Status' : 'Device Status'}>
            {ws.paired ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                  background: '#DCFCE7', color: '#16A34A',
                }}>Paired</span>
                {parentCU && (
                  <span style={{ fontSize: 11, color: parentCU.status === 'online' ? '#16A34A' : '#EF4444' }}>
                    &#9679; {parentCU.status === 'online' ? 'Online' : 'Offline'}
                  </span>
                )}
              </div>
            ) : (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                background: '#FEE2E2', color: '#DC2626',
              }}>Unpaired</span>
            )}
          </InfoRow>
          {ws.deviceType === 'wint3' && (
            <InfoRow label="VMA Serial">{ws.vmaSerial || '\u2013'}</InfoRow>
          )}
          {ws.deviceType === 'flowless' && (
            <InfoRow label="Flowless Serial">{ws.flowlessSerial || '\u2013'}</InfoRow>
          )}
          <div
            onClick={() => navigate(`/tech/ws/${ws.id}/photos`)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid #F3F4F6', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 13, color: '#6B7280' }}>Photos</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {hasRetake ? (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                  background: '#FEF3C7', color: '#D97706',
                }}>Retake Requested</span>
              ) : (
                <span style={{ fontSize: 13, fontWeight: 600, color: '#14151A' }}>View</span>
              )}
              <span style={{ fontSize: 14, color: '#D1D5DB' }}>&rsaquo;</span>
            </div>
          </div>
        </div>

        {/* Operational Data — paired systems only */}
        {ws.paired && (
          <div style={{ padding: '0 16px', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Operational Status</div>
            <WaterEventCard waterEvent={ws.waterEvent} />
            <SystemHealthCard ws={ws} />
            <ValveControlCard ws={ws} onRequestConfirm={(action) => setValveConfirm(action)} />
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: '8px 16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!ws.paired && (
              <ActionButton
                label="Pair"
                disabled={pairDisabled}
                hint={pairHint}
                style={{ background: canPair ? '#2563EB' : '#E5E7EB', color: canPair ? '#fff' : '#9CA3AF' }}
                onClick={() => alert('Pair flow \u2014 not yet implemented')}
              />
            )}
            <ActionButton
              label="Start TSO"
              disabled={!canStartTSO}
              hint={tsoHint}
              style={{ background: canStartTSO ? '#2563EB' : '#E5E7EB', color: canStartTSO ? '#fff' : '#9CA3AF' }}
              onClick={() => alert('TSO flow \u2014 not yet implemented')}
            />
            {hasRetake && (
              <ActionButton
                label="Retake Photos"
                style={{ background: '#FEF3C7', color: '#92400E' }}
                onClick={() => navigate(`/tech/ws/${ws.id}/photos`)}
              />
            )}
            {ws.paired && (
              <ActionButton
                label="Unpair"
                disabled={unpairDisabledNoCU}
                hint={unpairHint}
                style={{ background: canUnpair ? '#FEE2E2' : '#E5E7EB', color: canUnpair ? '#DC2626' : '#9CA3AF' }}
                onClick={() => setShowUnpair(true)}
              />
            )}
          </div>
        </div>
      </div>

      {showUnpair && (
        <UnpairModal
          entityName={ws.name}
          entityType="ws"
          onConfirm={() => { setShowUnpair(false); alert('Unpaired (demo)'); }}
          onCancel={() => setShowUnpair(false)}
        />
      )}

      {valveConfirm && (
        <ValveConfirmModal
          action={valveConfirm}
          onConfirm={() => { setValveConfirm(null); alert(`Valve ${valveConfirm} command sent (demo)`); }}
          onCancel={() => setValveConfirm(null)}
        />
      )}
    </div>
  );
}
