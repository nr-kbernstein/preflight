import { useEffect, useMemo, useRef, useState } from 'react';
import type { JSX, KeyboardEvent } from 'react';

import { CornerDownLeft, Search } from 'lucide-react';

import { NAV_SECTIONS } from '../lib/nav';
import type { NavItem } from '../lib/nav';

export interface CommandPaletteProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onNavigate: (path: string) => void;
}

interface Entry {
  readonly section: string;
  readonly item: NavItem;
}

const ENTRIES: readonly Entry[] = NAV_SECTIONS.flatMap((s) =>
  s.items.map((item) => ({ section: s.label, item })),
);

/** Route switcher behind the header search field (⌘K or `/`). */
export function CommandPalette({ open, onClose, onNavigate }: CommandPaletteProps): JSX.Element | null {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === '') return ENTRIES;
    return ENTRIES.filter(
      (e) => e.item.label.toLowerCase().includes(q) || e.section.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  function choose(entry: Entry | undefined): void {
    if (!entry) return;
    onNavigate(entry.item.path);
    onClose();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[activeIndex]);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Jump to page"
        className="surface-card shadow-xl animate-overlay-enter w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-x-3 px-4 border-b border-border-subtle">
          <Search size={16} className="text-ink-muted shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages…"
            aria-label="Search pages"
            className="w-full py-3.5 bg-transparent text-sm text-ink-base placeholder:text-ink-muted focus:outline-none"
          />
        </div>
        <ul role="listbox" aria-label="Pages" className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-ink-muted">No matching pages</li>
          )}
          {results.map((entry, i) => {
            const { Icon } = entry.item;
            const active = i === activeIndex;
            return (
              <li
                key={entry.item.path}
                role="option"
                aria-selected={active}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => choose(entry)}
                className={
                  'flex items-center gap-x-3 px-3 py-2 rounded-lg text-sm cursor-pointer ' +
                  (active ? 'bg-surface-8 text-ink-base' : 'text-ink-subtle')
                }
              >
                <Icon size={16} aria-hidden="true" />
                <span className="flex-1">{entry.item.label}</span>
                <span className="text-xs text-ink-muted">{entry.section}</span>
                <kbd className="px-1.5 rounded border border-border-subtle font-mono text-[11px] text-ink-muted">
                  g {entry.item.shortcut}
                </kbd>
                {active && <CornerDownLeft size={14} className="text-ink-muted" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
