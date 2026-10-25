import { useState } from 'react';
import type { JSX, ReactNode } from 'react';

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { useAnimatedValue } from '../hooks/useAnimatedValue';
import { Sparkline } from './Sparkline';

export type KpiTone = 'neutral' | 'good' | 'warn' | 'bad';

/** Which direction of change the delta pill should color as good. */
export type KpiTrend = 'up-is-good' | 'down-is-good' | 'neutral';

const TONE: Record<KpiTone, string> = {
  neutral: 'text-ink-base',
  good: 'text-accent-green',
  warn: 'text-accent-amber',
  bad: 'text-accent-red',
};

export interface KpiProps {
  readonly label: string;
  readonly value: string;
  readonly sub?: ReactNode;
  readonly tone?: KpiTone;
  readonly hero?: boolean;
  readonly animate?: boolean;
  /**
   * The live numeric value backing the animated count-up. Accepts `null` for
   * "genuinely unknown/not-yet-available" (as opposed to a confirmed `0`) —
   * callers should pass the raw nullable metric through rather than
   * coalescing it to `0` first, or the animate branch below renders a
   * misleading "0" instead of falling through to the `value` string (e.g.
   * `value="—"`).
   */
  readonly numericValue?: number | null;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly decimals?: number;
  /**
   * Formatter for the animated value. When set it must match the formatter used
   * to build `value`, so the count-up and the settled string render identically
   * (e.g. pass `formatUsd` for a cost KPI). `prefix`/`suffix`/`decimals` are then
   * ignored — the formatter owns the whole string.
   */
  readonly format?: (n: number) => string;
  /** Trend samples, oldest first. Two or more draw a sparkline under the value. */
  readonly series?: readonly number[];
  /** One label per `series` sample (e.g. a date), shown while scrubbing. */
  readonly seriesLabels?: readonly string[];
  /** Footer caption when not scrubbing, e.g. "Last 30 days". */
  readonly seriesCaption?: string;
  /** Formats a scrubbed sample for the headline; defaults to `format`, then `String`. */
  readonly formatPoint?: (n: number) => string;
  /** Change shown in the pill; derived from first vs last sample when omitted. */
  readonly deltaPercent?: number | null;
  readonly trend?: KpiTrend;
}

/** Percent change from the first to the last sample, or null when the first is 0. */
export function seriesDeltaPercent(series: readonly number[]): number | null {
  if (series.length < 2) return null;
  const first = series[0]!;
  const last = series[series.length - 1]!;
  if (first === 0) return null;
  return ((last - first) / Math.abs(first)) * 100;
}

function DeltaPill({ percent, trend }: { percent: number; trend: KpiTrend }): JSX.Element {
  const up = percent >= 0;
  const good = trend === 'neutral' ? null : trend === 'up-is-good' ? up : !up;
  const tone =
    good === null
      ? 'bg-surface-8 text-ink-subtle'
      : good
        ? 'bg-accent-green/15 text-accent-green'
        : 'bg-accent-red/15 text-accent-red';
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      data-testid="kpi-delta"
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-medium tabular-nums ${tone}`}
    >
      <Icon size={12} aria-hidden="true" />
      {Math.abs(percent).toFixed(1)}%
    </span>
  );
}

export function Kpi({
  label,
  value,
  sub,
  tone = 'neutral',
  hero = false,
  animate = false,
  numericValue,
  prefix = '',
  suffix = '',
  decimals = 0,
  format,
  series,
  seriesLabels,
  seriesCaption,
  formatPoint,
  deltaPercent,
  trend = 'up-is-good',
}: KpiProps): JSX.Element {
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  // `null` means "genuinely unknown", same as `undefined` — neither should
  // coalesce to a rendered `0`. Only a real number reaches the animate branch.
  const hasNumericValue = numericValue !== undefined && numericValue !== null;

  const animated = useAnimatedValue(numericValue ?? 0, {
    decimals,
    enabled: animate && hasNumericValue,
    format,
  });

  const settled =
    animate && hasNumericValue ? (format ? animated : `${prefix}${animated}${suffix}`) : value;
  const scrubbed = scrubIndex !== null && series ? series[scrubIndex] : undefined;
  const display = scrubbed !== undefined ? (formatPoint ?? format ?? String)(scrubbed) : settled;

  const hasSeries = series !== undefined && series.length >= 2;
  const delta =
    deltaPercent !== undefined ? deltaPercent : hasSeries ? seriesDeltaPercent(series) : null;
  const caption =
    scrubIndex !== null ? (seriesLabels?.[scrubIndex] ?? seriesCaption) : seriesCaption;

  const valueClass = hero
    ? 'text-2xl font-semibold mt-1 tabular-nums text-primary'
    : `text-2xl font-semibold mt-1 tabular-nums ${TONE[tone]}`;

  return (
    <div data-kpi="" className="relative">
      {delta !== null && (
        <span className="absolute top-0 end-0">
          <DeltaPill percent={delta} trend={trend} />
        </span>
      )}
      <div
        className={`text-xs text-ink-muted uppercase tracking-wide${delta !== null ? ' pe-16' : ''}`}
      >
        {label}
      </div>
      <div className={valueClass}>{display}</div>
      {sub && <div className="text-xs text-ink-muted mt-1">{sub}</div>}
      {hasSeries && (
        <>
          <Sparkline
            values={series}
            onScrub={setScrubIndex}
            ariaLabel={`${label} trend${seriesCaption ? `, ${seriesCaption}` : ''}`}
          />
          {caption && (
            <div data-testid="kpi-caption" className="text-xs text-ink-muted mt-1.5 tabular-nums">
              {caption}
            </div>
          )}
        </>
      )}
    </div>
  );
}
