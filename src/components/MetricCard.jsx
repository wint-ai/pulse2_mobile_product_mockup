import DonutChart from './DonutChart';

export default function MetricCard({ title, icon, segments, total }) {
  const activeSegments = segments.filter(s => s.value > 0);

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #DEE0E3',
      borderRadius: 16,
      padding: '16px 18px',
      boxShadow: '0 1px 2px rgba(20,21,26,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Left side */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 15, fontWeight: 600, color: '#14151A',
            letterSpacing: '-0.1px', marginBottom: 10,
          }}>
            <span style={{ fontSize: 15 }}>{icon}</span>
            {title}
          </div>
          {/* Legend rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {segments.map((seg, i) => {
              const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: seg.color, flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 15, color: '#717684', flex: 1, minWidth: 0 }}>
                    {seg.label}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#14151A', flexShrink: 0 }}>
                    {seg.value}
                  </span>
                  <span style={{ fontSize: 14, color: '#717684', flexShrink: 0, minWidth: 30, textAlign: 'right' }}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {/* Right side - Donut */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <DonutChart
            size={56}
            strokeWidth={7}
            segments={segments}
            centerValue={total}
          />
        </div>
      </div>
    </div>
  );
}
