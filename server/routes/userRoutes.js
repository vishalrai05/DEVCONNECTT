/**
 * User / profile routes — mounted at /api/users in server.js
 *
 * GET  /api/users/me         → private profile (JWT cookie)
 * PUT  /api/users/me         → update profile fields
 * POST /api/users/me/avatar  → Cloudinary avatar upload
 * GET  /api/users/:id        → public profile
 *
 * Why register /me before /:id?
 * Express matches in order; otherwise "me" would be treated as an :id param.
 */

import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
  getPublicProfile,
  avatarUpload,
} from '../controllers/userController.js'
import { getMyBookmarks } from '../controllers/hackathonController.js'
import { getMyTeams } from '../controllers/teamController.js'
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/joinRequestController.js'

const router = express.Router()

router.get('/me', protect, getMyProfile)
router.put('/me', protect, updateMyProfile)
router.post(
  '/me/avatar',
  protect,
  // Multer error → friendly 400 instead of crashing the request
  (req, res, next) => {
    avatarUpload.single('avatar')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Invalid image upload.',
        })
      }
      next()
    })
  },
  uploadMyAvatar,
)

// Phase 4 — bookmarked hackathons for the logged-in user
router.get('/bookmarks', protect, getMyBookmarks)

// Phase 5 — teams dashboard + notifications
router.get('/teams', protect, getMyTeams)
router.get('/notifications', protect, getMyNotifications)
router.put('/notifications/read-all', protect, markAllNotificationsRead)
router.put('/notifications/:id/read', protect, markNotificationRead)

router.get('/:id', getPublicProfile)

export default router
