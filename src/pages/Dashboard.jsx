/**
 * Dashboard — profile summary + Phase 4 hackathon command center
 *
 * Extra sections:
 * - Bookmarked hackathons (upcoming deadlines)
 * - Recommended events (skills / role / experience)
 * - Featured strip
 *
 * How recommendations work:
 * GET /api/hackathons/recommended scores open events by skill overlap,
 * preferred-role→domain map, and experience↔difficulty alignment.
 */

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarClock, Check, MessageCircle, Pencil, Share2, UserRound, X } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import GradientButton from '../components/GradientButton'
import ProfileCard from '../components/profile/ProfileCard'
import ProfileCompletion from '../components/profile/ProfileCompletion'
import AvailabilityBadge from '../components/profile/AvailabilityBadge'
import SkillChip from '../components/profile/SkillChip'
import SocialLinks from '../components/profile/SocialLinks'
import StatsCard from '../components/StatsCard'
import MemberAvatar from '../components/team/MemberAvatar'
import RoleBadge from '../components/team/RoleBadge'
import { getRecommendations } from '../api/matching'
import { getMyTeams, acceptRequest, rejectRequest, getErrorMessage } from '../api/team'
import { useNotifications } from '../context/NotificationContext'
import HackathonCard from '../components/hackathons/HackathonCard'
import CountdownTimer from '../components/hackathons/CountdownTimer'
import { useProfile } from '../context/ProfileContext'
import { getInitials } from '../utils/profile'
import { formatDate } from '../utils/hackathons'
import { timeAgo } from '../utils/teams'
import {
  getMyBookmarks,
  getRecommendedHackathons,
  getFeaturedHackathons,
} from '../api/hackathon'

