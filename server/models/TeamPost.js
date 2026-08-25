/**
 * Phase 5 — TeamPost (recruitment board listing)
 *
 * Why separate from Team?
 * A Team is the squad entity; a TeamPost is the public "we're hiring" card
 * on the recruitment board with role/skill/experience filters. One active post
 * per team is typical; leaders can deactivate without deleting the team.
 *
 * Data flow: createTeam also creates a TeamPost → GET /api/team-posts powers
 * the /hackathons/:id/teams board with search/filters.
 */

import mongoose from 'mongoose'
import { EXPERIENCE_LEVELS } from './User.js'

const teamPostSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },

    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: true,
    },

    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [100, 'Title is too long'],
    },

    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [800, 'Description is too long'],
    },

    requiredRole: {
      type: String,
      default: '',
      trim: true,
    },

    requiredSkills: {
      type: [String],
      default: [],
    },

    experienceLevel: {
      type: String,
      enum: {
        values: ['', ...EXPERIENCE_LEVELS],
        message: 'Invalid experience level',
      },
      default: '',
    },

    availability: {
      type: String,
      default: '',
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Soft-delete: deactivate instead of removing from DB
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

teamPostSchema.index({ hackathon: 1, isActive: 1 })
teamPostSchema.index({ team: 1 })
teamPostSchema.index({ title: 'text', description: 'text', requiredSkills: 'text' })

const TeamPost = mongoose.model('TeamPost', teamPostSchema)

export default TeamPost
