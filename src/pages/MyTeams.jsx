/**
 * MyTeams — personal teams dashboard
 *
 * Shows teams I lead, teams I joined, and join request history (pending/accepted/rejected).
 * Data from GET /api/users/teams.
 */

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Users } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import GradientButton from '../components/GradientButton'
import TeamCard from '../components/team/TeamCard'
import { getMyTeams, cancelRequest, getErrorMessage } from '../api/team'
import { formatDate } from '../utils/hackathons'
import { timeAgo } from '../utils/teams'

export default function MyTeams() {
  const [data, setData] = useState({ led: [], joined: [], requests: { pending: [], accepted: [], rejected: [] } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMyTeams()
      setData(res)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCancel = async (requestId) => {
    try {
      await cancelRequest(requestId)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) {
    return (
      <AppShell title="My teams">
        <div className="flex min-h-[40vh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="My teams"
      description="Squads you lead, teams you've joined, and join request status."
    >
      <div className="mb-8 flex flex-wrap justify-end gap-3">
        <GradientButton to="/hackathons" variant="ghost" className="!text-sm">
          Browse hackathons
        </GradientButton>
      </div>

      {error ? (
        <p className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="font-display text-xl font-bold text-app">Teams I created</h2>
        </div>
        {data.led?.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.led.map((t) => (
              <TeamCard key={t._id} team={t} showJoin={false} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-app glass p-8 text-center text-sm text-muted">
            You haven&apos;t created a team yet.{' '}
            <Link to="/hackathons" className="text-[var(--accent)] hover:underline">
              Pick a hackathon
            </Link>{' '}
            and start recruiting.
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-4 font-display text-xl font-bold text-app">Teams I joined</h2>
        {data.joined?.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.joined.map((t) => (
              <TeamCard key={t._id} team={t} showJoin={false} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No joined teams yet — browse recruitment boards to find a squad.</p>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="font-display text-xl font-bold text-app">Join requests</h2>
        </div>

        {data.requests?.pending?.length ? (
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase text-muted">Pending</p>
            <div className="space-y-2">
              {data.requests.pending.map((r) => (
                <motion.div
                  key={r._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-app glass px-4 py-3"
                >
                  <div>
                    <Link
                      to={`/teams/${r.team?._id}`}
                      className="font-medium text-app hover:text-[var(--primary)]"
                    >
                      {r.team?.name}
                    </Link>
                    <p className="text-xs text-muted">
                      {r.team?.hackathon?.title} · {timeAgo(r.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCancel(r._id)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Cancel request
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        ) : null}

        {data.requests?.accepted?.length ? (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase text-emerald-500">Accepted</p>
            <ul className="space-y-1 text-sm text-muted">
              {data.requests.accepted.map((r) => (
                <li key={r._id}>
                  <Link to={`/teams/${r.team?._id}`} className="text-[var(--accent)] hover:underline">
                    {r.team?.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {data.requests?.rejected?.length ? (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-muted">Rejected</p>
            <ul className="space-y-1 text-sm text-muted">
              {data.requests.rejected.map((r) => (
                <li key={r._id}>{r.team?.name}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {!data.requests?.pending?.length &&
        !data.requests?.accepted?.length &&
        !data.requests?.rejected?.length ? (
          <p className="text-sm text-muted">No join requests yet.</p>
        ) : null}
      </section>

      {/* Upcoming hackathons from led/joined teams */}
      {[...(data.led || []), ...(data.joined || [])].some((t) => t.hackathon?.registrationDeadline) ? (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-xl font-bold text-app">Upcoming deadlines</h2>
          <div className="space-y-2">
            {[...(data.led || []), ...(data.joined || [])]
              .filter((t) => t.hackathon?.registrationDeadline)
              .map((t) => (
                <div
                  key={t._id}
                  className="flex justify-between rounded-xl border border-app px-4 py-3 text-sm"
                >
                  <span className="text-app">{t.hackathon?.title}</span>
                  <span className="text-muted">
                    {formatDate(t.hackathon.registrationDeadline)}
                  </span>
                </div>
              ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  )
}
