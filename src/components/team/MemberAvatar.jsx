/**
 * MemberAvatar — single member avatar with initials fallback
 * Used in avatar groups on TeamCard and TeamMemberCard.
 */

import { motion } from 'framer-motion'
import { getInitials } from '../../utils/profile'
import { cn } from '../../utils/cn'

export default function MemberAvatar({
  user,
  size = 'md',
  className = '',
  index = 0,
}) {
  const dims = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-12 w-12 text-sm' : 'h-9 w-9 text-xs'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'overflow-hidden rounded-full border-2 border-[var(--surface)] bg-[var(--surface)] ring-1 ring-[var(--border)]',
        dims,
        className,
      )}
      title={user?.name}
    >
      {user?.avatar ? (
        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-semibold text-[var(--accent)]">
          {getInitials(user?.name)}
        </span>
      )}
    </motion.div>
  )
}
