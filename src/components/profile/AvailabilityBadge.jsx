/**
 * AvailabilityBadge — color-coded availability pill
 *
 * Why color coding?
 * Teammates scanning profiles need to see readiness at a glance.
 * Green = available now, amber = soon, slate = not available.
 */

import { cn } from '../../utils/cn'

const STYLES = {
  'Available now': 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
  'Available this week': 'bg-sky-500/15 text-sky-500 border-sky-500/30',
  'Available this month': 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  'Not available': 'bg-slate-500/15 text-slate-400 border-slate-500/30',
}

export default function AvailabilityBadge({ availability, className = '' }) {
  if (!availability) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border border-app px-3 py-1 text-xs font-medium text-muted',
          className,
        )}
      >
        Availability not set
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
        STYLES[availability] || 'border-app text-muted',
        className,
      )}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {availability}
    </span>
  )
}
