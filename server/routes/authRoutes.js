/**
 * Auth routes — wire HTTP paths to controller functions.
 *
 * Mounted at /api/auth in server.js, so:
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   GET  /api/auth/me
 *   POST /api/auth/logout
 */

import express from 'express'
import {
  register,
  login,
  getMe,
  logout,
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'
import { authLimiter } from '../middleware/securityMiddleware.js'

const router = express.Router()

// Public — anyone can create an account or sign in
router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)

// Protected — require a valid JWT cookie (protect middleware)
router.get('/me', protect, getMe)

// Logout is public so an expired cookie can still be cleared client-side
router.post('/logout', logout)

export default router
