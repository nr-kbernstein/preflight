import type { JSX } from 'react';

import { Bell, ChevronRight, HelpCircle, Menu, Moon, Search, Sun } from 'lucide-react';

import { useLiveAlerts } from '../hooks/useLiveAlerts';
import { findNavItem } from '../lib/nav';
import type { Theme } from '../hooks/useTheme';

export interface TopBarProps {
  readonly currentPath: string;
  readonly onNavigate: (path: string) => void;
  readonly connected: boolean;
  readonly theme: Theme;
  readonly onToggleTheme: () => void;
  readonly onOpenSearch: () => void;
  readonly onOpenHelp: () => void;
  readonly onOpenMobileNav: () => void;
}

const ICON_BUTTON =
  'relative inline-flex items-center justify-center size-9 rounded-full text-ink-subtle hover:bg-surface-8 hover:text-ink-base transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

export function TopBar({
  currentPath,
  onNavigate,
  connected,
  theme,
  onToggleTheme,
  onOpenSearch,
  onOpenHelp,
  onOpenMobileNav,
}: TopBarProps): JSX.Element {
  const { count: alertCount } = useLiveAlerts();
  const match = findNavItem(currentPath);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-x-3 h-15 px-4 sm:px-6 bg-bg-base border-b border-border-subtle">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className={`${ICON_BUTTON} lg:hidden -ms-2`}
      >
        <Menu size={18} />
      </button>

      <nav aria-label="Breadcrumb" className="hidden sm:block shrink-0">
        <ol className="flex items-center gap-x-1.5 text-sm whitespace-nowrap">
          <li className="text-ink-muted">Preflight</li>
          {match && (
            <>
              <li aria-hidden="true" className="text-ink-muted">
                <ChevronRight size={14} />
              </li>
              <li className="text-ink-muted">{match.section.label}</li>
              <li aria-hidden="true" className="text-ink-muted">
                <ChevronRight size={14} />
              </li>
              <li aria-current="page" className="font-medium text-ink-base truncate">
                {match.item.label}
              </li>
            </>
          )}
        </ol>
      </nav>

      <button
        type="button"
        onClick={onOpenSearch}
        className="flex items-center gap-x-2 w-full max-w-64 ms-auto py-2 ps-3 pe-2 rounded-lg border border-border-subtle bg-bg-base text-sm text-ink-muted hover:border-border-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Search size={16} aria-hidden="true" />
        <span className="flex-1 text-left truncate">Jump to…</span>
        <kbd className="hidden sm:inline-flex items-center px-1.5 rounded border border-border-subtle font-sans text-[11px] text-ink-muted">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-x-1">
        <span
          className={
            'hidden md:inline-flex items-center gap-x-1.5 me-1 px-2 py-1 rounded-full text-xs font-medium ' +
            (connected
              ? 'bg-accent-green/15 text-accent-green'
              : 'bg-accent-amber/15 text-accent-amber')
          }
        >
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${connected ? 'bg-accent-green animate-pulse' : 'bg-accent-amber'}`}
          />
          {connected ? 'live' : 'reconnecting'}
        </span>

        <button
          type="button"
          onClick={onOpenHelp}
          aria-label="Keyboard shortcuts"
          className={ICON_BUTTON}
        >
          <HelpCircle size={18} />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/alerts')}
          aria-label={alertCount > 0 ? `Alerts, ${alertCount} firing` : 'Alerts'}
          className={ICON_BUTTON}
        >
          <Bell size={18} />
          {alertCount > 0 && (
            <span
              data-testid="topbar-alert-count"
              className="absolute -top-0.5 -end-0.5 min-w-4.5 h-4.5 px-1 inline-flex items-center justify-center rounded-full bg-accent-red text-white text-[10px] font-semibold tabular-nums"
            >
              {alertCount > 99 ? '99+' : alertCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className={ICON_BUTTON}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <a
          href="https://newrelic.com/platform/ai-observability"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden xl:inline-flex items-center gap-x-1.5 ms-2 py-2 px-3 whitespace-nowrap rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Try AI Observability
          <ChevronRight size={14} aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}
