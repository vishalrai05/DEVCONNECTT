/**
 * Frontend matching constants — keep filter labels in sync with the API.
 */

import { PREFERRED_ROLES, AVAILABILITY_OPTIONS } from './profile'

export const PROJECT_INTERESTS = [
  'AI / Machine Learning',
  'Web Applications',
  'Mobile Apps',
  'Cloud & DevOps',
  'Blockchain',
  'UI / UX & Design',
  'Cybersecurity',
  'IoT / Hardware',
  'Developer Tools',
  'Data Science',
]

export const ROLE_FILTERS = [
  { value: '', label: 'Any role' },
  ...PREFERRED_ROLES.map((r) => ({ value: r, label: r })),
]

export const AVAILABILITY_FILTERS = [
  { value: '', label: 'Any availability' },
  ...AVAILABILITY_OPTIONS.filter((a) => a !== 'Not available').map((a) => ({
    value: a,
    label: a,
  })),
]

export const INTEREST_FILTERS = [
  { value: '', label: 'Any interest' },
  ...PROJECT_INTERESTS.map((i) => ({ value: i, label: i })),
]

export const emptyMatchFilters = () => ({
  role: '',
  skills: '',
  interest: '',
  availability: '',
})

/** Match score → color token classes */
export function matchScoreClass(score) {
  if (score >= 85) return 'text-emerald-500'
  if (score >= 65) return 'text-[var(--accent)]'
  if (score >= 45) return 'text-amber-500'
  return 'text-muted'
}

export function matchScoreRing(score) {
  if (score >= 85) return 'border-emerald-500/40 bg-emerald-500/10'
  if (score >= 65) return 'border-[var(--accent)]/40 bg-[var(--accent)]/10'
  if (score >= 45) return 'border-amber-500/40 bg-amber-500/10'
  return 'border-app bg-[var(--surface)]'
}
