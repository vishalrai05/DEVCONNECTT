/**
 * CreateTeam — team creation flow for a hackathon
 *
 * Flow (matches spec):
 *   User selects hackathon (from route param) → fills form → POST /api/teams
 *   → Team + TeamPost created → redirect to team details or recruitment board
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import GradientButton from '../components/GradientButton'
import SkillInput from '../components/profile/SkillInput'
import { getHackathonById } from '../api/hackathon'
import { createTeam, getErrorMessage } from '../api/team'
import { PREFERRED_ROLES } from '../utils/profile'

const fieldClass =
  'w-full rounded-2xl border border-app bg-[var(--surface)] px-4 py-3 text-sm text-app focus-ring'

export default function CreateTeam() {
  const { hackathonId } = useParams()
  const navigate = useNavigate()

  const [hackathon, setHackathon] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    maxMembers: 4,
    requiredRoles: [],
    requiredSkills: [],
    postTitle: '',
    requiredRole: '',
    experienceLevel: '',
  })

  useEffect(() => {
    getHackathonById(hackathonId)
      .then((d) => setHackathon(d.hackathon))
      .catch(() => setError('Hackathon not found.'))
  }, [hackathonId])

  const toggleRole = (role) => {
    setForm((f) => ({
      ...f,
      requiredRoles: f.requiredRoles.includes(role)
        ? f.requiredRoles.filter((r) => r !== role)
        : [...f.requiredRoles, role],
    }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await createTeam({
        ...form,
        hackathon: hackathonId,
        maxMembers: Number(form.maxMembers),
      })
      navigate(`/teams/${data.team._id}`, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell
      title="Create team"
      description={
        hackathon
          ? `Start a squad for ${hackathon.title}. You’ll be the team leader.`
          : 'Start your hackathon squad.'
      }
    >
      <Link
        to={`/hackathons/${hackathonId}/teams`}
        className="mb-6 inline-flex text-sm text-[var(--accent)] hover:underline"
      >
        ← Back to recruitment board
      </Link>

      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-app glass p-6 sm:p-8"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-app">Team name *</label>
          <input
            required
            className={fieldClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Code Ninjas"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-app">Description</label>
          <textarea
            rows={4}
            className={fieldClass}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What are you building? What vibe are you going for?"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-app">Max members *</label>
          <select
            className={fieldClass}
            value={form.maxMembers}
            onChange={(e) => setForm({ ...form, maxMembers: e.target.value })}
          >
            {[2, 3, 4, 5, 6, 8, 10].map((n) => (
              <option key={n} value={n}>
                {n} members
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-app">Required roles</p>
          <div className="flex flex-wrap gap-2">
            {PREFERRED_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  form.requiredRoles.includes(role)
                    ? 'border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]'
                    : 'border-app text-muted'
                }`}
              >
                {role.replace(' Developer', '').replace(' Engineer', '')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-app">Required skills</p>
          <SkillInput
            value={form.requiredSkills}
            onChange={(skills) => setForm({ ...form, requiredSkills: skills })}
          />
        </div>

        <div className="border-t border-app pt-6">
          <p className="text-sm font-semibold text-app">Recruitment post (optional)</p>
          <p className="mt-1 text-xs text-muted">Customize how your team appears on the board.</p>
          <div className="mt-4 space-y-4">
            <input
              className={fieldClass}
              value={form.postTitle}
              onChange={(e) => setForm({ ...form, postTitle: e.target.value })}
              placeholder="Post headline (defaults to team name)"
            />
            <select
              className={fieldClass}
              value={form.requiredRole}
              onChange={(e) => setForm({ ...form, requiredRole: e.target.value })}
            >
              <option value="">Primary role needed</option>
              {PREFERRED_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              className={fieldClass}
              value={form.experienceLevel}
              onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
            >
              <option value="">Experience level</option>
              {['Beginner', 'Intermediate', 'Advanced'].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        ) : null}

        <GradientButton type="submit" fullWidth disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating team…
            </>
          ) : (
            'Create team'
          )}
        </GradientButton>
      </form>
    </AppShell>
  )
}
