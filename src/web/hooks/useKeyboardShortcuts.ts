import { useEffect, useRef } from 'react';

interface ShortcutConfig {
  readonly navigate: (path: string) => void;
  readonly onToggleHelp: () => void;
  readonly onToggleTheme?: () => void;
  readonly onOpenSearch?: () => void;
  /** When false (e.g. a modal is open) no shortcut fires. Defaults to true. */
  readonly enabled?: boolean;
}

export function useKeyboardShortcuts({
  navigate,
  onToggleHelp,
  onToggleTheme,
  onOpenSearch,
  enabled = true,
}: ShortcutConfig): void {
  const pendingRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      // Drop any half-typed `g` prefix so it can't complete after the modal closes.
      pendingRef.current = null;
      return;
    }
    function handleKeyDown(e: KeyboardEvent): void {
      // ⌘K / Ctrl+K opens search from anywhere, including inputs
      if (onOpenSearch && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch();
        return;
      }

      // Skip when focus is in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      // Skip modified keys (let browser handle Cmd/Ctrl combos)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;

      // Handle pending 'g' prefix sequence
      if (pendingRef.current === 'g') {
        // g→g restarts the prefix window so an accidental double-tap doesn't
        // navigate anywhere — the user stays in prefix mode for the next key.
        if (key === 'g') {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            pendingRef.current = null;
          }, 500);
          return;
        }

        pendingRef.current = null;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        const routes: Record<string, string> = {
          h: '/',
          s: '/sessions',
          i: '/history',
          a: '/audit',
          v: '/git',
          e: '/settings',
          l: '/alerts',
        };
        if (routes[key]) {
          e.preventDefault();
          navigate(routes[key]);
        }
        // Always exit after a g-prefix sequence — matched or not — so
        // unmatched keys (e.g. g→t) don't fall through to single-key handlers.
        return;
      }

      // Start 'g' prefix
      if (key === 'g') {
        pendingRef.current = 'g';
        timerRef.current = setTimeout(() => {
          pendingRef.current = null;
        }, 500);
        return;
      }

      // Single-key shortcuts
      if (key === '?') {
        e.preventDefault();
        onToggleHelp();
      }
      if (key === 't' && onToggleTheme) {
        e.preventDefault();
        onToggleTheme();
      }
      if (key === '/' && onOpenSearch) {
        e.preventDefault();
        onOpenSearch();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigate, onToggleHelp, onToggleTheme, onOpenSearch, enabled]);
}
