/**
 * Phase 4 — Hackathon controllers
 *
 * Endpoints:
 *   GET    /api/hackathons              — list + search/filter/sort/paginate
 *   GET    /api/hackathons/featured     — featured strip
 *   GET    /api/hackathons/recommended  — skill/role-based suggestions
 *   GET    /api/hackathons/stats        — aggregate counts for the listing header
 *   GET    /api/hackathons/:id          — single event detail
 *   POST   /api/hackathons              — admin create
 *   PUT    /api/hackathons/:id          — admin update
 *   DELETE /api/hackathons/:id          — admin delete
 *   POST   /api/hackathons/:id/bookmark — save event
 *   DELETE /api/hackathons/:id/bookmark — unsave event
 *
 * How search works:
 * Query param `search` builds a case-insensitive $or across title, organizer,
 * domains, and requiredSkills so "React" matches skill tags too.
 *
 * How filters work:
 * Each filter maps to a Mongo query clause (mode, difficulty, domain, team
 * size bands, prize bands, registration status). Clauses are AND-combined.
 *
 * How bookmarks work:
 * User.bookmarkedHackathons stores ObjectIds. Toggle via $addToSet / $pull.
 * List endpoints annotate `isBookmarked` when optionalProtect attached a user.
 *
 * How recommendations work:
 * Score open hackathons by overlapping skills, domain↔preferredRole map, and
 * difficulty↔experienceLevel — then return the top matches.
 */

import mongoose from 'mongoose'
import Hackathon, {
  HACKATHON_MODES,
  HACKATHON_DIFFICULTIES,
  HACKATHON_DOMAINS,
} from '../models/Hackathon.js'
import User from '../models/User.js'

/** Preferred role → domains that usually need that role */
const ROLE_DOMAIN_MAP = {
  'Frontend Developer': ['Web Development', 'Mobile'],
  'Backend Developer': ['Web Development', 'Cloud', 'Cybersecurity'],
  'Full Stack Developer': ['Web Development', 'Cloud'],
  'AI/ML Engineer': ['AI/ML'],
  'UI/UX Designer': ['Web Development', 'Mobile'],
  'Mobile Developer': ['Mobile'],
  'DevOps Engineer': ['Cloud', 'IoT'],
  'Blockchain Developer': ['Blockchain'],
}

const EXPERIENCE_DIFFICULTY_MAP = {
  Beginner: ['beginner'],
  Intermediate: ['beginner', 'intermediate'],
  Advanced: ['intermediate', 'advanced'],
}

const isValidUrl = (value) => {
  if (!value) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** Serialize hackathon + optional bookmark flag for the client */
const formatHackathon = (doc, bookmarkedSet = null) => {
  const h = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc }
  const id = String(h._id)
  return {
    ...h,
    isBookmarked: bookmarkedSet ? bookmarkedSet.has(id) : false,
  }
}

const getBookmarkSet = (user) => {
  if (!user?.bookmarkedHackathons?.length) return new Set()
  return new Set(user.bookmarkedHackathons.map((id) => String(id)))
}

/**
 * Validate create/update payloads.
 * Why server-side? Clients can be bypassed; bad dates break countdown + filters.
 */
