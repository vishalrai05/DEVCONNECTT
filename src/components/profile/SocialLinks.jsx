/**
 * SocialLinks — GitHub / LinkedIn / Portfolio icons
 *
 * Only renders links that exist so empty profiles stay clean.
 * Brand icons use inline SVGs because lucide-react no longer ships brand marks.
 */

import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import GitHubIcon from '../GitHubIcon'
import { cn } from '../../utils/cn'

function LinkedInIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

const LINKS = [
  { key: 'github', label: 'GitHub', icon: GitHubIcon },
  { key: 'linkedin', label: 'LinkedIn', icon: LinkedInIcon },
  { key: 'portfolio', label: 'Portfolio', icon: ExternalLink },
]

export default function SocialLinks({ profile, className = '', size = 'md' }) {
  const items = LINKS.filter((link) => profile?.[link.key])

  if (!items.length) {
    return (
      <p className={cn('text-sm text-muted', className)}>No social links yet.</p>
    )
  }

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const pad = size === 'sm' ? 'p-2' : 'p-2.5'

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {items.map((link) => {
        const Icon = link.icon
        return (
          <motion.a
            key={link.key}
            href={profile[link.key]}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.06, y: -1 }}
            whileTap={{ scale: 0.96 }}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border border-app bg-[var(--surface)] text-app transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] focus-ring',
              pad,
            )}
            aria-label={link.label}
            title={link.label}
          >
            <Icon className={iconSize} />
            <span className="text-xs font-medium sm:text-sm">{link.label}</span>
          </motion.a>
        )
      })}
    </div>
  )
}
