import mongoose from 'mongoose'
import Message from '../models/Message.js'
import Team from '../models/Team.js'

const MESSAGE_SENDER_SELECT = 'name avatar preferredRole'

const formatMessage = (message) => ({
  _id: message._id,
  team: message.team,
  content: message.content,
  sender: message.sender,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
})

const getMemberTeam = async (teamId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(teamId)) return null
  return Team.findOne({ _id: teamId, members: userId }).select('_id members')
}

/** GET /api/teams/:id/messages — latest messages, oldest first for display */
export const getTeamMessages = async (req, res) => {
  try {
    const { id } = req.params
    const team = await getMemberTeam(id, req.user._id)
    if (!team) {
      return res.status(403).json({ success: false, message: 'Only team members can view chat.' })
    }

    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 30))
    const before = req.query.before ? new Date(req.query.before) : null
    if (before && Number.isNaN(before.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid message cursor.' })
    }

    const filter = { team: id }
    if (before) filter.createdAt = { $lt: before }

    const rows = await Message.find(filter)
      .populate('sender', MESSAGE_SENDER_SELECT)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean()

    const hasMore = rows.length > limit
    const messages = rows.slice(0, limit).reverse().map(formatMessage)

    return res.status(200).json({
      success: true,
      messages,
      pagination: {
        hasMore,
        nextCursor: hasMore ? messages[0]?.createdAt : null,
      },
    })
  } catch (error) {
    console.error('getTeamMessages error:', error)
    return res.status(500).json({ success: false, message: 'Unable to load team chat.' })
  }
}

export { MESSAGE_SENDER_SELECT, formatMessage, getMemberTeam }
