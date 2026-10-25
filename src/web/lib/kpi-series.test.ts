import { describe, expect, it } from 'vitest';
import { buildDailyKpiSeries, cumulativeHourly, halfOverHalfPercent } from './kpi-series';

const TODAY = new Date(2026, 9, 25, 15, 0, 0);

function at(daysAgo: number, hour = 10): number {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

describe('buildDailyKpiSeries', () => {
  it('zero-fills sum metrics for every day in the window, oldest first', () => {
    const s = buildDailyKpiSeries(
      [
        { startTime: at(0), estimatedCostUsd: 2, antiPatterns: [{}, {}] },
        { startTime: at(0), estimatedCostUsd: 1 },
        { startTime: at(2), estimatedCostUsd: 4 },
      ],
      3,
      TODAY,
    );
    expect(s.spend.values).toEqual([4, 0, 3]);
    expect(s.sessions.values).toEqual([1, 0, 2]);
    expect(s.flags.values).toEqual([0, 0, 2]);
    expect(s.spend.labels).toEqual(['Oct 23', 'Oct 24', 'Oct 25']);
  });

  it('samples average metrics only on days that have data', () => {
    const s = buildDailyKpiSeries(
      [
        { startTime: at(0), estimatedCostUsd: 2, efficiencyScore: 0.5 },
        { startTime: at(0), estimatedCostUsd: 4, efficiencyScore: 1 },
        { startTime: at(2), estimatedCostUsd: 3 },
      ],
      3,
      TODAY,
    );
    expect(s.efficiencyPct).toEqual({ values: [75], labels: ['Oct 25'] });
    expect(s.avgCost).toEqual({ values: [3, 3], labels: ['Oct 23', 'Oct 25'] });
  });

  it('ignores sessions outside the window or without a start time', () => {
    const s = buildDailyKpiSeries(
      [{ startTime: at(5), estimatedCostUsd: 9 }, { estimatedCostUsd: 9 }],
      3,
      TODAY,
    );
    expect(s.spend.values).toEqual([0, 0, 0]);
  });
});

describe('halfOverHalfPercent', () => {
  it('compares the mean of the second half to the first', () => {
    expect(halfOverHalfPercent([1, 1, 2, 2])).toBe(100);
    expect(halfOverHalfPercent([4, 4, 2, 2])).toBe(-50);
  });

  it('returns null for short series or a zero first half', () => {
    expect(halfOverHalfPercent([1, 2, 3])).toBeNull();
    expect(halfOverHalfPercent([0, 0, 1, 1])).toBeNull();
  });
});

describe('cumulativeHourly', () => {
  it('accumulates spend up to the current hour only', () => {
    const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, cost: hour === 9 ? 2 : 1 }));
    const s = cumulativeHourly(hourly, new Date(2026, 9, 25, 2, 30));
    expect(s.values).toEqual([1, 2, 3]);
    expect(s.labels).toHaveLength(3);
  });
});
