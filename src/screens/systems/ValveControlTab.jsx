import ValveControlCard from '../../components/ValveControlCard';

// Dedicated Valve tab — wraps the canonical compact card from page-valve-control-widget.html.
// (Previously had a separate big-circle layout with a "Last Action" footer; per locked decisions both
//  are gone — last-action context belongs in the system events feed, not on the widget.)
export default function ValveControlTab({ sys }) {
  const hasActiveLeak = sys?.leak === 'high' || sys?.leak === 'low';

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px 24px' }}>
      {hasActiveLeak && (
        <div style={{
          background: 'rgba(220,38,38,0.08)',
          border: '1px solid rgba(220,38,38,0.18)',
          borderRadius: 12,
          padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#DC2626' }}>
            Active Water Event — consider closing the valve
          </span>
        </div>
      )}

      <ValveControlCard sys={sys} />
    </div>
  );
}
