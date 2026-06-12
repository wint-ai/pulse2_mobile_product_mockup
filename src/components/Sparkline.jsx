// Inline SVG sparkline. data = array of numbers (any range — auto-scaled).
// Shows area fill + line + endpoint dot. No axes, no labels — pure signal.
export default function Sparkline({ data, color = '#04ADEF', width = 56, height = 22 }) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1)) * w,
    pad + h - ((v - min) / range) * h,
  ]);

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${pad + h} L${pad},${pad + h} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', flexShrink: 0 }}>
      <path d={area} fill={color} opacity={0.15} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} />
    </svg>
  );
}

// Deterministic mock sparkline data for a system.
// Alert systems show a trailing spike; offline = flat low.
export function getSystemSparkline(sys) {
  const seed = sys.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = [42, 55, 48, 62, 52, 58, 45, 50];
  const data = base.map((v, i) => {
    const noise = ((seed * (i + 7)) % 22) - 11;
    return Math.max(5, Math.min(85, v + noise));
  });
  if (sys.offline) return data.map(() => 15 + ((seed % 10)));
  if (sys.alert?.type === 'leak-high') { data[data.length - 1] = 95; data[data.length - 2] = 78; }
  if (sys.alert?.type === 'leak-low') { data[data.length - 1] = 74; }
  return data;
}

// Trend: compare last value to average of first half
export function getSparklineTrend(data) {
  if (!data || data.length < 2) return null;
  const half = Math.floor(data.length / 2);
  const avg = data.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const last = data[data.length - 1];
  const pct = Math.round(((last - avg) / (avg || 1)) * 100);
  if (Math.abs(pct) < 4) return null; // not meaningful
  return { pct, up: pct > 0 };
}
