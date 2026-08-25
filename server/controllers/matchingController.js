/**
 * Phase 6 — Matching API controllers
 *
 * GET  /api/matching/recommendations — ranked teammate suggestions
 * POST /api/matching/invite          — invite a user to one of your recruiting teams
 *
 * Pre-filters in Mongo (availability, role, skills, profile signal) then
 * scores a capped candidate pool in memory so we never scan the full user table.
 */

import mongoose from 'mongoose'
import User, {
  PREFERRED_ROLES,
  AVAILABILITY_OPTIONS,
} from '../models/User.js'
import Team from '../models/Team.js'
import JoinRequest from '../models/JoinRequest.js'
import { createNotification } from '../models/Notification.js'
import {
  rankCandidates,
  PROJECT_INTERESTS,
  interestToSkillHints,
  interestToRoles,
  deriveProjectInterests,
} from '../services/matchingService.js'

/** Public-safe projection — never email/password/tokens */
const PUBLIC_SELECT =
  'name avatar bio college branch year skills preferredRole experienceLevel availability projectInterests github linkedin portfolio profileCompleted createdAt'

const formatPublicUser = (user) => {
  const u = typeof user.toObject === 'function' ? user.toObject() : { ...user }
  return {
    _id: u._id,
    name: u.name,
    bio: u.bio || '',
    college: u.college || '',
    branch: u.branch || '',
    year: u.year || '',
    skills: u.skills || [],
    preferredRole: u.preferredRole || '',
    experienceLevel: u.experienceLevel || '',
    availability: u.availability || '',
    github: u.github || '',
    linkedin: u.linkedin || '',
    portfolio: u.portfolio || '',
    avatar: u.avatar || '',
    profileCompleted: Boolean(u.profileCompleted),
    projectInterests: [...new Set([...(u.projectInterests || []), ...deriveProjectInterests(u)])],
    createdAt: u.createdAt,
  }
}

