/**
 * AdminHackathons — create / edit / delete / feature events
 *
 * Gated on the frontend by user.role === 'admin' (backend still enforces adminOnly).
 * "View registrations" is a placeholder for a later phase — we surface registration
 * link + open/closed status instead.
 */

import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2, Pencil, Plus, RefreshCw, Star, Trash2 } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import GradientButton from '../components/GradientButton'
import { useAuth } from '../context/AuthContext'
import {
  getHackathons,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  syncEventbriteHackathons,
  getErrorMessage,
} from '../api/hackathon'
import {
  HACKATHON_DOMAINS,
  HACKATHON_DIFFICULTIES,
  HACKATHON_MODES,
  formatDate,
  formatPrize,
} from '../utils/hackathons'
import { cn } from '../utils/cn'

const emptyForm = () => ({
  title: '',
  organizer: '',
  description: '',
  startDate: '',
  endDate: '',
  registrationDeadline: '',
  mode: 'online',
  location: '',
  prizePool: 0,
  teamSizeMin: 1,
  teamSizeMax: 4,
  domains: [],
  requiredSkills: '',
  difficulty: 'intermediate',
  registrationLink: '',
  image: '',
  isFeatured: false,
})

const fieldClass =
  'w-full rounded-xl border border-app bg-[var(--surface)] px-3 py-2.5 text-sm text-app focus-ring'

