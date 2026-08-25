/**
 * JoinRequestModal — message input before sending a join request
 *
 * Why a modal?
 * Leaders read the applicant message when reviewing. Capturing intent here
 * improves acceptance rates vs anonymous one-click joins.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Send, X } from 'lucide-react'
import { useState } from 'react'
import GradientButton from '../GradientButton'

export default function JoinRequestModal({ open, team, onClose, onSubmit, loading, error }) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(message)
  }

  const handleClose = () => {
    setMessage('')
    onClose()
  }

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
            aria-labelledby="join-modal-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="join-modal-title" className="font-display text-xl font-bold text-app">
                  Join {team?.name}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Tell the leader why you&apos;d be a great fit.
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

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Hi! I'm a React dev with hackathon experience…"
                className="w-full resize-none rounded-2xl border border-app bg-[var(--surface)] px-4 py-3 text-sm text-app placeholder:text-muted/70 focus-ring"
              />
              <p className="text-right text-xs text-muted">{message.length}/500</p>

              {error ? (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {error}
                </p>
              ) : null}

              <GradientButton type="submit" fullWidth disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send request
                  </>
                )}
              </GradientButton>
            </form>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
