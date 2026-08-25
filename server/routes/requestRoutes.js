/**
 * Join request routes — mounted at /api/requests
 * Team post routes — mounted at /api/team-posts (in teamPostRoutes)
 */

import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  acceptJoinRequest,
  rejectJoinRequest,
  cancelJoinRequest,
} from '../controllers/joinRequestController.js'
import { mutationLimiter } from '../middleware/securityMiddleware.js'

const router = express.Router()

router.put('/:id/accept', protect, mutationLimiter, acceptJoinRequest)
router.put('/:id/reject', protect, mutationLimiter, rejectJoinRequest)
router.delete('/:id', protect, mutationLimiter, cancelJoinRequest)

export default router
