/**
 * Shared hackathon constants + formatters (frontend)
 *
 * Kept in sync with server enums so filter chips and admin forms match
 * what the API accepts. Prize/team bands mirror buildListFilter() query keys.
 */

export const HACKATHON_MODES = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'hybrid', label: 'Hybrid' },
]

export const HACKATHON_DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'unspecified', label: 'Not specified' },
]

export const HACKATHON_DOMAINS = [
  'Web Development',
  'AI/ML',
  'Blockchain',
  'Cybersecurity',
  'Mobile',
  'IoT',
  'Cloud',
]

export const TEAM_SIZE_OPTIONS = [
  { value: 'solo', label: 'Solo' },
  { value: '2-3', label: '2–3' },
  { value: '4-5', label: '4–5' },
  { value: '6+', label: '6+' },
]

export const PRIZE_POOL_OPTIONS = [
  { value: 'lt10k', label: '< ₹10k' },
  { value: '10k-50k', label: '₹10k–₹50k' },
  { value: '50k-1l', label: '₹50k–₹1L' },
  { value: '1l+', label: '₹1L+' },
]

export const REGISTRATION_STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'closingSoon', label: 'Closing Soon' },
  { value: 'closed', label: 'Closed' },
]

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'deadline', label: 'Registration deadline' },
  { value: 'startDate', label: 'Start date' },
  { value: 'prizePool', label: 'Prize pool' },
  { value: 'featured', label: 'Featured' },
]

/** Format INR prize for cards — compact for UI */
export function formatPrize(amount) {
  const n = Number(amount) || 0
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`
  if (n >= 1000) return `₹${Math.round(n / 1000)}k`
  if (n <= 0) return 'TBA'
  return `₹${n}`
}

export function formatTeamSize(min, max) {
  if (min === max) return min === 1 ? 'Solo' : `${min} members`
  return `${min}–${max} members`
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Break a deadline into days/hours/minutes/seconds for CountdownTimer.
 * Returns null when closed so the UI can show "Registration closed".
 */
export function getCountdownParts(deadline) {
  const end = new Date(deadline).getTime()
  const diff = end - Date.now()
  if (Number.isNaN(end) || diff <= 0) return null

  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const urgent = diff < 48 * 60 * 60 * 1000

  return { days, hours, minutes, seconds, urgent, totalMs: diff }
}

/** Default empty filter state for the listing page */
export const emptyFilters = () => ({
  mode: '',
  difficulty: '',
  domain: '',
  teamSize: '',
  prizePool: '',
  registrationStatus: '',
  sort: 'newest',
})
