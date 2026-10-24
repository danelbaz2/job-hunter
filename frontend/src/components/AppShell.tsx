import { Home, Search, FileText, User, type LucideIcon } from 'lucide-react'
import { NavLink, Outlet, ScrollRestoration } from 'react-router'

const tabs: { to: string; label: string; end: boolean; icon: LucideIcon }[] = [
  { to: '/', label: 'Home', end: true, icon: Home },
  { to: '/search', label: 'Search', end: false, icon: Search },
  { to: '/resumes', label: 'Resumes', end: false, icon: FileText },
  { to: '/profile', label: 'Profile', end: false, icon: User },
]

/**
 * Mobile-first shell (SPEC criterion 20): designed at 360 px, bottom navigation on phones,
 * top navigation from the `md` breakpoint. Tabs are at least 44 px tall.
 */
export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only rounded-md bg-accent-500 px-4 py-2 text-sm font-medium text-neutral-900 focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-50"
      >
        Skip to content
      </a>

      <header className="flex items-center gap-4 px-4 py-3 sm:px-6">
        <span className="me-auto font-heading text-lg font-medium">
          Job<span className="text-accent-500">Hunter</span>
        </span>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {tabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.end} className={desktopTabClass}>
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main id="main" className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      {/* A new page opens at the top; Back returns to where the list was scrolled. */}
      <ScrollRestoration />

      <nav
        className="fixed inset-x-0 bottom-0 grid grid-cols-4 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Main"
      >
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className={mobileTabClass}>
            <tab.icon size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function mobileTabClass({ isActive }: { isActive: boolean }) {
  return `flex min-h-14 flex-col items-center justify-center gap-1 text-xs transition-colors ${
    isActive ? 'text-accent-400' : 'text-text/60 hover:text-text'
  }`
}

function desktopTabClass({ isActive }: { isActive: boolean }) {
  return `rounded-pill px-3 py-1.5 text-sm transition-colors ${
    isActive
      ? 'text-accent-400 shadow-[inset_0_0_0_1px_var(--color-accent-500)]'
      : 'text-text/85 hover:bg-text/7 hover:text-text'
  }`
}
