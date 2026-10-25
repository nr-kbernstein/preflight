import { useState, useCallback } from 'react';
import type { JSX } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { CommandPalette } from './components/CommandPalette';
import { AlertBannerStack } from './components/AlertBannerStack';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ShortcutOverlay } from './components/ShortcutOverlay';
import { useLiveEvents } from './hooks/useLiveEvents';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTheme } from './hooks/useTheme';
import { useLiveStore } from './store/liveStore';
import { Today } from './views/Today';
import { Sessions } from './views/Sessions';
import { History } from './views/History';
import { Audit } from './views/Audit';
import { GitEfficiency } from './views/GitEfficiency';
import { Settings } from './views/Settings';
import { Alerts } from './views/Alerts';

export function App(): JSX.Element {
  useLiveEvents();
  const connected = useLiveStore((s) => s.connected);
  const [location, navigate] = useLocation();
  const [shortcutHelpOpen, setShortcutHelpOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const toggleHelp = useCallback(() => setShortcutHelpOpen((v) => !v), []);
  const closeHelp = useCallback(() => setShortcutHelpOpen(false), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useKeyboardShortcuts({
    navigate,
    onToggleHelp: toggleHelp,
    onToggleTheme: toggleTheme,
    onOpenSearch: openSearch,
  });

  return (
    <>
      <div className="flex h-full">
        <Sidebar
          currentPath={location}
          onNavigate={navigate}
          mobileOpen={mobileNavOpen}
          onCloseMobile={closeMobileNav}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <TopBar
            currentPath={location}
            onNavigate={navigate}
            connected={connected}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenSearch={openSearch}
            onOpenHelp={toggleHelp}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />
          <AlertBannerStack />
          <main className="flex-1 overflow-auto">
            <div className="max-w-screen-2xl mx-auto p-4 sm:p-6 h-full">
              <ErrorBoundary resetKey={location}>
                <Switch>
                  <Route path="/sessions" component={Sessions} />
                  <Route path="/history" component={History} />
                  <Route path="/audit" component={Audit} />
                  <Route path="/git" component={GitEfficiency} />
                  <Route path="/settings" component={Settings} />
                  <Route path="/alerts" component={Alerts} />
                  <Route path="/" component={Today} />
                  <Route>
                    <div className="text-ink-muted">Not found</div>
                  </Route>
                </Switch>
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
      <CommandPalette open={searchOpen} onClose={closeSearch} onNavigate={navigate} />
      <ShortcutOverlay open={shortcutHelpOpen} onClose={closeHelp} />
    </>
  );
}
