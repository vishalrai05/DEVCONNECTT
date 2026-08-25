/**
 * MatchFilters — refine teammate recommendations
 */

import { Search, X } from 'lucide-react'
import {
  ROLE_FILTERS,
  AVAILABILITY_FILTERS,
  INTEREST_FILTERS,
} from '../../utils/matching'
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
              key={opt.value || 'any'}
              type="button"
              onClick={() => onChange(active && opt.value ? '' : opt.value)}
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

export default function MatchFilters({ filters, onChange, onSkillsChange }) {
  const set = (key, val) => onChange({ ...filters, [key]: val })

  return (
    <div className="space-y-5 rounded-3xl border border-app glass p-4 sm:p-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={filters.skills}
          onChange={(e) => onSkillsChange(e.target.value)}
          placeholder="Filter by skill (e.g. React, Node.js)"
          className="w-full rounded-xl border border-app bg-[var(--surface)] py-2.5 pl-10 pr-9 text-sm text-app focus-ring"
          aria-label="Filter by skills"
        />
        {filters.skills ? (
          <button
            type="button"
            onClick={() => onSkillsChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-app"
            aria-label="Clear skills filter"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <ChipGroup
        label="Role"
        options={ROLE_FILTERS}
        value={filters.role}
        onChange={(v) => set('role', v)}
      />
      <ChipGroup
        label="Project interest"
        options={INTEREST_FILTERS}
        value={filters.interest}
        onChange={(v) => set('interest', v)}
      />
      <ChipGroup
        label="Availability"
        options={AVAILABILITY_FILTERS}
        value={filters.availability}
        onChange={(v) => set('availability', v)}
      />
    </div>
  )
}
