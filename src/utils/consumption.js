// Pure functions for consumption data aggregation
// Extracted from ConsumptionTab for testability

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function formatDate(d) {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

export function aggregateWeekly(daily) {
  const weeks = [];
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, i + 7);
    const total = chunk.reduce((s, d) => s + d.liters, 0);
    const start = new Date(chunk[0].date);
    const end = new Date(chunk[chunk.length - 1].date);
    weeks.push({ label: `${formatDate(start)}\u2013${formatDate(end)}`, liters: total });
  }
  return weeks;
}

export function aggregateMonthly(daily) {
  const map = {};
  const order = [];
  for (const d of daily) {
    const dt = new Date(d.date);
    const key = `${MONTH_NAMES[dt.getMonth()]} ${dt.getFullYear()}`;
    if (!(key in map)) {
      map[key] = 0;
      order.push(key);
    }
    map[key] += d.liters;
  }
  return order.map(key => ({ label: key, liters: map[key] }));
}

/**
 * Slice daily data by offset for a given period.
 * offset=0 means current (most recent) window, offset=-1 means previous, etc.
 *
 * @param {Array} daily - Full daily data array [{date, liters}, ...]
 * @param {string} period - 'daily' | 'weekly' | 'monthly' | 'yearly'
 * @param {number} offset - 0 = current, -1 = previous, etc.
 * @returns {{ data: Array, rangeLabel: string, canGoForward: boolean, canGoBack: boolean }}
 */
export function sliceByOffset(daily, period, offset) {
  if (!daily || daily.length === 0) return { data: [], rangeLabel: '', canGoForward: false, canGoBack: false };

  const lastDate = new Date(daily[daily.length - 1].date);
  const firstDate = new Date(daily[0].date);

  if (period === 'yearly') {
    const year = lastDate.getFullYear();
    const total = daily.reduce((s, d) => s + d.liters, 0);
    return { data: [{ label: String(year), liters: total }], rangeLabel: String(year), canGoForward: false, canGoBack: false };
  }

  if (period === 'monthly') {
    const allMonths = aggregateMonthly(daily);
    // offset=0 → last month, offset=-1 → second to last, etc.
    const idx = allMonths.length - 1 + offset;
    if (idx < 0 || idx >= allMonths.length) {
      // Out of range — return last available
      const clamped = Math.max(0, Math.min(allMonths.length - 1, idx));
      return {
        data: [allMonths[clamped]],
        rangeLabel: allMonths[clamped].label,
        canGoForward: clamped < allMonths.length - 1,
        canGoBack: clamped > 0,
      };
    }
    return {
      data: [allMonths[idx]],
      rangeLabel: allMonths[idx].label,
      canGoForward: idx < allMonths.length - 1,
      canGoBack: idx > 0,
    };
  }

  if (period === 'weekly') {
    const allWeeks = aggregateWeekly(daily);
    const idx = allWeeks.length - 1 + offset;
    const clamped = Math.max(0, Math.min(allWeeks.length - 1, idx));
    return {
      data: [allWeeks[clamped]],
      rangeLabel: allWeeks[clamped].label,
      canGoForward: clamped < allWeeks.length - 1,
      canGoBack: clamped > 0,
    };
  }

  // daily — show 7-day windows, clamp to available data
  const windowSize = 7;
  let endIdx = daily.length + offset * windowSize;
  let startIdx = endIdx - windowSize;
  // Clamp: if we've gone before the data, snap to first window
  if (startIdx < 0) { startIdx = 0; endIdx = Math.min(windowSize, daily.length); }
  if (endIdx > daily.length) { endIdx = daily.length; startIdx = Math.max(0, endIdx - windowSize); }
  const slice = daily.slice(startIdx, endIdx);

  const sliceData = slice.map(d => ({ label: d.date.slice(5), liters: d.liters }));
  const start = new Date(slice[0].date);
  const end = new Date(slice[slice.length - 1].date);
  const rangeLabel = `${formatDate(start)} \u2014 ${formatDate(end)}`;

  return {
    data: sliceData,
    rangeLabel,
    canGoForward: endIdx < daily.length,
    canGoBack: startIdx > 0,
  };
}

/**
 * Filter daily data to a date range.
 * @param {Array} daily - [{date, liters}, ...]
 * @param {Date} from
 * @param {Date} to
 * @returns {Array}
 */
export function filterByDateRange(daily, from, to) {
  const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`;
  const toStr = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`;
  return daily.filter(d => d.date >= fromStr && d.date <= toStr);
}

/**
 * Compute the date range for a preset period relative to a reference date.
 * @param {string} preset - 'mtd' | 'prev-month' | 'prev-3' | 'prev-6' | 'prev-12' | 'ytd'
 * @param {Date} refDate - reference date (today)
 * @returns {{ from: Date, to: Date }}
 */
export function presetToRange(preset, refDate) {
  const to = new Date(refDate);
  let from;
  switch (preset) {
    case 'mtd':
      from = new Date(to.getFullYear(), to.getMonth(), 1);
      break;
    case 'prev-month': {
      const pm = new Date(to.getFullYear(), to.getMonth() - 1, 1);
      from = pm;
      to.setDate(0); // last day of previous month
      break;
    }
    case 'prev-2':
      from = new Date(to.getFullYear(), to.getMonth() - 2, to.getDate());
      break;
    case 'prev-3':
      from = new Date(to.getFullYear(), to.getMonth() - 3, to.getDate());
      break;
    case 'prev-6':
      from = new Date(to.getFullYear(), to.getMonth() - 6, to.getDate());
      break;
    case 'prev-12':
      from = new Date(to.getFullYear() - 1, to.getMonth(), to.getDate());
      break;
    case 'ytd':
      from = new Date(to.getFullYear(), 0, 1);
      break;
    default:
      from = new Date(to.getFullYear(), to.getMonth(), 1);
  }
  return { from, to };
}

/**
 * Derive the month range (fromMonth, toMonth) from a date range.
 * Returns {fromYear, fromMonth, toYear, toMonth} (0-indexed months).
 */
export function dateRangeToMonths(from, to) {
  return {
    fromYear: from.getFullYear(),
    fromMonth: from.getMonth(),
    toYear: to.getFullYear(),
    toMonth: to.getMonth(),
  };
}
