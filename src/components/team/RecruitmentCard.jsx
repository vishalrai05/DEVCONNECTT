/**
 * RecruitmentCard — board card from a TeamPost (what applicants browse)
 *
 * Combines post fields (role, experience, posted time) with populated team data.
 */

import { motion } from 'framer-motion'
import { Clock, Users } from 'lucide-react'
import MemberAvatar from './MemberAvatar'
import RoleBadge from './RoleBadge'
import SkillChip from '../profile/SkillChip'
import GradientButton from '../GradientButton'
import { statusBadgeClass, timeAgo } from '../../utils/teams'
import { cn } from '../../utils/cn'

export default function RecruitmentCard({ post, onJoin }) {
  const team = post?.team
  if (!team) return null

  const count = team.members?.length ?? 0
  const recruiting = team.status === 'recruiting'

  return (
    <motion.article
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(37,99,235,0.12)' }}
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-app glass"
    >
      <div className="border-b border-app bg-gradient-to-r from-[var(--primary)]/10 to-transparent px-5 py-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize',
              statusBadgeClass(team.status),
              recruiting && 'animate-pulse',
            )}
          >
            {recruiting ? 'Recruiting' : team.status}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" />
            {timeAgo(post.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-bold text-app">{team.name}</h3>
        <p className="mt-1 text-sm font-medium text-[var(--accent)]">{post.title}</p>
        {post.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted">{post.description}</p>
        ) : null}

        <div className="mt-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            {(team.members || []).slice(0, 3).map((m, i) => (
              <MemberAvatar key={m._id} user={m} size="sm" index={i} />
            ))}
          </div>
          <div className="text-sm text-muted">
            <p>{team.leader?.name}</p>
            <p className="inline-flex items-center gap-1 text-xs">
              <Users className="h-3.5 w-3.5" />
              {count}/{team.maxMembers}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Looking for</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.requiredRole ? <RoleBadge role={post.requiredRole} /> : null}
            {(post.requiredSkills || []).map((s) => (
              <SkillChip key={s} skill={s} animated={false} />
            ))}
          </div>
          {post.experienceLevel ? (
            <p className="mt-2 text-xs text-muted">Experience: {post.experienceLevel}</p>
          ) : null}
        </div>

        <div className="mt-auto flex gap-2 pt-5">
          <GradientButton to={`/teams/${team._id}`} variant="ghost" fullWidth className="!text-sm">
            Details
          </GradientButton>
          {recruiting && onJoin ? (
            <GradientButton type="button" fullWidth className="!text-sm" onClick={() => onJoin(team)}>
              Join team
            </GradientButton>
          ) : null}
        </div>
      </div>
    </motion.article>
  )
}
