/**
 * TeamStats — summary row for recruitment board (open teams, posts, etc.)
 */

import { motion } from 'framer-motion'
import { UserPlus, Users, Zap } from 'lucide-react'

export default function TeamStats({ stats, loading }) {
  const items = [
    { key: 'recruiting', label: 'Recruiting', icon: UserPlus },
    { key: 'posts', label: 'Active posts', icon: Zap },
    { key: 'teams', label: 'Total teams', icon: Users },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item, i) => {
        const Icon = item.icon
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-app glass p-4"
          >
            <Icon className="h-4 w-4 text-[var(--accent)]" />
            <p className="mt-2 text-xs text-muted">{item.label}</p>
            {loading ? (
              <div className="mt-1 h-7 w-10 animate-pulse rounded bg-[var(--border)]" />
            ) : (
              <p className="font-display text-2xl font-bold text-app">{stats?.[item.key] ?? 0}</p>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
