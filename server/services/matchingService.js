/**
 * Phase 6 — Deterministic teammate matching engine
 *
 * Weighted scoring (normalized 0–100):
 *   Skills compatibility      40%
 *   Role compatibility        20%
 *   Project interests         15%
 *   Availability              15%
 *   Experience compatibility  10%
 *
 * Skills score blends overlap (shared stack) with complementarity
 * (e.g. Frontend seeker ↔ Backend candidate with Node/Express).
 *
 * Kept independent of any external AI API so scores stay explainable.
 */

export const MATCH_WEIGHTS = {
  skills: 0.4,
  role: 0.2,
  interests: 0.15,
  availability: 0.15,
  experience: 0.1,
}

import { PROJECT_INTERESTS } from '../models/User.js'

export { PROJECT_INTERESTS }

/** Roles that pair well together on a hackathon squad */
const ROLE_COMPLEMENTS = {
  'Frontend Developer': [
    'Backend Developer',
    'Full Stack Developer',
    'UI/UX Designer',
    'DevOps Engineer',
  ],
  'Backend Developer': [
    'Frontend Developer',
    'Full Stack Developer',
    'DevOps Engineer',
    'AI/ML Engineer',
  ],
  'Full Stack Developer': [
    'UI/UX Designer',
    'AI/ML Engineer',
    'DevOps Engineer',
    'Mobile Developer',
  ],
  'AI/ML Engineer': [
    'Backend Developer',
    'Full Stack Developer',
    'Frontend Developer',
    'DevOps Engineer',
  ],
  'UI/UX Designer': [
    'Frontend Developer',
    'Full Stack Developer',
    'Mobile Developer',
  ],
  'Mobile Developer': [
    'Backend Developer',
    'UI/UX Designer',
    'Full Stack Developer',
    'DevOps Engineer',
  ],
  'DevOps Engineer': [
    'Backend Developer',
    'Full Stack Developer',
    'Frontend Developer',
    'AI/ML Engineer',
  ],
  'Blockchain Developer': [
    'Backend Developer',
    'Full Stack Developer',
    'Frontend Developer',
  ],
}

/** Typical skill keywords associated with each role (lowercase) */
const ROLE_SKILL_HINTS = {
  'Frontend Developer': [
    'react',
    'vue',
    'angular',
    'javascript',
    'typescript',
    'html',
    'css',
    'tailwind',
    'next.js',
    'nextjs',
    'svelte',
    'redux',
  ],
  'Backend Developer': [
    'node.js',
    'nodejs',
    'express',
    'django',
    'flask',
    'fastapi',
    'spring',
    'java',
    'python',
    'mongodb',
    'postgresql',
    'sql',
    'mysql',
    'redis',
    'graphql',
    'api',
  ],
  'Full Stack Developer': [
    'react',
    'node.js',
    'nodejs',
    'express',
    'mongodb',
    'typescript',
    'next.js',
    'nextjs',
    'javascript',
  ],
  'AI/ML Engineer': [
    'python',
    'tensorflow',
    'pytorch',
    'scikit-learn',
    'machine learning',
    'nlp',
    'opencv',
    'keras',
    'pandas',
    'numpy',
  ],
  'UI/UX Designer': [
    'figma',
    'adobe xd',
    'sketch',
    'ui',
    'ux',
    'prototyping',
    'wireframing',
    'design',
  ],
  'Mobile Developer': [
    'react native',
    'flutter',
    'swift',
    'kotlin',
    'android',
    'ios',
    'dart',
    'expo',
  ],
  'DevOps Engineer': [
    'docker',
    'kubernetes',
    'aws',
    'azure',
    'gcp',
    'ci/cd',
    'terraform',
    'linux',
    'nginx',
  ],
  'Blockchain Developer': [
    'solidity',
    'ethereum',
    'web3',
    'smart contracts',
    'rust',
    'blockchain',
  ],
}

