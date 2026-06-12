import { useState } from 'react';
import BottomSheet from './BottomSheet';
import { SCOPES } from '../data/scopes';

export default function ScopePill({ scope, onScopeChange }) {
  const [open, setOpen] = useState(false);
  const isFiltered = scope.key !== 'all';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          borderRadius: 20,
          padding: '6px 12px 6px 7px',
          cursor: 'pointer',
          border: isFiltered ? '1.5px solid #FED7AA' : 'none',
          fontFamily: 'inherit',
          background: isFiltered ? '#FFF7ED' : '#EFF6FF',
        }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: 7, fontSize: 11, fontWeight: 700,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          background: isFiltered ? '#EA580C' : '#04ADEF',
        }}>W</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: isFiltered ? '#C2410C' : '#1E40AF', whiteSpace: 'nowrap' }}>
            {scope.key === 'all' ? 'Suffolk Construction' : scope.label}
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: isFiltered ? '#C2410C' : '#3B82F6', marginTop: 1 }}>
            {scope.sub}
          </div>
        </div>
        <span style={{ fontSize: 12, color: isFiltered ? '#C2410C' : '#04ADEF', marginLeft: 2 }}>▾</span>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Filter by location">
        {SCOPES.map(s => (
          <div
            key={s.key}
            onClick={() => { onScopeChange(s); setOpen(false); }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '11px 16px',
              paddingLeft: 16 + s.indent * 14,
              borderBottom: '0.5px solid #F9FAFB',
              cursor: 'pointer',
              background: scope.key === s.key ? '#EFF6FF' : 'transparent',
            }}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5,
              background: s.alerts > 0 ? '#DB4670' : '#D1D5DB',
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#14151A' }}>{s.label}</div>
              <div style={{ fontSize: 13, color: '#717684', marginTop: 2 }}>{s.sub}</div>
            </div>
            {s.alerts > 0 && (
              <span style={{
                fontSize: 13, fontWeight: 700, background: '#DB4670', color: '#fff',
                borderRadius: 12, padding: '2px 7px',
              }}>{s.alerts}</span>
            )}
            {scope.key === s.key && (
              <span style={{ fontSize: 15, color: '#04ADEF', fontWeight: 700 }}>✓</span>
            )}
          </div>
        ))}
      </BottomSheet>
    </>
  );
}
