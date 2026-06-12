import { useTheme } from '../context/ThemeContext';

export default function BottomSheet({ open, onClose, title, children, maxHeight = '72%' }) {
  const { theme } = useTheme();
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,.6)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        borderRadius: 38,
        overflow: 'hidden',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.sheetBg,
          borderRadius: '20px 20px 0 0',
          maxHeight,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ width: 36, height: 4, background: theme.textDimmest, borderRadius: 2, margin: '10px auto 0', flexShrink: 0 }} />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: theme.separator, flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>{title}</span>
          <button
            onClick={onClose}
            style={{ fontSize: 22, color: theme.textTertiary, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}
          >{'\u00D7'}</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '4px 0 16px', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
