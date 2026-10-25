import { useMemo, useRef, useState } from 'react';
import type { JSX, KeyboardEvent } from 'react';

export interface ActivityHeatmapProps {
  readonly variant: 'strip' | 'grid';
  readonly buckets: number[];
  readonly maxCount: number;
  readonly labels?: string[];
  readonly bucketSizeMs?: number;
  readonly startTimestamp?: number;
  readonly width?: number;
  readonly height?: number;
  readonly ariaLabel?: string;
  /** For grid variant: array of {date, count} */
  readonly days?: ReadonlyArray<{ date: string; count: number }>;
  /** Grid variant: completes the "N tool calls …" header. */
  readonly periodLabel?: string;
}

const INTENSITY_LEVELS = 5;
const COLORS = [
  'var(--color-heatmap-0)',
  'var(--color-heatmap-1)',
  'var(--color-heatmap-2)',
  'var(--color-heatmap-3)',
  'var(--color-heatmap-4)',
];

function intensityColor(count: number, maxCount: number): string {
  if (count === 0) return COLORS[0]!;
  const ratio = count / maxCount;
  const level = Math.min(Math.ceil(ratio * (INTENSITY_LEVELS - 1)), INTENSITY_LEVELS - 1);
  return COLORS[level]!;
}

function formatBucketTime(startTimestamp: number, bucketSizeMs: number, index: number): string {
  const ts = startTimestamp + index * bucketSizeMs;
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function ActivityHeatmap({
  variant,
  buckets,
  maxCount,
  bucketSizeMs,
  startTimestamp,
  width,
  height,
  ariaLabel,
  days,
  periodLabel,
}: ActivityHeatmapProps): JSX.Element {
  if (variant === 'grid' && days) {
    return (
      <GridHeatmap
        days={days}
        maxCount={maxCount}
        width={width}
        height={height}
        ariaLabel={ariaLabel}
        periodLabel={periodLabel}
      />
    );
  }

  return (
    <StripHeatmap
      buckets={buckets}
      maxCount={maxCount}
      bucketSizeMs={bucketSizeMs}
      startTimestamp={startTimestamp}
      width={width}
      height={height}
      ariaLabel={ariaLabel}
    />
  );
}

interface StripProps {
  readonly buckets: number[];
  readonly maxCount: number;
  readonly bucketSizeMs?: number;
  readonly startTimestamp?: number;
  readonly width?: number;
  readonly height?: number;
  readonly ariaLabel?: string;
}

function StripHeatmap({
  buckets,
  maxCount,
  bucketSizeMs = 900_000,
  startTimestamp = 0,
  width: explicitWidth,
  height = 24,
  ariaLabel,
}: StripProps): JSX.Element {
  const [tooltip, setTooltip] = useState<{ x: number; text: string } | null>(null);
  const cellGap = 1;
  const cellWidth = Math.max(
    4,
    Math.min(12, explicitWidth ? (explicitWidth - buckets.length * cellGap) / buckets.length : 8),
  );
  const totalWidth = explicitWidth ?? buckets.length * (cellWidth + cellGap);

  return (
    <div className="relative">
      <svg
        width={totalWidth}
        height={height}
        role="img"
        aria-label={ariaLabel ?? `Activity heatmap: ${buckets.length} time buckets`}
        className="w-full"
        style={{ maxWidth: totalWidth }}
        viewBox={`0 0 ${totalWidth} ${height}`}
        preserveAspectRatio="none"
        onMouseLeave={() => setTooltip(null)}
      >
        {buckets.map((count, i) => (
          <rect
            key={i}
            x={i * (cellWidth + cellGap)}
            y={0}
            width={cellWidth}
            height={height}
            rx={2}
            fill={intensityColor(count, maxCount)}
            className="heatmap-cell"
            style={{ animationDelay: `${Math.min(i * 8, 400)}ms` }}
            onMouseEnter={(e) => {
              const time = formatBucketTime(startTimestamp, bucketSizeMs, i);
              setTooltip({
                x: (e.currentTarget as SVGRectElement).x.baseVal.value,
                text: `${time}: ${count} calls`,
              });
            }}
          />
        ))}
      </svg>
      {tooltip && (
        <div
          className="absolute -top-7 px-1.5 py-0.5 bg-bg-elevated border border-border-subtle text-[10px] text-ink-base rounded-md shadow-md pointer-events-none whitespace-nowrap tabular-nums"
          style={{ left: tooltip.x }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

interface GridProps {
  readonly days: ReadonlyArray<{ date: string; count: number }>;
  readonly maxCount: number;
  readonly width?: number;
  readonly height?: number;
  readonly ariaLabel?: string;
  /** Completes "N tool calls …" in the header, e.g. "in the last 12 months". */
  readonly periodLabel?: string;
}

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

const TOOLTIP_ALIGN = {
  start: '-translate-x-2',
  center: '-translate-x-1/2',
  end: '-translate-x-[calc(100%-0.5rem)]',
} as const;

function formatGridDate(date: string): string {
  // UTC-anchored day key — format in UTC so the label matches the cell's row.
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function GridHeatmap({ days, maxCount, ariaLabel, periodLabel }: GridProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Array<SVGRectElement | null>>([]);
  // One shared tooltip that glides between cells (CSS transition on left/top)
  // instead of a fresh tooltip per hover.
  const [active, setActive] = useState<{
    index: number;
    x: number;
    y: number;
    align: 'start' | 'center' | 'end';
  } | null>(null);
  // Roving tabindex: one cell is in the tab order (the newest by default), and
  // arrow keys move between days, so the grid is one tab stop, not 364.
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  const grid = useMemo(() => {
    if (days.length === 0) return { weeks: 0, cells: [] };

    // `date` is a UTC-anchored YYYY-MM-DD key built server-side; `new Date(dateString)`
    // parses a bare date-only string as UTC midnight per spec. Must read it back with
    // getUTCDay() (not local getDay()) or the weekday shifts a day early for any user
    // west of UTC — see the month-label computation below for the same constraint.
    const firstDate = new Date(days[0]!.date);
    const firstDow = (firstDate.getUTCDay() + 6) % 7; // Monday=0
    const cells: Array<{ date: string; count: number; row: number; col: number }> = [];
    for (let i = 0; i < days.length; i++) {
      const globalIdx = i + firstDow;
      const row = globalIdx % 7;
      const col = Math.floor(globalIdx / 7);
      cells.push({ ...days[i]!, row, col });
    }
    const weeks = cells.length > 0 ? cells[cells.length - 1]!.col + 1 : 0;
    return { weeks, cells };
  }, [days]);

  const total = useMemo(() => days.reduce((sum, d) => sum + d.count, 0), [days]);

  const cellSize = 10;
  const cellGap = 2;
  const labelWidth = 28;
  const headerHeight = 14;
  const svgWidth = labelWidth + grid.weeks * (cellSize + cellGap);
  const svgHeight = headerHeight + 7 * (cellSize + cellGap);

  const monthLabels = useMemo(() => {
    const labels: Array<{ text: string; col: number }> = [];
    let lastMonth = '';
    for (const cell of grid.cells) {
      if (cell.row !== 0) continue;
      // Same UTC-anchored-key constraint as firstDow above: pin the formatter to
      // UTC so the month label matches the same day the weekday row is computed for.
      const month = new Date(cell.date).toLocaleString(undefined, {
        month: 'short',
        timeZone: 'UTC',
      });
      if (month !== lastMonth) {
        labels.push({ text: month, col: cell.col });
        lastMonth = month;
      }
    }
    // A partial first month can start one column before the next month's
    // label, and the two words overprint ("OctNov"). Drop the cramped one.
    return labels.filter((l, i) => {
      const next = labels[i + 1];
      return !next || next.col - l.col >= 3;
    });
  }, [grid.cells]);

  const lastIndex = grid.cells.length - 1;
  const tabIndexCell = focusIndex ?? lastIndex;

  function showTooltip(index: number): void {
    const rect = cellRefs.current[index];
    const container = containerRef.current;
    if (!rect || !container) return;
    // Measure in CSS pixels: the SVG scales to its container, so viewBox units
    // (rect.x.baseVal) don't match where the cell actually sits on screen.
    const r = rect.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    const x = r.left - c.left + r.width / 2;
    // Anchor the tooltip's edge instead of its center near the panel's sides
    // so it isn't clipped by the card.
    const align = x < 110 ? 'start' : x > c.width - 110 ? 'end' : 'center';
    setActive({ index, x, y: r.top - c.top, align });
  }

  function moveFocus(index: number): void {
    const clamped = Math.min(Math.max(index, 0), lastIndex);
    setFocusIndex(clamped);
    cellRefs.current[clamped]?.focus();
    // Focus moved from inside a keydown handler doesn't reliably re-enter
    // React's onFocus, so move the tooltip explicitly.
    showTooltip(clamped);
  }

  function handleKeyDown(e: KeyboardEvent<SVGRectElement>, index: number): void {
    const step: Record<string, number> = {
      ArrowUp: -1,
      ArrowDown: 1,
      ArrowLeft: -7,
      ArrowRight: 7,
      Home: -index,
      End: lastIndex - index,
    };
    const delta = step[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    moveFocus(index + delta);
  }

  const activeCell = active ? grid.cells[active.index] : undefined;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="text-sm text-ink-subtle">
          <span data-testid="heatmap-total" className="font-semibold text-ink-base tabular-nums">
            {total.toLocaleString()}
          </span>{' '}
          tool calls {periodLabel ?? `over ${days.length} days`}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-ink-muted">
          <span>Less</span>
          {COLORS.map((color, i) => (
            <span
              key={i}
              className="inline-block size-2.5 rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
      {/* Width-driven: the grid scales up to fill a full-width panel (height
          follows from the viewBox) instead of sitting tiny and centered. */}
      <svg
        width="100%"
        style={{ height: 'auto', maxHeight: svgHeight * 2.2 }}
        role="group"
        aria-label={ariaLabel ?? `Activity grid: ${days.length} days`}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="overflow-visible"
        onMouseLeave={() => setActive(null)}
      >
        {/* Day-of-week labels */}
        {DAY_LABELS.map((label, i) =>
          label ? (
            <text
              key={i}
              x={0}
              y={headerHeight + i * (cellSize + cellGap) + cellSize - 2}
              className="fill-ink-muted"
              fontSize={10}
            >
              {label}
            </text>
          ) : null,
        )}

        {/* Month labels */}
        {monthLabels.map(({ text, col }) => (
          <text
            key={`${text}-${col}`}
            x={labelWidth + col * (cellSize + cellGap)}
            y={10}
            className="fill-ink-muted"
            fontSize={10}
          >
            {text}
          </text>
        ))}

        {/* Cells — the reveal ripples outward from today (the last cell). */}
        {grid.cells.map((cell, i) => (
          <rect
            key={i}
            ref={(el) => {
              cellRefs.current[i] = el;
            }}
            x={labelWidth + cell.col * (cellSize + cellGap)}
            y={headerHeight + cell.row * (cellSize + cellGap)}
            width={cellSize}
            height={cellSize}
            rx={2}
            fill={intensityColor(cell.count, maxCount)}
            tabIndex={i === tabIndexCell ? 0 : -1}
            role="img"
            aria-label={`${formatGridDate(cell.date)}: ${cell.count.toLocaleString()} tool calls`}
            className={
              'heatmap-cell outline-none focus-visible:stroke-primary focus-visible:[stroke-width:1.5] ' +
              (active?.index === i ? 'stroke-ink-base [stroke-width:1]' : '')
            }
            style={{ animationDelay: `${Math.min((lastIndex - i) * 2, 600)}ms` }}
            onMouseEnter={() => showTooltip(i)}
            onFocus={() => {
              setFocusIndex(i);
              showTooltip(i);
            }}
            onBlur={() => setActive(null)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          />
        ))}
      </svg>
      {active && activeCell && (
        <div
          role="tooltip"
          className={`absolute z-10 ${TOOLTIP_ALIGN[active.align]} -translate-y-full -mt-2 px-2 py-1 bg-bg-elevated border border-border-subtle text-xs text-ink-base rounded-md shadow-md pointer-events-none whitespace-nowrap tabular-nums transition-[left,top] duration-150 ease-out motion-reduce:transition-none`}
          style={{ left: active.x, top: active.y }}
        >
          <span className="font-semibold">{activeCell.count.toLocaleString()} tool calls</span>
          <span className="text-ink-muted"> · {formatGridDate(activeCell.date)}</span>
        </div>
      )}
    </div>
  );
}
