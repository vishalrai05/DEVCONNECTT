/**
 * InviteToTeamModal — pick a recruiting team + message, invite matched user
 */

import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Send, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import GradientButton from '../GradientButton'

export default function InviteToTeamModal({
  open,
  user,
  teams = [],
  onClose,
  onSubmit,
  loading,
  error,
}) {
  const [teamId, setTeamId] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (open) {
      setTeamId(teams[0]?._id ? String(teams[0]._id) : '')
      setMessage('')
    }
  }, [open, teams])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!teamId) return
    onSubmit({ teamId, message })
  }

  const handleClose = () => {
    setMessage('')
    onClose()
  }

  const recruiting = teams.filter((t) => t.status === 'recruiting')

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-app glass p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-modal-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="invite-modal-title" className="font-display text-xl font-bold text-app">
                  Invite {user?.name}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Send a team invite notification. They can open the team page and request to join.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1 text-muted hover:text-app focus-ring"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {recruiting.length === 0 ? (
              <div className="mt-5 space-y-4">
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
                  You need a recruiting team to send invites. Create or open recruitment on one of
                  your teams first.
                </p>
                <GradientButton to="/my-teams" fullWidth variant="secondary">
                  Go to My Teams
                </GradientButton>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="invite-team" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                    Your recruiting team
                  </label>
                  <select
                    id="invite-team"
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full rounded-xl border border-app bg-[var(--surface)] px-3 py-2.5 text-sm text-app focus-ring"
                    required
                  >
                    {recruiting.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                        {t.hackathon?.title ? ` · ${t.hackathon.title}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="invite-message" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                    Message (optional)
                  </label>
                  <textarea
                    id="invite-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="We need a strong backend teammate for our AI hackathon project…"
                    className="w-full resize-none rounded-2xl border border-app bg-[var(--surface)] px-4 py-3 text-sm text-app placeholder:text-muted/70 focus-ring"
                  />
                  <p className="text-right text-xs text-muted">{message.length}/500</p>
                </div>

                {error ? (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {error}
                  </p>
                ) : null}

                <GradientButton type="submit" fullWidth disabled={loading || !teamId}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Send invite
                    </>
                  )}
                </GradientButton>
              </form>
            )}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
