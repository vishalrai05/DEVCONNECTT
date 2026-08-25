/**
 * Phase 3 — User / profile controllers
 *
 * Endpoints:
 *   GET  /api/users/me          — private full profile (owner)
 *   PUT  /api/users/me          — update profile fields
 *   POST /api/users/me/avatar   — upload avatar to Cloudinary
 *   GET  /api/users/:id         — public profile (no email/password)
 *
 * Why separate from authController?
 * Auth owns login/register/cookies. Profile owns editable developer data used
 * for matching later. Keeping them split keeps each module easier to reason about.
 */

import mongoose from 'mongoose'
import multer from 'multer'
import User, {
  PREFERRED_ROLES,
  EXPERIENCE_LEVELS,
  AVAILABILITY_OPTIONS,
  PROJECT_INTERESTS,
  YEAR_OPTIONS,
} from '../models/User.js'
import { uploadAvatarBuffer, deleteCloudinaryAsset } from '../config/cloudinary.js'

/** Multer keeps the file in memory so we can stream it straight to Cloudinary */
export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(req, file, cb) {
    if (!file.mimetype?.startsWith('image/')) {
      return cb(new Error('Only image files are allowed for avatars.'))
    }
    cb(null, true)
  },
})

/** Fields the owner may see (still never password) */
const formatPrivateProfile = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  bio: user.bio || '',
  college: user.college || '',
  branch: user.branch || '',
  year: user.year || '',
  skills: user.skills || [],
  preferredRole: user.preferredRole || '',
  experienceLevel: user.experienceLevel || '',
  availability: user.availability || '',
  projectInterests: user.projectInterests || [],
  github: user.github || '',
  linkedin: user.linkedin || '',
  portfolio: user.portfolio || '',
  avatar: user.avatar || '',
  profileCompleted: Boolean(user.profileCompleted),
  role: user.role || 'user',
  bookmarkedHackathons: (user.bookmarkedHackathons || []).map((id) => String(id)),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

/**
 * Public projection — never email, password, or avatarPublicId.
 * Why strip email? Public profile pages are shareable; email is PII.
 */
const formatPublicProfile = (user) => ({
  _id: user._id,
  name: user.name,
  bio: user.bio || '',
  college: user.college || '',
  branch: user.branch || '',
  year: user.year || '',
  skills: user.skills || [],
  preferredRole: user.preferredRole || '',
  experienceLevel: user.experienceLevel || '',
  availability: user.availability || '',
  projectInterests: user.projectInterests || [],
  github: user.github || '',
  linkedin: user.linkedin || '',
  portfolio: user.portfolio || '',
  avatar: user.avatar || '',
  profileCompleted: Boolean(user.profileCompleted),
  createdAt: user.createdAt,
})

