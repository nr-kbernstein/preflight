import type { JSX } from 'react';

import { ExternalLink, X } from 'lucide-react';

import { useLiveAlerts } from '../hooks/useLiveAlerts';
import { useVersionInfo } from '../hooks/useVersionInfo';
import { NAV_SECTIONS } from '../lib/nav';
import type { NavItem } from '../lib/nav';
import type { AlertEvent } from '../store/liveStore';
import { Pill } from './ui';
import type { PillTone } from './ui';

const SEVERITY_TONE: Record<AlertEvent['severity'], PillTone> = {
  info: 'neutral',
  warning: 'warning',
  critical: 'danger',
};

export interface SidebarProps {
  readonly currentPath: string;
  readonly onNavigate: (path: string) => void;
  /** Below the lg breakpoint the sidebar is an off-canvas drawer. */
  readonly mobileOpen?: boolean;
  readonly onCloseMobile?: () => void;
}

export function Sidebar({
  currentPath,
  onNavigate,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps): JSX.Element {
  const { count: alertCount, maxSeverity } = useLiveAlerts();
  const versionInfo = useVersionInfo();

  function renderNavItem({ path, label, Icon }: NavItem) {
    const active = currentPath === path;
    const showBadge = path === '/' && alertCount > 0;
    const severity = maxSeverity ?? 'info';
    return (
      <button
        key={path}
        type="button"
        aria-current={active ? 'page' : undefined}
        onClick={() => {
          onNavigate(path);
          onCloseMobile?.();
        }}
        className={
          'w-full flex items-center gap-x-3 py-2 px-2.5 rounded-lg text-sm text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ' +
          (active
            ? 'bg-surface-8 text-ink-base font-medium'
            : 'text-ink-subtle hover:text-ink-base hover:bg-surface-5')
        }
      >
        <Icon size={16} aria-hidden="true" focusable="false" className="shrink-0" />
        <span>{label}</span>
        {showBadge && (
          <Pill
            tone={SEVERITY_TONE[severity]}
            size="sm"
            className="ml-auto font-semibold tabular-nums"
            data-testid="alert-badge"
            data-severity={severity}
            aria-label={`${alertCount > 99 ? '99+' : alertCount} firing ${alertCount === 1 ? 'alert' : 'alerts'}`}
          >
            {alertCount > 99 ? '99+' : alertCount}
          </Pill>
        )}
      </button>
    );
  }

  return (
    <>
      {mobileOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={
          'fixed inset-y-0 start-0 z-50 w-65 flex flex-col bg-bg-base border-e border-border-subtle transition-transform duration-200 lg:translate-x-0 ' +
          (mobileOpen ? 'translate-x-0' : '-translate-x-full')
        }
      >
        {/* Logo + brand */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <svg width="26" height="26" viewBox="0 0 128 128" aria-hidden="true">
              <rect width="128" height="128" rx="24" fill="url(#preflightGrad)" />
              <path
                d="M21.1599 74.0495L29.1148 66.0946L45.3429 68.9583L56.7981 57.5032L21.1599 42.2297L30.7058 32.6838L73.9808 40.3205L87.9815 26.3198C89.7316 24.5697 91.8529 23.6947 94.3454 23.6947C96.838 23.6947 98.9593 24.5697 100.709 26.3198C102.459 28.0699 103.335 30.1912 103.335 32.6838C103.335 35.1763 102.459 37.2976 100.709 39.0477L86.7087 53.0484L94.3454 96.3234L84.7995 105.869L69.526 70.2311L58.0709 81.6863L60.9346 97.9144L52.9797 105.869L41.8428 85.1864L21.1599 74.0495Z"
                fill="#080F11"
              />
              <defs>
                <linearGradient
                  id="preflightGrad"
                  x1="64"
                  y1="0"
                  x2="64"
                  y2="128"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0.12" stopColor="#D2FA37" />
                  <stop offset="0.88" stopColor="#1CE783" />
                </linearGradient>
              </defs>
            </svg>
            <span className="font-semibold text-base tracking-tight text-ink-base">Preflight</span>
            <span className="text-ink-muted text-[10px] leading-none select-none">|</span>
            <span className="text-ink-muted text-[9px] leading-none">by</span>
            <svg
              width="46"
              height="9"
              viewBox="0 0 819.12 159.36"
              aria-label="New Relic"
              fill="currentColor"
              className="text-ink-subtle flex-shrink-0"
            >
              <polygon points="68.85 .18 8.05 35.28 34.54 50.57 68.85 30.76 111.21 55.22 111.21 104.14 76.9 123.95 76.9 154.53 137.7 119.43 137.7 39.93 68.85 .18" />
              <polygon points="42.36 94.97 42.36 143.89 68.85 159.18 68.85 79.68 0 39.93 0 70.51 42.36 94.97" />
              <path d="M232.21,39.81c-14.82,0-21.84,9.36-21.84,9.36h-.78l-1.56-7.8h-17.94v79.57h19.5v-46.03c0-10.14,7.02-17.16,17.16-17.16s17.16,7.02,17.16,17.16v46.03h19.5v-47.59c0-20.28-13.26-33.55-31.21-33.55Z" />
              <polygon points="442.54 93.64 441.42 93.64 428.15 41.38 408.31 41.38 395.05 93.64 393.93 93.64 380.67 41.38 360.39 41.38 380.67 120.95 404.41 120.95 417.67 69.46 418.79 69.46 432.06 120.95 455.8 120.95 476.08 41.38 455.8 41.38 442.54 93.64" />
              <path d="M535.8,48.4h-.78l-1.56-7.02h-16.38v79.57h19.5v-46.02c0-10.14,4.68-14.82,14.82-14.82h10.04v-18.72h-11.6c-9.36,0-14.04,7.02-14.04,7.02Z" />
              <path d="M604.56,39.82c-23.4,0-40.56,17.16-40.56,41.34s16.19,41.34,40.56,41.34c19.73,0,31.61-11.61,36.56-20.15l-17.9-6.38c-1.78,3.24-8.91,9.47-18.66,9.47-11.37,0-19.5-7.12-21.06-18.04h59.29s.78-3.12.78-7.8c0-22.62-17.16-39.78-39-39.78ZM583.5,74.14c2.34-10.14,9.36-17.94,21.06-17.94,10.92,0,17.94,7.8,19.5,17.94h-40.56Z" />
              <path d="M316.44,39.82c-23.4,0-40.56,17.16-40.56,41.34s16.19,41.34,40.56,41.34c19.73,0,31.61-11.61,36.56-20.15l-17.9-6.38c-1.78,3.24-8.91,9.47-18.66,9.47-11.37,0-19.5-7.12-21.06-18.04h59.29s.78-3.12.78-7.8c0-22.62-17.16-39.78-39-39.78ZM295.38,74.14c2.34-10.14,9.36-17.94,21.06-17.94,10.92,0,17.94,7.8,19.5,17.94h-40.56Z" />
              <rect x="692.24" y="9.96" width="19.5" height="19.5" />
              <path d="M765.56,104.56c-11.7,0-21.06-9.36-21.06-23.4s9.36-23.4,21.06-23.4,16.38,7.8,17.94,12.48l17.66-6.28c-4.27-11.11-14.77-24.14-35.6-24.14-23.4,0-40.56,17.16-40.56,41.34s17.16,41.34,40.56,41.34c21,0,31.5-13.25,35.71-24.88l-17.77-6.32c-1.56,5.46-6.24,13.26-17.94,13.26Z" />
              <polygon points="645.72 27.3 656.79 27.3 656.79 120.95 676.3 120.95 676.3 9.96 645.72 9.96 645.72 27.3" />
              <rect x="692.24" y="41.38" width="19.5" height="79.57" />
              <path d="M811.7,105.65c-4.28,0-7.42,3.24-7.42,7.52s3.13,7.52,7.42,7.52,7.42-3.24,7.42-7.52-3.13-7.52-7.42-7.52ZM811.7,119.54c-3.66,0-6.27-2.72-6.27-6.37s2.61-6.37,6.27-6.37,6.27,2.72,6.27,6.37-2.61,6.37-6.27,6.37Z" />
              <path d="M814.94,111.81c0-1.46-1.15-2.61-2.82-2.61h-3.34v7.83h1.15v-2.72h1.04l2.72,2.72h1.46l-2.72-2.72c1.46-.1,2.51-1.15,2.51-2.51ZM809.93,113.17v-2.82h2.19c1.04,0,1.67.63,1.67,1.46s-.52,1.36-1.67,1.36h-2.19Z" />
            </svg>
          </div>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation"
              className="lg:hidden p-1 rounded-md text-ink-subtle hover:bg-surface-8"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV_SECTIONS.map((section, i) => (
            <div key={section.label} className={i === 0 ? '' : 'pt-4'}>
              {i > 0 && (
                <div className="px-2.5 mb-2 text-xs uppercase text-ink-muted">{section.label}</div>
              )}
              <nav aria-label={section.label} className="flex flex-col gap-y-0.5">
                {section.items.map((item) => renderNavItem(item))}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer — workspace card, mirrors Preline's sidebar account switcher */}
        <div className="px-3 py-3 border-t border-border-subtle">
          <div className="flex items-center gap-x-3 px-2.5 py-2 rounded-lg">
            <span className="flex items-center justify-center size-8 shrink-0 rounded-lg bg-primary-soft text-primary text-xs font-semibold">
              PF
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink-base truncate">Local workspace</div>
              {versionInfo.installed !== null ? (
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <span>v{versionInfo.installed}</span>
                  <span aria-hidden="true">·</span>
                  <a
                    href="https://github.com/newrelic-experimental/preflight"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View Preflight on GitHub"
                    className="text-ink-subtle hover:text-primary transition-colors duration-150 inline-flex items-center gap-0.5"
                  >
                    GitHub
                    <ExternalLink size={10} aria-hidden="true" />
                  </a>
                </div>
              ) : (
                <div className="text-xs text-ink-muted">single-user</div>
              )}
            </div>
          </div>
          {versionInfo.updateAvailable && versionInfo.latest !== null && (
            <div className="mt-1 px-2.5">
              <Pill tone="warning" size="sm">
                v{versionInfo.latest} available
              </Pill>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
