/**
 * MatchCard — ranked teammate recommendation
 */

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserRound, Send } from 'lucide-react'
import MemberAvatar from '../team/MemberAvatar'
import RoleBadge from '../team/RoleBadge'
import SkillChip from '../profile/SkillChip'
import AvailabilityBadge from '../profile/AvailabilityBadge'
import GradientButton from '../GradientButton'
import { matchScoreClass, matchScoreRing } from '../../utils/matching'
import { cn } from '../../utils/cn'

export default function MatchCard({ recommendation, onInvite, index = 0 }) {
  const { user, matchScore, matchedSkills, complementarySkills, reason } = recommendation
  if (!user) return null

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(37,99,235,0.12)' }}
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-app glass"
    >
      <div className="flex items-start justify-between gap-3 border-b border-app bg-gradient-to-r from-[var(--primary)]/10 to-transparent px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <MemberAvatar user={user} size="lg" index={index} />
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-bold text-app">{user.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {user.preferredRole ? <RoleBadge role={user.preferredRole} /> : null}
              {user.experienceLevel ? (
                <span className="text-xs text-muted">{user.experienceLevel}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div
          className={cn(
            'shrink-0 rounded-2xl border px-3 py-2 text-center',
            matchScoreRing(matchScore),
          )}
          title="Compatibility score"
        >
          <p className={cn('font-display text-2xl font-bold tabular-nums', matchScoreClass(matchScore))}>
            {matchScore}%
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Match</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {user.availability ? (
          <div className="mb-3">
            <AvailabilityBadge availability={user.availability} />
          </div>
        ) : null}

        {reason ? (
          <p className="text-sm leading-relaxed text-muted">
            <span className="font-medium text-app">Why: </span>
            {reason}
          </p>
        ) : null}

        {matchedSkills?.length ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Matched skills</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {matchedSkills.map((s) => (
                <SkillChip
                  key={`m-${s}`}
                  skill={s}
                  animated={false}
                  className="!border-emerald-500/30 !bg-emerald-500/10 !text-emerald-600 dark:!text-emerald-400"
                />
              ))}
            </div>
          </div>
        ) : null}

        {complementarySkills?.length ? (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Complementary skills
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {complementarySkills.map((s) => (
                <SkillChip
                  key={`c-${s}`}
                  skill={s}
                  animated={false}
                  className="!border-[var(--accent)]/30 !bg-[var(--accent)]/10 !text-[var(--accent)]"
                />
              ))}
            </div>
          </div>
        ) : null}

        {user.skills?.length && !matchedSkills?.length && !complementarySkills?.length ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Skills</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {user.skills.slice(0, 6).map((s) => (
                <SkillChip key={s} skill={s} animated={false} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex gap-2 pt-5">
          <GradientButton
            to={`/profile/${user._id}`}
            variant="ghost"
            fullWidth
            className="!text-sm"
            icon={UserRound}
          >
            View profile
          </GradientButton>
          <GradientButton
            type="button"
            fullWidth
            className="!text-sm"
            icon={Send}
            onClick={() => onInvite?.(user)}
          >
            Invite
          </GradientButton>
        </div>

        {/* Keep Link discoverable for crawlers / no-JS fallbacks */}
        <Link to={`/profile/${user._id}`} className="sr-only">
          View {user.name}&apos;s profile
        </Link>
      </div>
    </motion.article>
  )
}
