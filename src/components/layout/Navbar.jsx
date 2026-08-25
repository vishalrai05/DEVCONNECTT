import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Moon, Sun, X } from 'lucide-react'
import Logo from '../Logo'
import GradientButton from '../GradientButton'
import { useTheme } from '../../hooks/useTheme'
import { cn } from '../../utils/cn'

const links = [
  { to: '/#features', label: 'Features' },
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/login', label: 'Explore' },
]

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  // Marketing navbar only on landing — app pages use AppShell / Profile chrome
  const hideNavbar =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/profile') ||
    location.pathname.startsWith('/teams') ||
    location.pathname.startsWith('/hackathons') ||
    location.pathname.startsWith('/bookmarks') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/my-teams') ||
    location.pathname.startsWith('/teams/')

  if (hideNavbar) return null

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <nav className="mt-3 flex items-center justify-between rounded-2xl border border-app glass px-4 py-3 shadow-lg shadow-black/5 sm:px-5">
          <Logo size="sm" />

          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.to}
                className="rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-app focus-ring"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <NavLink
              to="/login"
              className="rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-app focus-ring"
            >
              Log in
            </NavLink>
            <GradientButton to="/signup" className="!px-4 !py-2.5 !text-sm">
              Get Started
            </GradientButton>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-xl border border-app p-2 text-app focus-ring"
              aria-expanded={open}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-2 rounded-2xl border border-app glass p-4 md:hidden"
            >
              <div className="flex flex-col gap-1">
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.to}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-[var(--surface)] hover:text-app"
                  >
                    {link.label}
                  </a>
                ))}
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-[var(--surface)] hover:text-app"
                >
                  Log in
                </Link>
                <div onClick={() => setOpen(false)}>
                  <GradientButton to="/signup" fullWidth className="mt-2">
                    Get Started
                  </GradientButton>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  )
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'rounded-xl border border-app p-2 text-muted transition-colors hover:text-app focus-ring',
      )}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
