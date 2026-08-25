/**
 * Shared profile constants + completion calculator
 *
 * Why a shared util?
 * Dashboard, EditProfile, and ProfileCompletion must agree on which fields
 * count toward "profile complete" and which dropdown options are valid.
 * One source of truth avoids UI/backend drift.
 */

export const PREFERRED_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'AI/ML Engineer',
  'UI/UX Designer',
  'Mobile Developer',
  'DevOps Engineer',
  'Blockchain Developer',
]

export const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export const AVAILABILITY_OPTIONS = [
  'Available now',
  'Available this week',
  'Available this month',
  'Not available',
]

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

export const YEAR_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Graduate',
  'Other',
]

/** Max skills allowed in the chip input — matches backend validation */
export const MAX_SKILLS = 20

/** Bio character limit — matches User schema + Edit Profile counter */
export const BIO_MAX_LENGTH = 300

/**
 * Fields that contribute to the completion percentage.
 * `check` returns true when that section is filled enough to count.
 */
export const COMPLETION_FIELDS = [
  {
    key: 'avatar',
    label: 'Avatar',
    check: (p) => Boolean(p?.avatar),
  },
  {
    key: 'bio',
    label: 'Bio',
    check: (p) => Boolean(p?.bio?.trim()),
  },
  {
    key: 'skills',
    label: 'Skills',
    check: (p) => Array.isArray(p?.skills) && p.skills.length > 0,
  },
  {
    key: 'college',
    label: 'College',
    check: (p) => Boolean(p?.college?.trim()),
  },
  {
    key: 'preferredRole',
    label: 'Preferred role',
    check: (p) => Boolean(p?.preferredRole),
  },
  {
    key: 'availability',
    label: 'Availability',
    check: (p) => Boolean(p?.availability),
  },
  {
    key: 'projectInterests',
    label: 'Project interests',
    check: (p) => Array.isArray(p?.projectInterests) && p.projectInterests.length > 0,
  },
  {
    key: 'github',
    label: 'GitHub',
    check: (p) => Boolean(p?.github?.trim()),
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    check: (p) => Boolean(p?.linkedin?.trim()),
  },
]

/**
 * Returns { percent, filled, total, missing[] } for progress UI.
 * percent is rounded so the bar and "75% Complete" label stay in sync.
 */
export function getProfileCompletion(profile) {
  const total = COMPLETION_FIELDS.length
  const missing = []
  let filled = 0

  for (const field of COMPLETION_FIELDS) {
    if (field.check(profile)) {
      filled += 1
    } else {
      missing.push(field.label)
    }
  }

  const percent = total === 0 ? 0 : Math.round((filled / total) * 100)

  return { percent, filled, total, missing }
}

/** Initials fallback when avatar URL is empty */
export function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

/** Optional URL validator used by Edit Profile (empty is OK) */
export function isOptionalUrl(value) {
  if (!value || !String(value).trim()) return true
  try {
    const url = new URL(String(value).trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
