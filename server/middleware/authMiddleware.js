/**
 * Module 6 — Authentication middleware
 *
 * Why middleware?
 * Middleware runs before route handlers. Instead of repeating "read cookie →
 * verify JWT → load user" in every protected endpoint, we do it once here
 * and attach the user to req.user for downstream handlers.
 */

import jwt from 'jsonwebtoken'
import User from '../models/User.js'

/**
 * Protect routes that require a logged-in user.
 * Expects the JWT in the HTTP-only "token" cookie set at login/register.
 */
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token

    // No cookie → not authenticated
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please log in.',
      })
    }

    // jwt.verify throws if the token is expired, tampered with, or signed with a different secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Load the latest user document; omit password even though toJSON also strips it
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. User no longer exists.',
      })
    }

    // Attach for controllers: req.user is the authenticated user
    req.user = user
    next()
  } catch {
    // Invalid/expired token → 401 (client should redirect to login)
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid or expired token.',
    })
  }
}

/**
 * Optional auth — used on public listing/detail routes.
 * If a valid cookie exists we attach req.user so cards can show bookmark state;
 * if not, we still continue (hackathons are publicly discoverable).
 */
export const optionalProtect = async (req, res, next) => {
  try {
    const token = req.cookies?.token
    if (!token) return next()

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    if (user) req.user = user
  } catch {
    // Ignore invalid cookies on public routes — treat as guest
  }
  next()
}

/**
 * Admin-only gate for create/update/delete hackathon.
 * Why separate from protect? Keeps "logged in" vs "can manage events" clear.
 */
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.',
    })
  }
  next()
}