/** Loose URL check — empty string allowed (optional fields) */
const isValidUrl = (value) => {
  if (!value) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const normalizeSkills = (skills) => {
  if (skills === undefined) return undefined
  if (!Array.isArray(skills)) {
    throw Object.assign(new Error('Skills must be an array of strings.'), { statusCode: 400 })
  }
  if (skills.length > 20) {
    throw Object.assign(new Error('You can add at most 20 skills.'), { statusCode: 400 })
  }

  const cleaned = []
  const seen = new Set()

  for (const raw of skills) {
    if (typeof raw !== 'string') continue
    const skill = raw.trim()
    if (!skill) continue
    const key = skill.toLowerCase()
    if (seen.has(key)) continue // prevent duplicates (case-insensitive)
    seen.add(key)
    cleaned.push(skill.slice(0, 40))
  }

  return cleaned
}

/**
 * GET /api/users/me
 * Requires protect middleware → req.user is already loaded without password.
 */
export const getMyProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: formatPrivateProfile(req.user),
    })
  } catch (error) {
    console.error('getMyProfile error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/**
 * PUT /api/users/me
 * Partial updates: only provided fields are written.
 * Validates enums/URLs before saving so bad data never reaches matching logic.
 */
export const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    const {
      name,
      bio,
      college,
      branch,
      year,
      skills,
      preferredRole,
      experienceLevel,
      availability,
      projectInterests,
      github,
      linkedin,
      portfolio,
      avatar,
    } = req.body

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters.',
        })
      }
      user.name = name.trim()
    }

    if (bio !== undefined) {
      if (typeof bio !== 'string') {
        return res.status(400).json({ success: false, message: 'Bio must be a string.' })
      }
      if (bio.length > 300) {
        return res.status(400).json({
          success: false,
          message: 'Bio cannot exceed 300 characters.',
        })
      }
      user.bio = bio.trim()
    }

    if (college !== undefined) user.college = String(college).trim()
    if (branch !== undefined) user.branch = String(branch).trim()

    if (year !== undefined) {
      const value = String(year).trim()
      if (value && !YEAR_OPTIONS.includes(value)) {
        return res.status(400).json({ success: false, message: 'Invalid academic year.' })
      }
      user.year = value
    }

    if (skills !== undefined) {
      try {
        user.skills = normalizeSkills(skills)
      } catch (err) {
        return res.status(err.statusCode || 400).json({
          success: false,
          message: err.message,
        })
      }
    }

    if (preferredRole !== undefined) {
      const value = String(preferredRole).trim()
      if (value && !PREFERRED_ROLES.includes(value)) {
        return res.status(400).json({ success: false, message: 'Invalid preferred role.' })
      }
      user.preferredRole = value
    }

    if (experienceLevel !== undefined) {
      const value = String(experienceLevel).trim()
      if (value && !EXPERIENCE_LEVELS.includes(value)) {
        return res.status(400).json({ success: false, message: 'Invalid experience level.' })
      }
      user.experienceLevel = value
    }

    if (availability !== undefined) {
      const value = String(availability).trim()
      if (value && !AVAILABILITY_OPTIONS.includes(value)) {
        return res.status(400).json({ success: false, message: 'Invalid availability option.' })
      }
      user.availability = value
    }

    if (projectInterests !== undefined) {
      if (!Array.isArray(projectInterests)) {
        return res.status(400).json({
          success: false,
          message: 'Project interests must be an array of strings.',
        })
      }
      const interests = [...new Set(projectInterests.map((interest) => String(interest).trim()))]
      if (interests.length > 10 || interests.some((interest) => !PROJECT_INTERESTS.includes(interest))) {
        return res.status(400).json({
          success: false,
          message: 'One or more project interests are invalid.',
        })
      }
      user.projectInterests = interests
    }

    if (github !== undefined) {
      const value = String(github).trim()
      if (!isValidUrl(value)) {
        return res.status(400).json({ success: false, message: 'GitHub URL is invalid.' })
      }
      user.github = value
    }

    if (linkedin !== undefined) {
      const value = String(linkedin).trim()
      if (!isValidUrl(value)) {
        return res.status(400).json({ success: false, message: 'LinkedIn URL is invalid.' })
      }
      user.linkedin = value
    }

    if (portfolio !== undefined) {
      const value = String(portfolio).trim()
      if (!isValidUrl(value)) {
        return res.status(400).json({ success: false, message: 'Portfolio URL is invalid.' })
      }
      user.portfolio = value
    }

    // Allow setting a URL directly (e.g. after client-side upload helpers)
    if (avatar !== undefined) {
      user.avatar = String(avatar).trim()
    }

    // Recalculate completion flag for Dashboard / matching readiness
    user.recomputeProfileCompleted()
    await user.save()

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: formatPrivateProfile(user),
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(' ')
      return res.status(400).json({ success: false, message })
    }

    console.error('updateMyProfile error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/**
 * POST /api/users/me/avatar
 * multipart field name: "avatar"
 *
 * Flow: multer buffer → Cloudinary upload → delete old public_id → save URL on user
 */
export const uploadMyAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please choose an image to upload.',
      })
    }

    // Need avatarPublicId (select:false) for cleanup — re-query with it
    const user = await User.findById(req.user._id).select('+avatarPublicId')
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    const result = await uploadAvatarBuffer(req.file.buffer)

    // Remove previous Cloudinary asset to avoid orphaned storage
    if (user.avatarPublicId) {
      await deleteCloudinaryAsset(user.avatarPublicId)
    }

    user.avatar = result.secure_url
    user.avatarPublicId = result.public_id
    user.recomputeProfileCompleted()
    await user.save()

    return res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully.',
      user: formatPrivateProfile(user),
      avatar: result.secure_url,
    })
  } catch (error) {
    console.error('uploadMyAvatar error:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload avatar. Check Cloudinary credentials.',
    })
  }
}

/**
 * GET /api/users/:id
 * Public — anyone can view a teammate's profile for recruiting.
 */
export const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id.' })
    }

    const user = await User.findById(id).select('-password -avatarPublicId')
    if (!user) {
      return res.status(404).json({ success: false, message: 'Profile not found.' })
    }

    return res.status(200).json({
      success: true,
      user: formatPublicProfile(user),
    })
  } catch (error) {
    console.error('getPublicProfile error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}
