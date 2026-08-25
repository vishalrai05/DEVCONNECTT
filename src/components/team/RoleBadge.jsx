/**
 * RoleBadge — compact role pill for team cards
 */

import { cn } from '../../utils/cn'

export default function RoleBadge({ role, className = '' }) {
  if (!role) return null
  const short = role.replace(' Developer', '').replace(' Engineer', '').replace(' Designer', '')
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-2.5 py-0.5 text-[11px] font-medium text-[var(--primary)]',
        className,
      )}
    >
      {short}
    </span>
  )
}
