/**
 * Phase 5 — Team & recruitment post controllers
 *
 * Team creation flow:
 *   User picks hackathon → POST /api/teams → Team doc (leader in members[])
 *   → default TeamPost for the recruitment board → visible on GET /team-posts
 *
 * Search/filters on GET /api/teams and GET /api/team-posts mirror Phase 4 patterns.
 */

import mongoose from 'mongoose'
import Team, { TEAM_ROLES, TEAM_STATUSES } from '../models/Team.js'
import TeamPost from '../models/TeamPost.js'
import JoinRequest from '../models/JoinRequest.js'
import Hackathon from '../models/Hackathon.js'
import { createNotification } from '../models/Notification.js'
import { EXPERIENCE_LEVELS } from '../models/User.js'

const USER_POPULATE = 'name avatar skills preferredRole experienceLevel availability college'

/** Shape team for API — includes member count */
const formatTeam = (team) => {
  const doc = team.toObject ? team.toObject() : { ...team }
  return {
    ...doc,
    memberCount: doc.members?.length ?? 0,
  }
}

const buildTeamFilter = (query) => {
  const filter = {}
  const and = []

  if (query.hackathon) {
    if (mongoose.Types.ObjectId.isValid(query.hackathon)) {
      filter.hackathon = query.hackathon
    }
  }

  if (query.search?.trim()) {
    const term = query.search.trim()
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    and.push({
      $or: [
        { name: regex },
        { description: regex },
        { requiredSkills: regex },
      ],
    })
  }

  if (query.status) {
    const statuses = String(query.status)
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => TEAM_STATUSES.includes(s))
    if (statuses.length) filter.status = { $in: statuses }
  }

  if (query.role) {
    filter.requiredRoles = { $in: [query.role] }
  }

  if (query.experience) {
    // Filter via active team posts in getTeamPosts; for teams use requiredRoles proxy
  }

  if (query.teamSize) {
    const size = Number(query.teamSize)
    if (!Number.isNaN(size)) {
      if (size >= 5) filter.maxMembers = { $gte: 5 }
      else filter.maxMembers = size
    }
  }

  if (and.length) filter.$and = and
  return filter
}

const buildPostFilter = (query) => {
  const filter = { isActive: true }
  const and = []

  if (query.hackathon && mongoose.Types.ObjectId.isValid(query.hackathon)) {
    filter.hackathon = query.hackathon
  }

  if (query.search?.trim()) {
    const term = query.search.trim()
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    and.push({
      $or: [
        { title: regex },
        { description: regex },
        { requiredSkills: regex },
        { requiredRole: regex },
      ],
    })
  }

  if (query.role) filter.requiredRole = query.role
  if (query.experience) filter.experienceLevel = query.experience

  if (query.status === 'recruiting') {
    // Join with team status in aggregation; simplified: filter active posts only
  }

  if (and.length) filter.$and = and
  return filter
}

/**
 * POST /api/teams — create team + default recruitment post
 */
