import { getScopePath } from '../utils/scopePath';

/**
 * Renders the current scope as a hierarchy breadcrumb chip.
 * Tap → opens the navigation drawer.
 *
 * @param {Array}   systems   — current visible systems
 * @param {boolean} exploring — true when "Explore All" is on
 * @param {function} onClick  — called to open the drawer
 */
export default function ScopeChip({ systems, exploring, onClick }) {
  const { crumbs, all, summary } = getScopePath(systems, exploring);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.20)',
        padding: '5px 10px', borderRadius: 8, cursor: onClick ? 'pointer' : 'default',
        fontSize: 12, color: '#fff', fontWeight: 500,
        maxWidth: '100%', minWidth: 0,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', flexShrink: 0 }}>layers</span>
      {all ? (
        <span style={{ color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
          All systems
        </span>
      ) : summary ? (
        <span style={{ color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
          {summary}
        </span>
      ) : (
        crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {i > 0 && <span style={{ color: 'rgba(255,255,255,0.55)', flexShrink: 0 }}>›</span>}
            <span style={{
              color: i === crumbs.length - 1 ? '#fff' : 'rgba(255,255,255,0.95)',
              fontWeight: i === crumbs.length - 1 ? 600 : 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
            }}>{c}</span>
          </span>
        ))
      )}
      <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', flexShrink: 0, marginLeft: 'auto' }}>expand_more</span>
    </div>
  );
}
