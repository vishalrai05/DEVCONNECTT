/**
 * FindTeammates — Phase 6 AI teammate matching UI
 *
 * Flow: load ranked recommendations → filter → view profile / invite to team
 * Scoring is computed on the backend (deterministic weighted engine).
 */

import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UsersRound, Sparkles } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import GradientButton from '../components/GradientButton'
import MatchFilters from '../components/matching/MatchFilters'
import MatchCard from '../components/matching/MatchCard'
import InviteToTeamModal from '../components/matching/InviteToTeamModal'
import { getRecommendations, inviteToTeam, getErrorMessage } from '../api/matching'
import { getMyTeams } from '../api/team'
import { useProfile } from '../context/ProfileContext'
import { useNotifications } from '../context/NotificationContext'
import { emptyMatchFilters } from '../utils/matching'

export default function FindTeammates() {
  const { profile } = useProfile()
  const { refresh: refreshNotifications } = useNotifications()
  const [searchParams] = useSearchParams()
  const initialSkills = searchParams.get('skills') || ''

  const [filters, setFilters] = useState(() => ({ ...emptyMatchFilters(), skills: initialSkills }))
  const [skillsDebounced, setSkillsDebounced] = useState(initialSkills)
  const [recommendations, setRecommendations] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, hasMore: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)

  const [myTeams, setMyTeams] = useState([])
  const [inviteUser, setInviteUser] = useState(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, skills: skillsDebounced }))
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [skillsDebounced])

  useEffect(() => {
    getMyTeams()
      .then((data) => {
        // Only teams the user leads can send invites
        setMyTeams(data.led || [])
      })
      .catch(() => setMyTeams([]))
  }, [])

  const loadRecommendations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page,
        limit: 12,
        role: filters.role || undefined,
        skills: filters.skills?.trim() || undefined,
        interest: filters.interest || undefined,
        availability: filters.availability || undefined,
      }
      const data = await getRecommendations(params)
      setRecommendations(data.recommendations || [])
      setPagination(data.pagination || { page: 1, total: 0, hasMore: false })
    } catch (err) {
      setError(getErrorMessage(err))
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  useEffect(() => {
    loadRecommendations()
  }, [loadRecommendations])

  const handleFilterChange = (next) => {
    setFilters(next)
    setPage(1)
  }

  const handleInviteSubmit = async ({ teamId, message }) => {
    if (!inviteUser) return
    setInviteLoading(true)
    setInviteError('')
    try {
      const data = await inviteToTeam({
        teamId,
        userId: inviteUser._id,
        message,
      })
      await refreshNotifications()
      setInviteSuccess(data.message || 'Invite sent.')
      setInviteUser(null)
      setTimeout(() => setInviteSuccess(''), 4000)
    } catch (err) {
      setInviteError(getErrorMessage(err))
    } finally {
      setInviteLoading(false)
    }
  }

  const profileReady =
    Boolean(profile?.skills?.length) || Boolean(profile?.preferredRole)

  return (
    <AppShell
      title="Find Teammates"
      description="Ranked recommendations based on skills, roles, interests, availability, and experience."
    >
      {!profileReady ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5"
        >
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Add skills and a preferred role on your profile for better matches.
          </p>
          <GradientButton to="/profile/edit" className="mt-3 !text-sm">
            Complete profile
          </GradientButton>
        </motion.div>
      ) : null}

      {inviteSuccess ? (
        <p className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          {inviteSuccess}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside>
          <MatchFilters
            filters={{ ...filters, skills: skillsDebounced }}
            onChange={handleFilterChange}
            onSkillsChange={setSkillsDebounced}
          />
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm text-muted">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              {loading
                ? 'Scoring candidates…'
                : `${pagination.total || recommendations.length} recommendation${
                    (pagination.total || recommendations.length) === 1 ? '' : 's'
                  }`}
            </p>
          </div>

          {error ? (
            <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl border border-dashed border-app px-6 py-16 text-center">
              <UsersRound className="mb-3 h-10 w-10 text-muted" />
              <h2 className="font-display text-xl font-bold text-app">No matches yet</h2>
              <p className="mt-2 max-w-md text-sm text-muted">
                Try clearing filters, completing your profile, or checking back as more developers
                join DevConnect.
              </p>
              <GradientButton
                type="button"
                variant="ghost"
                className="mt-5 !text-sm"
                onClick={() => {
                  setSkillsDebounced('')
                  setFilters(emptyMatchFilters())
                  setPage(1)
                }}
              >
                Clear filters
              </GradientButton>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                {recommendations.map((rec, i) => (
                  <MatchCard
                    key={rec.user?._id || i}
                    recommendation={rec}
                    index={i}
                    onInvite={setInviteUser}
                  />
                ))}
              </div>

              {(pagination.hasMore || page > 1) && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <GradientButton
                    type="button"
                    variant="ghost"
                    className="!text-sm"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </GradientButton>
                  <span className="text-sm text-muted">
                    Page {pagination.page || page}
                    {pagination.totalPages ? ` of ${pagination.totalPages}` : ''}
                  </span>
                  <GradientButton
                    type="button"
                    variant="ghost"
                    className="!text-sm"
                    disabled={!pagination.hasMore || loading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </GradientButton>
                </div>
              )}
            </>
          )}

          <p className="mt-8 text-center text-xs text-muted">
            Looking for open squads instead?{' '}
            <Link to="/hackathons" className="text-[var(--accent)] hover:underline">
              Browse hackathons
            </Link>{' '}
            and join recruiting teams.
          </p>
        </section>
      </div>

      <InviteToTeamModal
        open={Boolean(inviteUser)}
        user={inviteUser}
        teams={myTeams}
        onClose={() => {
          setInviteUser(null)
          setInviteError('')
        }}
        onSubmit={handleInviteSubmit}
        loading={inviteLoading}
        error={inviteError}
      />
    </AppShell>
  )
}
