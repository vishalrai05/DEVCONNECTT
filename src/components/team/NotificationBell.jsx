/**
 * NotificationBell — header dropdown for team/request notifications
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import { cn } from '../../utils/cn'
import { timeAgo } from '../../utils/teams'

const TYPE_LABELS = {
  join_request: 'New join request',
  request_accepted: 'Request accepted',
  request_rejected: 'Request rejected',
  team_full: 'Team full',
  recruitment_reopened: 'Recruitment reopened',
  team_invite: 'Team invite',
  team_message: 'Team message',
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl border border-app p-2 text-muted transition-colors hover:text-app focus-ring"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-app glass shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-app px-4 py-3">
                <p className="text-sm font-semibold text-app">Notifications</p>
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => markAllRead()}
                    className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                  </button>
                ) : null}
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <li className="px-4 py-8 text-center text-sm text-muted">No notifications yet.</li>
                ) : (
                  notifications.map((n) => (
                    <li key={n._id}>
                      <Link
                        to={n.relatedTeam ? `/teams/${n.relatedTeam}` : '/my-teams'}
                        onClick={() => {
                          if (!n.read) markRead(n._id)
                          setOpen(false)
                        }}
                        className={cn(
                          'block border-b border-app px-4 py-3 text-sm transition-colors hover:bg-[var(--surface)]',
                          !n.read && 'bg-[var(--primary)]/5',
                        )}
                      >
                        <p className="text-xs font-medium text-[var(--accent)]">
                          {TYPE_LABELS[n.type] || n.type}
                        </p>
                        <p className="mt-0.5 text-app">{n.message}</p>
                        <p className="mt-1 text-xs text-muted">{timeAgo(n.createdAt)}</p>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
