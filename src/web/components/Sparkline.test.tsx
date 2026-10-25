import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Sparkline, monotonePath } from './Sparkline';
import { Kpi, seriesDeltaPercent } from './Kpi';

describe('monotonePath', () => {
  it('passes through every point', () => {
    const d = monotonePath([
      { x: 0, y: 10 },
      { x: 10, y: 0 },
      { x: 20, y: 5 },
    ]);
    expect(d.startsWith('M0,10')).toBe(true);
    expect(d).toContain(' 10,0');
    expect(d.endsWith(' 20,5')).toBe(true);
  });

  it('keeps flat segments flat (no overshoot)', () => {
    const d = monotonePath([
      { x: 0, y: 5 },
      { x: 10, y: 5 },
      { x: 20, y: 0 },
    ]);
    // Both control points of the flat first segment stay at y=5.
    expect(d).toMatch(/^M0,5 C[\d.]+,5 [\d.]+,5 10,5 /);
  });
});

describe('Sparkline', () => {
  it('renders nothing for fewer than two values', () => {
    const { container } = render(<Sparkline values={[1]} />);
    expect(container.firstChild).toBeNull();
  });

  it('scrubs with arrow keys and clears on Escape', () => {
    const onScrub = vi.fn();
    render(<Sparkline values={[1, 2, 3]} onScrub={onScrub} ariaLabel="trend" />);
    const svg = screen.getByRole('img', { name: 'trend' });
    fireEvent.keyDown(svg, { key: 'ArrowLeft' });
    expect(onScrub).toHaveBeenLastCalledWith(1);
    expect(screen.getByTestId('sparkline-dot')).toBeInTheDocument();
    fireEvent.keyDown(svg, { key: 'Escape' });
    expect(onScrub).toHaveBeenLastCalledWith(null);
    expect(screen.queryByTestId('sparkline-dot')).toBeNull();
  });
});

describe('Kpi with a series', () => {
  it('shows the scrubbed point and its label, then restores the total', () => {
    render(
      <Kpi
        label="spend"
        value="$6"
        series={[1, 2, 3]}
        seriesLabels={['Oct 1', 'Oct 2', 'Oct 3']}
        seriesCaption="Daily"
        formatPoint={(n) => `$${n}`}
      />,
    );
    const svg = screen.getByTestId('sparkline');
    fireEvent.keyDown(svg, { key: 'ArrowLeft' });
    expect(screen.getByText('$2')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-caption').textContent).toBe('Oct 2');
    fireEvent.keyDown(svg, { key: 'Escape' });
    expect(screen.getByText('$6')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-caption').textContent).toBe('Daily');
  });

  it('colors the delta pill by trend direction', () => {
    const { rerender } = render(
      <Kpi label="cost" value="$1" series={[1, 2]} trend="down-is-good" />,
    );
    expect(screen.getByTestId('kpi-delta').className).toContain('text-accent-red');
    rerender(<Kpi label="cost" value="$1" series={[2, 1]} trend="down-is-good" />);
    expect(screen.getByTestId('kpi-delta').className).toContain('text-accent-green');
  });

  it('omits the pill when the delta is unknown', () => {
    render(<Kpi label="x" value="1" series={[0, 5]} />);
    expect(screen.queryByTestId('kpi-delta')).toBeNull();
    expect(seriesDeltaPercent([0, 5])).toBeNull();
  });
});
