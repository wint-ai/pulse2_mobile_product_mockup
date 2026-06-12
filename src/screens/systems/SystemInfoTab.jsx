// System Detail · Info tab — same foldable anatomy as the Home Info tab.
// All sections collapsed by default. Pictures + Notes are user-editable per
// system via locationInfoStore. Address / Shipping / Location contacts pull
// from the system's parent account (real product would store these on the
// location record).

import { useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getSystemInfo, getSystemSpecs } from '../../data/systemsInfo';
import { getAccountById } from '../../data/accounts';
import {
  getNotesOverride, setNotes,
  getPictures, addPicture, removePicture,
} from '../../data/locationInfoStore';

function MIcon({ name, size = 18, color, style = {} }) {
  return (
    <span className="material-symbols-outlined"
      style={{ fontSize: size, color, lineHeight: 1, ...style }}>{name}</span>
  );
}

// Label-on-left, value-on-right row used by the spec sections.
function KV({ label, value, theme, copy }) {
  function doCopy() {
    if (!copy || !value) return;
    try { navigator.clipboard?.writeText(String(value)); } catch { /* ignore */ }
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '2px 0' }}>
      <span style={{ fontSize: 13, color: theme.textTertiary }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: theme.text, textAlign: 'right', display: 'inline-flex', alignItems: 'center', gap: 6, fontVariantNumeric: 'tabular-nums' }}>
        {value}
        {copy && value && (
          <span onClick={doCopy} title="Copy" style={{ cursor: 'pointer', display: 'inline-flex' }}>
            <MIcon name="content_copy" size={14} color={theme.textTertiary} />
          </span>
        )}
      </span>
    </div>
  );
}

// ── Foldable section card ──
function InfoSection({ theme, icon, title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: theme.card,
      border: `1px solid ${theme.cardBorderColor || '#E5E8EE'}`,
      borderRadius: 12, marginBottom: 8, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(20,21,26,0.05)',
    }}>
      <div onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px', cursor: 'pointer', userSelect: 'none',
      }}>
        <MIcon name={icon} size={18} color={theme.textSecondary} />
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: theme.text, letterSpacing: '-0.2px' }}>{title}</span>
        <MIcon name={open ? 'expand_less' : 'expand_more'} size={20} color={theme.textTertiary} />
      </div>
      {open && (
        <div style={{ padding: '0 14px 12px' }}>{children}</div>
      )}
    </div>
  );
}