function DashboardTeamCard({ team }) {
  return (
    <article className="rounded-2xl border border-app bg-[var(--surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-app">{team.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{team.description || 'No description yet.'}</p>
        </div>
        <span className="shrink-0 rounded-full border border-app px-2 py-1 text-xs capitalize text-muted">{team.status}</span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        <span>{team.members?.length || 0}/{team.maxMembers} members</span>
        <span>·</span>
        <span>{team.hackathon?.title || 'Project team'}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(team.requiredSkills || []).slice(0, 4).map((skill) => <SkillChip key={skill} skill={skill} animated={false} />)}
      </div>
      <Link to={`/teams/${team._id}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline">
        <MessageCircle className="h-4 w-4" /> Open chat
      </Link>
    </article>
  )
}

function DashboardRecommendation({ recommendation }) {
  const user = recommendation.user
  return (
    <article className="rounded-2xl border border-app bg-[var(--surface)] p-4">
      <div className="flex items-start gap-3">
        <MemberAvatar user={user} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-display font-semibold text-app">{user.name}</h3>
            <span className="shrink-0 font-display font-bold text-emerald-500">{recommendation.matchScore}%</span>
          </div>
          {user.preferredRole ? <RoleBadge role={user.preferredRole} /> : null}
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted">{recommendation.reason}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {(user.skills || []).slice(0, 4).map((skill) => <SkillChip key={skill} skill={skill} animated={false} />)}
      </div>
      <div className="mt-4 flex gap-2">
        <Link to={`/profile/${user._id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"><UserRound className="h-4 w-4" /> View profile</Link>
        <Link to="/find-teammates" className="text-sm font-medium text-[var(--primary)] hover:underline">Send request</Link>
      </div>
    </article>
  )
}

function DashboardRequest({ request, incoming, onAction, actionLoading }) {
  const person = incoming ? request.applicant : null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-app bg-[var(--surface)] px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {person ? <MemberAvatar user={person} size="sm" /> : null}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-app">{incoming ? person?.name : request.team?.name}</p>
          <p className="truncate text-xs text-muted">
            {incoming ? `${request.team?.name || 'Your team'} · ${person?.preferredRole || 'Developer'}` : `${request.team?.hackathon?.title || 'Team request'} · ${timeAgo(request.createdAt)}`}
          </p>
        </div>
      </div>
      {incoming ? (
        <div className="flex gap-2">
          <button type="button" onClick={() => onAction(request._id, 'accept')} disabled={actionLoading} className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-500 disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Accept</button>
          <button type="button" onClick={() => onAction(request._id, 'reject')} disabled={actionLoading} className="inline-flex items-center gap-1 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-400 disabled:opacity-50"><X className="h-3.5 w-3.5" /> Reject</button>
        </div>
      ) : <span className="shrink-0 rounded-full border border-amber-500/30 px-2 py-1 text-xs text-amber-500">{request.status || 'pending'}</span>}
    </div>
  )
}

export default function Dashboard() {
  const { profile, loading } = useProfile()
  const { notifications, unreadCount, refresh: refreshNotifications } = useNotifications()
  const [bookmarks, setBookmarks] = useState([])
  const [recommended, setRecommended] = useState([])
  const [featured, setFeatured] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [teamData, setTeamData] = useState({ led: [], joined: [], requests: { pending: [], accepted: [], rejected: [], incoming: [] } })
  const [matchRecommendations, setMatchRecommendations] = useState([])
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')
  const [requestAction, setRequestAction] = useState('')

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true)
    setDashboardError('')
    try {
      const [teamsResult, matchesResult] = await Promise.all([
        getMyTeams(),
        getRecommendations({ limit: 4 }),
      ])
      setTeamData({
        led: teamsResult.led || [],
        joined: teamsResult.joined || [],
        requests: {
          pending: teamsResult.requests?.pending || [],
          accepted: teamsResult.requests?.accepted || [],
          rejected: teamsResult.requests?.rejected || [],
          incoming: teamsResult.requests?.incoming || [],
        },
      })
      setMatchRecommendations(matchesResult.recommendations || [])
    } catch (error) {
      setDashboardError(getErrorMessage(error))
    } finally {
      setDashboardLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleRequestAction = async (requestId, action) => {
    setRequestAction(requestId)
    try {
      if (action === 'accept') await acceptRequest(requestId)
      else await rejectRequest(requestId)
      await Promise.all([loadDashboard(), refreshNotifications()])
    } catch (error) {
      setDashboardError(getErrorMessage(error))
    } finally {
      setRequestAction('')
    }
  }

  useEffect(() => {
    let cancelled = false
    const loadEvents = async () => {
      setEventsLoading(true)
      try {
        const [bm, rec, feat] = await Promise.all([
          getMyBookmarks().catch(() => ({ hackathons: [] })),
          getRecommendedHackathons().catch(() => ({ hackathons: [] })),
          getFeaturedHackathons().catch(() => ({ hackathons: [] })),
        ])
        if (!cancelled) {
          setBookmarks(bm.hackathons || [])
          setRecommended(rec.hackathons || [])
          setFeatured(feat.hackathons || [])
        }
      } finally {
        if (!cancelled) setEventsLoading(false)
      }
    }
    loadEvents()
    return () => {
      cancelled = true
    }
  }, [])

  // Upcoming deadlines from bookmarks (soonest first)
  const upcomingDeadlines = [...bookmarks]
    .filter((h) => new Date(h.registrationDeadline) > new Date())
    .sort(
      (a, b) =>
        new Date(a.registrationDeadline) - new Date(b.registrationDeadline),
    )
    .slice(0, 4)

  const myTeams = [...teamData.led, ...teamData.joined]
  const incomingRequests = teamData.requests.incoming || []
  const outgoingAll = [
    ...(teamData.requests.pending || []),
    ...(teamData.requests.accepted || []),
    ...(teamData.requests.rejected || []),
  ]
  const outgoingRequests = outgoingAll.slice(0, 8)
  const unreadMessages = notifications.filter((notification) => notification.type === 'team_message')

  if (loading && !profile) {
    return (
      <AppShell title="Dashboard" description="Loading your developer profile…">
        <div className="flex min-h-[40vh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      title="Dashboard"
      description="Your teams, requests, recommendations, and activity in one place."
    >
      <section className="mb-8 rounded-3xl border border-app glass p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 overflow-hidden rounded-2xl border border-app bg-[var(--surface)]">
              {profile?.avatar ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center font-display font-bold text-[var(--accent)]">{getInitials(profile?.name)}</span>}
            </div>
            <div>
              <p className="text-sm text-muted">Welcome back</p>
              <h2 className="font-display text-2xl font-bold text-app">{profile?.name || 'Developer'}</h2>
              <p className="mt-1 text-sm text-[var(--accent)]">Ready to find your next teammate?</p>
            </div>
          </div>
          <GradientButton to="/find-teammates" className="!text-sm">Find teammates</GradientButton>
        </div>
      </section>

      {dashboardError ? <p className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{dashboardError}</p> : null}

      <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatsCard label="Active teams" value={dashboardLoading ? '...' : myTeams.length} />
        <StatsCard label="Requests sent" value={dashboardLoading ? '...' : outgoingAll.length} delay={0.04} />
        <StatsCard label="Incoming requests" value={dashboardLoading ? '...' : incomingRequests.length} delay={0.08} />
        <StatsCard label="Recommendations" value={dashboardLoading ? '...' : matchRecommendations.length} delay={0.12} />
        <StatsCard label="Unread messages" value={unreadCount} delay={0.16} />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-app">My teams</h2>
            <Link to="/my-teams" className="text-sm text-[var(--accent)] hover:underline">View all</Link>
          </div>
          {dashboardLoading ? <div className="h-40 animate-pulse rounded-3xl bg-[var(--border)]" /> : myTeams.length ? <div className="grid gap-4 sm:grid-cols-2">{myTeams.slice(0, 4).map((team) => <DashboardTeamCard key={team._id} team={team} />)}</div> : <div className="rounded-3xl border border-dashed border-app glass p-8 text-center text-sm text-muted">You aren&apos;t part of any team yet.<div className="mt-4"><GradientButton to="/find-teammates" className="!text-sm">Find teammates</GradientButton></div></div>}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-app">Recommended teammates</h2>
            <Link to="/find-teammates" className="text-sm text-[var(--accent)] hover:underline">Explore</Link>
          </div>
          {dashboardLoading ? <div className="h-40 animate-pulse rounded-3xl bg-[var(--border)]" /> : matchRecommendations.length ? <div className="space-y-3">{matchRecommendations.slice(0, 3).map((recommendation) => <DashboardRecommendation key={recommendation.user?._id} recommendation={recommendation} />)}</div> : <div className="rounded-3xl border border-dashed border-app glass p-8 text-center text-sm text-muted">Complete your profile to receive better teammate recommendations.</div>}
        </section>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-2xl font-bold text-app">Incoming requests</h2><Link to="/my-teams" className="text-sm text-[var(--accent)] hover:underline">Manage teams</Link></div>
          {incomingRequests.length ? <div className="space-y-3">{incomingRequests.slice(0, 5).map((request) => <DashboardRequest key={request._id} request={request} incoming onAction={handleRequestAction} actionLoading={requestAction === request._id} />)}</div> : <div className="rounded-3xl border border-dashed border-app glass p-6 text-sm text-muted">You&apos;re all caught up. No incoming requests.</div>}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-2xl font-bold text-app">Outgoing requests</h2><Link to="/my-teams" className="text-sm text-[var(--accent)] hover:underline">View history</Link></div>
          {outgoingRequests.length ? <div className="space-y-3">{outgoingRequests.slice(0, 5).map((request) => <DashboardRequest key={request._id} request={request} />)}</div> : <div className="rounded-3xl border border-dashed border-app glass p-6 text-sm text-muted">You haven&apos;t sent any team requests yet.</div>}
        </section>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-display text-2xl font-bold text-app">Recent activity</h2>
          {notifications.length ? <div className="space-y-2">{notifications.slice(0, 5).map((notification) => <Link key={notification._id} to={notification.relatedTeam ? `/teams/${notification.relatedTeam}` : '/my-teams'} className="block rounded-2xl border border-app glass px-4 py-3 transition-colors hover:border-[var(--primary)]"><p className="text-sm text-app">{notification.message}</p><p className="mt-1 text-xs text-muted">{timeAgo(notification.createdAt)}</p></Link>)}</div> : <div className="rounded-3xl border border-dashed border-app glass p-6 text-sm text-muted">No recent activity yet.</div>}
        </section>
        <section>
          <h2 className="mb-4 font-display text-2xl font-bold text-app">Unread messages</h2>
          {unreadMessages.length ? <div className="space-y-2">{unreadMessages.slice(0, 5).map((notification) => <Link key={notification._id} to={`/teams/${notification.relatedTeam}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 px-4 py-3"><span className="text-sm text-app">{notification.message}</span><span className="shrink-0 rounded-full bg-[var(--primary)] px-2 py-1 text-xs text-white">New</span></Link>)}</div> : <div className="rounded-3xl border border-dashed border-app glass p-6 text-sm text-muted">No unread team messages.</div>}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ProfileCard
          profile={profile}
          showEmail
          actions={
            <>
              <GradientButton to="/profile/edit" className="!px-4 !py-2.5 !text-sm" icon={Pencil}>
                Edit profile
              </GradientButton>
              {profile?._id ? (
                <GradientButton
                  to={`/profile/${profile._id}`}
                  variant="ghost"
                  className="!px-4 !py-2.5 !text-sm"
                  icon={Share2}
                >
                  Public profile
                </GradientButton>
              ) : null}
            </>
          }
        />

        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-3xl border border-app glass p-6"
          >
            <ProfileCompletion profile={profile} />
            {!profile?.profileCompleted ? (
              <div className="mt-4">
                <GradientButton to="/profile/edit" fullWidth className="!text-sm">
                  Complete your profile
                </GradientButton>
              </div>
            ) : null}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="rounded-3xl border border-app glass p-6"
          >
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 overflow-hidden rounded-2xl border border-app bg-[var(--surface)]">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-display font-bold text-[var(--accent)]">
                    {getInitials(profile?.name)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-semibold text-app">
                  {profile?.name}
                </p>
                <p className="truncate text-sm text-[var(--accent)]">
                  {profile?.preferredRole || 'Set your preferred role'}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <AvailabilityBadge availability={profile?.availability} />
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Top skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile?.skills?.length ? (
                  profile.skills.slice(0, 6).map((skill) => (
                    <SkillChip key={skill} skill={skill} animated={false} />
                  ))
                ) : (
                  <p className="text-sm text-muted">
                    Add skills on{' '}
                    <Link to="/profile/edit" className="text-[var(--accent)] hover:underline">
                      Edit profile
                    </Link>
                    .
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Social</p>
              <SocialLinks profile={profile} className="mt-2" size="sm" />
            </div>
          </motion.section>
        </div>
      </div>

      {/* Phase 4 — registration deadlines from bookmarks */}
      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
              Deadlines
            </p>
            <h2 className="font-display text-2xl font-bold text-app">Upcoming registrations</h2>
          </div>
          <Link to="/bookmarks" className="text-sm text-[var(--accent)] hover:underline">
            All bookmarks
          </Link>
        </div>

        {eventsLoading ? (
          <div className="h-24 animate-pulse rounded-3xl bg-[var(--border)]" />
        ) : upcomingDeadlines.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingDeadlines.map((h) => (
              <div
                key={h._id}
                className="rounded-3xl border border-app glass p-4"
              >
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/hackathons/${h._id}`}
                      className="font-display font-semibold text-app hover:text-[var(--primary)]"
                    >
                      {h.title}
                    </Link>
                    <p className="text-xs text-muted">
                      Deadline {formatDate(h.registrationDeadline)}
                    </p>
                    <div className="mt-3">
                      <CountdownTimer deadline={h.registrationDeadline} compact />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-app glass p-6 text-sm text-muted">
            Bookmark hackathons to track their registration deadlines here.{' '}
            <Link to="/hackathons" className="text-[var(--accent)] hover:underline">
              Discover events
            </Link>
          </div>
        )}
      </section>

      {/* Recommended */}
      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
              For you
            </p>
            <h2 className="font-display text-2xl font-bold text-app">Recommended hackathons</h2>
          </div>
          <Link to="/hackathons" className="text-sm text-[var(--accent)] hover:underline">
            Browse all
          </Link>
        </div>
        {eventsLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-3xl bg-[var(--border)]" />
            ))}
          </div>
        ) : recommended.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recommended.slice(0, 3).map((h) => (
              <HackathonCard key={h._id} hackathon={h} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            Add skills and a preferred role to unlock better recommendations.
          </p>
        )}
      </section>

      {/* Featured */}
      {featured.length ? (
        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
              Spotlight
            </p>
            <h2 className="font-display text-2xl font-bold text-app">Featured events</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {featured.slice(0, 3).map((h) => (
              <HackathonCard key={h._id} hackathon={h} featured />
            ))}
          </div>
        </section>
      ) : null}

      {/* Bookmarked grid preview */}
      {bookmarks.length ? (
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold text-app">Your bookmarks</h2>
            <Link to="/bookmarks" className="text-sm text-[var(--accent)] hover:underline">
              View all
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {bookmarks.slice(0, 3).map((h) => (
              <HackathonCard
                key={h._id}
                hackathon={{ ...h, isBookmarked: true }}
              />
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  )
}