export const createTeam = async (req, res) => {
  try {
    const {
      name,
      hackathon,
      description,
      maxMembers,
      requiredRoles,
      requiredSkills,
      postTitle,
      postDescription,
      requiredRole,
      experienceLevel,
      availability,
    } = req.body

    if (!name?.trim() || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Team name is required.' })
    }
    if (!hackathon || !mongoose.Types.ObjectId.isValid(hackathon)) {
      return res.status(400).json({ success: false, message: 'Valid hackathon is required.' })
    }

    const hackathonDoc = await Hackathon.findById(hackathon)
    if (!hackathonDoc) {
      return res.status(404).json({ success: false, message: 'Hackathon not found.' })
    }

    const max = Number(maxMembers) || 4
    if (max < 2 || max > 10) {
      return res.status(400).json({
        success: false,
        message: 'Max members must be between 2 and 10.',
      })
    }

    const team = await Team.create({
      name: name.trim(),
      hackathon,
      description: String(description || '').trim(),
      leader: req.user._id,
      members: [req.user._id],
      maxMembers: max,
      requiredRoles: Array.isArray(requiredRoles) ? requiredRoles : [],
      requiredSkills: Array.isArray(requiredSkills)
        ? requiredSkills.map((s) => String(s).trim()).filter(Boolean)
        : [],
      status: max <= 1 ? 'full' : 'recruiting',
    })

    team.syncStatus()
    await team.save()

    // Default recruitment post so the team appears on the board immediately
    const post = await TeamPost.create({
      team: team._id,
      hackathon,
      title: postTitle?.trim() || `${team.name} is recruiting!`,
      description: postDescription?.trim() || team.description,
      requiredRole: requiredRole || (team.requiredRoles[0] || ''),
      requiredSkills: team.requiredSkills,
      experienceLevel: experienceLevel || req.user.experienceLevel || '',
      availability: availability || '',
      createdBy: req.user._id,
      isActive: team.status === 'recruiting',
    })

    const populated = await Team.findById(team._id)
      .populate('leader', USER_POPULATE)
      .populate('members', USER_POPULATE)
      .populate('hackathon', 'title organizer startDate')

    return res.status(201).json({
      success: true,
      message: 'Team created successfully.',
      team: formatTeam(populated),
      post,
    })
  } catch (error) {
    console.error('createTeam error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error. Please try again later.',
    })
  }
}

/**
 * GET /api/teams — list teams with search/filters
 */