// ── Notes editor ──
function NotesEditor({ scopeId, defaultNotes, theme }) {
  const [override, setOverride] = useState(() => getNotesOverride(scopeId));
  const value = override ?? defaultNotes ?? '';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEdit() { setDraft(value); setEditing(true); }
  function save() { setNotes(scopeId, draft); setOverride(draft); setEditing(false); }
  function cancel() { setEditing(false); }

  if (editing) {
    return (
      <div>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={5}
          autoFocus
          placeholder="Add notes for this system…"
          style={{
            width: '100%', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.5,
            color: theme.text, background: theme.inputBg,
            border: `1px solid ${theme.divider || '#E5E8EE'}`,
            borderRadius: 8, padding: '8px 10px', resize: 'vertical',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={cancel} style={{
            padding: '6px 14px', borderRadius: 8, border: `1px solid ${theme.divider || '#E5E8EE'}`,
            background: theme.card, color: theme.textSecondary,
            fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={save} style={{
            padding: '6px 14px', borderRadius: 8, border: 'none',
            background: theme.accent || '#04ADEF', color: '#fff',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
          }}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {value ? (
        <div style={{ fontSize: 14, color: theme.text, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{value}</div>
      ) : (
        <div style={{ fontSize: 13, color: theme.textTertiary, fontStyle: 'italic' }}>No notes yet</div>
      )}
      <button onClick={startEdit} style={{
        marginTop: 10, padding: '6px 12px', borderRadius: 8,
        border: `1px solid ${theme.divider || '#E5E8EE'}`,
        background: theme.card, color: theme.accent || '#04ADEF',
        fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        <MIcon name="edit" size={14} color={theme.accent || '#04ADEF'} />
        {value ? 'Edit' : 'Add notes'}
      </button>
    </div>
  );
}

// ── Pictures editor ──
function PicturesEditor({ scopeId, theme }) {
  const [pictures, setPictures] = useState(() => getPictures(scopeId));
  const [lightbox, setLightbox] = useState(null);
  const fileInputRef = useRef(null);

  function refresh() { setPictures(getPictures(scopeId)); }

  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    let pending = files.length;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') addPicture(scopeId, reader.result);
        pending -= 1;
        if (pending === 0) refresh();
      };
      reader.onerror = () => { pending -= 1; if (pending === 0) refresh(); };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }

  function remove(id) {
    removePicture(scopeId, id);
    refresh();
    if (lightbox && lightbox.id === id) setLightbox(null);
  }

  return (
    <div>
      {pictures.length === 0 ? (
        <div style={{ fontSize: 13, color: theme.textTertiary, fontStyle: 'italic', marginBottom: 10 }}>No pictures yet</div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
          gap: 6, marginBottom: 10,
        }}>
          {pictures.map(p => (
            <div key={p.id} style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 8, overflow: 'hidden', background: theme.inputBg }}>
              <img src={p.dataUrl} alt="" onClick={() => setLightbox(p)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block' }} />
              <button onClick={() => remove(p.id)} aria-label="Remove picture"
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 22, height: 22, borderRadius: '50%',
                  border: 'none', background: 'rgba(20,21,26,0.7)',
                  color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>×</button>
            </div>
          ))}
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
      <button onClick={() => fileInputRef.current?.click()} style={{
        padding: '6px 12px', borderRadius: 8,
        border: `1px solid ${theme.divider || '#E5E8EE'}`,
        background: theme.card, color: theme.accent || '#04ADEF',
        fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        <MIcon name="add_a_photo" size={14} color={theme.accent || '#04ADEF'} />
        Add picture
      </button>

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20, cursor: 'zoom-out',
        }}>
          <img src={lightbox.dataUrl} alt=""
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}

// ── Main ──
export default function SystemInfoTab({ sys }) {
  const { theme } = useTheme();
  const info = getSystemInfo(sys.id);
  const specs = getSystemSpecs(sys.id);

  // Pull location-level data (address / shipping / contacts) from the parent
  // account for the mockup. Real product: these live on the location record.
  const account = (() => {
    const accId = sys?.account;
    if (!accId) return null;
    const a = getAccountById(accId);
    return a?.parentId ? getAccountById(a.parentId) : a;
  })();

  const address = account?.address || '';
  const shippingAddress = account?.shippingAddress || '';
  const contacts = account?.contacts || [];
  const defaultNotes = ''; // System-level notes start empty; user-editable.
  const scopeId = sys.id;

  const placeholder = (text) => (
    <div style={{ fontSize: 13, color: theme.textTertiary, fontStyle: 'italic' }}>{text}</div>
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 24px' }}>

      {/* Scope header — system name + location path */}
      <div style={{ padding: '4px 4px 10px' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: theme.text, letterSpacing: '-0.3px' }}>{sys.name}</div>
        <div style={{ fontSize: 12, color: theme.textTertiary, marginTop: 2 }}>
          {[sys.l4Name, sys.l3Name].filter(Boolean).join(' · ') || '—'}
        </div>
      </div>

      {/* Location (granular per-system) */}
      {info.location && (
        <InfoSection theme={theme} icon="location_on" title="Location">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { label: 'Building', value: info.location.building },
              { label: 'Campus',   value: info.location.campus },
              { label: 'Floor',    value: info.location.floor },
              { label: 'Zone',     value: info.location.zone },
              { label: 'Room',     value: info.location.room },
            ].filter(r => r.value).map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: theme.textTertiary }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: theme.text, textAlign: 'right' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </InfoSection>
      )}

      {/* Address */}
      <InfoSection theme={theme} icon="home_pin" title="Address">
        {address
          ? <div style={{ fontSize: 14, color: theme.text, lineHeight: 1.45, whiteSpace: 'pre-line' }}>{address}</div>
          : placeholder('No address on file')}
      </InfoSection>

      {/* Shipping address */}
      <InfoSection theme={theme} icon="local_shipping" title="Shipping address">
        {shippingAddress
          ? <div style={{ fontSize: 14, color: theme.text, lineHeight: 1.45, whiteSpace: 'pre-line' }}>{shippingAddress}</div>
          : (address
              ? <div style={{ fontSize: 13, color: theme.textTertiary, fontStyle: 'italic' }}>Same as address</div>
              : placeholder('No shipping address on file'))}
      </InfoSection>

      {/* Location contacts — email + phone, no role */}
      <InfoSection theme={theme} icon="contacts" title={`Location contacts${contacts.length ? ` (${contacts.length})` : ''}`}>
        {contacts.length === 0 ? placeholder('No contacts on file') : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {contacts.map((c, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', gap: 4,
                paddingTop: i === 0 ? 2 : 10,
                borderTop: i === 0 ? 'none' : `1px solid ${theme.divider || '#EEF1F4'}`,
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{c.name}</div>
                {c.email && (
                  <a href={`mailto:${c.email}`} style={{
                    fontSize: 13, color: theme.accent || '#04ADEF', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}>
                    <MIcon name="mail" size={14} color={theme.accent || '#04ADEF'} />
                    {c.email}
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone.replace(/\s/g, '')}`} style={{
                    fontSize: 13, color: theme.accent || '#04ADEF', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}>
                    <MIcon name="phone" size={14} color={theme.accent || '#04ADEF'} />
                    {c.phone}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </InfoSection>

      {/* About */}
      {info.description && (
        <InfoSection theme={theme} icon="info" title="About">
          <p style={{ fontSize: 14, color: theme.textSecondary, lineHeight: 1.55, margin: 0 }}>{info.description}</p>
        </InfoSection>
      )}

      {/* Protects */}
      {info.protects?.length > 0 && (
        <InfoSection theme={theme} icon="shield" title="Protects">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {info.protects.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.accent || '#04ADEF', flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: theme.text }}>{p}</span>
              </div>
            ))}
          </div>
        </InfoSection>
      )}

      {/* General specs — pipe topology, valve model, monitored env, meter model */}
      <InfoSection theme={theme} icon="tune" title="General">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <KV label="Pipe topology"        value={specs.pipeTopology}        theme={theme} />
          <KV label="Valve model"          value={specs.valveModel}          theme={theme} />
          <KV label="Monitored environment" value={specs.monitoredEnvironment} theme={theme} />
          <KV label="Meter model"          value={specs.meterModel}          theme={theme} />
        </div>
      </InfoSection>

      {/* Device type — family + manufacturer + model + serial + install date */}
      <InfoSection theme={theme} icon="memory" title="Device type">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <KV label="Device family" value={specs.deviceFamily} theme={theme} />
          {info.manufacturer  && <KV label="Manufacturer"  value={info.manufacturer} theme={theme} />}
          {info.model         && <KV label="Model"         value={info.model}        theme={theme} />}
          {info.serialNumber  && <KV label="Serial number" value={info.serialNumber} theme={theme} copy />}
          {info.installDate   && <KV label="Install date"  value={new Date(info.installDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} theme={theme} />}
        </div>
      </InfoSection>

      {/* Coverage — area + occupancy */}
      <InfoSection theme={theme} icon="square_foot" title="Coverage">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <KV label="Coverage area" value={`${specs.coverageArea.toLocaleString()} m²`} theme={theme} />
          <KV label="Occupancy"     value={specs.occupancy.toLocaleString()}            theme={theme} />
        </div>
      </InfoSection>

      {/* Pictures — editable, persisted via locationInfoStore */}
      <InfoSection theme={theme} icon="image" title="Pictures">
        <PicturesEditor scopeId={scopeId} theme={theme} />
      </InfoSection>

      {/* Notes — editable, persisted via locationInfoStore */}
      <InfoSection theme={theme} icon="notes" title="Notes">
        <NotesEditor scopeId={scopeId} defaultNotes={defaultNotes} theme={theme} />
      </InfoSection>
    </div>
  );
}
