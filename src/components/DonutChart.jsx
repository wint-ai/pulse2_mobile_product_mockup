import { useEffect, useRef, useState } from 'react';

export default function DonutChart({ size = 52, strokeWidth = 6, segments = [], centerValue }) {
  const [progress, setProgress] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    let raf;
    let start;
    function animate(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const p = Math.min(elapsed / 600, 1);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none" stroke="#DEE0E3" strokeWidth={strokeWidth}
        />
        {centerValue !== undefined && (
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 15, fontWeight: 700, fill: '#14151A', fontFamily: 'Inter, sans-serif' }}>
            {centerValue}
          </text>
        )}
      </svg>
    );
  }

  // Gap in degrees between segments
  const gapDeg = segments.filter(s => s.value > 0).length > 1 ? 3 : 0;
  const gapLength = (gapDeg / 360) * circumference;
  const activeSegments = segments.filter(s => s.value > 0);
  const totalGap = gapLength * activeSegments.length;
  const availableLength = circumference - totalGap;

  let offset = -circumference / 4; // Start from top

  const arcs = [];
  activeSegments.forEach((seg, i) => {
    const segLength = (seg.value / total) * availableLength * progress;
    arcs.push({
      color: seg.color,
      dasharray: `${segLength} ${circumference - segLength}`,
      dashoffset: -offset,
    });
    offset += segLength + gapLength;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle */}
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none" stroke="#F7F7F8" strokeWidth={strokeWidth}
      />
      {/* Segments */}
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={arc.dasharray}
          strokeDashoffset={arc.dashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.3s ease' }}
        />
      ))}
      {/* Center text */}
      {centerValue !== undefined && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: size > 48 ? 13 : 11, fontWeight: 700, fill: '#14151A', fontFamily: 'Inter, sans-serif' }}>
          {centerValue}
        </text>
      )}
    </svg>
  );
}
