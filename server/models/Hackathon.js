/**
 * Phase 4 — Hackathon model
 *
 * Why a dedicated Hackathon collection?
 * Events are shared discovery content (search/filter/bookmark), not per-user
 * profile data. Storing them separately keeps listing queries fast and lets
 * many users bookmark the same event without duplication.
 *
 * Data flow:
 * Admin creates via POST /api/hackathons → this schema → MongoDB
 * → GET /api/hackathons (search/filter) → HackathonCard / Details pages
 */

import mongoose from 'mongoose'

export const HACKATHON_MODES = ['online', 'offline', 'hybrid']
export const HACKATHON_DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

/** Canonical domains used by filters + admin form */
export const HACKATHON_DOMAINS = [
  'Web Development',
  'AI/ML',
  'Blockchain',
  'Cybersecurity',
  'Mobile',
  'IoT',
  'Cloud',
]

const hackathonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title is too long'],
    },
    organizer: {
      type: String,
      required: [true, 'Organizer is required'],
      trim: true,
      maxlength: [100, 'Organizer name is too long'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [5000, 'Description is too long'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    mode: {
      type: String,
      required: true,
      enum: {
        values: HACKATHON_MODES,
        message: 'Mode must be online, offline, or hybrid',
      },
      lowercase: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    // Stored as a number in INR for sorting / prize-pool filters
    prizePool: {
      type: Number,
      default: 0,
      min: [0, 'Prize pool cannot be negative'],
    },
    teamSizeMin: {
      type: Number,
      default: 1,
      min: [1, 'Minimum team size must be at least 1'],
    },
    teamSizeMax: {
      type: Number,
      default: 4,
      min: [1, 'Maximum team size must be at least 1'],
    },
    domains: {
      type: [String],
      default: [],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      required: true,
      enum: {
        values: HACKATHON_DIFFICULTIES,
        message: 'Invalid difficulty',
      },
      lowercase: true,
    },
    registrationLink: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    // Featured events appear in the hero strip and sort higher when requested
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Admin (or creator) who inserted the event — useful for audit trails
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
)

// Text indexes speed up title/organizer search and deadline sorting
hackathonSchema.index({ title: 'text', organizer: 'text', description: 'text' })
hackathonSchema.index({ registrationDeadline: 1 })
hackathonSchema.index({ startDate: 1 })
hackathonSchema.index({ prizePool: -1 })
hackathonSchema.index({ isFeatured: -1, createdAt: -1 })

/**
 * Instance helper — registration still open?
 * Used by controllers and can be reused for dashboard badges.
 */
hackathonSchema.methods.isRegistrationOpen = function isRegistrationOpen() {
  return this.registrationDeadline.getTime() > Date.now()
}

const Hackathon = mongoose.model('Hackathon', hackathonSchema)

export default Hackathon
