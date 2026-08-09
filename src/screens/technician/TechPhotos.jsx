// Technician — Photo Screen
// Mirrors the TSO photo page: 2-column grid, Mandatory / Other Pictures sections,
// progress counter, admin retake flagging (warning icon on flagged slots).
//
// Standalone (from WS detail): confirm returns to WS detail.
// TSO context (from TSO flow):  confirm returns to TSO dashboard.

import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TechTopBar from '../../components/TechTopBar';
import { getWSById, getLocationBreadcrumb, PHOTO_RETAKES } from '../../data/technicianData';

// ── Mandatory photo categories — device-type specific ──────────────────────────
// Wint3:    5 mandatory (no System Name Sticker)
// Flowless: 6 mandatory (includes System Name Sticker)

const MANDATORY_PHOTOS_WINT3 = [
  { id: 'serial_number',       label: 'Serial Number Sticker' },
  { id: 'valve_closeup',       label: 'Valve Closeup' },
  { id: 'meter_closeup',       label: 'Meter Closeup' },
  { id: 'system_installation', label: 'System Installation' },
  { id: 'area_view',           label: 'Area View' },
];

const MANDATORY_PHOTOS_FLOWLESS = [
  { id: 'serial_number',       label: 'Serial Number Sticker' },
  { id: 'system_name',         label: 'System Name Sticker' },
  { id: 'valve_closeup',       label: 'Valve Closeup' },
  { id: 'meter_closeup',       label: 'Meter Closeup' },
  { id: 'system_installation', label: 'System Installation' },
  { id: 'area_view',           label: 'Area View' },
];

// ── Photo tile (2-column grid item) ────────────────────────────────────────────

