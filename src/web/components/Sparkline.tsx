import { useId, useMemo, useState } from 'react';
import type { JSX, KeyboardEvent, PointerEvent } from 'react';

export interface SparklineProps {
  readonly values: readonly number[];
  /** Called with the scrubbed index, or null when the pointer/focus leaves. */
  readonly onScrub?: (index: number | null) => void;
  readonly stroke?: string;
  readonly height?: number;
  readonly ariaLabel?: string;
}

const VIEW_W = 300;

interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Monotone cubic (Fritsch–Carlson) path through the points. Unlike a plain
 * Catmull-Rom or bezier smoothing, a monotone curve never overshoots the data,
 * so a flat-then-rising cost series doesn't dip below zero between samples.
 */
export function monotonePath(points: readonly Point[]): string {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M${points[0]!.x},${points[0]!.y}`;

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1]!.x - points[i]!.x);
    slope.push((points[i + 1]!.y - points[i]!.y) / (dx[i] || 1));
  }

  const tangent: number[] = [slope[0]!];
  for (let i = 1; i < n - 1; i++) {
    const a = slope[i - 1]!;
    const b = slope[i]!;
    tangent.push(a * b <= 0 ? 0 : (a + b) / 2);
  }
  tangent.push(slope[n - 2]!);

  for (let i = 0; i < n - 1; i++) {
    const s = slope[i]!;
    if (s === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i]! / s;
    const b = tangent[i + 1]! / s;
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      tangent[i] = t * a * s;
      tangent[i + 1] = t * b * s;
    }
  }

  let d = `M${points[0]!.x},${points[0]!.y}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const h = dx[i]! / 3;
    d += ` C${p0.x + h},${p0.y + tangent[i]! * h} ${p1.x - h},${p1.y - tangent[i + 1]! * h} ${p1.x},${p1.y}`;
  }
  return d;
}

/**
 * Small trend line for a stat card. Pointer or arrow keys scrub along the
 * series; a dot snaps to the nearest sample and `onScrub` reports its index so
 * the card can show that point's value and label.
 */
export function Sparkline({
  values,
  onScrub,
  stroke = 'var(--color-primary)',
  height = 40,
  ariaLabel,
}: SparklineProps): JSX.Element | null {
  const gradientId = useId();
  const [active, setActive] = useState<number | null>(null);

  const points = useMemo(() => {
    if (values.length < 2) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = 3;
    // A flat series (e.g. zero flags all window) sits mid-height rather than
    // pinned to the floor, so it reads as "steady", not "nothing drawn".
    return values.map((v, i) => ({
      x: (i / (values.length - 1)) * VIEW_W,
      y: max === min ? height / 2 : pad + (1 - (v - min) / (max - min)) * (height - pad * 2),
    }));
  }, [values, height]);

  if (points.length === 0) return null;

  const line = monotonePath(points);
  const area = `${line} L${VIEW_W},${height} L0,${height} Z`;

  function scrubTo(index: number | null): void {
    setActive(index);
    onScrub?.(index);
  }

  function handlePointer(e: PointerEvent<SVGSVGElement>): void {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    scrubTo(Math.round(ratio * (points.length - 1)));
  }

  function handleKey(e: KeyboardEvent<SVGSVGElement>): void {
    const last = points.length - 1;
    const current = active ?? last;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrubTo(Math.max(current - 1, 0));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrubTo(Math.min(current + 1, last));
    } else if (e.key === 'Escape') {
      scrubTo(null);
    }
  }

  const dot = active !== null ? points[active] : undefined;

  return (
    <div className="relative mt-3">
      <svg
        data-testid="sparkline"
        viewBox={`0 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        role="img"
        aria-label={ariaLabel}
        tabIndex={0}
        className="block cursor-crosshair touch-none rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        onPointerMove={handlePointer}
        onPointerDown={handlePointer}
        onPointerLeave={() => scrubTo(null)}
        onKeyDown={handleKey}
        onBlur={() => scrubTo(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} stroke="none" />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth={1.75}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {dot && (
          <line
            x1={dot.x}
            x2={dot.x}
            y1={0}
            y2={height}
            stroke="var(--color-border-medium)"
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {/* The dot is HTML, not an SVG circle: preserveAspectRatio="none" stretches
          the viewBox horizontally, which would squash a circle into an ellipse. */}
      {dot && (
        <span
          data-testid="sparkline-dot"
          aria-hidden="true"
          className="sparkline-dot absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg-base pointer-events-none"
          style={{
            left: `${(dot.x / VIEW_W) * 100}%`,
            top: dot.y,
            backgroundColor: stroke,
            boxShadow: `0 0 0 4px color-mix(in srgb, ${stroke} 25%, transparent)`,
          }}
        />
      )}
    </div>
  );
}
