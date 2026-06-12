import { describe, it, expect } from 'vitest';
import { formatDate, aggregateWeekly, aggregateMonthly, sliceByOffset, filterByDateRange, presetToRange, dateRangeToMonths } from './consumption';

// Helper to create daily data
function makeDays(startDate, count, litersPerDay = 100) {
  const days = [];
  const d = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const dt = new Date(d);
    dt.setDate(dt.getDate() + i);
    const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    days.push({ date: dateStr, liters: litersPerDay + i });
  }
  return days;
}

describe('formatDate', () => {
  it('formats a date as "Mon DD"', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('Jan 5');
    expect(formatDate(new Date(2026, 11, 25))).toBe('Dec 25');
  });
});

describe('aggregateWeekly', () => {
  it('groups daily data into 7-day chunks', () => {
    const daily = makeDays('2026-03-01', 14, 100);
    const weeks = aggregateWeekly(daily);
    expect(weeks).toHaveLength(2);
    expect(weeks[0].liters).toBe(daily.slice(0, 7).reduce((s, d) => s + d.liters, 0));
    expect(weeks[1].liters).toBe(daily.slice(7, 14).reduce((s, d) => s + d.liters, 0));
  });

  it('handles partial last week', () => {
    const daily = makeDays('2026-03-01', 10, 100);
    const weeks = aggregateWeekly(daily);
    expect(weeks).toHaveLength(2);
    expect(weeks[1].liters).toBe(daily.slice(7, 10).reduce((s, d) => s + d.liters, 0));
  });
});

describe('aggregateMonthly', () => {
  it('groups daily data by month', () => {
    const daily = makeDays('2026-03-01', 30, 100);
    const months = aggregateMonthly(daily);
    // All in March 2026
    expect(months).toHaveLength(1);
    expect(months[0].label).toBe('Mar 2026');
  });

  it('preserves chronological order across year boundary', () => {
    const dec = makeDays('2025-12-25', 7, 100);
    const jan = makeDays('2026-01-01', 10, 200);
    const daily = [...dec, ...jan];
    const months = aggregateMonthly(daily);
    expect(months).toHaveLength(2);
    expect(months[0].label).toBe('Dec 2025');
    expect(months[1].label).toBe('Jan 2026');
  });

  it('preserves insertion order, not alphabetical', () => {
    const feb = makeDays('2026-02-01', 5, 50);
    const mar = makeDays('2026-03-01', 5, 100);
    const months = aggregateMonthly([...feb, ...mar]);
    expect(months[0].label).toBe('Feb 2026');
    expect(months[1].label).toBe('Mar 2026');
  });
});

describe('sliceByOffset', () => {
  const daily = makeDays('2026-02-24', 30, 100);

  describe('daily period', () => {
    it('offset=0 returns last 7 days', () => {
      const result = sliceByOffset(daily, 'daily', 0);
      expect(result.data).toHaveLength(7);
      expect(result.data[result.data.length - 1].label).toBe(daily[daily.length - 1].date.slice(5));
      expect(result.canGoForward).toBe(false);
      expect(result.canGoBack).toBe(true);
    });

    it('offset=-1 returns previous 7 days', () => {
      const result = sliceByOffset(daily, 'daily', -1);
      expect(result.data).toHaveLength(7);
      expect(result.canGoForward).toBe(true);
    });

    it('navigating back then forward returns to same data', () => {
      const current = sliceByOffset(daily, 'daily', 0);
      const prev = sliceByOffset(daily, 'daily', -1);
      const backToCurrent = sliceByOffset(daily, 'daily', 0);
      expect(backToCurrent.data).toEqual(current.data);
      expect(prev.data).not.toEqual(current.data);
    });

    it('cannot navigate past the beginning of data', () => {
      // 30 days / 7-day window = ~4 windows max
      const farBack = sliceByOffset(daily, 'daily', -10);
      expect(farBack.canGoBack).toBe(false);
      expect(farBack.data.length).toBeGreaterThan(0);
    });
  });

  describe('monthly period', () => {
    it('offset=0 returns current month', () => {
      const result = sliceByOffset(daily, 'monthly', 0);
      expect(result.data).toHaveLength(1);
      expect(result.rangeLabel).toContain('2026');
    });

    it('offset=-1 returns previous month when data spans months', () => {
      // daily starts Feb 24 and goes 30 days into March
      const months = aggregateMonthly(daily);
      if (months.length > 1) {
        const prev = sliceByOffset(daily, 'monthly', -1);
        expect(prev.data[0].label).toBe(months[months.length - 2].label);
        expect(prev.canGoForward).toBe(true);
      }
    });
  });

  describe('weekly period', () => {
    it('offset=0 returns last week', () => {
      const result = sliceByOffset(daily, 'weekly', 0);
      expect(result.data).toHaveLength(1);
      expect(result.canGoForward).toBe(false);
    });

    it('offset=-1 returns previous week', () => {
      const result = sliceByOffset(daily, 'weekly', -1);
      expect(result.data).toHaveLength(1);
      expect(result.canGoForward).toBe(true);
    });
  });

  describe('yearly period', () => {
    it('returns the year from the data, not hardcoded', () => {
      const result = sliceByOffset(daily, 'yearly', 0);
      expect(result.data).toHaveLength(1);
      expect(result.rangeLabel).toBe('2026');
      expect(result.data[0].liters).toBe(daily.reduce((s, d) => s + d.liters, 0));
    });

    it('uses correct year from data, not current year', () => {
      const oldDaily = makeDays('2024-06-01', 10, 50);
      const result = sliceByOffset(oldDaily, 'yearly', 0);
      expect(result.rangeLabel).toBe('2024');
    });
  });

  describe('edge cases', () => {
    it('returns empty for no data', () => {
      const result = sliceByOffset([], 'daily', 0);
      expect(result.data).toEqual([]);
      expect(result.canGoForward).toBe(false);
      expect(result.canGoBack).toBe(false);
    });

    it('handles single day of data', () => {
      const single = makeDays('2026-03-15', 1, 500);
      const result = sliceByOffset(single, 'daily', 0);
      expect(result.data).toHaveLength(1);
      expect(result.canGoBack).toBe(false);
      expect(result.canGoForward).toBe(false);
    });
  });
});

