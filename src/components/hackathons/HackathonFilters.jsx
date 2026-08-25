/**
 * HackathonFilters — filter panel + sort control
 *
 * How filters work:
 * Parent holds a filters object; each chip/select updates one key.
 * Empty string = "any". Parent rebuilds API query params and refetches.
 * Mobile: collapsible drawer animated with Framer Motion.
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Filter, RotateCcw, ChevronDown } from 'lucide-react'
import {
  HACKATHON_MODES,
  HACKATHON_DIFFICULTIES,
  HACKATHON_DOMAINS,
  TEAM_SIZE_OPTIONS,
  PRIZE_POOL_OPTIONS,
  REGISTRATION_STATUS_OPTIONS,
  SORT_OPTIONS,
  emptyFilters,
} from '../../utils/hackathons'
import { cn } from '../../utils/cn'

function ChipGroup({ label, options, value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(active ? '' : opt.value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-ring',
                active
                  ? 'border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]'
                  : 'border-app text-muted hover:text-app',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function HackathonFilters({ filters, onChange, onReset }) {
  const [open, setOpen] = useState(false)

  const setKey = (key, value) => onChange({ ...filters, [key]: value })

  const activeCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'sort' && Boolean(v),
  ).length

  const panel = (
    <div className="space-y-5">
      <ChipGroup
        label="Mode"
        options={HACKATHON_MODES}
        value={filters.mode}
        onChange={(v) => setKey('mode', v)}
      />
      <ChipGroup
        label="Difficulty"
        options={HACKATHON_DIFFICULTIES}
        value={filters.difficulty}
        onChange={(v) => setKey('difficulty', v)}
      />
      <ChipGroup
        label="Domain"
        options={HACKATHON_DOMAINS.map((d) => ({ value: d, label: d }))}
        value={filters.domain}
        onChange={(v) => setKey('domain', v)}
      />
      <ChipGroup
        label="Team size"
        options={TEAM_SIZE_OPTIONS}
        value={filters.teamSize}
        onChange={(v) => setKey('teamSize', v)}
      />
      <ChipGroup
        label="Prize pool"
        options={PRIZE_POOL_OPTIONS}
        value={filters.prizePool}
        onChange={(v) => setKey('prizePool', v)}
      />
      <ChipGroup
        label="Registration"
        options={REGISTRATION_STATUS_OPTIONS}
        value={filters.registrationStatus}
        onChange={(v) => setKey('registrationStatus', v)}
      />

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted" htmlFor="sort">
          Sort by
        </label>
        <select
          id="sort"
          value={filters.sort || 'newest'}
          onChange={(e) => setKey('sort', e.target.value)}
          className="w-full rounded-xl border border-app bg-[var(--surface)] px-3 py-2.5 text-sm text-app focus-ring"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() => onReset?.(emptyFilters())}
        className="inline-flex items-center gap-2 rounded-xl border border-app px-3 py-2 text-sm text-muted transition-colors hover:text-app focus-ring"
      >
        <RotateCcw className="h-4 w-4" />
        Reset filters
      </button>
    </div>
  )

  return (
    <div className="rounded-3xl border border-app glass p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="font-display text-base font-semibold text-app">Filters</h2>
          {activeCount ? (
            <span className="rounded-full bg-[var(--primary)]/15 px-2 py-0.5 text-xs font-medium text-[var(--primary)]">
              {activeCount}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted hover:text-app focus-ring lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? 'Hide' : 'Show'}
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      <div className="mt-4 hidden lg:block">{panel}</div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="filters-mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden lg:hidden"
          >
            <div className="mt-4">{panel}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