const parsePositiveInt = (value, fallback, { min = 1, max = 50 } = {}) => {
  const n = Number.parseInt(value, 10)
  if (Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

const parseSkillsParam = (raw) => {
  if (!raw) return []
  const list = Array.isArray(raw) ? raw : String(raw).split(',')
  return list
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 10)
}

/**
 * Build a Mongo filter that narrows candidates before scoring.
 * Keeps the in-memory pool small for performance.
 */
const buildCandidateFilter = (seekerId, query) => {
  const and = [
    { _id: { $ne: seekerId } },
    { availability: { $ne: 'Not available' } },
    // Need at least some matching signal
    {
      $or: [
        { skills: { $exists: true, $ne: [] } },
        { preferredRole: { $exists: true, $nin: ['', null] } },
      ],
    },
  ]

  const { role, skills, interest, availability } = query

  if (role) {
    if (!PREFERRED_ROLES.includes(role)) {
      const err = new Error('Invalid role filter.')
      err.statusCode = 400
      throw err
    }
    and.push({ preferredRole: role })
  }

  if (availability) {
    if (!AVAILABILITY_OPTIONS.includes(availability) || availability === 'Not available') {
      const err = new Error('Invalid availability filter.')
      err.statusCode = 400
      throw err
    }
    and.push({ availability })
  }

  const skillFilters = parseSkillsParam(skills)
  if (skillFilters.length) {
    // Case-insensitive skill match via regex on array elements
    and.push({
      skills: {
        $elemMatch: {
          $in: skillFilters.map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i')),
        },
      },
    })
  }

  if (interest) {
    if (!PROJECT_INTERESTS.includes(interest)) {
      const err = new Error('Invalid project interest filter.')
      err.statusCode = 400
      throw err
    }
    const hints = interestToSkillHints(interest)
    const roles = interestToRoles(interest)
    const interestOr = []
    if (hints.length) {
      interestOr.push({
        skills: {
          $elemMatch: {
            $in: hints.map((h) => new RegExp(`^${escapeRegex(h)}$`, 'i')),
          },
        },
      })
    }
    if (roles.length) {
      interestOr.push({ preferredRole: { $in: roles } })
    }
    if (interestOr.length) {
      and.push({ $or: interestOr })
    }
  }

  return { $and: and }
}

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Prefer candidates who share skills or complementary role when no hard filters.
 * Uses seeker's skills for an indexed-friendly $in pre-pass, then fills the pool.
 */
const fetchCandidatePool = async (seeker, filter, poolSize) => {
  const seekerSkills = (seeker.skills || []).map((s) => String(s).trim()).filter(Boolean)

  // Stage 1: skill-overlap candidates (strongest signal)
  let candidates = []
  if (seekerSkills.length) {
    candidates = await User.find({
      ...filter,
      skills: {
        $elemMatch: {
          $in: seekerSkills.map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i')),
        },
      },
    })
      .select(PUBLIC_SELECT)
      .limit(poolSize)
      .lean()
  }

  // Stage 2: fill remaining slots with other eligible profiles
  if (candidates.length < poolSize) {
    const excludeIds = [seeker._id, ...candidates.map((c) => c._id)]
    const filler = await User.find({
      ...filter,
      _id: { $nin: excludeIds },
    })
      .select(PUBLIC_SELECT)
      .sort({ profileCompleted: -1, updatedAt: -1 })
      .limit(poolSize - candidates.length)
      .lean()
    candidates = [...candidates, ...filler]
  }

  return candidates
}

/**
 * GET /api/matching/recommendations
 * Query: role, skills (comma-separated), interest, availability, limit, page
 */
export const getRecommendations = async (req, res) => {
  try {
    const seeker = req.user
    const limit = parsePositiveInt(req.query.limit, 12, { min: 1, max: 30 })
    const page = parsePositiveInt(req.query.page, 1, { min: 1, max: 100 })
    // Cap DB pool — score this window, then paginate ranked results
    const poolSize = Math.min(80, Math.max(40, limit * 4))

    let filter
    try {
      filter = buildCandidateFilter(seeker._id, req.query)
    } catch (validationError) {
      return res.status(validationError.statusCode || 400).json({
        success: false,
        message: validationError.message,
      })
    }

    const pool = await fetchCandidatePool(seeker, filter, poolSize)
    const ranked = rankCandidates(seeker, pool, { limit: poolSize, minScore: 1 })

    const total = ranked.length
    const start = (page - 1) * limit
    const pageRows = ranked.slice(start, start + limit)

    const recommendations = pageRows.map((row) => ({
      user: formatPublicUser(row.candidate),
      matchScore: row.matchScore,
      matchedSkills: row.matchedSkills,
      complementarySkills: row.complementarySkills,
      reason: row.reason,
      breakdown: row.breakdown,
    }))

    return res.status(200).json({
      success: true,
      recommendations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasMore: start + limit < total,
      },
      meta: {
        poolSize: pool.length,
        seekerReady: Boolean(
          (seeker.skills && seeker.skills.length) || seeker.preferredRole,
        ),
        interests: PROJECT_INTERESTS,
      },
    })
  } catch (error) {
    console.error('getRecommendations error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/**
 * POST /api/matching/invite
 * Body: { teamId, userId, message? }
 *
 * Leader invites a recommended developer to apply / join their recruiting team.
 * Creates a notification for the invitee (reuses Phase 5 notification system).
 */
export const inviteToTeam = async (req, res) => {
  try {
    const { teamId, userId, message } = req.body || {}

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ success: false, message: 'Invalid team id.' })
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user id.' })
    }
    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot invite yourself.',
      })
    }

    const inviteMessage = String(message || '').trim().slice(0, 500)

    const team = await Team.findById(teamId).populate('hackathon', 'title')
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' })
    }

    if (!team.isLeader(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the team leader can send invites.',
      })
    }

    team.syncStatus()
    if (team.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'This team is not accepting new members.',
      })
    }
    if (team.status === 'full' || team.members.length >= team.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'This team is already full.',
      })
    }

    if (team.isMember(userId)) {
      return res.status(400).json({
        success: false,
        message: 'That user is already on this team.',
      })
    }

    const invitee = await User.findById(userId).select('name availability')
    if (!invitee) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }
    if (invitee.availability === 'Not available') {
      return res.status(400).json({
        success: false,
        message: 'That user is not currently available.',
      })
    }

    // Soft-dedupe: if they already have a pending join request, tip the leader
    const existingRequest = await JoinRequest.findOne({
      team: teamId,
      applicant: userId,
      status: 'pending',
    })
    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'This user already has a pending join request for your team.',
      })
    }

    const hackathonTitle = team.hackathon?.title || 'a hackathon'
    const note = inviteMessage
      ? `${req.user.name} invited you to join "${team.name}" for ${hackathonTitle}: "${inviteMessage}"`
      : `${req.user.name} invited you to join "${team.name}" for ${hackathonTitle}. Open the team page to request to join.`

    await createNotification({
      userId: invitee._id,
      type: 'team_invite',
      message: note,
      relatedTeam: team._id,
    })

    return res.status(200).json({
      success: true,
      message: `Invite sent to ${invitee.name}.`,
    })
  } catch (error) {
    console.error('inviteToTeam error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** GET /api/matching/meta — filter option constants for the UI */
export const getMatchingMeta = async (_req, res) => {
  return res.status(200).json({
    success: true,
    roles: PREFERRED_ROLES,
    availability: AVAILABILITY_OPTIONS.filter((a) => a !== 'Not available'),
    interests: PROJECT_INTERESTS,
  })
}
