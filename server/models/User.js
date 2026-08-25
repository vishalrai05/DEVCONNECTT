/**
 * Phase 3 — User model (extended developer profile)
 *
 * Why expand the schema here?
 * Teammate matching later needs rich, structured profile data (skills, role,
 * availability). Keeping it on the User document avoids a separate Profile
 * collection for Phase 3 while still validating every field at the DB layer.
 *
 * Data flow: EditProfile form → PUT /api/users/me → this schema → MongoDB
 * → Dashboard / public Profile pages read the same document back.
 */

import mongoose from 'mongoose'

/** Allowed preferred roles — kept in sync with the Edit Profile dropdown */
export const PREFERRED_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'AI/ML Engineer',
  'UI/UX Designer',
  'Mobile Developer',
  'DevOps Engineer',
  'Blockchain Developer',
]

/** Experience segmented-control options */
export const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

/** Availability badge options — used for matching readiness later */
export const AVAILABILITY_OPTIONS = [
  'Available now',
  'Available this week',
  'Available this month',
  'Not available',
]

export const PROJECT_INTERESTS = [
  'AI / Machine Learning',
  'Web Applications',
  'Mobile Apps',
  'Cloud & DevOps',
  'Blockchain',
  'UI / UX & Design',
  'Cybersecurity',
  'IoT / Hardware',
  'Developer Tools',
  'Data Science',
]

/** Academic year options for college students */
export const YEAR_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Graduate',
  'Other',
]

const DEFAULT_AVATAR = ''

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    // bcrypt hash only — never returned in API responses
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },

    // Short intro shown on public profiles (max 300 enforced in controller/UI)
    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
    },

    college: {
      type: String,
      default: '',
      trim: true,
      maxlength: [120, 'College name is too long'],
    },

    branch: {
      type: String,
      default: '',
      trim: true,
      maxlength: [80, 'Branch name is too long'],
    },

    year: {
      type: String,
      default: '',
      trim: true,
      enum: {
        values: ['', ...YEAR_OPTIONS],
        message: 'Invalid academic year',
      },
    },

    // Chip/tag skills — capped at 20 in the controller
    skills: {
      type: [String],
      default: [],
      validate: {
        validator(arr) {
          return Array.isArray(arr) && arr.length <= 20
        },
        message: 'You can add at most 20 skills',
      },
    },

    preferredRole: {
      type: String,
      default: '',
      trim: true,
      enum: {
        values: ['', ...PREFERRED_ROLES],
        message: 'Invalid preferred role',
      },
    },

    experienceLevel: {
      type: String,
      default: '',
      trim: true,
      enum: {
        values: ['', ...EXPERIENCE_LEVELS],
        message: 'Invalid experience level',
      },
    },

    availability: {
      type: String,
      default: '',
      trim: true,
      enum: {
        values: ['', ...AVAILABILITY_OPTIONS],
        message: 'Invalid availability option',
      },
    },

    projectInterests: {
      type: [String],
      enum: PROJECT_INTERESTS,
      default: [],
      validate: {
        validator(arr) {
          return Array.isArray(arr) && arr.length <= 10
        },
        message: 'You can select at most 10 project interests',
      },
    },

    github: {
      type: String,
      default: '',
      trim: true,
    },

    linkedin: {
      type: String,
      default: '',
      trim: true,
    },

    portfolio: {
      type: String,
      default: '',
      trim: true,
    },

    // Cloudinary secure URL (or empty → UI shows initials)
    avatar: {
      type: String,
      default: DEFAULT_AVATAR,
      trim: true,
    },

    // Cloudinary public_id so we can delete the old image on replace
    avatarPublicId: {
      type: String,
      default: '',
      select: false, // internal — not needed on most reads
    },

    // Cached flag updated whenever profile fields change
    profileCompleted: {
      type: Boolean,
      default: false,
    },

    /**
     * Phase 4 — bookmarked hackathon IDs.
     * Why store on User instead of a join table?
     * Bookmark lists are per-user and relatively small; an array of refs is
     * simple to toggle ($addToSet / $pull) and populate for GET /bookmarks.
     */
    bookmarkedHackathons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hackathon',
      },
    ],

    /**
     * Role gates admin hackathon CRUD.
     * Set a user to "admin" in MongoDB (or via seed) to manage events.
     */
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  { timestamps: true },
)

/**
 * Compute whether the profile has enough signal for matching.
 * Same field list as the frontend ProfileCompletion component.
 */
userSchema.methods.recomputeProfileCompleted = function recomputeProfileCompleted() {
  const checks = [
    Boolean(this.avatar),
    Boolean(this.bio?.trim()),
    Array.isArray(this.skills) && this.skills.length > 0,
    Boolean(this.college?.trim()),
    Boolean(this.preferredRole),
    Boolean(this.availability),
    Array.isArray(this.projectInterests) && this.projectInterests.length > 0,
    Boolean(this.github?.trim()),
    Boolean(this.linkedin?.trim()),
  ]
  const filled = checks.filter(Boolean).length
  this.profileCompleted = filled === checks.length
  return this.profileCompleted
}

userSchema.methods.toJSON = function toJSON() {
  const userObject = this.toObject()
  delete userObject.password
  delete userObject.avatarPublicId
  return userObject
}

/**
 * Phase 6 — indexes for teammate discovery pre-filters.
 * Compound + single-field indexes keep recommendation pool queries fast
 * as the user collection grows (availability / role / skills scans).
 */
userSchema.index({ availability: 1, preferredRole: 1 })
userSchema.index({ profileCompleted: -1, updatedAt: -1 })
userSchema.index({ skills: 1 })

const User = mongoose.model('User', userSchema)

export default User
