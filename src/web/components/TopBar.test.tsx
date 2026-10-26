import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TopBar, type TopBarProps } from './TopBar';
import { useLiveStore } from '../store/liveStore';

function resetStore(): void {
  useLiveStore.setState({
    connected: false,
    recentToolCalls: [],
    cost: null,
    antiPatterns: [],
    firingAlerts: new Map(),
    dismissedAlerts: new Set(),
  });
}

function renderTopBar(overrides: Partial<TopBarProps> = {}): void {
  render(
    <TopBar
      currentPath="/history"
      onNavigate={() => {}}
      connected={true}
      theme="dark"
      onToggleTheme={() => {}}
      onOpenSearch={() => {}}
      onOpenHelp={() => {}}
      onOpenMobileNav={() => {}}
      {...overrides}
    />,
  );
}

describe('TopBar', () => {
  beforeEach(resetStore);
  afterEach(resetStore);

  it('shows the section and page in the breadcrumb', () => {
    renderTopBar();
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(crumbs.textContent).toContain('Analyze');
    expect(crumbs.querySelector('[aria-current="page"]')?.textContent).toBe('History');
  });

  it('shows live when connected and reconnecting when not', () => {
    renderTopBar({ connected: true });
    expect(screen.getByText('live')).toBeInTheDocument();
  });

  it('shows reconnecting when disconnected', () => {
    renderTopBar({ connected: false });
    expect(screen.getByText('reconnecting')).toBeInTheDocument();
  });

  it('opens search from the jump-to field', () => {
    const onOpenSearch = vi.fn();
    renderTopBar({ onOpenSearch });
    fireEvent.click(screen.getByText('Jump to…'));
    expect(onOpenSearch).toHaveBeenCalled();
  });

  it('toggles theme with a label naming the target mode', () => {
    const onToggleTheme = vi.fn();
    renderTopBar({ theme: 'dark', onToggleTheme });
    fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(onToggleTheme).toHaveBeenCalled();
  });

  it('shows a firing-alert count on the bell and navigates to alerts', () => {
    const onNavigate = vi.fn();
    useLiveStore.getState().addOrUpdateAlert({
      id: 'rule-x',
      state: 'firing',
      severity: 'warning',
      title: 'Rule',
      description: '',
      value: 1,
      threshold: 0,
      firedAt: 0,
    });
    renderTopBar({ onNavigate });
    expect(screen.getByTestId('topbar-alert-count').textContent).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: 'Alerts, 1 firing' }));
    expect(onNavigate).toHaveBeenCalledWith('/alerts');
  });

  it('keeps the live indicator at every width, text-only for screen readers on small screens', () => {
    renderTopBar({ connected: true });
    const label = screen.getByText('live');
    expect(label.className).toContain('sr-only');
    expect(label.className).toContain('md:not-sr-only');
    expect(label.parentElement!.className).not.toContain('hidden');
  });
});
