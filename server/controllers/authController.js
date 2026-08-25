/**
 * Auth controllers — Modules 3, 4, and 7
 *
 * Controllers contain the business logic for each auth endpoint.
 * Routes stay thin: they map HTTP methods/paths to these functions.
 */

import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import {
  generateToken,
  setAuthCookie,
  clearAuthCookie,
} from '../utils/generateToken.js'

/**
 * Shape a safe user object for API responses.
 * Never include password — even hashed values should not leave the server.
 */
/** Keep auth responses aligned with the Phase 3 profile shape (still no password). */
const formatUserResponse = (user) => ({
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
  github: user.github || '',
  linkedin: user.linkedin || '',
  portfolio: user.portfolio || '',
  avatar: user.avatar || '',
  profileCompleted: Boolean(user.profileCompleted),
  role: user.role || 'user',
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

/**
 * Module 3 — POST /api/auth/register
 *
 * Flow: validate → check duplicate email → hash password → create user →
 * issue JWT cookie → return user (without password).
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    // ---- Input validation ----
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      })
    }

    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters.',
      })
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      })
    }

    const normalizedEmail = String(email).toLowerCase().trim()

    // ---- Duplicate check ----
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      // 409 Conflict — resource already exists
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    // ---- Hash password ----
    // Why bcrypt? It is deliberately slow (salted + cost factor), which makes
    // offline brute-force attacks expensive even if the DB is leaked.
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)

    // ---- Create user ----
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    })

    // ---- Issue JWT + HTTP-only cookie ----
    const token = generateToken(user._id)
    setAuthCookie(res, token)

    // 201 Created — new resource was successfully stored
    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: formatUserResponse(user),
    })
  } catch (error) {
    // Mongoose validation errors (schema match, minlength, etc.)
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(' ')
      return res.status(400).json({ success: false, message })
    }

    // Race condition: two simultaneous registers with same email
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    console.error('Register error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/**
 * Module 4 — POST /api/auth/login
 *
 * Flow: find user by email → compare password → JWT cookie → return user.
 * Use a generic "invalid credentials" message so attackers cannot tell
 * whether the email or password was wrong (user enumeration defense).
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      })
    }

    const normalizedEmail = String(email).toLowerCase().trim()
    const user = await User.findOne({ email: normalizedEmail })

    // Same error for missing user and wrong password
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    // bcrypt.compare hashes the candidate with the stored salt and checks equality
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    const token = generateToken(user._id)
    setAuthCookie(res, token)

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      user: formatUserResponse(user),
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/**
 * Module 7 — GET /api/auth/me
 *
 * Returns the currently authenticated user.
 * Relies on protect middleware to populate req.user from the cookie JWT.
 * Used by AuthContext on app load to restore the session without re-login.
 */
export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: formatUserResponse(req.user),
    })
  } catch (error) {
    console.error('GetMe error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}

/**
 * Module 7 — POST /api/auth/logout
 *
 * Clears the auth cookie. JWT itself cannot be revoked without a denylist,
 * so short expiry + cookie clear is the standard approach for this stack.
 */
export const logout = async (req, res) => {
  try {
    clearAuthCookie(res)

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    })
  }
}
