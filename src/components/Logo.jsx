import { Link } from 'react-router-dom'
import { cn } from '../utils/cn'

export default function Logo({ className = '', showText = true, size = 'md' }) {
  const sizes = {
    sm: { icon: 'h-8 w-8', text: 'text-lg' },
    md: { icon: 'h-9 w-9', text: 'text-xl' },
    lg: { icon: 'h-11 w-11', text: 'text-2xl' },
  }
  const s = sizes[size] || sizes.md

  return (
    <Link
      to="/"
      className={cn('inline-flex items-center gap-2.5 focus-ring rounded-xl', className)}
      aria-label="DevConnect home"
    >
      <span
        className={cn(
          'relative flex items-center justify-center rounded-xl bg-[var(--surface)] ring-1 ring-[var(--border)] glow-blue',
          s.icon,
        )}
      >
        <svg viewBox="0 0 32 32" className="h-[70%] w-[70%]" aria-hidden>
          <path d="M8 16L14 10L16.5 12.5L11 18L8 16Z" fill="#2563EB" />
          <path d="M24 16L18 22L15.5 19.5L21 14L24 16Z" fill="#60A5FA" />
          <circle cx="16" cy="16" r="2.5" fill="currentColor" className="text-app" />
        </svg>
      </span>
      {showText ? (
        <span className={cn('font-display font-bold tracking-tight text-app', s.text)}>
          Dev<span className="text-[var(--accent)]">Connect</span>
        </span>
      ) : null}
    </Link>
  )
}