/** Map skill keywords → project interest domains */
const SKILL_INTEREST_MAP = {
  react: 'Web Applications',
  vue: 'Web Applications',
  angular: 'Web Applications',
  javascript: 'Web Applications',
  typescript: 'Web Applications',
  'next.js': 'Web Applications',
  nextjs: 'Web Applications',
  'node.js': 'Web Applications',
  nodejs: 'Web Applications',
  express: 'Web Applications',
  django: 'Web Applications',
  flask: 'Web Applications',
  mongodb: 'Web Applications',
  postgresql: 'Web Applications',
  python: 'Data Science',
  tensorflow: 'AI / Machine Learning',
  pytorch: 'AI / Machine Learning',
  'scikit-learn': 'AI / Machine Learning',
  'machine learning': 'AI / Machine Learning',
  nlp: 'AI / Machine Learning',
  keras: 'AI / Machine Learning',
  pandas: 'Data Science',
  numpy: 'Data Science',
  'react native': 'Mobile Apps',
  flutter: 'Mobile Apps',
  swift: 'Mobile Apps',
  kotlin: 'Mobile Apps',
  android: 'Mobile Apps',
  ios: 'Mobile Apps',
  dart: 'Mobile Apps',
  figma: 'UI / UX & Design',
  'adobe xd': 'UI / UX & Design',
  sketch: 'UI / UX & Design',
  ui: 'UI / UX & Design',
  ux: 'UI / UX & Design',
  docker: 'Cloud & DevOps',
  kubernetes: 'Cloud & DevOps',
  aws: 'Cloud & DevOps',
  azure: 'Cloud & DevOps',
  gcp: 'Cloud & DevOps',
  terraform: 'Cloud & DevOps',
  solidity: 'Blockchain',
  ethereum: 'Blockchain',
  web3: 'Blockchain',
  blockchain: 'Blockchain',
  cybersecurity: 'Cybersecurity',
  security: 'Cybersecurity',
  iot: 'IoT / Hardware',
  arduino: 'IoT / Hardware',
  raspberry: 'IoT / Hardware',
}

const ROLE_INTEREST_MAP = {
  'Frontend Developer': ['Web Applications', 'UI / UX & Design'],
  'Backend Developer': ['Web Applications', 'Cloud & DevOps', 'Developer Tools'],
  'Full Stack Developer': ['Web Applications', 'Developer Tools'],
  'AI/ML Engineer': ['AI / Machine Learning', 'Data Science'],
  'UI/UX Designer': ['UI / UX & Design', 'Web Applications', 'Mobile Apps'],
  'Mobile Developer': ['Mobile Apps', 'UI / UX & Design'],
  'DevOps Engineer': ['Cloud & DevOps', 'Developer Tools'],
  'Blockchain Developer': ['Blockchain', 'Web Applications'],
}

const AVAILABILITY_RANK = {
  'Available now': 3,
  'Available this week': 2,
  'Available this month': 1,
  'Not available': 0,
}

const EXPERIENCE_RANK = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
}

const normalizeSkill = (skill) => String(skill || '').trim().toLowerCase()

const uniquePreserveCase = (skills = []) => {
  const seen = new Set()
  const out = []
  for (const raw of skills) {
    const key = normalizeSkill(raw)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(String(raw).trim())
  }
  return out
}

/**
 * Derive project-interest tags from skills + preferred role.
 * Avoids requiring a separate schema field while still scoring interests.
 */
export const deriveProjectInterests = (profile = {}) => {
  const interests = new Set()

  for (const skill of profile.skills || []) {
    const mapped = SKILL_INTEREST_MAP[normalizeSkill(skill)]
    if (mapped) interests.add(mapped)
  }

  for (const interest of ROLE_INTEREST_MAP[profile.preferredRole] || []) {
    interests.add(interest)
  }

  // Explicit field if ever populated (future-proof, no migration required)
  for (const interest of profile.projectInterests || []) {
    if (PROJECT_INTERESTS.includes(interest)) interests.add(interest)
  }

  return [...interests]
}

/** Interest domain → skill keywords for Mongo pre-filtering */
export const interestToSkillHints = (interest) => {
  const hints = []
  for (const [skill, mapped] of Object.entries(SKILL_INTEREST_MAP)) {
    if (mapped === interest) hints.push(skill)
  }
  return hints
}

