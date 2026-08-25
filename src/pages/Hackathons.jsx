/**
 * Hackathons listing page — discovery hub
 *
 * Layout: search → stats → featured strip → filters + card grid + pagination
 *
 * State:
 * - searchInput / search: input is immediate; debounced `search` hits the API
 * - filters: mode/difficulty/domain/… sent as query params
 * - page: pagination
 *
 * How search + filters combine: both become GET /api/hackathons params;
 * the server AND-combines them in buildListFilter().
 */

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import HackathonSearch from '../components/hackathons/HackathonSearch'
import HackathonFilters from '../components/hackathons/HackathonFilters'
import HackathonStats from '../components/hackathons/HackathonStats'
import HackathonCard from '../components/hackathons/HackathonCard'
import {
  getHackathons,
  getFeaturedHackathons,
  getHackathonStats,
  getErrorMessage,
} from '../api/hackathon'
import { emptyFilters } from '../utils/hackathons'

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-app bg-[var(--surface)]">
      <div className="aspect-[16/9] animate-pulse bg-[var(--border)]" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--border)]" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--border)]" />
        <div className="h-16 animate-pulse rounded-2xl bg-[var(--border)]" />
      </div>
    </div>
  )
}

export default function Hackathons() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(emptyFilters)
  const [page, setPage] = useState(1)

  const [hackathons, setHackathons] = useState([])
  const [featured, setFeatured] = useState([])
  const [stats, setStats] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })

  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState('')

  // Debounce search so we don't fire an API call per keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const loadList = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page,
        limit: 12,
        sort: filters.sort || 'newest',
      }
      if (search) params.search = search
      if (filters.mode) params.mode = filters.mode
      if (filters.difficulty) params.difficulty = filters.difficulty
      if (filters.domain) params.domain = filters.domain
      if (filters.teamSize) params.teamSize = filters.teamSize
      if (filters.prizePool) params.prizePool = filters.prizePool
      if (filters.registrationStatus) params.registrationStatus = filters.registrationStatus

      const data = await getHackathons(params)
      setHackathons(data.hackathons || [])
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 })
    } catch (err) {
      setError(getErrorMessage(err))
      setHackathons([])
    } finally {
      setLoading(false)
    }
  }, [page, search, filters])

  useEffect(() => {
    loadList()
  }, [loadList])

  useEffect(() => {
    let cancelled = false
    const loadMeta = async () => {
      setStatsLoading(true)
      try {
        const [statsData, featuredData] = await Promise.all([
          getHackathonStats(),
          getFeaturedHackathons(),
        ])
        if (!cancelled) {
          setStats(statsData.stats)
          setFeatured(featuredData.hackathons || [])
        }
      } catch {
        if (!cancelled) setStats(null)
      } finally {
        if (!cancelled) setStatsLoading(false)
      }
    }
    loadMeta()
    return () => {
      cancelled = true
    }
  }, [])

  const onFiltersChange = (next) => {
    setFilters(next)
    setPage(1)
  }

  return (
    <AppShell
      title="Discover hackathons"
      description="Search, filter, and bookmark upcoming events — then form your dream team."
    >
      <div className="space-y-8">
        <HackathonSearch value={searchInput} onChange={setSearchInput} />

        <HackathonStats stats={stats} loading={statsLoading} />

        {/* Featured strip */}
        {featured.length ? (
          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                  Spotlight
                </p>
                <h2 className="font-display text-2xl font-bold text-app">Featured hackathons</h2>
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featured.slice(0, 3).map((h) => (
                <HackathonCard key={h._id} hackathon={h} featured />
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <HackathonFilters
            filters={filters}
            onChange={onFiltersChange}
            onReset={(reset) => {
              setFilters(reset)
              setPage(1)
            }}
          />

          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {loading ? 'Loading…' : `${pagination.total} event${pagination.total === 1 ? '' : 's'}`}
              </p>
            </div>

            {error ? (
              <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </p>
            ) : null}

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : hackathons.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-3xl border border-dashed border-app glass p-10 text-center"
              >
                <p className="font-display text-xl font-semibold text-app">No hackathons found</p>
                <p className="mt-2 text-sm text-muted">
                  Try clearing filters or searching a different skill/domain.
                </p>
              </motion.div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {hackathons.map((h) => (
                  <HackathonCard key={h._id} hackathon={h} />
                ))}
              </div>
            )}

            {pagination.pages > 1 ? (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-app px-3 py-2 text-sm text-muted hover:text-app disabled:opacity-40 focus-ring"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <span className="text-sm text-muted">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  type="button"
                  disabled={page >= pagination.pages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-app px-3 py-2 text-sm text-muted hover:text-app disabled:opacity-40 focus-ring"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
