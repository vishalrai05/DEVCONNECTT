/**
 * JoinRequestCard — pending applicant review for team leaders
 *
 * Shows applicant profile snapshot, message, and accept/reject/view profile actions.
 */

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, ExternalLink, X } from 'lucide-react'
import MemberAvatar from './MemberAvatar'
import SkillChip from '../profile/SkillChip'
import RoleBadge from './RoleBadge'
import AvailabilityBadge from '../profile/AvailabilityBadge'
import GradientButton from '../GradientButton'
import { timeAgo } from '../../utils/teams'

export default function JoinRequestCard({
  request,
  onAccept,
  onReject,
  loading = false,
}) {
  const applicant = request.applicant
  if (!applicant) return null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-app glass p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <MemberAvatar user={applicant} size="lg" />
          <div>
            <p className="font-display font-semibold text-app">{applicant.name}</p>
            <p className="text-xs text-muted">{timeAgo(request.createdAt)}</p>
            {applicant.preferredRole ? (
              <div className="mt-1">
                <RoleBadge role={applicant.preferredRole} />
              </div>
            ) : null}
            {applicant.experienceLevel ? (
              <p className="mt-1 text-xs text-muted">{applicant.experienceLevel}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-1">
              {(applicant.skills || []).slice(0, 5).map((s) => (
                <SkillChip key={s} skill={s} animated={false} />
              ))}
            </div>
            <div className="mt-2">
              <AvailabilityBadge availability={applicant.availability} />
            </div>
          </div>
        </div>

        <Link
          to={`/profile/${applicant._id}`}
          className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
        >
          View profile <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {request.message ? (
        <blockquote className="mt-4 rounded-2xl border border-app bg-[var(--surface)] px-4 py-3 text-sm italic text-muted">
          &ldquo;{request.message}&rdquo;
        </blockquote>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <GradientButton
          type="button"
          className="!px-4 !py-2 !text-sm"
          disabled={loading}
          onClick={() => onAccept(request._id)}
        >
          <Check className="h-4 w-4" /> Accept
        </GradientButton>
        <GradientButton
          type="button"
          variant="ghost"
          className="!px-4 !py-2 !text-sm"
          disabled={loading}
          onClick={() => onReject(request._id)}
        >
          <X className="h-4 w-4" /> Reject
        </GradientButton>
      </div>
    </motion.div>
  )
}
