/**
 * HackathonDetails — /hackathons/:id
 *
 * Hero + description + sticky sidebar with countdown, prize, team size,
 * domains/skills, register CTA, and bookmark.
 */

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  MapPin,
  Trophy,
  Users,
} from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import BookmarkButton from '../components/hackathons/BookmarkButton'
import CountdownTimer from '../components/hackathons/CountdownTimer'
import DifficultyBadge from '../components/hackathons/DifficultyBadge'
import SkillChip from '../components/profile/SkillChip'
import GradientButton from '../components/GradientButton'
import { getHackathonById, getErrorMessage } from '../api/hackathon'
import { formatDate, formatPrize, formatTeamSize } from '../utils/hackathons'

export default function HackathonDetails() {
  const { id } = useParams()
  const [hackathon, setHackathon] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getHackathonById(id)
        if (!cancelled) setHackathon(data.hackathon)
      } catch (err) {
        if (!cancelled) {
          setHackathon(null)
          setError(getErrorMessage(err))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (id) load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
        </div>
      </AppShell>
    )
  }

  if (error || !hackathon) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="font-display text-xl font-semibold text-app">Hackathon not found</p>
          <p className="mt-2 text-sm text-red-400">{error || 'This event may have been removed.'}</p>
          <Link to="/hackathons" className="mt-4 inline-flex text-sm text-[var(--accent)] hover:underline">
            Back to discovery
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Link
        to="/hackathons"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-app focus-ring rounded-lg"
      >
        <ArrowLeft className="h-4 w-4" />
        All hackathons
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_360px]">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-app"
          >
            <div className="relative aspect-[21/9] bg-[var(--border)] sm:aspect-[2.4/1]">
              {hackathon.image ? (
                <img
                  src={hackathon.image}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-muted"
                  style={{
                    background:
                      'linear-gradient(135deg, color-mix(in srgb, var(--primary) 30%, transparent), transparent)',
                  }}
                >
                  {hackathon.title}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium capitalize text-white backdrop-blur">
                    {hackathon.mode}
                  </span>
                  {hackathon.isFeatured ? (
                    <span className="rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-white">
                      Featured
                    </span>
                  ) : null}
                  <DifficultyBadge difficulty={hackathon.difficulty} />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-3xl border border-app glass p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-app sm:text-4xl">
                  {hackathon.title}
                </h1>
                <p className="mt-2 text-muted">Organized by {hackathon.organizer}</p>
              </div>
              <BookmarkButton
                hackathonId={hackathon._id}
                initialBookmarked={hackathon.isBookmarked}
              />
            </div>

            <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-app sm:text-base">
              {hackathon.description}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-app bg-[var(--surface)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Timeline</p>
                <ul className="mt-3 space-y-2 text-sm text-app">
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[var(--accent)]" />
                    Starts {formatDate(hackathon.startDate)}
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[var(--accent)]" />
                    Ends {formatDate(hackathon.endDate)}
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[var(--accent)]" />
                    Register by {formatDate(hackathon.registrationDeadline)}
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-app bg-[var(--surface)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Logistics</p>
                <ul className="mt-3 space-y-2 text-sm text-app">
                  <li className="flex items-center gap-2 capitalize">
                    Mode: {hackathon.mode}
                  </li>
                  {hackathon.location ? (
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[var(--accent)]" />
                      {hackathon.location}
                    </li>
                  ) : null}
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--accent)]" />
                    {formatTeamSize(hackathon.teamSizeMin, hackathon.teamSizeMax)}
                  </li>
                  <li className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-[var(--accent)]" />
                    {formatPrize(hackathon.prizePool)} prize pool
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="font-display text-lg font-semibold text-app">Domains</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(hackathon.domains || []).map((d) => (
                  <SkillChip key={d} skill={d} animated={false} />
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h2 className="font-display text-lg font-semibold text-app">Required skills</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(hackathon.requiredSkills || []).length ? (
                  hackathon.requiredSkills.map((s) => (
                    <SkillChip key={s} skill={s} />
                  ))
                ) : (
                  <p className="text-sm text-muted">No specific skills listed.</p>
                )}
              </div>
            </div>
          </motion.section>
        </div>

        {/* Sticky quick-info sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4 rounded-3xl border border-app glass p-5"
          >
            <CountdownTimer deadline={hackathon.registrationDeadline} />

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Prize pool</dt>
                <dd className="font-semibold text-app">{formatPrize(hackathon.prizePool)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Team size</dt>
                <dd className="font-semibold text-app">
                  {formatTeamSize(hackathon.teamSizeMin, hackathon.teamSizeMax)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Difficulty</dt>
                <dd>
                  <DifficultyBadge difficulty={hackathon.difficulty} />
                </dd>
              </div>
            </dl>

            {hackathon.registrationLink ? (
              <a
                href={hackathon.registrationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-medium text-white hover:opacity-90 focus-ring"
              >
                Register now
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <p className="text-center text-sm text-muted">Registration link coming soon.</p>
            )}

            <GradientButton to="/bookmarks" variant="ghost" fullWidth className="!text-sm">
              View your bookmarks
            </GradientButton>

            <GradientButton
              to={`/hackathons/${id}/teams`}
              fullWidth
              className="!text-sm"
            >
              Browse teams recruiting
            </GradientButton>
          </motion.div>
        </aside>
      </div>
    </AppShell>
  )
}
