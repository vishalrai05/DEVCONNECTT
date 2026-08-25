/**
 * SkillChip — a removable (or static) skill tag
 *
 * Why a dedicated chip component?
 * Skills appear on Dashboard, Edit Profile, and public Profile. Shared styling
 * + optional Framer Motion entrance keeps the chip system consistent.
 */

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function SkillChip({
  skill,
  onRemove,
  animated = true,
  className = '',
}) {
  const content = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-app bg-[var(--surface)] px-3 py-1 text-xs font-medium text-app sm:text-sm',
        className,
      )}
    >
      {skill}
      {onRemove ? (
        <button
          type="button"
          onClick={() => onRemove(skill)}
          className="rounded-full p-0.5 text-muted transition-colors hover:bg-red-500/15 hover:text-red-400 focus-ring"
          aria-label={`Remove ${skill}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </span>
  )

  if (!animated) return content

  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.18 }}
      className="inline-flex"
    >
      {content}
    </motion.span>
  )
}