function PhotoTile({ label, photo, flagged, onTap }) {
  const hasPhoto = !!photo;

  return (
    <div
      onClick={onTap}
      style={{
        background: '#fff',
        borderRadius: 10,
        border: flagged ? '2px solid #F59E0B' : '1px solid #E5E7EB',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Thumbnail area */}
      <div style={{
        height: 96,
        background: hasPhoto ? '#E8F5E9' : '#F9FAFB',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {hasPhoto ? (
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#16A34A' }}>check_circle</span>
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#D1D5DB' }}>add</span>
        )}
        {/* Admin flag icon — top-right */}
        {flagged && (
          <span className="material-symbols-outlined" style={{
            position: 'absolute', top: 6, right: 6,
            fontSize: 18, color: '#D97706',
            background: '#FEF3C7', borderRadius: '50%', padding: 2,
          }}>warning</span>
        )}
      </div>
      {/* Label */}
      <div style={{
        padding: '8px 10px',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {hasPhoto && !flagged && (
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#16A34A' }}>check</span>
        )}
        {flagged && (
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#D97706' }}>warning</span>
        )}
        <span style={{ fontSize: 12, fontWeight: 500, color: '#14151A' }}>{label}</span>
      </div>
    </div>
  );
}

// ── "Other Pictures" add tile ──────────────────────────────────────────────────

function AddOtherTile({ onTap }) {
  return (
    <div
      onClick={onTap}
      style={{
        background: '#fff',
        borderRadius: 10,
        border: '1px dashed #D1D5DB',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        height: 96,
        background: '#FAFAFA',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#D1D5DB' }}>add</span>
      </div>
      <div style={{ padding: '8px 10px' }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF' }}>Add</span>
      </div>
    </div>
  );
}

function OtherPhotoTile({ photo, index, onTap }) {
  return (
    <div
      onClick={onTap}
      style={{
        background: '#fff',
        borderRadius: 10,
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        height: 96,
        background: '#E8F5E9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#16A34A' }}>check_circle</span>
      </div>
      <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#16A34A' }}>check</span>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#14151A' }}>Photo {index + 1}</span>
      </div>
    </div>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────────

function ProgressBar({ uploaded, total, hasFlaggedRetakes }) {
  const allDone = uploaded === total && !hasFlaggedRetakes;
  const pct = total > 0 ? (uploaded / total) * 100 : 0;

  return (
    <div style={{
      margin: '0 16px 16px',
      padding: '10px 14px',
      background: allDone ? '#DCFCE7' : hasFlaggedRetakes ? '#FEF3C7' : '#F3F4F6',
      borderRadius: 10,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {/* Progress circle or icon */}
      {allDone ? (
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#16A34A' }}>check_circle</span>
      ) : hasFlaggedRetakes ? (
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#D97706' }}>warning</span>
      ) : (
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          border: '3px solid #E5E7EB',
          borderTopColor: '#2563EB',
          transform: `rotate(${pct * 3.6}deg)`,
        }} />
      )}
      <span style={{
        fontSize: 13, fontWeight: 600,
        color: allDone ? '#16A34A' : hasFlaggedRetakes ? '#92400E' : '#374151',
      }}>
        {hasFlaggedRetakes
          ? 'Update photos to clear admin request'
          : allDone
            ? 'All mandatory uploaded'
            : `${uploaded} of ${total} mandatory`}
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TechPhotos() {
  const { wsId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isTsoContext = location.state?.fromTso === true;

  const ws = getWSById(wsId);
  if (!ws) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#F3F4F6' }}>
        <TechTopBar />
        <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>Water system not found</div>
      </div>
    );
  }

  const breadcrumb = getLocationBreadcrumb(ws.locationId);
  const mandatoryCategories = ws.deviceType === 'flowless' ? MANDATORY_PHOTOS_FLOWLESS : MANDATORY_PHOTOS_WINT3;
  const retakeRequest = PHOTO_RETAKES.find(pr => pr.wsId === ws.id);
  const flaggedIds = retakeRequest ? retakeRequest.categories : [];

  // Mock existing photos — systems with pass have all mandatory; partial has some
  const [photos, setPhotos] = useState(() => {
    const initial = {};
    if (ws.tsoStatus === 'pass') {
      mandatoryCategories.forEach(cat => { initial[cat.id] = { timestamp: ws.lastTso }; });
    } else if (ws.tsoStatus === 'partial') {
      // Partial: first 3 mandatory captured
      mandatoryCategories.slice(0, 3).forEach(cat => { initial[cat.id] = { timestamp: ws.lastTso }; });
    }
    return initial;
  });

  // Other Pictures (unlimited user uploads)
  const [otherPhotos, setOtherPhotos] = useState(() => {
    // Systems with pass/partial have 1 other photo
    if (ws.tsoStatus === 'pass' || ws.tsoStatus === 'partial') {
      return [{ id: 'other-1', timestamp: ws.lastTso }];
    }
    return [];
  });

  const handleCaptureMandatory = (categoryId) => {
    setPhotos(prev => ({
      ...prev,
      [categoryId]: { timestamp: new Date().toISOString(), justCaptured: true },
    }));
  };

  const handleAddOther = () => {
    setOtherPhotos(prev => [
      ...prev,
      { id: `other-${prev.length + 1}`, timestamp: new Date().toISOString() },
    ]);
  };

  // Progress: count mandatory photos uploaded
  const uploadedCount = mandatoryCategories.filter(cat => photos[cat.id]).length;
  const totalMandatory = mandatoryCategories.length;

  // Are there still unfulfilled admin retake requests?
  const hasFlaggedRetakes = flaggedIds.some(id => !photos[id]?.justCaptured);

  const handleConfirm = () => {
    navigate(`/tech/ws/${wsId}`, { replace: true });
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
          <div style={{ fontSize: 18, fontWeight: 700, color: '#14151A' }}>Photos</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
            {ws.name}
            <span style={{ color: '#9CA3AF' }}> &middot; {ws.deviceType === 'wint3' ? 'Wint3' : 'Flowless'}</span>
          </div>
          {breadcrumb && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{breadcrumb}</div>}
        </div>

        {/* Admin retake banner */}
        {retakeRequest && hasFlaggedRetakes && (
          <div style={{
            margin: '12px 16px 0', padding: '10px 14px',
            background: '#FEF3C7', borderRadius: 10, border: '1px solid #FDE68A',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#D97706' }}>warning</span>
            <div style={{ fontSize: 13, color: '#92400E', fontWeight: 500 }}>
              New photos requested by admin
            </div>
          </div>
        )}

        {/* ── Mandatory section ── */}
        <div style={{ padding: '16px 16px 4px' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#6B7280',
            textTransform: 'uppercase', letterSpacing: '.5px',
            marginBottom: 10, paddingBottom: 6,
            borderBottom: '1px solid #E5E7EB',
          }}>Mandatory</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}>
            {mandatoryCategories.map(cat => (
              <PhotoTile
                key={cat.id}
                label={cat.label}
                photo={photos[cat.id]}
                flagged={flaggedIds.includes(cat.id) && !photos[cat.id]?.justCaptured}
                onTap={() => handleCaptureMandatory(cat.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Other Pictures section ── */}
        <div style={{ padding: '16px 16px 4px' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#6B7280',
            textTransform: 'uppercase', letterSpacing: '.5px',
            marginBottom: 10, paddingBottom: 6,
            borderBottom: '1px solid #E5E7EB',
          }}>Other Pictures</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
          }}>
            {otherPhotos.map((photo, i) => (
              <OtherPhotoTile key={photo.id} photo={photo} index={i} onTap={() => {}} />
            ))}
            <AddOtherTile onTap={handleAddOther} />
          </div>
        </div>

        {/* Progress counter */}
        <div style={{ padding: '12px 0 0' }}>
          <ProgressBar
            uploaded={uploadedCount}
            total={totalMandatory}
            hasFlaggedRetakes={hasFlaggedRetakes}
          />
        </div>

        {/* Confirm button */}
        <div style={{ padding: '0 16px 24px' }}>
          <button
            onClick={handleConfirm}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              background: '#2563EB', color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            {isTsoContext ? 'Confirm & Return to TSO' : 'Confirm Photos'}
          </button>
        </div>
      </div>
    </div>
  );
}
