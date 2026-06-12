// Consumption tab — Hourly / Daily / Monthly / Yearly modes.
// Monthly mode supports YoY compare (default on) showing this year vs last year side-by-side.

import { useState, useMemo } from 'react';
import { getConsumption } from '../../data/consumption';
import { useTheme } from '../../context/ThemeContext';

const MODE_OPTIONS = [
  { value: 'hourly',  label: 'Hourly' },
  { value: 'daily',   label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly' },
];

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function formatHour(h) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function formatDateShort(d) {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatNumber(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}

function formatNumberFull(n) {
  return Math.round(n).toLocaleString();
}

const TODAY_REF = new Date(2026, 3, 12); // Apr 12, 2026

function NavArrow({ direction, onClick, disabled, color }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit',
      color: disabled ? color.disabled : color.enabled,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
        {direction === 'left' ? 'chevron_left' : 'chevron_right'}
      </span>
    </button>
  );
}

function Stat({ label, value, abbr, color, theme }) {
  return (
    <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: color || theme.text, marginTop: 2, lineHeight: 1.1 }}>
        {formatNumber(value)}
        <span style={{ fontSize: 11, fontWeight: 500, color: theme.textTertiary, marginLeft: 2 }}>{abbr}</span>
      </div>
    </div>
  );
}

// "Nice numbers" tick algorithm. Given a max value and a target tick count,
// returns 2-3 reference values at multiples of 1, 2, 2.5, or 5 × 10^n.
// e.g. niceTicks(96, 4) -> [25, 50, 75]; niceTicks(2100, 4) -> [1000, 2000].
// All returned ticks are strictly LESS than max - we never place a tick at
// or above the peak so the topmost bar is always visible above its label.
function niceTicks(max, targetCount = 4) {
  if (max <= 0) return [];
  const rawStep = max / targetCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const multipliers = [1, 2, 2.5, 5, 10];
  let step = 10 * magnitude;
  for (const m of multipliers) {
    if (rawStep <= m * magnitude) { step = m * magnitude; break; }
  }
  const ticks = [];
  for (let v = step; v < max; v += step) ticks.push(v);
  return ticks;
}

// Format a Y-axis tick value compactly: "75 L", "1K L", "1.5K L".
function formatYTick(v, unit = 'L') {
  if (v < 1000) return `${v} ${unit}`;
  const k = v / 1000;
  const s = k % 1 === 0 ? k.toFixed(0) : k.toFixed(1);
  return `${s}K ${unit}`;
}

