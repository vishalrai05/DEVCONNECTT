/**
 * DifficultyBadge — color-coded difficulty pill
 *
 * Beginner / Intermediate / Advanced use distinct hues so cards stay scannable
 * in a dense grid without reading every field.
 */

import { cn } from '../../utils/cn'

const STYLES = {
  beginner: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  intermediate: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
  advanced: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
}

export default function DifficultyBadge({ difficulty, className = '' }) {
  const key = String(difficulty || '').toLowerCase()
  const label = key ? key.charAt(0).toUpperCase() + key.slice(1) : '—'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        STYLES[key] || 'border-app text-muted',
        className,
      )}
    >
      {label}
    </span>
  )
}
