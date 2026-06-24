import { useState } from 'react';
import { HeaderBar } from './HeaderBar';
import { SidebarNav } from './SidebarNav';

/**
 * AppShell — top-level layout.
 * - Sidebar (sticky, collapsible to drawer on mobile)
 * - Header with breadcrumb + right slot (headerExtras)
 * - <main> for active tab content
 */
export function AppShell({ activeNav, onNavChange, headerExtras, children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-dvh min-h-0 w-full bg-background text-foreground">
      {/* Sidebar — desktop */}
      <div
        className={
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-background transition-transform duration-200 lg:static lg:translate-x-0 ' +
          (menuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')
        }
        aria-hidden={!menuOpen && 'true'}
      >
        <SidebarNav active={activeNav} onChange={(id) => { onNavChange?.(id); setMenuOpen(false); }} />
      </div>

      {/* Backdrop on mobile */}
      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-label="Zamknij menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderBar
          active={activeNav}
          rightSlot={headerExtras}
          onMenuToggle={() => setMenuOpen((v) => !v)}
          isMenuOpen={menuOpen}
        />
        <main className="flex min-h-0 flex-1 flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