// Bar chart with hover/tap highlight. When `compare` is true and items carry `volumeLastYear`,
// renders paired thin bars (this year + last year) per slot. Y axis = 2-3 nice-number reference
// ticks on the left + faint horizontal gridlines (Option D, locked 2026-06-10). Bars are
// allowed to extend past the topmost tick - the ticks are reference markers, not a ceiling.
function BarChart({ data, theme, dk, accentColor, barLabel, sublabelKey, compare, lastYearColor }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const max = Math.max(
    ...data.flatMap(d => compare && d.volumeLastYear !== undefined ? [d.volume, d.volumeLastYear] : [d.volume]),
    1,
  );
  const baseColor = accentColor || '#04ADEF';
  const dimColor = dk ? 'rgba(4,173,239,0.25)' : 'rgba(4,173,239,0.15)';
  const lastYearDim = lastYearColor || (dk ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)');

  // Y-axis ticks derived from the chart's actual peak. Each tick's vertical
  // position is `value / max * 100` percent of the chart's 120 px height.
  const yticks = niceTicks(max, 4);
  const tickColor = dk ? 'rgba(255,255,255,0.32)' : '#B0B5C0';
  const gridColor = dk ? 'rgba(255,255,255,0.05)' : 'rgba(20,21,26,0.06)';

  return (
    <div>
      {/* Tooltip */}
      <div style={{ minHeight: compare ? 56 : 38, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        {hoveredIndex !== null && data[hoveredIndex] && (() => {
          const d = data[hoveredIndex];
          const showLast = compare && d.volumeLastYear !== undefined;
          const yoy = showLast && d.volumeLastYear > 0
            ? Math.round(((d.volume - d.volumeLastYear) / d.volumeLastYear) * 100)
            : null;
          return (
            <div style={{
              background: '#1B2838', borderRadius: 8, padding: '6px 12px', textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)', minWidth: 130,
            }}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{d[sublabelKey] || d.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 2 }}>
                {formatNumberFull(d.volume)}<span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginLeft: 3 }}>{barLabel}</span>
              </div>
              {showLast && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span>last yr: {formatNumberFull(d.volumeLastYear)}{barLabel}</span>
                  {yoy !== null && (
                    <span style={{ color: yoy > 0 ? '#FFB4C0' : yoy < 0 ? '#A1D246' : '#fff', fontWeight: 700 }}>
                      {yoy > 0 ? '↑' : yoy < 0 ? '↓' : ''}{Math.abs(yoy)}%
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Chart-wrap: Y-axis column (left) + chart-area (right with bars + gridlines).
          Layout matches docs/PRD/HTMLs/consumption-widget.html (locked 2026-06-10). */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 4 }}>
        {/* Y axis labels */}
        <div style={{ position: 'relative', width: 28, height: 120, flexShrink: 0 }}>
          {yticks.map(v => {
            const bottomPct = (v / max) * 100;
            return (
              <div key={v} style={{
                position: 'absolute', right: 0, bottom: `${bottomPct}%`,
                transform: 'translateY(50%)',
                fontSize: 9, fontWeight: 500, color: tickColor,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap', lineHeight: 1,
                textAlign: 'right', pointerEvents: 'none',
              }}>
                {formatYTick(v, barLabel)}
              </div>
            );
          })}
        </div>

        {/* Chart area = bars + gridlines overlay */}
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          {/* Gridlines (absolute, behind bars via natural z-order) */}
          <div style={{
            position: 'absolute', left: 4, right: 4, top: 0, bottom: 0,
            pointerEvents: 'none',
          }}>
            {yticks.map(v => {
              const bottomPct = (v / max) * 100;
              return (
                <div key={v} style={{
                  position: 'absolute', left: 0, right: 0,
                  bottom: `${bottomPct}%`,
                  height: 1, background: gridColor,
                }} />
              );
            })}
          </div>

          {/* Bars row */}
          <div style={{
            position: 'relative',
            display: 'flex', alignItems: 'flex-end', gap: data.length > 14 ? 1 : 3, height: 120,
            padding: '0 4px',
          }}>
            {data.map((d, i) => {
              const isHovered = hoveredIndex === i;
              const isDimmed = hoveredIndex !== null && !isHovered;
              const heightPct = (d.volume / max) * 100;
              const lastYearPct = compare && d.volumeLastYear !== undefined ? (d.volumeLastYear / max) * 100 : 0;

              return (
                <div key={i}
                  onClick={() => setHoveredIndex(hoveredIndex === i ? null : i)}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end',
                    cursor: 'pointer', minWidth: 0,
                    opacity: isDimmed ? 0.5 : 1, transition: 'opacity 0.15s',
                  }}>
                  {compare && d.volumeLastYear !== undefined ? (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, width: '100%', height: '100%' }}>
                      <div style={{
                        flex: 1, borderRadius: '3px 3px 0 0',
                        height: `${heightPct}%`,
                        background: isHovered ? baseColor : (d.volume > 0 ? baseColor : 'transparent'),
                        minHeight: d.volume > 0 ? 1 : 0,
                        transition: 'background 0.15s',
                      }} />
                      <div style={{
                        flex: 1, borderRadius: '3px 3px 0 0',
                        height: `${lastYearPct}%`,
                        background: lastYearDim,
                        minHeight: d.volumeLastYear > 0 ? 1 : 0,
                      }} />
                    </div>
                  ) : (
                    <div style={{
                      width: '100%', borderRadius: '3px 3px 0 0',
                      height: `${heightPct}%`,
                      background: isHovered ? baseColor : (d.volume > 0 ? dimColor : 'transparent'),
                      transition: 'background 0.15s',
                      minHeight: d.volume > 0 ? 1 : 0,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// X-axis labels redesigned 2026-06-09 to fix label-clipping bug.
// Previously each label sat in a flex:1 cell aligned to its bar — for hourly
// (24 bars in ~370 px chart) each cell was ~14 px wide but "12 PM" needs
// ~30 px, so labels clipped (whiteSpace:nowrap + overflow:hidden) and the
// day/night anchors became unreadable. New layout: relative container with
// absolutely-positioned labels. Each visible label sits at its bar's
// center percentage; first/last labels align to start/end so they don't
// clip against the chart edge.
function XAxisLabels({ data, theme, mode }) {
  // Which indices show a label? Hourly anchors at 12AM/6AM/12PM/6PM so the
  // day/night structure is obvious at a glance. Daily/yearly evenly spaced.
  let visibleIndices = [];
  if (mode === 'hourly' && data.length === 24) {
    visibleIndices = [0, 6, 12, 18, 23];
  } else if (data.length <= 12) {
    visibleIndices = data.map((_, i) => i);
  } else {
    const tickCount = data.length > 24 ? 6 : 5;
    const step = Math.max(1, Math.floor((data.length - 1) / (tickCount - 1)));
    for (let i = 0; i < data.length; i += step) visibleIndices.push(i);
    if (visibleIndices[visibleIndices.length - 1] !== data.length - 1) {
      visibleIndices.push(data.length - 1);
    }
  }

  const isDaily = mode === 'daily';
  const containerHeight = isDaily ? 26 : 14;

  return (
    <div style={{
      position: 'relative',
      height: containerHeight,
      marginTop: 4,
      // Indent to match the chart-area's horizontal position:
      // BarChart wraps bars in a flex layout with a 28 px Y-axis column
      // + 4 px gap on the left. The X-axis sits outside that wrap, so we
      // shift it 32 px right and re-add the 4 px chart padding so labels
      // still align with bar centers.
      paddingLeft: 32 + 4,
      paddingRight: 4,
    }}>
      {visibleIndices.map(i => {
        const d = data[i];
        if (!d) return null;
        // Bar center = (i + 0.5) / data.length, then we pad by the same 4 px
        // the bars row uses so labels align with bars precisely.
        const centerPct = ((i + 0.5) / data.length) * 100;
        // First label anchors to its bar's start; last anchors to the right
        // of its bar - keeps the label inside the chart's visible area.
        const isFirst = i === visibleIndices[0];
        const isLast = i === visibleIndices[visibleIndices.length - 1];
        const transform = isFirst ? 'translateX(0)'
                        : isLast  ? 'translateX(-100%)'
                        : 'translateX(-50%)';
        const textAlign = isFirst ? 'left' : isLast ? 'right' : 'center';
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${centerPct}%`,
            top: 0,
            transform,
            textAlign,
            fontSize: 10,
            color: theme.textMuted,
            whiteSpace: 'nowrap',
            lineHeight: 1.2,
          }}>
            {isDaily && d.weekday && (
              <div style={{ fontSize: 9, fontWeight: 500, color: theme.textMuted }}>{d.weekday}</div>
            )}
            <div style={{ fontSize: isDaily ? 9 : 10, color: theme.textMuted }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function ConsumptionTab({ sys }) {
  const { theme } = useTheme();
  const dk = theme.mode === 'dark' || theme.mode === 'ocean' || theme.mode === 'gradient' || theme.mode === 'midnight';

  // Consumption stays visible when the system is offline - the data is
  // cloud-aggregated (historical), not real-time from the device. The
  // user still gets to see what flowed through before the link dropped.
  // Confirmed rule (Rami 2026-06-06).
  const data = getConsumption(sys.id, sys.name);
  const dailyMap = useMemo(() => new Map(data.daily.map(d => [d.date, d.liters])), [data.daily]);

  const [mode, setMode] = useState('monthly');
  const [offset, setOffset] = useState(0);
  const [compareMode, setCompareMode] = useState(true);

  const chartData = useMemo(() => {
    if (mode === 'hourly') {
      const d = new Date(TODAY_REF);
      d.setDate(d.getDate() - offset);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const totalForDay = dailyMap.get(dateStr) || 0;
      const distribution = [0.5, 0.5, 0.5, 0.5, 0.7, 1.0, 2.0, 3.5, 4.0, 3.5, 2.5, 2.0, 2.0, 2.0, 1.5, 1.5, 2.0, 3.5, 4.0, 3.5, 2.5, 1.5, 1.0, 0.7];
      const distSum = distribution.reduce((a, b) => a + b, 0);
      return Array.from({ length: 24 }, (_, h) => ({
        label: formatHour(h),
        volume: Math.round((totalForDay / distSum) * distribution[h]),
      }));
    }
    if (mode === 'daily') {
      const end = new Date(TODAY_REF);
      end.setDate(end.getDate() - offset * 30);
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(end);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        days.push({
          label: `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`,
          weekday: WEEKDAYS[d.getDay()],
          dateFull: formatDateShort(d),
          volume: dailyMap.get(key) || 0,
        });
      }
      return days;
    }
    if (mode === 'monthly') {
      // Monthly = 12 calendar slots (Jan-Dec of the displayed year). Locked
      // round 6 (C20). offset=0 -> current year (2026); offset=1 -> previous
      // full year (2025); etc. Future months in the current year render with
      // volume=0 (empty placeholder bars). Current-real-month uses day-of-
      // month cap so the partial month doesn't look misleadingly short next
      // to its full last-year partner.
      const now = new Date(TODAY_REF);
      const todayYear = now.getFullYear();
      const todayMonth = now.getMonth();
      const todayDay = now.getDate();
      const displayedYear = todayYear - offset;
      const sumMonth = (year, month, capDay) => {
        let sum = 0;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const maxDay = capDay ? Math.min(capDay, lastDay) : lastDay;
        for (let day = 1; day <= maxDay; day++) {
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          sum += dailyMap.get(key) || 0;
        }
        return sum;
      };
      const months = [];
      for (let m = 0; m < 12; m++) {
        const isCurrentMonthInCurrentYear = offset === 0 && m === todayMonth;
        const isFutureInCurrentYear = offset === 0 && m > todayMonth;
        // Day-of-month cap: only when the row is the user's "this month" (so
        // this Apr = days 1-12, last Apr = days 1-12 too -> apples-to-apples).
        const capDay = isCurrentMonthInCurrentYear ? todayDay : null;
        const thisYearSum = isFutureInCurrentYear ? 0 : sumMonth(displayedYear, m, capDay);
        const lastYearSum = sumMonth(displayedYear - 1, m, capDay);
        months.push({
          label: MONTH_NAMES[m],
          fullLabel: `${MONTH_NAMES[m]} ${displayedYear}`,
          volume: thisYearSum,
          volumeLastYear: lastYearSum,
        });
      }
      return months;
    }
    // yearly
    const yearMap = {};
    for (const [date, liters] of dailyMap) {
      const year = date.slice(0, 4);
      yearMap[year] = (yearMap[year] || 0) + liters;
    }
    const sortedYears = Object.keys(yearMap).sort();
    return sortedYears.map(year => ({
      label: year, fullLabel: year,
      volume: yearMap[year],
    }));
  }, [mode, offset, dailyMap]);

  // Row 1 stats (Total / Avg / Peak). Describes whatever's currently on the
  // chart. Locked round 5/6 — the chart-based YoY was replaced by an anchored
  // ytdAnchor row below.
  const stats = useMemo(() => {
    const total = chartData.reduce((s, d) => s + d.volume, 0);
    const nonZero = chartData.filter(d => d.volume > 0);
    const avg = nonZero.length > 0 ? total / nonZero.length : 0;
    const peak = chartData.reduce((m, d) => d.volume > m ? d.volume : m, 0);
    return { total, avg, peak };
  }, [chartData]);

  // YTD anchor — Row 2. Always anchored to today's YTD vs same period last
  // year, regardless of chart navigation. Independent of `chartData`.
  // Monthly only, Compare on only, matched-months >= 2 only. See PRD 04d
  // § Anchor row calculation for the locked algorithm (C13 + C16 + C17).
  const ytdAnchor = useMemo(() => {
    if (mode !== 'monthly' || !compareMode) return null;
    const now = new Date(TODAY_REF);
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDay = now.getDate();
    const sumMonth = (year, month, capDay) => {
      let sum = 0;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const maxDay = capDay ? Math.min(capDay, lastDay) : lastDay;
      for (let day = 1; day <= maxDay; day++) {
        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        sum += dailyMap.get(key) || 0;
      }
      return sum;
    };
    let thisYTDMatched = 0;
    let lastYTDMatched = 0;
    let matchedCount = 0;
    let windowCount = 0;
    for (let m = 0; m <= todayMonth; m++) {
      const isCurrentMonth = m === todayMonth;
      const capDay = isCurrentMonth ? todayDay : null;
      const thisVal = sumMonth(todayYear, m, capDay);
      const lastVal = sumMonth(todayYear - 1, m, capDay);
      windowCount++;
      if (lastVal > 0) {
        thisYTDMatched += thisVal;
        lastYTDMatched += lastVal;
        matchedCount++;
      }
    }
    if (matchedCount < 2) return null;
    const yoy = Math.round(((thisYTDMatched - lastYTDMatched) / lastYTDMatched) * 100);
    return { thisYTDMatched, lastYTDMatched, yoy, matchedCount, windowCount };
  }, [mode, compareMode, dailyMap]);

  const { rangeLabel, canGoForward } = useMemo(() => {
    if (mode === 'yearly') return { rangeLabel: '', canGoForward: false };
    if (mode === 'hourly') {
      const d = new Date(TODAY_REF);
      d.setDate(d.getDate() - offset);
      const day = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
      return { rangeLabel: `${day}, ${formatDateShort(d)}`, canGoForward: offset > 0 };
    }
    if (mode === 'daily') {
      const end = new Date(TODAY_REF);
      end.setDate(end.getDate() - offset * 30);
      const start = new Date(end);
      start.setDate(start.getDate() - 29);
      return { rangeLabel: `${formatDateShort(start)} — ${formatDateShort(end)}`, canGoForward: offset > 0 };
    }
    // Monthly range label: just the year (locked round 6). The chart shows
    // 12 calendar slots Jan-Dec of that year; appending "Jan-Dec" would
    // duplicate what the x-axis already shows.
    const now = new Date(TODAY_REF);
    const displayedYear = now.getFullYear() - offset;
    return { rangeLabel: String(displayedYear), canGoForward: offset > 0 };
  }, [mode, offset]);

  const avgLabel = mode === 'hourly' ? 'Hourly Avg' : mode === 'daily' ? 'Daily Avg' : mode === 'monthly' ? 'Monthly Avg' : 'Yearly Avg';
  const peakLabel = mode === 'hourly' ? 'Peak Hour' : mode === 'daily' ? 'Peak Day' : mode === 'monthly' ? 'Peak Month' : 'Peak Year';

  const arrowColor = { enabled: theme.textTertiary, disabled: theme.textDimmest };

  const showCompare = mode === 'monthly' && compareMode;
  const lastYearColor = dk ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)';
  const ytdYoy = ytdAnchor?.yoy ?? null;
  const yoyColor = ytdYoy == null ? theme.textTertiary : ytdYoy > 0 ? '#DB4670' : ytdYoy < 0 ? '#5C9E1A' : theme.textTertiary;
  // (i) info note — bottom of widget, only shows the current mode's copy (C22, C29, C30).
  const [infoOpen, setInfoOpen] = useState(false);
  const infoCopy = mode === 'hourly'
    ? "Each bar shows water use for that hour. Total, Hourly Avg, and Peak Hour describe the day shown on the chart."
    : mode === 'daily'
    ? "Each bar shows water use for that day. Total, Daily Avg, and Peak Day describe the 30 days shown on the chart."
    : mode === 'monthly'
    ? "Each bar shows water use for that month. The grey overlay is the same month last year. Total, Monthly Avg, and Peak Month describe the months shown on the chart. The 'Year-to-date vs. same period last year' row at the bottom compares total water used from January 1 until today to the same period last year."
    : "Each bar shows water use for that year. Tap a bar to see the value.";

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 24px' }}>
      <div style={{ background: theme.card, borderRadius: 14, padding: '14px', border: theme.cardBorder }}>
        {/* Title + (i) info button (C22 — locked round 6) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: theme.textTertiary }}>water_drop</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: theme.text, flex: 1 }}>
            {sys?.homeAway ? 'Water Use' : 'Water Consumption'}
          </span>
          <span
            onClick={() => setInfoOpen(v => !v)}
            className="material-symbols-outlined"
            style={{
              fontSize: 16,
              color: infoOpen ? theme.accent : theme.textTertiary,
              fontVariationSettings: infoOpen ? "'FILL' 1" : "'FILL' 0",
              cursor: 'pointer',
            }}
            title="About these numbers"
          >info</span>
        </div>

        {/* Mode segmented control */}
        <div style={{
          display: 'flex', alignItems: 'center', borderRadius: 8, overflow: 'hidden',
          border: `1px solid ${theme.divider}`, marginBottom: 10,
        }}>
          {MODE_OPTIONS.map((opt, i) => (
            <button key={opt.value}
              onClick={() => { setMode(opt.value); setOffset(0); }}
              style={{
                flex: 1, padding: '7px 0', fontSize: 12, fontWeight: mode === opt.value ? 700 : 500,
                border: 'none', background: mode === opt.value ? theme.accent : 'transparent',
                color: mode === opt.value ? '#fff' : theme.textTertiary,
                cursor: 'pointer', fontFamily: 'inherit',
                borderLeft: i > 0 ? `1px solid ${theme.divider}` : 'none',
              }}>{opt.label}</button>
          ))}
        </div>

        {/* Time navigation */}
        {mode !== 'yearly' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
            <NavArrow direction="left" onClick={() => setOffset(o => o + 1)} color={arrowColor} />
            <span style={{ fontSize: 12, fontWeight: 500, color: theme.textTertiary, minWidth: 180, textAlign: 'center', userSelect: 'none' }}>
              {rangeLabel}
            </span>
            <NavArrow direction="right" onClick={() => canGoForward && setOffset(o => o - 1)} disabled={!canGoForward} color={arrowColor} />
          </div>
        )}

        {/* "Today" reset button */}
        {mode !== 'yearly' && offset > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <button onClick={() => setOffset(0)} style={{
              fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
              border: `1px solid ${theme.accent}40`, background: `${theme.accent}10`, color: theme.accent,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{mode === 'hourly' ? 'Today' : mode === 'daily' ? 'Latest' : 'This year'}</button>
          </div>
        )}

        {/* Compare toggle (monthly only). Legend simplified round 6 (C25):
            only "Last year" is labelled — the blue bars don't need a tag. */}
        {mode === 'monthly' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {showCompare && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 10, height: 10, background: lastYearColor, borderRadius: 2 }} />
                  <span style={{ fontSize: 11, color: theme.textTertiary }}>Last year</span>
                </div>
              )}
            </div>
            <div onClick={() => setCompareMode(c => !c)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: theme.textTertiary }}>Compare</span>
              <div style={{
                width: 30, height: 18, borderRadius: 9, position: 'relative',
                background: compareMode ? theme.accent : (dk ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'),
                transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: compareMode ? 14 : 2,
                  width: 14, height: 14, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <BarChart data={chartData} theme={theme} dk={dk} accentColor={theme.accent} barLabel="L"
          sublabelKey={mode === 'daily' ? 'dateFull' : mode === 'monthly' ? 'fullLabel' : 'label'}
          compare={showCompare}
          lastYearColor={lastYearColor} />

        {/* X-axis labels */}
        <XAxisLabels data={chartData} theme={theme} mode={mode} />

        {/* Stats row — Row 1 of the two-row footer. Describes whatever's on
            the chart. Yearly mode hides it entirely (C27 — chart only). */}
        {mode !== 'yearly' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 14,
            paddingTop: 12, borderTop: `1px solid ${theme.divider}`,
          }}>
            <Stat label="Total" value={stats.total} abbr="L" theme={theme} />
            <div style={{ width: 1, height: 28, background: theme.divider }} />
            <Stat label={avgLabel} value={stats.avg} abbr="L" color={theme.accent} theme={theme} />
            <div style={{ width: 1, height: 28, background: theme.divider }} />
            <Stat label={peakLabel} value={stats.peak} abbr="L" theme={theme} />
          </div>
        )}

        {/* YTD anchor row — Row 2 of the two-row footer. Anchored to today,
            independent of chart navigation. Monthly only + Compare on +
            matched.length >= 2 (ytdAnchor !== null gates all of that).
            Layout redesigned 2026-06-09: label and value were wrapping
            awkwardly into 2 lines each. Now both stack as 2-line blocks
            (label left, value right), vertically centered. No wrapping. */}
        {ytdAnchor && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12,
            marginTop: 10, padding: '10px 12px', borderRadius: 10, background: `${theme.accent}0A`,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: theme.textTertiary,
                textTransform: 'uppercase', letterSpacing: '0.5px',
                lineHeight: 1.2,
              }}>Year-to-date</div>
              <div style={{
                fontSize: 12, color: theme.textTertiary, lineHeight: 1.3, marginTop: 2,
              }}>vs. same period last year</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{
                fontSize: 16, fontWeight: 800, color: yoyColor,
                fontVariantNumeric: 'tabular-nums', lineHeight: 1.1,
              }}>
                {ytdAnchor.yoy > 0 ? '↑' : ytdAnchor.yoy < 0 ? '↓' : ''} {Math.abs(ytdAnchor.yoy)}%
              </div>
              <div style={{
                fontSize: 11, color: theme.textTertiary, marginTop: 2,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {formatNumber(ytdAnchor.lastYTDMatched)}L last year
              </div>
            </div>
          </div>
        )}

        {/* (i) info note — bottom of widget, only the current mode's copy.
            Tap the (i) icon in the title row to toggle. Locked round 6 (C22). */}
        {infoOpen && (
          <div style={{
            marginTop: 12,
            background: `${theme.accent}08`,
            border: `1px solid ${theme.accent}25`,
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 12.5, color: theme.text, lineHeight: 1.55,
          }}>
            {infoCopy}
          </div>
        )}
      </div>
    </div>
  );
}
