import { formatAxisDate } from './format';

/** The session fields the stat-card trend lines read. */
export interface KpiSeriesSession {
  readonly startTime?: string | number;
  readonly estimatedCostUsd?: number | null;
  readonly efficiencyScore?: number | null;
  readonly antiPatterns?: ReadonlyArray<unknown>;
}

/** A trend line plus one display label per sample. */
export interface LabeledSeries {
  readonly values: number[];
  readonly labels: string[];
}

export interface DailyKpiSeries {
  readonly spend: LabeledSeries;
  readonly sessions: LabeledSeries;
  readonly flags: LabeledSeries;
  /** Only days that had at least one scored session — no invented values for idle days. */
  readonly efficiencyPct: LabeledSeries;
  /** Only days that had at least one costed session. */
  readonly avgCost: LabeledSeries;
}

function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface DayBucket {
  spend: number;
  costed: number;
  sessions: number;
  flags: number;
  effSum: number;
  effCount: number;
}

/**
 * Per-day series for the History stat cards over a `days`-day window ending
 * `today` (local time). Sum metrics (spend, sessions, flags) get one sample per
 * calendar day, zero-filled; average metrics only sample days that had data, so
 * an idle day never shows as 0% efficiency or $0 per session.
 */
export function buildDailyKpiSeries(
  rows: readonly KpiSeriesSession[],
  days: number,
  today: Date = new Date(),
): DailyKpiSeries {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    keys.push(localDayKey(d));
  }
  const buckets = new Map<string, DayBucket>(
    keys.map((k) => [k, { spend: 0, costed: 0, sessions: 0, flags: 0, effSum: 0, effCount: 0 }]),
  );

  for (const r of rows) {
    if (r.startTime == null) continue;
    const t = new Date(r.startTime);
    if (Number.isNaN(t.getTime())) continue;
    const b = buckets.get(localDayKey(t));
    if (!b) continue;
    b.sessions++;
    b.flags += r.antiPatterns?.length ?? 0;
    if (r.estimatedCostUsd != null) {
      b.spend += r.estimatedCostUsd;
      b.costed++;
    }
    if (r.efficiencyScore != null) {
      b.effSum += r.efficiencyScore;
      b.effCount++;
    }
  }

  const labels = keys.map(formatAxisDate);
  const spend: number[] = [];
  const sessions: number[] = [];
  const flags: number[] = [];
  const eff: LabeledSeries = { values: [], labels: [] };
  const avgCost: LabeledSeries = { values: [], labels: [] };

  keys.forEach((k, i) => {
    const b = buckets.get(k)!;
    spend.push(b.spend);
    sessions.push(b.sessions);
    flags.push(b.flags);
    if (b.effCount > 0) {
      eff.values.push((b.effSum / b.effCount) * 100);
      eff.labels.push(labels[i]!);
    }
    if (b.costed > 0) {
      avgCost.values.push(b.spend / b.costed);
      avgCost.labels.push(labels[i]!);
    }
  });

  return {
    spend: { values: spend, labels },
    sessions: { values: sessions, labels },
    flags: { values: flags, labels },
    efficiencyPct: eff,
    avgCost,
  };
}

/**
 * Percent change of the second half's mean over the first half's. Comparing
 * halves instead of first-vs-last sample keeps one quiet day at either edge of
 * the window from swinging the pill. Null when there's too little data or the
 * first half averages zero.
 */
export function halfOverHalfPercent(values: readonly number[]): number | null {
  if (values.length < 4) return null;
  const mid = Math.floor(values.length / 2);
  const mean = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
  const first = mean(values.slice(0, mid));
  const second = mean(values.slice(values.length - mid));
  if (first === 0) return null;
  return ((second - first) / Math.abs(first)) * 100;
}

/** Running total of hourly spend up to and including the current hour. */
export function cumulativeHourly(
  hourly: ReadonlyArray<{ readonly hour: number; readonly cost: number }>,
  now: Date = new Date(),
): LabeledSeries {
  const lastHour = now.getHours();
  const values: number[] = [];
  const labels: string[] = [];
  let running = 0;
  for (const { hour, cost } of hourly) {
    if (hour > lastHour) break;
    running += cost;
    values.push(running);
    const h = new Date(now);
    h.setHours(hour, 59, 0, 0);
    labels.push(`By ${h.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`);
  }
  return { values, labels };
}
