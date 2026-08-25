/**
 * TeamDetails — /teams/:id
 *
 * Shows roster, recruitment status, join button (applicants), and leader tools:
 * edit, remove members, accept/reject requests, close recruitment.
 */

import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Lock, LockOpen, Pencil, Trash2 } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import GradientButton from '../components/GradientButton'
import SkillChip from '../components/profile/SkillChip'
import TeamMemberCard from '../components/team/TeamMemberCard'
import JoinRequestCard from '../components/team/JoinRequestCard'
import JoinRequestModal from '../components/team/JoinRequestModal'
import TeamChat from '../components/team/TeamChat'
import RoleBadge from '../components/team/RoleBadge'
import { statusBadgeClass } from '../utils/teams'
import {
  getTeamById,
  updateTeam,
  deleteTeam,
  removeMember,
  getTeamRequests,
  acceptRequest,
  rejectRequest,
  sendJoinRequest,
  getErrorMessage,
} from '../api/team'
import { useNotifications } from '../context/NotificationContext'
import { cn } from '../utils/cn'

export default function TeamDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { refresh: refreshNotifications } = useNotifications()

  const [team, setTeam] = useState(null)
  const [isLeader, setIsLeader] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const [myRequest, setMyRequest] = useState(null)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '' })

  const [joinOpen, setJoinOpen] = useState(false)
  const [joinError, setJoinError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getTeamById(id)
      setTeam(data.team)
      setIsLeader(data.isLeader)
      setIsMember(data.isMember)
      setMyRequest(data.myRequest)
      setEditForm({
        name: data.team.name,
        description: data.team.description || '',
      })

      if (data.isLeader) {
        const reqData = await getTeamRequests(id, 'pending')
        setRequests(reqData.requests || [])
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleSaveEdit = async () => {
    setActionLoading(true)
    try {
      const data = await updateTeam(id, editForm)
      setTeam(data.team)
      setEditing(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleRecruitment = async () => {
    setActionLoading(true)
    try {
      const next = team.status === 'closed' ? 'recruiting' : 'closed'
      const data = await updateTeam(id, { status: next })
      setTeam(data.team)
      await refreshNotifications()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this team permanently?')) return
    try {
      await deleteTeam(id)
      navigate('/my-teams')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the team?')) return
    setActionLoading(true)
    try {
      const data = await removeMember(id, userId)
      setTeam(data.team)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleAccept = async (requestId) => {
    setActionLoading(true)
    try {
      const data = await acceptRequest(requestId)
      setTeam(data.team)
      setRequests((prev) => prev.filter((r) => r._id !== requestId))
      await refreshNotifications()
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (requestId) => {
    setActionLoading(true)
    try {
      await rejectRequest(requestId)
      setRequests((prev) => prev.filter((r) => r._id !== requestId))
      await refreshNotifications()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const handleJoin = async (message) => {
    setActionLoading(true)
    setJoinError('')
    try {
      await sendJoinRequest(id, message)
      setJoinOpen(false)
      await load()
      await refreshNotifications()
    } catch (err) {
      setJoinError(getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
        </div>
      </AppShell>
    )
  }

  if (error && !team) {
    return (
      <AppShell>
        <p className="text-red-400">{error}</p>
      </AppShell>
    )
  }

  const hackathonId = team.hackathon?._id || team.hackathon
  const canJoin = !isLeader && !isMember && team.status === 'recruiting' && !myRequest

  return (
    <AppShell title={team.name} description={team.hackathon?.title}>
      <Link
        to={hackathonId ? `/hackathons/${hackathonId}/teams` : '/my-teams'}
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-app"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-app glass p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                {editing ? (
                  <input
                    className="font-display text-2xl font-bold text-app bg-transparent border-b border-app w-full"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                ) : (
                  <h1 className="font-display text-3xl font-bold text-app">{team.name}</h1>
                )}
                <p className="mt-2 text-muted">
                  {team.hackathon?.title} · Led by {team.leader?.name}
                </p>
                <span
                  className={cn(
                    'mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize',
                    statusBadgeClass(team.status),
                  )}
                >
                  {team.status}
                </span>
              </div>

              {isLeader ? (
                <div className="flex flex-wrap gap-2">
                  <GradientButton
                    type="button"
                    variant="ghost"
                    className="!px-3 !py-2 !text-sm"
                    icon={editing ? undefined : Pencil}
                    onClick={() => (editing ? handleSaveEdit() : setEditing(true))}
                    disabled={actionLoading}
                  >
                    {editing ? 'Save' : 'Edit'}
                  </GradientButton>
                  <GradientButton
                    type="button"
                    variant="ghost"
                    className="!px-3 !py-2 !text-sm"
                    icon={team.status === 'closed' ? LockOpen : Lock}
                    onClick={handleToggleRecruitment}
                    disabled={actionLoading}
                  >
                    {team.status === 'closed' ? 'Reopen' : 'Close'} recruitment
                  </GradientButton>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              ) : null}
            </div>

            {editing ? (
              <textarea
                className="mt-4 w-full rounded-2xl border border-app bg-[var(--surface)] p-3 text-sm"
                rows={4}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-app">
                {team.description || 'No description yet.'}
              </p>
            )}

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase text-muted">Looking for</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(team.requiredRoles || []).map((r) => (
                  <RoleBadge key={r} role={r} />
                ))}
                {(team.requiredSkills || []).map((s) => (
                  <SkillChip key={s} skill={s} />
                ))}
              </div>
            </div>
          </motion.section>

          <section>
            <h2 className="font-display text-xl font-bold text-app">
              Members ({team.members?.length}/{team.maxMembers})
            </h2>
            <div className="mt-4 space-y-3">
              {(team.members || []).map((member) => (
                <TeamMemberCard
                  key={member._id}
                  member={member}
                  isTeamLeader={isLeader}
                  isMemberLeader={String(member._id) === String(team.leader?._id || team.leader)}
                  canRemove={isLeader}
                  onRemove={handleRemoveMember}
                />
              ))}
            </div>
          </section>

          {isMember ? <TeamChat team={team} /> : null}

          {isLeader && requests.length > 0 ? (
            <section>
              <h2 className="font-display text-xl font-bold text-app">
                Pending requests ({requests.length})
              </h2>
              <div className="mt-4 space-y-4">
                {requests.map((req) => (
                  <JoinRequestCard
                    key={req._id}
                    request={req}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    loading={actionLoading}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-app glass p-5">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Members</dt>
                <dd className="font-semibold text-app">
                  {team.members?.length}/{team.maxMembers}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Status</dt>
                <dd className="capitalize text-app">{team.status}</dd>
              </div>
            </dl>

            {canJoin ? (
              <GradientButton
                type="button"
                fullWidth
                className="mt-5"
                onClick={() => setJoinOpen(true)}
              >
                Join team
              </GradientButton>
            ) : null}

            {myRequest ? (
              <p className="mt-4 rounded-xl bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-500">
                Request pending — waiting for leader
              </p>
            ) : null}

            {isMember && !isLeader ? (
              <p className="mt-4 text-center text-sm text-emerald-500">You&apos;re on this team</p>
            ) : null}
          </div>
        </aside>
      </div>

      <JoinRequestModal
        open={joinOpen}
        team={team}
        onClose={() => setJoinOpen(false)}
        onSubmit={handleJoin}
        loading={actionLoading}
        error={joinError}
      />
    </AppShell>
  )
}
