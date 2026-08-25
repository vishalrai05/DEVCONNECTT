/**
 * Team constants — aligned with backend Team / TeamPost models
 */

export const TEAM_STATUSES = [
  { value: 'recruiting', label: 'Recruiting' },
  { value: 'full', label: 'Full' },
  { value: 'closed', label: 'Closed' },
]

export const TEAM_ROLE_FILTERS = [
  { value: 'Frontend Developer', label: 'Frontend' },
  { value: 'Backend Developer', label: 'Backend' },
  { value: 'Full Stack Developer', label: 'Full Stack' },
  { value: 'AI/ML Engineer', label: 'AI/ML' },
  { value: 'UI/UX Designer', label: 'UI/UX' },
]

export const EXPERIENCE_FILTERS = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
]

export const TEAM_SIZE_FILTERS = [
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5+' },
]

export const emptyTeamFilters = () => ({
  search: '',
  role: '',
  experience: '',
  teamSize: '',
  status: 'recruiting',
})

export function statusBadgeClass(status) {
  switch (status) {
    case 'recruiting':
      return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
    case 'full':
      return 'bg-amber-500/15 text-amber-500 border-amber-500/30'
    case 'closed':
      return 'bg-slate-500/15 text-slate-400 border-slate-500/30'
    default:
      return 'border-app text-muted'
  }
}

export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
