/**
 * HackathonStats — aggregate counters for the listing header
 *
 * Data comes from GET /api/hackathons/stats (total, open, featured, …).
 * Skeletons show while the request is in flight.
 */

import { motion } from 'framer-motion'
import { CalendarDays, Flame, Globe2, Sparkles, Timer } from 'lucide-react'

const ITEMS = [
  { key: 'total', label: 'Total events', icon: CalendarDays },
  { key: 'open', label: 'Open now', icon: Sparkles },
  { key: 'closingSoon', label: 'Closing soon', icon: Timer },
  { key: 'featured', label: 'Featured', icon: Flame },
  { key: 'online', label: 'Online', icon: Globe2 },
]

export default function HackathonStats({ stats, loading }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {ITEMS.map((item, index) => {
        const Icon = item.icon
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border border-app glass p-4"
          >
            <div className="flex items-center gap-2 text-muted">
              <Icon className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
            {loading ? (
              <div className="mt-2 h-7 w-12 animate-pulse rounded-lg bg-[var(--border)]" />
            ) : (
              <p className="mt-1 font-display text-2xl font-bold text-app">
                {stats?.[item.key] ?? 0}
              </p>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
