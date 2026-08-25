/**
 * Public Profile — GET /api/users/:id
 *
 * Route: /profile/:id
 * Anyone can view this page (no ProtectedRoute). Email/password are never
 * returned by the public API. Glass cards + motion chips match the DevConnect look.
 */

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Pencil } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import GradientButton from '../components/GradientButton'
import ProfileCard from '../components/profile/ProfileCard'
import AvailabilityBadge from '../components/profile/AvailabilityBadge'
import SkillChip from '../components/profile/SkillChip'
import SocialLinks from '../components/profile/SocialLinks'
import { getPublicProfile, getErrorMessage } from '../api/user'
import { useAuth } from '../context/AuthContext'
import { getInitials } from '../utils/profile'

export default function Profile() {
  const { id } = useParams()
  const { user: me } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isOwner = me?._id && id && String(me._id) === String(id)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getPublicProfile(id)
        if (!cancelled) setProfile(data.user)
      } catch (err) {
        if (!cancelled) {
          setProfile(null)
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

  return (
    <div className="min-h-svh bg-app">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 50% -10%, color-mix(in srgb, var(--primary) 20%, transparent), transparent)',
        }}
      />

      <header className="border-b border-app glass">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {me ? (
              <GradientButton to="/dashboard" variant="ghost" className="!px-3 !py-2 !text-sm">
                Dashboard
              </GradientButton>
            ) : (
              <GradientButton to="/login" className="!px-3 !py-2 !text-sm">
                Log in
              </GradientButton>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          to={me ? '/dashboard' : '/'}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-app focus-ring rounded-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center">
            <p className="font-display text-xl font-semibold text-app">Profile unavailable</p>
            <p className="mt-2 text-sm text-red-400">{error}</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <ProfileCard
              profile={profile}
              actions={
                isOwner ? (
                  <GradientButton to="/profile/edit" className="!px-4 !py-2.5 !text-sm" icon={Pencil}>
                    Edit profile
                  </GradientButton>
                ) : null
              }
            />

            <div className="space-y-6">
              <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl border border-app glass p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl border border-[var(--primary)]/30 bg-[var(--surface)]">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-display text-xl font-bold text-[var(--accent)]">
                        {getInitials(profile.name)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-app">{profile.name}</p>
                    <p className="text-sm text-[var(--accent)]">
                      {profile.preferredRole || 'Developer'}
                    </p>
                  </div>
                </div>

                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Experience</dt>
                    <dd className="font-medium text-app">{profile.experienceLevel || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Availability</dt>
                    <dd>
                      <AvailabilityBadge availability={profile.availability} />
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">College</dt>
                    <dd className="text-right font-medium text-app">{profile.college || '—'}</dd>
                  </div>
                </dl>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="rounded-3xl border border-app glass p-6"
              >
                <h2 className="font-display text-lg font-semibold text-app">Skills</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.skills?.length ? (
                    profile.skills.map((skill, index) => (
                      <motion.span
                        key={skill}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * index }}
                      >
                        <SkillChip skill={skill} animated={false} />
                      </motion.span>
                    ))
                  ) : (
                    <p className="text-sm text-muted">No skills listed.</p>
                  )}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="rounded-3xl border border-app glass p-6"
              >
                <h2 className="font-display text-lg font-semibold text-app">Connect</h2>
                <SocialLinks profile={profile} className="mt-3" />
              </motion.section>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
