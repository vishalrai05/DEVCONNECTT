/**
 * AppShell — shared chrome for authenticated app pages (Dashboard, Edit, Teams)
 *
 * Why extract this?
 * Phase 2 placeholders duplicated header/nav. Phase 3 pages share Logo,
 * theme toggle, logout, and primary nav so layout stays consistent.
 */

import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Bookmark,
  Compass,
  Home,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  Trophy,
  Users,
} from 'lucide-react'
import Logo from '../Logo'
import ThemeToggle from '../ThemeToggle'
import NotificationBell from '../team/NotificationBell'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import { cn } from '../../utils/cn'

const NAV = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/find-teammates', label: 'Discover', icon: Compass },
  { to: '/my-teams', label: 'Teams', icon: Users },
  { to: '/hackathons', label: 'Hackathons', icon: Trophy },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/profile/edit', label: 'My profile', icon: Settings },
]

export default function AppShell({ children, title, description }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')

  const links = [
    ...NAV,
    ...(user?.role === 'admin' ? [{ to: '/admin/hackathons', label: 'Admin', icon: Settings }] : []),
  ]

  return (
    <div className="min-h-svh bg-app text-app">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-app bg-[var(--surface)] px-4 py-5 lg:flex">
        <Logo size="sm" className="mb-8 px-1" />
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase text-muted">Workspace</p>
        <nav className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-ring',
                isActive
                  ? 'bg-[var(--primary)]/15 text-[var(--accent)]'
                  : 'text-muted hover:bg-[var(--card)] hover:text-app',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-md border border-app bg-[var(--card)] p-3">
          <div className="mb-2 flex h-20 items-center justify-center overflow-hidden rounded bg-[var(--surface)] text-[var(--accent)]">
            <Users className="h-10 w-10" strokeWidth={1.2} />
          </div>
          <p className="text-sm font-semibold text-app">Build something together</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">Find your next teammate and turn an idea into a project.</p>
          <Link to="/find-teammates" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent)] hover:underline">
            Explore teams <span aria-hidden="true">→</span>
          </Link>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-app bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-muted">{title || 'DevConnect'}</p>
              {description ? <p className="hidden truncate text-sm font-medium text-app sm:block">{description}</p> : null}
            </div>
            <form
              className="hidden w-full max-w-sm flex-1 items-center gap-2 rounded-md border border-app bg-[var(--surface)] px-3 py-2 md:flex"
              role="search"
              onSubmit={(event) => {
                event.preventDefault()
                const query = searchValue.trim()
                navigate(query ? `/find-teammates?skills=${encodeURIComponent(query)}` : '/find-teammates')
              }}
            >
              <Search className="h-4 w-4 shrink-0 text-muted" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Find developers by skill..."
                aria-label="Find developers by skill"
                className="min-w-0 flex-1 bg-transparent text-xs text-app outline-none placeholder:text-muted"
              />
              <span className="text-[10px] text-muted">Enter</span>
            </form>
            <div className="flex items-center gap-2">
              <Link to="/my-teams" className="hidden rounded-md border border-app p-2 text-muted hover:text-app sm:inline-flex" aria-label="Messages" title="Messages">
                <MessageCircle className="h-4 w-4" />
              </Link>
              <NotificationBell />
              <ThemeToggle />
              {user?._id ? (
                <Link to={`/profile/${user._id}`} className="flex items-center gap-2 border-l border-app pl-3">
                  <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--card)] text-xs font-semibold text-[var(--accent)]">
                    {user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user.name?.slice(0, 1)}
                  </span>
                  <span className="hidden max-w-32 text-left sm:block">
                    <span className="block truncate text-xs font-semibold text-app">{user.name}</span>
                    <span className="block text-[10px] text-muted">Developer</span>
                  </span>
                </Link>
              ) : null}
              <button type="button" onClick={() => logout()} className="rounded-md p-2 text-muted hover:bg-[var(--card)] hover:text-app" aria-label="Log out" title="Log out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-6 lg:pb-8">
        {(title || description) && (
          <div className="sr-only mb-8">
            {title ? (
              <h1 className="font-display text-3xl font-bold text-app sm:text-4xl">
                {title}
              </h1>
            ) : null}
            {description ? <p className="mt-2 max-w-2xl text-muted">{description}</p> : null}
          </div>
        )}
        {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-app bg-[var(--surface)]/95 px-2 py-2 backdrop-blur-xl lg:hidden" aria-label="Primary navigation">
        {links.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cn('flex flex-col items-center gap-1 rounded-md py-1.5 text-[10px] focus-ring', isActive ? 'text-[var(--accent)]' : 'text-muted')}>
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