describe('filterByDateRange', () => {
  const daily = makeDays('2026-01-01', 90, 100); // Jan 1 – Mar 31

  it('filters daily data to a date range', () => {
    const from = new Date(2026, 1, 1); // Feb 1
    const to = new Date(2026, 1, 28);  // Feb 28
    const result = filterByDateRange(daily, from, to);
    expect(result.length).toBe(28);
    expect(result[0].date).toBe('2026-02-01');
    expect(result[result.length - 1].date).toBe('2026-02-28');
  });

  it('returns empty for a range outside data', () => {
    const from = new Date(2025, 0, 1);
    const to = new Date(2025, 0, 31);
    const result = filterByDateRange(daily, from, to);
    expect(result).toHaveLength(0);
  });
});

describe('presetToRange', () => {
  const ref = new Date(2026, 3, 12); // Apr 12, 2026

  it('mtd returns first of current month to ref date', () => {
    const { from, to } = presetToRange('mtd', ref);
    expect(from.getMonth()).toBe(3); // April
    expect(from.getDate()).toBe(1);
    expect(to.getDate()).toBe(12);
  });

  it('prev-3 returns 3 months back', () => {
    const { from, to } = presetToRange('prev-3', ref);
    expect(from.getMonth()).toBe(0); // January
    expect(from.getFullYear()).toBe(2026);
  });

  it('prev-12 returns 1 year back', () => {
    const { from, to } = presetToRange('prev-12', ref);
    expect(from.getFullYear()).toBe(2025);
    expect(from.getMonth()).toBe(3); // April 2025
  });

  it('ytd returns Jan 1 of current year', () => {
    const { from } = presetToRange('ytd', ref);
    expect(from.getMonth()).toBe(0);
    expect(from.getDate()).toBe(1);
    expect(from.getFullYear()).toBe(2026);
  });
});

describe('dateRangeToMonths', () => {
  it('derives month range from date range', () => {
    const from = new Date(2026, 0, 12); // Jan 12
    const to = new Date(2026, 3, 12);   // Apr 12
    const result = dateRangeToMonths(from, to);
    expect(result).toEqual({ fromYear: 2026, fromMonth: 0, toYear: 2026, toMonth: 3 });
  });

  it('THE BUG FIX: custom range Jan-Apr 2026 should NOT produce Jan-Dec 2025', () => {
    // This tests the exact scenario from the web portal bug:
    // Custom range "Jan 12 – Apr 12, 2026" was showing dropdowns as "Jan 2025 to Dec 2025"
    const from = new Date(2026, 0, 12);
    const to = new Date(2026, 3, 12);
    const months = dateRangeToMonths(from, to);

    // Dropdowns must show 2026, not 2025
    expect(months.fromYear).toBe(2026);
    expect(months.toYear).toBe(2026);
    // Dropdowns must show Jan–Apr, not Jan–Dec
    expect(months.fromMonth).toBe(0); // Jan
    expect(months.toMonth).toBe(3);   // Apr
  });

  it('handles cross-year ranges', () => {
    const from = new Date(2025, 3, 12);
    const to = new Date(2026, 3, 12);
    const result = dateRangeToMonths(from, to);
    expect(result.fromYear).toBe(2025);
    expect(result.toYear).toBe(2026);
  });
});
