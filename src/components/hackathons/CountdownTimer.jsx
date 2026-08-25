/**
 * CountdownTimer — live registration deadline countdown
 *
 * How countdown works:
 * 1. getCountdownParts(deadline) computes days/hours/minutes/seconds
 * 2. setInterval every 1s re-reads Date.now() and updates local state
 * 3. When remaining < 48h, `urgent` flips styling to amber/red
 * 4. When deadline passes, we show "Registration closed"
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCountdownParts } from '../../utils/hackathons'
import { cn } from '../../utils/cn'

function Unit({ value, label }) {
  return (
    <div className="min-w-[2.75rem] text-center">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -6, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="block font-display text-lg font-bold tabular-nums text-app sm:text-xl"
        >
          {String(value).padStart(2, '0')}
        </motion.span>
      </AnimatePresence>
      <span className="text-[10px] uppercase tracking-wide text-muted">{label}</span>
    </div>
  )
}

export default function CountdownTimer({ deadline, className = '', compact = false }) {
  const [parts, setParts] = useState(() => getCountdownParts(deadline))

  useEffect(() => {
    setParts(getCountdownParts(deadline))
    const id = setInterval(() => {
      setParts(getCountdownParts(deadline))
    }, 1000)
    return () => clearInterval(id)
  }, [deadline])

  if (!parts) {
    return (
      <p className={cn('text-sm font-medium text-red-400', className)}>
        Registration closed
      </p>
    )
  }

  return (
    <div
      className={cn(
        'rounded-2xl border px-3 py-2',
        parts.urgent
          ? 'border-amber-500/40 bg-amber-500/10'
          : 'border-app bg-[var(--surface)]',
        className,
      )}
    >
      <p
        className={cn(
          'mb-1 text-[11px] font-medium uppercase tracking-wide',
          parts.urgent ? 'text-amber-500' : 'text-muted',
        )}
      >
        {compact ? 'Closes in' : 'Registration closes in'}
      </p>
      <div className="flex items-center gap-2 sm:gap-3">
        <Unit value={parts.days} label="days" />
        <span className="text-muted">:</span>
        <Unit value={parts.hours} label="hrs" />
        {!compact ? (
          <>
            <span className="text-muted">:</span>
            <Unit value={parts.minutes} label="min" />
            <span className="hidden text-muted sm:inline">:</span>
            <div className="hidden sm:block">
              <Unit value={parts.seconds} label="sec" />
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
