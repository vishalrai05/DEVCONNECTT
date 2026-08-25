/**
 * TeamMemberCard — member row on Team Details with leader actions
 */

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Crown, Trash2 } from 'lucide-react'
import MemberAvatar from './MemberAvatar'
import SkillChip from '../profile/SkillChip'
import AvailabilityBadge from '../profile/AvailabilityBadge'
import RoleBadge from './RoleBadge'

export default function TeamMemberCard({
  member,
  isLeader: isTeamLeader,
  isMemberLeader,
  canRemove,
  onRemove,
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-3 rounded-2xl border border-app bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <MemberAvatar user={member} size="lg" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/profile/${member._id}`}
              className="font-display font-semibold text-app hover:text-[var(--primary)]"
            >
              {member.name}
            </Link>
            {isMemberLeader ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                <Crown className="h-3 w-3" /> Leader
              </span>
            ) : null}
          </div>
          {member.preferredRole ? (
            <div className="mt-1">
              <RoleBadge role={member.preferredRole} />
            </div>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1">
            {(member.skills || []).slice(0, 4).map((s) => (
              <SkillChip key={s} skill={s} animated={false} />
            ))}
          </div>
          <div className="mt-2">
            <AvailabilityBadge availability={member.availability} />
          </div>
        </div>
      </div>

      {canRemove && isTeamLeader && !isMemberLeader && onRemove ? (
        <button
          type="button"
          onClick={() => onRemove(member._id)}
          className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 focus-ring"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      ) : null}
    </motion.div>
  )
}
