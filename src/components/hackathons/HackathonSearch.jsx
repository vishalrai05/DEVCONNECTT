/**
 * HackathonSearch — controlled search input for the listing page
 *
 * Debouncing lives in the parent (Hackathons.jsx) so URL/query sync stays
 * in one place. This component only owns the input UX + clear button.
 */

import { Search, X } from 'lucide-react'

export default function HackathonSearch({ value, onChange, onSubmit, placeholder }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.(value)
      }}
      className="relative w-full"
    >
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Search by title, organizer, domain, or skill…'}
        className="w-full rounded-2xl border border-app bg-[var(--surface)] py-3.5 pl-11 pr-10 text-sm text-app placeholder:text-muted/70 transition-all focus-ring focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--glow)]"
        aria-label="Search hackathons"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted hover:text-app focus-ring"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </form>
  )
}
