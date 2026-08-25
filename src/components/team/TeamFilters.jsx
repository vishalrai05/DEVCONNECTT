/**
 * TeamFilters — search + filter chips for recruitment board
 */

import { Search, X } from 'lucide-react'
import {
  TEAM_ROLE_FILTERS,
  EXPERIENCE_FILTERS,
  TEAM_SIZE_FILTERS,
  TEAM_STATUSES,
} from '../../utils/teams'
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

export default function TeamFilters({ filters, onChange, onSearchChange }) {
  const set = (key, val) => onChange({ ...filters, [key]: val })

  return (
    <div className="space-y-5 rounded-3xl border border-app glass p-4 sm:p-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search teams, skills, leaders…"
          className="w-full rounded-xl border border-app bg-[var(--surface)] py-2.5 pl-10 pr-9 text-sm text-app focus-ring"
        />
        {filters.search ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-app"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <ChipGroup
        label="Role"
        options={TEAM_ROLE_FILTERS}
        value={filters.role}
        onChange={(v) => set('role', v)}
      />
      <ChipGroup
        label="Experience"
        options={EXPERIENCE_FILTERS}
        value={filters.experience}
        onChange={(v) => set('experience', v)}
      />
      <ChipGroup
        label="Team size"
        options={TEAM_SIZE_FILTERS}
        value={filters.teamSize}
        onChange={(v) => set('teamSize', v)}
      />
      <ChipGroup
        label="Status"
        options={TEAM_STATUSES}
        value={filters.status}
        onChange={(v) => set('status', v || 'recruiting')}
      />
    </div>
  )
}
