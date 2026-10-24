import { NavLink, Outlet } from 'react-router'

const tabs = [
  { to: '/', label: 'Home', end: true },
  { to: '/search', label: 'Search', end: false },
  { to: '/resumes', label: 'Resumes', end: false },
  { to: '/profile', label: 'Profile', end: false },
]

/**
 * Mobile-first shell (SPEC criterion 20): designed at 360 px, bottom navigation on phones,
 * top navigation from the `md` breakpoint. Tabs are at least 44 px tall.
 */
export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line px-4 py-3 md:flex md:items-center md:justify-between">
        <span className="text-lg font-semibold">Job Hunter</span>
        <nav className="hidden gap-1 md:flex" aria-label="Main">
          {tabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.end} className={desktopTabClass}>
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 grid grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Main"
      >
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className={mobileTabClass}>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function mobileTabClass({ isActive }: { isActive: boolean }) {
  return `flex min-h-14 items-center justify-center text-sm ${
    isActive ? 'font-semibold text-accent' : 'text-muted'
  }`
}

function desktopTabClass({ isActive }: { isActive: boolean }) {
  return `rounded-md px-3 py-2 text-sm ${
    isActive ? 'font-semibold text-accent' : 'text-muted hover:text-ink'
  }`
}
