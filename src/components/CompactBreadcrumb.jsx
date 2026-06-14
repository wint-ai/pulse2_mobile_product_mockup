// Compact breadcrumb for Home / Alerts / System Detail headers.
// Locked 2026-06-13:
//   1) Collapsed by default. Pattern: "My Systems > ... > {immediate parent}"
//      when scope is 2+ levels deep. When scope is 0-1 levels, no ellipsis.
//   2) Tap the "..." crumb to expand inline. The "..." is replaced by the
//      hidden middle ancestors and the row now shows the full chain. No
//      popover, no separate menu - just the full breadcrumb in place.
//   3) Tap any crumb (My Systems, a middle ancestor, or the immediate
//      parent) to navigate to that scope. The parent component handles
//      the scope change.
//   4) Expand state resets whenever the active scope changes (new
//      ancestor chain -> fresh collapsed view).
//
// Click handling: every interactive element calls e.stopPropagation()
// so the breadcrumb works inside the drawer-trigger composition (which
// has its own click handler that opens the drawer).

import { useState, useEffect } from 'react';

export default function CompactBreadcrumb({
  ancestors = [],
  onClearScope,
  onSelectAncestor,
}) {
  const [expanded, setExpanded] = useState(false);

  // Reset expanded whenever the ancestor chain changes (new scope).
  // Key on the ancestor IDs joined so we don't re-fire on every render.
  const ancestorKey = ancestors.map(a => a.id).join('|');
  useEffect(() => {
    setExpanded(false);
  }, [ancestorKey]);

  const crumbStyle = { color: '#036AB5', textDecoration: 'underline', cursor: 'pointer' };
  const sepStyle = { color: '#B8BCC4', flexShrink: 0, fontSize: 12 };

  const len = ancestors.length;
  const immediateParent = len > 0 ? ancestors[len - 1] : null;

  function handleClear(e) {
    e.stopPropagation();
    onClearScope?.();
  }

  function handleAncestor(e, a) {
    e.stopPropagation();
    onSelectAncestor?.(a);
  }

  function handleExpand(e) {
    e.stopPropagation();
    setExpanded(true);
  }

  // Compute whether to collapse or expand:
  //   - len <= 1: nothing to collapse. Render straight chain.
  //   - len >= 2 + !expanded: collapsed view (My Systems > ... > parent).
  //   - len >= 2 + expanded: full chain.
  const showCollapsed = len >= 2 && !expanded;

  return (
    <div
      style={{
        fontSize: 12, color: '#4A4F5A', lineHeight: 1.5, marginBottom: 2,
        display: 'flex', alignItems: 'center', flexWrap: 'wrap',
        gap: 6,
        minWidth: 0,
      }}
    >
      {/* "My Systems" - always present when there's any selected scope */}
      <span
        onClick={handleClear}
        style={{ ...crumbStyle, flexShrink: 0 }}
        title="Back to all systems"
      >My Systems</span>

      {/* No ancestors -> nothing else to render */}
      {len === 0 && null}

      {/* 1 ancestor: My Systems > {parent} */}
      {len === 1 && immediateParent && (
        <>
          <span style={sepStyle}>›</span>
          <span
            onClick={(e) => handleAncestor(e, immediateParent)}
            style={{ ...crumbStyle, minWidth: 0 }}
            title={immediateParent.name}
          >{immediateParent.name}</span>
        </>
      )}

      {/* 2+ ancestors, collapsed: My Systems > ... > {parent} */}
      {showCollapsed && (
        <>
          <span style={sepStyle}>›</span>
          <span
            onClick={handleExpand}
            role="button"
            aria-label={`Show full path · ${ancestors.length - 1} hidden level${ancestors.length - 1 !== 1 ? 's' : ''}`}
            style={{
              ...crumbStyle,
              flexShrink: 0,
              padding: '0 2px',
            }}
            title={`Show full path · ${ancestors.length - 1} hidden level${ancestors.length - 1 !== 1 ? 's' : ''}`}
          >…</span>
          <span style={sepStyle}>›</span>
          <span
            onClick={(e) => handleAncestor(e, immediateParent)}
            style={{ ...crumbStyle, minWidth: 0 }}
            title={immediateParent.name}
          >{immediateParent.name}</span>
        </>
      )}

      {/* 2+ ancestors, expanded: full chain */}
      {len >= 2 && expanded && ancestors.map((a) => (
        <span key={a.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={sepStyle}>›</span>
          <span
            onClick={(e) => handleAncestor(e, a)}
            style={{ ...crumbStyle, minWidth: 0 }}
            title={a.name}
          >{a.name}</span>
        </span>
      ))}
    </div>
  );
}
