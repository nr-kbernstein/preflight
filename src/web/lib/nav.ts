import { Home, Clock, TrendingUp, ShieldCheck, GitBranch, Settings2, Bell } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly Icon: LucideIcon;
  /** Second key of the `g` prefix shortcut (see useKeyboardShortcuts). */
  readonly shortcut: string;
}

export interface NavSection {
  readonly label: string;
  readonly items: readonly NavItem[];
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    label: 'Observe',
    items: [
      { path: '/', label: 'Today', Icon: Home, shortcut: 'h' },
      { path: '/sessions', label: 'Sessions', Icon: Clock, shortcut: 's' },
    ],
  },
  {
    label: 'Analyze',
    items: [
      { path: '/history', label: 'History', Icon: TrendingUp, shortcut: 'i' },
      { path: '/git', label: 'Git', Icon: GitBranch, shortcut: 'v' },
      { path: '/audit', label: 'Audit', Icon: ShieldCheck, shortcut: 'a' },
    ],
  },
  {
    label: 'Configure',
    items: [
      { path: '/settings', label: 'Settings', Icon: Settings2, shortcut: 'e' },
      { path: '/alerts', label: 'Alerts', Icon: Bell, shortcut: 'l' },
    ],
  },
];

export const NAV_ITEMS: readonly NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

/** Section + item for a path, or null for unknown routes. */
export function findNavItem(path: string): { section: NavSection; item: NavItem } | null {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((i) => i.path === path);
    if (item) return { section, item };
  }
  return null;
}
