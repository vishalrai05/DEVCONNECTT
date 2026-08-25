/**
 * Phase 5 — Team model
 *
 * Why a Team document?
 * Hackathon squads need shared state: leader, roster, capacity, and recruitment
 * status. One Team per squad keeps join logic and member counts in one place.
 *
 * Status auto-sync (see syncStatus):
 *   recruiting → members.length < maxMembers && not manually closed
 *   full       → members.length >= maxMembers
 *   closed     → leader closed recruitment manually
 *
 * Data flow: CreateTeam → POST /api/teams → Team + TeamPost → recruitment board
 */

import mongoose from 'mongoose'

export const TEAM_STATUSES = ['recruiting', 'full', 'closed']

/** Roles a team can recruit for — aligned with profile preferred roles */
export const TEAM_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'AI/ML Engineer',
  'UI/UX Designer',
  'Mobile Developer',
  'DevOps Engineer',
  'Blockchain Developer',
]

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      minlength: [2, 'Team name must be at least 2 characters'],
      maxlength: [60, 'Team name is too long'],
    },

    // Which hackathon this squad is competing in
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: [true, 'Hackathon is required'],
    },

    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Description is too long'],
    },

    // Creator / owner — only they can accept requests, remove members, etc.
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Roster includes the leader on create
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    maxMembers: {
      type: Number,
      required: true,
      min: [2, 'Team must allow at least 2 members'],
      max: [10, 'Team cannot exceed 10 members'],
      default: 4,
    },

    requiredRoles: {
      type: [String],
      default: [],
    },

    requiredSkills: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: {
        values: TEAM_STATUSES,
        message: 'Invalid team status',
      },
      default: 'recruiting',
    },
  },
  { timestamps: true },
)

teamSchema.index({ hackathon: 1, status: 1 })
teamSchema.index({ leader: 1 })
teamSchema.index({ name: 'text', description: 'text' })

/**
 * Recompute status from roster size vs maxMembers.
 * Called after accept/remove/close so the board stays accurate.
 */
teamSchema.methods.syncStatus = function syncStatus() {
  if (this.status === 'closed') return 'closed'
  if (this.members.length >= this.maxMembers) {
    this.status = 'full'
  } else {
    this.status = 'recruiting'
  }
  return this.status
}

teamSchema.methods.isLeader = function isLeader(userId) {
  return String(this.leader) === String(userId)
}

teamSchema.methods.isMember = function isMember(userId) {
  return this.members.some((id) => String(id) === String(userId))
}

const Team = mongoose.model('Team', teamSchema)

export default Team