/** datetime-local needs local YYYY-MM-DDTHH:mm */
const toLocalInput = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminHackathons() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncSummary, setSyncSummary] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getHackathons({ limit: 50, sort: 'newest' })
      setItems(data.hackathons || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') load()
  }, [user?.role, load])

  if (authLoading) {
    return (
      <AppShell title="Admin">
        <div className="flex min-h-[30vh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
        </div>
      </AppShell>
    )
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const toggleDomain = (domain) => {
    setForm((prev) => ({
      ...prev,
      domains: prev.domains.includes(domain)
        ? prev.domains.filter((d) => d !== domain)
        : [...prev.domains, domain],
    }))
  }

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
    setError('')
  }

  const startEdit = (h) => {
    setEditingId(h._id)
    setForm({
      title: h.title || '',
      organizer: h.organizer || '',
      description: h.description || '',
      startDate: toLocalInput(h.startDate),
      endDate: toLocalInput(h.endDate),
      registrationDeadline: toLocalInput(h.registrationDeadline),
      mode: h.mode || 'online',
      location: h.location || '',
      prizePool: h.prizePool || 0,
      teamSizeMin: h.teamSizeMin || 1,
      teamSizeMax: h.teamSizeMax || 4,
      domains: h.domains || [],
      requiredSkills: (h.requiredSkills || []).join(', '),
      difficulty: h.difficulty || 'intermediate',
      registrationLink: h.registrationLink || '',
      image: h.image || '',
      isFeatured: Boolean(h.isFeatured),
    })
    setShowForm(true)
    setError('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      prizePool: Number(form.prizePool) || 0,
      teamSizeMin: Number(form.teamSizeMin) || 1,
      teamSizeMax: Number(form.teamSizeMax) || 4,
      requiredSkills: String(form.requiredSkills)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      registrationDeadline: new Date(form.registrationDeadline).toISOString(),
    }

    try {
      if (editingId) await updateHackathon(editingId, payload)
      else await createHackathon(payload)
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm())
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id) => {
    if (!window.confirm('Delete this hackathon? This cannot be undone.')) return
    try {
      await deleteHackathon(id)
      setItems((prev) => prev.filter((h) => h._id !== id))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const toggleFeatured = async (h) => {
    try {
      const data = await updateHackathon(h._id, { isFeatured: !h.isFeatured })
      setItems((prev) =>
        prev.map((row) => (row._id === h._id ? data.hackathon : row)),
      )
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const onSyncEventbrite = async () => {
    setSyncing(true)
    setError('')
    setSyncSummary('')
    try {
      const data = await syncEventbriteHackathons()
      const { created, updated, skipped } = data.result
      setSyncSummary(`Eventbrite sync: ${created} added, ${updated} updated, ${skipped} skipped.`)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSyncing(false)
    }
  }

  return (
    <AppShell
      title="Hackathon admin"
      description="Create, feature, and manage events that appear in discovery."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{items.length} events in the catalog</p>
        <div className="flex flex-wrap gap-2">
          <GradientButton type="button" variant="ghost" className="!text-sm" icon={RefreshCw} onClick={onSyncEventbrite} disabled={syncing}>
            {syncing ? 'Syncing Eventbrite…' : 'Sync Eventbrite'}
          </GradientButton>
          <GradientButton type="button" className="!text-sm" icon={Plus} onClick={startCreate}>
            Add hackathon
          </GradientButton>
        </div>
      </div>

      {syncSummary ? <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">{syncSummary}</p> : null}

      {error ? (
        <p className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      ) : null}

      {showForm ? (
        <form
          onSubmit={onSubmit}
          className="mb-8 space-y-4 rounded-3xl border border-app glass p-6"
        >
          <h2 className="font-display text-xl font-semibold text-app">
            {editingId ? 'Edit hackathon' : 'New hackathon'}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted">Title</label>
              <input name="title" required className={fieldClass} value={form.title} onChange={onChange} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Organizer</label>
              <input name="organizer" required className={fieldClass} value={form.organizer} onChange={onChange} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted">Description</label>
            <textarea
              name="description"
              required
              rows={4}
              className={fieldClass}
              value={form.description}
              onChange={onChange}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-muted">Start</label>
              <input type="datetime-local" name="startDate" required className={fieldClass} value={form.startDate} onChange={onChange} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">End</label>
              <input type="datetime-local" name="endDate" required className={fieldClass} value={form.endDate} onChange={onChange} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Registration deadline</label>
              <input type="datetime-local" name="registrationDeadline" required className={fieldClass} value={form.registrationDeadline} onChange={onChange} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-muted">Mode</label>
              <select name="mode" className={fieldClass} value={form.mode} onChange={onChange}>
                {HACKATHON_MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Difficulty</label>
              <select name="difficulty" className={fieldClass} value={form.difficulty} onChange={onChange}>
                {HACKATHON_DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Prize pool (INR)</label>
              <input type="number" min="0" name="prizePool" className={fieldClass} value={form.prizePool} onChange={onChange} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-muted">Team min</label>
              <input type="number" min="1" name="teamSizeMin" className={fieldClass} value={form.teamSizeMin} onChange={onChange} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Team max</label>
              <input type="number" min="1" name="teamSizeMax" className={fieldClass} value={form.teamSizeMax} onChange={onChange} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Location</label>
              <input name="location" className={fieldClass} value={form.location} onChange={onChange} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-muted">Domains</p>
            <div className="flex flex-wrap gap-2">
              {HACKATHON_DOMAINS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDomain(d)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs',
                    form.domains.includes(d)
                      ? 'border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]'
                      : 'border-app text-muted',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted">Required skills (comma-separated)</label>
            <input name="requiredSkills" className={fieldClass} value={form.requiredSkills} onChange={onChange} placeholder="React, Node.js, MongoDB" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted">Registration link</label>
              <input name="registrationLink" className={fieldClass} value={form.registrationLink} onChange={onChange} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Image URL</label>
              <input name="image" className={fieldClass} value={form.image} onChange={onChange} />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-app">
            <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={onChange} />
            Feature on discovery homepage
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <GradientButton type="submit" disabled={saving} className="!text-sm">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : editingId ? (
                'Update event'
              ) : (
                'Create event'
              )}
            </GradientButton>
            <GradientButton
              type="button"
              variant="ghost"
              className="!text-sm"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
              }}
            >
              Cancel
            </GradientButton>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="flex min-h-[20vh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((h) => {
            const open = new Date(h.registrationDeadline) > new Date()
            return (
              <div
                key={h._id}
                className="flex flex-col gap-3 rounded-2xl border border-app glass p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-display font-semibold text-app">{h.title}</p>
                    {h.isFeatured ? (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                        Featured
                      </span>
                    ) : null}
                    {h.source === 'eventbrite' ? (
                      <span className="rounded-full border border-[var(--accent)]/30 bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                        Eventbrite
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium',
                        open ? 'bg-emerald-500/15 text-emerald-500' : 'bg-slate-500/15 text-slate-400',
                      )}
                    >
                      {open ? 'Registration open' : 'Closed'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {h.organizer} · {formatPrize(h.prizePool)} · Deadline {formatDate(h.registrationDeadline)}
                    {h.registrationLink ? (
                      <>
                        {' · '}
                        <a
                          href={h.registrationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] hover:underline"
                        >
                          Registration link
                        </a>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleFeatured(h)}
                    className="inline-flex items-center gap-1 rounded-xl border border-app px-3 py-2 text-xs text-muted hover:text-amber-500 focus-ring"
                    title="Toggle featured"
                  >
                    <Star className={cn('h-3.5 w-3.5', h.isFeatured && 'fill-amber-500 text-amber-500')} />
                    Feature
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(h)}
                    className="inline-flex items-center gap-1 rounded-xl border border-app px-3 py-2 text-xs text-muted hover:text-app focus-ring"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(h._id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 focus-ring"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