/** Roles that commonly work that interest domain */
export const interestToRoles = (interest) =>
  Object.entries(ROLE_INTEREST_MAP)
    .filter(([, interests]) => interests.includes(interest))
    .map(([role]) => role)

const jaccard = (setA, setB) => {
  if (!setA.size && !setB.size) return 0
  let intersection = 0
  for (const item of setA) {
    if (setB.has(item)) intersection += 1
  }
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

/**
 * Skills score (0–1): 55% overlap + 45% complementarity.
 * Complementarity = candidate skills that fill the seeker's complementary role hints.
 */
const scoreSkills = (seeker, candidate) => {
  const seekerSkills = (seeker.skills || []).map(normalizeSkill).filter(Boolean)
  const candidateSkills = (candidate.skills || []).map(normalizeSkill).filter(Boolean)
  const seekerSet = new Set(seekerSkills)
  const candidateSet = new Set(candidateSkills)

  const overlap = jaccard(seekerSet, candidateSet)

  const complementRoles = ROLE_COMPLEMENTS[seeker.preferredRole] || []
  const neededHints = new Set()
  for (const role of complementRoles) {
    for (const hint of ROLE_SKILL_HINTS[role] || []) {
      neededHints.add(hint)
    }
  }

  // Also treat seeker's own role gaps as needed from a complementary partner
  const ownHints = ROLE_SKILL_HINTS[seeker.preferredRole] || []
  for (const hint of ownHints) {
    if (!seekerSet.has(hint)) neededHints.add(hint)
  }

  let complementHits = 0
  const complementarySkills = []
  for (const skill of candidate.skills || []) {
    const key = normalizeSkill(skill)
    if (!key || seekerSet.has(key)) continue
    if (neededHints.has(key)) {
      complementHits += 1
      complementarySkills.push(String(skill).trim())
    }
  }

  const complementScore =
    neededHints.size === 0 ? 0 : Math.min(1, complementHits / Math.min(4, neededHints.size || 1))

  // When either side has no skills, fall back lightly on role skill hints
  let score = overlap * 0.55 + complementScore * 0.45
  if (!seekerSkills.length && !candidateSkills.length) {
    score = 0.15
  }

  const matchedSkills = uniquePreserveCase(
    (seeker.skills || []).filter((s) => candidateSet.has(normalizeSkill(s))),
  )

  return {
    score: Math.min(1, score),
    matchedSkills,
    complementarySkills: uniquePreserveCase(complementarySkills).slice(0, 6),
  }
}

/** Role score (0–1): complementary > identical > unrelated */
const scoreRole = (seeker, candidate) => {
  const a = seeker.preferredRole
  const b = candidate.preferredRole
  if (!a || !b) return 0.35

  if (a === b) return 0.65

  const complements = ROLE_COMPLEMENTS[a] || []
  if (complements.includes(b)) return 1

  // Soft credit if candidate is Full Stack (flexible) or seeker is
  if (a === 'Full Stack Developer' || b === 'Full Stack Developer') return 0.75

  return 0.25
}

/** Interest overlap (0–1) via derived domains */
const scoreInterests = (seeker, candidate) => {
  const a = new Set(deriveProjectInterests(seeker))
  const b = new Set(deriveProjectInterests(candidate))
  if (!a.size && !b.size) return 0.3
  return jaccard(a, b)
}

/** Availability compatibility (0–1); Not available → 0 */
const scoreAvailability = (seeker, candidate) => {
  const a = AVAILABILITY_RANK[seeker.availability]
  const b = AVAILABILITY_RANK[candidate.availability]
  if (a === undefined || b === undefined) return 0.4
  if (b === 0) return 0
  if (a === 0) return 0.2

  const diff = Math.abs(a - b)
  if (diff === 0) return 1
  if (diff === 1) return 0.75
  return 0.45
}

/** Experience proximity (0–1) */
const scoreExperience = (seeker, candidate) => {
  const a = EXPERIENCE_RANK[seeker.experienceLevel]
  const b = EXPERIENCE_RANK[candidate.experienceLevel]
  if (!a || !b) return 0.45

  const diff = Math.abs(a - b)
  if (diff === 0) return 1
  if (diff === 1) return 0.7
  return 0.35
}

/**
 * Build a short human-readable reason from score components.
 */
export const buildMatchReason = ({
  matchScore,
  matchedSkills,
  complementarySkills,
  roleScore,
  interestScore,
  seeker,
  candidate,
}) => {
  const parts = []

  if (matchedSkills.length >= 2) {
    parts.push(`you both work with ${matchedSkills.slice(0, 2).join(' and ')}`)
  } else if (matchedSkills.length === 1) {
    parts.push(`you share ${matchedSkills[0]} experience`)
  }

  if (complementarySkills.length >= 1) {
    const comps = complementarySkills.slice(0, 2).join(' and ')
    parts.push(`they bring complementary ${comps} skills`)
  }

  if (roleScore >= 0.9 && seeker.preferredRole && candidate.preferredRole) {
    parts.push(
      `${seeker.preferredRole.replace(/ Developer| Engineer| Designer/g, '')} and ${candidate.preferredRole.replace(/ Developer| Engineer| Designer/g, '')} roles pair well`,
    )
  } else if (roleScore >= 0.6 && seeker.preferredRole === candidate.preferredRole) {
    parts.push(`aligned ${seeker.preferredRole} focus`)
  }

  if (interestScore >= 0.5) {
    const shared = deriveProjectInterests(seeker).filter((i) =>
      deriveProjectInterests(candidate).includes(i),
    )
    if (shared.length) {
      parts.push(`shared interest in ${shared[0]}`)
    }
  }

  if (!parts.length) {
    return matchScore >= 50
      ? 'Solid potential based on profile compatibility.'
      : 'Partial profile overlap — review skills and availability.'
  }

  const strength =
    matchScore >= 85 ? 'Strong match because' : matchScore >= 65 ? 'Good fit because' : 'Possible match because'

  // Cap at ~2 clauses for scannability
  const clause = parts.slice(0, 2).join(', and ')
  return `${strength} ${clause}.`
}

/**
 * Score one candidate against the seeker.
 * Returns null when the candidate should be excluded (e.g. not available).
 */
export const scoreCandidate = (seeker, candidate, { allowUnavailable = false } = {}) => {
  if (!allowUnavailable && candidate.availability === 'Not available') {
    return null
  }

  const skills = scoreSkills(seeker, candidate)
  const role = scoreRole(seeker, candidate)
  const interests = scoreInterests(seeker, candidate)
  const availability = scoreAvailability(seeker, candidate)
  const experience = scoreExperience(seeker, candidate)

  const raw =
    skills.score * MATCH_WEIGHTS.skills +
    role * MATCH_WEIGHTS.role +
    interests * MATCH_WEIGHTS.interests +
    availability * MATCH_WEIGHTS.availability +
    experience * MATCH_WEIGHTS.experience

  const matchScore = Math.round(Math.min(100, Math.max(0, raw * 100)))

  const reason = buildMatchReason({
    matchScore,
    matchedSkills: skills.matchedSkills,
    complementarySkills: skills.complementarySkills,
    roleScore: role,
    interestScore: interests,
    seeker,
    candidate,
  })

  return {
    matchScore,
    matchedSkills: skills.matchedSkills,
    complementarySkills: skills.complementarySkills,
    reason,
    breakdown: {
      skills: Math.round(skills.score * 100),
      role: Math.round(role * 100),
      interests: Math.round(interests * 100),
      availability: Math.round(availability * 100),
      experience: Math.round(experience * 100),
    },
  }
}

/**
 * Score and rank a candidate list. Returns sorted recommendations.
 */
export const rankCandidates = (seeker, candidates, { limit = 20, minScore = 1 } = {}) => {
  const scored = []

  for (const candidate of candidates) {
    const result = scoreCandidate(seeker, candidate)
    if (!result) continue
    if (result.matchScore < minScore) continue
    scored.push({ candidate, ...result })
  }

  scored.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
    return String(a.candidate.name || '').localeCompare(String(b.candidate.name || ''))
  })

  return scored.slice(0, limit)
}
