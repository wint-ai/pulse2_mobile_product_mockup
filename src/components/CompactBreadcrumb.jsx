// Compact breadcrumb for Home / Alerts / System Detail headers.
// Locked 2026-06-13 after user feedback that the previous full ancestor
// chain was "super annoying" and the simple chevron-left fallback didn't
// signal that levels were hidden.
//
// Rules:
//   - 0 ancestors -> "My Systems" only (scope IS the account or top-level
//     node; nothing above to navigate to).
//   - 1 ancestor  -> "My Systems > {parent}".
//   - 2+ ancestors -> "My Systems > [...] > {immediate parent}". The
//     [...] is a `more_horiz` pill button that opens a popover listing
//     the hidden middle ancestors. Each popover item is tappable - sets
//     scope to that ancestor and dismisses the popover.
//
// Click handling: every interactive element stops propagation so the
// breadcrumb works correctly inside the drawer-trigger composition
// (which also has its own click handler that opens the drawer).

import { useState, useRef, useEffect } from 'react';

function MIcon({ name, size = 16, color, style = {} }) {
  return (
    <span className="material-symbols-outlined"
      style={{ fontSize: size, color, lineHeight: 1, ...style }}
    >{name}</span>
  );
}

export default function CompactBreadcrumb({
  ancestors = [],
  onClearScope,
  onSelectAncestor,
}) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef(null);
  const dotsBtnRef = useRef(null);

  // Outside-tap and Escape close the popover.
  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (popoverRef.current && popoverRef.current.contains(e.target)) return;
      if (dotsBtnRef.current && dotsBtnRef.current.contains(e.target)) return;
      setOpen(false);
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const crumbStyle = { color: '#036AB5', textDecoration: 'underline', cursor: 'pointer' };
  const sepStyle = { color: '#B8BCC4', flexShrink: 0, fontSize: 12 };

  const len = ancestors.length;
  const immediateParent = len > 0 ? ancestors[len - 1] : null;
  const middleAncestors = len >= 2 ? ancestors.slice(0, -1) : [];

  function handleClear(e) {
    e.stopPropagation();
    onClearScope?.();
    setOpen(false);
  }

  function handleAncestor(e, a) {
    e.stopPropagation();
    onSelectAncestor?.(a);
    setOpen(false);
  }

  return (
    <div
      style={{
        fontSize: 12, color: '#4A4F5A', lineHeight: 1.4, marginBottom: 2,
        display: 'flex', alignItems: 'center', gap: 6,
        minWidth: 0,
      }}
    >
      {/* "My Systems" - always present when a scope is selected. */}
      <span
        onClick={handleClear}
        style={{ ...crumbStyle, flexShrink: 0 }}
        title="Back to all systems"
      >My Systems</span>

      {/* Separator + parent crumb appear only when there's at least one
          ancestor. */}
      {len > 0 && <span style={sepStyle}>›</span>}

      {/* 1 ancestor: show it directly. */}
      {len === 1 && immediateParent && (
        <span
          onClick={(e) => handleAncestor(e, immediateParent)}
          style={{ ...crumbStyle, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          title={immediateParent.name}
        >{immediateParent.name}</span>
      )}

      {/* 2+ ancestors: [...] popover trigger + immediate parent. */}
      {len >= 2 && (
        <>
          <span
            ref={dotsBtnRef}
            onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
            role="button"
            aria-label={`Show ${middleAncestors.length} hidden level${middleAncestors.length !== 1 ? 's' : ''}`}
            aria-expanded={open}
            style={{
              position: 'relative',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              padding: '3px 8px',
              borderRadius: 6,
              background: open ? 'rgba(11,149,248,0.20)' : 'rgba(11,149,248,0.10)',
              border: `1px solid ${open ? 'rgba(11,149,248,0.35)' : 'rgba(11,149,248,0.20)'}`,
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background 0.12s ease, border-color 0.12s ease',
            }}
            title={`Show hidden path · ${middleAncestors.length} level${middleAncestors.length !== 1 ? 's' : ''}`}
          >
            <MIcon name="more_horiz" size={14} color="#036AB5" />

            {/* Popover - anchored to the dots button so it appears right
                under what the user tapped. Visible only when open. */}
            {open && middleAncestors.length > 0 && (
              <div
                ref={popoverRef}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '100%', left: 0,
                  marginTop: 6,
                  background: '#FFFFFF',
                  border: '1px solid #E5E8EE',
                  borderRadius: 10,
                  boxShadow: '0 6px 22px rgba(20,21,26,0.12)',
                  minWidth: 220,
                  maxWidth: 300,
                  zIndex: 30,
                  overflow: 'hidden',
                  cursor: 'default',
                }}
                role="menu"
              >
                <div style={{
                  padding: '8px 12px',
                  fontSize: 10, fontWeight: 700,
                  color: '#717684', letterSpacing: '.4px',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid #EEF1F4',
                }}>Path</div>
                {middleAncestors.map((a, i) => (
                  <div
                    key={a.id}
                    onClick={(e) => handleAncestor(e, a)}
                    role="menuitem"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '11px 12px',
                      cursor: 'pointer',
                      borderTop: i === 0 ? 'none' : '1px solid #EEF1F4',
                      fontSize: 13, fontWeight: 500, color: '#14151A',
                    }}
                    title={a.name}
                  >
                    <span style={{
                      flex: 1, minWidth: 0,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{a.name}</span>
                    <MIcon name="chevron_right" size={16} color="#B8BCC4" />
                  </div>
                ))}
              </div>
            )}
          </span>
          <span style={sepStyle}>›</span>
          <span
            onClick={(e) => handleAncestor(e, immediateParent)}
            style={{ ...crumbStyle, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            title={immediateParent.name}
          >{immediateParent.name}</span>
        </>
      )}
    </div>
  );
}
