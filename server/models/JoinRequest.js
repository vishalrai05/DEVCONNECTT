/**
 * Phase 5 — JoinRequest model
 *
 * Why a JoinRequest collection?
 * Applicants must not join instantly — leaders review fit first. Each request
 * is pending/accepted/rejected with a message. A compound index prevents
 * duplicate pending requests from the same user to the same team.
 *
 * Flow: Join Team → POST /api/teams/:id/join → pending request
 *       Leader accepts → member pushed to Team.members → status accepted
 */

import mongoose from 'mongoose'

export const REQUEST_STATUSES = ['pending', 'accepted', 'rejected']

const joinRequestSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },

    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    message: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Message is too long'],
    },

    status: {
      type: String,
      enum: {
        values: REQUEST_STATUSES,
        message: 'Invalid request status',
      },
      default: 'pending',
    },
  },
  { timestamps: true },
)

// One pending request per applicant per team — prevents spam duplicates
joinRequestSchema.index(
  { team: 1, applicant: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  },
)

joinRequestSchema.index({ team: 1, status: 1 })
joinRequestSchema.index({ applicant: 1, status: 1 })

const JoinRequest = mongoose.model('JoinRequest', joinRequestSchema)

export default JoinRequest