const validateHackathonPayload = (body, { partial = false } = {}) => {
  const errors = []
  const {
    title,
    organizer,
    description,
    startDate,
    endDate,
    registrationDeadline,
    mode,
    prizePool,
    teamSizeMin,
    teamSizeMax,
    difficulty,
    registrationLink,
    domains,
  } = body

  if (!partial || title !== undefined) {
    if (!title || String(title).trim().length < 3) errors.push('Title is required (min 3 chars).')
  }
  if (!partial || organizer !== undefined) {
    if (!organizer || String(organizer).trim().length < 2) errors.push('Organizer is required.')
  }
  if (!partial || description !== undefined) {
    if (!description || String(description).trim().length < 20) {
      errors.push('Description must be at least 20 characters.')
    }
  }

  const start = startDate ? new Date(startDate) : null
  const end = endDate ? new Date(endDate) : null
  const deadline = registrationDeadline ? new Date(registrationDeadline) : null

  if (!partial || startDate !== undefined) {
    if (!start || Number.isNaN(start.getTime())) errors.push('Valid start date is required.')
  }
  if (!partial || endDate !== undefined) {
    if (!end || Number.isNaN(end.getTime())) errors.push('Valid end date is required.')
  }
  if (!partial || registrationDeadline !== undefined) {
    if (!deadline || Number.isNaN(deadline.getTime())) {
      errors.push('Valid registration deadline is required.')
    }
  }

  // When all three exist, enforce timeline order
  if (start && end && deadline) {
    if (deadline.getTime() > start.getTime()) {
      errors.push('Registration deadline must be on or before the start date.')
    }
    if (end.getTime() < start.getTime()) {
      errors.push('End date must be on or after the start date.')
    }
  }

  if (!partial || mode !== undefined) {
    if (!HACKATHON_MODES.includes(String(mode || '').toLowerCase())) {
      errors.push('Mode must be online, offline, or hybrid.')
    }
  }
  if (!partial || difficulty !== undefined) {
    if (!HACKATHON_DIFFICULTIES.includes(String(difficulty || '').toLowerCase())) {
      errors.push('Difficulty must be beginner, intermediate, or advanced.')
    }
  }
  if (prizePool !== undefined && Number(prizePool) < 0) {
    errors.push('Prize pool cannot be negative.')
  }

  const min = teamSizeMin !== undefined ? Number(teamSizeMin) : undefined
  const max = teamSizeMax !== undefined ? Number(teamSizeMax) : undefined
  if (min !== undefined && (Number.isNaN(min) || min < 1)) {
    errors.push('Minimum team size must be at least 1.')
  }
  if (max !== undefined && (Number.isNaN(max) || max < 1)) {
    errors.push('Maximum team size must be at least 1.')
  }
  if (min !== undefined && max !== undefined && min > max) {
    errors.push('Minimum team size cannot exceed maximum team size.')
  }

  if (registrationLink !== undefined && !isValidUrl(registrationLink)) {
    errors.push('Registration link must be a valid URL.')
  }

  if (domains !== undefined) {
    if (!Array.isArray(domains)) errors.push('Domains must be an array.')
  }

  return errors
}

/**
 * Build Mongo filter from query string.
 * Team size / prize / registration status are "bands" interpreted here.
 */
const buildListFilter = (query) => {
  const filter = {}
  const and = []

  // ---- Search (case-insensitive across title, organizer, domains, skills) ----
  if (query.search?.trim()) {
    const term = query.search.trim()
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    and.push({
      $or: [
        { title: regex },
        { organizer: regex },
        { domains: regex },
        { requiredSkills: regex },
      ],
    })
  }

  if (query.mode) {
    const modes = String(query.mode)
      .split(',')
      .map((m) => m.trim().toLowerCase())
      .filter((m) => HACKATHON_MODES.includes(m))
    if (modes.length) filter.mode = { $in: modes }
  }

  if (query.difficulty) {
    const diffs = String(query.difficulty)
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter((d) => HACKATHON_DIFFICULTIES.includes(d))
    if (diffs.length) filter.difficulty = { $in: diffs }
  }

  if (query.domain) {
    const domains = String(query.domain)
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean)
    if (domains.length) filter.domains = { $in: domains }
  }

  // Team size bands: solo | 2-3 | 4-5 | 6+
  if (query.teamSize) {
    const band = query.teamSize
    if (band === 'solo') {
      and.push({ teamSizeMin: 1, teamSizeMax: 1 })
    } else if (band === '2-3') {
      and.push({ teamSizeMin: { $lte: 3 }, teamSizeMax: { $gte: 2 } })
    } else if (band === '4-5') {
      and.push({ teamSizeMin: { $lte: 5 }, teamSizeMax: { $gte: 4 } })
    } else if (band === '6+') {
      and.push({ teamSizeMax: { $gte: 6 } })
    }
  }

  // Prize pool bands (INR)
  if (query.prizePool) {
    const band = query.prizePool
    if (band === 'lt10k') filter.prizePool = { $lt: 10000 }
    else if (band === '10k-50k') filter.prizePool = { $gte: 10000, $lte: 50000 }
    else if (band === '50k-1l') filter.prizePool = { $gte: 50000, $lte: 100000 }
    else if (band === '1l+') filter.prizePool = { $gt: 100000 }
  }

  // Registration status relative to "now"
  const now = new Date()
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  if (query.registrationStatus === 'open') {
    filter.registrationDeadline = { $gt: now }
  } else if (query.registrationStatus === 'closingSoon') {
    filter.registrationDeadline = { $gt: now, $lte: in48h }
  } else if (query.registrationStatus === 'closed') {
    filter.registrationDeadline = { $lte: now }
  }

  if (query.featured === 'true') filter.isFeatured = true

  if (and.length) filter.$and = and
  return filter
}

