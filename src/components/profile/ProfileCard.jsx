/**
 * ProfileCard — reusable glassmorphism summary of a developer
 *
 * Used on Dashboard (own profile) and can wrap public Profile hero content.
 * Framer Motion handles entrance so pages feel alive without clutter.
 */

import { motion } from 'framer-motion'
import { Briefcase, GraduationCap } from 'lucide-react'
import AvailabilityBadge from './AvailabilityBadge'
import SkillChip from './SkillChip'
import SocialLinks from './SocialLinks'
import { getInitials } from '../../utils/profile'
import { cn } from '../../utils/cn'

export default function ProfileCard({
  profile,
  actions = null,
  showEmail = false,
  className = '',
}) {
  if (!profile) return null

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'overflow-hidden rounded-3xl border border-app glass p-6 shadow-xl shadow-black/5 sm:p-8',
        className,
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <motion.div
          whileHover={{ scale: 1.04 }}
          className="mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-[var(--primary)]/40 bg-[var(--surface)] sm:mx-0"
        >
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-3xl font-bold text-[var(--accent)]">
              {getInitials(profile.name)}
            </span>
          )}
        </motion.div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-app sm:text-3xl">
                {profile.name}
              </h1>
              {showEmail && profile.email ? (
                <p className="mt-1 text-sm text-muted">{profile.email}</p>
              ) : null}
              <p className="mt-1 text-sm font-medium text-[var(--accent)]">
                {profile.preferredRole || 'Role not set'}
                {profile.experienceLevel ? ` · ${profile.experienceLevel}` : ''}
              </p>
            </div>
            <AvailabilityBadge availability={profile.availability} className="self-center sm:self-start" />
          </div>

          {profile.bio ? (
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{profile.bio}</p>
          ) : (
            <p className="mt-4 text-sm italic text-muted">No bio yet.</p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-muted sm:justify-start">
            {(profile.college || profile.branch || profile.year) && (
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-[var(--accent)]" />
                {[profile.college, profile.branch, profile.year].filter(Boolean).join(' · ')}
              </span>
            )}
            {profile.preferredRole ? (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-[var(--accent)]" />
                {profile.preferredRole}
              </span>
            ) : null}
          </div>

          {actions ? <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">{actions}</div> : null}
        </div>
      </div>

      <div className="mt-8 border-t border-app pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Skills</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.skills?.length ? (
            profile.skills.map((skill) => <SkillChip key={skill} skill={skill} />)
          ) : (
            <p className="text-sm text-muted">No skills added yet.</p>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-app pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Links</h2>
        <SocialLinks profile={profile} className="mt-3" />
      </div>
    </motion.article>
  )
}
