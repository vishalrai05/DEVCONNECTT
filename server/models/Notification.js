/**
 * Phase 5 — In-app notifications
 *
 * Created when join requests are sent/accepted/rejected or team status changes.
 * GET /api/users/notifications returns unread items for the bell dropdown.
 */

import mongoose from 'mongoose'

export const NOTIFICATION_TYPES = [
  'join_request',
  'request_accepted',
  'request_rejected',
  'team_full',
  'recruitment_reopened',
  'team_invite', // Phase 6 — leader invited a matched developer
  'team_message', // Phase 7 — unread message while away from team chat
]

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    relatedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },

    relatedRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JoinRequest',
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

notificationSchema.index({ user: 1, read: 1, createdAt: -1 })

const Notification = mongoose.model('Notification', notificationSchema)

/**
 * Helper — fire-and-forget notification insert from controllers.
 */
export const createNotification = async ({
  userId,
  type,
  message,
  relatedTeam = null,
  relatedRequest = null,
}) => {
  try {
    await Notification.create({
      user: userId,
      type,
      message,
      relatedTeam,
      relatedRequest,
    })
  } catch (err) {
    console.error('Notification create error:', err.message)
  }
}

export default Notification
