/**
 * TeamCard — squad summary for lists (My Teams, search results)
 *
 * Shows avatar group, name, leader, member count, status badge, roles, skills, join CTA.
 */

import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import MemberAvatar from './MemberAvatar'
import RoleBadge from './RoleBadge'
import SkillChip from '../profile/SkillChip'
import GradientButton from '../GradientButton'
import { statusBadgeClass } from '../../utils/teams'
import { cn } from '../../utils/cn'

export default function TeamCard({ team, onJoin, showJoin = true }) {
  if (!team) return null

  const count = team.members?.length ?? team.memberCount ?? 0
  const recruiting = team.status === 'recruiting'

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-app bg-[var(--surface)] shadow-lg shadow-black/5"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex -space-x-2">
            {(team.members || []).slice(0, 4).map((m, i) => (
              <MemberAvatar key={m._id || i} user={m} index={i} className="relative" />
            ))}
            {count > 4 ? (
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--border)] text-xs font-medium text-muted">
                +{count - 4}
              </span>
            ) : null}
          </div>
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
              statusBadgeClass(team.status),
              recruiting && 'animate-pulse',
            )}
          >
            {team.status}
          </span>
        </div>

        <h3 className="mt-4 font-display text-lg font-bold text-app">{team.name}</h3>
        <p className="mt-1 text-sm text-muted">
          Led by {team.leader?.name || 'Unknown'}
        </p>

        <div className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Users className="h-4 w-4 text-[var(--accent)]" />
          <span>
            {count}/{team.maxMembers} members
          </span>
        </div>

        {(team.requiredRoles?.length || team.requiredSkills?.length) ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Looking for
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(team.requiredRoles || []).slice(0, 3).map((r) => (
                <RoleBadge key={r} role={r} />
              ))}
              {(team.requiredSkills || []).slice(0, 4).map((s) => (
                <SkillChip key={s} skill={s} animated={false} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-auto flex gap-2 border-t border-app p-4">
        <GradientButton to={`/teams/${team._id}`} variant="ghost" fullWidth className="!text-sm">
          View team
        </GradientButton>
        {showJoin && recruiting && onJoin ? (
          <GradientButton type="button" fullWidth className="!text-sm" onClick={() => onJoin(team)}>
            Join
          </GradientButton>
        ) : null}
      </div>
    </motion.article>
  )
}
