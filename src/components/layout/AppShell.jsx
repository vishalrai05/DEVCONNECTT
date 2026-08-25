/**
 * AppShell — shared chrome for authenticated app pages (Dashboard, Edit, Teams)
 *
 * Why extract this?
 * Phase 2 placeholders duplicated header/nav. Phase 3 pages share Logo,
 * theme toggle, logout, and primary nav so layout stays consistent.
 */

import { Link, NavLink } from 'react-router-dom'
import Logo from '../Logo'
import GradientButton from '../GradientButton'
import ThemeToggle from '../ThemeToggle'
import NotificationBell from '../team/NotificationBell'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../utils/cn'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/hackathons', label: 'Hackathons' },
  { to: '/find-teammates', label: 'Find teammates' },
  { to: '/my-teams', label: 'Teams' },
  { to: '/bookmarks', label: 'Bookmarks' },
  { to: '/profile/edit', label: 'Edit profile' },
]

export default function AppShell({ children, title, description }) {
  const { user, logout } = useAuth()

  const links = [
    ...NAV,
    ...(user?.role === 'admin' ? [{ to: '/admin/hackathons', label: 'Admin' }] : []),
  ]

  return (
    <div className="min-h-svh bg-app">
      {/* Soft atmospheric gradient — theme tokens keep light/dark in sync */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in srgb, var(--primary) 18%, transparent), transparent)',
        }}
      />

      <header className="sticky top-0 z-40 border-b border-app glass">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo size="sm" />

          <nav className="order-3 flex w-full gap-1 overflow-x-auto pb-1 sm:order-none sm:w-auto sm:pb-0 md:gap-2">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-ring',
                    isActive
                      ? 'bg-[var(--primary)]/15 text-[var(--primary)]'
                      : 'text-muted hover:text-app',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user?._id ? (
              <Link
                to={`/profile/${user._id}`}
                className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-app focus-ring"
              >
                Public view
              </Link>
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            <GradientButton
              type="button"
              variant="ghost"
              className="!px-3 !py-2 !text-sm"
              onClick={() => logout()}
            >
              Log out
            </GradientButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {(title || description) && (
          <div className="mb-8">
            {title ? (
              <h1 className="font-display text-3xl font-bold tracking-tight text-app sm:text-4xl">
                {title}
              </h1>
            ) : null}
            {description ? <p className="mt-2 max-w-2xl text-muted">{description}</p> : null}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
