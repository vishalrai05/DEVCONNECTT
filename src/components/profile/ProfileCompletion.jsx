/**
 * ProfileCompletion — percent bar + missing sections list
 *
 * Why compute on the client?
 * The same calculator powers Dashboard and Edit Profile without waiting for
 * a dedicated API. The backend still stores `profileCompleted` for matching.
 */

import { motion } from 'framer-motion'
import { getProfileCompletion } from '../../utils/profile'

export default function ProfileCompletion({ profile, className = '' }) {
  const { percent, filled, total, missing } = getProfileCompletion(profile)

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">Profile completion</p>
          <p className="font-display text-2xl font-bold text-app">{percent}% Complete</p>
        </div>
        <span className="rounded-full border border-app px-2.5 py-1 text-xs text-muted">
          {filled}/{total} fields
        </span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--border)]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {missing.length ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Missing sections
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {missing.map((label) => (
              <li
                key={label}
                className="rounded-lg border border-dashed border-app px-2 py-1 text-xs text-muted"
              >
                {label}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-emerald-500">Your profile is ready for teammate matching.</p>
      )}
    </div>
  )
}