/** Map sort query → Mongo sort object */
const buildSort = (sortKey) => {
  switch (sortKey) {
    case 'deadline':
      return { registrationDeadline: 1 }
    case 'startDate':
      return { startDate: 1 }
    case 'prizePool':
      return { prizePool: -1 }
    case 'featured':
      return { isFeatured: -1, createdAt: -1 }
    case 'newest':
    default:
      return { createdAt: -1 }
  }
}

/**
 * GET /api/hackathons
 * Supports search, filters, sort, page, limit.
 */
export const getHackathons = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12))
    const skip = (page - 1) * limit

    const filter = buildListFilter(req.query)
    const sort = buildSort(req.query.sort)

    const [items, total] = await Promise.all([
      Hackathon.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Hackathon.countDocuments(filter),
    ])

    const bookmarkedSet = getBookmarkSet(req.user)

    return res.status(200).json({
      success: true,
      hackathons: items.map((h) => formatHackathon(h, bookmarkedSet)),
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (error) {
    console.error('getHackathons error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** GET /api/hackathons/featured */
export const getFeaturedHackathons = async (req, res) => {
  try {
    const items = await Hackathon.find({ isFeatured: true })
      .sort({ registrationDeadline: 1 })
      .limit(6)
      .lean()

    const bookmarkedSet = getBookmarkSet(req.user)

    return res.status(200).json({
      success: true,
      hackathons: items.map((h) => formatHackathon(h, bookmarkedSet)),
    })
  } catch (error) {
    console.error('getFeaturedHackathons error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/**
 * GET /api/hackathons/stats
 * Lightweight aggregates for the listing stats row.
 */
export const getHackathonStats = async (req, res) => {
  try {
    const now = new Date()
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const [total, open, featured, closingSoon, online] = await Promise.all([
      Hackathon.countDocuments(),
      Hackathon.countDocuments({ registrationDeadline: { $gt: now } }),
      Hackathon.countDocuments({ isFeatured: true }),
      Hackathon.countDocuments({
        registrationDeadline: { $gt: now, $lte: in48h },
      }),
      Hackathon.countDocuments({ mode: 'online' }),
    ])

    return res.status(200).json({
      success: true,
      stats: { total, open, featured, closingSoon, online },
    })
  } catch (error) {
    console.error('getHackathonStats error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/**
 * GET /api/hackathons/recommended
 * Protected — needs the user's skills / role / experience.
 */
export const getRecommendedHackathons = async (req, res) => {
  try {
    const user = req.user
    const now = new Date()
    const openEvents = await Hackathon.find({
      registrationDeadline: { $gt: now },
    })
      .limit(40)
      .lean()

    const userSkills = (user.skills || []).map((s) => s.toLowerCase())
    const roleDomains = ROLE_DOMAIN_MAP[user.preferredRole] || []
    const allowedDiffs =
      EXPERIENCE_DIFFICULTY_MAP[user.experienceLevel] || HACKATHON_DIFFICULTIES

    const scored = openEvents
      .map((event) => {
        let score = 0

        // Skill overlap — strongest signal for "this event fits me"
        for (const skill of event.requiredSkills || []) {
          if (userSkills.includes(String(skill).toLowerCase())) score += 3
        }

        // Domain ↔ preferred role
        for (const domain of event.domains || []) {
          if (roleDomains.includes(domain)) score += 2
        }

        // Difficulty aligned with experience
        if (allowedDiffs.includes(event.difficulty)) score += 1

        // Soft boost for featured
        if (event.isFeatured) score += 0.5

        return { event, score }
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)

    // Fallback: if profile is empty, show featured/open events
    const results =
      scored.length > 0
        ? scored.map((r) => r.event)
        : await Hackathon.find({
            registrationDeadline: { $gt: now },
          })
            .sort({ isFeatured: -1, registrationDeadline: 1 })
            .limit(6)
            .lean()

    const bookmarkedSet = getBookmarkSet(user)

    return res.status(200).json({
      success: true,
      hackathons: results.map((h) => formatHackathon(h, bookmarkedSet)),
    })
  } catch (error) {
    console.error('getRecommendedHackathons error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** GET /api/hackathons/:id */
export const getHackathonById = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid hackathon id.' })
    }

    const hackathon = await Hackathon.findById(id).lean()
    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found.' })
    }

    const bookmarkedSet = getBookmarkSet(req.user)

    return res.status(200).json({
      success: true,
      hackathon: formatHackathon(hackathon, bookmarkedSet),
    })
  } catch (error) {
    console.error('getHackathonById error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** POST /api/hackathons — admin */
export const createHackathon = async (req, res) => {
  try {
    const errors = validateHackathonPayload(req.body)
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(' ') })
    }

    const payload = {
      title: String(req.body.title).trim(),
      organizer: String(req.body.organizer).trim(),
      description: String(req.body.description).trim(),
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      registrationDeadline: new Date(req.body.registrationDeadline),
      mode: String(req.body.mode).toLowerCase(),
      location: String(req.body.location || '').trim(),
      prizePool: Number(req.body.prizePool) || 0,
      teamSizeMin: Number(req.body.teamSizeMin) || 1,
      teamSizeMax: Number(req.body.teamSizeMax) || 4,
      domains: Array.isArray(req.body.domains) ? req.body.domains : [],
      requiredSkills: Array.isArray(req.body.requiredSkills)
        ? req.body.requiredSkills.map((s) => String(s).trim()).filter(Boolean)
        : [],
      difficulty: String(req.body.difficulty).toLowerCase(),
      registrationLink: String(req.body.registrationLink || '').trim(),
      image: String(req.body.image || '').trim(),
      isFeatured: Boolean(req.body.isFeatured),
      createdBy: req.user._id,
    }

    // Keep only known domains when provided
    payload.domains = payload.domains.filter((d) => HACKATHON_DOMAINS.includes(d) || d)

    const hackathon = await Hackathon.create(payload)

    return res.status(201).json({
      success: true,
      message: 'Hackathon created.',
      hackathon: formatHackathon(hackathon, new Set()),
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(' ')
      return res.status(400).json({ success: false, message })
    }
    console.error('createHackathon error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** PUT /api/hackathons/:id — admin */
export const updateHackathon = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid hackathon id.' })
    }

    const hackathon = await Hackathon.findById(id)
    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found.' })
    }

    const errors = validateHackathonPayload(
      {
        title: req.body.title ?? hackathon.title,
        organizer: req.body.organizer ?? hackathon.organizer,
        description: req.body.description ?? hackathon.description,
        startDate: req.body.startDate ?? hackathon.startDate,
        endDate: req.body.endDate ?? hackathon.endDate,
        registrationDeadline:
          req.body.registrationDeadline ?? hackathon.registrationDeadline,
        mode: req.body.mode ?? hackathon.mode,
        prizePool: req.body.prizePool ?? hackathon.prizePool,
        teamSizeMin: req.body.teamSizeMin ?? hackathon.teamSizeMin,
        teamSizeMax: req.body.teamSizeMax ?? hackathon.teamSizeMax,
        difficulty: req.body.difficulty ?? hackathon.difficulty,
        registrationLink: req.body.registrationLink ?? hackathon.registrationLink,
        domains: req.body.domains ?? hackathon.domains,
      },
      { partial: true },
    )
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(' ') })
    }

    const fields = [
      'title',
      'organizer',
      'description',
      'mode',
      'location',
      'prizePool',
      'teamSizeMin',
      'teamSizeMax',
      'domains',
      'requiredSkills',
      'difficulty',
      'registrationLink',
      'image',
      'isFeatured',
    ]

    for (const key of fields) {
      if (req.body[key] !== undefined) {
        if (key === 'mode' || key === 'difficulty') {
          hackathon[key] = String(req.body[key]).toLowerCase()
        } else if (key === 'prizePool' || key === 'teamSizeMin' || key === 'teamSizeMax') {
          hackathon[key] = Number(req.body[key])
        } else if (key === 'isFeatured') {
          hackathon[key] = Boolean(req.body[key])
        } else {
          hackathon[key] = req.body[key]
        }
      }
    }

    if (req.body.startDate) hackathon.startDate = new Date(req.body.startDate)
    if (req.body.endDate) hackathon.endDate = new Date(req.body.endDate)
    if (req.body.registrationDeadline) {
      hackathon.registrationDeadline = new Date(req.body.registrationDeadline)
    }

    await hackathon.save()

    const bookmarkedSet = getBookmarkSet(req.user)

    return res.status(200).json({
      success: true,
      message: 'Hackathon updated.',
      hackathon: formatHackathon(hackathon, bookmarkedSet),
    })
  } catch (error) {
    console.error('updateHackathon error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** DELETE /api/hackathons/:id — admin */
export const deleteHackathon = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid hackathon id.' })
    }

    const hackathon = await Hackathon.findByIdAndDelete(id)
    if (!hackathon) {
      return res.status(404).json({ success: false, message: 'Hackathon not found.' })
    }

    // Clean bookmarks that pointed at the deleted event
    await User.updateMany(
      { bookmarkedHackathons: id },
      { $pull: { bookmarkedHackathons: id } },
    )

    return res.status(200).json({
      success: true,
      message: 'Hackathon deleted.',
    })
  } catch (error) {
    console.error('deleteHackathon error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** POST /api/hackathons/:id/bookmark */
export const bookmarkHackathon = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid hackathon id.' })
    }

    const exists = await Hackathon.exists({ _id: id })
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Hackathon not found.' })
    }

    // $addToSet prevents duplicate bookmark IDs
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { bookmarkedHackathons: id },
    })

    return res.status(200).json({
      success: true,
      message: 'Hackathon bookmarked.',
      isBookmarked: true,
    })
  } catch (error) {
    console.error('bookmarkHackathon error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** DELETE /api/hackathons/:id/bookmark */
export const unbookmarkHackathon = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid hackathon id.' })
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { bookmarkedHackathons: id },
    })

    return res.status(200).json({
      success: true,
      message: 'Bookmark removed.',
      isBookmarked: false,
    })
  } catch (error) {
    console.error('unbookmarkHackathon error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/**
 * GET /api/users/bookmarks
 * Lives conceptually under users; exported here and mounted on user routes.
 */
export const getMyBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('bookmarkedHackathons')
      .populate({
        path: 'bookmarkedHackathons',
        options: { sort: { registrationDeadline: 1 } },
      })

    const hackathons = (user?.bookmarkedHackathons || []).filter(Boolean)
    const bookmarkedSet = new Set(hackathons.map((h) => String(h._id)))

    return res.status(200).json({
      success: true,
      hackathons: hackathons.map((h) => formatHackathon(h, bookmarkedSet)),
    })
  } catch (error) {
    console.error('getMyBookmarks error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}
