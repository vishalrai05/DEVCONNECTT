/**
 * HackathonTeams — recruitment board for one hackathon
 *
 * Route: /hackathons/:hackathonId/teams
 *
 * Loads GET /api/team-posts?hackathon=:id with search/filters.
 * Each RecruitmentCard represents an active TeamPost + populated Team.
 */

import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import GradientButton from '../components/GradientButton'
import TeamFilters from '../components/team/TeamFilters'
import TeamStats from '../components/team/TeamStats'
import RecruitmentCard from '../components/team/RecruitmentCard'
import JoinRequestModal from '../components/team/JoinRequestModal'
import { getHackathonById } from '../api/hackathon'
import { getTeamPosts, sendJoinRequest, getErrorMessage } from '../api/team'
import { useNotifications } from '../context/NotificationContext'
import { emptyTeamFilters } from '../utils/teams'

export default function HackathonTeams() {
  const { hackathonId } = useParams()
  const { refresh: refreshNotifications } = useNotifications()

  const [hackathon, setHackathon] = useState(null)
  const [posts, setPosts] = useState([])
  const [filters, setFilters] = useState(emptyTeamFilters())
  const [searchDebounced, setSearchDebounced] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [joinTeam, setJoinTeam] = useState(null)
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchDebounced }))
    }, 350)
    return () => clearTimeout(t)
  }, [searchDebounced])

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        hackathon: hackathonId,
        search: filters.search || undefined,
        role: filters.role || undefined,
        experience: filters.experience || undefined,
        status: filters.status || undefined,
      }
      const data = await getTeamPosts(params)
      setPosts(data.posts || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [hackathonId, filters])

  useEffect(() => {
    getHackathonById(hackathonId)
      .then((d) => setHackathon(d.hackathon))
      .catch(() => {})
  }, [hackathonId])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  const stats = {
    recruiting: posts.filter((p) => p.team?.status === 'recruiting').length,
    posts: posts.length,
    teams: new Set(posts.map((p) => p.team?._id)).size,
  }

  const handleJoinSubmit = async (message) => {
    if (!joinTeam) return
    setJoinLoading(true)
    setJoinError('')
    try {
      await sendJoinRequest(joinTeam._id, message)
      await refreshNotifications()
      setJoinTeam(null)
    } catch (err) {
      setJoinError(getErrorMessage(err))
    } finally {
      setJoinLoading(false)
    }
  }

  return (
    <AppShell
      title={hackathon ? `Teams · ${hackathon.title}` : 'Recruitment board'}
      description="Browse squads recruiting for this hackathon — or start your own."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/hackathons/${hackathonId}`}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-app"
        >
          <ArrowLeft className="h-4 w-4" /> Back to hackathon
        </Link>
        <GradientButton
          to={`/hackathons/${hackathonId}/teams/create`}
          className="!text-sm"
          icon={Plus}
        >
          Create team
        </GradientButton>
      </div>

      <TeamStats stats={stats} loading={loading} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <TeamFilters
          filters={filters}
          onChange={setFilters}
          onSearchChange={setSearchDebounced}
        />

        <div>
          {error ? (
            <p className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-3xl bg-[var(--border)]" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-3xl border border-dashed border-app glass p-10 text-center"
            >
              <p className="font-display text-xl font-semibold text-app">No teams recruiting yet</p>
              <p className="mt-2 text-sm text-muted">Be the first to create a squad for this event.</p>
              <div className="mt-6 flex justify-center">
                <GradientButton to={`/hackathons/${hackathonId}/teams/create`} icon={Plus}>
                  Create team
                </GradientButton>
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {posts.map((post) => (
                <RecruitmentCard
                  key={post._id}
                  post={post}
                  onJoin={(team) => {
                    setJoinError('')
                    setJoinTeam(team)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <JoinRequestModal
        open={Boolean(joinTeam)}
        team={joinTeam}
        onClose={() => setJoinTeam(null)}
        onSubmit={handleJoinSubmit}
        loading={joinLoading}
        error={joinError}
      />
    </AppShell>
  )
}
