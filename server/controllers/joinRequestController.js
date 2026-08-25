/**
 * Phase 5 — Join request controllers
 *
 * Join request flow:
 *   Applicant → POST /api/teams/:id/join (message) → pending JoinRequest
 *   Leader    → GET /api/teams/:id/requests → review applicants
 *   Leader    → PUT /api/requests/:id/accept → push applicant to Team.members
 *   Leader    → PUT /api/requests/:id/reject → status rejected
 *   Applicant → DELETE /api/requests/:id → cancel pending request
 *
 * Validation prevents:
 *   - duplicate pending requests (unique index + explicit check)
 *   - joining own team
 *   - requests to full/closed teams
 *   - accepting when roster already full
 *   - adding someone already on the team
 */

import mongoose from 'mongoose'
import Team from '../models/Team.js'
import JoinRequest from '../models/JoinRequest.js'
import TeamPost from '../models/TeamPost.js'
import Notification, { createNotification } from '../models/Notification.js'

const USER_POPULATE =
  'name avatar skills preferredRole experienceLevel availability college bio github linkedin'

const formatRequest = (req) => {
  const doc = req.toObject ? req.toObject() : { ...req }
  return doc
}

/** POST /api/teams/:id/join */
export const sendJoinRequest = async (req, res) => {
  try {
    const { id } = req.params
    const { message } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid team id.' })
    }

    const team = await Team.findById(id).populate('leader', 'name')
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' })
    }

    // Cannot join your own team
    if (team.isLeader(req.user._id) || team.isMember(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already on this team.',
      })
    }

    // Closed or full teams reject new requests
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

    // Block duplicate pending request
    const existing = await JoinRequest.findOne({
      team: id,
      applicant: req.user._id,
      status: 'pending',
    })
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending request for this team.',
      })
    }

    // Block if previously accepted (already member check covers this, but belt-and-suspenders)
    const priorAccepted = await JoinRequest.findOne({
      team: id,
      applicant: req.user._id,
      status: 'accepted',
    })
    if (priorAccepted) {
      return res.status(400).json({
        success: false,
        message: 'You were already accepted to this team.',
      })
    }

    const joinRequest = await JoinRequest.create({
      team: id,
      applicant: req.user._id,
      message: String(message || '').trim(),
      status: 'pending',
    })

    const populated = await JoinRequest.findById(joinRequest._id).populate(
      'applicant',
      USER_POPULATE,
    )

    // Notify team leader
    await createNotification({
      userId: team.leader._id || team.leader,
      type: 'join_request',
      message: `${req.user.name} requested to join ${team.name}.`,
      relatedTeam: team._id,
      relatedRequest: joinRequest._id,
    })

    return res.status(201).json({
      success: true,
      message: 'Join request sent.',
      request: formatRequest(populated),
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending request for this team.',
      })
    }
    console.error('sendJoinRequest error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** GET /api/teams/:id/requests — leader only */
export const getTeamRequests = async (req, res) => {
  try {
    const { id } = req.params
    const team = await Team.findById(id)
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' })
    }
    if (!team.isLeader(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the team leader can view requests.',
      })
    }

    const status = req.query.status || 'pending'
    const requests = await JoinRequest.find({ team: id, status })
      .populate('applicant', USER_POPULATE)
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      requests: requests.map(formatRequest),
    })
  } catch (error) {
    console.error('getTeamRequests error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** PUT /api/requests/:id/accept — leader only */
export const acceptJoinRequest = async (req, res) => {
  try {
    const { id } = req.params
    const joinRequest = await JoinRequest.findById(id).populate('applicant', 'name')
    if (!joinRequest) {
      return res.status(404).json({ success: false, message: 'Request not found.' })
    }
    if (joinRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed.',
      })
    }

    const team = await Team.findById(joinRequest.team)
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' })
    }
    if (!team.isLeader(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the leader can accept requests.' })
    }

    if (team.isMember(joinRequest.applicant._id || joinRequest.applicant)) {
      joinRequest.status = 'accepted'
      await joinRequest.save()
      return res.status(400).json({
        success: false,
        message: 'Applicant is already a member.',
      })
    }

    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Team is full. Cannot accept more members.',
      })
    }

    // Add member and update request atomically
    team.members.push(joinRequest.applicant._id || joinRequest.applicant)
    team.syncStatus()
    await team.save()

    joinRequest.status = 'accepted'
    await joinRequest.save()

    // Reject other pending requests if team is now full
    if (team.status === 'full') {
      await JoinRequest.updateMany(
        { team: team._id, status: 'pending' },
        { status: 'rejected' },
      )
      await TeamPost.updateMany({ team: team._id }, { isActive: false })

      // Notify leader team is full
      await createNotification({
        userId: team.leader,
        type: 'team_full',
        message: `${team.name} is now full.`,
        relatedTeam: team._id,
      })
    }

    // Notify applicant
    await createNotification({
      userId: joinRequest.applicant._id || joinRequest.applicant,
      type: 'request_accepted',
      message: `You were accepted to ${team.name}!`,
      relatedTeam: team._id,
      relatedRequest: joinRequest._id,
    })

    const populated = await JoinRequest.findById(id).populate('applicant', USER_POPULATE)
    const updatedTeam = await Team.findById(team._id)
      .populate('leader', USER_POPULATE)
      .populate('members', USER_POPULATE)

    return res.status(200).json({
      success: true,
      message: 'Request accepted. Member added to team.',
      request: formatRequest(populated),
      team: updatedTeam,
    })
  } catch (error) {
    console.error('acceptJoinRequest error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** PUT /api/requests/:id/reject — leader only */
export const rejectJoinRequest = async (req, res) => {
  try {
    const { id } = req.params
    const joinRequest = await JoinRequest.findById(id)
    if (!joinRequest) {
      return res.status(404).json({ success: false, message: 'Request not found.' })
    }
    if (joinRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed.',
      })
    }

    const team = await Team.findById(joinRequest.team)
    if (!team?.isLeader(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the leader can reject requests.' })
    }

    joinRequest.status = 'rejected'
    await joinRequest.save()

    await createNotification({
      userId: joinRequest.applicant,
      type: 'request_rejected',
      message: `Your request to join ${team.name} was not accepted.`,
      relatedTeam: team._id,
      relatedRequest: joinRequest._id,
    })

    const populated = await JoinRequest.findById(id).populate('applicant', USER_POPULATE)

    return res.status(200).json({
      success: true,
      message: 'Request rejected.',
      request: formatRequest(populated),
    })
  } catch (error) {
    console.error('rejectJoinRequest error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/** DELETE /api/requests/:id — applicant cancels pending request */
export const cancelJoinRequest = async (req, res) => {
  try {
    const { id } = req.params
    const joinRequest = await JoinRequest.findById(id)
    if (!joinRequest) {
      return res.status(404).json({ success: false, message: 'Request not found.' })
    }
    if (String(joinRequest.applicant) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own requests.',
      })
    }
    if (joinRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be cancelled.',
      })
    }

    await JoinRequest.findByIdAndDelete(id)

    return res.status(200).json({ success: true, message: 'Request cancelled.' })
  } catch (error) {
    console.error('cancelJoinRequest error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/**
 * GET /api/users/notifications
 * PUT /api/users/notifications/read-all
 * PUT /api/users/notifications/:id/read
 */
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    })

    return res.status(200).json({ success: true, notifications, unreadCount })
  } catch (error) {
    console.error('getMyNotifications error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

export const markNotificationRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
    )
    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true })
    return res.status(200).json({ success: true })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' })
  }
}
