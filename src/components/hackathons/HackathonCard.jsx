/**
 * HackathonCard — discovery grid card
 *
 * Shows image, title, organizer, mode, prize, team size, deadline countdown,
 * bookmark, and link to details. Hover lift comes from Framer Motion.
 */

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Users, Trophy } from 'lucide-react'
import BookmarkButton from './BookmarkButton'
import CountdownTimer from './CountdownTimer'
import DifficultyBadge from './DifficultyBadge'
import { formatPrize, formatTeamSize } from '../../utils/hackathons'
import { cn } from '../../utils/cn'

export default function HackathonCard({
  hackathon,
  featured = false,
  onBookmarkChange,
}) {
  if (!hackathon) return null

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.28 }}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-3xl border border-app bg-[var(--surface)] shadow-lg shadow-black/5',
        featured &&
          'border-[var(--primary)]/40 bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[color-mix(in_srgb,var(--primary)_12%,transparent)]',
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[var(--border)]">
        {hackathon.image ? (
          <img
            src={hackathon.image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center font-display text-lg font-semibold text-muted"
            style={{
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--primary) 25%, transparent), transparent)',
            }}
          >
            {hackathon.title}
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 bg-black/45 px-2.5 py-0.5 text-[11px] font-medium capitalize text-white backdrop-blur">
            {hackathon.mode}
          </span>
          {hackathon.isFeatured ? (
            <span className="rounded-full border border-amber-400/40 bg-amber-500/80 px-2.5 py-0.5 text-[11px] font-semibold text-white">
              Featured
            </span>
          ) : null}
        </div>

        <div className="absolute right-3 top-3">
          <BookmarkButton
            hackathonId={hackathon._id}
            initialBookmarked={hackathon.isBookmarked}
            onChange={onBookmarkChange}
            size="sm"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold leading-snug text-app line-clamp-2">
              {hackathon.title}
            </h3>
            <p className="mt-1 text-sm text-muted">{hackathon.organizer}</p>
          </div>
          <DifficultyBadge difficulty={hackathon.difficulty} />
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5 text-[var(--accent)]" />
            {formatPrize(hackathon.prizePool)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-[var(--accent)]" />
            {formatTeamSize(hackathon.teamSizeMin, hackathon.teamSizeMax)}
          </span>
          {hackathon.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" />
              {hackathon.location}
            </span>
          ) : null}
        </div>

        <div className="mt-4">
          <CountdownTimer deadline={hackathon.registrationDeadline} compact />
        </div>

        <div className="mt-auto pt-4">
          <Link
            to={`/hackathons/${hackathon._id}`}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-ring"
          >
            View details
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