export const getTeams = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12))
    const skip = (page - 1) * limit

    const filter = buildTeamFilter(req.query)

    const [items, total] = await Promise.all([
      Team.find(filter)
        .populate('leader', USER_POPULATE)
        .populate('members', USER_POPULATE)
        .populate('hackathon', 'title organizer')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Team.countDocuments(filter),
    ])

    return res.status(200).json({
      success: true,
      teams: items.map(formatTeam),
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (error) {
    console.error('getTeams error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** GET /api/teams/:id */
export const getTeamById = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid team id.' })
    }

    const team = await Team.findById(id)
      .populate('leader', USER_POPULATE)
      .populate('members', USER_POPULATE)
      .populate('hackathon', 'title organizer startDate endDate registrationDeadline')

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' })
    }

    // Include user's pending request if logged in
    let myRequest = null
    if (req.user) {
      myRequest = await JoinRequest.findOne({
        team: id,
        applicant: req.user._id,
        status: 'pending',
      })
    }

    const post = await TeamPost.findOne({ team: id, isActive: true })

    return res.status(200).json({
      success: true,
      team: formatTeam(team),
      post,
      myRequest,
      isLeader: req.user ? team.isLeader(req.user._id) : false,
      isMember: req.user ? team.isMember(req.user._id) : false,
    })
  } catch (error) {
    console.error('getTeamById error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** PUT /api/teams/:id — leader only */
export const updateTeam = async (req, res) => {
  try {
    const { id } = req.params
    const team = await Team.findById(id)
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' })
    }
    if (!team.isLeader(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the team leader can update.' })
    }

    const {
      name,
      description,
      maxMembers,
      requiredRoles,
      requiredSkills,
      status,
    } = req.body

    if (name !== undefined) team.name = String(name).trim()
    if (description !== undefined) team.description = String(description).trim()
    if (requiredRoles !== undefined) team.requiredRoles = requiredRoles
    if (requiredSkills !== undefined) team.requiredSkills = requiredSkills

    if (maxMembers !== undefined) {
      const max = Number(maxMembers)
      if (max < team.members.length) {
        return res.status(400).json({
          success: false,
          message: 'Max members cannot be less than current roster size.',
        })
      }
      team.maxMembers = max
    }

    // Leader can manually close or reopen recruitment
    if (status === 'closed') {
      team.status = 'closed'
      await TeamPost.updateMany({ team: id }, { isActive: false })
    } else if (status === 'recruiting') {
      team.syncStatus()
      if (team.status === 'recruiting') {
        await TeamPost.updateMany({ team: id }, { isActive: true })
        await createNotification({
          userId: req.user._id,
          type: 'recruitment_reopened',
          message: `Recruitment reopened for ${team.name}.`,
          relatedTeam: team._id,
        })
      }
    } else {
      team.syncStatus()
    }

    await team.save()

    const populated = await Team.findById(id)
      .populate('leader', USER_POPULATE)
      .populate('members', USER_POPULATE)
      .populate('hackathon', 'title')

    return res.status(200).json({
      success: true,
      message: 'Team updated.',
      team: formatTeam(populated),
    })
  } catch (error) {
    console.error('updateTeam error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** DELETE /api/teams/:id — leader only */
export const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params
    const team = await Team.findById(id)
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' })
    }
    if (!team.isLeader(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the team leader can delete.' })
    }

    await Promise.all([
      TeamPost.deleteMany({ team: id }),
      JoinRequest.deleteMany({ team: id }),
      Team.findByIdAndDelete(id),
    ])

    return res.status(200).json({ success: true, message: 'Team deleted.' })
  } catch (error) {
    console.error('deleteTeam error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** DELETE /api/teams/:id/members/:userId — leader removes member (not self) */
export const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params
    const team = await Team.findById(id)
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' })
    }
    if (!team.isLeader(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the leader can remove members.' })
    }
    if (String(userId) === String(team.leader)) {
      return res.status(400).json({
        success: false,
        message: 'Leader cannot remove themselves. Transfer leadership or delete the team.',
      })
    }

    team.members = team.members.filter((m) => String(m) !== String(userId))
    team.syncStatus()
    await team.save()

    if (team.status === 'recruiting') {
      await TeamPost.updateMany({ team: id }, { isActive: true })
    }

    const populated = await Team.findById(id)
      .populate('leader', USER_POPULATE)
      .populate('members', USER_POPULATE)
      .populate('hackathon', 'title')

    return res.status(200).json({
      success: true,
      message: 'Member removed.',
      team: formatTeam(populated),
    })
  } catch (error) {
    console.error('removeMember error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/**
 * GET /api/users/teams — teams I lead or joined + my requests
 * Mounted on user routes.
 */
export const getMyTeams = async (req, res) => {
  try {
    const userId = req.user._id

    const [led, joined, pending, accepted, rejected] = await Promise.all([
      Team.find({ leader: userId })
        .populate('leader', USER_POPULATE)
        .populate('members', USER_POPULATE)
        .populate('hackathon', 'title startDate registrationDeadline')
        .sort({ createdAt: -1 }),
      Team.find({ members: userId, leader: { $ne: userId } })
        .populate('leader', USER_POPULATE)
        .populate('members', USER_POPULATE)
        .populate('hackathon', 'title startDate registrationDeadline')
        .sort({ createdAt: -1 }),
      JoinRequest.find({ applicant: userId, status: 'pending' })
        .populate('team', 'name status maxMembers')
        .populate({
          path: 'team',
          populate: { path: 'hackathon', select: 'title' },
        })
        .sort({ createdAt: -1 }),
      JoinRequest.find({ applicant: userId, status: 'accepted' })
        .populate('team', 'name')
        .sort({ updatedAt: -1 })
        .limit(10),
      JoinRequest.find({ applicant: userId, status: 'rejected' })
        .populate('team', 'name')
        .sort({ updatedAt: -1 })
        .limit(10),
    ])

    const incoming = await JoinRequest.find({
      team: { $in: led.map((team) => team._id) },
      status: 'pending',
    })
      .populate('applicant', USER_POPULATE)
      .populate({
        path: 'team',
        select: 'name status maxMembers hackathon',
        populate: { path: 'hackathon', select: 'title' },
      })
      .sort({ createdAt: -1 })
      .limit(30)

    return res.status(200).json({
      success: true,
      led: led.map(formatTeam),
      joined: joined.map(formatTeam),
      requests: {
        pending,
        accepted,
        rejected,
        incoming,
      },
    })
  } catch (error) {
    console.error('getMyTeams error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** POST /api/team-posts */
export const createTeamPost = async (req, res) => {
  try {
    const {
      team,
      title,
      description,
      requiredRole,
      requiredSkills,
      experienceLevel,
      availability,
    } = req.body

    if (!team || !mongoose.Types.ObjectId.isValid(team)) {
      return res.status(400).json({ success: false, message: 'Valid team id is required.' })
    }

    const teamDoc = await Team.findById(team)
    if (!teamDoc) {
      return res.status(404).json({ success: false, message: 'Team not found.' })
    }
    if (!teamDoc.isLeader(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the leader can post recruitment.' })
    }
    if (teamDoc.status !== 'recruiting') {
      return res.status(400).json({
        success: false,
        message: 'Team is not recruiting. Reopen recruitment first.',
      })
    }

    const post = await TeamPost.create({
      team,
      hackathon: teamDoc.hackathon,
      title: title?.trim() || `${teamDoc.name} is hiring`,
      description: description?.trim() || '',
      requiredRole: requiredRole || '',
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      experienceLevel: experienceLevel || '',
      availability: availability || '',
      createdBy: req.user._id,
      isActive: true,
    })

    const populated = await TeamPost.findById(post._id)
      .populate({
        path: 'team',
        populate: [
          { path: 'leader', select: USER_POPULATE },
          { path: 'members', select: USER_POPULATE },
          { path: 'hackathon', select: 'title' },
        ],
      })

    return res.status(201).json({ success: true, post: populated })
  } catch (error) {
    console.error('createTeamPost error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** GET /api/team-posts — recruitment board */
export const getTeamPosts = async (req, res) => {
  try {
    const filter = buildPostFilter(req.query)

    let posts = await TeamPost.find(filter)
      .populate({
        path: 'team',
        populate: [
          { path: 'leader', select: USER_POPULATE },
          { path: 'members', select: USER_POPULATE },
          { path: 'hackathon', select: 'title organizer' },
        ],
      })
      .populate('createdBy', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50)

    // Filter by team status if requested
    if (req.query.status) {
      posts = posts.filter((p) => p.team && p.team.status === req.query.status)
    } else {
      // Default: only recruiting teams on the board
      posts = posts.filter((p) => p.team && p.team.status === 'recruiting')
    }

    // Search leader name client-side filter after populate
    if (req.query.leaderSearch?.trim()) {
      const term = req.query.leaderSearch.trim().toLowerCase()
      posts = posts.filter((p) => p.team?.leader?.name?.toLowerCase().includes(term))
    }

    return res.status(200).json({ success: true, posts })
  } catch (error) {
    console.error('getTeamPosts error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** PUT /api/team-posts/:id */
export const updateTeamPost = async (req, res) => {
  try {
    const post = await TeamPost.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' })
    }

    const team = await Team.findById(post.team)
    if (!team?.isLeader(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the leader can edit posts.' })
    }

    const fields = [
      'title',
      'description',
      'requiredRole',
      'requiredSkills',
      'experienceLevel',
      'availability',
      'isActive',
    ]
    for (const key of fields) {
      if (req.body[key] !== undefined) post[key] = req.body[key]
    }
    await post.save()

    return res.status(200).json({ success: true, post })
  } catch (error) {
    console.error('updateTeamPost error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** DELETE /api/team-posts/:id — deactivate */
export const deactivateTeamPost = async (req, res) => {
  try {
    const post = await TeamPost.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' })
    }

    const team = await Team.findById(post.team)
    if (!team?.isLeader(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the leader can deactivate posts.' })
    }

    post.isActive = false
    await post.save()

    return res.status(200).json({ success: true, message: 'Recruitment post deactivated.' })
  } catch (error) {
    console.error('deactivateTeamPost error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

export { TEAM_ROLES, EXPERIENCE_LEVELS }
