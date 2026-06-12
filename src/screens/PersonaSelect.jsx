import { useNavigate } from 'react-router-dom';
import { PERSONAS } from '../data/personas';
import { useUserContext } from '../context/UserContext';

export default function PersonaSelect() {
  const navigate = useNavigate();
  const { setPersona } = useUserContext();

  function selectPersona(persona) {
    setPersona(persona);
    navigate(persona.homePath);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: '#F7F7F8' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #1E3A5F 0%, #04ADEF 100%)',
        padding: '36px 24px 28px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>💧</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Pulse2</div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px', marginBottom: 4 }}>
          Choose your profile
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,.65)', fontWeight: 400 }}>
          Demo mode · Tap a profile to continue
        </div>
      </div>

      {/* Persona list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 24px' }}>

        {/* Switch-profile hint — reminds reviewers that they can swap between
            these personas at any time by tapping the More tab at the bottom
            of the app. Sits above the customer-users section so it's the
            first thing the reader sees. */}
        <div style={{
          background: 'rgba(4,173,239,0.08)',
          border: '1px solid rgba(4,173,239,0.25)',
          borderRadius: 12,
          padding: '10px 12px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
        }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: '#036AB5', marginTop: 1, fontVariationSettings: "'FILL' 1", flexShrink: 0 }}
          >info</span>
          <div style={{ fontSize: 13, color: '#14151A', lineHeight: 1.45 }}>
            Press <span style={{ fontWeight: 700 }}>More</span> in the bottom tab bar at any time to switch to a different profile.
          </div>
        </div>

        {/* Section: Customer users */}
        <div style={{ fontSize: 12, fontWeight: 700, color: '#717684', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8, paddingLeft: 2 }}>
          Customer users
        </div>
        {PERSONAS.filter(p => !p.isWint).map(p => (
          <PersonaCard key={p.id} persona={p} onSelect={selectPersona} />
        ))}

        {/* Section: Wint users */}
        <div style={{ fontSize: 12, fontWeight: 700, color: '#717684', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8, marginTop: 18, paddingLeft: 2 }}>
          Wint staff
        </div>
        {PERSONAS.filter(p => p.isWint).map(p => (
          <PersonaCard key={p.id} persona={p} onSelect={selectPersona} />
        ))}

        <div style={{ fontSize: 13, color: '#717684', textAlign: 'center', marginTop: 24, lineHeight: 1.5 }}>
          Pulse2 by Wint Water Intelligence · Demo prototype
        </div>
      </div>
    </div>
  );
}

function PersonaCard({ persona: p, onSelect }) {
  return (
    <div
      onClick={() => onSelect(p)}
      style={{
        background: '#fff',
        borderRadius: 14,
        marginBottom: 9,
        cursor: 'pointer',
        border: '0.5px solid #DEE0E3',
        borderLeft: `4px solid ${p.color}`,
        padding: '13px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: p.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        {p.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#14151A', letterSpacing: '-0.2px' }}>
            {p.name}
          </span>
          {p.isWint && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
              background: '#F5F3FF', color: '#7C3AED', letterSpacing: '.3px', textTransform: 'uppercase',
            }}>Wint</span>
          )}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: p.color, marginBottom: 2 }}>{p.role}</div>
        <div style={{ fontSize: 13, color: '#717684' }}>{p.sub}</div>
        <div style={{ fontSize: 13, color: '#717684', marginTop: 3, lineHeight: 1.4 }}>{p.description}</div>
      </div>

      <span style={{ fontSize: 16, color: '#D1D5DB', flexShrink: 0 }}>›</span>
    </div>
  );
}
