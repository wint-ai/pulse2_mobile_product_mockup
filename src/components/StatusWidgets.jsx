export default function StatusWidgets({ widgets }) {
  const { comm, valves, power } = widgets;

  const rows = [
    {
      label: 'Comm.',
      items: [
        { count: comm.online, sub: 'online', dot: '#A1D246' },
        comm.offline > 0 ? { count: comm.offline, sub: 'offline', dot: '#DB4670' } : null,
      ],
    },
    {
      label: 'Valves',
      items: [
        { count: valves.open, sub: 'open', dot: '#04ADEF' },
        valves.closed > 0 ? { count: valves.closed, sub: 'closed', dot: '#717684' } : null,
        valves.error > 0 ? { count: valves.error, sub: 'error', dot: '#DB4670' } : null,
      ],
    },
    {
      label: 'Power',
      items: [
        { count: power.ac, sub: 'AC', dot: '#A1D246' },
        power.battery > 0 ? { count: power.battery, sub: 'battery', dot: '#F05C25' } : null,
        power.acLost > 0 ? { count: power.acLost, sub: 'AC lost', dot: '#DB4670' } : null,
      ],
    },
  ];

  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1px solid #DEE0E3',
      overflow: 'hidden', marginBottom: 12,
    }}>
      {rows.map((row, i) => (
        <div key={row.label} style={{
          display: 'flex', alignItems: 'center',
          padding: '10px 14px',
          borderBottom: i < rows.length - 1 ? '1px solid #DEE0E3' : 'none',
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#717684', width: 55, flexShrink: 0 }}>
            {row.label}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
            {row.items.filter(Boolean).map((item, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#14151A', letterSpacing: '-0.3px' }}>
                  {item.count}
                </span>
                <span style={{ fontSize: 15, color: '#717684' }}>{item.sub}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
